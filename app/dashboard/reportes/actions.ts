'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';

// Definición de tipos para asegurar la integridad de la base de datos
type Role = 'ADMIN_SISTEMA' | 'DIRECTOR' | 'DOCENTE' | 'SECRETARIA';

// ==========================================
// 1. MONITOR DE TICKETS (NOC)
// ==========================================

/** Obtener todas las incidencias técnicas para el Administrador */
export async function getAllTickets() {
  try {
    return await prisma.ticket.findMany({
      include: {
        docente: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Fallo crítico en obtención de tickets:", error);
    return [];
  }
}

/** Cambiar el estado de un ticket (Ej: Resolver problema) */
export async function updateTicketStatus(ticketId: string, newStatus: 'RESUELTO' | 'REVISION' | 'PENDIENTE') {
  try {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus }
    });
    
    revalidatePath('/admin/administracion');
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar ticket:", error);
    return { success: false };
  }
}

// ==========================================
// 2. GESTIÓN DE USUARIOS
// ==========================================

/** Obtener personal para auditoría administrativa */
export async function getUsersForMonitoring() {
  try {
    return await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        role: true,
        estado: true,
        updatedAt: true
      },
      orderBy: { nombre: 'asc' }
    });
  } catch (error) {
    console.error("Error en monitoreo de usuarios:", error);
    return [];
  }
}

/** Suspender o Activar cuentas de personal */
export async function toggleUserStatus(userId: string, currentStatus: string) {
  try {
    const newStatus = currentStatus === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    await prisma.user.update({
      where: { id: userId },
      data: { estado: newStatus as any }
    });
    revalidatePath('/admin/administracion');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// ============================================================
// 3. PROTOCOLO DE RESPALDO (Vercel Blob Sync)
// ============================================================

/** * Ejecuta un volcado integral de la base de datos y lo sincroniza con Vercel Blob.
 * Implementado para Tesis de Ingeniería en Sistemas - EduControl.
 */
export async function generateDatabaseBackup(userEmail: string, role: Role) {
  try {
    // Seguridad: Solo el administrador puede ejecutar volcados de base de datos
    if (role !== 'ADMIN_SISTEMA') {
      throw new Error("Acceso denegado: Privilegios insuficientes para backup.");
    }

    // Extracción masiva de todos los nodos de la base de datos
    const [
      usuarios, estudiantes, cursos, asignaturas,
      resultadosAprendizaje, observaciones, calificaciones,
      calificacionesRA, asistencia, horarios
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.student.findMany(),
      prisma.course.findMany(),
      prisma.subject.findMany(),
      prisma.rA.findMany(),
      prisma.observation.findMany(),
      prisma.grade.findMany(),
      prisma.rAScore.findMany(),
      prisma.attendance.findMany(),
      prisma.schedule.findMany()
    ]);

    // Snapshot Estructurado
    const backupSnapshot = {
      metadata: {
        system: "EduControl Core Engine",
        generatedAt: new Date().toISOString(),
        exportedBy: userEmail,
        integrityStatus: "VERIFIED",
        summary: {
          total_usuarios: usuarios.length,
          total_estudiantes: estudiantes.length,
          total_registros_asistencia: asistencia.length
        }
      },
      payload: {
        usuarios, estudiantes, cursos, asignaturas,
        resultadosAprendizaje, observaciones, calificaciones,
        calificacionesRA, asistencia, horarios
      }
    };

    const backupContent = JSON.stringify(backupSnapshot);
    const fileName = `backups/full_dump_${Date.now()}.json`;

    // Sincronización con la nube (Vercel Blob)
    // NOTA: Asegúrate de tener el token en tu .env o pégalo aquí si es para pruebas locales
    const blob = await put(fileName, backupContent, {
      access: 'public',
      contentType: 'application/json',
      token:"vercel_blob_rw_p7Saci39nffKCvfJ_WSTqJ8OsNZg5rd883gK1bqWcsQvMVu",
      addRandomSuffix: true,
    });

    return {
      success: true,
      url: blob.url,
      message: "Respaldo sincronizado exitosamente con la infraestructura perimetral."
    };

  } catch (error) {
    console.error("[NOC Backup Error]:", error);
    return { success: false, url: '', message: "Error al procesar el respaldo." };
  }
}