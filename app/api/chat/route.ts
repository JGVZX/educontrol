import OpenAI from "openai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Inicializamos la conexión a Groq usando el SDK de OpenAI
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY as string,
  baseURL: "https://api.groq.com/openai/v1",
});

// Definición de herramientas compatible con el estándar de OpenAI/Groq
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "consultar_base_datos",
      description: "Accede a la información de EduControl: Estudiantes, Calificaciones, Asistencia, Horarios, y Tickets.",
      parameters: {
        type: "object",
        properties: {
          accion: {
            type: "string",
            description: "Lo que se busca: 'alumno', 'curso', 'asistencia', 'horario', 'tickets', 'estadisticas'.",
          },
          filtro: {
            type: "string",
            description: "Nombre del alumno, RNE, ID de curso o asignatura específica.",
          },
        },
        required: ["accion", "filtro"],
      },
    }
  }
];

export async function POST(req: Request) {
  try {
    const { message, history, userRole, userName } = await req.json();

    // Instrucción de sistema para definir la personalidad de Jimmy
    const systemInstruction = `Eres Jimmy, el asistente de IA oficial de EduControl. Atiendes a ${userName} con el rol de ${userRole}.
    REGLA: Si te piden datos del colegio (notas, alumnos, etc.), DEBES usar la herramienta 'consultar_base_datos'.
    Responde con profesionalidad dominicana y usa Markdown para que los datos se vean impecables.`;

    // Preparamos el historial de mensajes
    const messagesArray: any[] = [
      { role: "system", content: systemInstruction },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: "user", content: message }
    ];

    // 1. PRIMERA LLAMADA: Llama 3.3 decide si necesita la base de datos
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messagesArray,
      tools: tools,
      tool_choice: "auto",
      temperature: 0.1,
    });

    const responseMessage = response.choices[0].message;

    // Caso A: No requiere herramientas, responde directo
    if (!responseMessage.tool_calls) {
      return NextResponse.json({ reply: responseMessage.content });
    }

    // Caso B: Requiere consultar Prisma
    const toolCall = responseMessage.tool_calls[0];
    const { accion, filtro } = JSON.parse(toolCall.function.arguments);
    let toolResult: any;

    try {
      switch (accion) {
        case 'alumno':
          toolResult = await prisma.student.findMany({
            where: { OR: [{ nombre: { contains: filtro, mode: 'insensitive' } }, { rne: { contains: filtro, mode: 'insensitive' } }] },
            include: { course: true, grades: { include: { subject: true } }, attendance: { take: 5 } }
          });
          break;
        case 'curso':
          toolResult = await prisma.course.findMany({
            where: { name: { contains: filtro, mode: 'insensitive' } },
            include: { students: true, subjects: true }
          });
          break;
        case 'asistencia':
          toolResult = await prisma.attendance.findMany({
            where: { student: { nombre: { contains: filtro, mode: 'insensitive' } } },
            include: { student: true, subject: true },
            orderBy: { date: 'desc' },
            take: 10
          });
          break;
        case 'horario':
          toolResult = await prisma.schedule.findMany({
            where: { course: { name: { contains: filtro, mode: 'insensitive' } } },
            include: { subject: true, teacher: true }
          });
          break;
        case 'tickets':
          toolResult = await prisma.ticket.findMany({
            where: { status: 'PENDIENTE' },
            include: { docente: true }
          });
          break;
        case 'estadisticas':
          const [students, teachers, activeTickets] = await Promise.all([
            prisma.student.count(),
            prisma.user.count({ where: { role: 'DOCENTE' } }),
            prisma.ticket.count({ where: { status: 'PENDIENTE' } })
          ]);
          toolResult = { totalAlumnos: students, totalDocentes: teachers, ticketsPendientes: activeTickets };
          break;
        default:
          toolResult = { error: "Acción no reconocida." };
      }
    } catch (e) {
      toolResult = { error: "Fallo al consultar la base de datos." };
    }

    // Limpieza de datos para evitar errores con objetos Date
    const cleanResult = JSON.parse(JSON.stringify(toolResult));

    // 2. SEGUNDA LLAMADA: Enviamos el resultado de Prisma para la respuesta final
    messagesArray.push(responseMessage);
    messagesArray.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(cleanResult),
    });

    const secondResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messagesArray,
    });

    return NextResponse.json({ reply: secondResponse.choices[0].message.content });

  } catch (error: any) {
    console.error("JIMMY ERROR:", error);
    return NextResponse.json({ reply: "Lo siento, tengo un problema de conexión con mi motor de IA. ¿Podrías intentar de nuevo?" });
  }
}