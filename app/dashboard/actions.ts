'use server';

/**
 * @file actions.ts
 * @module DashboardDataLayer
 * @description DAL adaptado al nuevo esquema de EduControl.
 * Sincronización: rne, folio, UserStatus (ACTIVO) y TicketStatus.
 */

import { prisma } from '@/lib/prisma';
import type { DashboardData, Role, StudentActivity, ChartItem, SubjectData, SystemTicket } from './page';

export async function getDashboardData(userEmail: string, role: Role): Promise<DashboardData> {
  try {
    // ==========================================
    // 1. ADMIN_SISTEMA (NOC)
    // ==========================================
    if (role === 'ADMIN_SISTEMA') {
      const [totalStudents, totalTeachers, totalCourses, realTickets] = await Promise.all([
        prisma.student.count({ where: { isDeleted: false } }),
        prisma.user.count({ where: { role: 'DOCENTE', estado: 'ACTIVO' } }),
        prisma.course.count(),
        prisma.ticket.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { docente: { select: { nombre: true, apellido: true } } }
        })
      ]);

      const systemTickets: SystemTicket[] = realTickets.map(t => ({
        id: t.id.substring(0, 8).toUpperCase(),
        docente: `${t.docente.nombre} ${t.docente.apellido || ''}`,
        issue: t.issue,
        date: t.createdAt.toISOString(),
        status: t.status as SystemTicket['status'],
        priority: t.priority as SystemTicket['priority']
      }));

      return {
        kpi: { students: totalStudents, teachers: totalTeachers, courses: totalCourses },
        systemTickets
      };
    }

    // ==========================================
    // 2. DIRECTOR (KPIs Académicos)
    // ==========================================
    if (role === 'DIRECTOR') {
      const [
        studentsCount, teachersCount, coursesCount, 
        recentStudentsRaw, coursesRaw, genderRaw
      ] = await Promise.all([
        prisma.student.count({ where: { estatus: 'ACTIVO', isDeleted: false } }),
        prisma.user.count({ where: { role: 'DOCENTE', estado: 'ACTIVO' } }),
        prisma.course.count(),
        prisma.student.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          select: { id: true, nombre: true, apellido: true, rne: true, folio: true, createdAt: true, estatus: true },
          where: { isDeleted: false }
        }),
        prisma.course.findMany({
          include: { _count: { select: { students: { where: { isDeleted: false } } } } }
        }),
        prisma.student.groupBy({
          by: ['genero'],
          _count: { genero: true },
          where: { estatus: 'ACTIVO', isDeleted: false }
        })
      ]);

      const recentActivity: StudentActivity[] = recentStudentsRaw.map(s => ({
        id: s.id,
        nombre: s.nombre,
        apellido: s.apellido,
        matricula: s.rne, // Usamos RNE como identificador principal
        rne: s.rne,
        folio: s.folio,
        createdAt: s.createdAt.toISOString(),
        status: (s.estatus === 'ACTIVO' ? 'NUEVO' : 'REGULAR') as any
      }));

      return {
        kpi: { students: studentsCount, teachers: teachersCount, courses: coursesCount },
        recentActivity,
        charts: {
          courses: coursesRaw.map(c => ({ name: c.name, total: c._count.students })),
          gender: genderRaw.map(g => ({ name: g.genero === 'M' ? 'Masculino' : 'Femenino', value: g._count.genero }))
        }
      };
    }

    // ==========================================
    // 3. SECRETARÍA (Control Operativo)
    // ==========================================
    if (role === 'SECRETARIA') {
      const [studentsCount, teachersCount, coursesCount, recentStudentsRaw] = await Promise.all([
        prisma.student.count({ where: { isDeleted: false } }),
        prisma.user.count({ where: { role: 'DOCENTE' } }),
        prisma.course.count(),
        prisma.student.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: { id: true, nombre: true, apellido: true, rne: true, folio: true, createdAt: true, estatus: true },
          where: { isDeleted: false }
        })
      ]);

      return {
        kpi: { students: studentsCount, teachers: teachersCount, courses: coursesCount },
        recentActivity: recentStudentsRaw.map(s => ({
          id: s.id,
          nombre: s.nombre,
          apellido: s.apellido,
          matricula: s.rne,
          rne: s.rne,
          folio: s.folio,
          createdAt: s.createdAt.toISOString(),
          status: (s.estatus === 'ACTIVO' ? 'NUEVO' : 'REGULAR') as any
        }))
      };
    }

    // ==========================================
    // 4. DOCENTE (Carga Académica)
    // ==========================================
    if (role === 'DOCENTE') {
      const teacher = await prisma.user.findUnique({
        where: { email: userEmail },
        include: { subjects: { include: { course: true } } }
      });

      if (!teacher) throw new Error("Docente no localizado.");

      const subjectsData: SubjectData[] = await Promise.all(
        teacher.subjects.map(async (subj) => {
          const count = await prisma.student.count({ where: { courseId: subj.courseId, isDeleted: false } });
          return {
            id: subj.id,
            name: subj.name,
            courseName: `${subj.course.name} ${subj.course.section || ''}`,
            students: count,
            studentsAtRisk: 0,
            ciclo: subj.isTechnical ? 'Modalidad Técnica' : 'Nivel Secundario'
          };
        })
      );

      return {
        kpi: { subjects: teacher.subjects.length, students: 0, teachers: 0, courses: 0 },
        mySubjects: subjectsData
      };
    }

    throw new Error("Rol no autorizado.");
  } catch (error: any) {
    console.error("Error en Dashboard Logic:", error.message);
    throw new Error("Fallo de comunicación con la base de datos PostgreSQL.");
  }
}

export async function generateDatabaseBackup(userEmail: string, role: Role): Promise<string> {
  if (role !== 'ADMIN_SISTEMA') throw new Error("Acceso denegado.");
  const [u, s, c, sub, tk] = await Promise.all([
    prisma.user.findMany(), prisma.student.findMany(), 
    prisma.course.findMany(), prisma.subject.findMany(),
    prisma.ticket.findMany()
  ]);
  return JSON.stringify({ metadata: { generatedBy: userEmail, date: new Date().toISOString() }, payload: { u, s, c, sub, tk } }, null, 2);
}