'use server';

import { prisma } from '@/lib/prisma';

// ==========================================
// 1. DATOS PARA DIRECTOR (Analítica Global y Riesgo)
// ==========================================
export async function getDirectorReports() {
  try {
    // 1. Totales (Solo alumnos activos y no borrados)
    const totalStudents = await prisma.student.count({
        where: { isDeleted: false, estatus: 'ACTIVO' }
    });
    
    // 2. Alumnos en Riesgo (Promedio menor a 70)
    // Incluimos 'grades' y 'subject' para detectar exactamente en qué materia están fallando.
    const failingStudents = await prisma.student.findMany({
      where: {
          isDeleted: false,
          estatus: 'ACTIVO',
          promedio: { lt: 70, gt: 0 } 
      },
      include: { 
          course: true,
          grades: {
              include: { subject: true }
          }
      },
      orderBy: { promedio: 'asc' } // Los más críticos primero
    });

    // Mapeamos para el reporte PDF y extraemos la Asignatura Crítica
    const failingList = failingStudents.map(s => {
        let asignaturaCritica = 'Múltiples Deficiencias';
        
        // Algoritmo para encontrar la materia con la nota más baja
        if (s.grades && s.grades.length > 0) {
            const notasReprobadas = s.grades.filter(g => g.final !== null && g.final < 70);
            if (notasReprobadas.length > 0) {
                const peorNota = notasReprobadas.reduce((prev, curr) => (curr.final! < prev.final!) ? curr : prev);
                asignaturaCritica = peorNota.subject?.name || 'No Especificada';
            }
        }

        return {
            id: s.id,
            rne: s.rne || 'SIN RNE',
            nombre: `${s.nombre} ${s.apellido}`,
            curso: s.course?.name || 'Sin Curso',
            asignaturaCritica: asignaturaCritica,
            promedio: s.promedio
        };
    });

    return {
      totalStudents,
      failingCount: failingStudents.length,
      failingList
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
                          students: {
                              where: { isDeleted: false, estatus: 'ACTIVO' },
                              orderBy: { apellido: 'asc' } 
                          }
                      }
                  } 
              } 
          } 
      }
    });

    if (!user) return [];

    const subjects = user.subjects.map((sub) => {
        return {
            id: sub.id,
            name: sub.name,
            courseName: sub.course.name,
            studentCount: sub.course.students.length,
            // Lista plana para el PDF del docente
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
// 3. DATOS PARA SECRETARIA (Certificados por RNE / FOLIO)
// ==========================================
export async function getStudentForCertificate(searchId: string) {
  try {
    // Buscamos utilizando RNE o Folio de forma insensible a mayúsculas/minúsculas
    const student = await prisma.student.findFirst({
      where: { 
          isDeleted: false,
          OR: [
              { rne: { equals: searchId.trim(), mode: 'insensitive' } },
              { folio: { equals: searchId.trim(), mode: 'insensitive' } }
          ]
      },
      include: { course: true }
    });
    return student;
  } catch (error) {
    console.error("Error buscando certificado en el widget:", error);
    return null;
  }
}

// ==========================================
// 3.1 DATOS PARA IMPRESIÓN OFICIAL MINERD
// ==========================================
export async function getStudentReportData(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        course: true,
      }
    });
    return student;
  } catch (error) {
    console.error("Error obteniendo datos para el reporte de impresión:", error);
    return null;
  }
}

// ==========================================
// 4. SOPORTE TÉCNICO IT (Tickets NOC)
// ==========================================

// Variable temporal en memoria. 
// Esto evita que tengas que hacer una migración de Prisma a un día de tu tesis.
let mockSupportTickets = [
    { 
        id: 'tkt-001', 
        userName: 'María Fernández (Docente)', 
        userEmail: 'maria.docente@educontrol.do', 
        subject: 'Error de Calificaciones', 
        description: 'La auditoría me aparece bloqueada para el mes de Septiembre y no he ingresado notas.', 
        status: 'PENDIENTE', 
        createdAt: new Date() 
    },
    { 
        id: 'tkt-002', 
        userName: 'Luis Carlos (Director)', 
        userEmail: 'director@educontrol.do', 
        subject: 'Acceso / Permisos', 
        description: 'Necesito que se asigne un nuevo perfil de secretaria a la cuenta de recursos humanos.', 
        status: 'PENDIENTE', 
        createdAt: new Date() 
    }
];

export async function submitSupportTicket(data: { subject: string, description: string, userEmail: string, userName: string }) {
    try {
        console.log(`🎟️ TICKET NOC RECIBIDO de ${data.userEmail}`);

        // Agregamos el ticket al inicio de nuestra lista en memoria
        mockSupportTickets.unshift({
            id: `tkt-${Math.random().toString(36).substring(2, 9)}`,
            userName: data.userName || 'Usuario Desconocido',
            userEmail: data.userEmail,
            subject: data.subject,
            description: data.description,
            status: 'PENDIENTE',
            createdAt: new Date()
        });

        // Simulamos latencia de red para efecto realista en la UI
        await new Promise(resolve => setTimeout(resolve, 800));

        return { success: true };
    } catch (error) {
        return { success: false, message: "Error de red al enviar el ticket." };
    }
}

export async function getSupportTickets() {
    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockSupportTickets;
    } catch (error) {
        return [];
    }
}