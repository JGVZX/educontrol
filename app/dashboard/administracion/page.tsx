'use client';

/**
 * @file page.tsx
 * @description Módulo de Administración Integral - EduControl.
 * Diseño escalado, corrección de legibilidad en el header de los perfiles.
 */

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';
import { 
  getUsersForMonitoring, getStudentsForDirectory, getAvailableCourses,
  createStudent, updateStudent, getAvailableSubjects, createUser,
  updateUser, toggleUserStatus, resetUserPassword, getMyCargaAcademica, deleteUser
} from './actions';
import { 
  UserPlus, Save, Loader2, AlertCircle, BookOpen, Activity, Users, ShieldCheck, 
  FileText, X, Eye, Printer, Search, Edit, ChevronRight, ChevronLeft,
  ImageIcon, Download, UserCircle, HeartPulse, GraduationCap,
  ExternalLink, Briefcase, Fingerprint, Lock, Power, KeyRound, MonitorPlay, 
  CalendarDays, ListChecks, ShieldAlert, UserCog, Trash2, Info
} from 'lucide-react';

// --- Interfaces de Datos ---
interface SubjectData { id: string; name: string; courseName?: string; }
interface CourseData { id: string; name: string; }
interface UserMonitor {
  id: string; nombre: string; apellido: string | null; email: string;
  role: string; estado: string; telefono: string | null; direccion: string | null;
  fechaNacimiento: string | null; genero: string | null; updatedAt: string;
  subjects: SubjectData[];
}
interface StudentMonitor {
  id: string; nombre: string; apellido: string; rne: string; folio: string; 
  estatus: string; courseName: string | null; courseId?: string; createdAt: string;
  fechaNacimiento?: string; genero?: string; direccion?: string; nacionalidad?: string;
  alergias?: string; condiciones?: string; tipoSangre?: string; seguroMedico?: string;
  tutorNombre?: string; tutorParentesco?: string; tutorTelefono?: string; tutorOcupacion?: string;
  fotoUrl?: string; actaNacimientoUrl?: string; certificadoMedicoUrl?: string;
}

export default function AdministracionPage() {
  const { user: currentUser } = useUser();
  const role = currentUser?.role;

  // --- Estados Globales ---
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const PERIODO_ACTUAL = "Ciclo Escolar 2025-2026"; 

  // --- Estados: Secretaria (Estudiantes) ---
  const [students, setStudents] = useState<StudentMonitor[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [searchStudent, setSearchStudent] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [showStudentWizard, setShowStudentWizard] = useState(false);
  const [studentStep, setStudentStep] = useState(1);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentMonitor | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentMonitor | null>(null);

  // --- Estados: Admin/Director (Usuarios/Staff) ---
  const [usersMonitor, setUsersMonitor] = useState<UserMonitor[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserMonitor | null>(null);
  const [securityModalUser, setSecurityModalUser] = useState<UserMonitor | null>(null);
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserMonitor | null>(null);
  const [generatedPasswordAlert, setGeneratedPasswordAlert] = useState<{email: string, pass: string} | null>(null);

  // --- Formularios Iniciales ---
  const initialStudentState = {
    nombre: '', apellido: '', rne: '', folio: '', fechaNacimiento: '', genero: 'M', 
    direccion: '', nacionalidad: 'Dominicana', fotoFile: null as File | null, actaFile: null as File | null, certificadoFile: null as File | null,
    alergias: '', condiciones: '', tipoSangre: '', seguroMedico: '',
    tutorNombre: '', tutorParentesco: '', tutorTelefono: '', tutorOcupacion: '', courseId: ''
  };
  const [studentFormData, setStudentFormData] = useState(initialStudentState);

  const initialUserState = {
    nombre: '', apellido: '', email: '', password: '', rol: 'DOCENTE', estado: 'ACTIVO', 
    telefono: '', direccion: '', fechaNacimiento: '', genero: 'M', subjectIds: [] as string[]
  };
  const [userFormData, setUserFormData] = useState(initialUserState);

  // --- Hidratación de Datos ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      if (role === 'SECRETARIA' || role === 'DIRECTOR') {
        const [studs, crs] = await Promise.all([getStudentsForDirectory(), getAvailableCourses()]);
        setStudents(studs || []);
        setCourses(crs || []);
      }
      if (role === 'ADMIN_SISTEMA' || role === 'DIRECTOR') {
        const [users, subs] = await Promise.all([getUsersForMonitoring(), getAvailableSubjects()]);
        setUsersMonitor(users || []);
        setSubjects(subs || []);
      }
      if (role === 'DOCENTE' && currentUser?.id) {
        const mySubs = await getMyCargaAcademica(currentUser.id);
        setSubjects(mySubs || []);
      }
    } catch (error) { 
      console.error("Error cargando módulos:", error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { if (role) loadData(); }, [role]);

  // ==========================================
  // GENERADOR DE PDF: CONSTANCIA DE ESTUDIOS
  // ==========================================
  const handlePrintConstancia = (student: StudentMonitor) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Por favor, permite las ventanas emergentes (pop-ups) para generar el PDF.");
    
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Constancia - ${student.nombre} ${student.apellido}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 40px; }
          .header h1 { color: #1e40af; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; }
          .header h2 { color: #64748b; margin: 5px 0 0 0; font-size: 16px; font-weight: normal; text-transform: uppercase; letter-spacing: 2px;}
          .content { margin-bottom: 50px; font-size: 16px; text-align: justify; }
          .content p { margin-bottom: 20px; }
          .highlight { font-weight: bold; color: #0f172a; border-bottom: 1px solid #cbd5e1; }
          .signature { margin-top: 80px; text-align: center; }
          .signature-line { width: 250px; border-top: 1px solid #1e293b; margin: 0 auto 10px auto; }
          .signature p { margin: 0; font-size: 14px; font-weight: bold; }
          .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; font-size: 150px; font-weight: 900; color: #1e40af; pointer-events: none; white-space: nowrap; transform: translate(-50%, -50%) rotate(-45deg); z-index: -1;}
        </style>
      </head>
      <body>
        <div class="watermark">VILLA TAPIA</div>
        <div class="header">
          <h1>Centro Educativo Villa Tapia</h1>
          <h2>Constancia Oficial de Inscripción</h2>
        </div>
        <div class="content">
          <p>A quien pueda interesar:</p>
          <p>La Dirección del <strong>Centro Educativo Villa Tapia</strong>, por medio de la presente, hace constar que el/la estudiante <span class="highlight">${student.nombre} ${student.apellido}</span>, portador/a del Registro Nacional de Estudiante (RNE): <span class="highlight">${student.rne}</span>, se encuentra oficialmente matriculado/a e inscrito/a en esta institución.</p>
          <p>El/La estudiante está cursando actualmente el <span class="highlight">${PERIODO_ACTUAL}</span>.</p>
          <p>Se expide la presente constancia, a solicitud de la parte interesada, a los <strong>${new Date().getDate()}</strong> días del mes de <strong>${new Date().toLocaleString('es-DO', { month: 'long' })}</strong> del año <strong>${new Date().getFullYear()}</strong>.</p>
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          <p>Dirección Académica</p>
          <p style="font-weight: normal; font-size: 12px; color: #64748b;">Centro Educativo Villa Tapia</p>
        </div>
        <div class="footer">
          <p>Documento oficial emitido a través de <strong>EduControl</strong> - Sistema de Gestión Escolar Integral</p>
          <p style="font-size: 10px; margin-top: 4px;">ID de Documento: ${student.id} | Validado digitalmente</p>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ==========================================
  // MANEJADORES: ESTUDIANTES (SECRETARIA)
  // ==========================================
  const openNewStudentModal = () => {
    setStudentFormData(initialStudentState);
    setFotoPreview(null); setEditingStudent(null);
    setStudentStep(1); setFeedback(null); setShowStudentWizard(true);
  };

  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.type === 'file') {
      const file = target.files?.[0] || null;
      setStudentFormData(prev => ({ ...prev, [target.name]: file }));
      if (target.name === 'fotoFile' && file) setFotoPreview(URL.createObjectURL(file));
    } else {
      setStudentFormData(prev => ({ ...prev, [target.name]: target.value }));
    }
  };

  const handleStudentSubmit = async () => {
    setIsSaving(true); setFeedback(null);
    try {
      const data = new FormData();
      Object.entries(studentFormData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (value instanceof File) data.append(key, value);
          else data.append(key, String(value));
        }
      });
      const result = editingStudent ? await updateStudent(editingStudent.id, data) : await createStudent(data);
      if (result.success) { setShowStudentWizard(false); loadData(); } 
      else setFeedback({ type: 'error', msg: result.message || 'Error al guardar expediente.' });
    } catch (err) { setFeedback({ type: 'error', msg: 'Fallo crítico de conexión.' }); } 
    finally { setIsSaving(false); }
  };

  // ==========================================
  // MANEJADORES: USUARIOS (ADMIN / DIRECTOR)
  // ==========================================
  const openNewUserModal = () => {
    setUserFormData(initialUserState);
    setEditingUser(null); setFeedback(null); setShowUserModal(true);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value, ...(name === 'rol' && value !== 'DOCENTE' ? { subjectIds: [] } : {}) }));
  };

  const handleToggleSubject = (subjectId: string) => {
    setUserFormData(prev => {
      const ids = prev.subjectIds || [];
      return { ...prev, subjectIds: ids.includes(subjectId) ? ids.filter(id => id !== subjectId) : [...ids, subjectId] };
    });
  };

  const handleUserSubmit = async () => {
    setIsSaving(true); setFeedback(null);
    try {
      const result = editingUser ? await updateUser(editingUser.id, userFormData) : await createUser(userFormData);
      if (result.success) { 
        setShowUserModal(false); 
        loadData(); 
        // Mostrar la alerta de contraseña generada solo si es un usuario nuevo y no se ingresó clave
        if (!editingUser && result.data?.passwordPlana && !userFormData.password) {
            setGeneratedPasswordAlert({ email: result.data.email, pass: result.data.passwordPlana });
        }
      } 
      else setFeedback({ type: 'error', msg: result.message || 'Error de registro de usuario.' });
    } catch (err) { setFeedback({ type: 'error', msg: 'Error de conexión con el servidor.' }); } 
    finally { setIsSaving(false); }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    await toggleUserStatus(userId, currentStatus);
    loadData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("ATENCIÓN: ¿Está absolutamente seguro de que desea ELIMINAR ESTE USUARIO DEFINITIVAMENTE del sistema? Esta acción es irreversible.")) {
      const result = await deleteUser(userId);
      if (result.success) {
        loadData();
      } else {
        alert(result.message || "Error al eliminar usuario.");
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityModalUser || !currentUser?.email) return;
    setIsSaving(true); setFeedback(null);
    try {
      const result = await resetUserPassword(securityModalUser.id, currentUser.email, adminPasswordConfirm);
      if (result.success) {
        setFeedback({ type: 'success', msg: `Clave reseteada correctamente. La nueva clave es: ${result.newPassword}` });
        setAdminPasswordConfirm(""); 
      } else setFeedback({ type: 'error', msg: result.message || "Autorización denegada." });
    } catch (err) { setFeedback({ type: 'error', msg: "Fallo de seguridad crítico en el servidor." }); } 
    finally { setIsSaving(false); }
  };

  // ==========================================
  // FILTROS Y PAGINACIÓN
  // ==========================================
  const filteredStudents = useMemo(() => {
    setStudentPage(1);
    return students.filter(s => `${s.nombre} ${s.apellido} ${s.rne} ${s.folio}`.toLowerCase().includes(searchStudent.toLowerCase()));
  }, [searchStudent, students]);

  const filteredUsers = useMemo(() => {
    setUserPage(1);
    return usersMonitor.filter(u => `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(searchUser.toLowerCase()));
  }, [searchUser, usersMonitor]);

  const paginatedStudents = filteredStudents.slice((studentPage - 1) * ITEMS_PER_PAGE, studentPage * ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE);

  if (isLoading) return <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"><Loader2 className="animate-spin text-blue-600" size={48} /><p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Cargando Sistema...</p></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 p-2 md:p-6">
      
      {/* HEADER DINÁMICO MULTI-ROL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
            {role === 'SECRETARIA' && <Users className="text-amber-500" size={38} />}
            {role === 'ADMIN_SISTEMA' && <ShieldCheck className="text-blue-600" size={38} />}
            {role === 'DIRECTOR' && <Activity className="text-emerald-500" size={38} />}
            {role === 'DOCENTE' && <GraduationCap className="text-indigo-600" size={38} />}
            
            {role === 'SECRETARIA' && 'Centro Operativo Estudiantil'}
            {role === 'ADMIN_SISTEMA' && 'Gestión y Control del Sistema'}
            {role === 'DIRECTOR' && 'Gerencia Académica Integral'}
            {role === 'DOCENTE' && 'Mi Espacio Académico'}
          </h1>
          <p className="text-slate-500 font-medium ml-1 mt-1">
            {role === 'DOCENTE' ? 'Panel de control docente, materias y herramientas.' : 
             role === 'ADMIN_SISTEMA' ? 'Administración de usuarios, seguridad y roles de la plataforma.' : 
             'Gestión de registros oficiales y personal del centro educativo.'}
          </p>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 1. VISTA: DOCENTE (Panel Colorido y Rutas Exactas) */}
      {/* ========================================================= */}
      {role === 'DOCENTE' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
           {/* Accesos Rápidos Premium & Coloridos */}
           <section>
             <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6"><Activity size={20} className="text-indigo-500"/> Accesos Rápidos</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Horario - Azul */}
                <Link href="/dashboard/horario" className="group relative bg-gradient-to-br from-blue-500 to-blue-700 p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden flex flex-col items-center text-center border border-blue-400/50">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                   <div className="w-20 h-20 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center mb-4 backdrop-blur-md group-hover:scale-110 transition-transform"><CalendarDays size={36}/></div>
                   <h4 className="font-black text-white text-xl tracking-tight">Horario de Clases</h4>
                   <p className="text-sm font-medium text-blue-100 mt-1">Ver itinerario semanal</p>
                </Link>

                {/* Pase de Lista (Asistencia) - Naranja */}
                <Link href="/dashboard/asistencia" className="group relative bg-gradient-to-br from-amber-400 to-orange-500 p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden flex flex-col items-center text-center border border-amber-300/50">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                   <div className="w-20 h-20 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center mb-4 backdrop-blur-md group-hover:scale-110 transition-transform"><ListChecks size={36}/></div>
                   <h4 className="font-black text-white text-xl tracking-tight">Pase de Lista</h4>
                   <p className="text-sm font-medium text-amber-100 mt-1">Control de asistencia</p>
                </Link>

                {/* Evaluaciones (Notas) - Verde */}
                <Link href="/dashboard/notas" className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden flex flex-col items-center text-center border border-emerald-400/50">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                   <div className="w-20 h-20 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center mb-4 backdrop-blur-md group-hover:scale-110 transition-transform"><FileText size={36}/></div>
                   <h4 className="font-black text-white text-xl tracking-tight">Evaluaciones</h4>
                   <p className="text-sm font-medium text-emerald-100 mt-1">Registro de notas</p>
                </Link>

                {/* Aula Virtual - Morado */}
                <Link href="/dashboard/aula-virtual" className="group relative bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden flex flex-col items-center text-center border border-indigo-400/50">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                   <div className="w-20 h-20 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center mb-4 backdrop-blur-md group-hover:scale-110 transition-transform"><MonitorPlay size={36}/></div>
                   <h4 className="font-black text-white text-xl tracking-tight">Aula Virtual</h4>
                   <p className="text-sm font-medium text-indigo-100 mt-1">Recursos digitales</p>
                </Link>

             </div>
           </section>

           {/* Carga Académica */}
           <section>
             <div className="flex justify-between items-end mb-6">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><BookOpen className="text-indigo-500"/> Carga Académica</h3>
                <span className="px-4 py-2 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl border border-slate-200">{PERIODO_ACTUAL}</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {subjects.length === 0 ? (
                 <div className="col-span-full p-12 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm"><Briefcase size={32}/></div>
                    <p className="text-slate-500 font-black text-lg">Aún no tienes materias asignadas.</p>
                    <p className="text-sm font-bold text-slate-400 mt-1">Comunícate con la dirección académica.</p>
                 </div>
               ) : (
                 subjects.map(sub => (
                   <div key={sub.id} className="relative bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-all overflow-hidden">
                     <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-50 rounded-full opacity-50"></div>
                     <div className="relative z-10">
                        <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-5 border border-indigo-100"><GraduationCap size={28}/></div>
                        <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight">{sub.name.split('-')[0]}</h4>
                        <span className="inline-block px-3 py-1.5 bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-lg border border-slate-100 shadow-sm">{sub.courseName}</span>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. VISTA: ADMIN / DIRECTOR (Rediseño Vibrante y Moderno) */}
      {/* ========================================================= */}
      {(role === 'ADMIN_SISTEMA' || role === 'DIRECTOR') && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
          
          <section>
            <div className="flex justify-between items-end mb-6">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Activity size={20} className="text-blue-500"/> Monitoreo Operativo</h3>
               {/* BOTÓN NUEVO EMPLEADO (SOLO ADMIN - AMPLIADO) */}
               {role === 'ADMIN_SISTEMA' && (
                  <button onClick={openNewUserModal} className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-slate-800 hover:-translate-y-1 transition-all">
                    <UserPlus size={20}/> Registrar Personal
                  </button>
               )}
            </div>
            
            {/* MÉTRICAS AMPLIADAS DEL ADMINISTRADOR (Estilo Vibrant Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               
               {/* Card 1: Usuarios (Blue gradient) */}
               <div className="group relative bg-gradient-to-br from-blue-500 to-blue-700 p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden flex flex-col items-center text-center border border-blue-400/50">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                  <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md group-hover:scale-110 transition-transform"><Users size={28}/></div>
                  <h4 className="font-black text-white text-5xl tracking-tight">{usersMonitor.length}</h4>
                  <p className="text-xs font-black text-blue-100 mt-2 uppercase tracking-widest">Total Usuarios</p>
               </div>

               {/* Card 2: Docentes (Indigo gradient) */}
               <div className="group relative bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden flex flex-col items-center text-center border border-indigo-400/50">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                  <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md group-hover:scale-110 transition-transform"><Briefcase size={28}/></div>
                  <h4 className="font-black text-white text-5xl tracking-tight">{usersMonitor.filter(u=>u.role==='DOCENTE').length}</h4>
                  <p className="text-xs font-black text-indigo-100 mt-2 uppercase tracking-widest">Personal Docente</p>
               </div>

               {/* Card 3: Activos (Emerald gradient) */}
               <div className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden flex flex-col items-center text-center border border-emerald-400/50">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                  <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28}/></div>
                  <h4 className="font-black text-white text-5xl tracking-tight">{usersMonitor.filter(u=>u.estado==='ACTIVO').length}</h4>
                  <p className="text-xs font-black text-emerald-100 mt-2 uppercase tracking-widest">Accesos Activos</p>
               </div>

               {/* Card 4: Suspendidos (Red/Orange gradient) */}
               <div className="group relative bg-gradient-to-br from-rose-500 to-orange-500 p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden flex flex-col items-center text-center border border-rose-400/50">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                  <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md group-hover:scale-110 transition-transform"><ShieldAlert size={28}/></div>
                  <h4 className="font-black text-white text-5xl tracking-tight">{usersMonitor.filter(u=>u.estado==='SUSPENDIDO').length}</h4>
                  <p className="text-xs font-black text-rose-100 mt-2 uppercase tracking-widest">Bloqueados</p>
               </div>

            </div>
          </section>

          {/* TABLA DE GESTIÓN DE USUARIOS */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center gap-3 text-2xl tracking-tight"><UserCog size={28} className="text-blue-600"/> Gestión de Usuarios y Roles</h3>
              <div className="relative w-full sm:w-96">
                 <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Buscar por nombre o correo..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="w-full pl-14 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
              </div>
            </div>
            
            <div className="overflow-x-auto w-full min-h-[400px]">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-100/50">
                    <th className="px-8 py-6 border-b border-slate-200 w-[35%]">Usuario e Identidad</th>
                    <th className="px-6 py-6 border-b border-slate-200 w-[20%]">Rol Asignado</th>
                    <th className="px-6 py-6 border-b border-slate-200 w-[20%]">Contacto</th>
                    <th className="px-6 py-6 text-center border-b border-slate-200 w-[10%]">Acceso</th>
                    <th className="px-8 py-6 text-right border-b border-slate-200 w-[15%]">Acciones Directas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.length === 0 ? <tr><td colSpan={5} className="p-12 text-center font-bold text-slate-400 text-lg">No hay usuarios registrados.</td></tr> : paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[1rem] bg-slate-100 flex items-center justify-center font-black text-slate-500 text-lg shadow-sm border border-slate-200">{u.nombre[0]}</div>
                            <div className="overflow-hidden">
                              <p className="font-black text-slate-900 text-base truncate mb-0.5">{u.nombre} {u.apellido}</p>
                              <p className="text-[10px] font-bold text-blue-600 truncate uppercase tracking-widest">{u.email}</p>
                            </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest ${u.role === 'ADMIN_SISTEMA' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                            {u.role.replace('_', ' ')}
                          </span>
                       </td>
                       <td className="px-6 py-5 text-sm font-bold text-slate-600">{u.telefono || 'Sin registrar'}</td>
                       <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${u.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            <div className={`w-2 h-2 rounded-full ${u.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-red-500'}`}/> {u.estado}
                          </span>
                       </td>
                       <td className="px-8 py-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                               {/* BOTÓN VER PERFIL (DIRECTOR / ADMIN) */}
                               <button onClick={() => setSelectedUserProfile(u)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition-all" title="Ver Perfil y Clases"><Eye size={18} /></button>
                               
                               {role === 'ADMIN_SISTEMA' && (
                                 <>
                                   <button onClick={() => { setEditingUser(u); setUserFormData({ nombre: u.nombre, apellido: u.apellido||'', email: u.email, password: '', rol: u.role, estado: u.estado, telefono: u.telefono||'', direccion: u.direccion||'', fechaNacimiento: u.fechaNacimiento||'', genero: u.genero||'M', subjectIds: u.subjects.map(s=>s.id) }); setShowUserModal(true); }} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-amber-600 hover:border-amber-300 shadow-sm transition-all" title="Editar Perfil"><Edit size={18} /></button>
                                   <button onClick={() => setSecurityModalUser(u)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all" title="Restablecer Clave"><KeyRound size={18} /></button>
                                   <button onClick={() => handleToggleUserStatus(u.id, u.estado)} className={`p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm transition-all ${u.estado === 'ACTIVO' ? 'text-slate-500 hover:text-orange-600 hover:border-orange-300' : 'text-orange-500 hover:text-emerald-600 hover:border-emerald-300'}`} title={u.estado === 'ACTIVO' ? 'Suspender Acceso' : 'Reactivar Acceso'}><Power size={18} /></button>
                                   {/* BOTÓN ELIMINAR (NUEVO) */}
                                   <button onClick={() => handleDeleteUser(u.id)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm transition-all" title="Eliminar Permanentemente"><Trash2 size={18} /></button>
                                 </>
                               )}
                            </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación Admin */}
            {Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) > 0 && (
              <div className="p-6 sm:p-8 border-t border-slate-200 flex justify-between items-center bg-slate-50/80">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pág. {userPage} de {Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-100 shadow-sm"><ChevronLeft size={18}/></button>
                  <button onClick={() => setUserPage(p => Math.min(Math.ceil(filteredUsers.length / ITEMS_PER_PAGE), p + 1))} disabled={userPage === Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-100 shadow-sm"><ChevronRight size={18}/></button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. VISTA: SECRETARÍA (Directorio de Estudiantes) */}
      {/* ========================================================= */}
      {role === 'SECRETARIA' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
           {/* Widgets y Botones */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between"><div><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Matrícula Total</p><p className="text-4xl font-black text-slate-800">{students.length}</p></div><div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><Users size={28}/></div></div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between"><div><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Cursos</p><p className="text-4xl font-black text-slate-800">{courses.length}</p></div><div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600"><BookOpen size={28}/></div></div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between"><div><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Alumnos Activos</p><p className="text-4xl font-black text-emerald-600">{students.filter(s=>s.estatus==='ACTIVO').length}</p></div><div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Activity size={28}/></div></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={openNewStudentModal} className="text-left group relative bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] text-white shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>
                 <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md"><UserPlus size={32} className="text-amber-400" /></div>
                    <div><h3 className="text-3xl font-black tracking-tighter">Nueva Admisión</h3><p className="text-slate-400 text-sm mt-2 font-medium max-w-sm">Crear expediente validado con RNE, Folio y documentos adjuntos.</p></div>
                 </div>
              </button>
              <Link href="/dashboard/reportes" className="group relative block bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-[3rem] text-white shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
                 <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                 <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md"><Printer size={32} className="text-blue-100" /></div>
                    <div><h3 className="text-3xl font-black tracking-tighter">Centro de Actas</h3><p className="text-blue-100 text-sm mt-2 font-medium max-w-sm opacity-90">Emisión de constancias, boletines y récords validados.</p></div>
                    <div className="mt-8 flex items-center gap-3 text-sm font-black text-white uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-colors">Abrir Generador <ExternalLink size={18} /></div>
                 </div>
              </Link>
           </div>

           <section className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center gap-3 text-2xl tracking-tight"><UserCircle size={24} className="text-amber-500"/> Directorio Estudiantil</h3>
              <div className="relative w-full sm:w-auto">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Buscar por RNE, Folio o Nombre..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} className="w-full sm:w-80 pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/10" />
              </div>
            </div>
            
            <div className="overflow-x-auto w-full min-h-[400px]">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-100/50">
                    <th className="px-6 py-5 border-b border-slate-200 w-[28%]">Expediente del Alumno</th>
                    <th className="px-4 py-5 border-b border-slate-200 w-[20%]">Identidad Oficial</th>
                    <th className="px-4 py-5 border-b border-slate-200 w-[22%]">Curso Asignado</th>
                    <th className="px-4 py-5 text-center border-b border-slate-200 w-[15%]">Estatus Operativo</th>
                    <th className="px-6 py-5 text-right border-b border-slate-200 w-[15%]">Acciones Directas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-bold">No se encontraron expedientes.</td></tr> : paginatedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-amber-50/30 transition-colors">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {student.fotoUrl ? <img src={student.fotoUrl} alt={student.nombre} className="w-12 h-12 rounded-[1rem] object-cover shadow-sm border border-slate-200 shrink-0" /> : <div className="w-12 h-12 rounded-[1rem] bg-slate-100 flex items-center justify-center font-black text-slate-700 text-sm shadow-sm border border-slate-200 shrink-0">{student.nombre[0]}{student.apellido?.[0]}</div>}
                              <div className="overflow-hidden">
                                <p className="font-black text-slate-900 text-base leading-tight mb-0.5 truncate">{student.nombre} {student.apellido}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Ingreso: {new Date(student.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                         </td>
                         <td className="px-4 py-4"><p className="font-mono font-black text-sm text-blue-700 flex items-center gap-1.5"><ShieldCheck size={14}/> {student.rne}</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Folio: {student.folio}</p></td>
                         <td className="px-4 py-4"><span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm">{student.courseName || 'Sin Asignar'}</span></td>
                         <td className="px-4 py-4 text-center"><span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest bg-emerald-50 text-emerald-700 border-emerald-200">{student.estatus}</span></td>
                         <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                               <button onClick={() => setSelectedStudentProfile(student)} title="Ver Expediente" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 shadow-sm"><Eye size={18} /></button>
                               <button onClick={() => { setEditingStudent(student); setStudentFormData({...initialStudentState, ...student}); setFotoPreview(student.fotoUrl || null); setShowStudentWizard(true); }} title="Editar" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-amber-600 shadow-sm"><Edit size={18} /></button>
                               <button onClick={() => handlePrintConstancia(student)} title="Imprimir Constancia" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:border-slate-400 shadow-sm transition-all"><Printer size={18} /></button>
                            </div>
                         </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) > 0 && (
              <div className="p-6 sm:p-8 border-t border-slate-200 flex justify-between items-center bg-slate-50/80">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pág. {studentPage} de {Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setStudentPage(p => Math.max(1, p - 1))} disabled={studentPage === 1} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30"><ChevronLeft size={18}/></button>
                  <button onClick={() => setStudentPage(p => Math.min(Math.ceil(filteredStudents.length / ITEMS_PER_PAGE), p + 1))} disabled={studentPage === Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30"><ChevronRight size={18}/></button>
                </div>
              </div>
            )}
           </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* ================= MODALES GLOBALES ====================== */}
      {/* ========================================================= */}

      {/* MODAL ADMIN/DIRECTOR: VER PERFIL DE USUARIO Y MATERIAS */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-slate-50 w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                 <div className="relative h-36 bg-gradient-to-r from-blue-600 to-indigo-800 shrink-0">
                    <button onClick={() => setSelectedUserProfile(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-red-500 text-white rounded-full transition-all z-50"><X size={20}/></button>
                 </div>
                 <div className="px-8 sm:px-12 pb-12">
                    {/* FOTO FLOTANTE */}
                    <div className="relative -mt-16 mb-4 z-10">
                        <div className="w-32 h-32 rounded-[2.5rem] border-[8px] border-slate-50 bg-white shadow-xl flex items-center justify-center text-5xl font-black text-slate-300">
                           {selectedUserProfile.nombre[0]}
                        </div>
                    </div>
                    
                    {/* NOMBRE Y BADGES (Aislado de la zona azul) */}
                    <div className="mb-8 z-10 relative">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">
                           {selectedUserProfile.nombre} {selectedUserProfile.apellido}
                        </h2>
                        <div className="flex gap-2">
                           <span className="px-3 py-1 bg-blue-100 text-blue-700 font-black text-[10px] uppercase tracking-widest rounded-md">{selectedUserProfile.role.replace('_', ' ')}</span>
                           <span className={`px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-md ${selectedUserProfile.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{selectedUserProfile.estado}</span>
                        </div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-6">
                       <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2"><UserCircle size={18} className="text-blue-500"/> Información de Contacto</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><p className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</p><p className="font-bold text-slate-800">{selectedUserProfile.email}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</p><p className="font-bold text-slate-800">{selectedUserProfile.telefono || 'N/A'}</p></div>
                       </div>
                    </div>

                    <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 shadow-sm">
                       <h3 className="text-sm font-black text-indigo-800 uppercase tracking-widest mb-6 flex items-center gap-2"><BookOpen size={18} className="text-indigo-500"/> Clases y Carga Académica</h3>
                       {selectedUserProfile.subjects.length === 0 ? (
                           <p className="p-6 bg-white rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm text-center shadow-sm">El usuario no tiene materias asignadas actualmente.</p>
                       ) : (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {selectedUserProfile.subjects.map(sub => (
                                 <div key={sub.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start gap-3">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><GraduationCap size={20}/></div>
                                    <div>
                                       <p className="font-black text-slate-800 leading-tight">{sub.name}</p>
                                       <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{sub.courseName}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL ALERTA: CONTRASEÑA GENERADA (NUEVO USUARIO) */}
      {generatedPasswordAlert && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in zoom-in-95 duration-300">
           <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl text-center border-[6px] border-emerald-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl"></div>
               <div className="relative z-10">
                 <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100"><KeyRound size={48}/></div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">¡Acceso Generado!</h3>
                 <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">Se ha creado el perfil <strong className="text-slate-800">{generatedPasswordAlert.email}</strong> exitosamente. Esta es la contraseña temporal de un solo uso. <span className="text-red-500 font-bold block mt-2">Por favor, cópiela o entréguela al usuario ahora.</span></p>
                 
                 <div className="bg-slate-100 p-6 rounded-2xl mb-8 border border-slate-200 shadow-inner flex items-center justify-center gap-3">
                    <Info size={24} className="text-slate-400"/>
                    <p className="font-mono text-4xl font-black text-slate-800 tracking-widest select-all">{generatedPasswordAlert.pass}</p>
                 </div>
                 
                 <button onClick={() => setGeneratedPasswordAlert(null)} className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-emerald-600 shadow-xl hover:-translate-y-1 transition-all">Entendido y Copiado</button>
               </div>
           </div>
        </div>
      )}

      {/* MODAL ADMIN: NUEVO / EDITAR USUARIO */}
      {showUserModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full max-w-4xl rounded-[3rem] shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                  {editingUser ? <Edit className="text-blue-600" /> : <UserPlus className="text-blue-600"/>} 
                  {editingUser ? 'Modificar Empleado' : 'Registro de Personal'}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Configure las credenciales y accesos del miembro del equipo.</p>
              </div>
              <button onClick={() => setShowUserModal(false)} className="p-4 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-full transition-all"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {feedback && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-bold text-sm flex items-center gap-2"><AlertCircle size={18}/> {feedback.msg}</div>}
              <div className="space-y-8">
                {/* Bloque 1: Datos Personales */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6"><UserCircle size={16}/> Datos Personales</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-2 ml-1">Nombres</label><input type="text" name="nombre" value={userFormData.nombre} onChange={handleUserChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" /></div>
                     <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-2 ml-1">Apellidos</label><input type="text" name="apellido" value={userFormData.apellido} onChange={handleUserChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" /></div>
                     <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-2 ml-1">Teléfono</label><input type="text" name="telefono" value={userFormData.telefono} onChange={handleUserChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" /></div>
                     <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-2 ml-1">Género</label><select name="genero" value={userFormData.genero} onChange={handleUserChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
                   </div>
                </div>

                {/* Bloque 2: Credenciales */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-6"><Lock size={16}/> Autenticación y Rol</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="md:col-span-2"><label className="text-[10px] font-black text-blue-600 uppercase block mb-2 ml-1">Correo Institucional (Login)</label><input type="email" name="email" value={userFormData.email} onChange={handleUserChange} placeholder="usuario@institucion.edu.do" className="w-full p-4 bg-blue-50/30 border-2 border-blue-100 rounded-2xl font-bold text-blue-900 outline-none focus:border-blue-500 transition-all" /></div>
                     {!editingUser && (
                       <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-500 uppercase block mb-2 ml-1">Contraseña Inicial</label><input type="text" name="password" value={userFormData.password} onChange={handleUserChange} placeholder="Dejar en blanco para generar clave segura automáticamente" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" /></div>
                     )}
                     <div className="md:col-span-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 ml-1">Nivel de Acceso (Rol)</label>
                       <select name="rol" value={userFormData.rol} onChange={handleUserChange} className="w-full p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl font-black text-sm outline-none cursor-pointer">
                         <option value="DOCENTE">Docente (Gestión de Aulas)</option>
                         <option value="SECRETARIA">Secretaría (Operativo Estudiantil)</option>
                         <option value="DIRECTOR">Director Académico</option>
                         <option value="ADMIN_SISTEMA">Administrador de Sistema (Full Access)</option>
                       </select>
                     </div>
                   </div>
                </div>

                {/* Bloque 3: Materias (Solo Docentes) */}
                {userFormData.rol === 'DOCENTE' && (
                  <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 shadow-sm animate-in zoom-in-95 duration-300">
                    <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-6"><BookOpen size={16}/> Asignación de Materias</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {subjects.map(s => (
                        <label key={s.id} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${userFormData.subjectIds.includes(s.id) ? 'border-indigo-500 bg-white shadow-md' : 'border-indigo-100/50 bg-white/50 hover:bg-white'}`}>
                          <input type="checkbox" checked={userFormData.subjectIds.includes(s.id)} onChange={() => handleToggleSubject(s.id)} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                          <div><span className="font-black text-slate-800 text-sm block">{s.name}</span><span className="text-[10px] font-bold text-slate-500 uppercase">{s.courseName}</span></div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex justify-end">
              <button onClick={handleUserSubmit} disabled={isSaving} className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50 transition-all">
                {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} {editingUser ? 'Guardar Cambios' : 'Registrar Nuevo Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN: SEGURIDAD (RESET CLAVE) */}
      {securityModalUser && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><KeyRound size={36}/></div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Auditoría de Seguridad</h3>
            <p className="text-slate-500 font-medium text-sm mb-8">Restablecer la contraseña del usuario <strong className="text-slate-800">{securityModalUser.email}</strong>. Ingrese SU clave de administrador para autorizar la acción.</p>
            {feedback && <div className={`mb-6 p-4 rounded-2xl font-bold text-sm ${feedback.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>{feedback.msg}</div>}
            <input type="password" placeholder="Su Contraseña Maestra" value={adminPasswordConfirm} onChange={(e) => setAdminPasswordConfirm(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-center mb-6 outline-none focus:border-red-500 transition-all" />
            <div className="flex gap-4">
              <button onClick={() => setSecurityModalUser(null)} className="flex-1 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px] bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">Cerrar</button>
              <button onClick={handleResetPassword} disabled={isSaving || !adminPasswordConfirm} className="flex-1 py-4 font-black text-white uppercase tracking-widest text-[10px] bg-red-600 rounded-2xl shadow-lg disabled:opacity-50 hover:bg-red-700 transition-all">Confirmar Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AZUL: VER EXPEDIENTE ESTUDIANTE (CON EL ARREGLO VISUAL DEL RECORTE) */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] relative">
             <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="relative h-48 bg-gradient-to-r from-blue-700 to-indigo-900 shrink-0">
                   <button onClick={() => setSelectedStudentProfile(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-red-500 text-white rounded-full transition-all z-50"><X size={20} /></button>
                </div>
                <div className="px-8 sm:px-12 pb-12">
                   {/* FOTO FLOTANTE */}
                   <div className="relative -mt-20 mb-4 z-10">
                       <div className="w-40 h-40 rounded-[3rem] border-[8px] border-slate-50 bg-white shadow-xl flex items-center justify-center overflow-hidden">
                         {selectedStudentProfile.fotoUrl ? <img src={selectedStudentProfile.fotoUrl} alt={selectedStudentProfile.nombre} className="w-full h-full object-cover" /> : <div className="text-6xl font-black text-slate-300">{selectedStudentProfile.nombre[0]}</div>}
                       </div>
                   </div>

                   {/* NOMBRE Y BADGES (Aislado de la zona azul) */}
                   <div className="mb-8 z-10 relative">
                       <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-tight mb-3">
                         {selectedStudentProfile.nombre} {selectedStudentProfile.apellido}
                       </h2>
                       <div className="flex flex-wrap gap-2">
                          <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded-full border border-blue-200"><Fingerprint className="inline mr-1" size={12}/> RNE: {selectedStudentProfile.rne}</span>
                          <span className="px-4 py-1.5 bg-white text-slate-600 text-[10px] font-black uppercase rounded-full border border-slate-200">Folio: {selectedStudentProfile.folio}</span>
                          <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full border border-emerald-200">Estatus: {selectedStudentProfile.estatus}</span>
                       </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                     <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                       <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2"><UserCircle size={18}/> Datos de Identidad</h4>
                       <div className="space-y-4">
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Nacionalidad / Género</p><p className="font-black text-slate-800">{selectedStudentProfile.nacionalidad || 'Dominicana'} - {selectedStudentProfile.genero === 'M' ? 'Masculino' : 'Femenino'}</p></div>
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Nacimiento</p><p className="font-black text-slate-800">{selectedStudentProfile.fechaNacimiento || 'No registrada'}</p></div>
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Dirección de Residencia</p><p className="font-black text-slate-800">{selectedStudentProfile.direccion || 'No registrada'}</p></div>
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Curso Asignado</p><p className="font-black text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-lg mt-1">{selectedStudentProfile.courseName || 'Sin asignar'}</p></div>
                       </div>
                     </div>

                     <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                       <h4 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Users size={18}/> Entorno Familiar</h4>
                       <div className="space-y-4">
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Tutor Legal / Parentesco</p><p className="font-black text-slate-800">{selectedStudentProfile.tutorNombre || 'No registrado'} ({selectedStudentProfile.tutorParentesco || 'N/A'})</p></div>
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono de Contacto</p><p className="font-black text-slate-800">{selectedStudentProfile.tutorTelefono || 'No registrado'}</p></div>
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Ocupación del Tutor</p><p className="font-black text-slate-800">{selectedStudentProfile.tutorOcupacion || 'No registrada'}</p></div>
                       </div>
                     </div>

                     <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm md:col-span-2">
                       <h4 className="text-sm font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2"><HeartPulse size={18}/> Perfil Médico</h4>
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Tipo Sangre</p><p className="font-black text-slate-800">{selectedStudentProfile.tipoSangre || 'N/A'}</p></div>
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Seguro ARS</p><p className="font-black text-slate-800">{selectedStudentProfile.seguroMedico || 'N/A'}</p></div>
                         <div className="md:col-span-2"><p className="text-[10px] font-bold text-slate-400 uppercase">Alergias</p><p className="font-black text-red-600">{selectedStudentProfile.alergias || 'Ninguna registrada'}</p></div>
                         <div className="md:col-span-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Condiciones Especiales</p><p className="font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedStudentProfile.condiciones || 'Ninguna registrada'}</p></div>
                       </div>
                     </div>

                     <div className="bg-slate-900 p-8 rounded-3xl shadow-xl md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-6">
                       <div>
                         <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><FileText size={18} className="text-amber-500"/> Expediente Digital</h4>
                         <p className="text-xs text-slate-400 font-medium mt-1">Descargue los documentos oficiales adjuntos en el registro.</p>
                       </div>
                       <div className="flex gap-3">
                         {selectedStudentProfile.actaNacimientoUrl ? (
                           <a href={selectedStudentProfile.actaNacimientoUrl} download target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all"><Download size={16}/> Acta Nac.</a>
                         ) : <span className="px-5 py-3 bg-white/10 text-white/40 font-black text-[10px] uppercase rounded-xl border border-white/10">Sin Acta</span>}
                         
                         {selectedStudentProfile.certificadoMedicoUrl ? (
                           <a href={selectedStudentProfile.certificadoMedicoUrl} download target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-500 transition-all"><Download size={16}/> C. Médico</a>
                         ) : <span className="px-5 py-3 bg-white/10 text-white/40 font-black text-[10px] uppercase rounded-xl border border-white/10">Sin C. Médico</span>}
                       </div>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* WIZARD: NUEVA ADMISIÓN DE ESTUDIANTE */}
      {showStudentWizard && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col">
             <div className="flex flex-col h-full overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-amber-50/50">
                 <h3 className="font-black text-3xl text-slate-900 tracking-tighter flex items-center gap-3">{editingStudent ? <Edit className="text-amber-500" /> : <UserPlus className="text-amber-500"/>} {editingStudent ? 'Actualizar Expediente' : 'Nueva Admisión'}</h3>
                 <button onClick={() => setShowStudentWizard(false)} className="p-4 bg-white hover:bg-red-500 hover:text-white rounded-[1.5rem] shadow-xl transition-all"><X size={26}/></button>
               </div>
               <div className="flex bg-slate-50 border-b border-slate-200 px-4 shrink-0">
                 <div className={`flex-1 p-4 font-black text-xs uppercase tracking-widest text-center border-b-4 ${studentStep >= 1 ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}>1. Identidad</div>
                 <div className={`flex-1 p-4 font-black text-xs uppercase tracking-widest text-center border-b-4 ${studentStep >= 2 ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}>2. Médicos</div>
                 <div className={`flex-1 p-4 font-black text-xs uppercase tracking-widest text-center border-b-4 ${studentStep >= 3 ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}>3. Familiar</div>
                 <div className={`flex-1 p-4 font-black text-xs uppercase tracking-widest text-center border-b-4 ${studentStep === 4 ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}>4. Asignación</div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                 {feedback && (<div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl flex items-center gap-3 font-bold text-sm"><AlertCircle size={18}/> {feedback.msg}</div>)}
                 <div className="space-y-8 pb-10">
                   {studentStep === 1 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex items-center p-6 bg-slate-50 rounded-[2rem] border border-slate-200 gap-6">
                          <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner overflow-hidden">{fotoPreview ? <img src={fotoPreview} className="w-full h-full object-cover" /> : <ImageIcon size={32}/>}</div>
                          <div className="w-full"><label className="text-[11px] font-black text-slate-500 uppercase ml-1 block mb-2">Foto 2x2</label><input type="file" name="fotoFile" onChange={handleStudentChange} className="w-full p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl text-slate-500" /></div>
                        </div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Nombres</label><input type="text" name="nombre" value={studentFormData.nombre} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Apellidos</label><input type="text" name="apellido" value={studentFormData.apellido} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-blue-600 uppercase">RNE</label><input type="text" name="rne" value={studentFormData.rne} onChange={handleStudentChange} className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl font-black uppercase text-blue-900" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Folio</label><input type="text" name="folio" value={studentFormData.folio} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Nacimiento</label><input type="date" name="fechaNacimiento" value={studentFormData.fechaNacimiento} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Género</label><select name="genero" value={studentFormData.genero} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
                        <div className="md:col-span-2"><label className="text-[11px] font-black text-slate-500 uppercase">Dirección</label><input type="text" name="direccion" value={studentFormData.direccion} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[2rem] border border-slate-200"><label className="text-[11px] font-black text-slate-500 uppercase block mb-2">Acta Nacimiento (PDF/IMG)</label><input type="file" name="actaFile" onChange={handleStudentChange} className="w-full p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl text-slate-500" /></div>
                     </div>
                   )}
                   {studentStep === 2 && (
                     <div className="space-y-6">
                        <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100"><label className="text-[11px] font-black text-red-600 uppercase block mb-2">Certificado Médico</label><input type="file" name="certificadoFile" onChange={handleStudentChange} className="w-full p-4 bg-white border-2 border-dashed border-red-200 rounded-2xl text-red-500" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><label className="text-[11px] font-black text-slate-500 uppercase">Alergias</label><textarea name="alergias" value={studentFormData.alergias} onChange={handleStudentChange} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                          <div><label className="text-[11px] font-black text-slate-500 uppercase">Condiciones</label><textarea name="condiciones" value={studentFormData.condiciones} onChange={handleStudentChange} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                          <div><label className="text-[11px] font-black text-slate-500 uppercase">Tipo Sangre</label><input type="text" name="tipoSangre" value={studentFormData.tipoSangre} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                          <div><label className="text-[11px] font-black text-slate-500 uppercase">Seguro Médico</label><input type="text" name="seguroMedico" value={studentFormData.seguroMedico} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        </div>
                     </div>
                   )}
                   {studentStep === 3 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><label className="text-[11px] font-black text-slate-500 uppercase">Tutor Legal</label><input type="text" name="tutorNombre" value={studentFormData.tutorNombre} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Parentesco</label><input type="text" name="tutorParentesco" value={studentFormData.tutorParentesco} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        <div><label className="text-[11px] font-black text-slate-500 uppercase">Teléfono</label><input type="text" name="tutorTelefono" value={studentFormData.tutorTelefono} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        <div className="md:col-span-2"><label className="text-[11px] font-black text-slate-500 uppercase">Ocupación</label><input type="text" name="tutorOcupacion" value={studentFormData.tutorOcupacion} onChange={handleStudentChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                     </div>
                   )}
                   {studentStep === 4 && (
                     <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-800">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">Curso Oficial</label>
                        <select name="courseId" value={studentFormData.courseId} onChange={handleStudentChange} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-lg cursor-pointer">
                          <option value="" className="text-slate-800">-- Seleccionar --</option>
                          {courses.map(c => <option key={c.id} value={c.id} className="text-slate-800">{c.name}</option>)}
                        </select>
                     </div>
                   )}
                 </div>
               </div>
               <div className="p-6 border-t border-slate-100 flex justify-between bg-white shrink-0">
                 <button onClick={() => setStudentStep(p => p - 1)} disabled={studentStep === 1} className="flex items-center gap-2 px-6 py-4 font-black text-slate-500 uppercase text-[11px] disabled:opacity-30"><ChevronLeft size={18}/> Atrás</button>
                 {studentStep === 4 ? (
                   <button onClick={handleStudentSubmit} disabled={isSaving || !studentFormData.courseId} className="flex items-center gap-3 px-10 py-4 bg-amber-500 text-white font-black rounded-[2rem] disabled:opacity-50 uppercase text-[10px] tracking-widest">{isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Guardar</button>
                 ) : (
                   <button onClick={() => setStudentStep(p => p + 1)} className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white font-black rounded-[2rem] uppercase text-[10px] tracking-widest">Siguiente <ChevronRight size={20}/></button>
                 )}
               </div>
             </div>
           </div>
         </div>
      )}

    </div>
  );
}