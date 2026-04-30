'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Search, Plus, ShieldAlert, Eye, Edit3, Trash2, Loader2,
  Download, Users as UsersIcon, AlertCircle, Star, ChevronLeft, ChevronRight,
  FileText, X, LayoutGrid, List, Printer, GraduationCap, Calendar, CheckCircle2,
  UserPlus, Fingerprint, ImageIcon, Clock, Save, ClipboardList
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { getStudents, deleteStudent, getCourses, getStudentMetrics, createStudent, updateStudent, getSubjectsForReport } from './actions';

// ==================== TIPOS ====================
interface GradeDetail {
  subjectId: string; materia: string; esModulo: boolean;
  m1: string; m2: string; m3: string; m4: string; m5: string;
  m6: string; m7: string; m8: string; m9: string; m10: string;
  final: number;
}

interface Student {
  id: string; nombre: string; apellido: string; rne: string; folio: string;
  curso: string; courseId?: string; estatus: 'ACTIVO' | 'SUSPENDIDO' | 'RETIRADO';
  promedio: number; asistencia: number; calificacionesDetalle?: GradeDetail[];
  fechaNacimiento?: string; genero?: string; direccion?: string; nacionalidad?: string;
  alergias?: string; condiciones?: string; tipoSangre?: string; seguroMedico?: string;
  tutorNombre?: string; tutorParentesco?: string; tutorTelefono?: string; tutorOcupacion?: string;
  fotoUrl?: string; actaNacimientoUrl?: string; certificadoMedicoUrl?: string;
}

interface Course { id: string; name: string; }
interface Subject { id: string; name: string; }
interface Metrics { total: number; enRiesgo: number; sobresalientes: number; }
interface StudentsResponse { data: Student[]; totalPages: number; }

type ViewMode = 'list' | 'grid';
type ReportType = 'LISTA_CURSO' | 'ASISTENCIA_CURSO' | 'NOTAS_CURSO' | 'NOTAS_ESTUDIANTE';
type UserRole = 'DIRECTOR' | 'SECRETARIA' | 'DOCENTE' | 'ADMIN_SISTEMA' | null;

interface ReportConfig { type: ReportType | ''; courseId: string; studentId: string; subjectId: string; date: string; horario: string; }
interface ReportOptionProps { icon: any; title: string; desc: string; val: ReportType; current: ReportType | ''; onSelect: (val: ReportType) => void; }

// ==================== COMPONENTES AUXILIARES ====================

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
      <p className="font-black text-[10px] tracking-[0.3em] uppercase">Cargando registros...</p>
    </div>
  );
}

function EmptyState() {
  return <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-xs">No hay resultados</td></tr>;
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in zoom-in-95">
      <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 mb-6 shadow-inner"><ShieldAlert size={48} /></div>
      <h2 className="text-3xl font-black text-slate-800 tracking-tight">Acceso Restringido</h2>
      <p className="text-slate-500 max-w-sm text-center mt-3 font-medium">Este módulo es de uso exclusivo académico y directivo.</p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, percentage, colorScheme }: { icon: any; label: string; value: number; percentage: number; colorScheme: 'blue' | 'rose' | 'emerald'; }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'text-blue-100', progress: 'text-blue-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'text-rose-100', progress: 'text-rose-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'text-emerald-100', progress: 'text-emerald-500' },
  };
  const c = colors[colorScheme];
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-5">
        <div className={`w-16 h-16 ${c.bg} rounded-2xl flex items-center justify-center ${c.text} shadow-inner`}><Icon size={32} /></div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-4xl font-black ${c.text} leading-none tracking-tighter`}>{value}</p>
        </div>
      </div>
      <div className={`relative w-16 h-16 flex items-center justify-center ${c.bg} rounded-full shadow-inner`}>
        <span className={`text-[11px] font-black ${c.text}`}>{percentage}%</span>
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="5" fill="transparent" className={c.ring} />
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={`${percentage * 1.75} 175`} className={`${c.progress} transition-all duration-1000`} />
        </svg>
      </div>
    </div>
  );
}

function ReportOption({ icon: Icon, title, desc, val, current, onSelect }: ReportOptionProps) {
  const isSelected = current === val;
  return (
    <div onClick={() => onSelect(val)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
      <div className={`p-3 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Icon size={20} /></div>
      <div><h4 className={`text-sm font-black ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>{title}</h4><p className="text-xs font-medium text-slate-500">{desc}</p></div>
    </div>
  );
}

function StudentTableRow({ student, onView, onEdit, onDelete, canEdit, canDelete }: { student: Student; onView: () => void; onEdit: () => void; onDelete: () => void; canEdit: boolean; canDelete: boolean; }) {
  return (
    <tr className="hover:bg-blue-50/30 transition-all group font-medium border-b border-slate-50">
      <td className="px-10 py-6">
        <div className="flex items-center gap-5">
          {student.fotoUrl ? (
            <img src={student.fotoUrl} alt={student.nombre} className="w-12 h-12 rounded-[1rem] object-cover shadow-md" />
          ) : (
            <div className="w-12 h-12 rounded-[1rem] bg-slate-900 text-white flex items-center justify-center font-black uppercase shadow-md">{student.nombre[0]}{student.apellido[0]}</div>
          )}
          <div>
            <div className="font-black text-slate-900 text-base tracking-tight">{student.nombre} {student.apellido}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{student.curso || 'Sin curso'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-6"><span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm ${student.estatus === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{student.estatus}</span></td>
      <td className="px-6 py-6">
          <p className="font-mono text-sm font-bold text-blue-700 flex items-center gap-1.5"><Fingerprint size={14}/> {student.rne}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Folio: {student.folio}</p>
      </td>
      <td className="px-6 py-6 text-center">
        <div className={`inline-flex flex-col px-4 py-2 rounded-xl border ${student.promedio >= 70 ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}><span className="text-lg font-black leading-none">{student.promedio}</span></div>
      </td>
      <td className="px-10 py-6 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={onView} className="p-3 bg-white text-blue-500 hover:bg-blue-50 rounded-xl border border-slate-200 shadow-sm"><Eye size={18} /></button>
          {canEdit && <button onClick={onEdit} className="p-3 bg-white text-amber-500 hover:bg-amber-50 rounded-xl border border-slate-200 shadow-sm"><Edit3 size={18} /></button>}
          {canDelete && <button onClick={onDelete} className="p-3 bg-white text-rose-500 hover:bg-rose-50 rounded-xl border border-slate-200 shadow-sm"><Trash2 size={18} /></button>}
        </div>
      </td>
    </tr>
  );
}

function StudentGridCard({ student, onView, onEdit, canEdit }: { student: Student; onView: () => void; onEdit: () => void; canEdit: boolean; }) {
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        {student.fotoUrl ? (
          <img src={student.fotoUrl} alt={student.nombre} className="w-16 h-16 rounded-[1.2rem] object-cover shadow-md" />
        ) : (
          <div className="w-16 h-16 rounded-[1.2rem] bg-slate-900 text-white flex items-center justify-center font-black uppercase text-xl shadow-md">{student.nombre[0]}{student.apellido[0]}</div>
        )}
        <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg border ${student.estatus === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{student.estatus}</span>
      </div>
      <h3 className="font-black text-slate-900 text-lg tracking-tight mb-1">{student.nombre} {student.apellido}</h3>
      <p className="font-mono text-xs font-bold text-blue-600 flex items-center gap-1"><Fingerprint size={12}/> {student.rne}</p>
      <p className="font-mono text-[10px] font-bold text-slate-400">Folio: {student.folio}</p>
      <p className="text-[10px] font-bold text-amber-600 bg-amber-50 self-start px-2 py-1 rounded-md uppercase mt-2 truncate">{student.curso}</p>

      <div className="my-6 border-t border-slate-100 pt-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Promedio</span>
          <span className="text-2xl font-black">{student.promedio}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div style={{ width: `${Math.min(student.promedio, 100)}%` }} className="h-full bg-blue-500 rounded-full transition-all duration-500" />
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        <button onClick={onView} className="flex-1 p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl flex justify-center transition-colors"><Eye size={18} /></button>
        {canEdit && <button onClick={onEdit} className="flex-1 p-3 bg-slate-50 text-slate-600 hover:bg-amber-500 hover:text-white rounded-xl flex justify-center transition-colors"><Edit3 size={18} /></button>}
      </div>
    </div>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================

export default function StudentsDirectoryPage() {
  const router = useRouter();
  const { user, role } = useUser();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Estados
  const [students, setStudents] = useState<Student[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, enRiesgo: 0, sobresalientes: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [allStudentsReport, setAllStudentsReport] = useState<Student[]>([]);
  const [reportSubjects, setReportSubjects] = useState<Subject[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterCourse, setFilterCourse] = useState('Todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Reportes
  const [isReportEngineOpen, setIsReportEngineOpen] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({ type: '', courseId: '', studentId: '', subjectId: '', date: '', horario: '' });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isReportDataLoading, setIsReportDataLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Formulario Estudiante (Asimilado a Secretaría Administrativa)
  const [showStudentWizard, setShowStudentWizard] = useState(false);
  const [studentStep, setStudentStep] = useState(1);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
  
  const initialStudentState = {
    nombre: '', apellido: '', rne: '', folio: '', fechaNacimiento: '', genero: 'M', 
    direccion: '', nacionalidad: 'Dominicana', fotoFile: null as File | null, actaFile: null as File | null, certificadoFile: null as File | null,
    alergias: '', condiciones: '', tipoSangre: '', seguroMedico: '', tutorNombre: '', tutorParentesco: '', tutorTelefono: '', tutorOcupacion: '', courseId: ''
  };
  const [studentFormData, setStudentFormData] = useState(initialStudentState);

  const typedRole = role as UserRole;
  const isDirector = typedRole === 'DIRECTOR';
  const isSecretaria = typedRole === 'SECRETARIA';
  const isDocente = typedRole === 'DOCENTE';

  const percentages = useMemo(() => {
    const total = metrics.total || 1;
    return {
      pctRiesgo: Math.round((metrics.enRiesgo / total) * 100),
      pctExcelencia: Math.round((metrics.sobresalientes / total) * 100),
      pctRegular: Math.max(0, 100 - Math.round((metrics.enRiesgo / total) * 100) - Math.round((metrics.sobresalientes / total) * 100))
    };
  }, [metrics]);

  const studentsForPDF = useMemo(() => {
    let list = allStudentsReport;
    if (reportConfig.courseId) list = list.filter(s => s.courseId === reportConfig.courseId);
    if (reportConfig.type === 'NOTAS_ESTUDIANTE' && reportConfig.studentId) list = list.filter(s => s.id === reportConfig.studentId);
    return list;
  }, [allStudentsReport, reportConfig]);

  useEffect(() => {
    if (reportConfig.courseId && ['NOTAS_CURSO', 'NOTAS_ESTUDIANTE'].includes(reportConfig.type)) {
      getSubjectsForReport(reportConfig.courseId, user?.email, typedRole).then(setReportSubjects);
    } else { setReportSubjects([]); }
  }, [reportConfig.courseId, reportConfig.type, user?.email, typedRole]);

  // Carga de Datos
  const loadData = useCallback(async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      const [stResponse, coData, stats] = await Promise.all([
        getStudents({ page, search: searchTerm, status: filterStatus, courseId: filterCourse !== 'Todos' ? filterCourse : undefined, userEmail: user.email, role: typedRole ?? undefined }) as Promise<StudentsResponse>,
        getCourses({ userEmail: user.email, role: typedRole ?? undefined }) as Promise<Course[]>,
        getStudentMetrics(user.email, typedRole || undefined) as Promise<Metrics>
      ]);
      setStudents(stResponse.data); setTotalPages(stResponse.totalPages || 1); setCoursesList(coData); setMetrics(stats);
    } catch (err) { console.error("Error al cargar los datos."); } finally { setIsLoading(false); }
  }, [page, searchTerm, filterStatus, filterCourse, user?.email, typedRole]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [searchTerm, filterStatus, filterCourse]);

  // Carga masiva para reportes
  useEffect(() => {
    if (isReportEngineOpen && user?.email) {
      setIsReportDataLoading(true);
      getStudents({ limit: 5000, userEmail: user.email, role: typedRole ?? undefined })
        .then((res: StudentsResponse) => setAllStudentsReport(res.data || []))
        .catch(() => alert("Error cargando datos PDF"))
        .finally(() => setIsReportDataLoading(false));
    }
  }, [isReportEngineOpen, typedRole, user?.email]);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`¿Confirma tramitar la baja de ${name}?`)) return;
    try { const res = await deleteStudent(id); if (res.success) await loadData(); else alert("Error: " + res.message); } catch (err) { alert("Error al eliminar"); }
  }, [loadData]);

  // Manejo del Formulario (Wizard)
  const handleOpenCreate = () => { setStudentFormData(initialStudentState); setFotoPreview(null); setEditingStudent(null); setStudentStep(1); setFeedback(null); setShowStudentWizard(true); };
  const handleOpenEdit = (student: Student) => { setEditingStudent(student); setStudentFormData({ ...initialStudentState, ...student, courseId: student.courseId || '' }); setFotoPreview(student.fotoUrl || null); setStudentStep(1); setFeedback(null); setShowStudentWizard(true); };
  
  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.type === 'file') {
      const file = target.files?.[0] || null; setStudentFormData(prev => ({ ...prev, [target.name]: file }));
      if (target.name === 'fotoFile' && file) setFotoPreview(URL.createObjectURL(file));
    } else setStudentFormData(prev => ({ ...prev, [target.name]: target.value }));
  };

  const handleStudentSubmit = async () => {
    setIsSaving(true); setFeedback(null);
    try {
      const data = new FormData();
      Object.entries(studentFormData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) { if (value instanceof File) data.append(key, value); else data.append(key, String(value)); }
      });
      const result = editingStudent ? await updateStudent(editingStudent.id, data) : await createStudent(data);
      if (result.success) { setShowStudentWizard(false); loadData(); } else setFeedback({ type: 'error', msg: result.message || 'Error.' });
    } catch (err) { setFeedback({ type: 'error', msg: 'Error de red.' }); } finally { setIsSaving(false); }
  };

  // Generación PDF Blindada
  const executePDFGeneration = useCallback(async () => {
    if (!reportConfig.type) return alert("Seleccione formato.");
    if (isReportDataLoading) return alert("Cargando datos...");
    if (reportConfig.type === 'ASISTENCIA_CURSO' && (!reportConfig.courseId || !reportConfig.date)) return alert("Requiere curso y fecha para el pase de lista.");
    if (reportConfig.type === 'NOTAS_ESTUDIANTE' && !reportConfig.studentId) return alert("Seleccione un estudiante específico.");
    if (['LISTA_CURSO', 'ASISTENCIA_CURSO', 'NOTAS_CURSO'].includes(reportConfig.type) && !reportConfig.courseId) return alert("Seleccione un curso.");
    if (studentsForPDF.length === 0) return alert("No hay estudiantes para imprimir.");

    setIsGeneratingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      if (!reportRef.current) throw new Error("DOM de reporte inaccesible.");
      
      const reportElement = reportRef.current;
      const parentElement = reportElement.parentElement;
      
      if (parentElement) {
        // Guardamos los estilos originales (oculto)
        const originalStyles = parentElement.style.cssText;
        
        // Forzamos la visibilidad para que html2canvas pueda "verlo" detrás de escena
        parentElement.style.cssText = 'position: absolute; top: 0; left: 0; width: 1000px; z-index: -1000; visibility: visible; opacity: 1; pointer-events: none; overflow: visible; background: white;';
        
        await new Promise(resolve => setTimeout(resolve, 300));

        const canvas = await html2canvas(reportElement, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#ffffff', 
          windowWidth: 1000,
          logging: false
        });
        
        // Ocultamos el elemento de nuevo inmediatamente
        parentElement.style.cssText = originalStyles;
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        let heightLeft = pdfHeight; 
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight); 
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) { 
          position = heightLeft - pdfHeight; 
          pdf.addPage(); 
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight); 
          heightLeft -= pageHeight; 
        }

        pdf.save(`EduControl_${reportConfig.type}_${new Date().toISOString().slice(0, 10)}.pdf`);
        setIsReportEngineOpen(false); 
        setReportConfig({ type: '', courseId: '', studentId: '', subjectId: '', date: '', horario: '' });
      }
    } catch (err) { 
      console.error(err);
      alert("Error al generar PDF."); 
    } finally { 
      setIsGeneratingPDF(false); 
    }
  }, [reportConfig, studentsForPDF.length, isReportDataLoading]);

  if (typedRole === 'ADMIN_SISTEMA') return <AccessDenied />;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-12 relative max-w-7xl mx-auto p-4 md:p-8">

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><UsersIcon size={32} /></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Matrícula</p><p className="text-4xl font-black text-slate-900 leading-none tracking-tighter">{metrics.total}</p></div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-2 uppercase tracking-wider"><span>Rendimiento Académico</span></div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${percentages.pctExcelencia}%` }} className="bg-emerald-500 h-full" />
              <div style={{ width: `${percentages.pctRegular}%` }} className="bg-blue-400 h-full" />
              <div style={{ width: `${percentages.pctRiesgo}%` }} className="bg-rose-500 h-full" />
            </div>
          </div>
        </div>
        <MetricCard icon={AlertCircle} label="En Riesgo" value={metrics.enRiesgo} percentage={percentages.pctRiesgo} colorScheme="rose" />
        <MetricCard icon={Star} label="Sobresalientes" value={metrics.sobresalientes} percentage={percentages.pctExcelencia} colorScheme="emerald" />
      </div>

      {/* HEADER */}
      <div className="mb-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{isDocente ? 'Mis Estudiantes' : 'Directorio General'}</h1>
        <p className="text-slate-400 font-medium mt-2 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-emerald-500" /> Data sincronizada correctamente</p>
      </div>

      {/* BOTONES PREMIUM */}
      <div className={`grid grid-cols-1 ${isDirector || isSecretaria ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-2xl'} gap-6 mb-8`}>
        {(isDirector || isSecretaria) && (
          <button onClick={handleOpenCreate} className="text-left group relative bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] text-white shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md"><UserPlus size={32} className="text-amber-400" /></div>
                <div><h3 className="text-3xl font-black tracking-tighter">Nueva Admisión</h3><p className="text-slate-400 text-sm mt-2 font-medium max-w-sm">Registrar expediente completo.</p></div>
              </div>
          </button>
        )}
        
        <button onClick={() => setIsReportEngineOpen(true)} className="text-left group relative bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-[3rem] text-white shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md"><Printer size={32} className="text-blue-100" /></div>
              <div><h3 className="text-3xl font-black tracking-tighter">Centro de Reportes</h3><p className="text-blue-100 text-sm mt-2 font-medium max-w-sm opacity-90">Generar registros de asistencia y récord mensual (Ago-Jun).</p></div>
            </div>
        </button>
      </div>

      {/* FILTROS DE CURSO */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar">
        <button onClick={() => setFilterCourse('Todos')} className={`whitespace-nowrap px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterCourse === 'Todos' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>Todos los Cursos</button>
        {coursesList.map(c => (
          <button key={c.id} onClick={() => setFilterCourse(c.id)} className={`whitespace-nowrap px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterCourse === c.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>{c.name}</button>
        ))}
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-50/50">
          <div className="relative flex-1 w-full lg:max-w-md group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input type="text" placeholder="Buscar por nombre, RNE o folio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-4 bg-white rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
          </div>
          <div className="flex gap-4 items-center">
            <select className="px-6 py-4 bg-white rounded-[1.5rem] shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="Todos">Cualquier Estatus</option>
              <option value="ACTIVO">Activos</option>
              <option value="SUSPENDIDO">Suspendidos</option>
            </select>
            <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem]">
              <button onClick={() => setViewMode('list')} className={`p-3.5 rounded-2xl ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><List size={18} /></button>
              <button onClick={() => setViewMode('grid')} className={`p-3.5 rounded-2xl ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
            </div>
          </div>
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <>
            {viewMode === 'list' && (
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] border-b border-slate-50">
                    <tr><th className="px-10 py-8">Estudiante</th><th className="px-6 py-8">Estatus</th><th className="px-6 py-8">Identidad Oficial</th><th className="px-6 py-8 text-center">Promedio</th><th className="px-10 py-8 text-right">Acciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.length > 0 ? students.map((st) => <StudentTableRow key={st.id} student={st} onView={() => router.push(`/dashboard/estudiantes/${st.id}`)} onEdit={() => handleOpenEdit(st)} onDelete={() => handleDelete(st.id, st.nombre)} canEdit={isDirector || isSecretaria} canDelete={isDirector} />) : <EmptyState />}
                  </tbody>
                </table>
              </div>
            )}
            {viewMode === 'grid' && (
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 min-h-[400px]">
                {students.length > 0 ? students.map((st) => <StudentGridCard key={st.id} student={st} onView={() => router.push(`/dashboard/estudiantes/${st.id}`)} onEdit={() => handleOpenEdit(st)} canEdit={isDirector || isSecretaria} />) : <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase text-xs">No hay resultados</div>}
              </div>
            )}
          </>
        )}

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">Mostrando {students.length} de {metrics.total}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-3 bg-white rounded-xl border border-slate-200 disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="px-4 py-3 text-sm font-bold text-slate-600">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-3 bg-white rounded-xl border border-slate-200 disabled:opacity-50"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* WIZARD ADMISIÓN COMPLETA (4 PASOS - IDÉNTICO SECRETARÍA) */}
      {showStudentWizard && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[3.5rem] shadow-2xl flex flex-col">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-amber-50/50">
                 <h3 className="font-black text-3xl text-slate-900 tracking-tighter flex items-center gap-3">{editingStudent ? <Edit3 className="text-amber-500" /> : <UserPlus className="text-amber-500"/>} {editingStudent ? 'Actualizar Expediente' : 'Nueva Admisión'}</h3>
                 <button onClick={() => setShowStudentWizard(false)} className="p-4 bg-white hover:bg-red-500 hover:text-white rounded-[1.5rem] shadow-xl transition-all"><X size={26}/></button>
               </div>
               
               {/* PROGRESS BAR 4 PASOS */}
               <div className="flex bg-slate-50 border-b border-slate-200 px-4 shrink-0 overflow-x-auto">
                 <div className={`flex-1 p-4 font-black text-xs uppercase tracking-widest text-center whitespace-nowrap border-b-4 ${studentStep >= 1 ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}>1. Identidad</div>
                 <div className={`flex-1 p-4 font-black text-xs uppercase tracking-widest text-center whitespace-nowrap border-b-4 ${studentStep >= 2 ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}>2. Médicos</div>
                 <div className={`flex-1 p-4 font-black text-xs uppercase tracking-widest text-center whitespace-nowrap border-b-4 ${studentStep >= 3 ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}>3. Familiar</div>
                 <div className={`flex-1 p-4 font-black text-xs uppercase tracking-widest text-center whitespace-nowrap border-b-4 ${studentStep === 4 ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}>4. Asignación</div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                 {feedback && (<div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm"><AlertCircle size={18}/> {feedback.msg}</div>)}
                 
                 <div className="space-y-8 pb-10">
                   {/* PASO 1: IDENTIDAD */}
                   {studentStep === 1 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex items-center p-6 bg-slate-50 rounded-[2rem] gap-6 border border-slate-200">
                          <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">{fotoPreview ? <img src={fotoPreview} className="w-full h-full object-cover" /> : <ImageIcon size={32}/>}</div>
                          <div className="w-full"><label className="text-[11px] font-black text-slate-500 uppercase ml-1 block mb-2">Foto 2x2</label><input type="file" name="fotoFile" onChange={handleStudentChange} className="w-full p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl text-slate-500" /></div>
                        </div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Nombres</label><input type="text" name="nombre" value={studentFormData.nombre} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Apellidos</label><input type="text" name="apellido" value={studentFormData.apellido} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-blue-600 uppercase">RNE</label><input type="text" name="rne" value={studentFormData.rne} onChange={handleStudentChange} className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl font-black uppercase text-blue-900" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Folio</label><input type="text" name="folio" value={studentFormData.folio} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Dirección de Residencia</label><input type="text" name="direccion" value={studentFormData.direccion} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase block mb-2">Acta de Nacimiento (PDF/IMG)</label><input type="file" name="actaFile" onChange={handleStudentChange} className="w-full p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl text-slate-500" /></div>
                     </div>
                   )}
                   
                   {/* PASO 2: MÉDICOS */}
                   {studentStep === 2 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 p-6 bg-red-50 rounded-[2rem] border border-red-100"><label className="text-[11px] font-black text-red-600 uppercase block mb-2">Certificado Médico (PDF/IMG)</label><input type="file" name="certificadoFile" onChange={handleStudentChange} className="w-full p-4 bg-white border-2 border-dashed border-red-200 rounded-2xl text-red-500" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Tipo de Sangre</label>
                            <select name="tipoSangre" value={studentFormData.tipoSangre} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold">
                                <option value="">Seleccione...</option><option value="O+">O+</option><option value="O-">O-</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                            </select>
                        </div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Seguro Médico / ARS</label><input type="text" name="seguroMedico" value={studentFormData.seguroMedico} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" /></div>
                        <div className="md:col-span-2"><label className="text-[11px] font-black text-slate-500 uppercase">Alergias Conocidas</label><textarea name="alergias" value={studentFormData.alergias} onChange={handleStudentChange} rows={3} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Ninguna..." /></div>
                        <div className="md:col-span-2"><label className="text-[11px] font-black text-slate-500 uppercase">Condiciones Especiales</label><textarea name="condiciones" value={studentFormData.condiciones} onChange={handleStudentChange} rows={3} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Ninguna..." /></div>
                     </div>
                   )}
                   
                   {/* PASO 3: FAMILIAR */}
                   {studentStep === 3 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><label className="text-[11px] font-black text-slate-500 uppercase">Nombre Completo Tutor Legal</label><input type="text" name="tutorNombre" value={studentFormData.tutorNombre} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Parentesco (Ej: Madre, Padre)</label><input type="text" name="tutorParentesco" value={studentFormData.tutorParentesco} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Teléfono de Contacto</label><input type="text" name="tutorTelefono" value={studentFormData.tutorTelefono} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" /></div>
                        <div className="md:col-span-2"><label className="text-[11px] font-black text-slate-500 uppercase">Ocupación del Tutor</label><input type="text" name="tutorOcupacion" value={studentFormData.tutorOcupacion} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" /></div>
                     </div>
                   )}
                   
                   {/* PASO 4: ASIGNACIÓN */}
                   {studentStep === 4 && (
                     <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-800">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">Seleccione Curso Oficial</label>
                        <select name="courseId" value={studentFormData.courseId} onChange={handleStudentChange} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-lg">
                          <option value="" className="text-slate-800">-- Seleccionar Curso --</option>
                          {coursesList.map(c => <option key={c.id} value={c.id} className="text-slate-800">{c.name}</option>)}
                        </select>
                     </div>
                   )}
                 </div>
               </div>
               
               {/* NAVEGACIÓN FORMULARIO */}
               <div className="p-6 border-t border-slate-100 flex justify-between bg-white shrink-0">
                 <button onClick={() => setStudentStep(p => p - 1)} disabled={studentStep === 1} className="flex items-center gap-2 px-6 py-4 font-black text-slate-500 uppercase text-[11px] disabled:opacity-30"><ChevronLeft size={18}/> Atrás</button>
                 {studentStep === 4 ? (
                   <button onClick={handleStudentSubmit} disabled={isSaving || !studentFormData.courseId} className="flex items-center gap-3 px-10 py-4 bg-amber-500 text-white font-black rounded-[2rem] disabled:opacity-50 uppercase text-[10px] tracking-widest">{isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Finalizar Registro</button>
                 ) : (
                   <button onClick={() => setStudentStep(p => p + 1)} className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white font-black rounded-[2rem] uppercase text-[10px] tracking-widest">Siguiente <ChevronRight size={20}/></button>
                 )}
               </div>
           </div>
         </div>
      )}

      {/* MOTOR REPORTE PDF (CONFIGURACIÓN) */}
      {isReportEngineOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><Printer size={24} /></div>
                <div><h3 className="text-xl font-black text-slate-900">Centro de Reportes</h3><p className="text-[10px] text-slate-500 font-bold uppercase">Exportación Inteligente</p></div>
              </div>
              <button onClick={() => setIsReportEngineOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-8 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {isReportDataLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-blue-500 mr-3" size={24} /><span className="text-sm font-bold text-slate-500">Analizando expedientes...</span></div>
              ) : (
                <p className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" />Formatos Disponibles:</p>
              )}

              <div className="grid grid-cols-1 gap-3">
                <ReportOption icon={FileText} title="Récord Individual (10 Meses)" desc="Historial completo de un solo estudiante." val="NOTAS_ESTUDIANTE" current={reportConfig.type} onSelect={(t) => setReportConfig(p => ({...p, type: t, subjectId: '', studentId: '', horario: ''}))} />
                <ReportOption icon={ClipboardList} title="Control de Asistencia" desc="Pase de lista con bloques pedagógicos." val="ASISTENCIA_CURSO" current={reportConfig.type} onSelect={(t) => setReportConfig(p => ({...p, type: t, subjectId: '', studentId: '', horario: ''}))} />
                <ReportOption icon={GraduationCap} title="Récord de Curso (Masivo)" desc="Calificaciones de todos los alumnos." val="NOTAS_CURSO" current={reportConfig.type} onSelect={(t) => setReportConfig(p => ({...p, type: t, subjectId: '', studentId: '', horario: ''}))} />
                <ReportOption icon={UsersIcon} title="Listado por Curso" desc="Nómina oficial y general." val="LISTA_CURSO" current={reportConfig.type} onSelect={(t) => setReportConfig(p => ({...p, type: t, subjectId: '', studentId: '', horario: ''}))} />
              </div>

              {/* SELECTORES DINÁMICOS */}
              {reportConfig.type && (
                <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2">
                  <div className="mb-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">1. Seleccione el Curso</label>
                    <select className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold" value={reportConfig.courseId} onChange={(e) => setReportConfig(p => ({ ...p, courseId: e.target.value, studentId: '', subjectId: '' }))}>
                      <option value="">-- Buscar Curso --</option>
                      {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {reportConfig.type === 'ASISTENCIA_CURSO' && reportConfig.courseId && (
                    <div className="mb-4 animate-in fade-in space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center gap-1"><Calendar size={12} /> 2. Día de Control</label>
                        <input type="date" className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold" value={reportConfig.date} onChange={(e) => setReportConfig(p => ({ ...p, date: e.target.value }))} />
                      </div>
                    </div>
                  )}

                  {reportConfig.type === 'NOTAS_ESTUDIANTE' && reportConfig.courseId && (
                    <div className="mb-4 animate-in fade-in">
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">2. Seleccione Estudiante</label>
                      <select className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold" value={reportConfig.studentId} onChange={(e) => setReportConfig(p => ({ ...p, studentId: e.target.value }))}>
                        <option value="">-- Buscar Estudiante --</option>
                        {allStudentsReport.filter(s => s.courseId === reportConfig.courseId).map(s => (
                          <option key={s.id} value={s.id}>{s.apellido}, {s.nombre} ({s.rne})</option>
                        ))}
                      </select>
                    </div>
                  )}

                </div>
              )}

              {reportConfig.type && !isReportDataLoading && reportConfig.courseId && (
                <div className={`mt-4 p-4 rounded-xl border ${studentsForPDF.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                  <p className="text-sm font-bold flex items-center gap-2">
                    {studentsForPDF.length > 0 ? <><CheckCircle2 size={16} />Listo: {studentsForPDF.length} registros para imprimir.</> : <><AlertCircle size={16} />Esperando selección completa...</>}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => { setIsReportEngineOpen(false); setReportConfig({ type: '', courseId: '', studentId: '', subjectId: '', date: '', horario: '' }); }} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
              <button onClick={executePDFGeneration} disabled={!reportConfig.type || isGeneratingPDF || isReportDataLoading || studentsForPDF.length === 0} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                {isGeneratingPDF ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : <><Download size={16} /> Generar Oficial</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOM OCULTO PARA GENERAR PDF OFICIAL (BLINDADO AGO-MAY / ASISTENCIA) */}
      {/* ========================================================================= */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden', zIndex: -1000, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
        <div ref={reportRef} style={{ width: '1000px', backgroundColor: '#ffffff', padding: '60px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#0f172a' }}>
          
          {/* HEADER DEL DOCUMENTO */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #1e40af', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', color: '#1e40af', margin: 0 }}>Centro Educativo Villa Tapia</h1>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#64748b', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {reportConfig.type === 'NOTAS_ESTUDIANTE' ? 'RÉCORD INDIVIDUAL - AÑO ESCOLAR COMPLETO' : reportConfig.type.replace(/_/g, ' ')}
              </h2>
            </div>
            <div style={{ textAlign: 'right', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              <p style={{ margin: 0 }}><strong>Fecha:</strong> {isMounted ? new Date().toLocaleDateString('es-DO') : ''}</p>
              <p style={{ margin: 0 }}><strong>Hora:</strong> {isMounted ? new Date().toLocaleTimeString('es-DO') : ''}</p>
              <p style={{ margin: 0 }}><strong>Sistema:</strong> EduControl</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between' }}>
             <div>
               {reportConfig.courseId && <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Curso: <span style={{ color: '#2563eb' }}>{coursesList.find(c => c.id === reportConfig.courseId)?.name}</span></p>}
               {reportConfig.date && <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Fecha: <span style={{ color: '#2563eb' }}>{reportConfig.date}</span></p>}
               {['NOTAS_CURSO', 'NOTAS_ESTUDIANTE'].includes(reportConfig.type) && <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af', marginTop: '5px' }}>Año Escolar: Agosto - Junio</p>}
             </div>
          </div>

          {/* A) LISTA O ASISTENCIA (CON BLOQUES PEDAGÓGICOS) */}
          {['LISTA_CURSO', 'ASISTENCIA_CURSO'].includes(reportConfig.type) && (
            <div>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', border: '2px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#475569', width: '40px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#475569' }}>Apellidos y Nombres</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#475569', textAlign: 'center', width: '140px' }}>RNE</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#475569', textAlign: 'center', width: '120px' }}>Folio</th>
                    {reportConfig.type === 'ASISTENCIA_CURSO' && <th style={{ padding: '12px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#475569', textAlign: 'center', width: '150px' }}>Estado (P/T/E/A)</th>}
                  </tr>
                </thead>
                <tbody>
                  {studentsForPDF.map((st, i) => (
                    <tr key={st.id}>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>{st.apellido}, {st.nombre}</td>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontSize: '13px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>{st.rne}</td>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontSize: '13px', textAlign: 'center', fontFamily: 'monospace' }}>{st.folio}</td>
                      {reportConfig.type === 'ASISTENCIA_CURSO' && <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}></td>}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* BLOQUES PEDAGÓGICOS (FIRMA DEL DOCENTE POR HORA DE CLASE) */}
              {reportConfig.type === 'ASISTENCIA_CURSO' && (
                <div style={{ marginTop: '40px', border: '2px solid #64748b', borderRadius: '12px', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                    <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px' }}>
                      <h3 style={{ fontSize: '14px', margin: 0, textTransform: 'uppercase', fontWeight: 900 }}>Resumen de Bloques Pedagógicos del Día</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <th style={{ border: '1px solid #cbd5e1', padding: '10px', color: '#475569', width: '150px' }}>Horario / Hora Clases</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '10px', color: '#475569', width: '250px' }}>Asignatura</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '10px', color: '#475569', width: '250px' }}>Docente a Cargo</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '10px', color: '#475569' }}>Firma de Validación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5, 6].map(row => (
                          <tr key={row}>
                            <td style={{ border: '1px solid #cbd5e1', padding: '18px' }}></td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '18px' }}></td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '18px' }}></td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '18px' }}></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              )}
            </div>
          )}

          {/* B) RÉCORD DE CALIFICACIONES INDIVIDUAL (RÉPLICA DE IMAGEN 10 MESES) */}
          {['NOTAS_CURSO', 'NOTAS_ESTUDIANTE'].includes(reportConfig.type) && (
            <div>
              {studentsForPDF.map((st, i) => {
                const isIndividual = reportConfig.type === 'NOTAS_ESTUDIANTE';
                const hasModules = st.calificacionesDetalle?.some(c => c.esModulo);

                return (
                  <div key={st.id} style={{ pageBreakInside: 'avoid', marginBottom: '60px' }}>
                    
                    {/* BLOQUE DE INFORMACIÓN PERSONAL (IGUAL A LA IMAGEN) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', marginBottom: '25px' }}>
                      <div style={{ padding: '20px', border: '2px solid #e2e8f0', borderRadius: '15px', backgroundColor: '#f8fafc' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 900, backgroundColor: '#1e293b', color: 'white', padding: '8px 12px', marginBottom: '15px', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Datos Generales del Estudiante {isIndividual ? '' : `#${i+1}`}</h3>
                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr style={{ height: '30px' }}><td style={{ fontWeight: 'bold', width: '140px' }}>Nombre Completo:</td><td style={{ borderBottom: '1px solid #ccc' }}>{st.apellido}, {st.nombre}</td></tr>
                            <tr style={{ height: '30px' }}><td style={{ fontWeight: 'bold' }}>RNE:</td><td style={{ borderBottom: '1px solid #ccc', fontFamily: 'monospace' }}>{st.rne}</td></tr>
                            <tr style={{ height: '30px' }}><td style={{ fontWeight: 'bold' }}>Folio / Registro:</td><td style={{ borderBottom: '1px solid #ccc' }}>{st.folio}</td></tr>
                            <tr style={{ height: '30px' }}><td style={{ fontWeight: 'bold' }}>Tutor / Contacto:</td><td style={{ borderBottom: '1px solid #ccc' }}>{st.tutorNombre || 'N/A'} ({st.tutorTelefono || 'N/A'})</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ padding: '15px', border: '2px solid #e2e8f0', borderRadius: '15px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                          <p style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', margin: '0 0 5px 0', textTransform: 'uppercase' }}>ASISTENCIA ACUMULADA</p>
                          <p style={{ fontSize: '32px', fontWeight: 900, color: st.asistencia < 80 ? '#ef4444' : '#10b981', margin: 0 }}>{st.asistencia}%</p>
                        </div>
                        <div style={{ padding: '15px', border: '2px solid #e2e8f0', borderRadius: '15px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                          <p style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', margin: '0 0 5px 0', textTransform: 'uppercase' }}>PROMEDIO GENERAL</p>
                          <p style={{ fontSize: '32px', fontWeight: 900, color: '#1e40af', margin: 0 }}>{st.promedio}</p>
                        </div>
                      </div>
                    </div>

                    {/* TABLA 1: ESTRUCTURA CURRICULAR GENERAL (10 MESES) */}
                    <h3 style={{ fontSize: '13px', fontWeight: 900, backgroundColor: '#1e40af', color: 'white', padding: '10px', marginBottom: '0px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', textTransform: 'uppercase' }}>Estructura Curricular General (Académica)</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '25px', border: '1px solid #000' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#e2e8f0' }}>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '200px' }}>ASIGNATURA</th>
                          {['AGO', 'SEP', 'OCT', 'NOV', 'DIC', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY'].map(mes => (
                            <th key={mes} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '45px' }}>{mes}</th>
                          ))}
                          <th style={{ border: '2px solid #000', padding: '8px', textAlign: 'center', backgroundColor: '#cbd5e1', fontWeight: 900, width: '60px' }}>PROM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {st.calificacionesDetalle?.filter(g => !g.esModulo).map((grade, idx) => (
                          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{grade.materia}</td>
                            {[1,2,3,4,5,6,7,8,9,10].map(m => (
                              <td key={m} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{grade[`m${m}` as keyof GradeDetail] || '-'}</td>
                            ))}
                            <td style={{ border: '2px solid #000', padding: '6px', textAlign: 'center', fontWeight: 900, backgroundColor: '#f1f5f9', fontSize: '12px' }}>{grade.final}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* TABLA 2: MÓDULOS TÉCNICOS (SI APLICA) */}
                    {hasModules && (
                      <>
                        <h3 style={{ fontSize: '13px', fontWeight: 900, backgroundColor: '#475569', color: 'white', padding: '10px', marginBottom: '0px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', textTransform: 'uppercase' }}>Módulos Formativos (Área Técnica)</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #000' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#e2e8f0' }}>
                              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '200px' }}>MÓDULO TÉCNICO</th>
                              {['AGO', 'SEP', 'OCT', 'NOV', 'DIC', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY'].map(mes => (
                                <th key={mes} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '45px' }}>{mes}</th>
                              ))}
                              <th style={{ border: '2px solid #000', padding: '8px', textAlign: 'center', backgroundColor: '#cbd5e1', fontWeight: 900, width: '60px' }}>PROM</th>
                            </tr>
                          </thead>
                          <tbody>
                            {st.calificacionesDetalle?.filter(g => g.esModulo).map((grade, idx) => (
                              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', color: '#1e40af' }}>{grade.materia}</td>
                                {[1,2,3,4,5,6,7,8,9,10].map(m => (
                                  <td key={m} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{grade[`m${m}` as keyof GradeDetail] || '-'}</td>
                                ))}
                                <td style={{ border: '2px solid #000', padding: '6px', textAlign: 'center', fontWeight: 900, backgroundColor: '#f1f5f9', fontSize: '12px' }}>{grade.final}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}

                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', pageBreakInside: 'avoid' }}>
                      <div style={{ textAlign: 'center' }}><div style={{ width: '250px', borderBottom: '2px solid #000', marginBottom: '10px' }}></div><p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Firma del Profesor / Titular</p></div>
                      <div style={{ textAlign: 'center' }}><div style={{ width: '250px', borderBottom: '2px solid #000', marginBottom: '10px' }}></div><p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Sello y Firma Dirección Académica</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}