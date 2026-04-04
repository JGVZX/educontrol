'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
Search, Plus, ShieldAlert, Eye, Edit3, Trash2, Loader2,
ChevronUp, ChevronDown, Download, Users as UsersIcon,
AlertCircle, Star, ChevronLeft, ChevronRight,
FileText, X, LayoutGrid, List, Printer, BookOpen, ClipboardList, GraduationCap, Calendar, CheckCircle2,
LucideIcon
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import AddStudentModal, { StudentForm } from '@/components/dashboard/estudiantes/AddStudentModal';
import { getStudents, deleteStudent, saveStudent, getCourses, getStudentMetrics } from './actions';

// ==================== TIPOS ====================

interface Student {
id: string;
nombre: string;
apellido: string;
matricula: string;
curso: string;
estatus: 'ACTIVO' | 'SUSPENDIDO' | 'RETIRADO';
promedio: number;
}

interface Course {
id: string;
name: string;
}

interface Metrics {
total: number;
enRiesgo: number;
sobresalientes: number;
}

interface StudentsResponse {
data: Student[];
totalPages: number;
}

type ViewMode = 'list' | 'grid';
type SortDirection = 'asc' | 'desc';
type SortConfig = { key: keyof Student | string; dir: SortDirection };
type ReportType = 'LISTA_CURSO' | 'ASISTENCIA_CURSO' | 'NOTAS_CURSO' | 'PADRON_COMPLETO' | 'NOTAS_ESTUDIANTE';
type UserRole = 'DIRECTOR' | 'SECRETARIA' | 'DOCENTE' | 'ADMIN_SISTEMA' | null;

interface ReportConfig {
type: ReportType | '';
targetId: string;
date?: string;
}

interface ReportOptionProps {
icon: LucideIcon;
title: string;
desc: string;
val: ReportType;
current: ReportType | '';
onSelect: (config: ReportConfig) => void;
}

// ==================== COMPONENTES AUXILIARES ====================

function MetricCard({
icon: Icon,
label,
value,
percentage,
colorScheme
}: {
icon: LucideIcon;
label: string;
value: number;
percentage: number;
colorScheme: 'blue' | 'rose' | 'emerald';
}) {
const colors = {
blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'text-blue-100', progress: 'text-blue-500' },
rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'text-rose-100', progress: 'text-rose-500' },
emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'text-emerald-100', progress: 'text-emerald-500' },
};
const c = colors[colorScheme];

return (
<div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl transition-shadow">
<div className="flex items-center gap-5">
<div className={`w-16 h-16 ${c.bg} rounded-2xl flex items-center justify-center ${c.text} shadow-inner`}>
<Icon size={32} />
</div>
<div>
<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
<p className={`text-4xl font-black ${c.text} leading-none tracking-tighter`}>{value}</p>
</div>
</div>
<div className={`relative w-16 h-16 flex items-center justify-center ${c.bg} rounded-full shadow-inner`}>
<span className={`text-[11px] font-black ${c.text}`}>{percentage}%</span>
<svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
<circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="5" fill="transparent" className={c.ring} />
<circle
cx="32" cy="32" r="28"
stroke="currentColor" strokeWidth="5" fill="transparent"
strokeDasharray={`${percentage * 1.75} 175`}
className={`${c.progress} transition-all duration-1000`}
/>
</svg>
</div>
</div>
);
}

function ReportOption({ icon: Icon, title, desc, val, current, onSelect }: ReportOptionProps) {
const isSelected = current === val;

return (
<div
onClick={() => onSelect({ type: val, targetId: '', date: '' })}
className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'
}`}
>
<div className={`p-3 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
<Icon size={20} />
</div>
<div>
<h4 className={`text-sm font-black ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>{title}</h4>
<p className="text-xs font-medium text-slate-500">{desc}</p>
</div>
</div>
);
}

function StudentTableRow({
student,
onView,
onEdit,
onDelete,
canEdit,
canDelete
}: {
student: Student;
onView: () => void;
onEdit: () => void;
onDelete: () => void;
canEdit: boolean;
canDelete: boolean;
}) {
return (
<tr className="hover:bg-blue-50/30 transition-all group font-medium">
<td className="px-10 py-6">
<div className="flex items-center gap-5">
<div className="w-12 h-12 rounded-[1rem] bg-slate-900 text-white flex items-center justify-center font-black uppercase shadow-md">
{student.nombre[0]}{student.apellido[0]}
</div>
<div>
<div className="font-black text-slate-900 text-base tracking-tight">
{student.nombre} {student.apellido}
</div>
<div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
{student.curso || 'Sin curso'}
</div>
</div>
</div>
</td>
<td className="px-6 py-6">
<span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm ${
student.estatus === 'ACTIVO'
? 'bg-emerald-50 text-emerald-600 border-emerald-100'
: 'bg-rose-50 text-rose-600 border-rose-100'
}`}>
{student.estatus}
</span>
</td>
<td className="px-6 py-6 font-mono text-sm font-bold text-slate-500">{student.matricula}</td>
<td className="px-6 py-6 text-center">
<div className={`inline-flex flex-col px-4 py-2 rounded-xl border ${
student.promedio >= 70
? "bg-blue-50 border-blue-100 text-blue-700"
: "bg-rose-50 border-rose-100 text-rose-700"
}`}>
<span className="text-lg font-black leading-none">{student.promedio}</span>
</div>
</td>
<td className="px-10 py-6 text-right">
<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
<button
onClick={onView}
className="p-3 bg-white text-blue-500 hover:bg-blue-50 rounded-xl border border-slate-200"
aria-label="Ver estudiante"
>
<Eye size={18} />
</button>
{canEdit && (
<button
onClick={onEdit}
className="p-3 bg-white text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200"
aria-label="Editar estudiante"
>
<Edit3 size={18} />
</button>
)}
{canDelete && (
<button
onClick={onDelete}
className="p-3 bg-white text-rose-500 hover:bg-rose-50 rounded-xl border border-slate-200"
aria-label="Eliminar estudiante"
>
<Trash2 size={18} />
</button>
)}
</div>
</td>
</tr>
);
}

function StudentGridCard({
student,
onView,
onEdit,
canEdit
}: {
student: Student;
onView: () => void;
onEdit: () => void;
canEdit: boolean;
}) {
return (
<div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col relative overflow-hidden">
<div className="flex justify-between items-start mb-6">
<div className="w-16 h-16 rounded-[1.2rem] bg-slate-900 text-white flex items-center justify-center font-black uppercase text-xl shadow-md">
{student.nombre[0]}{student.apellido[0]}
</div>
<span className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg border ${
student.estatus === 'ACTIVO'
? 'bg-emerald-50 text-emerald-600 border-emerald-100'
: 'bg-rose-50 text-rose-600 border-rose-100'
}`}>
{student.estatus}
</span>
</div>
<h3 className="font-black text-slate-900 text-lg tracking-tight mb-1">
{student.nombre} {student.apellido}
</h3>
<p className="font-mono text-xs font-bold text-slate-500">{student.matricula}</p>
<p className="text-[10px] font-bold text-blue-500 uppercase mt-2 truncate">{student.curso}</p>

<div className="my-6 border-t border-slate-100 pt-6">
<div className="flex justify-between items-end mb-2">
<span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Promedio</span>
<span className="text-2xl font-black">{student.promedio}</span>
</div>
<div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
<div
style={{ width: `${Math.min(student.promedio, 100)}%` }}
className="h-full bg-blue-500 rounded-full transition-all duration-500"
/>
</div>
</div>

<div className="flex gap-2 mt-auto">
<button
onClick={onView}
className="flex-1 p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl flex justify-center transition-colors"
>
<Eye size={18} />
</button>
{canEdit && (
<button
onClick={onEdit}
className="flex-1 p-3 bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl flex justify-center transition-colors"
>
<Edit3 size={18} />
</button>
)}
</div>
</div>
);
}

function LoadingSpinner() {
return (
<div className="flex flex-col items-center justify-center h-96 text-slate-400">
<Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
<p className="font-black text-[10px] tracking-[0.3em] uppercase">Cargando registros...</p>
</div>
);
}

function EmptyState() {
return (
<tr>
<td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-xs">
No hay resultados
</td>
</tr>
);
}

function AccessDenied() {
return (
<div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in zoom-in-95">
<div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 mb-6 shadow-inner">
<ShieldAlert size={48} />
</div>
<h2 className="text-3xl font-black text-slate-800 tracking-tight">Acceso Restringido</h2>
<p className="text-slate-500 max-w-sm text-center mt-3 font-medium">
Este modulo es de uso exclusivo academico y directivo.
</p>
</div>
);
}

// ==================== COMPONENTE PRINCIPAL ====================

export default function StudentsDirectoryPage() {
const router = useRouter();
const { user, role } = useUser();

// Estados principales
const [students, setStudents] = useState<Student[]>([]);
const [coursesList, setCoursesList] = useState<Course[]>([]);
const [metrics, setMetrics] = useState<Metrics>({ total: 0, enRiesgo: 0, sobresalientes: 0 });
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Estado para reportes (almacena TODOS los estudiantes sin paginacion)
const [allStudentsReport, setAllStudentsReport] = useState<Student[]>([]);

// Filtros y paginacion
const [searchTerm, setSearchTerm] = useState('');
const [filterStatus, setFilterStatus] = useState('Todos');
const [filterCourse, setFilterCourse] = useState('Todos');
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'apellido', dir: 'asc' });
const [viewMode, setViewMode] = useState<ViewMode>('list');

// Modal de estudiante
const [isModalOpen, setIsModalOpen] = useState(false);
const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

// Motor de reportes
const [isReportEngineOpen, setIsReportEngineOpen] = useState(false);
const [reportConfig, setReportConfig] = useState<ReportConfig>({ type: '', targetId: '', date: '' });
const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
const reportRef = useRef<HTMLDivElement>(null);

// Permisos
const typedRole = role as UserRole;
const isDirector = typedRole === 'DIRECTOR';
const isSecretaria = typedRole === 'SECRETARIA';
const isDocente = typedRole === 'DOCENTE';
const canEdit = isDirector || isSecretaria;
const canDelete = isDirector;

// Calculos de metricas
const percentages = useMemo(() => {
const total = metrics.total || 1; // Evitar division por cero
const pctRiesgo = Math.round((metrics.enRiesgo / total) * 100);
const pctExcelencia = Math.round((metrics.sobresalientes / total) * 100);
const pctRegular = Math.max(0, 100 - pctRiesgo - pctExcelencia);
return { pctRiesgo, pctExcelencia, pctRegular };
}, [metrics]);

// Estado para indicar si los datos de reporte estan cargados
const [isReportDataLoading, setIsReportDataLoading] = useState(false);

// Estudiantes filtrados para PDF
const studentsForPDF = useMemo(() => {
if (!allStudentsReport || allStudentsReport.length === 0) {
return [];
}

return allStudentsReport.filter(s => {
// Para reporte individual de estudiante
if (reportConfig.type === 'NOTAS_ESTUDIANTE') {
return s.id === reportConfig.targetId;
}

// Para reportes por curso - comparar con el nombre del curso
if (reportConfig.targetId && ['LISTA_CURSO', 'ASISTENCIA_CURSO', 'NOTAS_CURSO'].includes(reportConfig.type)) {
// Comparacion case-insensitive y trimmed
const studentCourse = (s.curso || '').trim().toLowerCase();
const targetCourse = reportConfig.targetId.trim().toLowerCase();
return studentCourse === targetCourse;
}

// PADRON_COMPLETO - todos los estudiantes
return true;
});
}, [allStudentsReport, reportConfig.type, reportConfig.targetId]);

// Cargar datos paginados
const loadData = useCallback(async () => {
if (!user?.email) return;

setIsLoading(true);
setError(null);

try {
const [stResponse, coData, stats] = await Promise.all([
getStudents({
page,
search: searchTerm,
status: filterStatus,
courseId: filterCourse !== 'Todos' ? filterCourse : undefined,
sortBy: sortConfig.key,
sortDir: sortConfig.dir,
userEmail: user.email,
role: typedRole ?? undefined
}) as Promise<StudentsResponse>,
getCourses() as Promise<Course[]>,
getStudentMetrics(user.email, typedRole || undefined) as Promise<Metrics>
]);

setStudents(stResponse.data);
setTotalPages(stResponse.totalPages || 1);
setCoursesList(coData);
setMetrics(stats);
} catch (err) {
console.error("Error al cargar datos:", err);
setError("Error al cargar los datos. Por favor, intente nuevamente.");
} finally {
setIsLoading(false);
}
}, [page, searchTerm, filterStatus, filterCourse, sortConfig, user?.email, typedRole]);

// Cargar datos al montar y cuando cambien dependencias
useEffect(() => {
loadData();
}, [loadData]);

// Reset de pagina cuando cambian los filtros
useEffect(() => {
setPage(1);
}, [searchTerm, filterStatus, filterCourse]);

// Carga masiva para reportes
useEffect(() => {
if (isReportEngineOpen && user?.email) {
setIsReportDataLoading(true);
getStudents({ limit: 5000, userEmail: user.email, role: typedRole ?? undefined })
.then((res: StudentsResponse) => {
setAllStudentsReport(res.data || []);
})
.catch(err => {
console.error("Error cargando datos para reporte:", err);
alert("Error al cargar los datos para el reporte");
})
.finally(() => {
setIsReportDataLoading(false);
});
}
}, [isReportEngineOpen, typedRole, user?.email]);

// Handlers
const handleSort = useCallback((key: string) => {
setSortConfig(prev => ({
key,
dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
}));
}, []);

const handleDelete = useCallback(async (id: string, name: string) => {
if (!confirm(`Confirma tramitar la baja del estudiante ${name}? Esta accion es irreversible.`)) {
return;
}

try {
const res = await deleteStudent(id);
if (res.success) {
await loadData();
} else {
alert("Error: " + res.message);
}
} catch (err) {
console.error("Error eliminando estudiante:", err);
alert("Error al eliminar el estudiante");
}
}, [loadData]);

const handleSave = useCallback(async (data: StudentForm): Promise<{ success: boolean; message?: string }> => {
try {
const isEdit = !!currentStudent;
const payload = isEdit ? { ...data, id: currentStudent.id } : data;
const result = await saveStudent(payload, isEdit);

if (result.success) {
await loadData();
setIsModalOpen(false);
setCurrentStudent(null);
return { success: true };
} else {
return { success: false, message: result.message };
}
} catch (err) {
console.error("Error guardando estudiante:", err);
return { success: false, message: "Error inesperado al guardar" };
}
}, [currentStudent, loadData]);

const handleOpenEdit = useCallback((student: Student) => {
setCurrentStudent(student);
setIsModalOpen(true);
}, []);

const handleOpenCreate = useCallback(() => {
setCurrentStudent(null);
setIsModalOpen(true);
}, []);

const handleCloseModal = useCallback(() => {
setIsModalOpen(false);
setCurrentStudent(null);
}, []);

const executePDFGeneration = useCallback(async () => {
if (!reportConfig.type) {
alert("Debe seleccionar un tipo de reporte.");
return;
}

if (isReportDataLoading) {
alert("Espere a que terminen de cargar los datos.");
return;
}

if (reportConfig.type === 'ASISTENCIA_CURSO' && (!reportConfig.targetId || !reportConfig.date)) {
alert("Debe seleccionar un curso y una fecha especifica para el control de asistencia.");
return;
}

if (reportConfig.type === 'NOTAS_ESTUDIANTE' && !reportConfig.targetId) {
alert("Debe buscar y seleccionar un estudiante valido de la lista.");
return;
}

if (['LISTA_CURSO', 'ASISTENCIA_CURSO', 'NOTAS_CURSO'].includes(reportConfig.type) && !reportConfig.targetId) {
alert("Debe seleccionar un curso.");
return;
}

// Verificar que hay datos cargados
if (allStudentsReport.length === 0) {
alert("No se han cargado los datos de estudiantes. Intente cerrar y abrir el asistente nuevamente.");
return;
}

// Verificar que hay datos para el PDF despues del filtrado
if (studentsForPDF.length === 0) {
alert("No hay estudiantes que coincidan con los criterios seleccionados. Verifique la seleccion.");
return;
}

setIsGeneratingPDF(true);

try {
// Esperar a que React actualice el DOM con los datos filtrados
await new Promise(resolve => setTimeout(resolve, 800));

if (!reportRef.current) {
throw new Error("No se pudo acceder al contenedor del reporte");
}

// Temporalmente hacer visible el elemento para html2canvas
const reportElement = reportRef.current;
const parentElement = reportElement.parentElement;

if (parentElement) {
// Guardar estilos originales
const originalStyles = parentElement.style.cssText;

// Hacer visible pero fuera de pantalla
parentElement.style.cssText = `
position: fixed;
top: 0;
left: 0;
width: 1000px;
z-index: -1;
visibility: visible;
opacity: 1;
pointer-events: none;
overflow: visible;
`;

// Forzar reflow
void reportElement.offsetHeight;

// Esperar un momento para que se renderice
await new Promise(resolve => setTimeout(resolve, 300));

const canvas = await html2canvas(reportElement, {
scale: 2,
useCORS: true,
backgroundColor: '#ffffff',
logging: false,
allowTaint: true,
windowWidth: 1000,
windowHeight: reportElement.scrollHeight
});

// Restaurar estilos originales
parentElement.style.cssText = originalStyles;

if (canvas.width === 0 || canvas.height === 0) {
throw new Error("El canvas generado esta vacio");
}

const imgData = canvas.toDataURL('image/png');
const pdf = new jsPDF('p', 'mm', 'a4');
const pdfWidth = pdf.internal.pageSize.getWidth();
const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
const pageHeight = pdf.internal.pageSize.getHeight();

// Primera pagina
let heightLeft = pdfHeight;
let position = 0;

pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
heightLeft -= pageHeight;

// Paginas adicionales si es necesario
while (heightLeft > 0) {
position -= pageHeight;
pdf.addPage();
pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
heightLeft -= pageHeight;
}

const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
const fileName = `Reporte_${reportConfig.type}_${timestamp}.pdf`;

pdf.save(fileName);

setIsReportEngineOpen(false);
setReportConfig({ type: '', targetId: '', date: '' });
}
} catch (err) {
console.error("Error en generacion de PDF:", err);
alert(`Error al generar el PDF: ${err instanceof Error ? err.message : 'Error desconocido'}. Intente nuevamente.`);
} finally {
setIsGeneratingPDF(false);
}
}, [reportConfig, studentsForPDF.length, isReportDataLoading, allStudentsReport.length]);

// Verificar acceso
if (typedRole === 'ADMIN_SISTEMA') {
return <AccessDenied />;
}

const { pctRiesgo, pctExcelencia, pctRegular } = percentages;

return (
<div className="space-y-8 animate-in fade-in duration-1000 pb-12 relative max-w-7xl mx-auto">

{/* Tarjetas de metricas */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
{/* Matricula Total */}
<div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-shadow">
<div className="flex items-center gap-5 mb-6">
<div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
<UsersIcon size={32} />
</div>
<div>
<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Matricula</p>
<p className="text-4xl font-black text-slate-900 leading-none tracking-tighter">{metrics.total}</p>
</div>
</div>
<div className="mt-2">
<div className="flex justify-between text-[9px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
<span>Rendimiento Academico</span>
</div>
<div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
<div style={{ width: `${pctExcelencia}%` }} className="bg-emerald-500 h-full transition-all duration-1000" />
<div style={{ width: `${pctRegular}%` }} className="bg-blue-400 h-full transition-all duration-1000" />
<div style={{ width: `${pctRiesgo}%` }} className="bg-rose-500 h-full transition-all duration-1000" />
</div>
</div>
</div>

<MetricCard
icon={AlertCircle}
label="En Riesgo"
value={metrics.enRiesgo}
percentage={pctRiesgo}
colorScheme="rose"
/>

<MetricCard
icon={Star}
label="Sobresalientes"
value={metrics.sobresalientes}
percentage={pctExcelencia}
colorScheme="emerald"
/>
</div>

{/* Header con titulo y acciones */}
<div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 border-b border-slate-100 pb-8">
<div>
<h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
{isDocente ? 'Mis Estudiantes' : 'Directorio General'}
</h1>
<p className="text-slate-400 font-medium mt-2 flex items-center gap-2 text-sm">
<CheckCircle2 size={16} className="text-emerald-500" />
Data sincronizada correctamente
</p>
{error && (
<p className="text-rose-500 font-medium mt-2 flex items-center gap-2 text-sm">
<AlertCircle size={16} /> {error}
</p>
)}
</div>

<div className="flex flex-wrap items-center gap-3">
<button
onClick={() => setIsReportEngineOpen(true)}
className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm text-slate-700"
>
<Printer size={18} className="text-blue-600" /> Descargar Listados
</button>

{canEdit && (
<button
onClick={handleOpenCreate}
className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl"
>
<Plus size={18} /> Nuevo Registro
</button>
)}
</div>
</div>

{/* Filtro por cursos */}
{canEdit && (
<div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar">
<button
onClick={() => setFilterCourse('Todos')}
className={`whitespace-nowrap px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
filterCourse === 'Todos'
? 'bg-slate-900 text-white shadow-md'
: 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
}`}
>
Todos los Cursos
</button>
{coursesList.map(c => (
<button
key={c.id}
onClick={() => setFilterCourse(c.id)}
className={`whitespace-nowrap px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
filterCourse === c.id
? 'bg-blue-600 text-white shadow-md'
: 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
}`}
>
{c.name}
</button>
))}
</div>
)}

{/* Contenedor principal de la tabla/grid */}
<div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] overflow-hidden">

{/* Barra de busqueda y filtros */}
<div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-50/50">
<div className="relative flex-1 w-full lg:max-w-md group">
<Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
<input
type="text"
placeholder="Buscar por nombre, apellido o matricula..."
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
className="w-full pl-16 pr-6 py-4 bg-white border-none rounded-[2rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
/>
</div>

<div className="flex gap-4 w-full lg:w-auto items-center flex-wrap">
<select
className="px-6 py-4 bg-white border-none rounded-[1.5rem] shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
value={filterStatus}
onChange={(e) => setFilterStatus(e.target.value)}
>
<option value="Todos">Cualquier Estatus</option>
<option value="ACTIVO">Activos</option>
<option value="SUSPENDIDO">Suspendidos</option>
<option value="RETIRADO">Retirados</option>
</select>

<div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner">
<button
onClick={() => setViewMode('list')}
className={`p-3.5 rounded-2xl transition-all ${
viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
}`}
aria-label="Vista lista"
>
<List size={18} />
</button>
<button
onClick={() => setViewMode('grid')}
className={`p-3.5 rounded-2xl transition-all ${
viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
}`}
aria-label="Vista cuadricula"
>
<LayoutGrid size={18} />
</button>
</div>
</div>
</div>

{/* Contenido principal */}
{isLoading ? (
<LoadingSpinner />
) : (
<>
{viewMode === 'list' && (
<div className="overflow-x-auto animate-in fade-in custom-scrollbar min-h-[400px]">
<table className="w-full text-sm text-left">
<thead className="bg-slate-50/50 text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] border-b border-slate-50">
<tr>
<th
className="px-10 py-8 cursor-pointer hover:text-blue-600"
onClick={() => handleSort('nombre')}
>
<div className="flex items-center gap-2">
Estudiante
<ChevronUp
size={12}
className={sortConfig.key === 'nombre' && sortConfig.dir === 'desc' ? 'rotate-180' : ''}
/>
</div>
</th>
<th className="px-6 py-8">Estatus</th>
<th className="px-6 py-8">Matricula</th>
<th className="px-6 py-8 text-center">Promedio</th>
<th className="px-10 py-8 text-right">Acciones</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-50">
{students.length > 0 ? (
students.map((st) => (
<StudentTableRow
key={st.id}
student={st}
onView={() => router.push(`/dashboard/estudiantes/${st.id}`)}
onEdit={() => handleOpenEdit(st)}
onDelete={() => handleDelete(st.id, st.nombre)}
canEdit={canEdit}
canDelete={canDelete}
/>
))
) : (
<EmptyState />
)}
</tbody>
</table>
</div>
)}

{viewMode === 'grid' && (
<div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in min-h-[400px]">
{students.length > 0 ? (
students.map((st) => (
<StudentGridCard
key={st.id}
student={st}
onView={() => router.push(`/dashboard/estudiantes/${st.id}`)}
onEdit={() => handleOpenEdit(st)}
canEdit={canEdit}
/>
))
) : (
<div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase text-xs">
No hay resultados
</div>
)}
</div>
)}
</>
)}

{/* Paginacion */}
<div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
<p className="text-xs font-bold text-slate-400">
Mostrando {students.length} de {metrics.total}
</p>
<div className="flex gap-2">
<button
disabled={page === 1}
onClick={() => setPage(p => p - 1)}
className="p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
aria-label="Pagina anterior"
>
<ChevronLeft size={16} />
</button>
<span className="px-4 py-3 text-sm font-bold text-slate-600">
{page} / {totalPages}
</span>
<button
disabled={page === totalPages}
onClick={() => setPage(p => p + 1)}
className="p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
aria-label="Pagina siguiente"
>
<ChevronRight size={16} />
</button>
</div>
</div>
</div>

{/* Modal de agregar/editar estudiante */}
<AddStudentModal
open={isModalOpen}
onClose={handleCloseModal}
onSave={handleSave}
initialData={currentStudent}
courses={coursesList}
/>

{/* Modal de generacion de reportes PDF */}
{isReportEngineOpen && (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
<div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
{/* Header del modal */}
<div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
<div className="flex items-center gap-4">
<div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
<Printer size={24} />
</div>
<div>
<h3 className="text-xl font-black text-slate-900">Asistente de Documentos</h3>
<p className="text-[10px] text-slate-500 font-bold uppercase">Exportacion de Listados</p>
</div>
</div>
<button
onClick={() => setIsReportEngineOpen(false)}
className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"
aria-label="Cerrar"
>
<X size={20} />
</button>
</div>

{/* Contenido del modal */}
<div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
{isReportDataLoading ? (
<div className="flex items-center justify-center py-8">
<Loader2 className="animate-spin text-blue-500 mr-3" size={24} />
<span className="text-sm font-bold text-slate-500">Cargando datos de estudiantes...</span>
</div>
) : (
<p className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
<CheckCircle2 size={16} className="text-emerald-500" />
{allStudentsReport.length} estudiantes disponibles - Seleccione el formato:
</p>
)}

<div className="grid grid-cols-1 gap-3">
{isDocente && (
<>
<ReportOption
icon={UsersIcon}
title="Lista de Estudiantes"
desc="Listado oficial del curso."
val="LISTA_CURSO"
current={reportConfig.type}
onSelect={setReportConfig}
/>
<ReportOption
icon={GraduationCap}
title="Calificaciones"
desc="Registro de notas."
val="NOTAS_CURSO"
current={reportConfig.type}
onSelect={setReportConfig}
/>
</>
)}
{canEdit && (
<>
<ReportOption
icon={ClipboardList}
title="Control de Asistencia"
desc="Formato de pase de lista."
val="ASISTENCIA_CURSO"
current={reportConfig.type}
onSelect={setReportConfig}
/>
<ReportOption
icon={UsersIcon}
title="Listado por Curso"
desc="Nomina de estudiantes."
val="LISTA_CURSO"
current={reportConfig.type}
onSelect={setReportConfig}
/>
<ReportOption
icon={FileText}
title="Record de Estudiante"
desc="Historial individual."
val="NOTAS_ESTUDIANTE"
current={reportConfig.type}
onSelect={setReportConfig}
/>
</>
)}
</div>

{/* Selector de curso */}
{['LISTA_CURSO', 'ASISTENCIA_CURSO', 'NOTAS_CURSO'].includes(reportConfig.type) && (
<div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2">
<label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">
Seleccione el Curso Objetivo
</label>
<select
className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold"
value={reportConfig.targetId}
onChange={(e) => setReportConfig(prev => ({ ...prev, targetId: e.target.value }))}
>
<option value="">-- Elija un curso --</option>
{coursesList.map(c => (
<option key={c.id} value={c.name}>{c.name}</option>
))}
</select>

{reportConfig.type === 'ASISTENCIA_CURSO' && (
<div className="mt-4">
<label className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center gap-1">
<Calendar size={12} /> Fecha de Asistencia
</label>
<input
type="date"
className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold"
value={reportConfig.date || ''}
onChange={(e) => setReportConfig(prev => ({ ...prev, date: e.target.value }))}
/>
</div>
)}
</div>
)}

{/* Busqueda de estudiante individual */}
{reportConfig.type === 'NOTAS_ESTUDIANTE' && (
<div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2">
<label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">
Buscar Estudiante (Nombre o Matricula)
</label>
<input
type="text"
list="students-list"
placeholder="Escriba para buscar..."
className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-blue-500 transition-colors"
onChange={(e) => {
const val = e.target.value;
const found = allStudentsReport.find(
s => `${s.nombre} ${s.apellido} (${s.matricula})` === val
);
setReportConfig(prev => ({ ...prev, targetId: found ? found.id : '' }));
}}
/>
<datalist id="students-list">
{allStudentsReport.map(s => (
<option key={s.id} value={`${s.nombre} ${s.apellido} (${s.matricula})`} />
))}
</datalist>
{reportConfig.targetId && (
<p className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
<CheckCircle2 size={12} /> Estudiante seleccionado
</p>
)}
</div>
)}

{/* Preview de estudiantes a incluir */}
{reportConfig.type && !isReportDataLoading && (
<div className={`mt-4 p-4 rounded-xl border ${
studentsForPDF.length > 0
? 'bg-emerald-50 border-emerald-200'
: 'bg-amber-50 border-amber-200'
}`}>
<p className={`text-sm font-bold flex items-center gap-2 ${
studentsForPDF.length > 0 ? 'text-emerald-700' : 'text-amber-700'
}`}>
{studentsForPDF.length > 0 ? (
<>
<CheckCircle2 size={16} />
{studentsForPDF.length} estudiante(s) seran incluidos en el reporte
</>
) : (
<>
<AlertCircle size={16} />
{reportConfig.targetId
? 'No hay estudiantes que coincidan con la seleccion'
: 'Seleccione un curso o estudiante para continuar'
}
</>
)}
</p>
</div>
)}
</div>

{/* Footer del modal */}
<div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
<button
onClick={() => {
setIsReportEngineOpen(false);
setReportConfig({ type: '', targetId: '', date: '' });
}}
className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700"
>
Cancelar
</button>
<button
onClick={executePDFGeneration}
disabled={!reportConfig.type || isGeneratingPDF || isReportDataLoading || studentsForPDF.length === 0}
className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
>
{isGeneratingPDF ? (
<>
<Loader2 size={16} className="animate-spin" />
Generando...
</>
) : (
<>
<Download size={16} />
Generar Documento ({studentsForPDF.length})
</>
)}
</button>
</div>
</div>
</div>
)}

{/* DOM oculto para renderizado PDF - usando colores hex para compatibilidad con html2canvas */}
<div
style={{
position: 'absolute',
top: '-9999px',
left: '-9999px',
visibility: 'hidden',
zIndex: -1000,
pointerEvents: 'none',
overflow: 'hidden'
}}
aria-hidden="true"
>
<div
ref={reportRef}
style={{
width: '1000px',
minHeight: '1414px',
backgroundColor: '#ffffff',
padding: '56px',
fontFamily: 'Arial, Helvetica, sans-serif',
color: '#0f172a'
}}
>
{/* Header del PDF */}
<div style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'flex-start',
borderBottom: '2px solid #0f172a',
paddingBottom: '24px',
marginBottom: '32px'
}}>
<div>
<h1 style={{
fontSize: '30px',
fontWeight: 900,
textTransform: 'uppercase',
letterSpacing: '0.1em',
color: '#0f172a',
margin: 0
}}>EduControl</h1>
<p style={{
fontSize: '14px',
fontWeight: 700,
color: '#64748b',
marginTop: '4px',
textTransform: 'uppercase'
}}>Documento Oficial de Registro</p>
</div>
<div style={{ textAlign: 'right' }}>
<p suppressHydrationWarning style={{
fontWeight: 700,
fontSize: '14px',
color: '#475569',
margin: 0
}}>
{new Date().toLocaleDateString('es-DO')}
</p>
<p style={{
fontSize: '12px',
color: '#94a3b8',
marginTop: '4px'
}}>Generado por: {user?.nombre || 'Usuario'}</p>
</div>
</div>

{/* Info del reporte */}
<div style={{
marginBottom: '32px',
padding: '24px',
backgroundColor: '#f8fafc',
borderRadius: '12px',
border: '1px solid #e2e8f0'
}}>
<h2 style={{
fontSize: '20px',
fontWeight: 900,
color: '#1e293b',
margin: 0
}}>
{reportConfig.type.replace(/_/g, ' ')}
</h2>
{reportConfig.targetId && ['LISTA_CURSO', 'ASISTENCIA_CURSO', 'NOTAS_CURSO'].includes(reportConfig.type) && (
<p style={{
fontSize: '14px',
fontWeight: 700,
color: '#475569',
marginTop: '8px'
}}>
Curso Seleccionado: {reportConfig.targetId}
</p>
)}
{reportConfig.date && (
<p style={{
fontSize: '14px',
fontWeight: 700,
color: '#2563eb',
marginTop: '4px'
}}>
Fecha de Control: {reportConfig.date}
</p>
)}
<p style={{
fontSize: '12px',
color: '#94a3b8',
marginTop: '8px'
}}>
Total de registros: {studentsForPDF.length}
</p>
</div>

{/* Tabla del PDF */}
<table style={{
width: '100%',
textAlign: 'left',
borderCollapse: 'collapse'
}}>
<thead>
<tr style={{ backgroundColor: '#f1f5f9' }}>
<th style={{
padding: '12px',
border: '1px solid #cbd5e1',
fontSize: '10px',
fontWeight: 900,
textTransform: 'uppercase',
letterSpacing: '0.1em',
color: '#475569'
}}>#</th>
<th style={{
padding: '12px',
border: '1px solid #cbd5e1',
fontSize: '10px',
fontWeight: 900,
textTransform: 'uppercase',
letterSpacing: '0.1em',
color: '#475569'
}}>Apellidos, Nombres</th>
<th style={{
padding: '12px',
border: '1px solid #cbd5e1',
fontSize: '10px',
fontWeight: 900,
textTransform: 'uppercase',
letterSpacing: '0.1em',
color: '#475569',
textAlign: 'center'
}}>Matricula</th>
{reportConfig.type === 'ASISTENCIA_CURSO' ? (
<th style={{
padding: '12px',
border: '1px solid #cbd5e1',
fontSize: '10px',
fontWeight: 900,
textTransform: 'uppercase',
letterSpacing: '0.1em',
color: '#475569',
textAlign: 'center',
width: '128px'
}}>Firma / Estado</th>
) : (
<th style={{
padding: '12px',
border: '1px solid #cbd5e1',
fontSize: '10px',
fontWeight: 900,
textTransform: 'uppercase',
letterSpacing: '0.1em',
color: '#475569',
textAlign: 'center'
}}>Promedio</th>
)}
</tr>
</thead>
<tbody>
{studentsForPDF.map((st, i) => (
<tr key={st.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
<td style={{
padding: '12px',
borderLeft: '1px solid #e2e8f0',
borderRight: '1px solid #e2e8f0',
fontSize: '12px',
fontWeight: 700
}}>{i + 1}</td>
<td style={{
padding: '12px',
borderLeft: '1px solid #e2e8f0',
borderRight: '1px solid #e2e8f0',
fontSize: '12px',
fontWeight: 500,
textTransform: 'uppercase'
}}>{st.apellido}, {st.nombre}</td>
<td style={{
padding: '12px',
borderLeft: '1px solid #e2e8f0',
borderRight: '1px solid #e2e8f0',
fontSize: '12px',
fontWeight: 500,
textAlign: 'center',
fontFamily: 'monospace'
}}>{st.matricula}</td>
{reportConfig.type === 'ASISTENCIA_CURSO' ? (
<td style={{
padding: '12px',
borderLeft: '1px solid #e2e8f0',
borderRight: '1px solid #e2e8f0'
}}></td>
) : (
<td style={{
padding: '12px',
borderLeft: '1px solid #e2e8f0',
borderRight: '1px solid #e2e8f0',
fontSize: '12px',
fontWeight: 700,
textAlign: 'center'
}}>{st.promedio}</td>
)}
</tr>
))}
</tbody>
</table>

{/* Firmas */}
<div style={{
marginTop: '128px',
display: 'flex',
justifyContent: 'space-around',
alignItems: 'flex-end'
}}>
<div style={{ textAlign: 'center' }}>
<div style={{
width: '192px',
borderBottom: '1px solid #0f172a',
marginBottom: '8px'
}}></div>
<p style={{
fontSize: '10px',
fontWeight: 900,
textTransform: 'uppercase',
color: '#475569',
margin: 0
}}>Firma del Docente</p>
</div>
<div style={{ textAlign: 'center' }}>
<div style={{
width: '192px',
borderBottom: '1px solid #0f172a',
marginBottom: '8px'
}}></div>
<p style={{
fontSize: '10px',
fontWeight: 900,
textTransform: 'uppercase',
color: '#475569',
margin: 0
}}>Sello Institucional / Direccion</p>
</div>
</div>
</div>
</div>
</div>
);
}
