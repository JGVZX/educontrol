'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// 👇 ATENCIÓN: Asegúrate de que esta ruta apunte correctamente a tu archivo actions.ts
import { verifyAccountToken } from '@/app/dashboard/administracion/actions';

function VerificacionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    // Si alguien entra a la página sin un token en la URL (ej. misitio.com/verificar)
    if (!token) {
      setStatus('error');
      setMessage('No se encontró ningún código de verificación válido en el enlace.');
      return;
    }

    // Llamamos a nuestro Server Action para validar el token
    verifyAccountToken(token)
      .then((res) => {
        if (res.success) {
          setStatus('success');
          setMessage(res.message);
        } else {
          setStatus('error');
          setMessage(res.message);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Error de conexión con el servidor. Inténtalo de nuevo.');
      });
  }, [token]);

  return (
    <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
      
      {/* --- ESTADO: CARGANDO --- */}
      {status === 'loading' && (
        <div className="flex flex-col items-center animate-in fade-in duration-500">
          <Loader2 className="animate-spin text-blue-600 mb-6" size={56} />
          <h2 className="text-xl font-bold text-slate-800">Validando credenciales...</h2>
          <p className="text-slate-500 mt-2 text-sm">Estamos activando tu acceso al sistema, por favor espera un momento.</p>
        </div>
      )}

      {/* --- ESTADO: ÉXITO --- */}
      {status === 'success' && (
        <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">¡Cuenta Activada!</h2>
          <p className="text-slate-500 mb-8">{message}</p>
          
          <Link 
            href="/login" 
            className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white py-4 px-6 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Ir al inicio de sesión <ArrowRight size={20} />
          </Link>
        </div>
      )}

      {/* --- ESTADO: ERROR --- */}
      {status === 'error' && (
        <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <XCircle size={48} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Verificación Fallida</h2>
          <p className="text-slate-500 mb-8">{message}</p>
          
          <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
            Si crees que esto es un error o tu enlace expiró, por favor contacta con la administración del sistema escolar para que te envíen un nuevo acceso.
          </div>
        </div>
      )}
    </div>
  );
}

// Next.js requiere envolver useSearchParams en un Suspense para optimización de rutas
export default function VerificarPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-100">
      <Suspense fallback={
        <div className="flex flex-col items-center">
           <div className="animate-pulse w-16 h-16 bg-blue-200 rounded-full mb-4"></div>
           <p className="text-slate-400 font-medium">Cargando sistema de seguridad...</p>
        </div>
      }>
        <VerificacionContent />
      </Suspense>
    </div>
  );
}