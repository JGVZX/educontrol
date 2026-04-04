'use server';

import { prisma } from '@/lib/prisma';

// ==========================================
// 1. DATOS PARA DIRECTOR (Analítica Global)
// ==========================================
export async function getDirectorReports() {
  try {
    // 1. Totales (Solo alumnos activos y no borrados)
    const totalStudents = await prisma.student.count({
        where: { isDeleted: false, estatus: 'ACTIVO' }
    });
    
    // 2. Alumnos en Riesgo (Lógica optimizada)
    // Usamos el campo `promedio` que nuestra BD ya actualiza automáticamente,
    // esto es 100x más rápido que traer todas las notas y calcular en memoria.
    const failingStudents = await prisma.student.findMany({
      where: {
          isDeleted: false,
          estatus: 'ACTIVO',
          promedio: { lt: 70, gt: 0 } // Promedio menor a 70, pero mayor a 0 (para ignorar nuevos)
      },
      include: { course: true },
      orderBy: { promedio: 'asc' } // Los más críticos primero
    });

    return {
      totalStudents,
      failingCount: failingStudents.length,
      // Mapeamos para la tabla del PDF
      failingList: failingStudents.map(s => ({
        id: s.id,
        nombre: `${s.nombre} ${s.apellido}`,
        curso: s.course?.name || 'Sin Curso',
        matricula: s.matricula,
        promedio: s.promedio
      }))
    };
  } catch (error) {
    console.error("Error en Reportes Director:", error);
    return { totalStudents: 0, failingCount: 0, failingList: [] };
  }
}

// ==========================================
// 2. DATOS PARA DOCENTE (Sus Materias y Listas)
// ==========================================
export async function getTeacherSubjectsForReports(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
          subjects: { 
              include: { 
                  course: {
                      include: {
                          // Traemos a los alumnos reales para imprimir la lista
                          students: {
                              where: { isDeleted: false, estatus: 'ACTIVO' },
                              orderBy: { apellido: 'asc' } // Orden alfabético oficial
                          }
                      }
                  } 
              } 
          } 
      }
    });

    if (!user) return [];

    // Mapeamos materias y extraemos la lista de nombres para el PDF
    const subjects = user.subjects.map((sub) => {
        return {
            id: sub.id,
            name: sub.name,
            courseName: sub.course.name,
            studentCount: sub.course.students.length,
            // Aquí generamos el array de strings que el motor de PDF usará para las filas
            students: sub.course.students.map(st => `${st.apellido}, ${st.nombre}`)
        };
    });

    return subjects;
  } catch (error) {
    console.error("Error en Reportes Docente:", error);
    return [];
  }
}

// ==========================================
// 3. DATOS PARA SECRETARIA (Certificados)
// ==========================================
export async function getStudentForCertificate(matricula: string) {
  try {
    // Usamos findFirst por si acaso la matrícula tiene espacios y validamos que no esté borrado
    const student = await prisma.student.findFirst({
      where: { 
          matricula: matricula.trim(),
          isDeleted: false
      },
      include: { course: true }
    });
    return student;
  } catch (error) {
    console.error("Error buscando certificado:", error);
    return null;
  }
}

// ==========================================
// 4. SOPORTE TÉCNICO (Tickets)
// ==========================================
export async function submitSupportTicket(data: { subject: string, description: string, userEmail: string }) {
    try {
        // Aquí podrías conectarlo a un servicio como Resend/Nodemailer para que te llegue un correo,
        // o guardarlo en una tabla 'Tickets' en la BD.
        // Por ahora simularemos el procesamiento exitoso.
        console.log(`🎟️ NUEVO TICKET DE SOPORTE de ${data.userEmail}`);
        console.log(`Asunto: ${data.subject}`);
        console.log(`Descripción: ${data.description}`);

        // Simulamos un ligero delay de red
        await new Promise(resolve => setTimeout(resolve, 800));

        return { success: true };
    } catch (error) {
        return { success: false, message: "Error de red al enviar el ticket." };
    }
}