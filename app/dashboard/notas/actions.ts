'use server';

/**
 * @file actions.ts
 * @description Capa de Servicios Backend (Server Actions) para el Cuaderno de Calificaciones Elite.
 * Soporta Historial MINERD, Promedios en Tiempo Real y Auditoría de Calificaciones.
 * @author Jose Junior Guzmán Veloz
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { GradeStatus } from '@prisma/client';

const CURRENT_SCHOOL_YEAR = "2025-2026"; 

// ============================================================================
// INTERFACES Y DTOs
// ============================================================================

export interface GradePayloadDTO {
  disciplina?: number | null;
  tarea?: number | null;
  practica?: number | null;
  teoria?: number | null;
  examenFinal?: number | null;
  isLocked?: boolean;
}

// ============================================================================
// 1. EXTRACCIÓN DEL CATÁLOGO DE MATERIAS
// ============================================================================

export async function getSubjects(userEmail: string, role: string) {
  try {
    let whereClause: any = {};

    if (role === 'DOCENTE') {
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (user) whereClause.teacherId = user.id;
    } 

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: { course: true },
      orderBy: { name: 'asc' }
    });

    return subjects.map(s => ({
      id: s.id,
      name: s.name,
      courseId: s.courseId,
      courseName: s.course.name,
      type: s.isTechnical ? 'TECNICA' : 'ACADEMICA',
      teacherId: s.teacherId,
    }));
  } catch (error) {
    console.error("[Capa de Datos] Excepción en getSubjects:", error);
    return [];
  }
}

// ============================================================================
// 2. RECUPERACIÓN DEL HISTORIAL COMPLETO (RÉCORD ACUMULATIVO)
// ============================================================================

export async function getStudentGrades(subjectId: string) {
  try {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if(!subject) return [];

    const students = await prisma.student.findMany({
      where: { 
        courseId: subject.courseId,
        estatus: 'ACTIVO',
        isDeleted: false 
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ],
      include: {
        grades: { 
          // Extraemos TODAS las calificaciones de ese año para el Récord Anual
          where: { subjectId, year: CURRENT_SCHOOL_YEAR } 
        }
      }
    });

    // Mapeo Estricto al DTO del Frontend Elite
    return students.map(s => ({
        id: s.id,
        nombre: s.nombre,
        apellido: s.apellido,
        rne: s.rne,
        folio: s.folio,
        fotoUrl: s.fotoUrl,
        grades: s.grades || [] 
    }));

  } catch (error) {
    console.error("[Capa de Datos] Error en lectura de calificaciones:", error);
    return [];
  }
}

// ============================================================================
// 3. PROCESAMIENTO Y PERSISTENCIA MENSUAL (CON DEFENSA DE AUDITORÍA)
// ============================================================================

export async function saveStudentGrade(
    studentId: string, 
    subjectId: string, 
    data: GradePayloadDTO, 
    mes: string, 
    userRole: string = 'DOCENTE'
) {
  try {
    // Permisos Directivos
    const isDirectivo = ['DIRECTOR', 'SECRETARIA', 'ADMIN_SISTEMA'].includes(userRole);

    // 1. Defensa en Servidor (Auditoría específica del mes)
    const existingGrade = await prisma.grade.findUnique({
        where: { studentId_subjectId_year_mes: { studentId, subjectId, year: CURRENT_SCHOOL_YEAR, mes } }
    });

    if (existingGrade?.isLocked && !isDirectivo) {
        return { success: false, message: `Auditoría Cerrada: El registro de ${mes} no admite modificaciones.` };
    }

    const targetLockState = isDirectivo && data.isLocked !== undefined 
        ? data.isLocked 
        : (existingGrade?.isLocked || false);

    // 2. Procesamiento Unificado de la Rúbrica (Escala MINERD 100pts)
    const fields = ['disciplina', 'tarea', 'practica', 'teoria', 'examenFinal'] as const;
    const isUnscored = fields.every(f => data[f] === null || data[f] === undefined);

    let finalCalc: number | null = null;
    let statusCalc: GradeStatus = GradeStatus.EN_CURSO;

    if (!isUnscored) {
        finalCalc = (data.disciplina || 0) + (data.tarea || 0) + (data.practica || 0) + (data.teoria || 0) + (data.examenFinal || 0);
        statusCalc = finalCalc >= 70 ? GradeStatus.APROBADO : GradeStatus.REPROBADO;
    }

    const payload = {
        disciplina: data.disciplina ?? null,
        tarea: data.tarea ?? null,
        practica: data.practica ?? null,
        teoria: data.teoria ?? null,
        examenFinal: data.examenFinal ?? null,
        final: finalCalc,
        status: statusCalc,
        isLocked: targetLockState
    };

    // 3. Upsert utilizando la clave única compuesta
    await prisma.grade.upsert({
        where: {
            studentId_subjectId_year_mes: { studentId, subjectId, year: CURRENT_SCHOOL_YEAR, mes } 
        },
        create: {
            studentId, subjectId, year: CURRENT_SCHOOL_YEAR, mes,
            ...payload
        },
        update: payload
    });

    // 4. Invocamos el recálculo del Promedio General al guardar
    await recalculateStudentAverage(studentId);

    revalidatePath('/dashboard/calificaciones');
    return { success: true };
  } catch (error: any) {
    console.error("[Arquitectura] Fallo transaccional en saveStudentGrade:", error.message);
    return { success: false, message: 'Excepción al intentar consolidar la evaluación en la base de datos.' };
  }
}

// ============================================================================
// 4. CONTROL DE AUDITORÍA DIRECTIVA (BLOQUEO / DESBLOQUEO)
// ============================================================================

export async function toggleGradeLock(studentId: string, subjectId: string, mes: string, isLocked: boolean) {
    try {
        // Upsert permite bloquear un mes incluso si el docente aún no ha puesto notas
        await prisma.grade.upsert({
            where: {
                studentId_subjectId_year_mes: { studentId, subjectId, year: CURRENT_SCHOOL_YEAR, mes }
            },
            create: {
                studentId, subjectId, year: CURRENT_SCHOOL_YEAR, mes,
                isLocked,
                status: GradeStatus.EN_CURSO
            },
            update: {
                isLocked
            }
        });

        revalidatePath('/dashboard/calificaciones');
        return { success: true };
    } catch (error: any) {
        console.error("[Seguridad] Fallo al alternar estado de auditoría:", error.message);
        return { success: false, message: 'No se pudo actualizar el estado de la auditoría en la base de datos.' };
    }
}

// ============================================================================
// 5. MOTOR DE RECALCULO DE ÍNDICE ACUMULADO
// ============================================================================

/**
 * @description Mantiene actualizado el índice de rendimiento acumulado.
 * Se alimenta de todas las notas mensuales procesadas para generar el Promedio General.
 */
async function recalculateStudentAverage(studentId: string) {
    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                // Solo contabilizamos los meses que ya fueron calificados
                grades: { where: { year: CURRENT_SCHOOL_YEAR, final: { not: null } } }
            }
        });

        if (!student || student.grades.length === 0) return;

        let totalSum = 0;
        
        student.grades.forEach((g: any) => {
            totalSum += g.final;
        });

        const finalAverage = Math.round(totalSum / student.grades.length);

        await prisma.student.update({
            where: { id: studentId },
            data: { promedio: finalAverage }
        });
    } catch (e) {
        console.error("[Capa de Datos] Advertencia: Fallo al recalcular promedio general:", e);
    }
}