'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Printer, Download, Users, TrendingDown, 
  ShieldAlert, CheckCircle2, Search, FileBadge, Loader2,
  LifeBuoy, Send, MessageSquare
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { getDirectorReports, getTeacherSubjectsForReports, getStudentForCertificate, submitSupportTicket } from './actions';

export default function ReportsPage() {
  const { user, role } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Estados para Secretaria
  const [matriculaSearch, setMatriculaSearch] = useState('');
  const [certStudent, setCertStudent] = useState<any>(null);

  // Estados para Soporte
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [showSuccessUI, setShowSuccessUI] = useState(false); // <-- Nuevo estado para la UI de éxito

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (role === 'DIRECTOR') {
        const res = await getDirectorReports();
        setData(res);
      } else if (role === 'DOCENTE' && user?.email) {
        const res = await getTeacherSubjectsForReports(user.email);
        setData(res);
      }
      setLoading(false);
    }
    load();
  }, [role, user]);

  // --- 🖨️ MOTOR DE IMPRESIÓN PDF (CALIDAD COMERCIAL) ---
  const printDoc = (type: string, payload: any) => {
    const win = window.open('', '_blank');
    if (!win) return alert("Por favor, permite las ventanas emergentes para generar el PDF.");

    const today = new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // ESTILOS GLOBALES PARA IMPRESIÓN PERFECTA EN A4
    const printStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 2px; }
        .header p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;}
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th { background-color: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.03); z-index: -1; white-space: nowrap; font-weight: 900; }
        @media print {
            body { padding: 0; margin: 2cm; }
            button { display: none; }
        }
      </style>
    `;

    let content = '';

    // 1. REPORTE DE LISTA DE ASISTENCIA (DOCENTE)
    if (type === 'LISTA_ASISTENCIA') {
       const studentsRows = payload.students.map((st: string, i: number) => `
         <tr>
            <td style="text-align:center; width: 40px;">${i+1}</td>
            <td style="font-weight: 700;">${st}</td>
            ${Array(15).fill('<td style="border-left:1px solid #e2e8f0"></td>').join('')}
         </tr>
       `).join('');

       content = `
         <div class="header">
            <h1>Registro Oficial de Asistencia</h1>
            <p>Módulo de Control Académico</p>
         </div>
         <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
            <div><b>Docente:</b> ${user?.nombre}</div>
            <div><b>Asignatura:</b> ${payload.name}</div>
            <div><b>Curso:</b> ${payload.courseName}</div>
            <div><b>Mes:</b> ___________________</div>
         </div>
         <table>
            <tr>
                <th style="text-align:center">#</th>
                <th>Nombre del Estudiante</th>
                ${Array(15).fill('<th style="width: 30px;"></th>').join('')}
            </tr>
            ${studentsRows}
         </table>
       `;
    }

    // 2. CERTIFICADO DE ESTUDIOS (SECRETARIA)
    if (type === 'CERTIFICADO') {
        content = `
            <div class="watermark">DOCUMENTO OFICIAL</div>
            <div class="header" style="margin-bottom: 60px;">
                <h1>Centro Educativo de Excelencia</h1>
                <p>República Dominicana • Código SIGERD: 0000000</p>
            </div>
            
            <h2 style="text-align: center; text-decoration: underline; margin-bottom: 50px; font-size: 18px;">CONSTANCIA DE ESTUDIOS</h2>
            
            <p style="text-align: justify; font-size: 16px; line-height: 2; margin-bottom: 30px;">
                A QUIEN PUEDA INTERESAR:
            </p>
            
            <p style="text-align: justify; font-size: 16px; line-height: 2; text-indent: 40px; margin-bottom: 30px;">
                Por medio de la presente, la Dirección de este Centro Educativo certifica que el/la estudiante 
                <b style="font-size: 18px; text-transform: uppercase;">${payload.nombre} ${payload.apellido}</b>, 
                portador(a) de la matrícula escolar <b>${payload.matricula}</b>, se encuentra formalmente inscrito(a) 
                y cursando el grado <b>${payload.course.name}</b> de manera regular durante el presente Año Escolar 2025-2026.
            </p>
            
            <p style="text-align: justify; font-size: 16px; line-height: 2; text-indent: 40px;">
                Se expide la presente constancia a solicitud de la parte interesada para los fines legales que estime 
                convenientes, en la ciudad de La Vega, a los <b>${today}</b>.
            </p>
            
            <div style="margin-top: 150px; text-align: center;">
                <div style="border-top: 2px solid #1e293b; width: 300px; margin: 0 auto; padding-top: 10px;">
                    <b style="font-size: 16px; text-transform: uppercase;">Dirección Académica</b><br>
                    <span style="font-size: 12px; color: #64748b;">Sello y Firma Autorizada</span>
                </div>
            </div>
        `;
    }

    // 3. REPORTE DE ALUMNOS EN RIESGO (DIRECTOR)
    if (type === 'RIESGO') {
        const rows = payload.map((s:any, i:number) => `
            <tr>
                <td style="text-align:center">${i+1}</td>
                <td><b>${s.matricula}</b></td>
                <td style="font-weight: 700;">${s.nombre}</td>
                <td>${s.curso}</td>
                <td style="color: #ef4444; font-weight: 900; font-size: 16px;">${s.promedio} pts</td>
            </tr>
        `).join('');

        content = `
            <div class="header">
                <h1>Reporte de Riesgo Académico</h1>
                <p>Estudiantes con promedio crítico (Menor a 70 puntos)</p>
            </div>
            <p style="text-align: right; font-size: 12px; font-weight: bold; color: #64748b;">Fecha de corte: ${today}</p>
            <table>
                <tr>
                    <th style="text-align:center">#</th>
                    <th>ID Matrícula</th>
                    <th>Estudiante</th>
                    <th>Curso Actual</th>
                    <th>Promedio General</th>
                </tr>
                ${rows}
            </table>
            <div style="margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center;">
                Este documento es de uso interno exclusivo de la Dirección. Su distribución no autorizada está prohibida.
            </div>
        `;
    }

    win.document.write(`
      <html>
        <head>
            <title>Impresión de Reporte</title>
            ${printStyles}
        </head>
        <body>
            ${content}
            <script>
                // Auto-imprimir y cerrar al cancelar
                window.onload = () => { window.print(); }
            </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // --- LOGICA DE BÚSQUEDA SECRETARIA ---
  const searchStudent = async () => {
      setCertStudent(null);
      if(!matriculaSearch) return;
      const st = await getStudentForCertificate(matriculaSearch);
      if (st) setCertStudent(st);
      else alert("No se encontró ningún estudiante con esa matrícula.");
  };

  // --- LOGICA DE SOPORTE IT ---
  const handleTicketSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmittingTicket(true);
      const res = await submitSupportTicket({ subject: ticketSubject, description: ticketDesc, userEmail: user?.email || ''});
      setIsSubmittingTicket(false);
      
      if (res.success) {
          setShowSuccessUI(true); // Mostramos la UI de éxito en lugar de un alert
          setTicketSubject('');
          setTicketDesc('');
          
          // Opcional: Ocultar el mensaje de éxito automáticamente después de 6 segundos
          setTimeout(() => setShowSuccessUI(false), 6000);
      }
  };

  if (loading && role !== 'SECRETARIA') return (
     <div className="flex flex-col justify-center items-center py-32 text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <span className="font-black text-[10px] uppercase tracking-[0.3em]">Recopilando datos del sistema...</span>
     </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none transform rotate-12"><Printer size={250}/></div>
        <div className="relative z-10">
            <h1 className="text-5xl font-black tracking-tighter mb-2">Centro de Reportes</h1>
            <p className="text-slate-400 font-medium text-lg">Generación de documentos oficiales, analítica y soporte institucional.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA PRINCIPAL DE REPORTES */}
          <div className="lg:col-span-2 space-y-8">
              
              {/* --- VISTA DIRECTOR --- */}
              {role === 'DIRECTOR' && data && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                            <div className="p-5 bg-blue-50 text-blue-600 rounded-2xl"><Users size={32}/></div>
                            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matrícula Total Activa</p><h3 className="text-4xl font-black text-slate-800">{data.totalStudents}</h3></div>
                        </div>
                        <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 shadow-sm flex items-center gap-6">
                            <div className="p-5 bg-rose-100 text-rose-600 rounded-2xl"><TrendingDown size={32}/></div>
                            <div><p className="text-[10px] font-black uppercase tracking-widest text-rose-400">En Riesgo Académico</p><h3 className="text-4xl font-black text-rose-600">{data.failingCount}</h3></div>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-lg mb-6 flex items-center gap-3"><FileText className="text-blue-600"/> Reportes Ejecutivos</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <button 
                                onClick={() => printDoc('RIESGO', data.failingList)}
                                disabled={data.failingCount === 0}
                                className="flex items-center justify-between p-6 border-2 border-slate-100 rounded-[2rem] hover:border-blue-500 hover:shadow-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 rounded-2xl transition-colors"><ShieldAlert size={24}/></div>
                                    <div className="text-left">
                                        <p className="font-black text-slate-800 text-lg">Listado de Riesgo Académico</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Generar PDF Oficial</p>
                                    </div>
                                </div>
                                <Download size={24} className="text-slate-300 group-hover:text-blue-600 transform group-hover:-translate-y-1 transition-all"/>
                            </button>
                        </div>
                    </div>
                </div>
              )}

              {/* --- VISTA DOCENTE --- */}
              {role === 'DOCENTE' && data && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
                    <h3 className="font-black text-lg mb-6 flex items-center gap-3"><FileText className="text-blue-600"/> Mis Listas de Control</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.map((subject: any) => (
                            <div key={subject.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm"><Users size={20}/></div>
                                        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full uppercase tracking-widest">{subject.studentCount} Alumnos</span>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-lg leading-tight">{subject.name}</h4>
                                    <p className="text-xs font-bold text-slate-400 mt-1 mb-8">{subject.courseName}</p>
                                </div>
                                <button 
                                    onClick={() => printDoc('LISTA_ASISTENCIA', subject)}
                                    className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:shadow-lg transition-all flex justify-center items-center gap-2"
                                >
                                    <Printer size={16}/> Imprimir Lista Física
                                </button>
                            </div>
                        ))}
                        {data.length === 0 && <p className="text-slate-400 col-span-full text-center py-10 font-bold">No tienes materias asignadas.</p>}
                    </div>
                </div>
              )}

              {/* --- VISTA SECRETARIA (CERTIFICADOS) --- */}
              {(role === 'SECRETARIA' || role === 'DIRECTOR') && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><FileBadge size={28}/></div>
                        <div>
                            <h3 className="font-black text-2xl text-slate-900 tracking-tight">Emisión de Documentos</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Constancias Oficiales</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Matrícula del Estudiante</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                                <input 
                                    type="text" 
                                    placeholder="Ej: 2025-4589"
                                    value={matriculaSearch}
                                    onChange={(e) => setMatriculaSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <button onClick={searchStudent} className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl">
                            Buscar Alumno
                        </button>
                    </div>

                    {certStudent && (
                        <div className="animate-in zoom-in-95 p-6 bg-white rounded-[2rem] border-2 border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg shadow-emerald-500/10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center font-black text-emerald-600 text-lg shadow-sm">
                                    {certStudent.nombre.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-xl">{certStudent.nombre} {certStudent.apellido}</h4>
                                    <p className="text-xs font-bold text-slate-400 font-mono mt-1">{certStudent.course?.name} • ID: {certStudent.matricula}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => printDoc('CERTIFICADO', certStudent)}
                                className="w-full md:w-auto px-8 py-4 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 flex justify-center items-center gap-2 transition-all active:scale-95"
                            >
                                <CheckCircle2 size={18}/> Imprimir Constancia
                            </button>
                        </div>
                    )}
                </div>
              )}

          </div>

          {/* COLUMNA SECUNDARIA: SOPORTE TÉCNICO (NUEVO MÓDULO) */}
          <div className="lg:col-span-1">
              <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md"><LifeBuoy size={24} className="text-blue-400"/></div>
                      <div>
                          <h3 className="font-black text-xl tracking-tight">Soporte IT</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Centro de Control</p>
                      </div>
                  </div>

                  {/* Renderizado Condicional: Formulario vs UI de Éxito */}
                  {showSuccessUI ? (
                      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 py-8">
                          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                              <CheckCircle2 size={40} className="text-emerald-400" />
                          </div>
                          <h4 className="font-black text-2xl text-white mb-3">¡Ticket Emitido!</h4>
                          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                              El NOC ha recibido tu incidencia. Nuestro equipo técnico te notificará los avances al correo <span className="text-white font-bold">{user?.email}</span>.
                          </p>
                          <button
                              onClick={() => setShowSuccessUI(false)}
                              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all w-full border border-white/5 hover:border-white/20"
                          >
                              Registrar Nueva Incidencia
                          </button>
                      </div>
                  ) : (
                      <form onSubmit={handleTicketSubmit} className="space-y-5 relative z-10 flex-1 flex flex-col">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Asunto</label>
                              <select 
                                  required
                                  value={ticketSubject}
                                  onChange={(e) => setTicketSubject(e.target.value)}
                                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                              >
                                  <option value="" className="text-slate-900">Selecciona el tipo de problema...</option>
                                  <option value="Error de Calificaciones" className="text-slate-900">Error guardando notas</option>
                                  <option value="Estudiante Faltante" className="text-slate-900">Estudiante no aparece en lista</option>
                                  <option value="Fallo del Sistema" className="text-slate-900">El sistema está lento / no carga</option>
                                  <option value="Otro" className="text-slate-900">Otro requerimiento</option>
                              </select>
                          </div>
                          <div className="flex-1 flex flex-col">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descripción Detallada</label>
                              <textarea 
                                  required
                                  rows={5}
                                  value={ticketDesc}
                                  onChange={(e) => setTicketDesc(e.target.value)}
                                  placeholder="Describe exactamente qué sucedió..."
                                  className="w-full flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all resize-none placeholder:text-slate-500"
                              />
                          </div>
                          <button 
                              type="submit" 
                              disabled={isSubmittingTicket || !ticketSubject || !ticketDesc}
                              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                          >
                              {isSubmittingTicket ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} 
                              {isSubmittingTicket ? 'Enviando Datos...' : 'Enviar Ticket al NOC'}
                          </button>
                      </form>
                  )}

                  {!showSuccessUI && (
                      <div className="mt-8 pt-8 border-t border-white/10 flex items-start gap-3 relative z-10">
                          <MessageSquare size={16} className="text-slate-500 mt-0.5 shrink-0"/>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                              El Centro de Operaciones de Red (NOC) auditará tu caso en un lapso de 24h.
                          </p>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
}