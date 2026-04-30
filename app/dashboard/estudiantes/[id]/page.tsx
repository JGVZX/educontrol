'use client';

/**
 * @file page.tsx
 * @module ExpedienteEstudiantil_Analitico
 * @description Vista maestra para la ficha técnica del estudiante.
 * Diseño Elite enfocado puramente en lectura, análisis estadístico real y visualización de datos.
 * @author Jose Junior Guzmán Veloz
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, User, BookOpen, Activity, ShieldAlert,
  Loader2, TrendingUp, Award, Heart, ShieldCheck, 
  MessageSquarePlus, BadgeCheck, Clock, Calendar, 
  Fingerprint, Briefcase, FileText, TrendingDown, 
  Minus, Star, Target, AlertTriangle
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { getStudentFullProfile } from './actions'; 

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { role } = useUser();
  const { id } = use(params); 

  const [activeTab, setActiveTab] = useState('general');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
      setLoading(true);
      try {
        const data = await getStudentFullProfile(id);
        if (data) setStudent(data);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [id]);

  const tabs = [
    { id: 'general', label: 'Expediente Civil', icon: User, roles: ['DIRECTOR', 'SECRETARIA', 'DOCENTE', 'ADMIN_SISTEMA'] },
    { id: 'academico', label: 'Análisis de Rendimiento', icon: TrendingUp, roles: ['DIRECTOR', 'DOCENTE', 'SECRETARIA', 'ADMIN_SISTEMA'] },
    { id: 'conducta', label: 'Bitácora de Observaciones', icon: ShieldCheck, roles: ['DIRECTOR', 'SECRETARIA', 'ADMIN_SISTEMA'] },
  ];
  const visibleTabs = tabs.filter(tab => tab.roles.includes(role?.toUpperCase() || ''));

  if (loading) return <LoadingState />;
  if (!student) return <NotFoundState />;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0 relative">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="group flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-black text-[10px] uppercase tracking-[0.2em]">
          <div className="p-2 rounded-full bg-white border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"><ArrowLeft size={16}/></div>
          Regresar al Directorio
        </button>
      </div>

      <StudentHeader student={student} />

      <div className="flex gap-10 border-b border-slate-100 px-6 overflow-x-auto custom-scrollbar">
        {visibleTabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 pb-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 shrink-0 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'general' && <GeneralTab student={student} />}
        {activeTab === 'academico' && <AcademicTab student={student} />}
        {activeTab === 'conducta' && <BehaviorTab student={student} />}
      </div>
    </div>
  );
}

// ============================================================================
// HEADER Y CIVIL
// ============================================================================
function StudentHeader({ student }: { student: any }) {
  const isExcellent = (student.promedio || 0) >= 85;
  const isFailing = (student.promedio || 0) < 70;
  const scoreColor = isExcellent ? 'text-emerald-400' : isFailing ? 'text-rose-400' : 'text-blue-400';

  return (
    <div className="bg-slate-900 rounded-[3.5rem] p-10 lg:p-14 text-white relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>
      <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center lg:items-end">
        
        <div className="w-48 h-48 rounded-[3.5rem] bg-white p-3 shadow-2xl shrink-0 transition-transform hover:scale-105 duration-500 overflow-hidden group relative">
          {student.fotoUrl ? (
            <img src={student.fotoUrl} alt={student.nombre} className="w-full h-full rounded-[2.8rem] object-cover transition-transform duration-700 group-hover:scale-110"/>
          ) : (
            <div className="w-full h-full rounded-[2.8rem] bg-slate-100 flex items-center justify-center text-6xl font-black text-slate-800 border-4 border-white uppercase shadow-inner">
              {student.nombre?.charAt(0)}{student.apellido?.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 rounded-[3rem] ring-1 ring-inset ring-black/10 pointer-events-none"></div>
        </div>
        
        <div className="flex-1 text-center lg:text-left space-y-4">
          <div className="flex justify-center lg:justify-start gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10"><BadgeCheck size={14}/> {student.estatus || 'ACTIVO'}</span>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest">FOLIO: {student.folio || 'N/A'}</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tighter leading-none">{student.nombre} <br className="hidden lg:block"/> {student.apellido}</h1>
          <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-4">
              <span className="flex items-center gap-2 text-slate-400 font-bold text-sm"><Fingerprint size={18} className="text-blue-500"/> RNE: {student.rne || 'Sin Asignar'}</span>
              <span className="flex items-center gap-2 text-slate-400 font-bold text-sm"><BookOpen size={18} className="text-blue-500"/> {student.course?.name || 'Sin Curso'}</span>
              <span className="flex items-center gap-2 text-slate-400 font-bold text-sm"><Clock size={18} className="text-blue-500"/> Asistencia: {student.stats?.attendancePct || 0}%</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 text-center min-w-[200px] shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Promedio Gral.</p>
            <p className={`text-7xl font-black tracking-tighter ${scoreColor}`}>{student.promedio || '0'}</p>
        </div>
      </div>
    </div>
  );
}

function GeneralTab({ student }: { student: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 mt-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
          <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3"><User size={18}/> Datos Demográficos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
            <DataField label="Nacionalidad" val={student.nacionalidad} />
            <DataField label="Fecha de Nacimiento" val={student.fechaNacimiento} />
            <DataField label="Género Biológico" val={student.genero === 'M' ? 'Masculino' : student.genero === 'F' ? 'Femenino' : 'No Registrado'} />
            <DataField label="Seguro Médico / ARS" val={student.seguroMedico} />
            <div className="md:col-span-2"><div className="space-y-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección de Residencia</p><p className="font-bold text-slate-800">{student.direccion || 'No especificado'}</p></div></div>
          </div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
          <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.3em] flex items-center gap-3"><Briefcase size={18}/> Red de Apoyo (Tutor)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
            <DataField label="Nombre del Tutor" val={student.tutorNombre} />
            <DataField label="Parentesco" val={student.tutorParentesco} />
            <DataField label="Ocupación" val={student.tutorOcupacion} />
            <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono / Contacto</p><p className="font-black text-blue-600 bg-blue-50 py-1.5 px-3 rounded-lg inline-block border border-blue-100">{student.tutorTelefono || 'No registrado'}</p></div>
          </div>
        </div>
      </div>
      <div className="space-y-8">
        <div className="bg-gradient-to-b from-rose-50 to-white p-10 rounded-[3rem] border border-rose-100 space-y-8 shadow-sm">
          <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] flex items-center gap-2"><Heart size={16}/> Protocolo de Salud</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-5 bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500 font-black text-xl">{student.tipoSangre || '?'}</div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Grupo Sanguíneo</p><p className="font-bold text-rose-900 text-sm">Vital para emergencias</p></div>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-rose-100 shadow-sm"><p className="text-[9px] font-black text-rose-400 uppercase mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Cuadro de Alergias</p><p className="font-bold text-slate-700 text-sm leading-relaxed">{student.alergias || 'Ninguna alergia registrada.'}</p></div>
            <div className="p-5 bg-white rounded-2xl border border-rose-100 shadow-sm"><p className="text-[9px] font-black text-rose-400 uppercase mb-2">Condiciones Especiales</p><p className="font-bold text-slate-700 text-sm leading-relaxed">{student.condiciones || 'Ninguna reportada.'}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataField({ label, val }: { label: string, val: string }) {
  return (<div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p><p className="font-bold text-slate-800 text-sm">{val || 'No especificado'}</p></div>);
}

// ============================================================================
// ACADÉMICO: DASHBOARD REAL
// ============================================================================
function AcademicTab({ student }: { student: any }) {
  const periodHistory = student?.stats?.periodHistory || [];
  const academicHistory = student?.academicHistory || []; 

  const materiasGenerales = academicHistory.filter((m: any) => m.tipo !== 'TECNICA');
  const materiasTecnicas = academicHistory.filter((m: any) => m.tipo === 'TECNICA');

  const meses = [
    { id: 'ago', label: 'Ago' }, { id: 'sep', label: 'Sep' }, { id: 'oct', label: 'Oct' },
    { id: 'nov', label: 'Nov' }, { id: 'dic', label: 'Dic' }, { id: 'ene', label: 'Ene' },
    { id: 'feb', label: 'Feb' }, { id: 'mar', label: 'Mar' }, { id: 'abr', label: 'Abr' },
    { id: 'may', label: 'May' }
  ];

  // =========================================================================
  // MOTOR ANALÍTICO: CÁLCULOS EXACTOS
  // =========================================================================
  
  // 1. Materias que sí tienen una nota final numérica
  const materiasEvaluadas = academicHistory.filter((m: any) => typeof m.final === 'number' && m.final > 0);
  
  // 2. Conteo de riesgo exacto
  const enRiesgoCount = materiasEvaluadas.filter((m: any) => m.final < 70).length;
  
  // 3. Promedio general exacto del backend
  const promedioReal = student.promedio || 0;
  
  // 4. Mejor Asignatura (Materia Estrella)
  const materiaEstrella = materiasEvaluadas.length > 0 
    ? materiasEvaluadas.reduce((prev: any, curr: any) => (curr.final > prev.final ? curr : prev), materiasEvaluadas[0]) 
    : null;

  // 5. Análisis de Tendencia Estricto (Debe tener al menos 2 periodos para comparar)
  const activePeriods = periodHistory.filter((item: any) => typeof item.v === 'number' && item.v > 0);
  const bestPeriod = activePeriods.length > 0 ? activePeriods.reduce((prev:any, curr:any) => (curr.v > prev.v ? curr : prev), activePeriods[0]) : { p: '-', v: 0 };
  
  let trend = 0;
  let hasTrend = false;
  if (activePeriods.length >= 2) {
    const last = activePeriods[activePeriods.length - 1];
    const prev = activePeriods[activePeriods.length - 2];
    trend = last.v - prev.v;
    hasTrend = true;
  }
  
  const TrendIcon = hasTrend ? (trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus) : Minus;
  const trendColor = hasTrend 
    ? (trend > 0 ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : trend < 0 ? 'text-rose-500 bg-rose-50 border-rose-100' : 'text-slate-500 bg-slate-50 border-slate-100')
    : 'text-slate-400 bg-slate-50 border-slate-100';

  const renderGradeTable = (title: string, subjects: any[], colorBase: string, bgHead: string) => (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col mb-8 last:mb-0">
      <div className={`px-8 py-5 border-b border-slate-100 ${bgHead} flex items-center gap-3`}>
        <FileText size={18} className={colorBase} />
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{title}</h4>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
              <th className="px-8 py-5 sticky left-0 bg-slate-50 z-10 w-1/4 shadow-[1px_0_0_0_#f1f5f9]">Asignatura</th>
              {meses.map(m => (<th key={m.id} className="px-2 py-5 text-center">{m.label}</th>))}
              <th className={`px-8 py-5 text-right ${colorBase}`}>Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {subjects.length > 0 ? subjects.map((mat: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-4 font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50/50 transition-colors z-10 truncate shadow-[1px_0_0_0_#f1f5f9]">
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
                <td className={`px-8 py-4 text-right font-black ${typeof mat.final === 'number' && mat.final >= 70 ? colorBase : 'text-rose-500'}`}>
                  {mat.final !== null && mat.final !== undefined ? mat.final : '-'}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={12} className="px-8 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">No hay asignaturas en esta área</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 animate-in fade-in mt-8">
      
      {/* 1. KPIs ANALÍTICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Target size={20}/></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Global</span>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800">{promedioReal > 0 ? promedioReal : '-'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Promedio General</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trendColor}`}><TrendIcon size={20}/></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Progreso</span>
          </div>
          <div>
            <p className={`text-3xl font-black ${hasTrend ? (trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-rose-500' : 'text-slate-800') : 'text-slate-300'}`}>
              {hasTrend ? `${trend > 0 ? '+' : ''}${trend}` : 'N/A'}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Pts vs Período Anterior</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><Award size={20}/></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Destacada</span>
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 truncate" title={materiaEstrella?.subject || 'N/A'}>{materiaEstrella ? materiaEstrella.subject : 'N/A'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Mejor Calificación: <span className="text-amber-500 font-black">{materiaEstrella?.final || '-'}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enRiesgoCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}><AlertTriangle size={20}/></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Riesgo</span>
          </div>
          <div>
            <p className={`text-3xl font-black ${enRiesgoCount > 0 ? 'text-rose-500' : 'text-slate-800'}`}>{enRiesgoCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Asignaturas bajo 70</p>
          </div>
        </div>

      </div>

      {/* 2. GRÁFICO HISTÓRICO VISUAL (Real) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] shadow-xl text-white p-10 border border-slate-700/50">
        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-12 opacity-80 text-center">Evolución de Rendimiento por Períodos Evaluados</h3>
        <div className="flex items-end justify-center h-48 gap-8 px-4 max-w-3xl mx-auto">
            {periodHistory.length > 0 ? (
              periodHistory.map((item: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-4 group relative w-16">
                    <div className="w-full relative h-full flex items-end">
                      <div 
                        style={{ height: `${item.v > 0 ? item.v : 5}%` }} 
                        className={`w-full rounded-t-xl transition-all duration-700 ${
                          item.v >= 90 ? 'bg-emerald-500 group-hover:bg-emerald-400' :
                          item.v >= 70 ? 'bg-blue-500 group-hover:bg-blue-400' :
                          item.v > 0 ? 'bg-rose-500 group-hover:bg-rose-400' : 'bg-white/5'
                        } shadow-[0_0_15px_rgba(0,0,0,0.2)]`}
                      >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                            {item.v > 0 ? item.v : '-'}
                          </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.p}</span>
                </div>
              ))
            ) : (<div className="w-full text-center text-slate-500 text-xs uppercase font-bold tracking-widest pt-10">Data insuficiente</div>)}
        </div>
      </div>

      {/* 3. SÁBANAS DE NOTAS */}
      <div className="space-y-8">
        {renderGradeTable('Estructura Curricular General', materiasGenerales, 'text-blue-600', 'bg-blue-50/30')}
        {materiasTecnicas.length > 0 && renderGradeTable('Módulos Formativos (Área Técnica)', materiasTecnicas, 'text-emerald-600', 'bg-emerald-50/30')}
      </div>
    </div>
  );
}

function BehaviorTab({ student }: { student: any }) {
  const observaciones = student?.observaciones || [];
  return (
    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm animate-in fade-in space-y-10 mt-8">
        <div className="flex justify-between items-center border-b border-slate-100 pb-6">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Bitácora de Incidencias</h3>
        </div>
        <div className="space-y-8">
          {observaciones.length > 0 ? (
            observaciones.map((obs: any) => (
              <div key={obs.id} className="flex gap-8 group">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm shrink-0"><Activity size={20}/></div>
                    <div className="w-0.5 flex-1 bg-slate-100 my-2 group-last:hidden"></div>
                  </div>
                  <div className="flex-1 pb-10">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-blue-100">{obs.tipo || 'General'}</span>
                        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12}/> {obs.fecha}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-relaxed max-w-4xl">{obs.comentario}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Firmado por: {obs.autor}</p>
                  </div>
              </div>
            ))
          ) : (<div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50"><ShieldAlert size={48} className="mx-auto mb-4 text-slate-300"/><p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Expediente limpio.</p></div>)}
        </div>
    </div>
  );
}

function LoadingState() { return (<div className="flex flex-col h-[80vh] items-center justify-center text-slate-400"><Loader2 className="animate-spin mb-4 text-blue-500" size={48}/><p className="font-black uppercase text-[10px] tracking-[0.3em]">Cargando Análisis Académico...</p></div>); }
function NotFoundState() { return (<div className="flex flex-col h-[80vh] items-center justify-center text-center p-10"><ShieldAlert size={64} className="text-rose-500 mb-6"/><h2 className="text-3xl font-black text-slate-800 mb-2">Expediente Inaccesible</h2><p className="font-bold text-slate-500 max-w-md mx-auto mb-8">RNE o Folio no encontrado.</p><button onClick={() => window.history.back()} className="px-8 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl">Volver al Directorio</button></div>); }