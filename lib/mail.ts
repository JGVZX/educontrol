// lib/mail.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"EduControl Admin" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Correo enviado: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Error al enviar correo:", error);
    return { success: false, error };
  }
}