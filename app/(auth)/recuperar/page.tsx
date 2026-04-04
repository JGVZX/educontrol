'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, KeyRound, Lock, ArrowRight, Loader2, CheckCircle2, 
  ShieldAlert, HelpCircle, Phone, Globe, ChevronLeft 
} from 'lucide-react';
import { sendVerificationCode, verifyResetCode, resetPasswordWithCode } from '@/app/actions/recovery';

export default function RecoverPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Datos
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  
  // Detectar rol para cambiar la dificultad visual
  const [detectedRole, setDetectedRole] = useState<string | null>(null);
  const isAdmin = detectedRole === 'DIRECTOR' || detectedRole === 'ADMIN_SISTEMA' || detectedRole === 'SECRETARIA';

  // --- HANDLERS ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    
    // Llamamos al servidor
    const res = await sendVerificationCode(email);
    
    if (res.success) {
      // Si el servidor detectó el usuario, avanzamos
      setDetectedRole(res.role || 'DOCENTE'); 
      setStep(2);
    } else {
      setError("No se pudo enviar el código. Verifique el correo o intente más tarde.");
    }
    setIsLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    const res = await verifyResetCode(email, code.trim());
    if (res.success) setStep(3);
    else setError(res.message || "Código incorrecto");
    setIsLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if(passwords.new !== passwords.confirm) return setError("Las contraseñas no coinciden");
    if(passwords.new.length < 6) return setError("La contraseña es muy corta");
    
    setIsLoading(true); setError('');
    const res = await resetPasswordWithCode(email, code.trim(), passwords.new);
    if (res.success) setStep(4);
    else setError(res.message || "Error al actualizar");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* 1. SIDEBAR IZQUIERDO (Info y Soporte) */}
      <div className={`hidden lg:flex w-1/3 p-12 flex-col justify-between text-white transition-colors duration-700
        ${isAdmin ? 'bg-slate-900' : 'bg-blue-600'}
      `}>
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center font-bold text-xl">E</div>
            <span className="font-bold text-xl tracking-tight">EduControl Soporte</span>
          </div>
          
          <h2 className="text-3xl font-bold mb-6">Centro de Seguridad</h2>
          <p className="text-white/80 mb-10 leading-relaxed">
            Sistema de verificación de identidad de dos factores.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1"><ShieldAlert className="text-white/70" /></div>
              <div>
                <h4 className="font-bold text-lg">Protección de Datos</h4>
                <p className="text-sm text-white/60">Sus credenciales están encriptadas.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-white/50 space-y-2">
          <div className="flex items-center gap-2"><Phone size={14}/> Soporte TI: (809) 555-0101</div>
          <div className="flex items-center gap-2"><Globe size={14}/> help.educontrol.com</div>
        </div>
      </div>

      {/* 2. AREA DEL FORMULARIO (DERECHA) */}
      <div className="w-full lg:w-2/3 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
            
            {/* Barra de Progreso Superior */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
               <div className={`h-full transition-all duration-500 ${isAdmin ? 'bg-slate-800' : 'bg-blue-600'}`} style={{width: `${step*25}%`}} />
            </div>

            <div className="mb-8">
               <h1 className="text-2xl font-bold text-slate-900">
                 {step===1 && "Recuperar Acceso"}
                 {step===2 && "Verificación de Identidad"}
                 {step===3 && "Nueva Contraseña"}
                 {step===4 && "¡Listo!"}
               </h1>
               <p className="text-slate-500 text-sm mt-2">
                 {step===1 && "Ingrese su correo institucional."}
                 {step===2 && "Ingrese el código enviado a su correo."}
                 {step===3 && "Cree una contraseña segura."}
               </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {/* --- PASO 1: EMAIL --- */}
            {step === 1 && (
              <form onSubmit={handleSend} className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Correo Electrónico</label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:border-blue-500 outline-none transition-all"
                      placeholder="usuario@educontrol.com"
                    />
                  </div>
                </div>
                <button disabled={isLoading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex justify-center items-center gap-2">
                  {isLoading ? <Loader2 className="animate-spin"/> : <>Buscar Cuenta <ArrowRight size={18}/></>}
                </button>
              </form>
            )}

            {/* --- PASO 2: CÓDIGO --- */}
            {step === 2 && (
              <form onSubmit={handleVerify} className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${isAdmin ? 'bg-slate-900 text-white border-slate-800' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
                  <ShieldAlert size={24} />
                  <div className="text-sm">
                    <p className="font-bold">Modo: {isAdmin ? 'Administrativo' : 'Docente'}</p>
                    <p className="opacity-80 text-xs">Código enviado a {email}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    {isAdmin ? 'Token de Seguridad' : 'Código de 6 dígitos'}
                  </label>
                  <div className="relative mt-2">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input type="text" required value={code} onChange={e=>setCode(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 outline-none transition-all font-mono text-lg font-bold tracking-widest uppercase"
                      placeholder={isAdmin ? "A1B2" : "000000"}
                    />
                  </div>
                </div>
                <button disabled={isLoading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex justify-center items-center gap-2">
                  {isLoading ? <Loader2 className="animate-spin"/> : "Verificar Código"}
                </button>
              </form>
            )}

            {/* --- PASO 3: PASSWORD --- */}
            {step === 3 && (
              <form onSubmit={handleReset} className="space-y-5 animate-in fade-in slide-in-from-right-8">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Nueva Contraseña</label>
                   <div className="relative mt-2">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                     <input type="password" required minLength={6} value={passwords.new} onChange={e=>setPasswords({...passwords, new:e.target.value})}
                       className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2"
                     />
                   </div>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Confirmar Contraseña</label>
                   <div className="relative mt-2">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                     <input type="password" required minLength={6} value={passwords.confirm} onChange={e=>setPasswords({...passwords, confirm:e.target.value})}
                       className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2"
                     />
                   </div>
                </div>
                <button disabled={isLoading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20">
                   {isLoading ? <Loader2 className="animate-spin"/> : "Guardar Cambios"}
                </button>
              </form>
            )}

            {/* --- PASO 4: ÉXITO --- */}
            {step === 4 && (
               <div className="text-center animate-in zoom-in-95">
                 <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                   <CheckCircle2 size={40} />
                 </div>
                 <p className="text-slate-600 mb-8 font-medium">Contraseña actualizada exitosamente.</p>
                 <Link href="/login" className="block w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all">
                   Ir al Login
                 </Link>
               </div>
            )}

            {/* BOTÓN VOLVER */}
            {step < 4 && (
              <button onClick={() => step===1 ? window.location.href='/login' : setStep(s=>s-1)} className="mt-8 mx-auto flex items-center gap-2 text-sm text-slate-400 hover:text-slate-800 transition-colors">
                <ChevronLeft size={16}/> {step===1 ? 'Cancelar' : 'Atrás'}
              </button>
            )}
        </div>
      </div>
    </div>
  );
}