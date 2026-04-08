import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import {prisma} from '@/lib/prisma';

export async function POST() {
  console.log("🚀 1. Iniciando proceso de Backup...");
  
  try {
    console.log("🔍 2. Consultando la base de datos con Prisma...");
    const [estudiantes, asistencias, calificaciones, usuarios] = await Promise.all([
      prisma.student.findMany(),
      prisma.attendance.findMany(),
      prisma.grade.findMany(),
      prisma.user.findMany(),
    ]);
    console.log(`✅ 3. Datos extraídos: ${estudiantes.length} estudiantes encontrados.`);

    // Verificación crítica de seguridad
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.log("❌ ERROR FATAL: Next.js no está detectando tu BLOB_READ_WRITE_TOKEN en el archivo .env");
      return NextResponse.json({ success: false, error: "Falta el token de Vercel" }, { status: 500 });
    }

    const backupData = JSON.stringify({
      datos: { estudiantes, asistencias, calificaciones, usuarios }
    });

    const nombreArchivo = `backups/respaldo_${Date.now()}.json`;

    console.log("☁️ 4. Enviando archivo a Vercel Blob...");
    const blob = await put(nombreArchivo, backupData, {
      access: 'public',
      contentType: 'application/json',
    });

    console.log("🎉 5. ¡Subida exitosa! URL:", blob.url);
    
    return NextResponse.json({ 
      success: true, 
      urlDescarga: blob.url 
    }, { status: 200 });

  } catch (error) {
    console.error("🔥 ERROR CRÍTICO AL SUBIR A VERCEL:", error);
    // Devolvemos el error real al navegador para poder leerlo
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}