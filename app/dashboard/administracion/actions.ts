'use server';

/**
 * @file actions.ts
 * @description Capa de Servicios Backend (Server Actions) para EduControl.
 * Maneja la lógica de negocio, transacciones ACID con Prisma ORM y la seguridad criptográfica.
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { prisma } from '@/lib/prisma';
import { Role, UserStatus, StudentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

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

export interface StudentFormData {
  nombre: string;
  apellido: string;
  fechaNacimiento?: string;
  genero?: string;
  nacionalidad?: string;
  direccion?: string;
  alergias?: string;
  condiciones?: string;
  tipoSangre?: string;
  seguroMedico?: string;
  tutorNombre: string;
  tutorParentesco?: string;
  tutorTelefono: string;
  tutorCorreo?: string;
  tutorOcupacion?: string;
  courseId: string;
}

// ============================================================================
// 2. MÓDULO DE RECURSOS HUMANOS Y STAFF (ADMIN & DIRECTOR)
// ============================================================================

/**
 * Obtiene el catálogo de asignaturas disponibles con su respectivo curso.
 * Utilizado para popular los selects en la asignación de carga docente.
 * @returns {Promise<Array>} Lista de materias con metadata del curso.
 */
export async function getAvailableSubjects() {
  try {
    const subjects = await prisma.subject.findMany({
      include: { course: true },
      // Ordenamiento jerárquico: Primero por curso, luego por nombre de materia
      orderBy: [{ course: { name: 'asc' } }, { name: 'asc' }]
    });
    
    // Mapeo defensivo para evitar enviar data innecesaria al cliente
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

/**
 * Registra un nuevo empleado/docente en el sistema utilizando Transacciones ACID.
 * Genera credenciales seguras mediante hashing (Bcrypt).
 * @param {UserFormData} data - Objeto DTO con los datos del formulario.
 */
export async function createUser(data: UserFormData) {
  try {
    // 1. Validación de unicidad de correo institucional
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return { success: false, message: 'El correo institucional ya se encuentra registrado en el clúster.' };

    // 2. Generación de entropía para contraseñas vacías (Fallback de seguridad)
    const rawPassword = data.password && data.password.trim() !== '' 
      ? data.password 
      : crypto.randomBytes(4).toString('hex');

    // 3. Aplicación de función hash con salt rounds configurado en 10
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 4. Bloque Transaccional (Si falla la asignación de materias, se revierte la creación del usuario)
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

      // Asignación de carga académica (Relación 1:N)
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

/**
 * Consulta la plantilla de personal registrada, excluyendo al SuperAdmin.
 * @returns {Promise<Array>} Arreglo de perfiles de usuario enriquecidos.
 */
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

/**
 * Alterna el estado de acceso de un usuario (Soft Delete / Suspensión lógica).
 */
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
 * Mecanismo de recuperación de acceso mediante sobreescritura criptográfica.
 * Exige validación de la contraseña del administrador en sesión para mitigar ataques.
 */
export async function resetUserPassword(targetUserId: string, adminEmail: string, adminPassConfirm: string) {
  try {
    if (!adminEmail) return { success: false, message: "Contexto administrativo no identificado." };
    
    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminUser) return { success: false, message: "Entidad administradora no localizada en la base de datos." };

    // Validación de identidad del emisor de la acción
    const isPasswordValid = await bcrypt.compare(adminPassConfirm, adminUser.password);
    if (!isPasswordValid) return { success: false, message: "Autorización denegada: Firma criptográfica incorrecta." };

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

/**
 * Actualiza el perfil de un usuario, reestructurando su carga académica de manera segura.
 */
export async function updateUser(userId: string, data: UserFormData) {
  try {
    // Prevención de colisión de correos en operaciones Update
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser && existingUser.id !== userId) {
      return { success: false, message: 'Violación de restricción UNIQUE: El correo electrónico ya pertenece a otra tupla.' };
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

    // Actualización Transaccional: Limpia relaciones viejas y establece las nuevas
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: updateData });

      // Liberar materias previas para mantener la integridad referencial
      await tx.subject.updateMany({
        where: { teacherId: userId },
        data: { teacherId: null }
      });

      // Asignar nueva malla curricular si aplica
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
// 3. MÓDULO DE OPERACIONES DOCENTES
// ============================================================================

/**
 * Extrae el itinerario de materias asignadas específicamente a un docente autenticado.
 * @param {string} userId - UUID del docente.
 */
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
// 4. MÓDULO DE ADMISIONES (SECRETARÍA)
// ============================================================================

/**
 * Consulta la estructura académica activa (Cursos y Secciones).
 */
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

/**
 * Recupera el padrón estudiantil completo (excluyendo bajas lógicas - isDeleted).
 * Se ha expandido para hidratar correctamente los modales de vista y edición en el Frontend.
 */
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
      matricula: s.matricula,
      estatus: s.estatus,
      courseName: s.course ? `${s.course.name} ${s.course.section || ''}`.trim() : null,
      courseId: s.courseId,
      createdAt: s.createdAt.toISOString(),
      // Hidratación extendida para modales:
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
    }));
  } catch (error) {
    console.error("[Capa de Datos] Excepción en lectura del padrón:", error);
    return [];
  }
}

/**
 * Algoritmo de matriculación estudiantil.
 * Genera un código de matrícula secuencial automatizado basado en el año lectivo en curso.
 */
export async function createStudent(data: StudentFormData) {
  try {
    const year = new Date().getFullYear();
    
    // Cálculo de la secuencia para la llave de negocio (Matrícula)
    const countThisYear = await prisma.student.count({
      where: { matricula: { startsWith: `${year}-` } }
    });
    
    const nextSequence = (countThisYear + 1).toString().padStart(4, '0');
    const newMatricula = `${year}-${nextSequence}`;

    const student = await prisma.student.create({
      data: {
        matricula: newMatricula,
        nombre: data.nombre,
        apellido: data.apellido,
        fechaNacimiento: data.fechaNacimiento || null,
        genero: data.genero || 'M',
        nacionalidad: data.nacionalidad || 'Dominicana',
        direccion: data.direccion || null,
        alergias: data.alergias || null,
        condiciones: data.condiciones || null,
        tipoSangre: data.tipoSangre || null,
        seguroMedico: data.seguroMedico || null,
        tutorNombre: data.tutorNombre,
        tutorParentesco: data.tutorParentesco || null,
        tutorTelefono: data.tutorTelefono,
        tutorCorreo: data.tutorCorreo || null,
        tutorOcupacion: data.tutorOcupacion || null,
        courseId: data.courseId && data.courseId !== '' ? data.courseId : null,
        estatus: StudentStatus.ACTIVO,
        isDeleted: false
      }
    });

    revalidatePath('/dashboard/administracion');
    return { success: true, matricula: student.matricula };
  } catch (error) {
    console.error("[Arquitectura] Colisión en persistencia de nueva matrícula:", error);
    return { success: false, message: 'Fallo al procesar la inserción en la base de datos relacional.' };
  }
}

/**
 * Actualiza el expediente de un estudiante existente de manera segura.
 * @param {string} id - UUID del estudiante.
 * @param {StudentFormData} data - Objeto DTO con los datos actualizados.
 */
export async function updateStudent(id: string, data: StudentFormData) {
  try {
    await prisma.student.update({
      where: { id },
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        fechaNacimiento: data.fechaNacimiento || null,
        genero: data.genero || 'M',
        nacionalidad: data.nacionalidad || 'Dominicana',
        direccion: data.direccion || null,
        alergias: data.alergias || null,
        condiciones: data.condiciones || null,
        tipoSangre: data.tipoSangre || null,
        seguroMedico: data.seguroMedico || null,
        tutorNombre: data.tutorNombre,
        tutorParentesco: data.tutorParentesco || null,
        tutorTelefono: data.tutorTelefono,
        tutorCorreo: data.tutorCorreo || null,
        tutorOcupacion: data.tutorOcupacion || null,
        courseId: data.courseId && data.courseId !== '' ? data.courseId : null,
      }
    });

    revalidatePath('/dashboard/administracion');
    return { success: true };
  } catch (error) {
    console.error("[Capa de Datos] Fallo en la actualización updateStudent:", error);
    return { success: false, message: 'Excepción al intentar modificar el expediente en la base de datos.' };
  }
}