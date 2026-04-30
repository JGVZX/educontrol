'use client';

/**
 * Centro de Reportes e Inteligencia Académica - EduControl
 * @description Generación de documentos oficiales, analítica de riesgo y soporte técnico.
 * @author Jose Junior Guzmán Veloz
 * @context Fase Final - Proyecto de Tesis
 */

import { useState, useEffect } from 'react';
import { 
  FileText, Printer, Download, Users, TrendingDown, 
  ShieldAlert, CheckCircle2, Search, FileBadge, Loader2,
  LifeBuoy, Send, MessageSquare, ShieldCheck, History, AlertTriangle,
  Fingerprint, Layout, BookOpen, GraduationCap
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { 
    getDirectorReports, 
    getTeacherSubjectsForReports, 
    getStudentForCertificate, 
    submitSupportTicket,
    getSupportTickets // Asumimos esta nueva acción para el Admin
} from './actions';

export default function ReportsPage() {
  const { user, role } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [adminTickets, setAdminTickets] = useState<any[]>([]);

  // Estados para Búsqueda (Secretaria/Director)
  const [searchId, setSearchId] = useState(''); // Ahora busca por RNE o Folio
  const [certStudent, setCertStudent] = useState<any>(null);

  // Estados para Soporte
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [showSuccessUI, setShowSuccessUI] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (role === 'DIRECTOR' || role === 'SECRETARIA') {
        const res = await getDirectorReports();
        setData(res);
      } else if (role === 'DOCENTE' && user?.email) {
        const res = await getTeacherSubjectsForReports(user.email);
        setData(res);
      } else if (role === 'ADMIN_SISTEMA') {
        const tickets = await getSupportTickets();
        setAdminTickets(tickets);
      }
      setLoading(false);
    }
    load();
  }, [role, user]);

  // --- 🖨️ MOTOR DE IMPRESIÓN PDF PROFESIONAL ---
  const printDoc = (type: string, payload: any) => {
    const win = window.open('', '_blank');
    if (!win) return alert("Por favor, permite las ventanas emergentes.");

    const today = new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const printStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
        body { font-family: 'Montserrat', sans-serif; margin: 0; padding: 50px; color: #0f172a; line-height: 1.6; }
        .header { text-align: center; border-bottom: 4px double #1e293b; padding-bottom: 20px; margin-bottom: 40px; position: relative; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
        .header h2 { margin: 5px 0 0 0; font-size: 14px; color: #2563eb; letter-spacing: 3px; font-weight: 700; }
        .header p { margin: 5px 0 0 0; font-size: 11px; color: #64748b; text-transform: uppercase; }
        .content { margin-top: 30px; }
        .title { text-align: center; font-size: 20px; font-weight: 900; text-decoration: underline; margin-bottom: 40px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f1f5f9; padding: 12px; font-size: 10px; text-transform: uppercase; border: 1px solid #cbd5e1; }
        td { padding: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
        .footer { margin-top: 100px; display: flex; justify-content: space-around; text-align: center; }
        .sign-box { border-top: 2px solid #0f172a; width: 250px; padding-top: 10px; font-size: 12px; font-weight: 700; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.03); z-index: -1; font-weight: 900; }
      </style>
    `;

    let content = '';

    // 1. CONSTANCIA OFICIAL (SECRETARIA/DIRECTOR)
    if (type === 'CERTIFICADO') {
      content = `
        <div class="watermark">EDUCONTROL</div>
        <div class="header">
          <h1>Centro Educativo Federico Augusto Villa Tapia</h1>
          <h2>EDUCONTROL SYSTEM</h2>
          <p>Distrito Educativo 07-07 • Gestión de Excelencia Académica</p>
        </div>
        <div class="content">
          <div class="title">CONSTANCIA DE ESTUDIOS OFICIAL</div>
          <p style="text-align: right; font-weight: 700;">Fecha: ${today}</p>
          <p>A QUIEN PUEDA INTERESAR:</p>
          <p style="text-indent: 50px; text-align: justify;">
            Quien suscribe, la Dirección del <b>Centro Educativo Federico Augusto Villa Tapia</b>, por medio de la presente CERTIFICA que el/la estudiante 
            <b style="text-transform: uppercase; font-size: 16px;">${payload.nombre} ${payload.apellido}</b>, 
            portador(a) del Registro Nacional de Estudiante <b style="color: #2563eb;">RNE: ${payload.rne}</b> y registrado bajo el 
            <b style="color: #2563eb;">Folio No. ${payload.folio}</b>, se encuentra debidamente inscrito(a) en este centro educativo cursando el grado 
            <b>${payload.course?.name || 'No Definido'}</b> correspondiente al Año Escolar 2025-2026.
          </p>
          <p style="text-indent: 50px; text-align: justify;">
            Se hace constar que el referido estudiante mantiene un estatus <b>${payload.estatus}</b> y cumple con los requerimientos académicos establecidos por el Ministerio de Educación de la República Dominicana (MINERD).
          </p>
          <p>La presente se expide a solicitud de la parte interesada en Villa Tapia, República Dominicana.</p>
        </div>
        <div class="footer">
          <div class="sign-box">Dirección Académica<br><span style="font-weight: 400; font-size: 10px;">Firma y Sello</span></div>
          <div class="sign-box">Secretaría Docente<br><span style="font-weight: 400; font-size: 10px;">Firma y Sello</span></div>
        </div>
      `;
    }

    // 2. REPORTE DE RIESGO (DIRECTOR)
    if (type === 'RIESGO') {
        const rows = payload.map((s:any) => `
            <tr>
                <td style="font-weight: 900;">${s.rne}</td>
                <td>${s.nombre}</td>
                <td>${s.curso}</td>
                <td style="color: #ef4444; font-weight: 900;">${s.asignaturaCritica}</td>
                <td style="text-align: center; font-weight: 900;">${s.promedio}</td>
            </tr>
        `).join('');

        content = `
            <div class="header">
                <h1>Centro Educativo Federico Augusto Villa Tapia</h1>
                <h2>REPORTE DE ALERTA ACADÉMICA</h2>
            </div>
            <p>Este documento identifica a los estudiantes con rendimiento inferior a los 70 puntos (Riesgo Crítico).</p>
            <table>
                <thead>
                    <tr>
                        <th>RNE</th>
                        <th>Estudiante</th>
                        <th>Curso</th>
                        <th>Asignatura en Riesgo</th>
                        <th>Promedio</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    win.document.write(`<html><head>${printStyles}</head><body>${content}</body><script>window.onload = () => { window.print(); }</script></html>`);
    win.document.close();
  };

  const searchStudent = async () => {
    if(!searchId) return;
    const st = await getStudentForCertificate(searchId);
    if (st) setCertStudent(st);
    else alert("No se encontró registro con el RNE o Folio proporcionado.");
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTicket(true);
    const res = await submitSupportTicket({ subject: ticketSubject, description: ticketDesc, userEmail: user?.email || '', userName: user?.nombre || ''});
    setIsSubmittingTicket(false);
    if (res.success) {
      setShowSuccessUI(true);
      setTicketSubject('');
      setTicketDesc('');
      setTimeout(() => setShowSuccessUI(false), 5000);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto">
      
      {/* SECCIÓN 1: VISTA PARA ADMINISTRADOR (SOPORTE IT CENTRAL) */}
      {role === 'ADMIN_SISTEMA' && (
        <div className="space-y-8">
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 opacity-10 pointer-events-none transform rotate-12"><LifeBuoy size={300}/></div>
                <h1 className="text-5xl font-black tracking-tighter mb-4 flex items-center gap-4"><ShieldCheck className="text-blue-500" size={48}/> Consola de Operaciones IT</h1>
                <p className="text-slate-400 text-lg">Monitoreo de incidencias y reportes técnicos enviados por los usuarios del sistema.</p>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-black text-xl flex items-center gap-3 text-slate-800"><History size={24} className="text-blue-600"/> Historial de Incidencias</h3>
                    <span className="px-4 py-2 bg-slate-100 text-[10px] font-black uppercase rounded-full text-slate-500 tracking-widest">{adminTickets.length} Reportes Pendientes</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Usuario / Rol</th>
                                <th className="px-8 py-5">Asunto de Incidencia</th>
                                <th className="px-8 py-5">Descripción</th>
                                <th className="px-8 py-5">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {adminTickets.map((t:any) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <p className="font-bold text-slate-800">{t.userName}</p>
                                        <p className="text-[10px] font-medium text-slate-400">{t.userEmail}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{t.subject}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-xs text-slate-600 max-w-xs truncate" title={t.description}>{t.description}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-widest">
                                            <AlertTriangle size={14}/> Pendiente
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* SECCIÓN 2: VISTA PARA DIRECTOR / DOCENTE / SECRETARIA */}
      {role !== 'ADMIN_SISTEMA' && (
        <>
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none transform rotate-12"><Printer size={250}/></div>
                <div className="relative z-10">
                    <h1 className="text-5xl font-black tracking-tighter mb-2">Centro de Reportes</h1>
                    <p className="text-slate-400 font-medium text-lg">Emisión de documentos oficiales y gestión de incidencias.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* BÚSQUEDA DE DOCUMENTACIÓN (RNE / FOLIO) */}
                    {(role === 'DIRECTOR' || role === 'SECRETARIA') && (
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FileBadge size={28}/></div>
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 tracking-tight">Constancias y Certificados</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Busque por RNE o Folio Único</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 mb-8 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                                    <input 
                                        type="text" placeholder="Ingrese RNE o No. de Folio..."
                                        value={searchId} onChange={(e) => setSearchId(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                                <button onClick={searchStudent} className="px-10 py-4 bg-slate-900 text-white font-black text-xs uppercase rounded-2xl hover:scale-105 active:scale-95 transition-all">Buscar Estudiante</button>
                            </div>

                            {certStudent && (
                                <div className="p-8 bg-white rounded-[2.5rem] border-2 border-blue-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-blue-500/5">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-xl">{certStudent.nombre[0]}</div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-xl">{certStudent.nombre} {certStudent.apellido}</h4>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="px-3 py-1 bg-slate-100 text-[9px] font-black uppercase text-slate-500 rounded-lg border border-slate-200 flex items-center gap-1"><Fingerprint size={12}/> RNE: {certStudent.rne}</span>
                                                <span className="px-3 py-1 bg-slate-100 text-[9px] font-black uppercase text-slate-500 rounded-lg border border-slate-200 flex items-center gap-1"><Layout size={12}/> Folio: {certStudent.folio}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => printDoc('CERTIFICADO', certStudent)} className="px-8 py-4 bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl hover:bg-blue-700 shadow-lg flex items-center gap-2">
                                        <Printer size={16}/> Generar Documento
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* REPORTES DE DOCENTE */}
                    {role === 'DOCENTE' && data && (
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                            <h3 className="font-black text-lg mb-8 flex items-center gap-3 text-slate-800"><BookOpen className="text-blue-600"/> Gestión de Aula y Alumnos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {data.map((sub: any) => (
                                    <div key={sub.id} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 group hover:border-blue-500 transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm"><GraduationCap size={20}/></div>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase rounded-full">{sub.studentCount} Estudiantes</span>
                                        </div>
                                        <h4 className="font-black text-slate-800 text-lg leading-tight">{sub.name}</h4>
                                        <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">{sub.courseName}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => printDoc('LISTA_ASISTENCIA', sub)} className="py-3 bg-white border border-slate-200 text-slate-600 text-[9px] font-black uppercase rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"><Printer size={14}/> Asistencia</button>
                                            <button className="py-3 bg-white border border-slate-200 text-slate-600 text-[9px] font-black uppercase rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"><FileText size={14}/> Notas</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* REPORTE DE RIESGO ACADÉMICO (SOLO DIRECTOR) */}
                    {role === 'DIRECTOR' && data && (
                        <div className="bg-rose-50 p-10 rounded-[3rem] border border-rose-100 shadow-sm animate-in zoom-in-95">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl"><TrendingDown size={32}/></div>
                                    <div>
                                        <h3 className="font-black text-2xl text-rose-900 tracking-tight">Auditoría de Riesgo</h3>
                                        <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mt-1">Detección de Bajo Rendimiento</p>
                                    </div>
                                </div>
                                <button onClick={() => printDoc('RIESGO', data.failingList)} className="px-8 py-4 bg-rose-600 text-white font-black text-xs uppercase rounded-2xl hover:bg-rose-700 shadow-xl shadow-rose-500/20 flex items-center gap-2">
                                    <Download size={18}/> Bajar Listado
                                </button>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] p-6 border border-rose-100 flex items-center gap-8">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total en Riesgo</p>
                                    <h4 className="text-4xl font-black text-rose-600">{data.failingCount}</h4>
                                </div>
                                <div className="h-10 w-px bg-rose-200 hidden md:block"></div>
                                <p className="text-sm text-rose-800/70 font-medium">Este listado identifica estudiantes con promedios por debajo de 70 puntos para intervención inmediata.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- SOPORTE IT (TODOS LOS USUARIOS) --- */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl h-full flex flex-col border border-slate-800">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-white/10 rounded-2xl"><LifeBuoy size={24} className="text-blue-400"/></div>
                            <div>
                                <h3 className="font-black text-xl tracking-tight">Soporte Técnico</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviar incidencia al NOC</p>
                            </div>
                        </div>

                        {showSuccessUI ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                                    <CheckCircle2 size={40} className="text-emerald-400" />
                                </div>
                                <h4 className="font-black text-2xl mb-2">¡Reporte Enviado!</h4>
                                <p className="text-sm text-slate-400 mb-8">El administrador ha sido notificado.</p>
                                <button onClick={() => setShowSuccessUI(false)} className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-white/20 transition-all">Nuevo Reporte</button>
                            </div>
                        ) : (
                            <form onSubmit={handleTicketSubmit} className="space-y-5 flex-1 flex flex-col">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Tipo de Problema</label>
                                    <select 
                                        required value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)}
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white outline-none focus:border-blue-500 appearance-none cursor-pointer transition-all"
                                    >
                                        <option value="" className="text-slate-900">Seleccionar...</option>
                                        <option value="Error de Calificaciones" className="text-slate-900">Error en Notas</option>
                                        <option value="Acceso / Permisos" className="text-slate-900">Acceso Denegado</option>
                                        <option value="Fallo del Sistema" className="text-slate-900">Sistema Lento</option>
                                        <option value="Otro" className="text-slate-900">Otro</option>
                                    </select>
                                </div>
                                <div className="space-y-2 flex-1 flex flex-col">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Descripción</label>
                                    <textarea 
                                        required rows={6} value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)}
                                        placeholder="Describa el inconveniente..."
                                        className="w-full flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white outline-none focus:border-blue-500 transition-all resize-none"
                                    />
                                </div>
                                <button 
                                    type="submit" disabled={isSubmittingTicket}
                                    className="w-full py-5 bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl hover:bg-blue-500 shadow-2xl transition-all flex items-center justify-center gap-3 mt-4"
                                >
                                    {isSubmittingTicket ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                                    {isSubmittingTicket ? 'Procesando...' : 'Enviar a Sistemas'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
}