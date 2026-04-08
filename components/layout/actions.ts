'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface SearchResults {
  estudiantes: { id: string; nombre: string; matricula: string }[];
  cursos: { id: string; nombre: string; tipo: string }[];
}

export async function searchGlobalDirectory(query: string, role: string, userEmail: string): Promise<SearchResults> {
  try {
    if (!query || query.trim().length < 2) {
      return { estudiantes: [], cursos: [] };
    }

    const searchTerm = query.trim();

    // 1. CONSTRUIR CLÁUSULA WHERE PARA ESTUDIANTES
    const studentWhereClause: Prisma.StudentWhereInput = {
      isDeleted: false,
      OR: [
        { nombre: { contains: searchTerm, mode: 'insensitive' } },
        { apellido: { contains: searchTerm, mode: 'insensitive' } },
        { matricula: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    // 2. CONSTRUIR CLÁUSULA WHERE PARA CURSOS
    const courseWhereClause: Prisma.CourseWhereInput = {
      name: { contains: searchTerm, mode: 'insensitive' }
    };

    // 3. REGLA DE AISLAMIENTO: SEGURIDAD RBAC (Tenant Isolation)
    if (role === 'DOCENTE' && userEmail) {
      // El docente solo ve estudiantes de los cursos donde imparte materias
      studentWhereClause.course = {
        subjects: {
          some: { teacher: { email: userEmail } }
        }
      };

      // El docente solo ve los cursos donde imparte materias
      courseWhereClause.subjects = {
        some: { teacher: { email: userEmail } }
      };
    }

    // 4. EJECUCIÓN CONCURRENTE A LA BASE DE DATOS
    const [studentsRaw, coursesRaw] = await Promise.all([
      prisma.student.findMany({
        where: studentWhereClause,
        take: 5, // Límite de resultados rápidos
        select: { id: true, nombre: true, apellido: true, matricula: true }
      }),
      prisma.course.findMany({
        where: courseWhereClause,
        take: 3, // Límite de resultados rápidos
        select: { id: true, name: true, section: true }
      })
    ]);

    // 5. FORMATEO DE SALIDA (Data Transfer Object)
    return {
      estudiantes: studentsRaw.map(s => ({
        id: s.id,
        nombre: `${s.nombre} ${s.apellido}`,
        matricula: s.matricula
      })),
      cursos: coursesRaw.map(c => ({
        id: c.id,
        nombre: `${c.name} - Sec. ${c.section}`,
        tipo: 'Aula / Sección'
      }))
    };

  } catch (error) {
    console.error("Fallo crítico en el motor Omnisearch:", error);
    return { estudiantes: [], cursos: [] };
  }
}