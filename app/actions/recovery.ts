'use server';

import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// CONFIGURACIÓN DEL TRANSPORTE DE CORREO
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// FUNCIÓN AUXILIAR PARA ENVIAR EL EMAIL
async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"EduControl Seguridad" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error enviando correo:", error);
    return false;
  }
}

// 1. GENERAR Y ENVIAR CÓDIGO
export async function sendVerificationCode(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Si el usuario no existe, simulamos éxito por seguridad
    if (!user) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, role: null }; 
    }

    // Diferenciar seguridad según rol
    const isAdmin = ['DIRECTOR', 'ADMIN_SISTEMA', 'SECRETARIA'].includes(user.role);
    
    // Generar Token
    let token = '';
    if (isAdmin) {
      token = crypto.randomBytes(4).toString('hex').toUpperCase(); // Ej: A1B2-C3D4
    } else {
      token = Math.floor(100000 + Math.random() * 900000).toString(); // Ej: 123456
    }

    // Expiración
    const expireMinutes = isAdmin ? 10 : 30;
    const expires = new Date(new Date().getTime() + expireMinutes * 60 * 1000);

    // ✅ SOLUCIÓN: Guardar en Base de Datos actualizando el usuario
    await prisma.user.update({
      where: { email },
      data: { 
        verificationToken: token,
        tokenExpires: expires
      }
    });

    // Diseño del Correo HTML
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: ${isAdmin ? '#0f172a' : '#2563eb'};">
          ${isAdmin ? '🛡️ ALERTA DE SEGURIDAD' : 'Recuperación de Contraseña'}
        </h2>
        <p>Hola <b>${user.nombre}</b>,</p>
        <p>Usa el siguiente código para restablecer tu acceso:</p>
        <div style="background: #f4f4f5; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #000;">${token}</span>
        </div>
        <p style="font-size: 12px; color: #666;">Expira en ${expireMinutes} minutos.</p>
      </div>
    `;

    // Enviar Correo Real
    const emailSent = await sendEmail(
      email,
      isAdmin ? '🚨 EduControl: Código de Seguridad' : 'Código de Recuperación',
      htmlContent
    );

    if (!emailSent) {
        return { success: false, message: 'Error al enviar el correo. Verifique su conexión.' };
    }

    return { success: true, role: user.role };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error del sistema.' };
  }
}

// 2. VERIFICAR CÓDIGO
export async function verifyResetCode(email: string, code: string) {
  try {
    // ✅ SOLUCIÓN: Buscar directamente en el modelo de usuario
    const user = await prisma.user.findFirst({
      where: { 
        email: email, 
        verificationToken: code 
      }
    });

    if (!user) return { success: false, message: 'Código inválido.' };
    
    if (user.tokenExpires && new Date() > user.tokenExpires) {
      return { success: false, message: 'El código ha expirado.' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: 'Error de verificación.' };
  }
}

// 3. CAMBIAR CONTRASEÑA
export async function resetPasswordWithCode(email: string, code: string, newPassword: string) {
  try {
    const check = await verifyResetCode(email, code);
    if (!check.success) return check;

    // ✅ SOLUCIÓN: Actualizar contraseña y borrar el token usado de una sola vez
    await prisma.user.update({
      where: { email },
      data: { 
        password: newPassword,
        verificationToken: null, // Borramos el token para que no se re-utilice
        tokenExpires: null
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: 'Error al actualizar contraseña.' };
  }
}