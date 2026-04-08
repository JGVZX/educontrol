'use server';

/**
 * @file actions.ts
 * @module ExpedienteDataLayer
 * @description Capa de acceso a datos (DAL) y lógica de negocio para la gestión de expedientes.
 * Implementa algoritmos de agregación matemática para el cálculo ponderado de calificaciones
 * mensuales y RA (Modalidad Académica y Técnica) adaptado al currículo MINERD.
 * @author Jose Junior Guzmán Veloz
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// 1. MOTOR DE EXTRACCIÓN Y CÁLCULO DE EXPEDIENTES (GET)
// ============================================================================

export async function getStudentFullProfile(studentId: string) {
  try {
    // 1. Consulta Estructural Completa (Deep Fetching)
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        // AQUÍ ESTÁ LA MAGIA: Extraemos el curso CON TODAS SUS ASIGNATURAS
        course: {
          include: {
            subjects: true 
          }
        },
        attendance: {
          orderBy: { date: 'desc' }
        },
        grades: { 
          include: { subject: true },
          orderBy: { year: 'desc' } 
        },
        raScores: { 
          include: { ra: { include: { subject: true } } } 
        },
        observaciones: {
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!student || student.isDeleted) return null;

    // ========================================================================
    // MÓDULO A: Inferencia Estadística de Asistencia
    // ========================================================================
    const totalDays = student.attendance.length;
    const presentDays = student.attendance.filter(a => a.status === 'PRESENTE').length;
    const absentDays = student.attendance.filter(a => a.status === 'AUSENTE').length;
    const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // ========================================================================
    // MÓDULO B: Algoritmo de Agregación de Calificaciones Acumuladas
    // ========================================================================
    
    const periodData = {
      p1: { sum: 0, count: 0 },
      p2: { sum: 0, count: 0 },
      p3: { sum: 0, count: 0 },
      p4: { sum: 0, count: 0 }
    };

    let totalGlobalSum = 0;
    let validSubjectCount = 0;
    const formattedAcademicHistory: any[] = [];

    // --- B.1 PRE-CARGA DE LA MALLA CURRICULAR COMPLETA ---
    const allSubjectsMap = new Map<string, any>();

    if (student.course && student.course.subjects) {
      student.course.subjects.forEach(subj => {
        allSubjectsMap.set(subj.id, {
          id: subj.id,
          subject: subj.name,
          tipo: subj.isTechnical ? 'TECNICA' : 'GENERAL',
          isTechnical: subj.isTechnical,
          mesesAcumulados: {}, // Guardará las notas mensuales
          sumaNotas: 0,
          conteoNotas: 0,
          totalRaScore: 0 // Guardará las notas de RA técnicos
        });
      });
    }

    // --- B.2 Inyección de Calificaciones Mensuales (Malla General) ---
    student.grades.forEach(grade => {
      const subjId = grade.subject.id;
      
      // Si la materia fue borrada del curso pero tiene notas viejas, la agregamos al mapa
      if (!allSubjectsMap.has(subjId)) {
        allSubjectsMap.set(subjId, {
          id: subjId,
          subject: grade.subject.name,
          tipo: grade.subject.isTechnical ? 'TECNICA' : 'GENERAL',
          isTechnical: grade.subject.isTechnical,
          mesesAcumulados: {},
          sumaNotas: 0,
          conteoNotas: 0,
          totalRaScore: 0
        });
      }

      const subjGroup = allSubjectsMap.get(subjId);
      
      const mesKey = grade.mes ? grade.mes.toLowerCase().substring(0, 3) : null;
      const notaFinalMes = grade.final;

      if (mesKey && notaFinalMes !== null && notaFinalMes > 0) {
        subjGroup.mesesAcumulados[mesKey] = notaFinalMes;
        subjGroup.sumaNotas += notaFinalMes;
        subjGroup.conteoNotas++;

        // Alimentamos el Histograma Analítico
        if (mesKey === 'oct') { periodData.p1.sum += notaFinalMes; periodData.p1.count++; }
        else if (mesKey === 'dic') { periodData.p2.sum += notaFinalMes; periodData.p2.count++; }
        else if (mesKey === 'mar') { periodData.p3.sum += notaFinalMes; periodData.p3.count++; }
        else if (mesKey === 'may') { periodData.p4.sum += notaFinalMes; periodData.p4.count++; }
      }
    });

    // --- B.3 Inyección de Calificaciones Técnicas (RA) ---
    student.raScores.forEach(score => {
      const subjId = score.ra.subject.id;
      
      if (!allSubjectsMap.has(subjId)) {
        allSubjectsMap.set(subjId, {
          id: subjId,
          subject: score.ra.subject.name,
          tipo: 'TECNICA',
          isTechnical: true,
          mesesAcumulados: {},
          sumaNotas: 0,
          conteoNotas: 0,
          totalRaScore: 0
        });
      }
      
      const current = allSubjectsMap.get(subjId);
      const weightedScore = score.score * (score.ra.weight / 100);
      current.totalRaScore += weightedScore;
    });

    // --- B.4 Ensamblaje Final de la Sábana Curricular ---
    allSubjectsMap.forEach(group => {
      let finalScore = 0;

      // Calculamos la nota final dependiendo de si es técnica o general
      if (group.isTechnical) {
        finalScore = Math.round(group.totalRaScore);
      } else {
        finalScore = group.conteoNotas > 0 ? Math.round(group.sumaNotas / group.conteoNotas) : 0;
      }
      
      if (finalScore > 0) {
        totalGlobalSum += finalScore;
        validSubjectCount++;
      }

      // Empujamos TODAS las materias a la tabla (incluso las vacías)
      formattedAcademicHistory.push({
        id: group.id,
        subject: group.subject,
        tipo: group.tipo,
        ...group.mesesAcumulados, // Esto despliega los meses si los hay
        final: finalScore > 0 ? finalScore : '-' // Si está vacía, manda el guion
      });
    });

    // ========================================================================
    // MÓDULO C: Ensamblaje del DTO Final
    // ========================================================================
    const finalAverage = validSubjectCount > 0 ? Math.round(totalGlobalSum / validSubjectCount) : 0;

    return {
      ...student,
      promedio: finalAverage,
      stats: {
        attendancePct,
        average: finalAverage,
        subjects: validSubjectCount,
        absences: absentDays,
        periodHistory: [
          { p: 'P1 (Oct)', v: periodData.p1.count > 0 ? Math.round(periodData.p1.sum / periodData.p1.count) : 0 },
          { p: 'P2 (Dic)', v: periodData.p2.count > 0 ? Math.round(periodData.p2.sum / periodData.p2.count) : 0 },
          { p: 'P3 (Mar)', v: periodData.p3.count > 0 ? Math.round(periodData.p3.sum / periodData.p3.count) : 0 },
          { p: 'P4 (May)', v: periodData.p4.count > 0 ? Math.round(periodData.p4.sum / periodData.p4.count) : 0 }
        ]
      },
      academicHistory: formattedAcademicHistory
    };

  } catch (error) {
    console.error("[Capa de Datos] Fallo crítico al procesar el perfil estudiantil:", error);
    return null;
  }
}

// ============================================================================
// 2. MOTOR DE MUTACIÓN (UPSERT / SAVE)
// ============================================================================

export async function saveStudent(data: any, isEdit: boolean = false) {
  try {
    if (isEdit && data.id) {
      await prisma.student.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          matricula: data.matricula,
          nacionalidad: data.nacionalidad,
          fechaNacimiento: data.fechaNacimiento,
          genero: data.genero,
          direccion: data.direccion,
          tipoSangre: data.tipoSangre,
          alergias: data.alergias,
          tutorNombre: data.tutorNombre,
          tutorParentesco: data.tutorParentesco,
          tutorTelefono: data.tutorTelefono,
          tutorCorreo: data.tutorCorreo,
          courseId: data.courseId === "" ? null : data.courseId,
          estatus: data.estatus || 'ACTIVO',
        }
      });
      return { success: true };
    } else {
      await prisma.student.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          matricula: data.matricula,
          nacionalidad: data.nacionalidad || 'Dominicana',
          fechaNacimiento: data.fechaNacimiento,
          genero: data.genero || 'M',
          direccion: data.direccion,
          tipoSangre: data.tipoSangre,
          alergias: data.alergias,
          tutorNombre: data.tutorNombre,
          tutorParentesco: data.tutorParentesco,
          tutorTelefono: data.tutorTelefono,
          tutorCorreo: data.tutorCorreo,
          courseId: data.courseId === "" ? null : data.courseId,
          estatus: 'ACTIVO',
        }
      });
      return { success: true };
    }
  } catch (error: any) {
    console.error("[Disaster Recovery] Fallo en la transacción de guardado:", error);
    
    if (error?.code === 'P2002') {
      return { success: false, error: "Violación de Integridad: La matrícula ingresada ya existe en el sistema." };
    }
    
    return { success: false, error: "Error interno del servidor. Verifique los logs." };
  }
}

// ============================================================================
// 3. RUTINAS AUXILIARES (HELPERS)
// ============================================================================

export async function getCourses() {
  try {
    return await prisma.course.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, section: true, type: true }
    });
  } catch (error) {
    console.error("[Catálogo] Error al recuperar la malla de cursos:", error);
    return [];
  }
}