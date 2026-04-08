'use server';

/**
 * @file actions.ts
 * @description Capa de Servicios Backend (Server Actions) para el Módulo de Asistencia.
 * Implementa validaciones de reglas de negocio, transacciones atómicas y manejo de concurrencia.
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AttendanceStatus } from '@prisma/client';

// ============================================================================
// INTERFACES Y DTOs (Data Transfer Objects)
// ============================================================================

export interface AttendanceRecordDTO {
  id: string;
  estado: AttendanceStatus | null;
  nota: string;
}

// ============================================================================
// 1. OBTENCIÓN DE CATÁLOGO DE CURSOS
// ============================================================================

/**
 * Retorna los cursos disponibles según el vector de autorización del usuario.
 * @param {string} userEmail - Correo del usuario autenticado.
 * @param {string} role - Rol institucional del usuario.
 * @returns {Promise<Array>} Colección de cursos autorizados.
 */
export async function getMyCourses(userEmail: string, role: string) {
  try {
    if (role === 'DIRECTOR' || role === 'SECRETARIA') {
      return await prisma.course.findMany({ 
        orderBy: { name: 'asc' } 
      });
    } else {
      const teacher = await prisma.user.findUnique({
        where: { email: userEmail },
        include: { subjects: { include: { course: true } } }
      });
      
      if (!teacher) return [];

      // Filtro algorítmico para extraer cursos únicos a partir de las asignaturas
      const uniqueCourses = new Map();
      teacher.subjects.forEach(sub => {
         if (sub.course && !uniqueCourses.has(sub.course.id)) {
             uniqueCourses.set(sub.course.id, sub.course);
         }
      });
      
      return Array.from(uniqueCourses.values());
    }
  } catch (error) {
    console.error("[Capa de Datos] Excepción en getMyCourses:", error);
    return [];
  }
}

// ============================================================================
// 2. RECUPERACIÓN DE EXPEDIENTES Y ESTADO DIARIO
// ============================================================================

/**
 * Obtiene la matrícula de un curso específico y mapea su estado de asistencia para una fecha dada.
 * @param {string} courseId - Identificador único del curso.
 * @param {string} dateStr - Fecha de consulta en formato ISO (YYYY-MM-DD).
 * @returns {Promise<Array>} Lista de estudiantes con su estado actual.
 */
export async function getCourseStudents(courseId: string, dateStr: string) {
  try {
    // Normalización de la franja horaria para evitar colisiones UTC
    const targetDate = new Date(`${dateStr}T12:00:00.000Z`);
    const startOfDay = new Date(targetDate); 
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate); 
    endOfDay.setUTCHours(23, 59, 59, 999);

    const students = await prisma.student.findMany({
      where: { 
        courseId,
        estatus: 'ACTIVO',
        isDeleted: false
      },
      orderBy: { apellido: 'asc' },
      include: {
        attendance: {
          where: { 
            date: { gte: startOfDay, lte: endOfDay } 
          }
        }
      }
    });

    return students.map(s => {
      const record = s.attendance[0]; 
      return {
        id: s.id,
        nombre: `${s.nombre} ${s.apellido}`.trim(),
        matricula: s.matricula,
        foto: `${s.nombre.charAt(0)}${s.apellido ? s.apellido.charAt(0) : ''}`.toUpperCase(),
        estado: record ? record.status : null, 
        nota: record ? record.note : ''
      };
    });

  } catch (error) {
    console.error("[Capa de Datos] Excepción en getCourseStudents:", error);
    return [];
  }
}

// ============================================================================
// 3. PROCESAMIENTO Y PERSISTENCIA DE ASISTENCIA (TRANSACCIÓN ACID)
// ============================================================================

/**
 * Registra o actualiza la asistencia de un bloque de estudiantes de manera atómica.
 * Implementa validación de reglas de negocio para días no laborables.
 * * @param {string} courseId - Identificador del curso.
 * @param {string} dateStr - Fecha del registro (YYYY-MM-DD).
 * @param {AttendanceRecordDTO[]} attendanceData - Arreglo con los estados a persistir.
 * @param {string} userRole - Rol de quien ejecuta la acción (Opcional, para validación estricta).
 */
export async function saveAttendance(
    courseId: string, 
    dateStr: string, 
    attendanceData: AttendanceRecordDTO[],
    userRole: string = 'DOCENTE' // Default estricto por seguridad
) {
  try {
    // 1. Validación de Regla de Negocio (Defensa en Profundidad)
    const [year, month, day] = dateStr.split('-');
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    const dayOfWeek = localDate.getDay();
    
    if (userRole === 'DOCENTE' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return { 
        success: false, 
        message: 'Violación de regla de negocio: Los docentes no están autorizados a registrar asistencia en fines de semana.' 
      };
    }

    // 2. Configuración de límites de tiempo
    const targetDate = new Date(`${dateStr}T12:00:00.000Z`);
    const startOfDay = new Date(targetDate); 
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate); 
    endOfDay.setUTCHours(23, 59, 59, 999);

    const studentIds = attendanceData.map(s => s.id);

    // 3. Bloque Transaccional (Todo o Nada)
    await prisma.$transaction(async (tx) => {
        
        // Limpieza del bloque anterior para evitar duplicidad de registros (Idempotencia)
        await tx.attendance.deleteMany({
            where: {
                studentId: { in: studentIds },
                date: { gte: startOfDay, lte: endOfDay }
            }
        });

        // Mapeo estructural de la nueva data. 
        // Si el estado es null desde el cliente, se asume PRESENTE por defecto funcional.
        const dataToInsert = attendanceData.map(record => ({
            studentId: record.id,
            date: targetDate,
            status: record.estado || AttendanceStatus.PRESENTE,
            note: record.nota || ''
        }));

        // Inserción masiva optimizada
        await tx.attendance.createMany({
            data: dataToInsert
        });
    });

    revalidatePath('/dashboard/asistencia');
    return { success: true };
    
  } catch (error) {
    console.error("[Arquitectura] Fallo crítico en transacción saveAttendance:", error);
    return { 
      success: false, 
      message: 'Excepción interna al intentar persistir los registros de asistencia en la base de datos.' 
    };
  }
}