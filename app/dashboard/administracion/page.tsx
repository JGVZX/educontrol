'use client';

/**
 * Módulo de Administración Integral - EduControl
 * @description Centro de mando para la gestión de usuarios, asignaciones y visualización de perfiles.
 * @notes Implementación de renderizado condicional según el principio de Menor Privilegio (Role-Based Access Control).
 */

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';
import { 
  createUser, 
  getAvailableSubjects, 
  getUsersForMonitoring, 
  toggleUserStatus, 
  resetUserPassword, 
  updateUser,
  getStudentsForDirectory,
  getAvailableCourses,
  createStudent,
  updateStudent,
  getMyCargaAcademica, 
  UserFormData,
  StudentFormData
} from './actions';
import { 
  UserPlus, Save, Loader2, AlertCircle, CheckCircle2, 
  BookOpen, Activity, Users, ShieldCheck, Briefcase, 
  FileText, X, Eye, Copy, ExternalLink, Calendar, 
  Phone, UserCheck, MoreVertical, Edit, Power, KeyRound, 
  Lock, Send, ChevronRight, ChevronLeft, Mail, Search, 
  Printer, UserCircle, Stethoscope, Users as FamilyIcon, 
  GraduationCap, LayoutDashboard
} from 'lucide-react';

// ============================================================================
// ESTRUCTURAS DE DATOS Y TIPADOS ESTRICTOS (TypeScript)
// ============================================================================
interface SubjectData { id: string; name: string; courseName?: string; course?: { name: string }; }
interface CourseData { id: string; name: string; }
interface UserMonitor {
  id: string; nombre: string; apellido: string | null; email: string;
  role: string; estado: string; telefono: string | null; direccion: string | null;
  fechaNacimiento: string | null; genero: string | null; updatedAt: string;
  subjects: SubjectData[];
}
interface StudentMonitor {
  id: string; nombre: string; apellido: string; matricula: string;
  estatus: string; courseName: string | null; courseId?: string; createdAt: string;
  fechaNacimiento?: string; genero?: string; direccion?: string;
  alergias?: string; condiciones?: string; tipoSangre?: string; seguroMedico?: string;
  tutorNombre?: string; tutorParentesco?: string; tutorTelefono?: string;
}
interface ResetSuccess { nombre: string; email: string; newPassword: string; }

export default function AdministracionPage() {
  const { user: currentUser } = useUser();
  const role = currentUser?.role;

  // ============================================================================
  // GESTIÓN DE ESTADOS GLOBALES DE LA INTERFAZ
  // ============================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

  // --- Módulo Admin / Director ---
  const [monitorData, setMonitorData] = useState<UserMonitor[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [searchAdmin, setSearchAdmin] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessWidget, setShowSuccessWidget] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserMonitor | null>(null); 
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // --- Máquina de Estados: Edición Wizard Admin ---
  const [editingUser, setEditingUser] = useState<UserMonitor | null>(null); 
  const [isUpdating, setIsUpdating] = useState(false);
  const [editStep, setEditStep] = useState<number>(1);

  // --- Módulo de Seguridad (Criptografía y Reset) ---
  const [securityModalUser, setSecurityModalUser] = useState<UserMonitor | null>(null);
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccessData, setResetSuccessData] = useState<ResetSuccess | null>(null);

  // --- Módulo Secretaría (Gestión de Matrícula) ---
  const [students, setStudents] = useState<StudentMonitor[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [searchStudent, setSearchStudent] = useState("");
  const [showStudentWizard, setShowStudentWizard] = useState(false);
  const [studentStep, setStudentStep] = useState(1);
  const [editingStudent, setEditingStudent] = useState<StudentMonitor | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentMonitor | null>(null);
  
  // Implementación de Paginación Algorítmica
  const [studentPage, setStudentPage] = useState(1);
  const STUDENTS_PER_PAGE = 20;

  // ============================================================================
  // DATA MODELS INICIALES (Patrón Factory simple)
  // ============================================================================
  const initialFormState: UserFormData = {
    nombre: '', apellido: '', email: '', password: '', rol: 'DOCENTE', estado: 'ACTIVO', 
    telefono: '', direccion: '', fechaNacimiento: '', genero: 'M', subjectIds: []
  };
  const initialStudentState: StudentFormData = {
    nombre: '', apellido: '', fechaNacimiento: '', genero: 'M', nacionalidad: 'Dominicana', direccion: '',
    alergias: '', condiciones: '', tipoSangre: '', seguroMedico: '',
    tutorNombre: '', tutorParentesco: '', tutorTelefono: '', tutorCorreo: '', tutorOcupacion: '',
    courseId: ''
  };

  const [formData, setFormData] = useState<UserFormData>(initialFormState);
  const [editFormData, setEditFormData] = useState<UserFormData>(initialFormState);
  const [studentFormData, setStudentFormData] = useState<StudentFormData>(initialStudentState);

  // ============================================================================
  // RESOLUTOR ASÍNCRONO DE DATOS
  // ============================================================================
  const loadData = async () => {
    setIsLoading(true);
    try {
      if (role === 'ADMIN_SISTEMA') {
        const sub = await getAvailableSubjects();
        setSubjects(sub || []);
        const users = await getUsersForMonitoring();
        setMonitorData(users || []);
      } else if (role === 'DIRECTOR') {
        const users = await getUsersForMonitoring();
        setMonitorData(users || []);
      } else if (role === 'SECRETARIA') {
        const studs = await getStudentsForDirectory();
        const crs = await getAvailableCourses();
        setStudents(studs || []);
        setCourses(crs || []);
      } else if (role === 'DOCENTE' && currentUser?.id) {
        const mySubs = await getMyCargaAcademica(currentUser.id);
        setSubjects(mySubs || []);
      }
    } catch (error) { 
      console.error("[Arquitectura] Excepción en hidratación de datos:", error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { if (role) loadData(); }, [role]);

  // ============================================================================
  // CONTROLADORES DE EVENTOS: MÓDULO ADMINISTRADOR
  // ============================================================================
  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
    const { name, value } = e.target; 
    setFormData(prev => ({ 
      ...prev, 
      [name]: value, 
      ...(name === 'rol' && value !== 'DOCENTE' ? { subjectIds: [] } : {}) 
    })); 
  };
  
  const handleCreateToggleSubject = (subjectId: string) => { 
    setFormData(prev => { 
      const ids = prev.subjectIds || []; 
      const newIds = ids.includes(subjectId) ? ids.filter(id => id !== subjectId) : [...ids, subjectId]; 
      return { ...prev, subjectIds: newIds }; 
    }); 
  };
  
  const handleCreateSubmit = async () => { 
    setFeedback(null); setIsSaving(true); 
    try { 
      const result = await createUser(formData); 
      if (result.success) { 
        setShowSuccessWidget(result.data); 
        setShowForm(false); 
        setFormData(initialFormState); 
        loadData(); 
      } else { 
        setFeedback({ type: 'error', msg: result.message || 'Error de inserción SQL.' }); 
      } 
    } catch (err) { 
      setFeedback({ type: 'error', msg: 'Timeout: Fallo de conectividad con el cluster.' }); 
    } finally { 
      setIsSaving(false); 
    } 
  };

  const openEditModal = (u: UserMonitor) => { 
    setEditFormData({ 
      nombre: u.nombre, apellido: u.apellido || '', email: u.email, password: '', 
      rol: u.role, estado: u.estado, telefono: u.telefono || '', direccion: u.direccion || '', 
      fechaNacimiento: u.fechaNacimiento || '', genero: u.genero || 'M', 
      subjectIds: Array.isArray(u.subjects) ? u.subjects.map(s => s.id) : [] 
    }); 
    setEditStep(1); setFeedback(null); setEditingUser(u); setActionMenuOpenId(null); 
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
    const { name, value } = e.target; 
    setEditFormData(prev => ({ 
      ...prev, 
      [name]: value, 
      ...(name === 'rol' && value !== 'DOCENTE' ? { subjectIds: [] } : {}) 
    })); 
  };
  
  const handleEditToggleSubject = (subjectId: string) => { 
    setEditFormData(prev => { 
      const ids = prev.subjectIds || []; 
      const newIds = ids.includes(subjectId) ? ids.filter(id => id !== subjectId) : [...ids, subjectId]; 
      return { ...prev, subjectIds: newIds }; 
    }); 
  };
  
  const nextEditStep = () => { 
    if (editStep === 1 && !editFormData.nombre) { setFeedback({ type: 'error', msg: "Complete los nombres requeridos." }); return; } 
    if (editStep === 2 && !editFormData.email) { setFeedback({ type: 'error', msg: "El correo es campo primario obligatorio." }); return; } 
    setFeedback(null); setEditStep(prev => prev + 1); 
  };
  
  const prevEditStep = () => { setFeedback(null); setEditStep(prev => prev - 1); };
  
  const handleEditSubmit = async () => { 
    if (!editingUser) return; 
    setIsUpdating(true); setFeedback(null); 
    try { 
      const result = await updateUser(editingUser.id, editFormData); 
      if (result.success) { 
        setEditingUser(null); 
        loadData(); 
      } else { 
        setFeedback({ type: 'error', msg: result.message || "Excepción al actualizar tupla." }); 
      } 
    } catch (err) { 
      setFeedback({ type: 'error', msg: "Fallo de conexión en el socket." }); 
    } finally { 
      setIsUpdating(false); 
    } 
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => { 
    setActionMenuOpenId(null); 
    const result = await toggleUserStatus(userId, currentStatus); 
    if (result.success) loadData(); 
  };
  
  const confirmAndResetPassword = async (e: React.FormEvent) => { 
    e.preventDefault();
    if (!securityModalUser || !currentUser?.email) return; 
    setResetError(null); setIsResetting(true); 
    try { 
      const result = await resetUserPassword(securityModalUser.id, currentUser.email, adminPasswordConfirm); 
      if (result.success) { 
        setSecurityModalUser(null); 
        setAdminPasswordConfirm(""); 
        setResetSuccessData({ nombre: securityModalUser.nombre, email: securityModalUser.email, newPassword: result.newPassword || '' }); 
      } else { 
        setResetError(result.message || "Error administrativo."); 
      } 
    } catch (err) { 
      setResetError("Error crítico de seguridad."); 
    } finally { 
      setIsResetting(false); 
    } 
  };

  // ============================================================================
  // CONTROLADORES DE EVENTOS: SECRETARÍA (Totalmente Funcional)
  // ============================================================================
  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { 
    const { name, value } = e.target; 
    setStudentFormData(prev => ({ ...prev, [name]: value })); 
  };
  
  const openEditStudentModal = (student: StudentMonitor) => {
    setStudentFormData({
      nombre: student.nombre, apellido: student.apellido, fechaNacimiento: student.fechaNacimiento || '', 
      genero: student.genero || 'M', nacionalidad: 'Dominicana', direccion: student.direccion || '',
      alergias: student.alergias || '', condiciones: student.condiciones || '', tipoSangre: student.tipoSangre || '', seguroMedico: student.seguroMedico || '',
      tutorNombre: student.tutorNombre || '', tutorParentesco: student.tutorParentesco || '', tutorTelefono: student.tutorTelefono || '', tutorCorreo: '', tutorOcupacion: '',
      courseId: student.courseId || ''
    });
    setEditingStudent(student);
    setStudentStep(1);
    setFeedback(null);
    setShowStudentWizard(true);
  };

  const openNewStudentModal = () => {
    setStudentFormData(initialStudentState);
    setEditingStudent(null);
    setStudentStep(1);
    setFeedback(null);
    setShowStudentWizard(true);
  };

  const handlePrintStudent = (student: StudentMonitor) => {
    window.open(`/dashboard/reportes/constancia?id=${student.id}`, '_blank');
  };

  const nextStudentStep = () => { 
    if (studentStep === 1 && (!studentFormData.nombre || !studentFormData.apellido)) { setFeedback({ type: 'error', msg: "Validación fallida: Campos de identidad vacíos." }); return; }
    if (studentStep === 3 && (!studentFormData.tutorNombre || !studentFormData.tutorTelefono)) { setFeedback({ type: 'error', msg: "Validación fallida: Datos del tutor incompletos." }); return; }
    setFeedback(null); setStudentStep(prev => prev + 1); 
  };
  const prevStudentStep = () => { setFeedback(null); setStudentStep(prev => prev - 1); };
  
  const handleStudentSubmit = async () => {
    if (!studentFormData.courseId) { setFeedback({ type: 'error', msg: "Clave foránea faltante: Seleccione curso." }); return; }
    setIsSaving(true); setFeedback(null);
    try {
      let result;
      if (editingStudent) {
        result = await updateStudent(editingStudent.id, studentFormData);
      } else {
        result = await createStudent(studentFormData);
      }
      
      if (result.success) {
        setShowStudentWizard(false); setStudentFormData(initialStudentState); setEditingStudent(null); setStudentStep(1); loadData();
      } else {
        setFeedback({ type: 'error', msg: result.message || 'Excepción al persistir expediente.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Time-out en la mutación de datos.' });
    } finally { setIsSaving(false); }
  };

  // ============================================================================
  // CÁLCULOS DERIVADOS Y PROCESAMIENTO DE ARREGLOS
  // ============================================================================
  const totalUsers = monitorData.length;
  const activeStaff = monitorData.filter(u => u.estado === 'ACTIVO').length;
  const suspendedStaff = monitorData.filter(u => u.estado === 'SUSPENDIDO').length;
  const pendingStaff = monitorData.filter(u => u.estado === 'PENDIENTE').length;
  const totalTeachersStaff = monitorData.filter(u => u.role === 'DOCENTE').length;
  
  const filteredMonitorData = monitorData.filter(u => {
    const term = searchAdmin.toLowerCase();
    return u.nombre.toLowerCase().includes(term) || (u.apellido && u.apellido.toLowerCase().includes(term)) || u.email.toLowerCase().includes(term);
  });

  const filteredStudents = useMemo(() => {
    const term = searchStudent.toLowerCase();
    setStudentPage(1); 
    return students.filter(s => s.nombre.toLowerCase().includes(term) || s.apellido.toLowerCase().includes(term) || s.matricula.toLowerCase().includes(term));
  }, [searchStudent, students]);

  const totalStudentPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice((studentPage - 1) * STUDENTS_PER_PAGE, studentPage * STUDENTS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Sincronizando Sistema...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 p-2 md:p-6" onClick={() => setActionMenuOpenId(null)}>
      
      {/* HEADER INSTITUCIONAL DINÁMICO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
            {role === 'ADMIN_SISTEMA' && <ShieldCheck className="text-blue-600" size={38} />}
            {role === 'DIRECTOR' && <Activity className="text-emerald-500" size={38} />}
            {role === 'SECRETARIA' && <Users className="text-amber-500" size={38} />}
            {role === 'DOCENTE' && <Briefcase className="text-indigo-500" size={38} />}
            {role === 'ADMIN_SISTEMA' && 'Centro de Mando Administrativo'}
            {role === 'DIRECTOR' && 'Monitor Directivo'}
            {role === 'SECRETARIA' && 'Centro Operativo Estudiantil'}
            {role === 'DOCENTE' && 'Mi Espacio Académico'}
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest opacity-70">
            {role === 'ADMIN_SISTEMA' && 'Gestión global de usuarios, permisos e infraestructura'}
            {role === 'DIRECTOR' && 'Vigilancia de actividad institucional en tiempo real'}
            {role === 'SECRETARIA' && 'Gestión integral de expedientes, admisiones y reportes'}
            {role === 'DOCENTE' && 'Administración de carga y obligaciones académicas'}
          </p>
        </div>

        {role === 'ADMIN_SISTEMA' && (
          <button onClick={(e) => { e.stopPropagation(); setFeedback(null); setShowForm(true); }} className="group flex items-center gap-3 bg-slate-900 dark:bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[2rem] font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
            <UserPlus size={22} className="group-hover:rotate-12 transition-transform" /> Agregar Nuevo Usuario
          </button>
        )}
      </header>

      {/* VISTA 1: ADMIN_SISTEMA Y DIRECTOR */}
      {(role === 'DIRECTOR' || role === 'ADMIN_SISTEMA') && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 mb-4 flex items-center justify-center relative z-10"><Users size={24}/></div>
                <div className="relative z-10"><p className="text-4xl font-black text-slate-900 dark:text-white leading-none mb-1">{totalUsers}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Registros</p></div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 mb-4 flex items-center justify-center relative z-10"><UserCheck size={24}/></div>
                <div className="relative z-10"><p className="text-4xl font-black text-slate-900 dark:text-white leading-none mb-1">{activeStaff}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuentas Activas</p></div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 mb-4 flex items-center justify-center relative z-10"><Briefcase size={24}/></div>
                <div className="relative z-10"><p className="text-4xl font-black text-slate-900 dark:text-white leading-none mb-1">{totalTeachersStaff}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuerpo Docente</p></div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 mb-4 flex items-center justify-center relative z-10"><AlertCircle size={24}/></div>
                <div className="relative z-10"><p className="text-4xl font-black text-slate-900 dark:text-white leading-none mb-1">{suspendedStaff + pendingStaff}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alertas / Pausas</p></div>
            </div>
          </div>

          <section className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all relative z-10">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-3 text-xl tracking-tight"><ShieldCheck size={24} className="text-blue-500"/> Directorio Maestro de Sistema</h3>
              <div className="relative w-full sm:w-auto">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Buscar empleado o correo..." value={searchAdmin} onChange={(e) => setSearchAdmin(e.target.value)} className="w-full sm:w-80 pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>
            </div>
            
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] bg-slate-50/30 dark:bg-slate-800/10">
                    <th className="px-10 py-6">Personal</th>
                    <th className="px-6 py-6 text-center">Estado</th>
                    <th className="px-6 py-6">Responsabilidad</th>
                    <th className="px-10 py-6 text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredMonitorData.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-500 font-bold">No se encontraron registros indexados.</td></tr>
                  ) : (
                    filteredMonitorData.map((u) => (
                      <tr key={u.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-default">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[1.2rem] bg-slate-900 dark:bg-slate-800 flex items-center justify-center font-black text-white text-sm shadow-lg shrink-0">{u.nombre[0]}{u.apellido?.[0]}</div>
                            <div className="overflow-hidden">
                              <p className="font-black text-slate-900 dark:text-white text-lg leading-none mb-1 truncate">{u.nombre} {u.apellido}</p>
                              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter flex items-center gap-1 truncate"><Briefcase size={12}/> {u.role.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black border ${u.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${u.estado === 'ACTIVO' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />{u.estado}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {u.role === 'DOCENTE' ? (
                              Array.isArray(u.subjects) && u.subjects.length > 0 ? u.subjects.slice(0, 2).map((s:any, i:number) => (
                                <span key={i} className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md whitespace-nowrap border border-slate-200 dark:border-slate-700">{s.name}</span>
                              )) : <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">Sin asignación</span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">Labores Administrativas</span>
                            )}
                            {Array.isArray(u.subjects) && u.subjects.length > 2 && <span className="text-[10px] font-bold text-blue-500">+{u.subjects.length - 2}</span>}
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right relative">
                          <div className="flex items-center justify-end gap-3">
                             {role === 'DIRECTOR' && (
                               <button onClick={() => setSelectedProfile(u)} title="Ver Expediente" className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"><Eye size={20} /></button>
                             )}
                             {role === 'ADMIN_SISTEMA' && (
                               <div className="relative">
                                 <button onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(actionMenuOpenId === u.id ? null : u.id); }} className={`p-3 rounded-2xl transition-all border border-transparent ${actionMenuOpenId === u.id ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                   <MoreVertical size={20} />
                                 </button>
                                 {actionMenuOpenId === u.id && (
                                   <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 py-2 z-[60] animate-in zoom-in-95 origin-top-right text-left">
                                     <button onClick={() => { setSelectedProfile(u); setActionMenuOpenId(null); }} className="w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"><Eye size={16} className="text-indigo-500"/> Ver Perfil</button>
                                     <button onClick={() => openEditModal(u)} className="w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"><Edit size={16} className="text-blue-500"/> Modificar Expediente</button>
                                     <button onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); setSecurityModalUser(u); }} className="w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 flex items-center gap-3 transition-colors"><KeyRound size={16} /> Restablecer Clave</button>
                                     <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                     <button onClick={() => handleToggleStatus(u.id, u.estado)} className={`w-full px-4 py-3 text-sm font-bold flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 ${u.estado === 'ACTIVO' ? 'text-amber-600' : 'text-emerald-600'} transition-colors`}><Power size={16}/> {u.estado === 'ACTIVO' ? 'Suspender Acceso' : 'Activar Cuenta'}</button>
                                   </div>
                                 )}
                               </div>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* VISTA 2: SECRETARIA */}
      {role === 'SECRETARIA' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><Users size={32}/></div>
                  <div><p className="text-3xl font-black text-slate-900 dark:text-white">{students.length}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula Total</p></div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><UserPlus size={32}/></div>
                  <div><p className="text-3xl font-black text-slate-900 dark:text-white">{courses.length}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cursos Activos</p></div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={32}/></div>
                  <div><p className="text-3xl font-black text-slate-900 dark:text-white">{students.filter(s => s.estatus === 'ACTIVO').length}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alumnos Activos</p></div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div onClick={openNewStudentModal} className="group relative bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-10 rounded-[3rem] text-white shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/40 transition-all"></div>
                 <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md"><UserPlus size={32} className="text-amber-400" /></div>
                    <div>
                       <h3 className="text-3xl font-black tracking-tighter">Nueva Admisión</h3>
                       <p className="text-slate-400 text-sm mt-2 font-medium max-w-sm">Iniciar wizard de inscripción para registrar un nuevo estudiante oficial.</p>
                    </div>
                    <div className="mt-8 flex items-center gap-3 text-sm font-black text-amber-400 uppercase tracking-widest group-hover:text-white transition-colors">Comenzar Proceso <ChevronRight size={18} /></div>
                 </div>
              </div>
              <div className="group relative bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-[3rem] text-white shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all">
                 <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                 <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md"><Printer size={32} className="text-blue-100" /></div>
                    <div>
                       <h3 className="text-3xl font-black tracking-tighter">Centro de Reportes</h3>
                       <p className="text-blue-100 text-sm mt-2 font-medium max-w-sm opacity-90">Emisión de constancias, boletines y récords de notas validados.</p>
                    </div>
                    <div className="mt-8 flex items-center gap-3 text-sm font-black text-white uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-colors">Abrir Generador <ExternalLink size={18} /></div>
                 </div>
              </div>
           </div>

           <section className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all relative z-10">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-3 text-xl tracking-tight"><UserCircle size={24} className="text-amber-500"/> Directorio Estudiantil</h3>
              <div className="relative w-full sm:w-auto">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Buscar por matrícula o nombre..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} className="w-full sm:w-80 pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/10 transition-all" />
              </div>
            </div>
            
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] bg-slate-50/30 dark:bg-slate-800/10">
                    <th className="px-10 py-6">Estudiante</th>
                    <th className="px-6 py-6">Matrícula</th>
                    <th className="px-6 py-6">Curso Actual</th>
                    <th className="px-6 py-6 text-center">Estatus</th>
                    <th className="px-10 py-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {paginatedStudents.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-bold">No se encontraron expedientes.</td></tr>
                  ) : (
                    paginatedStudents.map((student) => (
                      <tr key={student.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-default">
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 text-sm shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
                                {student.nombre[0]}{student.apellido?.[0]}
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-black text-slate-900 dark:text-white text-base leading-none mb-1 truncate">{student.nombre} {student.apellido}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">Registro: {new Date(student.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                         </td>
                         <td className="px-6 py-6 font-mono font-bold text-slate-600 dark:text-slate-300">{student.matricula}</td>
                         <td className="px-6 py-6">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50 truncate max-w-[150px] inline-block">
                              {student.courseName || 'Sin Asignar'}
                            </span>
                         </td>
                         <td className="px-6 py-6 text-center">
                            <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black border ${student.estatus === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${student.estatus === 'ACTIVO' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} /> {student.estatus}
                            </div>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <button onClick={() => setSelectedStudentProfile(student)} title="Ver Expediente Completo" className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"><Eye size={18} /></button>
                               <button onClick={() => openEditStudentModal(student)} title="Editar Información" className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-amber-500 hover:border-amber-200 transition-colors shadow-sm"><Edit size={18} /></button>
                               <button onClick={() => handlePrintStudent(student)} title="Imprimir Constancia" className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors shadow-sm"><Printer size={18} /></button>
                            </div>
                         </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {totalStudentPages > 1 && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10">
                  <p className="text-xs font-bold text-slate-500">Mostrando {paginatedStudents.length} de {filteredStudents.length} registros</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setStudentPage(p => Math.max(1, p - 1))} disabled={studentPage === 1} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-all shadow-sm"><ChevronLeft size={18}/></button>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 px-4">Página {studentPage} de {totalStudentPages}</span>
                    <button onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))} disabled={studentPage === totalStudentPages} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-all shadow-sm"><ChevronRight size={18}/></button>
                  </div>
                </div>
              )}
            </div>
           </section>
        </div>
      )}

      {/* VISTA 3: DOCENTE */}
      {role === 'DOCENTE' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 md:col-span-2 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
               <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
               <div className="relative z-10 flex flex-col h-full justify-between">
                 <div>
                   <h2 className="text-3xl font-black tracking-tight mb-2">Panel de Control Docente</h2>
                   <p className="text-indigo-100 font-medium max-w-lg text-sm">Gestiona eficientemente tu carga académica. Recuerda subir las calificaciones antes del cierre de periodo.</p>
                 </div>
                 <div className="mt-8 flex gap-4">
                   <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Materias Asignadas</p>
                     <p className="text-3xl font-black">{subjects.length}</p>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Periodo Actual</p>
                     <p className="text-3xl font-black">2026</p>
                   </div>
                 </div>
               </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mb-4"><LayoutDashboard size={32}/></div>
              <h3 className="font-black text-slate-800 dark:text-white text-lg">Accesos Rápidos</h3>
              <p className="text-slate-400 text-xs mt-2 mb-6">Navegación general del sistema</p>
              <div className="w-full space-y-3">
                 <Link href="/dashboard/horario" className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Calendar size={16}/> Mi Horario</Link>
                 <Link href="/dashboard/reportes" className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><FileText size={16}/> Evaluaciones</Link>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
             <div className="flex items-center gap-5 mb-10 border-b border-slate-100 dark:border-slate-800 pb-8">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner shrink-0"><BookOpen size={30}/></div>
                <div>
                   <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Mi Carga Académica</h3>
                   <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Gestión por Aula y Asignatura</p>
                </div>
             </div>
             
             {subjects.length === 0 ? (
               <div className="p-10 sm:p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                 <GraduationCap size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                 <p className="text-slate-500 font-bold text-lg">No tienes materias asignadas actualmente.</p>
                 <p className="text-slate-400 text-sm mt-2">Comunícate con la Dirección Académica para regularizar tu horario.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {subjects.map((sub, i) => (
                   <div key={i} className="group p-8 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] hover:border-indigo-500 hover:shadow-[0_20px_40px_rgba(79,70,229,0.15)] transition-all bg-white dark:bg-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none"></div>
                      <div>
                        <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg mb-3">
                          <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest relative z-10">{sub.course?.name || 'Materia Extracurricular'}</p>
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-2xl leading-tight mb-2 relative z-10">{sub.name}</h4>
                        <p className="text-xs font-bold text-slate-400">ID: {sub.id.split('-')[0]}</p>
                      </div>
                      
                      <div className="flex flex-col gap-3 relative z-10 mt-6">
                         <Link href={`/dashboard/estudiantes?curso=${sub.course?.name || ''}`} className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/30">
                            <Users size={16}/> Ver Aula Virtual
                         </Link>
                         
                         <div className="flex gap-3">
                           <Link href={`/dashboard/asistencia?materia=${sub.id}`} className="flex-1 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                              <CheckCircle2 size={16}/> Lista
                           </Link>
                           <Link href={`/dashboard/notas?materia=${sub.id}`} className="flex-1 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                              <FileText size={16}/> Notas
                           </Link>
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES DEL SISTEMA */}
      {/* ========================================================================= */}
      
      {/* MODAL 1: EDICIÓN WIZARD (ADMIN) */}
      {editingUser && role === 'ADMIN_SISTEMA' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95">
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                <div>
                  <h3 className="font-black text-3xl text-slate-900 dark:text-white tracking-tighter flex items-center gap-3"><Edit className="text-blue-600"/> Actualización de Expediente</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 opacity-80">Registro asignado a: {editingUser.nombre} {editingUser.apellido}</p>
                </div>
                <button type="button" onClick={() => setEditingUser(null)} className="p-4 bg-white dark:bg-slate-800 hover:bg-red-500 hover:text-white rounded-[1.5rem] shadow-xl transition-all active:scale-90"><X size={26}/></button>
              </div>

              <div className="flex bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-10 shrink-0">
                 <div className={`flex-1 py-4 font-black text-xs uppercase tracking-widest text-center border-b-4 transition-colors ${editStep >= 1 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>1. Identidad</div>
                 <div className={`flex-1 py-4 font-black text-xs uppercase tracking-widest text-center border-b-4 transition-colors ${editStep >= 2 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>2. Seguridad</div>
                 {editFormData.rol === 'DOCENTE' && (
                   <div className={`flex-1 py-4 font-black text-xs uppercase tracking-widest text-center border-b-4 transition-colors ${editStep === 3 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>3. Asignación Académica</div>
                 )}
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
                {feedback && (<div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl flex items-center gap-3 font-bold text-sm"><AlertCircle size={18}/> {feedback.msg}</div>)}
                <div className="space-y-8 pb-10">
                  {editStep === 1 && <PersonalDataSection formData={editFormData} handleChange={handleEditChange} />}
                  {editStep === 2 && <AccessSection formData={editFormData} handleChange={handleEditChange} />}
                  {editStep === 3 && editFormData.rol === 'DOCENTE' && <SubjectSelectionSection subjects={subjects} selectedIds={editFormData.subjectIds || []} onToggle={handleEditToggleSubject} />}
                </div>
              </div>

              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 z-20">
                <button type="button" onClick={prevEditStep} disabled={editStep === 1} className="flex items-center gap-2 px-8 py-4 font-black text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all uppercase text-[11px] tracking-widest disabled:opacity-30"><ChevronLeft size={18}/> Atrás</button>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-8 py-4 font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all uppercase text-[11px] tracking-widest hidden sm:block">Cancelar</button>
                  {(editStep === 2 && editFormData.rol !== 'DOCENTE') || editStep === 3 ? (
                    <button type="button" onClick={handleEditSubmit} disabled={isUpdating} className="flex items-center gap-3 px-12 py-4 bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-700 shadow-2xl disabled:opacity-50 uppercase text-xs tracking-[0.2em] transition-all hover:scale-105 active:scale-95">
                      {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Guardar Cambios
                    </button>
                  ) : (
                    <button type="button" onClick={nextEditStep} className="flex items-center gap-3 px-12 py-4 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-[2rem] shadow-xl uppercase text-xs tracking-[0.2em] transition-all hover:bg-blue-600 hover:scale-105">Siguiente <ChevronRight size={20} /></button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VER PERFIL USUARIO (ADMIN) */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 relative">
             <div className="relative h-36 bg-gradient-to-r from-blue-700 to-indigo-900 shrink-0">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                   <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>
                </div>
                <button type="button" onClick={() => setSelectedProfile(null)} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all z-20 backdrop-blur-sm"><X size={20} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 sm:p-12 pt-0 relative custom-scrollbar">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end relative -top-16 mb-[-3rem]">
                   <div className="w-32 h-32 rounded-[2.5rem] border-8 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-5xl font-black text-slate-800 dark:text-white shadow-xl shrink-0">
                      {selectedProfile.nombre[0]}
                   </div>
                   <div className="pb-2">
                      <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{selectedProfile.nombre} {selectedProfile.apellido}</h2>
                      <div className="flex flex-wrap gap-2 mt-3">
                         <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 dark:border-blue-500/20">{selectedProfile.role.replace('_', ' ')}</span>
                         <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${selectedProfile.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{selectedProfile.estado}</span>
                      </div>
                   </div>
                </div>
                
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-transparent dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 shadow-sm shrink-0"><Mail size={18}/></div><div className="overflow-hidden"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Corporativo</p><p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{selectedProfile.email}</p></div></div>
                   <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-transparent dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 shadow-sm shrink-0"><Phone size={18}/></div><div className="overflow-hidden"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono Directo</p><p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{selectedProfile.telefono || 'No registrado'}</p></div></div>
                </div>
                
                {selectedProfile.role === 'DOCENTE' && (
                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><BookOpen size={16} /> Carga Académica Oficial</h4>
                     {Array.isArray(selectedProfile.subjects) && selectedProfile.subjects.length > 0 ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedProfile.subjects.map((sub:any, i:number) => (
                            <div key={i} className="p-4 bg-white dark:bg-slate-900 rounded-2xl flex items-center gap-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                               <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shadow-sm shrink-0"><BookOpen size={18}/></div>
                               <div className="overflow-hidden">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{sub.courseName || 'Asignatura Independiente'}</p>
                                  <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{sub.name}</p>
                               </div>
                            </div>
                          ))}
                       </div>
                     ) : (
                       <div className="p-6 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-600 font-bold text-sm text-center border border-amber-100">Este docente no tiene asignaciones curriculares activas.</div>
                     )}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* MODAL 2.5: VER PERFIL ESTUDIANTE (SECRETARÍA) */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 relative">
             <div className="relative h-36 bg-gradient-to-r from-amber-500 to-orange-600 shrink-0">
                <button type="button" onClick={() => setSelectedStudentProfile(null)} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all z-20 backdrop-blur-sm"><X size={20} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 sm:p-12 pt-0 relative custom-scrollbar">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end relative -top-16 mb-[-3rem]">
                   <div className="w-32 h-32 rounded-[2.5rem] border-8 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-5xl font-black text-slate-800 dark:text-white shadow-xl shrink-0">
                      {selectedStudentProfile.nombre[0]}
                   </div>
                   <div className="pb-2">
                      <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{selectedStudentProfile.nombre} {selectedStudentProfile.apellido}</h2>
                      <div className="flex flex-wrap gap-2 mt-3">
                         <span className="px-4 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100 dark:border-amber-500/20">Matrícula: {selectedStudentProfile.matricula}</span>
                         <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${selectedStudentProfile.estatus === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{selectedStudentProfile.estatus}</span>
                      </div>
                   </div>
                </div>
                
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-transparent dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 shadow-sm shrink-0"><BookOpen size={18}/></div><div className="overflow-hidden"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Curso Asignado</p><p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{selectedStudentProfile.courseName || 'No asignado'}</p></div></div>
                   <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-transparent dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 shadow-sm shrink-0"><Calendar size={18}/></div><div className="overflow-hidden"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Registro</p><p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{new Date(selectedStudentProfile.createdAt).toLocaleDateString()}</p></div></div>
                   <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-transparent dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 shadow-sm shrink-0"><FamilyIcon size={18}/></div><div className="overflow-hidden"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tutor Principal</p><p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{selectedStudentProfile.tutorNombre || 'No registrado'} ({selectedStudentProfile.tutorTelefono || 'S/N'})</p></div></div>
                   <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-transparent dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 shadow-sm shrink-0"><Stethoscope size={18}/></div><div className="overflow-hidden"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Condiciones Médicas</p><p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{selectedStudentProfile.condiciones || 'Ninguna registrada'}</p></div></div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL 3: WIZARD DE ADMISIÓN / EDICIÓN (SECRETARÍA) */}
      {showStudentWizard && role === 'SECRETARIA' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95">
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-amber-50/50 dark:bg-amber-900/10 shrink-0">
                <div>
                  <h3 className="font-black text-3xl text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                    {editingStudent ? <Edit className="text-amber-500" /> : <UserPlus className="text-amber-500"/>} 
                    {editingStudent ? 'Actualizar Expediente' : 'Formulario de Admisión'}
                  </h3>
                  <p className="text-amber-600 dark:text-amber-500 font-bold text-xs uppercase tracking-widest mt-1 opacity-80">
                    {editingStudent ? `Editando registro de ${editingStudent.nombre}` : 'Creación de Expediente Estudiantil'}
                  </p>
                </div>
                <button type="button" onClick={() => setShowStudentWizard(false)} className="p-4 bg-white dark:bg-slate-800 hover:bg-red-500 hover:text-white rounded-[1.5rem] shadow-xl transition-all active:scale-90"><X size={26}/></button>
              </div>

              <div className="flex bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-10 shrink-0 overflow-x-auto">
                 <div className={`whitespace-nowrap flex-1 px-4 py-4 font-black text-[10px] sm:text-xs uppercase tracking-widest text-center border-b-4 transition-colors ${studentStep >= 1 ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-transparent text-slate-400'}`}>1. Alumno</div>
                 <div className={`whitespace-nowrap flex-1 px-4 py-4 font-black text-[10px] sm:text-xs uppercase tracking-widest text-center border-b-4 transition-colors ${studentStep >= 2 ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-transparent text-slate-400'}`}>2. Médicos</div>
                 <div className={`whitespace-nowrap flex-1 px-4 py-4 font-black text-[10px] sm:text-xs uppercase tracking-widest text-center border-b-4 transition-colors ${studentStep >= 3 ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-transparent text-slate-400'}`}>3. Tutor</div>
                 <div className={`whitespace-nowrap flex-1 px-4 py-4 font-black text-[10px] sm:text-xs uppercase tracking-widest text-center border-b-4 transition-colors ${studentStep === 4 ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-transparent text-slate-400'}`}>4. Curso</div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar relative">
                {feedback && (<div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl flex items-center gap-3 font-bold text-sm"><AlertCircle size={18}/> {feedback.msg}</div>)}
                
                <div className="space-y-8 pb-10">
                  {studentStep === 1 && (
                    <div className="animate-in slide-in-from-right-8 duration-300 space-y-6">
                      <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><UserCircle size={16}/> Datos Básicos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Nombres</label><input type="text" name="nombre" value={studentFormData.nombre} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-amber-500/10" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Apellidos</label><input type="text" name="apellido" value={studentFormData.apellido} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-amber-500/10" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Fecha Nacimiento</label><input type="date" name="fechaNacimiento" value={studentFormData.fechaNacimiento} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-4 focus:ring-amber-500/10 outline-none" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Género</label><select name="genero" value={studentFormData.genero} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-4 focus:ring-amber-500/10 outline-none"><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
                        <div className="md:col-span-2"><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Dirección de Residencia</label><input type="text" name="direccion" value={studentFormData.direccion} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-amber-500/10" /></div>
                      </div>
                    </div>
                  )}
                  {studentStep === 2 && (
                    <div className="animate-in slide-in-from-right-8 duration-300 space-y-6">
                      <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Stethoscope size={16}/> Perfil Médico (Opcional)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Alergias</label><textarea name="alergias" value={studentFormData.alergias} onChange={handleStudentChange} rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold resize-none" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Condiciones Médicas</label><textarea name="condiciones" value={studentFormData.condiciones} onChange={handleStudentChange} rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold resize-none" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Tipo de Sangre</label><select name="tipoSangre" value={studentFormData.tipoSangre} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold"><option value="">No Especificado</option><option value="A+">A+</option><option value="O+">O+</option><option value="B+">B+</option><option value="A-">A-</option><option value="O-">O-</option></select></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Seguro Médico</label><input type="text" name="seguroMedico" value={studentFormData.seguroMedico} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold" /></div>
                      </div>
                    </div>
                  )}
                  {studentStep === 3 && (
                    <div className="animate-in slide-in-from-right-8 duration-300 space-y-6">
                      <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><FamilyIcon size={16}/> Núcleo Familiar</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Nombre del Tutor</label><input type="text" name="tutorNombre" value={studentFormData.tutorNombre} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Parentesco</label><input type="text" name="tutorParentesco" value={studentFormData.tutorParentesco} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase ml-1">Teléfono</label><input type="text" name="tutorTelefono" value={studentFormData.tutorTelefono} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold" /></div>
                      </div>
                    </div>
                  )}
                  {studentStep === 4 && (
                    <div className="animate-in slide-in-from-right-8 duration-300 space-y-6">
                      <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><BookOpen size={16}/> Asignación Académica</h3>
                      <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-lg border border-slate-800">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3">Seleccione Curso Oficial</label>
                        <select name="courseId" value={studentFormData.courseId} onChange={handleStudentChange} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-black outline-none focus:border-amber-500 cursor-pointer">
                          <option value="" className="text-slate-800">-- Seleccionar Grado / Sección --</option>
                          {courses.map(c => <option key={c.id} value={c.id} className="text-slate-800">{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 z-20">
                <button type="button" onClick={prevStudentStep} disabled={studentStep === 1} className="flex items-center gap-2 px-6 py-4 font-black text-slate-500 hover:text-slate-900 transition-all uppercase text-[11px] tracking-widest disabled:opacity-30"><ChevronLeft size={18}/> Atrás</button>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowStudentWizard(false)} className="px-6 py-4 font-black text-slate-400 hover:text-slate-900 transition-all uppercase text-[11px] tracking-widest hidden sm:block">Cancelar</button>
                  {studentStep === 4 ? (
                    <button type="button" onClick={handleStudentSubmit} disabled={isSaving} className="flex items-center gap-3 px-10 py-4 bg-amber-500 text-white font-black rounded-[2rem] hover:bg-amber-600 shadow-xl disabled:opacity-50 uppercase text-[10px] tracking-[0.2em] transition-all hover:scale-105">
                      {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} {editingStudent ? 'Actualizar' : 'Matricular'}
                    </button>
                  ) : (
                    <button type="button" onClick={nextStudentStep} className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-amber-500 hover:scale-105">Siguiente <ChevronRight size={20} /></button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SEGURIDAD Y RESET CLAVE (COMUN) */}
      {securityModalUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl p-8 border border-red-500/20 text-center relative overflow-hidden">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><Lock size={32} /></div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Verificación Requerida</h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">Autorice el restablecimiento para <strong className="text-slate-800 dark:text-white">{securityModalUser.nombre}</strong>.</p>
            <form onSubmit={confirmAndResetPassword} className="mt-8 space-y-6">
               {resetError && <div className="p-4 bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-100">{resetError}</div>}
               <div className="text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Contraseña Administrativa</label>
                  <input required type="password" value={adminPasswordConfirm} onChange={(e) => setAdminPasswordConfirm(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-red-100 dark:border-red-900/30 rounded-2xl outline-none focus:border-red-500 text-center font-bold tracking-widest text-slate-800 dark:text-white transition-all" />
               </div>
               <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => { setSecurityModalUser(null); setAdminPasswordConfirm(""); setResetError(null); }} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">Cancelar</button>
                 <button type="submit" disabled={isResetting || !adminPasswordConfirm} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                   {isResetting ? <Loader2 className="animate-spin" size={18}/> : 'Procesar'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* WIDGET 6: ÉXITO DE CREACIÓN / RESET */}
      {resetSuccessData && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[4rem] p-10 border border-emerald-500/20 text-center relative shadow-2xl">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-lg"><Send size={40} /></div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Clave Restaurada</h3>
            <p className="text-slate-500 text-sm mt-2 mb-8 font-medium">La notificación oficial ha sido enviada a <strong>{resetSuccessData.email}</strong>.</p>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-left">
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Clave Temporal</p>
               <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-inner">
                  <code className="font-mono font-black text-2xl text-slate-900 dark:text-white tracking-widest">{resetSuccessData.newPassword}</code>
                  <button type="button" onClick={() => navigator.clipboard.writeText(resetSuccessData.newPassword)} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all" title="Copiar"><Copy size={20} /></button>
               </div>
            </div>
            <button type="button" onClick={() => setResetSuccessData(null)} className="mt-8 w-full py-5 bg-slate-900 dark:bg-emerald-600 text-white font-black rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-xl">Finalizar</button>
          </div>
        </div>
      )}

      {/* MODAL 5: ALTA DE USUARIO */}
      {showForm && role === 'ADMIN_SISTEMA' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95">
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                <div>
                  <h3 className="font-black text-3xl text-slate-900 dark:text-white tracking-tighter">Alta de Personal</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 opacity-60">Creación de nuevo expediente institucional</p>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="p-4 bg-white dark:bg-slate-800 hover:bg-red-500 hover:text-white rounded-[1.5rem] shadow-xl transition-all active:scale-90"><X size={26}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
                {feedback && (
                  <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${feedback.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    {feedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />} {feedback.msg}
                  </div>
                )}
                <div className="space-y-10 pb-10">
                  <PersonalDataSection formData={formData} handleChange={handleCreateChange} />
                  <AccessSection formData={formData} handleChange={handleCreateChange} />
                  {formData.rol === 'DOCENTE' && <SubjectSelectionSection subjects={subjects} selectedIds={formData.subjectIds || []} onToggle={handleCreateToggleSubject} />}
                </div>
              </div>
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-6 shrink-0 z-20">
                <button type="button" onClick={() => setShowForm(false)} className="px-10 py-5 font-black text-slate-400 hover:text-slate-900 transition-all uppercase text-[11px] tracking-widest">Cancelar</button>
                <button type="button" onClick={handleCreateSubmit} disabled={isSaving} className="flex items-center gap-4 px-16 py-5 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-700 shadow-2xl disabled:opacity-50 uppercase text-xs tracking-[0.2em] transition-all hover:scale-105 active:scale-95">
                  {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} Registrar Oficialmente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WIDGET 7: ÉXITO DE CREACIÓN */}
      {showSuccessWidget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[4rem] shadow-2xl p-10 border border-white/10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 to-emerald-500"></div>
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl"><CheckCircle2 size={50} /></div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">¡Registro Exitoso!</h3>
            <p className="text-slate-500 font-bold text-sm mt-2 mb-10 uppercase tracking-widest opacity-60">Credenciales Generadas</p>
            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email de Acceso</p>
                <p className="font-bold text-slate-700 dark:text-slate-200">{showSuccessWidget.email}</p>
              </div>
              <div className="text-left pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Contraseña Temporal</p>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-blue-100 dark:border-blue-900/30 shadow-inner">
                  <code className="font-mono font-black text-2xl text-slate-900 dark:text-white tracking-widest">{showSuccessWidget.passwordPlana}</code>
                  <button type="button" onClick={() => navigator.clipboard.writeText(showSuccessWidget.passwordPlana)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Copy size={20} /></button>
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setShowSuccessWidget(null)} className="mt-10 w-full py-5 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-2xl">Confirmar y Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTES DE PRESENTACIÓN Y FORMULARIOS AISLADOS
// ============================================================================

interface SectionProps { formData: UserFormData; handleChange: any; }

function PersonalDataSection({formData, handleChange}: SectionProps) {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombres Completos</label><input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-blue-500/10 transition-all" /></div>
        <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellidos</label><input type="text" name="apellido" value={formData.apellido || ''} onChange={handleChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-blue-500/10 transition-all" /></div>
        <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Género Registrado</label><select name="genero" value={formData.genero || 'M'} onChange={handleChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer"><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
        <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha de Nacimiento</label><input type="date" name="fechaNacimiento" value={formData.fechaNacimiento || ''} onChange={handleChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" /></div>
        <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono Principal</label><input type="text" name="telefono" value={formData.telefono || ''} onChange={handleChange} placeholder="000-000-0000" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" /></div>
        <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección de Residencia</label><input type="text" name="direccion" value={formData.direccion || ''} onChange={handleChange} placeholder="Ciudad, Sector, Calle" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" /></div>
      </div>
    </section>
  );
}

function AccessSection({formData, handleChange}: SectionProps) {
  return (
    <section className="p-8 bg-slate-900 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <div className="lg:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Correo Institucional</label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="usuario@institucion.edu.do" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:bg-white/10 focus:border-blue-500 outline-none transition-all" /></div>
        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Rol de Acceso</label><select name="rol" value={formData.rol} onChange={handleChange} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-blue-400 cursor-pointer outline-none focus:border-blue-500"><option value="DOCENTE">DOCENTE</option><option value="DIRECTOR">DIRECTOR</option><option value="SECRETARIA">SECRETARIA</option><option value="ADMIN_SISTEMA">ADMIN</option></select></div>
        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Estado</label><select name="estado" value={formData.estado || 'ACTIVO'} onChange={handleChange} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-emerald-400 cursor-pointer outline-none focus:border-emerald-500"><option value="ACTIVO">ACTIVO</option><option value="PENDIENTE">PENDIENTE</option><option value="SUSPENDIDO">SUSPENDIDO</option></select></div>
      </div>
    </section>
  );
}

function SubjectSelectionSection({subjects, selectedIds, onToggle}: {subjects: any[], selectedIds: string[], onToggle: (id: string) => void}) {
  const sortedSubjects = [...subjects].sort((a, b) => {
    const cursoA = a.course?.name || '';
    const cursoB = b.course?.name || '';
    return cursoA.localeCompare(cursoB);
  });

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
        {sortedSubjects.map((sub:any) => {
          const isSelected = selectedIds.includes(sub.id);
          return (
            <div key={sub.id} onClick={() => onToggle(sub.id)} className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col gap-2 ${isSelected ? 'bg-indigo-50 border-indigo-600 shadow-md dark:bg-indigo-900/20 dark:border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200'}`}>
              <div className="flex justify-between items-start">
                 <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-100/50 dark:bg-indigo-900/40 px-3 py-1 rounded-md">
                   {sub.course?.name || 'SIN CURSO ASIGNADO'}
                 </p>
                 {isSelected && <CheckCircle2 size={24} className="text-indigo-600 dark:text-indigo-400 animate-in zoom-in" />}
              </div>
              <h4 className={`font-black text-xl leading-tight mt-2 ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>{sub.name}</h4>
            </div>
          )
        })}
      </div>
    </section>
  );
}