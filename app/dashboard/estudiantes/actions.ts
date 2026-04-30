'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { StudentStatus, Prisma } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// ============================================================================
// HELPER DE ARCHIVOS LOCALES (Soporta el Wizard de Admisión)
// ============================================================================
async function saveLocalFile(file: File | null, prefix: string): Promise<string | null> {
  if (!file || typeof file === 'string' || file.size === 0) return null;
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const fileName = `${prefix}_${Date.now()}_${safeFileName}`;
    await writeFile(join(uploadDir, fileName), buffer);
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("❌ Error guardando archivo:", error);
    return null;
  }
}

const formatCourseName = (c: any) => c ? `${c.name} ${c.section ? `- Sec. ${c.section}` : ''}`.trim() : 'No asignado';

interface GetStudentsParams {
  page?: number; limit?: number; search?: string; status?: string;
  courseId?: string; sortBy?: string; sortDir?: 'asc' | 'desc';
  userEmail?: string; role?: string;
}

// ============================================================================
// 1. OBTENER ESTUDIANTES (Con lógica blindada de 10 meses y Asistencia)
// ============================================================================
export async function getStudents(params: GetStudentsParams = {}) {
  try {
    const { 
      page = 1, limit = 12, search = '', status = 'Todos', 
      courseId, sortBy = 'apellido', sortDir = 'asc', userEmail, role
    } = params;

    const skip = (page - 1) * limit;
    const whereClause: Prisma.StudentWhereInput = { isDeleted: false };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { rne: { contains: search, mode: 'insensitive' } },
        { folio: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'Todos') whereClause.estatus = status as StudentStatus;
    if (courseId && courseId !== 'Todos') whereClause.courseId = courseId;

    if (role === 'DOCENTE' && userEmail) {
      whereClause.course = { subjects: { some: { teacher: { email: userEmail } } } };
    }

    // Identificar si es una consulta masiva para reporte
    const isReportExport = limit > 1000;

    const [totalRecords, students] = await Promise.all([
      prisma.student.count({ where: whereClause }),
      prisma.student.findMany({
        where: whereClause,
        skip: isReportExport ? undefined : skip,
        take: isReportExport ? undefined : limit,
        include: {
          course: true,
          attendance: true, // Removido el "take: 10" para calcular la asistencia real del año
          grades: { include: { subject: true }, orderBy: { updatedAt: 'desc' } } 
        },
        orderBy: { [sortBy === 'matricula' ? 'rne' : sortBy]: sortDir }
      })
    ]);

    const formattedData = students.map(s => {
      // Cálculo REAL de Asistencia
      const totalDays = s.attendance.length;
      const presentDays = s.attendance.filter(a => a.status === 'PRESENTE').length;
      
      // 🔥 DEDUPLICACIÓN Y ESTRUCTURACIÓN PARA REPORTE INDIVIDUAL (10 MESES AGO-JUN)
      const uniqueGradesMap = new Map();
      
      s.grades.forEach(g => {
        if (!uniqueGradesMap.has(g.subjectId)) {
          const subjectName = g.subject?.name || 'Materia Desconocida';
          // Identificador de módulos técnicos (Sensible a mayúsculas y acentos)
          const esModulo = subjectName.toUpperCase().includes('MÓDULO') || 
                           subjectName.toUpperCase().includes('MODULO');

          // Distribuimos los 4 períodos (p1, p2, p3, p4) en los 10 meses del año escolar dominicano
          uniqueGradesMap.set(g.subjectId, {
            subjectId: g.subjectId,
            materia: subjectName,
            esModulo: esModulo,
            m1: '-', // AGO: Generalmente diagnóstico / inicio
            m2: g.p1 ? g.p1.toString() : '-', // SEP: Primer parcial
            m3: g.p1 ? g.p1.toString() : '-', // OCT
            m4: g.p2 ? g.p2.toString() : '-', // NOV: Segundo parcial
            m5: g.p2 ? g.p2.toString() : '-', // DIC
            m6: g.p3 ? g.p3.toString() : '-', // ENE: Tercer parcial
            m7: g.p3 ? g.p3.toString() : '-', // FEB
            m8: g.p4 ? g.p4.toString() : '-', // MAR: Cuarto parcial
            m9: g.p4 ? g.p4.toString() : '-', // ABR
            m10: g.promedio ? g.promedio.toString() : (g.p4 ? g.p4.toString() : '-'), // MAY: Cierre
            final: g.promedio || Math.round(((g.p1||0) + (g.p2||0) + (g.p3||0) + (g.p4||0)) / 4)
          });
        }
      });

      return {
        id: s.id, nombre: s.nombre, apellido: s.apellido,
        rne: s.rne || 'N/A', folio: s.folio || 'N/A',
        estatus: s.estatus, courseId: s.courseId,
        curso: formatCourseName(s.course),
        asistencia: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100,
        promedio: s.promedio || 0,
        calificacionesDetalle: Array.from(uniqueGradesMap.values()),
        
        // Datos del Wizard de Admisión Oficial
        fechaNacimiento: s.fechaNacimiento, genero: s.genero, direccion: s.direccion, nacionalidad: s.nacionalidad,
        alergias: s.alergias, condiciones: s.condiciones, tipoSangre: s.tipoSangre, seguroMedico: s.seguroMedico,
        tutorNombre: s.tutorNombre, tutorParentesco: s.tutorParentesco, tutorTelefono: s.tutorTelefono, tutorOcupacion: s.tutorOcupacion,
        fotoUrl: s.fotoUrl, actaNacimientoUrl: s.actaNacimientoUrl, certificadoMedicoUrl: s.certificadoMedicoUrl
      };
    });

    return { data: formattedData, totalRecords, totalPages: Math.ceil(totalRecords / limit), currentPage: page };
  } catch (error) {
    console.error("Fallo en la extracción de estudiantes:", error);
    return { data: [], totalRecords: 0, totalPages: 1, currentPage: 1 };
  }
}

// ============================================================================
// 2. OBTENER MÉTRICAS DEL DASHBOARD
// ============================================================================
export async function getStudentMetrics(userEmail?: string, role?: string) {
  try {
    const baseWhere: Prisma.StudentWhereInput = { estatus: 'ACTIVO', isDeleted: false };
    if (role === 'DOCENTE' && userEmail) {
      baseWhere.course = { subjects: { some: { teacher: { email: userEmail } } } };
    }
    const [total, enRiesgo, sobresalientes] = await Promise.all([
      prisma.student.count({ where: baseWhere }),
      prisma.student.count({ where: { ...baseWhere, promedio: { lt: 70, gt: 0 } } }),
      prisma.student.count({ where: { ...baseWhere, promedio: { gte: 90 } } }),
    ]);
    return { total, enRiesgo, sobresalientes };
  } catch (error) { 
    return { total: 0, enRiesgo: 0, sobresalientes: 0 }; 
  }
}

// ============================================================================
// 3. OBTENER LISTA DE CURSOS
// ============================================================================
export async function getCourses(params: { userEmail?: string, role?: string } = {}) {
  try {
    const whereClause: any = {};
    if (params.role === 'DOCENTE' && params.userEmail) {
      whereClause.subjects = { some: { teacher: { email: params.userEmail } } };
    }
    const courses = await prisma.course.findMany({ where: whereClause, orderBy: [{ section: 'asc' }, { name: 'asc' }] });
    return courses.map(c => ({ id: c.id, name: formatCourseName(c) }));
  } catch (error) { 
    return []; 
  }
}

// ============================================================================
// 4. OBTENER MATERIAS (Para Selector de Reportes)
// ============================================================================
export async function getSubjectsForReport(courseId: string, userEmail?: string, role?: string) {
  if (!courseId) return [];
  try {
    const whereClause: any = { courseId };
    if (role === 'DOCENTE' && userEmail) {
      whereClause.teacher = { email: userEmail };
    }
    const subjects = await prisma.subject.findMany({
      where: whereClause,
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    return subjects;
  } catch (error) { 
    return []; 
  }
}

// ============================================================================
// 5. CREAR ESTUDIANTE (Admisión Oficial - 4 Pasos)
// ============================================================================
export async function createStudent(formData: FormData) {
  try {
    const rne = formData.get('rne') as string;
    const folio = formData.get('folio') as string;
    if (!rne || !folio) return { success: false, message: 'RNE y Folio son obligatorios.' };
    
    const rneLimpio = rne.trim().toUpperCase();
    if (await prisma.student.findUnique({ where: { rne: rneLimpio } })) {
      return { success: false, message: `El RNE ${rneLimpio} ya está registrado en el sistema.` };
    }

    const [fotoUrl, actaUrl, certUrl] = await Promise.all([
      saveLocalFile(formData.get('fotoFile') as File | null, 'foto'),
      saveLocalFile(formData.get('actaFile') as File | null, 'acta'),
      saveLocalFile(formData.get('certificadoFile') as File | null, 'medico')
    ]);

    await prisma.student.create({
      data: {
        rne: rneLimpio, 
        folio: folio.trim(),
        nombre: (formData.get('nombre') as string).trim(), 
        apellido: (formData.get('apellido') as string).trim(),
        fechaNacimiento: (formData.get('fechaNacimiento') as string) || null, 
        genero: (formData.get('genero') as string) || 'M',
        nacionalidad: (formData.get('nacionalidad') as string) || 'Dominicana', 
        direccion: (formData.get('direccion') as string) || null,
        alergias: (formData.get('alergias') as string) || null, 
        condiciones: (formData.get('condiciones') as string) || null,
        tipoSangre: (formData.get('tipoSangre') as string) || null, 
        seguroMedico: (formData.get('seguroMedico') as string) || null,
        tutorNombre: (formData.get('tutorNombre') as string) || null, 
        tutorParentesco: (formData.get('tutorParentesco') as string) || null,
        tutorTelefono: (formData.get('tutorTelefono') as string) || null, 
        tutorOcupacion: (formData.get('tutorOcupacion') as string) || null,
        courseId: (formData.get('courseId') as string) || null, 
        estatus: StudentStatus.ACTIVO, 
        isDeleted: false,
        fotoUrl, 
        actaNacimientoUrl: actaUrl, 
        certificadoMedicoUrl: certUrl
      }
    });
    revalidatePath('/dashboard/estudiantes');
    return { success: true };
  } catch (error) { 
    return { success: false, message: 'Fallo interno al insertar en base de datos.' }; 
  }
}

// ============================================================================
// 6. ACTUALIZAR ESTUDIANTE (Mantenimiento de Expediente)
// ============================================================================
export async function updateStudent(id: string, formData: FormData) {
  try {
    const rne = formData.get('rne') as string;
    const folio = formData.get('folio') as string;
    if (!rne || !folio) return { success: false, message: 'RNE y Folio son obligatorios.' };
    
    const rneLimpio = rne.trim().toUpperCase();
    const existente = await prisma.student.findUnique({ where: { rne: rneLimpio } });
    if (existente && existente.id !== id) {
      return { success: false, message: `El RNE ${rneLimpio} pertenece a otro expediente.` };
    }

    const updateData: any = {
      rne: rneLimpio, 
      folio: folio.trim(),
      nombre: (formData.get('nombre') as string).trim(), 
      apellido: (formData.get('apellido') as string).trim(),
      fechaNacimiento: (formData.get('fechaNacimiento') as string) || null, 
      genero: (formData.get('genero') as string) || 'M',
      nacionalidad: (formData.get('nacionalidad') as string) || 'Dominicana', 
      direccion: (formData.get('direccion') as string) || null,
      alergias: (formData.get('alergias') as string) || null, 
      condiciones: (formData.get('condiciones') as string) || null,
      tipoSangre: (formData.get('tipoSangre') as string) || null, 
      seguroMedico: (formData.get('seguroMedico') as string) || null,
      tutorNombre: (formData.get('tutorNombre') as string) || null, 
      tutorParentesco: (formData.get('tutorParentesco') as string) || null,
      tutorTelefono: (formData.get('tutorTelefono') as string) || null, 
      tutorOcupacion: (formData.get('tutorOcupacion') as string) || null,
      courseId: (formData.get('courseId') as string) || null,
    };

    // Solo actualiza los archivos si se subieron nuevos en el formulario
    const fotoFile = formData.get('fotoFile') as File | null;
    if (fotoFile && fotoFile.size > 0) updateData.fotoUrl = await saveLocalFile(fotoFile, 'foto');
    
    const actaFile = formData.get('actaFile') as File | null;
    if (actaFile && actaFile.size > 0) updateData.actaNacimientoUrl = await saveLocalFile(actaFile, 'acta');
    
    const certFile = formData.get('certificadoFile') as File | null;
    if (certFile && certFile.size > 0) updateData.certificadoMedicoUrl = await saveLocalFile(certFile, 'medico');

    await prisma.student.update({ where: { id }, data: updateData });
    revalidatePath('/dashboard/estudiantes');
    return { success: true };
  } catch (error) { 
    return { success: false, message: 'Excepción al intentar modificar el registro.' }; 
  }
}

// ============================================================================
// 7. ELIMINAR ESTUDIANTE (Baja Lógica)
// ============================================================================
export async function deleteStudent(id: string) {
  try {
    // Retiro lógico para no perder el histórico de notas
    await prisma.student.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), estatus: 'RETIRADO' } 
    });
    revalidatePath('/dashboard/estudiantes'); 
    return { success: true };
  } catch (error) { 
    return { success: false, message: 'Error de base de datos al eliminar.' }; 
  }
}