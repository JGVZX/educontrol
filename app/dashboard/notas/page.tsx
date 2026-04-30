'use client';

/**
 * Módulo de Cuaderno de Calificaciones Mensual - Elite Edition
 * @description Gestión de evaluación continua (MINERD), promedios acumulados, auditoría de notas y reportes PDF consolidados.
 * @author Jose Junior Guzmán Veloz
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, Save, Search, ShieldAlert,
  RefreshCw, Lock, Unlock, Filter, ArrowLeft, GraduationCap,
  Printer, Loader2, Edit3, CalendarDays, FileText, Calculator, 
  ClipboardList, CheckCircle2, XCircle, Fingerprint, Layout, ShieldCheck
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
// Importaremos toggleGradeLock en el action en el siguiente paso
import { getSubjects, getStudentGrades, saveStudentGrade, toggleGradeLock } from './actions';

// CICLO ESCOLAR ACTUALIZADO (MINERD)
const SCHOOL_MONTHS = [
  'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO'
];

const CURRENT_SCHOOL_YEAR = "2025-2026"; 

export default function GradesPage() {
  const { user, role } = useUser();
  
  // --- ESTADOS DE DATOS ---
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [studentsData, setStudentsData] = useState<any[]>([]); 
  
  // --- ESTADOS DE NAVEGACIÓN ---
  const [viewState, setViewState] = useState<'GRID' | 'DETAILS'>('GRID');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('SEPTIEMBRE');
  
  // --- ESTADOS DE UI Y FILTROS ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  
  // Toast Notification
  const [toast, setToast] = useState<{ visible: boolean; title: string; type: 'success' | 'error' }>({ visible: false, title: '', type: 'success' });

  // Modal y Reportes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToGrade, setStudentToGrade] = useState<any>(null);
  const [printMode, setPrintMode] = useState<'CLASS' | 'STUDENT' | 'CLASS_ANNUAL'>('CLASS');

  // --- PERMISOS Y ROLES ---
  const isDirector = role === 'DIRECTOR';
  const isSecretaria = role === 'SECRETARIA';
  const isDocente = role === 'DOCENTE';
  const isIT = role === 'ADMIN_SISTEMA';

  const canLockUnlock = isDirector || isSecretaria || isIT;
  const canEditAny = isDirector || isDocente || isSecretaria;
  const canPrint = isSecretaria || isDirector || isDocente;

  // 1. Carga Inicial de Asignaturas
  useEffect(() => {
    async function loadSubjects() {
        if (!user?.email) return;
        setIsLoading(true);
        const data = await getSubjects(user.email, role || '');
        setMySubjects(data);
        setIsLoading(false);
    }
    loadSubjects();
  }, [user, role]);

  const uniqueCourses = useMemo(() => {
    const coursesMap = new Map();
    mySubjects.forEach(sub => {
      if (!coursesMap.has(sub.courseId)) coursesMap.set(sub.courseId, { id: sub.courseId, name: sub.courseName, type: sub.type });
    });
    return Array.from(coursesMap.values());
  }, [mySubjects]);

  const courseSubjects = useMemo(() => mySubjects.filter(s => s.courseId === selectedCourseId), [mySubjects, selectedCourseId]);
  const currentSubject = useMemo(() => courseSubjects.find(s => s.id === selectedSubjectId) || courseSubjects[0], [courseSubjects, selectedSubjectId]);

  // 2. Carga del Expediente de Notas
  const loadGrades = async (subjectId: string) => {
    setIsLoading(true);
    const data = await getStudentGrades(subjectId);
    setStudentsData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (viewState === 'DETAILS' && currentSubject) {
      if (!selectedSubjectId) setSelectedSubjectId(currentSubject.id);
      loadGrades(currentSubject.id);
      setSearchTerm('');
      setStatusFilter('TODOS');
    }
  }, [viewState, currentSubject, selectedSubjectId]);

  // --- MOTOR DE PROCESAMIENTO (Cálculos en vivo) ---
  const processedStudents = useMemo(() => {
      return studentsData.map(st => {
          const currentMonthGrade = st.grades?.find((g: any) => g.mes === selectedMonth) || {};
          
          // Promedio Final Acumulado (Anual)
          const evaluatedMonths = st.grades?.filter((g: any) => g.final !== null && g.final !== undefined) || [];
          const totalScore = evaluatedMonths.reduce((acc: number, curr: any) => acc + curr.final, 0);
          const average = evaluatedMonths.length > 0 ? Math.round(totalScore / evaluatedMonths.length) : null;
          
          let avgStatus = 'EN CURSO';
          if (average !== null) avgStatus = average >= 70 ? 'APROBADO' : 'REPROBADO';

          let monthStatus = currentMonthGrade.final !== null && currentMonthGrade.final !== undefined 
              ? (currentMonthGrade.final >= 70 ? 'APROBADO' : 'REPROBADO') 
              : 'SIN CALIFICAR';

          return {
              ...st,
              currentMonthGrade,
              monthStatus,
              average,
              avgStatus,
              isLocked: currentMonthGrade.isLocked || false
          };
      });
  }, [studentsData, selectedMonth]);

  const filteredStudents = useMemo(() => {
      return processedStudents.filter(st => {
          const searchLower = searchTerm.toLowerCase();
          const fullName = `${st.nombre || ''} ${st.apellido || ''}`.toLowerCase();
          const matchesSearch = fullName.includes(searchLower) || (st.rne && st.rne.toLowerCase().includes(searchLower));
          
          let matchesStatus = true;
          if (statusFilter === 'APROBADOS') matchesStatus = st.monthStatus === 'APROBADO';
          if (statusFilter === 'REPROBADOS') matchesStatus = st.monthStatus === 'REPROBADO';
          if (statusFilter === 'SIN_CALIFICAR') matchesStatus = st.monthStatus === 'SIN CALIFICAR';

          return matchesSearch && matchesStatus;
      });
  }, [processedStudents, searchTerm, statusFilter]);

  // --- NOTIFICACIONES ---
  const showToast = (title: string, type: 'success' | 'error') => {
    setToast({ visible: true, title, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  // --- MANEJO DE AUDITORÍA (Bloqueo/Desbloqueo) ---
  const handleToggleLock = async (studentId: string, currentStatus: boolean) => {
      if (!canLockUnlock) return;
      const newStatus = !currentStatus;
      
      // Actualización optimista
      setStudentsData(prev => prev.map(st => {
          if (st.id === studentId) {
             const updatedGrades = st.grades.map((g:any) => g.mes === selectedMonth ? {...g, isLocked: newStatus} : g);
             // Si no existía el mes, no podemos bloquear el aire, pero dejemos la lógica backend encargarse
             return {...st, grades: updatedGrades};
          }
          return st;
      }));

      const res = await toggleGradeLock(studentId, currentSubject.id, selectedMonth, newStatus);
      if (res.success) {
          showToast(`Auditoría ${newStatus ? 'Cerrada' : 'Abierta'} exitosamente`, 'success');
      } else {
          showToast(`Error de auditoría: ${res.message}`, 'error');
          loadGrades(currentSubject.id); // Revertir en caso de error
      }
  };

  // --- MOTOR DE IMPRESIÓN ---
  const handlePrint = (mode: 'CLASS' | 'STUDENT' | 'CLASS_ANNUAL', studentData?: any) => {
      if (studentData) setStudentToGrade(studentData);
      setPrintMode(mode);
      setTimeout(() => {
          window.print();
          setPrintMode('CLASS'); 
      }, 300); 
  };

  // --- GUARDADO DE CALIFICACIÓN ---
  const handleModalSave = async () => {
    setIsSaving(true);
    const result = await saveStudentGrade(
        studentToGrade.id, 
        currentSubject.id, 
        studentToGrade, 
        selectedMonth, 
        role || 'DOCENTE'
    );
    
    if (result.success) {
        showToast("Calificaciones guardadas y sincronizadas", 'success');
        setIsModalOpen(false);
        await loadGrades(currentSubject.id); 
    } else {
        showToast(result.message, 'error');
    }
    setIsSaving(false);
  };

  const handleScoreChange = (key: string, value: string, max: number) => {
    if (value === '') {
        setStudentToGrade((prev: any) => ({ ...prev, [key]: null }));
        return;
    }
    let num = parseInt(value) || 0; 
    if (num > max) num = max; 
    if (num < 0) num = 0;
    setStudentToGrade((prev: any) => ({ ...prev, [key]: num }));
  };

  const openEvaluationModal = (st: any) => {
      setStudentToGrade({
          id: st.id,
          nombre: st.nombre,
          apellido: st.apellido,
          rne: st.rne,
          folio: st.folio,
          fotoUrl: st.fotoUrl,
          isLocked: st.isLocked,
          // Esquema MINERD mapeado a la DB (Total 100)
          disciplina: st.currentMonthGrade?.disciplina ?? null,   // Actitudes (10)
          practica: st.currentMonthGrade?.practica ?? null,       // Prácticas (20)
          tarea: st.currentMonthGrade?.tarea ?? null,             // Asignaciones (20)
          teoria: st.currentMonthGrade?.teoria ?? null,           // Producción (20)
          examenFinal: st.currentMonthGrade?.examenFinal ?? null, // Prueba (30)
          grades: st.grades, 
          average: st.average, 
          avgStatus: st.avgStatus
      });
      setIsModalOpen(true);
  };

  if (isIT) return <div className="flex flex-col items-center justify-center h-[70vh]"><ShieldAlert size={60} className="text-slate-300 mb-4"/><h2 className="text-xl font-bold text-slate-500">Acceso Restringido - Solo Gestión Académica</h2></div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; font-family: 'Arial', sans-serif; }
          .no-print { display: none !important; }
          
          /* Configuración inteligente de la hoja física (MINERD Standars) */
          ${printMode === 'CLASS_ANNUAL' 
             ? '@page { size: landscape; margin: 10mm; }' 
             : '@page { size: portrait; margin: 15mm; }' 
          }
          
          .print-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .print-table th, .print-table td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; }
          .print-table th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 9px; }
          
          /* Control de vistas dinámicas por modo de impresión */
          .mode-CLASS .student-only, .mode-CLASS .class-annual-only { display: none !important; }
          .mode-STUDENT .class-only, .mode-STUDENT .class-annual-only { display: none !important; }
          .mode-CLASS_ANNUAL .class-only, .mode-CLASS_ANNUAL .student-only { display: none !important; }
        }
      `}} />

      <div className={`space-y-8 animate-in fade-in duration-700 pb-24 relative min-h-screen mode-${printMode}`}>
        
        {/* TOAST FLOTANTE */}
        {toast.visible && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 no-print">
            <div className={`px-6 py-4 rounded-[2rem] shadow-2xl border flex items-center gap-4 ${toast.type === 'success' ? 'bg-slate-900 border-emerald-500/30 text-white' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
              <div className={toast.type === 'success' ? 'bg-emerald-500 text-white p-1.5 rounded-full' : 'bg-rose-200 text-rose-700 p-1.5 rounded-full'}>
                {toast.type === 'success' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
              </div>
              <p className="text-xs font-black uppercase tracking-widest">{toast.title}</p>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm no-print">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
               <ShieldCheck size={14}/> {role?.replace('_', ' ')}
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              Expediente de Calificaciones
            </h1>
            <p className="text-slate-500 font-medium mt-1 flex items-center gap-2 text-sm">
               <CalendarDays size={16} className="text-blue-500"/> Ciclo Escolar Activo {CURRENT_SCHOOL_YEAR}
            </p>
          </div>
          
          {viewState === 'DETAILS' && (
              <button onClick={() => setViewState('GRID')} className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm">
                  <ArrowLeft size={16} /> Volver a Cursos
              </button>
          )}
        </div>

        {/* VISTA GRID (Selección de Curso) */}
        {viewState === 'GRID' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 no-print">
              {uniqueCourses.map(course => (
                  <div key={course.id} onClick={() => { setSelectedCourseId(course.id); setSelectedSubjectId(null); setViewState('DETAILS'); }}
                      className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-blue-200 cursor-pointer transition-all duration-500 relative overflow-hidden"
                  >
                      <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-blue-900 transform group-hover:scale-110 transition-transform duration-500 pointer-events-none"><BookOpen size={200}/></div>
                      <div className="flex flex-col h-full justify-between relative z-10">
                          <div>
                              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                 <GraduationCap size={28}/>
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 tracking-tighter">{course.name}</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{course.type}</p>
                          </div>
                      </div>
                  </div>
              ))}
              {uniqueCourses.length === 0 && !isLoading && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                      <BookOpen className="mx-auto text-slate-300 mb-4" size={48}/>
                      <p className="text-slate-500 font-bold">No tienes cursos asignados en este ciclo escolar.</p>
                  </div>
              )}
          </div>
        )}

        {/* VISTA DETALLES: GESTIÓN DE NOTAS */}
        {viewState === 'DETAILS' && currentSubject && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
              
              {/* SELECTORES (Meses y Asignaturas) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 no-print">
                  
                  {/* Selector de Meses */}
                  <div className="xl:col-span-7 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-2 overflow-x-auto hide-scrollbar">
                      <div className="px-4 border-r border-slate-100 shrink-0">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Evaluando Mes</p>
                          <div className="flex items-center gap-2 text-slate-800 font-black text-sm uppercase"><CalendarDays size={16} className="text-blue-500"/> {selectedMonth}</div>
                      </div>
                      <div className="flex gap-2 px-2">
                          {SCHOOL_MONTHS.map(month => (
                              <button key={month} onClick={() => setSelectedMonth(month)}
                                  className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                      selectedMonth === month ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                  }`}
                              >
                                  {month.substring(0,3)}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Selector de Materias del Curso */}
                  <div className="xl:col-span-5 bg-slate-900 p-3 rounded-[2rem] shadow-xl flex items-center gap-2 overflow-x-auto hide-scrollbar">
                      {courseSubjects.map(sub => (
                          <button key={sub.id} onClick={() => setSelectedSubjectId(sub.id)}
                              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 flex-1 justify-center ${
                                  selectedSubjectId === sub.id ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/10'
                              }`}
                          >
                              <BookOpen size={14}/> {sub.name}
                          </button>
                      ))}
                  </div>
              </div>

              {/* BARRA DE BÚSQUEDA, FILTROS Y EXPORTACIÓN */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm no-print">
                  <div className="relative w-full md:w-96 group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <input 
                          type="text" placeholder="Buscar por Nombre o RNE..." 
                          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all border-none"
                      />
                  </div>

                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                      <div className="relative">
                          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                          <select 
                              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                              className="pl-12 pr-10 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none appearance-none cursor-pointer border-none"
                          >
                              <option value="TODOS">Todos</option>
                              <option value="APROBADOS">Aprobados</option>
                              <option value="REPROBADOS">Reprobados</option>
                              <option value="SIN_CALIFICAR">Sin Calificar</option>
                          </select>
                      </div>

                      {canPrint && (
                        <div className="flex gap-2">
                            <button onClick={() => handlePrint('CLASS')} title="Reporte del Mes"
                                className="px-5 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <Printer size={16}/> Reporte Mensual
                            </button>
                            <button onClick={() => handlePrint('CLASS_ANNUAL')} title="Sábana Anual (MINERD)"
                                className="px-5 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                            >
                                <FileText size={16}/> Récord Anual
                            </button>
                        </div>
                      )}
                  </div>
              </div>

              {/* ZONA PRINCIPAL DE LISTADO Y PDF */}
              <div id="printable-area" className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden" style={{ borderRadius: '0', border: 'none', boxShadow: 'none' }}>
                  
                  {/* =========================================================================
                      MODO 1: REPORTE MENSUAL AULA (Impresión + Web)
                      ========================================================================= */}
                  <div className="class-only">
                      
                      {/* Cabecera exclusiva para PDF */}
                      <div className="hidden print-header mb-6 pb-4" style={{ borderBottom: '3px solid #0f172a' }}>
                          <h1 style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>Reporte Mensual de Evaluación Continua</h1>
                          <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}><strong>Centro Educativo:</strong> EduControl Sistema Académico</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px' }}>
                              <div>
                                  <p style={{ margin: '2px 0' }}><strong>Asignatura:</strong> {currentSubject.name}</p>
                                  <p style={{ margin: '2px 0' }}><strong>Mes Evaluado:</strong> {selectedMonth}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                  <p style={{ margin: '2px 0' }}><strong>Docente:</strong> {user?.nombre || '_______________'}</p>
                                  <p style={{ margin: '2px 0' }}><strong>Ciclo:</strong> {CURRENT_SCHOOL_YEAR}</p>
                              </div>
                          </div>
                      </div>

                      {isLoading ? (
                          <div className="py-32 flex flex-col items-center justify-center text-slate-400 no-print">
                              <Loader2 className="animate-spin mb-4" size={40}/>
                              <span className="font-black text-[10px] tracking-[0.3em] uppercase">Sincronizando Registros...</span>
                          </div>
                      ) : (
                          <div className="overflow-x-auto">
                              <table className="w-full text-left print-table">
                                  <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] tracking-[0.2em] border-b border-slate-100">
                                      <tr>
                                          <th className="px-8 py-5">Estudiante (Apellidos, Nombres)</th>
                                          <th className="px-4 py-5 hidden lg:table-cell">Identificación</th>
                                          <th className="px-4 py-5 text-center hidden md:table-cell">Auditoría</th>
                                          <th className="px-6 py-5 text-center text-blue-600 bg-blue-50/50">Nota {selectedMonth}</th>
                                          <th className="px-6 py-5 text-center text-slate-600 border-l border-slate-100">Acumulado General</th>
                                          <th className="px-8 py-5 text-right no-print">Evaluación</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50 text-sm">
                                      {filteredStudents.map((st) => (
                                          <tr key={st.id} className="hover:bg-slate-50/50 transition-all group">
                                              
                                              {/* INFO ESTUDIANTE */}
                                              <td className="px-8 py-5">
                                                  <div className="flex items-center gap-4">
                                                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 no-print">
                                                          {st.fotoUrl ? <img src={st.fotoUrl} className="w-full h-full object-cover"/> : <span className="font-black text-xs text-slate-400">{st.nombre[0]}{st.apellido?.[0]}</span>}
                                                      </div>
                                                      <div>
                                                          <p className="font-black text-slate-900 text-sm leading-tight tracking-tight">{st.apellido}, {st.nombre}</p>
                                                          <div className="flex items-center gap-2 mt-1 hidden print:flex text-[10px] text-slate-500">
                                                              RNE: {st.rne || '-'} | Folio: {st.folio || '-'}
                                                          </div>
                                                      </div>
                                                  </div>
                                              </td>

                                              {/* IDENTIFICACIÓN (Web) */}
                                              <td className="px-4 py-5 hidden lg:table-cell">
                                                  <p className="flex items-center gap-1 text-[10px] font-bold text-slate-500 font-mono"><Fingerprint size={12}/> {st.rne || 'SIN RNE'}</p>
                                                  <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400 font-mono mt-0.5"><Layout size={12}/> Folio {st.folio || '0'}</p>
                                              </td>

                                              {/* AUDITORÍA */}
                                              <td className="px-4 py-5 text-center hidden md:table-cell">
                                                  <div className="flex justify-center">
                                                    {st.isLocked ? 
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg"><Lock size={12}/> Cerrada</span> : 
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg"><Unlock size={12}/> Abierta</span>
                                                    }
                                                  </div>
                                                  {canLockUnlock && (
                                                      <button onClick={() => handleToggleLock(st.id, st.isLocked)} className="mt-2 text-[9px] font-bold text-blue-500 hover:underline no-print block mx-auto uppercase">
                                                          {st.isLocked ? 'Abrir' : 'Cerrar'}
                                                      </button>
                                                  )}
                                              </td>

                                              {/* NOTA DEL MES */}
                                              <td className="px-6 py-5 text-center bg-blue-50/20">
                                                  {st.currentMonthGrade?.final !== null && st.currentMonthGrade?.final !== undefined ? (
                                                      <div>
                                                          <span className="text-xl font-black text-slate-800">{st.currentMonthGrade.final}</span>
                                                          <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${st.currentMonthGrade.final >= 70 ? 'text-emerald-500' : 'text-rose-500'}`}>{st.monthStatus}</p>
                                                      </div>
                                                  ) : (
                                                      <span className="text-xl font-black text-slate-300">-</span>
                                                  )}
                                              </td>

                                              {/* PROMEDIO ACUMULADO */}
                                              <td className="px-6 py-5 text-center border-l border-slate-50">
                                                  {st.average !== null ? (
                                                      <div className="inline-flex flex-col items-center">
                                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${st.average >= 70 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                                                              <span className="text-sm font-black">{st.average}</span>
                                                          </div>
                                                      </div>
                                                  ) : (
                                                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300 font-black">-</div>
                                                  )}
                                              </td>

                                              {/* ACCIONES WEB */}
                                              <td className="px-8 py-5 text-right no-print">
                                                  <div className="flex justify-end gap-2">
                                                      {canPrint && (
                                                          <button onClick={() => handlePrint('STUDENT', st)} title="Imprimir Boletín"
                                                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
                                                          >
                                                              <FileText size={16}/> 
                                                          </button>
                                                      )}
                                                      <button onClick={() => openEvaluationModal(st)}
                                                          className={`h-10 px-4 flex items-center justify-center gap-2 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest border ${
                                                              (isDocente && st.isLocked) 
                                                              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                                                              : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm'
                                                          }`}
                                                      >
                                                          {(isDocente && st.isLocked) ? <Lock size={14}/> : <Edit3 size={14}/>} 
                                                          <span className="hidden sm:inline">Evaluar</span>
                                                      </button>
                                                  </div>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                              
                              {filteredStudents.length === 0 && (
                                 <div className="py-24 text-center border-t border-slate-50 no-print">
                                     <BookOpen className="mx-auto text-slate-200 mb-4" size={48}/>
                                     <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No se encontraron estudiantes.</p>
                                 </div>
                              )}
                          </div>
                      )}
                  </div>

                  {/* =========================================================================
                      MODO 2: BOLETÍN INDIVIDUAL OFICIAL
                      ========================================================================= */}
                  {studentToGrade && (
                      <div className="student-only hidden" style={{ display: printMode === 'STUDENT' ? 'block' : 'none' }}>
                          <div style={{ border: '2px solid #0f172a', padding: '40px', borderRadius: '15px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
                              
                              <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #0f172a', paddingBottom: '20px' }}>
                                  <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '900', letterSpacing: '1px' }}>Boletín de Evaluación Continua</h1>
                                  <p style={{ margin: '0', fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Ministerio de Educación - Formato Académico</p>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '13px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                  <div>
                                      <p style={{ margin: '6px 0' }}><strong style={{color:'#334155'}}>Estudiante:</strong> <span style={{fontSize:'16px', fontWeight:'900', textTransform:'uppercase'}}>{studentToGrade.apellido}, {studentToGrade.nombre}</span></p>
                                      <p style={{ margin: '6px 0' }}><strong style={{color:'#334155'}}>RNE:</strong> {studentToGrade.rne || 'N/A'}</p>
                                      <p style={{ margin: '6px 0' }}><strong style={{color:'#334155'}}>No. de Folio:</strong> {studentToGrade.folio || 'N/A'}</p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                      <p style={{ margin: '6px 0' }}><strong style={{color:'#334155'}}>Asignatura:</strong> {currentSubject.name}</p>
                                      <p style={{ margin: '6px 0' }}><strong style={{color:'#334155'}}>Año Escolar:</strong> {CURRENT_SCHOOL_YEAR}</p>
                                      <p style={{ margin: '6px 0' }}><strong style={{color:'#334155'}}>Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-DO')}</p>
                                  </div>
                              </div>

                              <h3 style={{fontSize: '12px', textTransform: 'uppercase', color: '#0f172a', marginBottom: '10px', fontWeight:'900', letterSpacing:'1px'}}>Desglose Mensual</h3>
                              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', border: '2px solid #e2e8f0' }}>
                                  <thead>
                                      <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                                          <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Periodo Evaluativo</th>
                                          <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>Calificación Asignada</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {SCHOOL_MONTHS.map((month, index) => {
                                          const g = studentToGrade.grades?.find((x:any) => x.mes === month);
                                          const val = g?.final !== undefined && g?.final !== null ? g.final : '-';
                                          return (
                                              <tr key={month} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                  <td style={{ padding: '12px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>MES DE {month}</td>
                                                  <td style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '14px', fontWeight: val !== '-' ? '900' : 'normal', color: (val !== '-' && val < 70) ? '#e11d48' : '#0f172a' }}>{val}</td>
                                              </tr>
                                          )
                                      })}
                                  </tbody>
                              </table>

                              <div style={{ backgroundColor: studentToGrade.average >= 70 ? '#f0fdf4' : (studentToGrade.average !== null ? '#fff1f2' : '#f8fafc'), padding: '30px', borderRadius: '15px', textAlign: 'center', border: `3px solid ${studentToGrade.average >= 70 ? '#bbf7d0' : (studentToGrade.average !== null ? '#fecdd3' : '#e2e8f0')}` }}>
                                  <p style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', color: studentToGrade.average >= 70 ? '#166534' : (studentToGrade.average !== null ? '#9f1239' : '#64748b'), fontWeight: '900', letterSpacing: '2px' }}>Calificación Final Acumulada</p>
                                  <h2 style={{ margin: '15px 0 0 0', fontSize: '72px', color: '#0f172a', lineHeight: '1', fontWeight:'900' }}>{studentToGrade.average ?? '-'}</h2>
                                  <p style={{ margin: '15px 0 0 0', fontSize: '18px', fontWeight: '900', color: '#334155', letterSpacing: '1px' }}>ESTADO: {studentToGrade.avgStatus?.toUpperCase() ?? 'SIN CALIFICAR'}</p>
                              </div>

                              <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}>
                                  <div style={{ width: '220px', borderTop: '2px solid #0f172a', paddingTop: '10px' }}>FIRMA DEL DOCENTE TITULAR</div>
                                  <div style={{ width: '220px', borderTop: '2px solid #0f172a', paddingTop: '10px' }}>SELLO DE DIRECCIÓN</div>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* =========================================================================
                      MODO 3: RÉCORD ANUAL (SÁBANA DEL MINERD)
                      ========================================================================= */}
                  <div className="class-annual-only hidden" style={{ display: printMode === 'CLASS_ANNUAL' ? 'block' : 'none' }}>
                      <div style={{ padding: '10px', fontFamily: 'Arial, sans-serif', color: '#0f172a' }}>
                          <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '3px solid #0f172a', paddingBottom: '15px' }}>
                              <h1 style={{ margin: '0', fontSize: '24px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '2px' }}>Acta de Calificaciones de Evaluación Continua</h1>
                              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Sistema Académico Oficial</p>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '11px', border: '2px solid #cbd5e1', padding: '15px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                              <div>
                                  <p style={{ margin: '3px 0' }}><strong style={{color: '#334155'}}>Asignatura:</strong> {currentSubject.name}</p>
                                  <p style={{ margin: '3px 0' }}><strong style={{color: '#334155'}}>Docente Titular:</strong> {user?.nombre || 'Usuario'} </p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                  <p style={{ margin: '3px 0' }}><strong style={{color: '#334155'}}>Ciclo Escolar:</strong> {CURRENT_SCHOOL_YEAR}</p>
                                  <p style={{ margin: '3px 0' }}><strong style={{color: '#334155'}}>Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-DO')}</p>
                              </div>
                          </div>

                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'center', border: '2px solid #0f172a' }}>
                              <thead>
                                  <tr>
                                      <th style={{ padding: '10px 5px', border: '1px solid #0f172a', backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'left', width: '25%', textTransform: 'uppercase' }}>Apellidos, Nombres</th>
                                      <th style={{ padding: '10px 5px', border: '1px solid #0f172a', backgroundColor: '#0f172a', color: '#ffffff', width: '12%', textTransform: 'uppercase' }}>RNE / FOLIO</th>
                                      {SCHOOL_MONTHS.map(m => (
                                          <th key={m} style={{ padding: '10px 5px', border: '1px solid #0f172a', backgroundColor: '#1e293b', color: '#ffffff', textTransform: 'uppercase', width: '5.5%' }}>{m.substring(0,3)}</th>
                                      ))}
                                      <th style={{ padding: '10px 5px', border: '1px solid #0f172a', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '900', width: '8%' }}>C.F.</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {filteredStudents.map((st, index) => (
                                      <tr key={st.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                          <td style={{ padding: '6px 8px', border: '1px solid #94a3b8', textAlign: 'left' }}>
                                              <strong style={{display: 'block', fontSize: '11px', color: '#0f172a'}}>{st.apellido}, {st.nombre}</strong>
                                          </td>
                                          <td style={{ padding: '6px 8px', border: '1px solid #94a3b8', fontSize: '9px', color: '#475569', fontWeight: 'bold' }}>
                                              {st.rne || 'N/A'}<br/>{st.folio ? `F: ${st.folio}` : ''}
                                          </td>
                                          {SCHOOL_MONTHS.map(month => {
                                              const g = st.grades?.find((x:any) => x.mes === month);
                                              const val = g?.final !== undefined && g?.final !== null ? g.final : '';
                                              const isFail = val !== '' && val < 70;
                                              return (
                                                  <td key={month} style={{ padding: '6px', border: '1px solid #94a3b8', fontWeight: val !== '' ? '900' : 'normal', color: isFail ? '#e11d48' : '#0f172a', backgroundColor: val === '' ? '#f1f5f9' : 'transparent' }}>
                                                      {val}
                                                  </td>
                                              );
                                          })}
                                          <td style={{ padding: '6px', border: '1px solid #94a3b8', backgroundColor: st.average >= 70 ? '#f0fdf4' : (st.average !== null ? '#fff1f2' : '#f8fafc'), color: st.average >= 70 ? '#166534' : (st.average !== null ? '#9f1239' : '#0f172a'), fontWeight: '900', fontSize: '12px' }}>
                                              {st.average ?? '-'}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>

                          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#0f172a', fontWeight: 'bold' }}>
                              <div style={{ width: '200px', borderTop: '2px solid #0f172a', paddingTop: '8px', textAlign: 'center' }}>FIRMA DOCENTE TITULAR</div>
                              <div style={{ width: '200px', borderTop: '2px solid #0f172a', paddingTop: '8px', textAlign: 'center' }}>SELLO DEL CENTRO</div>
                              <div style={{ width: '200px', borderTop: '2px solid #0f172a', paddingTop: '8px', textAlign: 'center' }}>FIRMA DIRECTOR(A)</div>
                          </div>
                      </div>
                  </div>

              </div>
          </div>
        )}

        {/* =========================================================================
            MODAL DE EVALUACIÓN (ESQUEMA MINERD)
            ========================================================================= */}
        {isModalOpen && studentToGrade && currentSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 no-print">
              <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] border border-slate-100">
                  
                  {/* Panel Izquierdo: Formularios de Evaluación */}
                  <div className="flex-1 flex flex-col border-r border-slate-100 bg-slate-50/50">
                      
                      <div className="p-8 border-b border-slate-200 bg-white shadow-sm z-10">
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner shrink-0">
                                      <ClipboardList size={28} />
                                  </div>
                                  <div>
                                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">RÚBRICA DE EVALUACIÓN: {selectedMonth}</p>
                                      <h3 className="font-black text-2xl text-slate-900 tracking-tighter leading-tight">Escala Valorativa (100 pts)</h3>
                                  </div>
                              </div>
                              {studentToGrade.isLocked && (
                                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl flex items-center gap-2">
                                      <Lock size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">Auditoría Cerrada</span>
                                  </div>
                              )}
                          </div>
                      </div>
                      
                      <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                          <div className="space-y-4">
                              {/* ESCALA MINERD EXACTA */}
                              {[
                                  { key: 'disciplina', label: 'Actitudes y Valores', desc: 'Participación, respeto, asistencia', max: 10 },
                                  { key: 'practica', label: 'Prácticas de Aula', desc: 'Ejercicios y trabajo en clase', max: 20 },
                                  { key: 'tarea', label: 'Asignaciones y Tareas', desc: 'Investigación y tareas en casa', max: 20 },
                                  { key: 'teoria', label: 'Producciones Orales / Escritas', desc: 'Exposiciones y revisión de cuaderno', max: 20 },
                                  { key: 'examenFinal', label: 'Prueba Escrita', desc: 'Examen de comprobación mensual', max: 30 }
                              ].map((field) => (
                                  <div key={field.key} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-[1.5rem] border ${studentToGrade.isLocked ? 'border-slate-100 opacity-80' : 'border-slate-200 shadow-sm hover:border-blue-300'} gap-4 transition-colors`}>
                                      <div>
                                          <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">{field.label}</h4>
                                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{field.desc}</p>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Max {field.max}</span>
                                          <input 
                                              type="number" min="0" max={field.max} 
                                              disabled={(!canEditAny) || (isDocente && studentToGrade.isLocked)}
                                              value={studentToGrade[field.key] === null ? '' : studentToGrade[field.key]} 
                                              onChange={(e) => handleScoreChange(field.key, e.target.value, field.max)}
                                              placeholder="--"
                                              className="w-24 px-4 py-3 text-center text-xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:bg-slate-100 placeholder:text-slate-300"
                                          />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="p-8 border-t border-slate-200 flex gap-4 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10">
                          <button onClick={() => setIsModalOpen(false)} className="px-8 py-5 rounded-[1.5rem] font-black text-[11px] text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition-colors">Cancelar</button>
                          
                          {(canEditAny) && !(isDocente && studentToGrade.isLocked) && (
                              <button onClick={handleModalSave} disabled={isSaving} className="flex-1 py-5 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-3 shadow-xl border border-slate-700">
                                  {isSaving ? <Loader2 className="animate-spin text-emerald-400" size={20}/> : <Save size={20} className="text-emerald-400"/>} Confirmar Evaluación
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Panel Derecho: Insights */}
                  <div className="w-full md:w-[400px] bg-slate-900 text-white p-10 flex flex-col relative overflow-hidden shrink-0">
                      <div className="absolute -right-20 -top-20 opacity-5 transform rotate-12 pointer-events-none text-white"><Calculator size={400}/></div>
                      
                      <div className="relative z-10 flex flex-col items-center text-center mt-6">
                          <div className="w-32 h-32 rounded-[2.5rem] bg-white border border-slate-200 flex items-center justify-center font-black overflow-hidden mb-6 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                              {studentToGrade.fotoUrl ? <img src={studentToGrade.fotoUrl} className="w-full h-full object-cover"/> : <span className="text-5xl text-slate-400">{studentToGrade.nombre[0]}{studentToGrade.apellido?.[0]}</span>}
                          </div>
                          <h4 className="text-2xl font-black tracking-tighter leading-tight mb-3">{studentToGrade.nombre} {studentToGrade.apellido}</h4>
                          <div className="flex gap-2 justify-center">
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest border border-slate-700 bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1"><Fingerprint size={12}/> RNE: {studentToGrade.rne || 'N/A'}</span>
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest border border-slate-700 bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1"><Layout size={12}/> F: {studentToGrade.folio || '0'}</span>
                          </div>
                      </div>
                      
                      <div className="mt-auto relative z-10 space-y-4">
                          {(() => {
                              const fields = ['disciplina', 'practica', 'tarea', 'teoria', 'examenFinal'];
                              const isUnscored = fields.every(f => studentToGrade[f] === null || studentToGrade[f] === undefined || studentToGrade[f] === '');
                              const currentFinal = isUnscored ? null : fields.reduce((acc, curr) => acc + (parseInt(studentToGrade[curr]) || 0), 0);
                              
                              return (
                                  <>
                                      <div className={`p-8 rounded-[2rem] border text-center shadow-2xl backdrop-blur-xl ${currentFinal !== null ? (currentFinal >= 70 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30') : 'bg-white/5 border-white/10'}`}>
                                          <p className="text-[10px] font-black text-slate-300 uppercase mb-2 tracking-[0.3em]">Total del Mes ({selectedMonth})</p>
                                          {currentFinal !== null ? (
                                              <div>
                                                  <span className={`text-6xl font-black tracking-tighter leading-none ${currentFinal < 70 ? 'text-rose-400' : 'text-emerald-400'}`}>{currentFinal}</span>
                                                  <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${currentFinal < 70 ? 'text-rose-500' : 'text-emerald-500'}`}>{currentFinal >= 70 ? 'Aprobado' : 'Reprobado'}</p>
                                              </div>
                                          ) : (
                                              <span className="text-6xl font-black text-slate-600">-</span>
                                          )}
                                      </div>
                                      
                                      <div className="bg-slate-950 p-5 rounded-[1.5rem] border border-slate-800 flex items-center justify-between">
                                          <div className="flex items-center gap-3 text-slate-400">
                                              <Calculator size={20}/>
                                              <span className="text-[10px] font-black uppercase tracking-widest">Promedio Anual:</span>
                                          </div>
                                          <span className="text-2xl font-black text-white">{studentToGrade.average ?? '-'}</span>
                                      </div>
                                  </>
                              )
                          })()}
                      </div>
                  </div>
              </div>
          </div>
        )}

      </div>
    </>
  );
}