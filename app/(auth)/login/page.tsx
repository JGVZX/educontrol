'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, User, ArrowRight, Loader2, ShieldCheck, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';

// IMPORTACIONES REALES
import { useUser } from '@/context/UserContext';
import { authenticateUser } from '@/app/actions/auth'; // Server Action que conecta con PostgreSQL

function LoginForm() {
  const { login } = useUser(); // Usamos el contexto para guardar la sesión
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // Estado para errores reales

  // 1. DETECCIÓN VISUAL (y de seguridad)
  const roleParam = searchParams.get('role');
  const isAdminTheme = roleParam === 'admin'; 

  // 2. CONFIGURACIÓN VISUAL DINÁMICA
  const config = isAdminTheme ? {
    theme: 'admin',
    title: "Acceso Directivo",
    subtitle: "Panel de control administrativo e institucional",
    accentColor: "text-slate-900",
    buttonColor: "bg-slate-900 hover:bg-slate-800",
    ringColor: "focus:ring-slate-900/20",
    borderColor: "focus:border-slate-900",
    visualBg: "bg-slate-900",
    visualGradient: "from-slate-800 to-slate-950",
    visualIcon: ShieldCheck,
    visualTitle: "Gestión Institucional",
    visualText: "Supervise el rendimiento académico, gestione la nómina docente y mantenga el control total con seguridad de nivel empresarial.",
    features: ["Auditoría de Notas", "Gestión de Personal", "Reportes Oficiales"]
  } : {
    theme: 'docente',
    title: "Hola, Profesor",
    subtitle: "Inicie sesión para gestionar su aula virtual",
    accentColor: "text-blue-600",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    ringColor: "focus:ring-blue-600/20",
    borderColor: "focus:border-blue-600",
    visualBg: "bg-blue-600",
    visualGradient: "from-blue-600 to-indigo-700",
    visualIcon: GraduationCap,
    visualTitle: "Excelencia Académica",
    visualText: "Plataforma optimizada para docentes. Registre calificaciones, controle asistencia y genere reportes automáticos.",
    features: ["Cálculo Automático", "Historial de Asistencia", "Expedientes"]
  };

  // 3. LÓGICA DE LOGIN REAL CON BASE DE DATOS
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    
    // Llamada al Server Action (PostgreSQL)
    const result = await authenticateUser(formData);

    if (result.success && result.user) {
        // ¡ÉXITO! El contexto maneja la redirección al dashboard
        login(result.user as any);
    } else {
        // ERROR
        setError(result.message || 'Credenciales inválidas');
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      
      {/* IZQUIERDA: FORMULARIO */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 md:p-12 lg:p-16 xl:p-24 bg-white z-10 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold transition-colors ${isAdminTheme ? 'bg-slate-900' : 'bg-blue-600'}`}>
                    E
                </div>
                <span className="font-bold text-slate-700 text-lg">EduControl</span>
            </Link>
        </div>

        {/* Formulario */}
        <div className="max-w-sm w-full mx-auto space-y-8">
            <div className="text-center lg:text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{config.title}</h1>
                <p className="text-slate-500">{config.subtitle}</p>
            </div>

            {/* Mensaje de Error Real */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} className="shrink-0" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                
                {/* 🛡️ INPUT OCULTO: Define el portal por el que intentan entrar */}
                <input 
                    type="hidden" 
                    name="portalType" 
                    value={isAdminTheme ? 'admin' : 'docente'} 
                />

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Correo Institucional</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            name="email" // IMPORTANTE PARA EL SERVER ACTION
                            type="email" 
                            required 
                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all font-medium text-slate-900 ${config.borderColor} ${config.ringColor} focus:ring-4`}
                            placeholder="usuario@educontrol.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            name="password" // IMPORTANTE PARA EL SERVER ACTION
                            type="password" 
                            required 
                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all font-medium text-slate-900 ${config.borderColor} ${config.ringColor} focus:ring-4`}
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                        <input type="checkbox" className={`rounded border-slate-300 focus:ring-0 ${config.accentColor}`} />
                        <span>Recordarme</span>
                    </label>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed ${config.buttonColor}`}
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : "Ingresar al Sistema"} 
                    {!isLoading && <ArrowRight size={20} />}
                </button>

            <div className="flex items-center justify-between text-sm">
    
    
    {/* AQUÍ ESTÁ EL NUEVO ENLACE */}
    <Link href="/recuperar" className={`font-semibold hover:underline ${config.accentColor}`}>
        ¿Olvidó su contraseña?
    </Link>
</div>

            </form>

            <div className="pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-sm mb-4">¿Cambiar de vista?</p>
                <Link 
                    href={isAdminTheme ? "/login?role=docente" : "/login?role=admin"}
                    className={`inline-flex items-center gap-2 px-6 py-2 rounded-full border font-semibold text-sm transition-all hover:bg-slate-50 ${isAdminTheme ? 'border-slate-200 text-slate-600' : 'border-blue-100 text-blue-600 bg-blue-50'}`}
                >
                    Ver como {isAdminTheme ? "Docente" : "Administrador"}
                </Link>
            </div>
        </div>

        {/* Footer */}
        <div className="text-center lg:text-left text-xs text-slate-400 mt-8">
            © 2026 EduControl. Conexión Segura v1.0
        </div>
      </div>

      {/* DERECHA: VISUAL (Oculto en móvil) */}
      <div className={`hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br ${config.visualGradient} text-white p-16 flex-col justify-center items-start transition-colors duration-700`}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 max-w-xl">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-2xl border border-white/20">
                <config.visualIcon size={40} className="text-white" />
            </div>

            <h2 className="text-4xl font-bold mb-6 leading-tight">{config.visualTitle}</h2>
            <p className="text-lg text-white/80 mb-10 leading-relaxed">
                {config.visualText}
            </p>

            <div className="space-y-4">
                {config.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="p-1 rounded-full bg-green-400/20 text-green-300">
                            <CheckCircle2 size={16} />
                        </div>
                        <span className="font-medium text-white/90">{feature}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" /></div>}>
      <LoginForm />
    </Suspense>
  );
}