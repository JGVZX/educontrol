'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { StudentStatus, Prisma } from '@prisma/client';

interface GetStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  courseId?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  userEmail?: string;
  role?: string;
}

export async function getStudents(params: GetStudentsParams = {}) {
  try {
    const { 
      page = 1, limit = 12, search = '', 
      status = 'Todos', courseId, sortBy = 'apellido', sortDir = 'asc',
      userEmail, role
    } = params;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.StudentWhereInput = {
      isDeleted: false,
    };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { matricula: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'Todos') {
      whereClause.estatus = status as StudentStatus;
    }

    if (courseId && courseId !== 'Todos') {
      whereClause.courseId = courseId;
    }

    // Regla de Aislamiento para Docentes
    if (role === 'DOCENTE' && userEmail) {
      whereClause.course = {
        subjects: {
          some: {
            teacher: { email: userEmail }
          }
        }
      };
    }

    const [totalRecords, students] = await Promise.all([
      prisma.student.count({ where: whereClause }),
      prisma.student.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          course: true,
          attendance: { take: 10 },
          grades: true
        },
        orderBy: { [sortBy]: sortDir }
      })
    ]);

    const formattedData = students.map(s => {
      const totalDays = s.attendance.length;
      const presentDays = s.attendance.filter(a => a.status === 'PRESENTE').length;
      
      return {
        id: s.id,
        nombre: s.nombre,
        apellido: s.apellido,
        matricula: s.matricula,
        estatus: s.estatus,
        curso: s.course?.name || 'No asignado',
        seccion: s.course?.section || 'U',
        asistencia: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100,
        promedio: s.promedio || 0
      };
    });

    return {
      data: formattedData,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page
    };
  } catch (error) {
    console.error("Fallo en la extracción del padrón:", error);
    return { data: [], totalRecords: 0, totalPages: 1, currentPage: 1 };
  }
}

export async function getStudentMetrics(userEmail?: string, role?: string) {
  try {
    const baseWhere: Prisma.StudentWhereInput = {
      estatus: 'ACTIVO',
      isDeleted: false
    };

    if (role === 'DOCENTE' && userEmail) {
      baseWhere.course = {
        subjects: {
          some: { teacher: { email: userEmail } }
        }
      };
    }

    const [total, enRiesgo, sobresalientes] = await Promise.all([
      prisma.student.count({ where: baseWhere }),
      prisma.student.count({ where: { ...baseWhere, promedio: { lt: 70, gt: 0 } } }),
      prisma.student.count({ where: { ...baseWhere, promedio: { gte: 90 } } }),
    ]);

    return { total, enRiesgo, sobresalientes };
  } catch (error) {
    console.error("Fallo al calcular métricas:", error);
    return { total: 0, enRiesgo: 0, sobresalientes: 0 };
  }
}

export async function saveStudent(data: any, isEdit: boolean) {
  try {
    const validCourseId = (data.cursoId || data.curso) ? (data.cursoId || data.curso) : null;

    const studentData = {
      nombre: data.nombre?.trim(),
      apellido: data.apellido?.trim(),
      matricula: data.matricula?.trim(),
      estatus: data.estatus || 'ACTIVO',
      genero: data.genero || 'M',
      fechaNacimiento: data.fechaNacimiento || null,
      nacionalidad: data.nacionalidad || 'Dominicana',
      direccion: data.direccion || null,
      tipoSangre: data.tipoSangre || null,
      alergias: data.alergias || null,
      condiciones: data.condiciones || null,
      seguroMedico: data.seguroMedico || null,
      tutorNombre: data.tutorNombre || null,
      tutorTelefono: data.tutorTelefono || null,
      tutorParentesco: data.tutorParentesco || null,
      tutorCorreo: data.tutorCorreo || null,
      tutorOcupacion: data.tutorOcupacion || null,
      courseId: validCourseId,
    };

    if (isEdit) {
      if (!data.id) throw new Error("Falta identificador primario para actualización.");
      
      await prisma.student.update({
        where: { id: data.id },
        data: studentData
      });
    } else {
      const existing = await prisma.student.findUnique({ where: { matricula: studentData.matricula } });
      if (existing) {
        return { success: false, message: 'La matrícula ingresada ya está registrada.' };
      }
      await prisma.student.create({ data: studentData });
    }

    revalidatePath('/dashboard/estudiantes');
    return { success: true };
  } catch (error: any) {
    console.error("Error en la mutación del expediente:", error);
    return { success: false, message: 'Error interno de transacción. Verifique los logs.' };
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.student.update({
      where: { id },
      data: { 
        isDeleted: true, 
        deletedAt: new Date(),
        estatus: 'RETIRADO'
      }
    });
    
    revalidatePath('/dashboard/estudiantes');
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Restricción de base de datos impidió la purga.' };
  }
}

export async function getCourses() {
  try {
    return await prisma.course.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, section: true }
    });
  } catch (error) {
    return [];
  }
}

export async function getStudentFullProfile(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        course: true,
        attendance: { orderBy: { date: 'desc' } },
        grades: { include: { subject: true }, orderBy: { year: 'desc' } },
        raScores: { include: { ra: { include: { subject: true } } } },
        observaciones: { include: { author: true }, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!student || student.isDeleted) return null;

    const totalDays = student.attendance.length;
    const presentDays = student.attendance.filter(a => a.status === 'PRESENTE').length;
    const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    const periodData = { p1: { s: 0, c: 0 }, p2: { s: 0, c: 0 }, p3: { s: 0, c: 0 }, p4: { s: 0, c: 0 } };
    
    student.grades.forEach((g: any) => {
      if (g.p1 > 0) { periodData.p1.s += g.p1; periodData.p1.c++; }
      if (g.p2 > 0) { periodData.p2.s += g.p2; periodData.p2.c++; }
      if (g.p3 > 0) { periodData.p3.s += g.p3; periodData.p3.c++; }
      if (g.p4 > 0) { periodData.p4.s += g.p4; periodData.p4.c++; }
    });

    return {
      ...student,
      stats: {
        attendancePct,
        absences: totalDays - presentDays,
        periodHistory: [
          { p: 'P1', v: periodData.p1.c > 0 ? Math.round(periodData.p1.s / periodData.p1.c) : 0 },
          { p: 'P2', v: periodData.p2.c > 0 ? Math.round(periodData.p2.s / periodData.p2.c) : 0 },
          { p: 'P3', v: periodData.p3.c > 0 ? Math.round(periodData.p3.s / periodData.p3.c) : 0 },
          { p: 'P4', v: periodData.p4.c > 0 ? Math.round(periodData.p4.s / periodData.p4.c) : 0 }
        ]
      },
      academicHistory: student.grades.map((g: any) => ({
        id: g.id,
        subject: g.subject.name,
        type: g.subject.isTechnical ? 'TÉCNICA' : 'ACADÉMICA',
        p1: g.p1, p2: g.p2, p3: g.p3, p4: g.p4,
        final: Math.round(((g.p1||0)+(g.p2||0)+(g.p3||0)+(g.p4||0))/4)
      }))
    };
  } catch (error) {
    console.error("Error al procesar perfil técnico:", error);
    return null;
  }
}