'use server';

/**
 * @file actions.ts
 * @description Capa de Servicios Backend (Server Actions) para EduControl.
 * Maneja la lógica de negocio, transacciones ACID con Prisma ORM, seguridad criptográfica
 * y el manejo de archivos físicos (Foto, Acta, Certificado Médico) para el MINERD.
 */

import { prisma } from '@/lib/prisma';
import { Role, UserStatus, StudentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// ============================================================================
// 1. DATA TRANSFER OBJECTS (DTOs) Y TIPADOS ESTRICTOS
// ============================================================================

export interface UserFormData {
  nombre: string;
  apellido?: string;
  email: string;
  password?: string;
  rol: string;
  estado?: UserStatus | string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  genero?: string;
  subjectIds?: string[]; 
}

// ============================================================================
// 2. HELPER DE ARCHIVOS LOCALES (FOTOS Y PDF)
// ============================================================================

async function saveLocalFile(file: File | null, prefix: string): Promise<string | null> {
  if (!file || typeof file === 'string' || file.size === 0) return null;
  
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const fileName = `${prefix}_${Date.now()}_${safeFileName}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("❌ Error guardando el archivo físico:", error);
    return null;
  }
}

// ============================================================================
// 3. MÓDULO DE RECURSOS HUMANOS Y STAFF (ADMIN & DIRECTOR)
// ============================================================================

export async function getAvailableSubjects() {
  try {
    const subjects = await prisma.subject.findMany({
      include: { course: true },
      orderBy: [{ course: { name: 'asc' } }, { name: 'asc' }]
    });
    
    return subjects.map(s => ({
      id: s.id,
      name: s.name,
      courseName: s.course ? `${s.course.name} ${s.course.section || ''}`.trim() : 'Materia Independiente'
    }));
  } catch (error) {
    console.error("[Arquitectura] Excepción en getAvailableSubjects:", error);
    return [];
  }
}

export async function createUser(data: UserFormData) {
  try {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return { success: false, message: 'El correo institucional ya se encuentra registrado.' };

    const rawPassword = data.password && data.password.trim() !== '' 
      ? data.password 
      : crypto.randomBytes(4).toString('hex');

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido || null,
          email: data.email,
          password: hashedPassword,
          role: data.rol as Role,
          estado: (data.estado as UserStatus) || UserStatus.PENDIENTE,
          telefono: data.telefono || null,
          direccion: data.direccion || null,
          fechaNacimiento: data.fechaNacimiento || null,
          genero: data.genero || 'M',
          verificationToken: token,
          tokenExpires: expiresAt,
          isActive: data.estado === 'ACTIVO'
        }
      });

      if (data.rol === 'DOCENTE' && data.subjectIds && data.subjectIds.length > 0) {
        await tx.subject.updateMany({
          where: { id: { in: data.subjectIds } },
          data: { teacherId: user.id }
        });
      }
      return user;
    });

    revalidatePath('/dashboard/administracion');
    return { success: true, data: { nombreCompleto: `${newUser.nombre} ${newUser.apellido || ''}`.trim(), email: newUser.email, passwordPlana: rawPassword } };
  } catch (error) {
    console.error("[Capa de Datos] Fallo en la mutación createUser:", error);
    return { success: false, message: 'Excepción de servidor al intentar persistir los datos.' };
  }
}

export async function getUsersForMonitoring() {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'ADMIN_SISTEMA' } },
      include: { subjects: { include: { course: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    return users.map(u => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      role: u.role,
      estado: u.estado,
      telefono: u.telefono,
      direccion: u.direccion,
      fechaNacimiento: u.fechaNacimiento,
      genero: u.genero,
      updatedAt: u.updatedAt.toISOString(),
      subjects: u.subjects.map(s => ({
        id: s.id, 
        name: s.name,
        courseName: s.course ? `${s.course.name} ${s.course.section || ''}`.trim() : 'Materia Independiente'
      }))
    }));
  } catch (error) {
    console.error("[Arquitectura] Fallo de lectura en getUsersForMonitoring:", error);
    return [];
  }
}

export async function toggleUserStatus(userId: string, currentStatus: string) {
  try {
    const newStatus = currentStatus === 'ACTIVO' ? UserStatus.SUSPENDIDO : UserStatus.ACTIVO;
    await prisma.user.update({
      where: { id: userId },
      data: { estado: newStatus, isActive: newStatus === UserStatus.ACTIVO }
    });
    revalidatePath('/dashboard/administracion');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Elimina definitivamente un usuario del sistema (Hard Delete).
 */
export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    revalidatePath('/dashboard/administracion');
    return { success: true };
  } catch (error) {
    console.error("[Capa de Datos] Error al eliminar usuario:", error);
    return { success: false, message: 'No se puede eliminar el usuario. Es posible que tenga dependencias (clases, calificaciones o tickets) asociadas.' };
  }
}

export async function resetUserPassword(targetUserId: string, adminEmail: string, adminPassConfirm: string) {
  try {
    if (!adminEmail) return { success: false, message: "Contexto administrativo no identificado." };
    
    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminUser) return { success: false, message: "Entidad administradora no localizada." };

    const isBcryptValid = await bcrypt.compare(adminPassConfirm, adminUser.password);
    const isPlainValid = adminPassConfirm === adminUser.password;

    if (!isBcryptValid && !isPlainValid) {
      return { success: false, message: "Autorización denegada: Contraseña maestra incorrecta." };
    }

    const newRawPassword = crypto.randomBytes(4).toString('hex');
    const hashed = await bcrypt.hash(newRawPassword, 10);
    
    await prisma.user.update({
      where: { id: targetUserId },
      data: { password: hashed }
    });

    return { success: true, newPassword: newRawPassword };
  } catch (error) {
    console.error("[Seguridad] Intercepción fallida en resetUserPassword:", error);
    return { success: false, message: "Fallo técnico en la capa de seguridad." };
  }
}

export async function updateUser(userId: string, data: UserFormData) {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser && existingUser.id !== userId) {
      return { success: false, message: 'El correo electrónico ya pertenece a otro usuario.' };
    }

    const updateData: any = {
      nombre: data.nombre,
      apellido: data.apellido || null,
      email: data.email,
      role: data.rol as Role,
      estado: data.estado as UserStatus,
      telefono: data.telefono || null,
      direccion: data.direccion || null,
      fechaNacimiento: data.fechaNacimiento || null,
      genero: data.genero || 'M',
      isActive: data.estado === 'ACTIVO'
    };

    if (data.password && data.password.trim() !== '') {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: updateData });

      await tx.subject.updateMany({
        where: { teacherId: userId },
        data: { teacherId: null }
      });

      if (data.rol === 'DOCENTE' && data.subjectIds && data.subjectIds.length > 0) {
        await tx.subject.updateMany({
          where: { id: { in: data.subjectIds } },
          data: { teacherId: userId }
        });
      }
    });

    revalidatePath('/dashboard/administracion');
    return { success: true };
  } catch (error) {
    console.error("[Capa de Datos] Fallo en la actualización updateUser:", error);
    return { success: false, message: 'Excepción interna al reestructurar el expediente.' };
  }
}

// ============================================================================
// 4. MÓDULO DE OPERACIONES DOCENTES
// ============================================================================

export async function getMyCargaAcademica(userId: string) {
  try {
    const subjects = await prisma.subject.findMany({
      where: { teacherId: userId },
      include: { course: true },
      orderBy: [{ course: { name: 'asc' } }, { name: 'asc' }]
    });

    return subjects.map(s => ({
      id: s.id,
      name: s.name,
      courseName: s.course ? `${s.course.name} ${s.course.section || ''}`.trim() : 'Sin curso oficial asignado'
    }));
  } catch (error) {
    console.error("[Arquitectura] Consulta de carga académica rechazada:", error);
    return [];
  }
}

// ============================================================================
// 5. MÓDULO DE ADMISIONES MINERD (SECRETARÍA CON ARCHIVOS)
// ============================================================================

export async function getAvailableCourses() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: [{ section: 'asc' }, { name: 'asc' }]
    });
    
    return courses.map(c => ({
      id: c.id,
      name: `${c.name} ${c.section ? `- Sec. ${c.section}` : ''}`.trim()
    }));
  } catch (error) {
    console.error("[Capa de Datos] Error al extraer malla de cursos:", error);
    return [];
  }
}

export async function getStudentsForDirectory() {
  try {
    const students = await prisma.student.findMany({
      where: { isDeleted: false },
      include: { course: true },
      orderBy: { createdAt: 'desc' }
    });

    return students.map(s => ({
      id: s.id,
      nombre: s.nombre,
      apellido: s.apellido,
      rne: s.rne,
      folio: s.folio,
      estatus: s.estatus,
      courseName: s.course ? `${s.course.name} ${s.course.section || ''}`.trim() : null,
      courseId: s.courseId,
      createdAt: s.createdAt.toISOString(),
      
      fechaNacimiento: s.fechaNacimiento,
      genero: s.genero,
      direccion: s.direccion,
      alergias: s.alergias,
      condiciones: s.condiciones,
      tipoSangre: s.tipoSangre,
      seguroMedico: s.seguroMedico,
      
      tutorNombre: s.tutorNombre,
      tutorParentesco: s.tutorParentesco,
      tutorTelefono: s.tutorTelefono,
      tutorOcupacion: s.tutorOcupacion,
      
      fotoUrl: s.fotoUrl,
      actaNacimientoUrl: s.actaNacimientoUrl,
      certificadoMedicoUrl: s.certificadoMedicoUrl
    }));
  } catch (error) {
    console.error("[Capa de Datos] Excepción en lectura del padrón:", error);
    return [];
  }
}

export async function createStudent(formData: FormData) {
  try {
    const rne = formData.get('rne') as string;
    const folio = formData.get('folio') as string;

    if (!rne || !folio) {
      return { success: false, message: 'RNE y Folio son obligatorios.' };
    }

    const rneLimpio = rne.trim().toUpperCase();

    const rneExistente = await prisma.student.findUnique({
      where: { rne: rneLimpio }
    });
    
    if (rneExistente) {
      return { success: false, message: `El RNE ${rneLimpio} ya está registrado a nombre de otro estudiante.` };
    }

    const fotoFile = formData.get('fotoFile') as File | null;
    const actaFile = formData.get('actaFile') as File | null;
    const certificadoFile = formData.get('certificadoFile') as File | null;

    const fotoUrl = await saveLocalFile(fotoFile, 'foto');
    const actaUrl = await saveLocalFile(actaFile, 'acta');
    const certUrl = await saveLocalFile(certificadoFile, 'medico');

    const student = await prisma.student.create({
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

        fotoUrl: fotoUrl,
        actaNacimientoUrl: actaUrl,
        certificadoMedicoUrl: certUrl
      }
    });

    revalidatePath('/dashboard/administracion');
    return { success: true, rne: student.rne };
  } catch (error: any) {
    console.error("🔴 ERROR EN CREATE STUDENT FORMDATA:", error.message || error);
    return { success: false, message: 'Fallo al procesar el archivo o la inserción en la base de datos.' };
  }
}

export async function updateStudent(id: string, formData: FormData) {
  try {
    const rne = formData.get('rne') as string;
    const folio = formData.get('folio') as string;

    if (!rne || !folio) return { success: false, message: 'RNE y Folio no pueden estar vacíos.' };
    const rneLimpio = rne.trim().toUpperCase();

    const rneExistente = await prisma.student.findUnique({ where: { rne: rneLimpio } });
    if (rneExistente && rneExistente.id !== id) {
      return { success: false, message: `El RNE ${rneLimpio} ya pertenece a otro expediente.` };
    }

    const fotoFile = formData.get('fotoFile') as File | null;
    const actaFile = formData.get('actaFile') as File | null;
    const certFile = formData.get('certificadoFile') as File | null;

    let updateData: any = {
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

    if (fotoFile && typeof fotoFile !== 'string' && fotoFile.size > 0) {
      updateData.fotoUrl = await saveLocalFile(fotoFile, 'foto');
    }
    if (actaFile && typeof actaFile !== 'string' && actaFile.size > 0) {
      updateData.actaNacimientoUrl = await saveLocalFile(actaFile, 'acta');
    }
    if (certFile && typeof certFile !== 'string' && certFile.size > 0) {
      updateData.certificadoMedicoUrl = await saveLocalFile(certFile, 'medico');
    }

    await prisma.student.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/dashboard/administracion');
    return { success: true };
  } catch (error: any) {
    console.error("🔴 ERROR EN UPDATE STUDENT:", error);
    return { success: false, message: 'Excepción al intentar modificar el expediente.' };
  }
}