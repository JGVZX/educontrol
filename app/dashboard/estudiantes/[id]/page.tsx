'use client';

/**
 * @file page.tsx
 * @module ExpedienteEstudiantil
 * @description Vista maestra para la ficha técnica del estudiante. Implementa
 * hidratación de datos asíncrona, control de acceso por roles (RBAC) en pestañas,
 * y delegación de estado para la actualización (mutación) del expediente civil.
 * @author Jose Junior Guzmán Veloz
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, User, BookOpen, Activity, ShieldAlert,
  Printer, Edit, Phone, Mail, Loader2,
  TrendingUp, Award, Heart, ShieldCheck, MessageSquarePlus,
  BadgeCheck, Clock, Calendar
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

// ACCESO A DATOS (DAL)
import { getStudentFullProfile, saveStudent, getCourses } from './actions'; 

// COMPONENTES DE INTERFAZ
import AddStudentModal, { StudentForm } from '@/components/dashboard/estudiantes/AddStudentModal';

// ============================================================================
// COMPONENTE PRINCIPAL (ENTRY POINT)
// ============================================================================

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { role } = useUser();
  const { id } = use(params); 

  // ESTADOS DE LA VISTA
  const [activeTab, setActiveTab] = useState('general');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ESTADOS DE MUTACIÓN (EDICIÓN)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [coursesList, setCoursesList] = useState<any[]>([]);

  /**
   * Hidratación de la vista. Se invoca al montar y tras una actualización exitosa.
   * Utiliza Promise.all para optimizar la carga concurrente.
   */
  const loadData = async () => {
      setLoading(true);
      try {
        const [data, courses] = await Promise.all([
            getStudentFullProfile(id),
            getCourses()
        ]);
        if (data) setStudent(data);
        if (courses) setCoursesList(courses);
      } catch (error) {
        console.error("[Capa de Presentación] Error al cargar expediente:", error);
      } finally {
        setLoading(false);
      }
  };

  // Ciclo de vida del componente
  useEffect(() => {
    loadData();
  }, [id]);

  /**
   * Manejador de la mutación de datos (Upsert delegado).
   * @param {StudentForm} formData Payload proveniente del modal de edición.
   */
  const handleEditSave = async (formData: StudentForm) => {
    // Inyección del ID para forzar una operación UPDATE en el servidor
    const payload = { ...formData, id: student.id };
    const result = await saveStudent(payload, true); 
    
    if (result.success) {
        setIsEditModalOpen(false);
        await loadData(); // Rehidratación reactiva
        alert("✅ Expediente actualizado correctamente en la base de datos.");
    }
    return result; 
  };

  // MAPA DE PERMISOS (RBAC) PARA PESTAÑAS
  const tabs = [
    { id: 'general', label: 'Expediente Civil', icon: User, roles: ['DIRECTOR', 'SECRETARIA', 'DOCENTE', 'ADMIN_SISTEMA'] },
    { id: 'academico', label: 'Rendimiento', icon: TrendingUp, roles: ['DIRECTOR', 'DOCENTE', 'SECRETARIA', 'ADMIN_SISTEMA'] },
    { id: 'conducta', label: 'Observaciones', icon: ShieldCheck, roles: ['DIRECTOR', 'SECRETARIA', 'ADMIN_SISTEMA'] },
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes(role?.toUpperCase() || ''));

  // ESTADOS DE ESPERA Y ERROR
  if (loading) return <LoadingState />;
  if (!student) return <NotFoundState />;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
      
      {/* 1. BARRA DE HERRAMIENTAS SUPERIOR */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="group flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-black text-[10px] uppercase tracking-[0.2em]"
        >
          <div className="p-2 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
            <ArrowLeft size={16}/>
          </div>
          Regresar al Directorio
        </button>

        <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              <Printer size={16}/> Certificación
            </button>
            
            {/* Control de Acceso: Solo roles autorizados pueden modificar */}
            {['DIRECTOR', 'ADMIN_SISTEMA'].includes(role || '') && (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95"
              >
                <Edit size={16}/> Editar Ficha
              </button>
            )}
        </div>
      </div>

      {/* 2. ENCABEZADO ELITE (TARJETA DE IDENTIDAD) */}
      <StudentHeader student={student} />

      {/* 3. NAVEGACIÓN INTERNA (TABS) */}
      <div className="flex gap-10 border-b border-slate-100 px-6 overflow-x-auto custom-scrollbar">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 shrink-0 ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* 4. MOTOR DE RESOLUCIÓN DE VISTAS (TAB CONTENT) */}
      <div className="min-h-[400px]">
        {activeTab === 'general' && <GeneralTab student={student} />}
        {activeTab === 'academico' && <AcademicTab student={student} />}
        {activeTab === 'conducta' && <BehaviorTab student={student} />}
      </div>

      {/* 5. MODAL DE MUTACIÓN DE DATOS */}
      <AddStudentModal 
        open={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleEditSave}
        initialData={student}
        courses={coursesList}
      />

    </div>
  );
}

// ============================================================================
// SUB-COMPONENTES ESTRUCTURALES (Patrón de Composición)
// ============================================================================

/**
 * Renderiza el banner superior con la información vital del estudiante.
 */
function StudentHeader({ student }: { student: any }) {
  const isExcellent = (student.promedio || 0) >= 85;
  const isFailing = (student.promedio || 0) < 70;
  const scoreColor = isExcellent ? 'text-emerald-400' : isFailing ? 'text-rose-400' : 'text-blue-400';

  return (
    <div className="bg-slate-900 rounded-[3.5rem] p-10 lg:p-14 text-white relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center lg:items-end">
        <div className="w-48 h-48 rounded-[3.5rem] bg-white p-3 shadow-2xl shrink-0 transition-transform hover:scale-105 duration-500">
            <div className="w-full h-full rounded-[2.8rem] bg-slate-100 flex items-center justify-center text-6xl font-black text-slate-800 border-4 border-white uppercase shadow-inner">
              {student.nombre?.charAt(0) || '?'}{student.apellido?.charAt(0) || '?'}
            </div>
        </div>
        
        <div className="flex-1 text-center lg:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
              <BadgeCheck size={14}/> {student.estatus || 'REGISTRADO'}
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tighter leading-none">{student.nombre} <br/> {student.apellido}</h1>
          
          <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-4">
              <span className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <Award size={18} className="text-blue-500"/> ID: {student.matricula}
              </span>
              <span className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <BookOpen size={18} className="text-blue-500"/> {student.course?.name || 'Sin Curso Asignado'}
              </span>
              <span className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <Clock size={18} className="text-blue-500"/> Asistencia: {student.stats?.attendancePct || 0}%
              </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 text-center min-w-[200px] shadow-inner">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Promedio Gral.</p>
            <p className={`text-7xl font-black tracking-tighter ${scoreColor}`}>
              {student.promedio?.toFixed(1) || '0.0'}
            </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Pestaña: Expediente Civil (Datos Personales, Salud y Tutoría)
 */
function GeneralTab({ student }: { student: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 mt-8">
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
        <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3">
          <User size={18}/> Datos Demográficos del Alumno
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
          {[
            { label: "Nacionalidad", val: student.nacionalidad || 'No especificada' },
            { label: "Fecha de Nacimiento", val: student.fechaNacimiento || 'Revisar Acta' },
            { label: "Género Biológico", val: student.genero === 'M' ? 'Masculino' : student.genero === 'F' ? 'Femenino' : 'No Registrado' },
            { label: "Dirección de Residencia", val: student.direccion || 'No registrada en el padrón', full: true }
          ].map((item, i) => (
            <div key={i} className={`space-y-1 ${item.full ? 'md:col-span-2' : ''}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-rose-50 p-10 rounded-[3rem] border border-rose-100 space-y-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] flex items-center gap-2">
            <Heart size={16}/> Protocolo de Salud
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black text-rose-400 uppercase mb-1">Grupo Sanguíneo</p>
              <p className="text-2xl font-black text-rose-700">{student.tipoSangre || 'Desconocido'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-rose-400 uppercase mb-1">Cuadro de Alergias</p>
              <p className="font-bold text-rose-900 text-sm leading-tight">{student.alergias || 'Ninguna registrada en sistema'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <Phone size={16} className="text-blue-500"/> Red de Apoyo (Tutor)
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{student.tutorParentesco || 'Tutor Asignado'}</p>
              <p className="font-black text-slate-800 text-lg leading-tight">{student.tutorNombre || 'Sin Registrar'}</p>
            </div>
            <div className="flex flex-col gap-3 pt-2 text-blue-600 font-bold text-sm">
              <span className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl">
                <Phone size={16} className="text-blue-400"/> {student.tutorTelefono || 'Sin contacto'}
              </span>
              <span className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl overflow-hidden text-ellipsis">
                <Mail size={16} className="text-blue-400 shrink-0"/> {student.tutorCorreo || 'Sin correo electrónico'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pestaña: Rendimiento Académico (Histograma y Calificaciones Mensuales)
 */
function AcademicTab({ student }: { student: any }) {
  const periodHistory = student?.stats?.periodHistory || [];
  const academicHistory = student?.academicHistory || [];

  // Filtro inteligente por Modalidad Basado en el Backend
  const materiasGenerales = academicHistory.filter((m: any) => m.tipo !== 'TECNICA');
  const materiasTecnicas = academicHistory.filter((m: any) => m.tipo === 'TECNICA');

  // Meses del Calendario Escolar
  const meses = [
    { id: 'ago', label: 'Ago' }, { id: 'sep', label: 'Sep' }, { id: 'oct', label: 'Oct' },
    { id: 'nov', label: 'Nov' }, { id: 'dic', label: 'Dic' }, { id: 'ene', label: 'Ene' },
    { id: 'feb', label: 'Feb' }, { id: 'mar', label: 'Mar' }, { id: 'abr', label: 'Abr' },
    { id: 'may', label: 'May' }
  ];

  // Componente interno para re-usar las tablas de calificaciones
  const renderGradeTable = (title: string, subjects: any[], colorBase: string) => (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col mb-8 last:mb-0">
      <div className={`px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3`}>
        <BookOpen size={18} className={colorBase} />
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{title}</h4>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/80 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">
              <th className="px-6 py-5 sticky left-0 bg-slate-50/90 backdrop-blur-sm z-10 w-1/4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Asignatura</th>
              {meses.map(m => (
                <th key={m.id} className="px-2 py-5 text-center">{m.label}</th>
              ))}
              <th className={`px-6 py-5 text-right ${colorBase}`}>Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {subjects.length > 0 ? subjects.map((mat: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50/50 transition-colors z-10 truncate max-w-[250px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" title={mat.subject}>
                  {mat.subject}
                </td>
                {meses.map(m => {
                  const nota = mat[m.id];
                  const isLow = nota !== null && nota !== undefined && nota !== '-' && Number(nota) < 70;
                  return (
                    <td key={m.id} className={`px-2 py-4 text-center font-medium ${isLow ? 'text-rose-500 font-bold' : 'text-slate-500'} group-hover:text-slate-800 transition-colors`}>
                      {nota !== null && nota !== undefined ? nota : '-'}
                    </td>
                  );
                })}
                <td className={`px-6 py-4 text-right font-black ${mat.final >= 70 ? colorBase : 'text-rose-500'}`}>
                  {mat.final !== null && mat.final !== undefined ? mat.final : '-'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <BookOpen size={16} /> No hay asignaturas registradas en esta área
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 animate-in fade-in mt-8">
      {/* 1. Módulo Analítico Visual */}
      <div className="bg-white p-8 lg:p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-10">Rendimiento Histórico Acumulado</h3>
        <div className="flex items-end justify-between h-40 gap-2 px-2 max-w-4xl mx-auto">
            {periodHistory.length > 0 ? (
              periodHistory.map((item: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full max-w-[40px] relative h-full flex items-end">
                      <div 
                        style={{ height: `${item.v}%` }}
                        className={`w-full ${item.v >= 70 ? 'bg-blue-600' : 'bg-rose-500'} rounded-xl shadow-md transition-all group-hover:scale-105 group-hover:shadow-lg`} 
                      >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {item.v}
                          </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{item.p}</span>
                </div>
              ))
            ) : (
              <div className="w-full text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest pt-10">
                Data insuficiente para generar proyección analítica
              </div>
            )}
        </div>
      </div>

      {/* 2. Sábanas de Calificaciones Mensuales divididas por Área */}
      <div className="space-y-8">
        {/* Tabla de Asignaturas Académicas (Generales) */}
        {renderGradeTable('Estructura Curricular General', materiasGenerales, 'text-blue-600')}

        {/* Tabla de Módulos Técnicos Profesionales */}
        {materiasTecnicas.length > 0 && 
          renderGradeTable('Módulos Formativos (Área Técnica)', materiasTecnicas, 'text-emerald-600')
        }
      </div>
    </div>
  );
}

/**
 * Pestaña: Observaciones (Bitácora de Conducta)
 */
function BehaviorTab({ student }: { student: any }) {
  const observaciones = student?.observaciones || [];

  return (
    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm animate-in fade-in space-y-10 mt-8">
        <div className="flex justify-between items-center border-b border-slate-100 pb-6">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
            Bitácora de Incidencias y Logros
          </h3>
          <button className="flex items-center gap-2 bg-slate-50 text-blue-600 border border-slate-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-transparent transition-all shadow-sm">
            <MessageSquarePlus size={16}/> Insertar Registro
          </button>
        </div>

        <div className="space-y-8">
          {observaciones.length > 0 ? (
            observaciones.map((obs: any) => (
              <div key={obs.id} className="flex gap-8 group">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm shrink-0">
                        <Activity size={20}/>
                    </div>
                    <div className="w-0.5 flex-1 bg-slate-100 my-2 group-last:hidden"></div>
                  </div>
                  
                  <div className="flex-1 pb-10">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-blue-100">
                          {obs.tipo || 'General'}
                        </span>
                        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={12}/> {new Date(obs.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-relaxed max-w-4xl">{obs.contenido}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14}/> Firmado por: {obs.author?.nombre || 'Administración Central'}
                    </p>
                  </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50">
              <ShieldAlert size={48} className="mx-auto mb-4 text-slate-300"/>
              <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">
                Expediente disciplinario limpio. No hay incidencias registradas.
              </p>
            </div>
          )}
        </div>
    </div>
  );
}

// ============================================================================
// COMPONENTES DE FALLBACK (UI States)
// ============================================================================

function LoadingState() {
  return (
    <div className="flex flex-col h-[80vh] items-center justify-center text-slate-400 animate-pulse">
      <Loader2 className="animate-spin mb-4 text-blue-500" size={48}/>
      <p className="font-black uppercase text-[10px] tracking-[0.3em]">Extrayendo Datos del Servidor Central...</p>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col h-[80vh] items-center justify-center text-center p-10 animate-in fade-in">
      <ShieldAlert size={64} className="text-rose-500 mb-6"/>
      <h2 className="text-3xl font-black text-slate-800 mb-2">Expediente Inaccesible</h2>
      <p className="font-bold text-slate-500 max-w-md mx-auto mb-8">
        El perfil estudiantil que intenta consultar ha sido purgado del sistema o la firma de identidad no es válida.
      </p>
      <button 
        onClick={() => window.history.back()}
        className="px-8 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-colors"
      >
        Volver al Padrón
      </button>
    </div>
  );
}