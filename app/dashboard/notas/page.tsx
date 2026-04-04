'use client';

/**
 * Módulo de Cuaderno de Calificaciones Mensual
 * @description Gestión de evaluación continua, promedios acumulados y reportes PDF consolidados de todo el año.
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, Save, Search, ShieldAlert,
  RefreshCw, Lock, Unlock, Filter, ArrowLeft, GraduationCap,
  Printer, Loader2, Edit3, CalendarDays, FileText, Calculator, ClipboardList
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { getSubjects, getStudentGrades, saveStudentGrade } from './actions';

// CICLO ESCOLAR ACTUALIZADO (Agosto a Mayo)
const SCHOOL_MONTHS = [
    'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO'
];

const CURRENT_SCHOOL_YEAR = "2025-2026"; // Para mostrar en los reportes

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
  
  // Modal de Calificación y Reportes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToGrade, setStudentToGrade] = useState<any>(null);
  const [printMode, setPrintMode] = useState<'CLASS' | 'STUDENT' | 'CLASS_ANNUAL'>('CLASS');

  // --- PERMISOS ---
  const isDirector = role === 'DIRECTOR';
  const isSecretaria = role === 'SECRETARIA';
  const isDocente = role === 'DOCENTE';
  const isIT = role === 'ADMIN_SISTEMA';

  const canEditAny = isDirector || isDocente;
  const canPrint = isSecretaria || isDirector; // Director y Secretaria pueden imprimir consolidados

  // Carga inicial
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

  // Carga TODO el expediente del año de una vez
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

  // --- MOTOR DE PROCESAMIENTO (Calcula promedio acumulado en vivo) ---
  const processedStudents = useMemo(() => {
      return studentsData.map(st => {
          // Extraer la nota del mes seleccionado actualmente
          const currentMonthGrade = st.grades.find((g: any) => g.mes === selectedMonth) || {};
          
          // Calcular el Promedio Final Acumulado de todos los meses evaluados
          const evaluatedMonths = st.grades.filter((g: any) => g.final !== null && g.final !== undefined);
          const totalScore = evaluatedMonths.reduce((acc: number, curr: any) => acc + curr.final, 0);
          const average = evaluatedMonths.length > 0 ? Math.round(totalScore / evaluatedMonths.length) : null;
          
          let avgStatus = 'En Curso';
          if (average !== null) {
              avgStatus = average >= 70 ? 'Aprobado' : 'Reprobado';
          }

          let monthStatus = currentMonthGrade.final !== null && currentMonthGrade.final !== undefined 
              ? (currentMonthGrade.final >= 70 ? 'Aprobado' : 'Reprobado') 
              : 'Sin Calificar';

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
          const matchesSearch = st.nombre.toLowerCase().includes(searchLower) || st.matricula.toLowerCase().includes(searchLower);
          
          let matchesStatus = true;
          if (statusFilter === 'APROBADOS') matchesStatus = st.monthStatus === 'Aprobado';
          if (statusFilter === 'REPROBADOS') matchesStatus = st.monthStatus === 'Reprobado';
          if (statusFilter === 'SIN_CALIFICAR') matchesStatus = st.monthStatus === 'Sin Calificar';

          return matchesSearch && matchesStatus;
      });
  }, [processedStudents, searchTerm, statusFilter]);

  // --- MOTOR DE IMPRESIÓN DINÁMICO ---
  const handlePrint = (mode: 'CLASS' | 'STUDENT' | 'CLASS_ANNUAL', studentData?: any) => {
      if (studentData) setStudentToGrade(studentData);
      setPrintMode(mode);
      setTimeout(() => {
          window.print();
          setPrintMode('CLASS'); // Restaurar estado
      }, 150); 
  };

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
        setIsModalOpen(false);
        await loadGrades(currentSubject.id); 
    } else {
        alert("❌ Error: " + result.message);
    }
    setIsSaving(false);
  };

  const handleScoreChange = (key: string, value: string) => {
    if (value === '') {
        setStudentToGrade((prev: any) => ({ ...prev, [key]: null }));
        return;
    }
    let num = parseInt(value) || 0; 
    if (num > 100) num = 100; 
    if (num < 0) num = 0;
    setStudentToGrade((prev: any) => ({ ...prev, [key]: num }));
  };

  const openEvaluationModal = (st: any) => {
      setStudentToGrade({
          id: st.id,
          nombre: st.nombre,
          matricula: st.matricula,
          foto: st.foto,
          isLocked: st.isLocked,
          disciplina: st.currentMonthGrade?.disciplina ?? null,
          tarea: st.currentMonthGrade?.tarea ?? null,
          practica: st.currentMonthGrade?.practica ?? null,
          teoria: st.currentMonthGrade?.teoria ?? null,
          examenFinal: st.currentMonthGrade?.examenFinal ?? null,
          grades: st.grades, 
          average: st.average, 
          avgStatus: st.avgStatus
      });
      setIsModalOpen(true);
  };

  if (isIT) return <div className="flex flex-col items-center justify-center h-[70vh]"><ShieldAlert size={60} className="text-slate-300 mb-4"/><h2 className="text-xl font-bold text-slate-500">Acceso Restringido</h2></div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
          .no-print { display: none !important; }
          
          /* Configuración inteligente de la hoja física */
          ${printMode === 'CLASS_ANNUAL' 
             ? '@page { size: landscape; margin: 12mm; }' // Horizontal para la sábana anual
             : '@page { size: portrait; margin: 15mm; }'  // Vertical para boletines y aula mes
          }
          
          .print-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .print-table th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; font-size: 10px; }
          .print-table td { font-size: 11px; }
          
          /* Control de vistas dinámicas por modo de impresión */
          .mode-CLASS .student-only, .mode-CLASS .class-annual-only { display: none !important; }
          .mode-STUDENT .class-only, .mode-STUDENT .class-annual-only { display: none !important; }
          .mode-CLASS_ANNUAL .class-only, .mode-CLASS_ANNUAL .student-only { display: none !important; }
        }
      `}} />

      <div className={`space-y-8 animate-in fade-in duration-700 pb-24 relative min-h-screen mode-${printMode}`}>
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-6 no-print">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
              Evaluación Continua
            </h1>
            <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
               <CalendarDays size={16} className="text-blue-500"/> Ciclo Escolar Activo
            </p>
          </div>
          
          {viewState === 'DETAILS' && (
              <button onClick={() => setViewState('GRID')} className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                  <ArrowLeft size={16} /> Volver a Cursos
              </button>
          )}
        </div>

        {/* VISTA GRID */}
        {viewState === 'GRID' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 no-print">
              {uniqueCourses.map(course => (
                  <div key={course.id} onClick={() => { setSelectedCourseId(course.id); setSelectedSubjectId(null); setViewState('DETAILS'); }}
                      className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-500 relative overflow-hidden"
                  >
                      <div className="flex flex-col h-full justify-between relative z-10">
                          <div>
                              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                 <GraduationCap size={28}/>
                              </div>
                              <h3 className="text-3xl font-black text-slate-900 leading-none mb-2">{course.name}</h3>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{course.type}</p>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
        )}

        {/* VISTA DETALLES: GESTION DE NOTAS */}
        {viewState === 'DETAILS' && currentSubject && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
              
              {/* SELECTOR DE MESES INSTANTÁNEO */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-2 items-center no-print">
                  <div className="px-4 border-r border-slate-100 flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                      <CalendarDays size={16}/> Evaluando:
                  </div>
                  <div className="flex overflow-x-auto gap-2 px-2 pb-2 pt-2 hide-scrollbar">
                      {SCHOOL_MONTHS.map(month => (
                          <button 
                              key={month}
                              onClick={() => setSelectedMonth(month)}
                              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                  selectedMonth === month ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                          >
                              {month}
                          </button>
                      ))}
                  </div>
              </div>

              {/* TABS DE MATERIAS */}
              <div className="bg-slate-100/50 p-2 rounded-2xl flex overflow-x-auto border border-slate-100 no-print">
                  {courseSubjects.map(sub => (
                      <button key={sub.id} onClick={() => setSelectedSubjectId(sub.id)}
                          className={`px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-3 ${
                              selectedSubjectId === sub.id ? 'bg-white text-blue-600 shadow-md border border-slate-100 scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 scale-95'
                          }`}
                      >
                          <BookOpen size={16}/> {sub.name}
                      </button>
                  ))}
              </div>

              {/* BARRA DE BÚSQUEDA Y FILTROS */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm no-print">
                  <div className="relative w-full md:w-80 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20}/>
                      <input 
                          type="text" placeholder="Buscar alumno..." 
                          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all border border-transparent focus:border-blue-200"
                      />
                  </div>

                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                      <div className="relative">
                          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                          <select 
                              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                              className="pl-12 pr-10 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors border border-transparent"
                          >
                              <option value="TODOS">Todos los Estados</option>
                              <option value="APROBADOS">Aprobados</option>
                              <option value="REPROBADOS">Reprobados</option>
                              <option value="SIN_CALIFICAR">Sin Calificar</option>
                          </select>
                      </div>

                      {/* BOTONES DE IMPRESIÓN DINÁMICOS */}
                      {canPrint && (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handlePrint('CLASS')} 
                                title="Imprimir solo el mes actual"
                                className="px-5 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <Printer size={16}/> Mes Actual
                            </button>
                            
                            <button 
                                onClick={() => handlePrint('CLASS_ANNUAL')} 
                                title="Imprimir sábana con todos los meses y promedio"
                                className="px-5 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                            >
                                <FileText size={16}/> Récord Anual
                            </button>
                        </div>
                      )}
                  </div>
              </div>

              {/* ZONA DE IMPRESIÓN */}
              <div id="printable-area" className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden" style={{ borderRadius: '0', border: 'none', boxShadow: 'none' }}>
                  
                  {/* =========================================================================
                      MODO 1: REPORTE DEL AULA COMPLETA (Solo el Mes Seleccionado)
                      ========================================================================= */}
                  <div className="class-only">
                      <div className="hidden print-header mb-6 border-b-2 border-black pb-4">
                          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Reporte Mensual de Calificaciones - EduControl</h1>
                          <p style={{ margin: '5px 0' }}><strong>Asignatura:</strong> {currentSubject.name}</p>
                          <p style={{ margin: '5px 0' }}><strong>Mes Evaluado:</strong> {selectedMonth} | <strong>Ciclo Escolar:</strong> {CURRENT_SCHOOL_YEAR}</p>
                          <p style={{ margin: '5px 0' }}><strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-DO')}</p>
                      </div>

                      {isLoading ? (
                          <div className="py-32 flex flex-col items-center text-slate-400 no-print">
                              <RefreshCw className="animate-spin mb-4" size={40}/>
                              <span className="font-black text-[10px] tracking-[0.3em] uppercase">Sincronizando expedientes...</span>
                          </div>
                      ) : (
                          <div className="overflow-x-auto">
                              <table className="w-full text-left print-table">
                                  <thead className="bg-slate-50/50 text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] border-b border-slate-50">
                                      <tr>
                                          <th className="px-10 py-6">Estudiante</th>
                                          <th className="px-6 py-6 text-center hidden md:table-cell">Auditoría</th>
                                          <th className="px-6 py-6 text-center text-blue-600 bg-blue-50/30">Nota {selectedMonth}</th>
                                          <th className="px-6 py-6 text-center text-slate-600 border-l border-slate-200">Promedio General</th>
                                          <th className="px-10 py-6 text-right no-print">Acciones</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50 text-sm">
                                      {filteredStudents.map((st) => (
                                          <tr key={st.id} className="hover:bg-blue-50/20 transition-all group">
                                              <td className="px-10 py-5">
                                                  <div className="flex items-center gap-5">
                                                      <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-sm text-white no-print">{st.foto}</div>
                                                      <div>
                                                          <p className="font-black text-slate-900 text-base leading-tight">{st.nombre}</p>
                                                          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest mt-1">ID: {st.matricula}</p>
                                                      </div>
                                                  </div>
                                              </td>
                                              <td className="px-6 py-5 text-center hidden md:table-cell">
                                                  {st.isLocked ? 
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-full"><Lock size={12}/> Cerrada</span> : 
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full"><Unlock size={12}/> Abierta</span>
                                                  }
                                              </td>
                                              <td className="px-6 py-5 text-center bg-blue-50/10">
                                                  {st.currentMonthGrade?.final !== null && st.currentMonthGrade?.final !== undefined ? (
                                                    <div className="inline-flex flex-col px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700">
                                                        <span className="text-xl font-black leading-none">{st.currentMonthGrade.final}</span>
                                                    </div>
                                                  ) : (
                                                    <span className="text-xl font-black text-slate-300">-</span>
                                                  )}
                                                  <div className="mt-2 hidden print:block text-[10px] uppercase font-bold text-slate-500">{st.monthStatus}</div>
                                              </td>
                                              <td className="px-6 py-5 text-center border-l border-slate-50">
                                                  {st.average !== null ? (
                                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-4 ${st.average >= 70 ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 'border-rose-100 text-rose-600 bg-rose-50'}`}>
                                                        <span className="text-sm font-black">{st.average}</span>
                                                    </div>
                                                  ) : (
                                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-100 text-slate-300 bg-slate-50">
                                                        <span className="text-sm font-black">-</span>
                                                    </div>
                                                  )}
                                              </td>
                                              <td className="px-10 py-5 text-right no-print">
                                                  <div className="flex justify-end gap-2">
                                                      {canPrint && (
                                                          <button 
                                                              onClick={() => handlePrint('STUDENT', st)}
                                                              title="Imprimir Boletín Individual"
                                                              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-sm bg-slate-50 border border-slate-200 text-slate-500 hover:text-white hover:bg-slate-900"
                                                          >
                                                              <FileText size={18}/> 
                                                          </button>
                                                      )}
                                                      <button 
                                                          onClick={() => openEvaluationModal(st)}
                                                          className="inline-flex items-center justify-center px-5 h-12 rounded-2xl transition-all shadow-sm bg-white border border-slate-200 text-blue-600 hover:text-white hover:bg-blue-600"
                                                      >
                                                          <Edit3 size={18}/> 
                                                          <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest ml-2">Evaluar</span>
                                                      </button>
                                                  </div>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>

                  {/* =========================================================================
                      MODO 2: BOLETÍN INDIVIDUAL (Un solo estudiante, todos los meses)
                      ========================================================================= */}
                  {studentToGrade && (
                      <div className="student-only hidden" style={{ display: printMode === 'STUDENT' ? 'block' : 'none' }}>
                          <div style={{ border: '2px solid #0f172a', padding: '40px', borderRadius: '15px', maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif' }}>
                              <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px' }}>
                                  <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', textTransform: 'uppercase', color: '#0f172a' }}>Boletín Consolidado Individual</h1>
                                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>EduControl - Software de Gestión Académica</p>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '14px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <div>
                                      <p style={{ margin: '5px 0' }}><strong>Estudiante:</strong> <span style={{fontSize:'16px', fontWeight:'bold', textTransform:'uppercase'}}>{studentToGrade.nombre}</span></p>
                                      <p style={{ margin: '5px 0' }}><strong>Matrícula:</strong> {studentToGrade.matricula}</p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                      <p style={{ margin: '5px 0' }}><strong>Asignatura:</strong> {currentSubject.name}</p>
                                      <p style={{ margin: '5px 0' }}><strong>Fecha y Hora:</strong> {new Date().toLocaleString('es-DO')}</p>
                                  </div>
                              </div>

                              <h3 style={{fontSize: '14px', textTransform: 'uppercase', color: '#334155', marginBottom: '10px'}}>Detalle por Mes</h3>
                              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                                  <thead>
                                      <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                                          <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>Mes Evaluado</th>
                                          <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase' }}>Calificación Asignada</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {SCHOOL_MONTHS.map((month, index) => {
                                          const g = studentToGrade.grades?.find((x:any) => x.mes === month);
                                          const val = g?.final !== undefined && g?.final !== null ? g.final : '-';
                                          const bgRow = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                                          return (
                                              <tr key={month} style={{ backgroundColor: bgRow }}>
                                                  <td style={{ padding: '10px 12px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>{month}</td>
                                                  <td style={{ padding: '10px 12px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '14px', fontWeight: val !== '-' ? 'bold' : 'normal', color: (val !== '-' && val < 70) ? '#e11d48' : '#0f172a' }}>{val}</td>
                                              </tr>
                                          )
                                      })}
                                  </tbody>
                              </table>

                              <div style={{ backgroundColor: studentToGrade.average >= 70 ? '#f0fdf4' : (studentToGrade.average !== null ? '#fff1f2' : '#f8fafc'), padding: '25px', borderRadius: '12px', textAlign: 'center', border: `2px solid ${studentToGrade.average >= 70 ? '#bbf7d0' : (studentToGrade.average !== null ? '#fecdd3' : '#e2e8f0')}` }}>
                                  <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', color: studentToGrade.average >= 70 ? '#166534' : (studentToGrade.average !== null ? '#9f1239' : '#64748b'), fontWeight: 'bold', letterSpacing: '2px' }}>Promedio Final Acumulado</p>
                                  <h2 style={{ margin: '15px 0 0 0', fontSize: '60px', color: '#0f172a', lineHeight: '1' }}>{studentToGrade.average ?? '-'}</h2>
                                  <p style={{ margin: '10px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#334155' }}>ESTADO ACTUAL: {studentToGrade.avgStatus?.toUpperCase() ?? 'SIN CALIFICAR'}</p>
                              </div>

                              <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-around', textAlign: 'center', fontSize: '12px', color: '#0f172a', fontWeight: 'bold' }}>
                                  <div style={{ width: '250px', borderTop: '2px solid #0f172a', paddingTop: '10px' }}>FIRMA DEL DOCENTE</div>
                                  <div style={{ width: '250px', borderTop: '2px solid #0f172a', paddingTop: '10px' }}>FIRMA / SELLO DE DIRECCIÓN</div>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* =========================================================================
                      MODO 3: RÉCORD ANUAL DE CALIFICACIONES (El súper PDF solicitado)
                      ========================================================================= */}
                  <div className="class-annual-only hidden" style={{ display: printMode === 'CLASS_ANNUAL' ? 'block' : 'none' }}>
                      <div style={{ padding: '15px', fontFamily: 'sans-serif', color: '#0f172a' }}>
                          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                              <h1 style={{ margin: '0', fontSize: '28px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>RÉCORD ANUAL DE CALIFICACIONES</h1>
                              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>EduControl</p>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px', border: '2px solid #cbd5e1', padding: '15px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                              <div>
                                  <p style={{ margin: '4px 0' }}><strong style={{color: '#334155'}}>Asignatura:</strong> {currentSubject.name}</p>
                                  <p style={{ margin: '4px 0' }}><strong style={{color: '#334155'}}>Generado por:</strong> {user?.nombre || 'Usuario'} ({user?.role?.replace('_', ' ') || 'Autorizado'})</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                  <p style={{ margin: '4px 0' }}><strong style={{color: '#334155'}}>Ciclo Escolar:</strong> {CURRENT_SCHOOL_YEAR}</p>
                                  <p style={{ margin: '4px 0' }}><strong style={{color: '#334155'}}>Fecha y Hora de Impresión:</strong> {new Date().toLocaleString('es-DO')}</p>
                              </div>
                          </div>

                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center', border: '2px solid #0f172a' }}>
                              <thead>
                                  <tr>
                                      <th style={{ padding: '12px 8px', border: '1px solid #0f172a', backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'left', width: '22%', textTransform: 'uppercase' }}>ESTUDIANTE</th>
                                      {SCHOOL_MONTHS.map(m => (
                                          <th key={m} style={{ padding: '12px 8px', border: '1px solid #0f172a', backgroundColor: '#1e293b', color: '#ffffff', textTransform: 'uppercase', width: '6.5%' }}>{m.substring(0,3)}</th>
                                      ))}
                                      <th style={{ padding: '12px 8px', border: '1px solid #0f172a', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '900', width: '8%' }}>PROM</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {filteredStudents.map((st, index) => (
                                      <tr key={st.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                          <td style={{ padding: '8px', border: '1px solid #94a3b8', textAlign: 'left' }}>
                                              <strong style={{display: 'block', fontSize: '12px', color: '#0f172a'}}>{st.nombre}</strong>
                                              <span style={{color: '#64748b', fontSize: '10px'}}>{st.matricula}</span>
                                          </td>
                                          {SCHOOL_MONTHS.map(month => {
                                              const g = st.grades?.find((x:any) => x.mes === month);
                                              const val = g?.final !== undefined && g?.final !== null ? g.final : '';
                                              const isFail = val !== '' && val < 70;
                                              return (
                                                  <td key={month} style={{ padding: '8px', border: '1px solid #94a3b8', fontWeight: val !== '' ? 'bold' : 'normal', color: isFail ? '#e11d48' : '#0f172a', backgroundColor: val === '' ? '#f1f5f9' : 'transparent' }}>
                                                      {val}
                                                  </td>
                                              );
                                          })}
                                          <td style={{ padding: '8px', border: '1px solid #94a3b8', backgroundColor: st.average >= 70 ? '#f0fdf4' : (st.average !== null ? '#fff1f2' : '#f8fafc'), color: st.average >= 70 ? '#166534' : (st.average !== null ? '#9f1239' : '#0f172a'), fontWeight: '900', fontSize: '14px' }}>
                                              {st.average ?? '-'}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>

                          <div style={{ marginTop: '70px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#0f172a', fontWeight: 'bold' }}>
                              <div style={{ width: '220px', borderTop: '2px solid #0f172a', paddingTop: '10px', textAlign: 'center' }}>FIRMA DEL DOCENTE</div>
                              <div style={{ width: '220px', borderTop: '2px solid #0f172a', paddingTop: '10px', textAlign: 'center' }}>SELLO DE LA INSTITUCIÓN</div>
                              <div style={{ width: '220px', borderTop: '2px solid #0f172a', paddingTop: '10px', textAlign: 'center' }}>FIRMA DE LA DIRECCIÓN</div>
                          </div>
                      </div>
                  </div>

              </div>
          </div>
        )}

        {/* MODAL DE CALIFICACION */}
        {isModalOpen && studentToGrade && currentSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 no-print">
              <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                  
                  {/* IZQUIERDA: ITINERARIO */}
                  <div className="flex-1 flex flex-col border-r border-slate-100 bg-slate-50/50">
                      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                  <ClipboardList size={24} />
                              </div>
                              <div>
                                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">MES DE {selectedMonth}</p>
                                  <h3 className="font-black text-2xl text-slate-900 tracking-tighter leading-none">Evaluación Continua</h3>
                              </div>
                          </div>
                      </div>
                      
                      <div className="p-8 overflow-y-auto flex-1">
                          <div className="space-y-4">
                              {[
                                  { key: 'disciplina', label: 'Disciplina y Comportamiento', max: 100 },
                                  { key: 'tarea', label: 'Asignaciones y Tareas', max: 100 },
                                  { key: 'practica', label: 'Prácticas de Aula', max: 100 },
                                  { key: 'teoria', label: 'Dominio Teórico', max: 100 },
                                  { key: 'examenFinal', label: 'Prueba Mensual', max: 100 }
                              ].map((field) => (
                                  <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm gap-4 hover:border-blue-300 transition-colors group">
                                      <div>
                                          <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">{field.label}</h4>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Max {field.max} pts</span>
                                          <input 
                                              type="number" min="0" max={field.max} 
                                              disabled={(!canEditAny) || (isDocente && studentToGrade.isLocked)}
                                              value={studentToGrade[field.key] === null ? '' : studentToGrade[field.key]} 
                                              onChange={(e) => handleScoreChange(field.key, e.target.value)}
                                              placeholder="--"
                                              className="w-24 px-4 py-3 text-center text-xl font-black text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all disabled:bg-slate-100 placeholder:text-slate-300"
                                          />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="p-8 border-t border-slate-100 flex gap-4 bg-white">
                          <button onClick={() => setIsModalOpen(false)} className="px-8 py-5 rounded-[1.5rem] font-black text-xs text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 transition-colors">Cancelar</button>
                          
                          {(canEditAny) && !(isDocente && studentToGrade.isLocked) && (
                              <button onClick={handleModalSave} disabled={isSaving} className="flex-1 py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] hover:bg-blue-700 transition-all flex justify-center items-center gap-3 shadow-xl shadow-blue-600/20">
                                  {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Guardar Mes
                              </button>
                          )}
                      </div>
                  </div>

                  {/* DERECHA: INSIGHTS EN VIVO */}
                  <div className="w-full md:w-[360px] bg-slate-900 text-white p-12 flex flex-col relative overflow-hidden shrink-0">
                      <div className="relative z-10 flex flex-col items-center text-center mt-8">
                          <div className="w-32 h-32 rounded-[2.5rem] bg-white text-slate-900 shadow-2xl flex items-center justify-center text-5xl font-black mb-8 uppercase border-8 border-slate-800">
                              {studentToGrade.foto}
                          </div>
                          <h4 className="text-3xl font-black tracking-tighter leading-none mb-4">{studentToGrade.nombre}</h4>
                          <span className="text-[10px] font-bold text-slate-300 tracking-widest font-mono bg-white/10 px-4 py-1.5 rounded-full">{studentToGrade.matricula}</span>
                      </div>
                      
                      <div className="mt-auto relative z-10 space-y-4">
                          {(() => {
                              const fields = ['disciplina', 'tarea', 'practica', 'teoria', 'examenFinal'];
                              const isUnscored = fields.every(f => studentToGrade[f] === null || studentToGrade[f] === undefined);
                              const currentFinal = isUnscored ? null : fields.reduce((acc, curr) => acc + (studentToGrade[curr] || 0), 0);
                              
                              return (
                                  <>
                                      <div className="bg-black/20 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 text-center shadow-inner">
                                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.3em]">Nota {selectedMonth}</p>
                                          {currentFinal !== null ? (
                                              <span className={`text-[3.5rem] font-black tracking-tighter leading-none ${currentFinal < 70 ? 'text-rose-400' : 'text-blue-400'}`}>{currentFinal}</span>
                                          ) : (
                                              <span className="text-[3rem] font-black text-slate-500">-</span>
                                          )}
                                      </div>
                                      
                                      <div className="bg-white/10 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white/10 flex items-center justify-between">
                                          <div className="flex items-center gap-3 text-slate-300">
                                              <Calculator size={20}/>
                                              <span className="text-xs font-bold uppercase tracking-widest">Acumulado Final:</span>
                                          </div>
                                          <span className="text-xl font-black text-white">{studentToGrade.average ?? '-'}</span>
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