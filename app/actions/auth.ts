'use server';

import { prisma } from '@/lib/prisma';
import { UserStatus } from '@prisma/client'; 
import * as bcrypt from 'bcrypt';

export async function authenticateUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const portalType = formData.get('portalType') as string; 

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    // ========================================================
    // 🛑 1. CANDADO DE SEGURIDAD: ESTADO DE LA CUENTA
    // ========================================================
    if (user.estado !== UserStatus.ACTIVO) {
      /* // 👇 HEMOS DESACTIVADO ESTO TEMPORALMENTE 👇
      if (user.estado === UserStatus.PENDIENTE) {
        return { 
          success: false, 
          message: 'Verificación requerida: Revise su correo electrónico (bandeja de entrada o spam) para activar su cuenta.' 
        };
      }
      */

      // La suspensión sí la dejamos activa por si acaso bloqueas a alguien
      if (user.estado === UserStatus.SUSPENDIDO) {
        return { 
          success: false, 
          message: 'Cuenta Suspendida: Por favor, póngase en contacto con la administración.' 
        };
      }
    }

    // Mantenemos tu validación original de isActive por retrocompatibilidad
    if (!user.isActive) {
       return { success: false, message: 'Esta cuenta está desactivada. Contacte soporte.' };
    }

    // ========================================================
    // 🔒 2. VALIDACIÓN DE CONTRASEÑA ENCRIPTADA
    // ========================================================
    let isPasswordValid = false;

    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
        isPasswordValid = (user.password === password);
    }

    if (!isPasswordValid) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }

    // --- 🛡️ VALIDACIÓN ESTRICTA DE ROLES ---
    const adminRoles = ['DIRECTOR', 'ADMIN_SISTEMA', 'SECRETARIA'];

    if (portalType === 'admin') {
       if (!adminRoles.includes(user.role)) {
           return { 
               success: false, 
               message: 'Acceso Denegado: Su cuenta es de Docente. Por favor, cambie a la vista de Docente para ingresar.' 
           };
       }
    } else if (portalType === 'docente') {
       if (user.role !== 'DOCENTE' && !adminRoles.includes(user.role)) {
           return { 
               success: false, 
               message: 'Acceso Denegado: Su cuenta es Administrativa. Por favor, cambie a la vista Directiva para ingresar.' 
           };
       }
    }

    return { 
      success: true, 
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        estado: user.estado
      }
    };

  } catch (error) {
    console.error("Error en el servidor:", error);
    return { success: false, message: 'Error de conexión con la base de datos.' };
  }
}