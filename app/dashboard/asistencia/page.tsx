'use client';

/**
 * Módulo de Control de Asistencia Pro - EduControl
 * @description Gestión de asistencia con validación de seguridad (Docente -> Sus Cursos -> Sus Asignaturas).
 * @author Jose Junior Guzmán Veloz
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, Save, Search, CheckCircle2, XCircle, Clock, FileBadge,
  Users, ChevronDown, Lock, AlertCircle, Loader2, BookOpen,
  Printer, ShieldAlert, Fingerprint, Layout, ShieldCheck, Tag
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { getMyCourses, getCourseStudents, saveAttendance } from './actions';

export default function AttendancePage() {
  const { user, role } = useUser();
  
  // --- ESTADOS DE SELECCIÓN ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  // --- ESTADOS DE DATOS ---
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- ESTADOS DE UI ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; title: string; time: string; type: 'success' | 'error' }>({ visible: false, title: '', time: '', type: 'success' });

  const printRef = useRef<HTMLDivElement>(null);

  // --- PERMISOS ---
  const canEdit = ['DOCENTE', 'DIRECTOR', 'SECRETARIA', 'ADMIN_SISTEMA'].includes(role || '');
  const canMarkExcuse = ['DIRECTOR', 'SECRETARIA', 'ADMIN_SISTEMA'].includes(role || '');

  // Bloqueo de fin de semana para docentes
  const isWeekend = useMemo(() => {
    const [year, month, day] = selectedDate.split('-');
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    const dayOfWeek = localDate.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }, [selectedDate]);

  const isEditingBlocked = role === 'DOCENTE' && isWeekend;

  // 1. Cargar Cursos (Filtrados por Docente desde el backend)
  useEffect(() => {
    async function loadInitialData() {
        if (!user?.email) return;
        const data = await getMyCourses(user.email, role || '');
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id);
        } else {
          setIsLoading(false); // Si no tiene cursos, quitamos el loading
        }
    }
    loadInitialData();
  }, [user, role]);

  // 2. Manejar cambio de curso para cargar SUS asignaturas
  const subjectsOfSelectedCourse = useMemo(() => {
    const course = courses.find(c => c.id === selectedCourseId);
    return course?.subjects || [];
  }, [selectedCourseId, courses]);

  // Auto-seleccionar la primera asignatura cuando cambia el curso
  useEffect(() => {
    if (subjectsOfSelectedCourse.length > 0) {
      setSelectedSubjectId(subjectsOfSelectedCourse[0].id);
    } else {
      setSelectedSubjectId('');
      setStudents([]); // Limpiar lista si no hay asignaturas
    }
  }, [subjectsOfSelectedCourse]);

  // 3. Cargar Lista de Estudiantes (Depende del Curso, Asignatura y Fecha)
  useEffect(() => {
    async function loadList() {
        // Si falta algún dato vital, no cargamos nada
        if (!selectedCourseId || !selectedSubjectId || !selectedDate) return;
        
        setIsLoading(true);
        // Enviamos al backend el curso, la ASIGNATURA y la fecha
        const data = await getCourseStudents(selectedCourseId, selectedSubjectId, selectedDate);
        setStudents(data);
        setIsLoading(false);
    }
    loadList();
  }, [selectedCourseId, selectedSubjectId, selectedDate]);

  // 4. Guardar Asistencia (Enlazada a la Asignatura)
  const handleSave = async () => {
      if (isEditingBlocked || !selectedSubjectId) return;
      
      setIsSaving(true);
      const result = await saveAttendance(selectedCourseId, selectedSubjectId, selectedDate, students, role || 'DOCENTE');
      setIsSaving(false);
      
      const currentTime = new Date().toLocaleString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true });
      const subjectName = subjectsOfSelectedCourse.find((s: any) => s.id === selectedSubjectId)?.name || 'la asignatura';
      
      if (result.success) {
        setToast({ visible: true, title: `Asistencia de ${subjectName} Guardada`, time: currentTime, type: 'success' });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
      } else {
        setToast({ visible: true, title: `Error: ${result.message}`, time: currentTime, type: 'error' });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
      }
  };

  const stats = useMemo(() => {
    const total = students.length;
    const presentes = students.filter(s => s.estado === 'PRESENTE' || s.estado === null).length; 
    const ausentes = students.filter(s => s.estado === 'AUSENTE').length;
    const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;
    return { total, presentes, ausentes, porcentaje };
  }, [students]);

  const filteredList = students.filter(s => 
    `${s.nombre} ${s.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.rne && s.rne.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
      
      {/* NOTIFICACIÓN TIPO TARGET FLOTANTE */}
      {toast.visible && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10">
          <div className={`text-white px-8 py-4 rounded-[2rem] shadow-2xl border flex items-center gap-4 ${toast.type === 'success' ? 'bg-slate-900 border-emerald-500/30' : 'bg-rose-600 border-rose-400'}`}>
            <div className={toast.type === 'success' ? 'bg-emerald-500 p-2 rounded-full' : 'bg-white/20 p-2 rounded-full'}>
              {toast.type === 'success' ? <ShieldCheck size={20}/> : <AlertCircle size={20}/>}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest">{toast.title}</p>
              <p className="text-[10px] text-slate-300 font-bold uppercase">{toast.time} • Registro Sincronizado</p>
            </div>
          </div>
        </div>
      )}

      {/* PANEL DE CONTROL SUPERIOR */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
               <ShieldCheck size={14}/> Acceso: {role}
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Pase de Lista</h1>
            <p className="text-slate-500 font-medium text-sm">Selecciona tu curso y la asignatura a impartir.</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => window.print()} className="px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest flex gap-2 items-center shadow-lg"><Printer size={16}/> Imprimir Reporte</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          
          {/* Selector de Curso */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-1"><Layout size={12}/> 1. Curso Asignado</label>
            <div className="relative group">
              <select 
                value={selectedCourseId} 
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full pl-6 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-sm"
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                {courses.length === 0 && <option value="">No tienes cursos asignados</option>}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            </div>
          </div>

          {/* Selector de Asignatura */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-1"><BookOpen size={12}/> 2. Asignatura</label>
            <div className="relative group">
              <select 
                value={selectedSubjectId} 
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full pl-6 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-sm disabled:opacity-50"
                disabled={subjectsOfSelectedCourse.length === 0}
              >
                {subjectsOfSelectedCourse.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                {subjectsOfSelectedCourse.length === 0 && <option value="">Sin asignaturas...</option>}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            </div>
          </div>

          {/* Selector de Fecha */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-1"><Calendar size={12}/> 3. Fecha de Clase</label>
            <div className="relative group">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
              />
            </div>
          </div>

        </div>
      </div>

      {/* LISTADO DE ESTUDIANTES PROFESIONAL */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar estudiante por nombre o RNE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {canEdit && !isEditingBlocked && students.length > 0 && (
            <button onClick={() => setStudents(prev => prev.map(s => ({...s, estado: 'PRESENTE'})))} className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Marcar Todos Presentes</button>
          )}
        </div>

        {/* ALERTA DE FIN DE SEMANA */}
        {isEditingBlocked && (
          <div className="mx-6 mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <ShieldAlert className="text-amber-500" size={20}/>
            <p className="text-xs font-bold text-amber-800">Modo Solo Lectura: No se permite registrar asistencia los fines de semana.</p>
          </div>
        )}

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-4 text-blue-500" size={40}/>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Cargando Matrícula...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-slate-400">
            <Users size={64} className="mb-4 text-slate-200"/>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay alumnos disponibles</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredList.map((st) => (
              <div key={st.id} className="p-6 flex flex-col xl:flex-row items-center justify-between gap-6 hover:bg-slate-50/50 transition-all group">
                
                {/* Info Estudiante */}
                <div className="flex items-center gap-5 w-full xl:w-1/3">
                  <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                    {st.fotoUrl ? (
                        <img src={st.fotoUrl} className="w-full h-full object-cover rounded-xl"/>
                    ) : (
                        <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-sm">{st.nombre[0]}{st.apellido[0]}</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{st.nombre} {st.apellido}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                      <Fingerprint size={12} className="text-blue-400"/> {st.rne || 'SIN RNE'} • Folio: {st.folio || '-'}
                    </p>
                  </div>
                </div>

                {/* Botones de Estado */}
                <div className="flex flex-wrap justify-center gap-2 w-full xl:w-auto">
                  <AttendanceBtn active={st.estado === 'PRESENTE' || st.estado === null} icon={CheckCircle2} label="Presente" color="emerald" onClick={() => setStudents(prev => prev.map(s => s.id === st.id ? {...s, estado: 'PRESENTE'} : s))} locked={isEditingBlocked}/>
                  <AttendanceBtn active={st.estado === 'TARDIA'} icon={Clock} label="Tardanza" color="amber" onClick={() => setStudents(prev => prev.map(s => s.id === st.id ? {...s, estado: 'TARDIA'} : s))} locked={isEditingBlocked}/>
                  <AttendanceBtn active={st.estado === 'AUSENTE'} icon={XCircle} label="Falta" color="rose" onClick={() => setStudents(prev => prev.map(s => s.id === st.id ? {...s, estado: 'AUSENTE'} : s))} locked={isEditingBlocked}/>
                  <AttendanceBtn active={st.estado === 'EXCUSA'} icon={FileBadge} label="Excusa" color="blue" onClick={() => canMarkExcuse && setStudents(prev => prev.map(s => s.id === st.id ? {...s, estado: 'EXCUSA'} : s))} locked={!canMarkExcuse || isEditingBlocked}/>
                </div>

                {/* Input Justificación */}
                <div className="w-full xl:w-1/4">
                  {(st.estado === 'AUSENTE' || st.estado === 'EXCUSA' || st.estado === 'TARDIA') ? (
                    <input 
                      type="text" 
                      placeholder="Escribir justificación..."
                      value={st.nota || ''}
                      onChange={(e) => setStudents(prev => prev.map(s => s.id === st.id ? {...s, nota: e.target.value} : s))}
                      disabled={isEditingBlocked}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:opacity-50"
                    />
                  ) : (
                    <div className="text-right hidden xl:block"><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Sin Novedad</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTÓN FLOTANTE DE GUARDADO */}
      {!isLoading && students.length > 0 && canEdit && !isEditingBlocked && selectedSubjectId && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 border border-slate-700"
          >
            {isSaving ? <Loader2 className="animate-spin text-emerald-400" size={24}/> : <Save size={24} className="text-emerald-400"/>}
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-[0.2em] leading-tight">Guardar Asistencia</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{stats.presentes} Presentes de {stats.total} Alumnos</p>
            </div>
          </button>
        </div>
      )}

    </div>
  );
}

// Botón de Estado Ultra-Optimizado
function AttendanceBtn({ active, icon: Icon, label, color, onClick, locked }: any) {
  const colors: any = {
    emerald: active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 border-emerald-500' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-transparent',
    amber: active ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 border-amber-500' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-transparent',
    rose: active ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 border-rose-500' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-transparent',
    blue: active ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 border-blue-500' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-transparent'
  };

  return (
    <button 
      onClick={onClick}
      disabled={locked}
      className={`px-4 py-3 rounded-2xl flex items-center gap-2 border transition-all duration-300 ${colors[color]} ${active ? 'scale-105' : 'scale-100'} ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <Icon size={16}/>
      <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'inline-block' : 'hidden md:inline-block'}`}>{label}</span>
    </button>
  );
}