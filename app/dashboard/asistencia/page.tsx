'use client';

/**
 * Módulo de Control de Asistencia - EduControl
 * @description Gestión de asistencia estudiantil con validación de días hábiles e impresión de reportes oficiales.
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, Save, Search, CheckCircle2, XCircle, Clock, FileBadge,
  Users, ChevronDown, RefreshCw, Lock, AlertCircle, Loader2, BookOpen,
  Printer, ShieldAlert
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { getMyCourses, getCourseStudents, saveAttendance } from './actions';

export default function AttendancePage() {
  const { user, role } = useUser();
  
  // --- ESTADOS ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Referencia para el área imprimible
  const printRef = useRef<HTMLDivElement>(null);

  // --- PERMISOS Y ROLES ---
  const isReadOnly = role === 'ORIENTADOR';
  const canEdit = role === 'DOCENTE' || role === 'DIRECTOR' || role === 'SECRETARIA';
  const canMarkExcuse = role === 'DIRECTOR' || role === 'SECRETARIA';
  const canPrint = role === 'SECRETARIA' || role === 'DIRECTOR';

  // --- LÓGICA DE NEGOCIO: VALIDACIÓN DE FINES DE SEMANA ---
  const isWeekend = useMemo(() => {
    const dateObj = new Date(selectedDate);
    // En JS, 0 es Domingo y 6 es Sábado. Ajustamos por zona horaria agregando horas si es necesario, 
    // pero creando el Date desde el string ISO YYYY-MM-DD lo toma a las 00:00 UTC.
    // Para evitar desfases, extraemos las partes:
    const [year, month, day] = selectedDate.split('-');
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    const dayOfWeek = localDate.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }, [selectedDate]);

  // Bloquear edición si es docente y es fin de semana
  const isEditingBlocked = role === 'DOCENTE' && isWeekend;

  // --- 1. CARGAR CURSOS AL INICIO ---
  useEffect(() => {
    async function loadCourses() {
        if (!user?.email) return;
        const data = await getMyCourses(user.email, role || '');
        setCourses(data);
        if (data.length > 0) setSelectedCourseId(data[0].id);
    }
    loadCourses();
  }, [user, role]);

  // --- 2. CARGAR ESTUDIANTES Y ASISTENCIA ---
  useEffect(() => {
    async function loadList() {
        if (!selectedCourseId) return;
        setIsLoading(true);
        const data = await getCourseStudents(selectedCourseId, selectedDate);
        setStudents(data);
        setIsLoading(false);
    }
    loadList();
  }, [selectedCourseId, selectedDate]);

  // --- 3. GUARDADO DE ASISTENCIA ---
  const handleSave = async () => {
      if (isEditingBlocked) return;
      setIsSaving(true);
      const result = await saveAttendance(selectedCourseId, selectedDate, students);
      setIsSaving(false);
      if (result.success) {
        alert("✅ Pase de lista guardado con éxito."); 
      } else {
        alert("❌ " + result.message);
      }
  };

  // --- LÓGICA DE ACTUALIZACIÓN LOCAL ---
  const updateStatus = (id: string, newStatus: string) => {
    if (isReadOnly || isEditingBlocked) return;
    if (newStatus === 'EXCUSA' && !canMarkExcuse) {
        alert("🔒 Solo el personal directivo o secretaría puede registrar excusas.");
        return;
    }
    setStudents(prev => prev.map(s => s.id === id ? { ...s, estado: newStatus } : s));
  };

  const markAll = (status: string) => {
    if (isReadOnly || isEditingBlocked) return;
    setStudents(prev => prev.map(s => ({ ...s, estado: status })));
  };

  // --- IMPRESIÓN OFICIAL (PDF) ---
  const handlePrint = () => {
    window.print();
  };

  // --- ESTADÍSTICAS EN TIEMPO REAL ---
  const stats = useMemo(() => {
    const total = students.length;
    // Si es null, asumimos que está presente para el cálculo inicial
    const presentes = students.filter(s => s.estado === 'PRESENTE' || s.estado === null).length; 
    const ausentes = students.filter(s => s.estado === 'AUSENTE').length;
    const tardias = students.filter(s => s.estado === 'TARDIA').length;
    const excusas = students.filter(s => s.estado === 'EXCUSA').length;
    const porcentaje = total > 0 ? Math.round(((presentes + tardias) / total) * 100) : 0;
    return { total, presentes, ausentes, tardias, excusas, porcentaje };
  }, [students]);

  const filteredList = students.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.matricula.includes(searchTerm)
  );

  const selectedCourseName = courses.find(c => c.id === selectedCourseId)?.name || '';

  return (
    <>
      {/* ESTILOS DE IMPRESIÓN (CSS Media Query)
        Convierte la vista web en un reporte PDF profesional, ocultando botones y menús.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          .print-header { display: block !important; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .print-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 2fr; gap: 10px; font-size: 12px; border-collapse: collapse; width: 100%; }
          .print-row { display: contents; }
          .print-cell { border-bottom: 1px solid #ccc; padding: 8px; text-align: left; }
          .print-status-PRESENTE { color: green; font-weight: bold; }
          .print-status-AUSENTE { color: red; font-weight: bold; }
          .print-status-TARDIA { color: orange; font-weight: bold; }
          .print-status-EXCUSA { color: blue; font-weight: bold; }
        }
      `}} />

      <div className="space-y-8 animate-in fade-in duration-700 pb-32 relative min-h-[90vh]">
        
        {/* 1. HEADER ELITE Y CONTROLES DE FECHA/CURSO */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col xl:flex-row justify-between xl:items-end gap-8 relative overflow-hidden no-print">
          <div className="absolute -right-20 -top-20 opacity-[0.03] pointer-events-none transform -rotate-12"><Calendar size={300}/></div>
          
          <div className="relative z-10 w-full xl:w-1/2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 mb-2">
              Control de Asistencia
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500"/> Registro oficial del día
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
              {/* Selector de Curso */}
              <div className="relative group flex-1 sm:min-w-[280px]">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><BookOpen size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors"/></div>
                 <select 
                    value={selectedCourseId} 
                    onChange={(e) => setSelectedCourseId(e.target.value)} 
                    className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-blue-300 rounded-[1.5rem] text-sm font-black text-slate-700 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {courses.length === 0 && <option value="">Sin asignaturas...</option>}
                 </select>
                 <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              </div>

              {/* Selector de Fecha */}
              <div className="relative group flex-1 sm:min-w-[200px]">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Calendar size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors"/></div>
                 <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-blue-300 rounded-[1.5rem] text-sm font-black text-slate-700 outline-none transition-all cursor-pointer"
                  />
              </div>

              {/* Botón de Impresión (Secretaría / Director) */}
              {canPrint && (
                <button 
                  onClick={handlePrint}
                  disabled={isLoading || students.length === 0}
                  className="flex-shrink-0 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20"
                >
                  <Printer size={18} /> Exportar PDF
                </button>
              )}
          </div>
        </div>

        {/* ALERTA: RESTRICCIÓN DE FIN DE SEMANA PARA DOCENTES */}
        {isEditingBlocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex items-start gap-4 animate-in slide-in-from-top-4 no-print">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0"><ShieldAlert size={24} /></div>
            <div>
              <h3 className="font-black text-amber-900 text-lg">Día No Laborable</h3>
              <p className="text-amber-700 font-medium text-sm mt-1">
                La fecha seleccionada corresponde a un fin de semana (sábado o domingo). Como docente, el registro de asistencia solo está habilitado de lunes a viernes. La lista actual es de solo lectura.
              </p>
            </div>
          </div>
        )}

        {/* 2. DASHBOARD DE ESTADÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
            <div className="p-6 rounded-[2rem] bg-slate-900 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden flex flex-col justify-between h-40">
               <div className="relative z-10">
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Total Alumnos</p>
                  <span className="text-5xl font-black tracking-tighter">{stats.total}</span>
               </div>
               <Users className="absolute right-[-10px] bottom-[-10px] text-white/5 w-24 h-24 transform -rotate-12" />
            </div>

            <div className="p-6 rounded-[2rem] bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden flex flex-col justify-between h-40">
               <div className="relative z-10">
                  <p className="text-emerald-100 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Presentes</p>
                  <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black tracking-tighter">{stats.presentes}</span>
                      <span className="text-sm font-bold bg-emerald-600 px-2 py-1 rounded-lg">{stats.porcentaje}%</span>
                  </div>
               </div>
               <CheckCircle2 className="absolute right-[-10px] bottom-[-10px] text-white/10 w-24 h-24 transform rotate-12" />
            </div>

            <div className="p-6 rounded-[2rem] bg-rose-50 text-rose-600 border border-rose-100 relative overflow-hidden flex flex-col justify-between h-40">
               <div className="relative z-10">
                  <p className="text-rose-300 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Ausentes</p>
                  <span className="text-5xl font-black tracking-tighter">{stats.ausentes}</span>
               </div>
               <XCircle className="absolute right-[-10px] bottom-[-10px] text-rose-600/5 w-24 h-24" />
            </div>

            <div className="p-6 rounded-[2rem] bg-amber-50 text-amber-600 border border-amber-100 relative overflow-hidden flex flex-col justify-between h-40">
               <div className="relative z-10">
                  <p className="text-amber-300 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Tardanzas</p>
                  <span className="text-5xl font-black tracking-tighter">{stats.tardias}</span>
               </div>
               <Clock className="absolute right-[-10px] bottom-[-10px] text-amber-600/5 w-24 h-24" />
            </div>
        </div>

        {/* 3. HERRAMIENTAS RÁPIDAS */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm no-print">
           <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="Buscar estudiante..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
              />
           </div>
           {canEdit && !isEditingBlocked && (
              <button onClick={() => markAll('PRESENTE')} className="w-full md:w-auto px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-[1.5rem] transition-colors whitespace-nowrap shadow-sm">
                 Marcar Todo Presente
              </button>
           )}
        </div>

        {/* CONTENEDOR PRINCIPAL - ÁREA IMPRIMIBLE */}
        <div id="printable-area" ref={printRef}>
            {/* Cabecera exclusiva para el PDF impreso */}
            <div className="hidden print-header">
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Reporte Oficial de Asistencia - EduControl</h1>
                <p style={{ margin: '5px 0' }}><strong>Curso/Materia:</strong> {selectedCourseName}</p>
                <p style={{ margin: '5px 0' }}><strong>Fecha:</strong> {new Date(selectedDate).toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '14px' }}>
                    <span><strong>Total:</strong> {stats.total}</span>
                    <span><strong>Presentes:</strong> {stats.presentes}</span>
                    <span><strong>Ausentes:</strong> {stats.ausentes}</span>
                    <span><strong>Tardanzas:</strong> {stats.tardias}</span>
                    <span><strong>Excusas:</strong> {stats.excusas}</span>
                </div>
            </div>

            {/* 4. LISTADO PRINCIPAL (El corazón de la app) */}
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-32 text-slate-400 gap-4 no-print">
                 <Loader2 className="animate-spin" size={40} />
                 <span className="font-black text-[10px] uppercase tracking-[0.3em]">Cargando Expedientes...</span>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden" style={{ borderRadius: '0', border: 'none', boxShadow: 'none' }}>
                 
                 {/* Cabecera de la tabla para impresión */}
                 <div className="hidden print-grid" style={{ borderBottom: '2px solid #ccc', fontWeight: 'bold', marginBottom: '10px', paddingBottom: '5px' }}>
                    <div className="print-cell">Estudiante</div>
                    <div className="print-cell">Matrícula</div>
                    <div className="print-cell">Estado</div>
                    <div className="print-cell">Observaciones</div>
                 </div>

                 {filteredList.map((st, idx) => (
                    <div key={st.id} className={`group relative p-4 sm:p-6 border-b border-slate-50 last:border-0 transition-all duration-300 hover:bg-slate-50/50 ${
                       st.estado === 'AUSENTE' ? 'bg-rose-50/30' : ''
                    } print-row`}>
                       
                       <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center no-print">
                          {/* INFO ESTUDIANTE (VISTA WEB) */}
                          <div className="flex items-center gap-5 w-full lg:w-[35%] xl:w-[40%]">
                              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
                                 {st.nombre[0]}{st.apellido?.[0]}
                              </div>
                              <div>
                                 <h3 className="font-black text-slate-900 text-lg leading-tight tracking-tight">{st.nombre} {st.apellido}</h3>
                                 <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest mt-1">ID: {st.matricula}</p>
                              </div>
                          </div>

                          {/* SELECTOR DE ESTADOS (Botones Web) */}
                          <div className="flex flex-wrap justify-start lg:justify-center gap-3 w-full lg:w-auto flex-1">
                              <StatusButton disabled={isEditingBlocked} active={st.estado === 'PRESENTE' || st.estado === null} onClick={() => updateStatus(st.id, 'PRESENTE')} type="success" icon={CheckCircle2} label="Presente" />
                              <StatusButton disabled={isEditingBlocked} active={st.estado === 'TARDIA'} onClick={() => updateStatus(st.id, 'TARDIA')} type="warning" icon={Clock} label="Tardanza" />
                              <StatusButton disabled={isEditingBlocked} active={st.estado === 'AUSENTE'} onClick={() => updateStatus(st.id, 'AUSENTE')} type="danger" icon={XCircle} label="Falta" />
                              <StatusButton disabled={isEditingBlocked} active={st.estado === 'EXCUSA'} onClick={() => updateStatus(st.id, 'EXCUSA')} type="info" icon={FileBadge} label="Excusa" isLocked={!canMarkExcuse && st.estado !== 'EXCUSA'}/>
                          </div>

                          {/* NOTA DE JUSTIFICACIÓN (Web) */}
                          <div className="w-full lg:w-[25%] flex justify-end shrink-0">
                             {(st.estado === 'AUSENTE' || st.estado === 'EXCUSA' || st.estado === 'TARDIA') ? (
                                <div className="relative w-full">
                                    <input 
                                       type="text" 
                                       disabled={isEditingBlocked}
                                       placeholder="Motivo / Observación..." 
                                       value={st.nota || ''}
                                       onChange={(e) => setStudents(prev => prev.map(s => s.id === st.id ? { ...s, nota: e.target.value } : s))}
                                       className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-4 py-3.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                    <AlertCircle size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 ${st.estado === 'AUSENTE' ? 'text-rose-400' : 'text-slate-300'}`}/>
                                </div>
                             ) : (
                                <div className="w-full text-right pr-4"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin Novedad</span></div>
                             )}
                          </div>
                       </div>

                       {/* INFO ESTUDIANTE (VISTA IMPRESIÓN PDF) */}
                       <div className="hidden print-grid">
                          <div className="print-cell">{st.nombre} {st.apellido}</div>
                          <div className="print-cell">{st.matricula}</div>
                          <div className={`print-cell print-status-${st.estado || 'PRESENTE'}`}>{st.estado || 'PRESENTE'}</div>
                          <div className="print-cell">{st.nota || '-'}</div>
                       </div>

                    </div>
                 ))}
                 
                 {filteredList.length === 0 && (
                     <div className="py-24 text-center no-print">
                         <Users size={64} className="mx-auto text-slate-200 mb-4"/>
                         <p className="font-black text-slate-400 text-sm uppercase tracking-[0.2em]">No hay alumnos para mostrar</p>
                     </div>
                 )}
              </div>
            )}
        </div>

        {/* 5. BOTÓN FLOTANTE DE GUARDADO MASIVO */}
        {canEdit && !isEditingBlocked && !isLoading && students.length > 0 && (
           <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 duration-500 no-print">
              <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="group flex items-center gap-4 px-8 py-5 bg-slate-900 text-white rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:hover:scale-100 border border-slate-700"
              >
                 {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24} className="group-hover:text-emerald-400 transition-colors" />}
                 <div className="flex flex-col items-start text-left">
                    <span className="font-black text-sm uppercase tracking-widest leading-none mb-1">{isSaving ? 'Registrando...' : 'Finalizar Registro'}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stats.total} alumnos procesados</span>
                 </div>
              </button>
           </div>
        )}

      </div>
    </>
  );
}

// COMPONENTE DE BOTÓN DE ESTADO (Ultra optimizado y visualmente exquisito)
function StatusButton({ active, onClick, type, icon: Icon, label, disabled, isLocked }: any) {
   const styles: Record<string, string> = {
     success: active ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border-emerald-500" : "text-emerald-600 bg-emerald-50 border-transparent hover:bg-emerald-100 hover:border-emerald-200",
     warning: active ? "bg-amber-400 text-white shadow-md shadow-amber-400/20 border-amber-400" : "text-amber-600 bg-amber-50 border-transparent hover:bg-amber-100 hover:border-amber-200",
     danger: active  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 border-rose-500"  : "text-rose-600 bg-rose-50 border-transparent hover:bg-rose-100 hover:border-rose-200",
     info: active    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 border-blue-500"  : "text-blue-600 bg-blue-50 border-transparent hover:bg-blue-100 hover:border-blue-200",
   };
   
   if (isLocked) return (
       <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center gap-2 cursor-not-allowed">
           <Lock size={16}/> <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Excusa</span>
       </div>
   );

   return (
      <button 
        onClick={onClick} 
        disabled={disabled} 
        className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${styles[type]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
      >
         <Icon size={18} className={active ? "animate-in zoom-in" : ""} />
         <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'inline' : 'hidden sm:inline opacity-80'}`}>
            {label}
         </span>
      </button>
   );
}