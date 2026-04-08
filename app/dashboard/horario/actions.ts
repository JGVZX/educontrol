'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene los datos del horario filtrados por rol.
 */
export async function getScheduleData(email: string, role: string) {
  try {
    // 1. Tipado estricto sin usar 'any' (Buenas prácticas de TS)
    const whereClause: Prisma.ScheduleWhereInput = {};

    // Si es docente, filtramos para que solo vea sus propias clases
    if (role === 'DOCENTE') {
      whereClause.teacher = { email };
    }

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        subject: true,
        course: true, // Esto nos trae tanto el nombre como la sección desde la BD
        teacher: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' }
      ]
    });

    // 2. Mapeo senior para enviar datos limpios al cliente
    return schedules.map(s => ({
      id: s.id,
      day: s.day,
      period: Number(s.period),
      subjectName: s.subject.name,
      // ¡AQUÍ ESTÁ LA MAGIA!: Unimos el nombre del curso + su sección (Ej: "4to Gastronomía A")
      courseName: `${s.course.name} ${s.course.section || ''}`.trim(),
      isTechnical: s.subject.isTechnical,
      teacherName: `${s.teacher?.nombre || ''} ${s.teacher?.apellido || ''}`.trim()
    }));
  } catch (error) {
    console.error("Error en getScheduleData:", error);
    return [];
  }
}

/**
 * Elimina un bloque de horario (Exclusivo Directivos/Secretaría).
 */
export async function deleteScheduleBlock(id: string) {
  try {
    await prisma.schedule.delete({ where: { id } });
    revalidatePath('/dashboard/horario');
    return { success: true };
  } catch (error) {
    return { error: "No se pudo eliminar el bloque." };
  }
}