import { generateText } from 'ai';
import { createHuggingFace } from '@ai-sdk/huggingface';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { messages, userEmail } = await req.json();
    const token = process.env.HUGGINGFACE_API_KEY;

    // 1. OBTENER EL CONTEXTO REAL DE LA BASE DE DATOS
    const [stats, cursos, ticketsPendientes, usuarioActual] = await Promise.all([
      // Estadísticas generales
      prisma.student.count({ where: { estatus: 'ACTIVO', isDeleted: false } }),
      // Cursos y sus secciones
      prisma.course.findMany({ 
        select: { name: true, section: true, _count: { select: { students: true } } } 
      }),
      // Soporte técnico activo
      prisma.ticket.count({ where: { status: 'PENDIENTE' } }),
      // Datos del usuario que está chateando
      prisma.user.findUnique({ 
        where: { email: userEmail },
        include: { subjects: true } 
      })
    ]);

    // 2. DEFINIR EL "CONOCIMIENTO" DEL SISTEMA
    const systemInstruction = `
      Eres EduAI, el asistente experto del sistema de gestión escolar "EduControl".
      
      DATOS ACTUALES DEL SISTEMA:
      - Estudiantes Activos: ${stats}
      - Cursos en el sistema: ${cursos.map(c => `${c.name} ${c.section} (${c._count.students} alumnos)`).join(', ')}
      - Soporte Técnico: Hay ${ticketsPendientes} tickets pendientes de revisión.
      - Usuario actual: ${usuarioActual?.nombre} ${usuarioActual?.apellido} (Rol: ${usuarioActual?.role}).
      - Materias que imparte este usuario: ${usuarioActual?.subjects.map(s => s.name).join(', ') || 'Ninguna'}.

      CONOCIMIENTO TÉCNICO DE TU ESTRUCTURA (TABLAS):
      - Manejas 'RA' (Resultados de Aprendizaje) con pesos específicos para calificaciones técnicas.
      - Tienes un módulo de 'Observations' para seguimientos académicos, disciplinarios y médicos.
      - El sistema de 'Grades' incluye: Disciplina, Tarea, Práctica, Teoría y Examen Final.
      - Los 'Tickets' (Módulo NOC) gestionan incidencias con prioridad Alta, Media y Baja.

      INSTRUCCIONES:
      - Si el usuario te pregunta "¿Cuántos alumnos tengo?", responde usando los datos de 'Cursos' arriba.
      - Si te piden consejos pedagógicos, enfócate en el currículo dominicano y los RA.
      - Siempre mantén un tono profesional y motivador.
    `;

    const hf = createHuggingFace({ apiKey: token });

    const { text } = await generateText({
      model: hf('meta-llama/Meta-Llama-3-8B-Instruct'),
      system: systemInstruction,
      prompt: messages[messages.length - 1].content,
    });

    return new Response(text);

  } catch (error: any) {
    console.error("Error EduAI:", error);
    return new Response(`Error: ${error.message}`, { status: 200 });
  }
}