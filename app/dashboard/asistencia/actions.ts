'use server';

/**
 * @file actions.ts
 * @description Capa de Servicios Backend para el Módulo de Asistencia Pro.
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AttendanceStatus } from '@prisma/client';

export interface AttendanceRecordDTO {
  id: string;
  estado: AttendanceStatus | null;
  nota: string;
}

// ============================================================================
// 1. OBTENER CURSOS Y ASIGNATURAS (FILTRADO POR ROL DOCENTE)
// ============================================================================
export async function getMyCourses(userEmail: string, role: string) {
  try {
    // Si es directivo o admin, ve TODO el colegio
    if (role === 'DIRECTOR' || role === 'SECRETARIA' || role === 'ADMIN_SISTEMA') {
      return await prisma.course.findMany({ 
        orderBy: { name: 'asc' },
        include: { subjects: { orderBy: { name: 'asc' } } }
      });
    } 
    
    // Si es DOCENTE, filtramos estrictamente SUS asignaturas y SUS cursos
    if (role === 'DOCENTE') {
      const teacher = await prisma.user.findUnique({
        where: { email: userEmail },
        include: { 
          subjects: { 
            include: { course: true } 
          } 
        }
      });
      
      if (!teacher || !teacher.subjects) return [];

      // Mapeo Inteligente: Agrupamos las asignaturas del docente dentro de sus respectivos cursos
      const courseMap = new Map();
      
      teacher.subjects.forEach(subject => {
         if (subject.course) {
             const courseId = subject.course.id;
             // Si el curso aún no está en el mapa, lo agregamos vacío
             if (!courseMap.has(courseId)) {
                 courseMap.set(courseId, { 
                    id: subject.course.id, 
                    name: subject.course.name, 
                    subjects: [] // Aquí guardaremos SOLO las asignaturas de este profesor
                 });
             }
             // Insertamos la asignatura que el profesor imparte en este curso
             courseMap.get(courseId).subjects.push({
                 id: subject.id,
                 name: subject.name
             });
         }
      });
      
      // Retornamos el array de cursos ordenado alfabéticamente
      return Array.from(courseMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    return [];

  } catch (error) {
    console.error("[Backend] Error en getMyCourses:", error);
    return [];
  }
}

// ============================================================================
// 2. RECUPERAR ESTUDIANTES Y ASISTENCIA POR ASIGNATURA
// ============================================================================
export async function getCourseStudents(courseId: string, subjectId: string, dateStr: string) {
  try {
    const targetDate = new Date(`${dateStr}T12:00:00.000Z`);
    const startOfDay = new Date(targetDate); startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setUTCHours(23, 59, 59, 999);

    const students = await prisma.student.findMany({
      where: { 
        courseId,
        estatus: 'ACTIVO',
        isDeleted: false
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ],
      include: {
        // Buscamos si ya pasaron lista PARA ESTA ASIGNATURA en este día
        attendance: {
          where: { 
            date: { gte: startOfDay, lte: endOfDay },
            subjectId: subjectId // IMPORTANTE: Filtro por Asignatura
          }
        }
      }
    });

    return students.map(s => {
      const record = s.attendance[0]; 
      return {
        id: s.id,
        nombre: s.nombre,
        apellido: s.apellido,
        rne: s.rne,
        folio: s.folio,
        fotoUrl: s.fotoUrl,
        estado: record ? record.status : null, 
        nota: record ? record.note : ''
      };
    });

  } catch (error) {
    console.error("[Backend] Error en getCourseStudents:", error);
    return [];
  }
}

// ============================================================================
// 3. GUARDAR ASISTENCIA ENLAZADA A LA ASIGNATURA
// ============================================================================
export async function saveAttendance(
    courseId: string, 
    subjectId: string,
    dateStr: string, 
    attendanceData: AttendanceRecordDTO[],
    userRole: string
) {
  try {
    const [year, month, day] = dateStr.split('-');
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    const dayOfWeek = localDate.getDay();
    
    if (userRole === 'DOCENTE' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return { success: false, message: 'Los docentes no pueden registrar asistencia fines de semana.' };
    }

    const targetDate = new Date(`${dateStr}T12:00:00.000Z`);
    const startOfDay = new Date(targetDate); startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setUTCHours(23, 59, 59, 999);

    const studentIds = attendanceData.map(s => s.id);

    await prisma.$transaction(async (tx) => {
        // Borramos los registros anteriores DE ESA ASIGNATURA en esa fecha
        await tx.attendance.deleteMany({
            where: {
                studentId: { in: studentIds },
                subjectId: subjectId,
                date: { gte: startOfDay, lte: endOfDay }
            }
        });

        // Preparamos los nuevos registros inyectando el subjectId
        const dataToInsert = attendanceData.map(record => ({
            studentId: record.id,
            subjectId: subjectId, // Enlace directo a la materia (Ej: Ciencias Sociales)
            date: targetDate,
            status: record.estado || AttendanceStatus.PRESENTE,
            note: record.nota || ''
        }));

        await tx.attendance.createMany({
            data: dataToInsert
        });
    });

    revalidatePath('/dashboard/asistencia');
    return { success: true };
    
  } catch (error) {
    console.error("[Backend] Fallo en saveAttendance:", error);
    return { success: false, message: 'Error interno de base de datos.' };
  }
}