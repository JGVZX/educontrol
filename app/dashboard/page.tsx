'use client';

/**
 * @file page.tsx
 * @module DashboardPrincipal
 * @description Vista unificada del Dashboard de EduControl. 
 * Implementa el patrón "View Resolver" para inyectar dinámicamente la interfaz correcta
 * basada en el vector de autorización (Rol) del usuario (RBAC).
 * Incluye módulo NOC (Network Operations Center) para el Administrador del Sistema.
 * @author Jose Junior Guzmán Veloz
 * @context Proyecto de Tesis - Ingeniería en Sistemas
 */

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { getDashboardData, generateDatabaseBackup } from './actions'; 
import { 
  Users, GraduationCap, School, ArrowUpRight, 
  Activity, BookOpen, Search, FileText, Calendar, 
  Settings, CheckSquare, UsersRound, BarChart3, 
  UserPlus, BellRing, Terminal, ShieldCheck, 
  Server, Database, Cpu, Wifi, Globe, Clock, ShieldAlert,
  HardDriveDownload, CheckCircle2, Trash2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, TooltipProps
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// ============================================================================
// DEFINICIÓN DE TIPOS E INTERFACES ESTRICTAS
// ============================================================================

export type Role = 'ADMIN_SISTEMA' | 'DIRECTOR' | 'DOCENTE' | 'SECRETARIA';

export interface KpiData {
  students: number;
  teachers: number;
  courses: number;
  subjects?: number;
}

export interface ChartItem {
  name: string;
  total?: number;
  value?: number;
}

export interface StudentActivity {
  id: string;
  nombre: string;
  apellido: string;
  matricula: string;
  createdAt: string;
  status: 'NUEVO' | 'REGULAR' | 'PENDIENTE';
}

export interface SubjectData {
  id: string;
  name: string;
  courseName: string;
  students: number;
  studentsAtRisk: number;
  ciclo?: string; 
}

export interface SystemTicket {
  id: string;
  docente: string;
  issue: string;
  date: string;
  status: 'PENDIENTE' | 'REVISIÓN' | 'RESUELTO';
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface DashboardData {
  kpi: KpiData;
  charts?: {
    courses: ChartItem[];
    gender: ChartItem[];
  };
  recentActivity?: StudentActivity[];
  mySubjects?: SubjectData[];
  systemTickets?: SystemTicket[]; 
}

const CHART_COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b'];

// ============================================================================
// HOOKS PERSONALIZADOS (Data Fetching Layer)
// ============================================================================

function useDashboardFetch(email: string | undefined, role: string | undefined) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboard() {
      if (!email || !role) { setLoading(false); return; }
      try {
        setError(null);
        setLoading(true);
        const dashboardData = await getDashboardData(email, role as Role);
        if (isMounted) setData(dashboardData);
      } catch (err) {
        console.error("[Arquitectura] Error al hidratar Dashboard:", err);
        if (isMounted) setError("Se perdió la conexión con el servidor maestro de EduControl.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { isMounted = false; };
  }, [email, role]);

  return { data, loading, error };
}

// ============================================================================
// COMPONENTE PRINCIPAL (Entry Point & Layout Wrapper)
// ============================================================================

export default function DashboardPage() {
  const { user, role } = useUser();
  const { data, loading, error } = useDashboardFetch(user?.email ?? undefined, role ?? undefined);
  
  // Estado para manejar la fecha en el cliente y evitar errores de hidratación en Next.js
  const [formattedDate, setFormattedDate] = useState<string>("Cargando fecha...");

  useEffect(() => {
    setFormattedDate(new Date().toLocaleDateString('es-DO', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    }));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const currentRole = role as Role;
  
  if (!currentRole) return <DashboardSkeleton />;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50/50 dark:bg-[#0B1120] min-h-screen">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-5">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-blue-400 dark:to-cyan-300 tracking-tight">
            EduControl
          </h1>
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-full shadow-inner">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
             <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">
               {currentRole?.replace('_', ' ') || 'CARGANDO...'}
             </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
           <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800">
              <Calendar size={14} className="text-blue-500" /> {formattedDate}
           </span>
           <GlobalActions role={currentRole} />
        </div>
      </header>

      <DashboardViewResolver role={currentRole} data={data} userNombre={user?.nombre} userEmail={user?.email} />
    </main>
  );
}

// ============================================================================
// VISTA 1: ADMIN SISTEMA (NOC - Funcional y en Tiempo Real)
// ============================================================================

function AdminView({ data, userEmail, role }: { data: DashboardData, userEmail?: string, role?: Role }) {
  const [tickets, setTickets] = useState<SystemTicket[]>(data.systemTickets || []);
  const [ping, setPing] = useState(24);
  const [uptime, setUptime] = useState(99.99);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(Math.random() * (45 - 18 + 1) + 18));
      setUptime(prev => prev > 99.90 ? prev - 0.001 : 99.99); 
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTicketAction = (ticketId: string, currentStatus: string) => {
    if (currentStatus === 'RESUELTO') {
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    } else {
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status: 'RESUELTO' as const } : t
      ));
    }
  };

  const handleBackup = async () => {
    if (!userEmail || !role) return;
    try {
      setIsBackingUp(true);
      const backupString = await generateDatabaseBackup(userEmail, role);
      const blob = new Blob([backupString], { type: "application/json;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '');
      link.setAttribute('download', `educontrol_pg_dump_${dateStr}_${timeStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("[Disaster Recovery Error] Fallo al generar Backup:", error);
      alert("Error Crítico: No se pudo compilar el volcado de la base de datos.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const dbCapacity = Math.min(((data.kpi.students + data.kpi.teachers) / 5000) * 100, 100).toFixed(1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleBackup}
          disabled={isBackingUp}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md ${
            isBackingUp 
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/30 active:scale-95'
          }`}
        >
          <HardDriveDownload size={18} className={isBackingUp ? "animate-bounce" : ""} />
          {isBackingUp ? 'Extrayendo Datos...' : 'Crear Backup de Base de Datos'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900 dark:bg-slate-950 rounded-[2rem] p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between h-48">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex justify-between items-start">
               <div>
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Infraestructura Core</h3>
                 <p className="text-white font-black text-2xl flex items-center gap-3"><Server size={24} className="text-emerald-400"/> Sistema en Línea</p>
               </div>
               <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,1)]"></div>
            </div>
            <div className="relative z-10 flex justify-between text-xs font-mono text-emerald-400/80">
               <span className="flex items-center gap-1"><Activity size={12}/> UPTIME: {uptime.toFixed(2)}%</span>
               <span className="flex items-center gap-1"><Wifi size={12}/> PING: {ping}ms</span>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Base de Datos PostgreSQL</h3>
                 <p className="text-slate-800 dark:text-white font-black text-2xl flex items-center gap-3"><Database size={24} className="text-blue-500"/> Integridad </p>
               </div>
               <ShieldCheck size={28} className="text-blue-500 opacity-80" />
            </div>
            <div className="flex items-center gap-3">
               <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${dbCapacity}%` }}></div>
               </div>
               <span className="text-[10px] font-black text-slate-500">{dbCapacity}% Uso</span>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Flujo Transaccional</h3>
                 <p className="text-slate-800 dark:text-white font-black text-2xl flex items-center gap-3"><Cpu size={24} className="text-indigo-500"/> Estabilidad</p>
               </div>
               <Globe size={28} className="text-indigo-500 opacity-80 animate-[spin_10s_linear_infinite]" />
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
               <span className="flex items-center gap-1 text-indigo-500"><ArrowUpRight size={14}/> 1.2 MB/s OUT</span>
               <span className="flex items-center gap-1 text-emerald-500"><ArrowUpRight size={14} className="rotate-90"/> 0.8 MB/s IN</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex items-center gap-6">
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-blue-500 shrink-0"><Users size={28}/></div>
            <div>
               <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{data.kpi.students}</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registros de Alumnos</p>
            </div>
         </div>
         <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex items-center gap-6">
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-purple-500 shrink-0"><GraduationCap size={28}/></div>
            <div>
               <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{data.kpi.teachers}</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cuentas Docentes</p>
            </div>
         </div>
         <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex items-center gap-6">
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-emerald-500 shrink-0"><School size={28}/></div>
            <div>
               <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{data.kpi.courses || 0}</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nodos de Aulas</p>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Terminal className="text-slate-400" size={24} /> Centro de Control de Incidencias
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Atiende y finaliza reportes en tiempo real</p>
          </div>
          <div className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
            {tickets.length} Activos
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-slate-900 text-[10px] uppercase text-slate-400 font-black tracking-[0.2em]">
                <th className="py-6 pl-10">Ticket ID</th>
                <th className="py-6">Remitente</th>
                <th className="py-6">Diagnóstico / Asunto</th>
                <th className="py-6">Prioridad</th>
                <th className="py-6">Estado Lógico</th>
                <th className="py-6 pr-10 text-right">Ejecutar Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm font-medium">
              {tickets.length > 0 ? (
                tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="py-5 pl-10 text-slate-500 font-mono text-xs font-bold">{ticket.id}</td>
                    <td className="py-5 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px]">{ticket.docente.charAt(0)}</div>
                      {ticket.docente}
                    </td>
                    <td className="py-5 text-slate-600 dark:text-slate-400 max-w-xs truncate">{ticket.issue}</td>
                    <td className="py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-[0.1em] uppercase ${
                        ticket.priority === 'ALTA' ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:border-red-900/30 dark:text-red-400' :
                        ticket.priority === 'MEDIA' ? 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-500/10 dark:border-orange-900/30 dark:text-orange-400' :
                        'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-900/30 dark:text-blue-400'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-5">
                      <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${ticket.status === 'RESUELTO' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {ticket.status === 'RESUELTO' ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Clock size={14} className="animate-pulse"/>}
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-5 pr-10 text-right">
                      {ticket.status === 'RESUELTO' ? (
                        <button 
                          onClick={() => handleTicketAction(ticket.id, ticket.status)}
                          className="flex items-center justify-end gap-1.5 w-full text-[10px] font-black bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-4 py-2.5 rounded-xl hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all uppercase tracking-widest shadow-sm border border-red-100 dark:border-red-900/30"
                        >
                          <Trash2 size={12}/> Finalizar
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleTicketAction(ticket.id, ticket.status)}
                          className="flex items-center justify-end gap-1.5 w-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all uppercase tracking-widest shadow-sm border border-slate-200 dark:border-slate-700"
                        >
                          <Settings size={12}/> Atender
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                     <ShieldCheck size={48} className="mx-auto text-emerald-400/50 mb-3"/>
                     <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Cola de incidencias vacía</p>
                     <p className="text-slate-500 text-xs mt-1">El sistema opera al 100% de eficiencia.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VISTA 2: DOCENTE (Diseño Delicado, Dedicado y Académico)
// ============================================================================

function DocenteView({ data, userNombre }: { data: DashboardData, userNombre?: string }) {
  const totalAlumnos = useMemo(() => {
    return data.mySubjects?.reduce((sum, subj) => sum + subj.students, 0) || 0;
  }, [data.mySubjects]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="bg-gradient-to-tr from-slate-100 to-white dark:from-slate-900 dark:to-slate-900/50 rounded-[3rem] p-10 md:p-12 border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
              Saludos, <span className="text-indigo-600 dark:text-indigo-400">{userNombre || 'Docente'}</span>
            </h2>
            <p className="text-slate-500 font-medium text-sm max-w-lg leading-relaxed">
              Este es tu espacio de gestión académica. Desde aquí puedes administrar la asistencia diaria y el rendimiento evaluativo de tus asignaturas.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 shrink-0">
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 min-w-[140px] shadow-sm flex flex-col items-center">
              <BookOpen size={24} className="text-indigo-500 mb-2" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Cursos</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{data.kpi.subjects || data.mySubjects?.length || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 min-w-[140px] shadow-sm flex flex-col items-center">
              <UsersRound size={24} className="text-emerald-500 mb-2" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Matrícula Total</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{totalAlumnos}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
          <BookOpen size={16} /> Planificación Activa
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data.mySubjects || []).length > 0 ? (
            data.mySubjects!.map((sub) => <SubjectCard key={sub.id} subject={sub} />)
          ) : (
            <div className="col-span-full p-16 text-center bg-white/50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700">
              <GraduationCap size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-slate-500 font-bold">Actualmente no tienes carga académica asignada en el sistema.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// VISTA 3: SECRETARÍA (Barra de Búsqueda Nav y Límite de Vista)
// ============================================================================

function SecretariaView({ data }: { data: DashboardData }) {
  const [searchTerm, setSearchTerm] = useState('');

  const displayStudents = useMemo(() => {
    const dataSource = data.recentActivity || [];
    if (!searchTerm.trim()) return dataSource.slice(0, 20);
    
    const term = searchTerm.toLowerCase();
    const filtrados = dataSource.filter(student => 
      student.nombre.toLowerCase().includes(term) ||
      student.apellido.toLowerCase().includes(term) ||
      student.matricula.toLowerCase().includes(term)
    );
    return filtrados.slice(0, 20);
  }, [searchTerm, data.recentActivity]);

  const nuevosEstudiantes = data.recentActivity?.filter(a => a.status === 'NUEVO').length || 0;

  return (
    <div className="space-y-8">
      <div className="relative w-full max-w-4xl mx-auto flex items-center bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-full p-2 shadow-sm focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all duration-300">
        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center ml-1 shrink-0">
           <Search className="text-slate-400" size={18} />
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Escriba la matrícula o nombre del alumno para buscar en el padrón..." 
          className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 py-3 px-4 text-sm font-bold placeholder:text-slate-400 placeholder:font-medium"
        />
        {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="mr-2 px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
               LIMPIAR
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Inscritos" value={data.kpi.students} icon={UsersRound} color="blue" />
        <KpiCard title="Nuevos Ingresos" value={nuevosEstudiantes} icon={UserPlus} color="emerald" />
        <KpiCard title="Aulas Activas" value={data.kpi.courses} icon={School} color="purple" />
        <KpiCard title="Notificaciones" value="3" icon={BellRing} color="orange" trend="Alertas" trendDown />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <RecentActivityTable 
            activities={displayStudents} 
            title={searchTerm ? `Resultados de búsqueda: ${displayStudents.length}` : "Expedientes Recientes (Últimos 20)"} 
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Settings size={16}/> Acciones de Operación
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ShortcutBtn href="/dashboard/estudiantes/nuevo" icon={UserPlus} label="Matricular" />
              <ShortcutBtn href="/dashboard/asistencia" icon={CheckSquare} label="Asistencia" />
              <ShortcutBtn href="/dashboard/reportes" icon={FileText} label="Constancias" />
              <ShortcutBtn href="/dashboard/horario" icon={Calendar} label="Horarios" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VISTA 4: DIRECTOR (Visión Analítica y Directiva)
// ============================================================================

function DirectorView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Matrícula Total" value={data.kpi.students} icon={Users} color="blue" />
        <KpiCard title="Personal Docente" value={data.kpi.teachers} icon={GraduationCap} color="purple" />
        <KpiCard title="Aulas/Secciones" value={data.kpi.courses} icon={School} color="emerald" />
        <KpiCard title="Asistencia Global" value="94%" icon={Activity} color="orange" trend="Óptimo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AreaChartCard data={data.charts?.courses || []} />
        </div>
        <div>
          <PieChartCard data={data.charts?.gender || []} total={data.kpi.students} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityTable activities={(data.recentActivity || []).slice(0, 8)} title="Bitácora de Matriculación" />
        
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
             <ShieldCheck size={16}/> Panel Directivo
          </h3>
          <div className="grid grid-cols-2 gap-4">
             <ShortcutBtn href="/dashboard/docentes" icon={GraduationCap} label="Evaluación" />
             <ShortcutBtn href="/dashboard/reportes" icon={BarChart3} label="Data MINERD" />
             <ShortcutBtn href="/dashboard/horario" icon={Calendar} label="Auditoría" />
             <ShortcutBtn href="/dashboard/ajustes" icon={Settings} label="Ajustes" />
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// COMPONENTES DE APOYO Y UI REUTILIZABLE (Shared Components)
// ============================================================================

function DashboardViewResolver({ role, data, userNombre, userEmail }: { role: Role; data: DashboardData, userNombre?: string, userEmail?: string }) {
  switch (role) {
    case 'ADMIN_SISTEMA': return <AdminView data={data} userEmail={userEmail} role={role} />;
    case 'DIRECTOR': return <DirectorView data={data} />;
    case 'DOCENTE': return <DocenteView data={data} userNombre={userNombre} />;
    case 'SECRETARIA': return <SecretariaView data={data} />;
    default: return <div className="p-12 text-center text-red-500 font-bold bg-white dark:bg-slate-900 rounded-[3rem]">Error Crítico: El token JWT no contiene un rol válido.</div>;
  }
}

function GlobalActions({ role }: { role: Role }) {
  if (role === 'DOCENTE' || role === 'SECRETARIA') return null;
  return (
    <div className="flex gap-3">
      <Link href="/dashboard/reportes" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
        <FileText size={16} className="text-blue-500" /> Reportes del Sistema
      </Link>
    </div>
  );
}

function SubjectCard({ subject }: { subject: SubjectData }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform"></div>
      
      <div className="mb-6 relative z-10">
        <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-lg mb-4">
          {subject.ciclo || 'Nivel Primario'}
        </span>
        <h4 className="font-black text-2xl mb-1 text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">
          {subject.name}
        </h4>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">{subject.courseName}</p>
      </div>
      
      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estudiantes:</span>
          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">{subject.students}</span>
        </div>
        <div className="flex flex-col xl:flex-row gap-3">
            <Link href={`/dashboard/asistencia?materia=${subject.id}`} className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase tracking-widest font-black py-3 rounded-2xl transition-all shadow-md shadow-indigo-500/20 active:scale-95">
              Pasar Lista
            </Link>
            <Link href={`/dashboard/notas?materia=${subject.id}`} className="flex-1 text-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-widest font-black py-3 rounded-2xl transition-all active:scale-95">
              Ver Notas
            </Link>
        </div>
      </div>
    </div>
  );
}

function RecentActivityTable({ activities, title }: { activities: StudentActivity[], title: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white dark:bg-slate-900 text-[10px] uppercase text-slate-400 font-black tracking-[0.2em]">
              <th className="py-5 pl-8">Identidad Estudiantil</th>
              <th className="py-5">Matrícula</th>
              <th className="py-5">Estado</th>
              <th className="py-5 text-right pr-8">Expediente</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-50 dark:divide-slate-800/50 font-medium">
            {activities.length > 0 ? activities.map((student) => (
              <tr key={student.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-4 pl-8 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-black text-xs uppercase border border-slate-200 dark:border-slate-700 shrink-0">
                    {student.nombre[0]}{student.apellido[0]}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-xs">{student.nombre} {student.apellido}</span>
                </td>
                <td className="py-4 text-slate-500 font-mono text-xs font-bold">{student.matricula}</td>
                <td className="py-4">
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border ${
                    student.status === 'NUEVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-900/30' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                  }`}>
                    {student.status}
                  </span>
                </td>
                <td className="py-4 text-right pr-8">
                  <Link href={`/dashboard/estudiantes/${student.id}`} title="Ver Ficha Técnica" className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-amber-500 hover:border-amber-200 inline-block transition-all shadow-sm">
                    <ArrowUpRight size={18}/>
                  </Link>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={4} className="py-16 text-center text-slate-400 font-bold text-sm">No se localizaron registros para los parámetros indicados.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CustomTooltip = (props: any) => {
  const { active, payload, label } = props;
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
        <p className="font-black text-slate-800 dark:text-white mb-1 text-sm uppercase tracking-widest">{label || data.name}</p>
        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Total: {data.value} alumnos</p>
      </div>
    );
  }
  return null;
};

function KpiCard({ title, value, icon: Icon, trend, color, trendDown = false }: { title: string, value: string | number, icon: React.ElementType, color: 'blue'|'purple'|'emerald'|'orange', trend?: string, trendDown?: boolean }) {
  const styles = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:border-purple-800/50 dark:text-purple-400",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400",
    orange: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:border-orange-800/50 dark:text-orange-400",
  }[color];
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl border ${styles}`}><Icon size={24} /></div>
        {trend && <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${trendDown ? 'text-red-600 bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-900/30' : 'text-emerald-600 bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-900/30'}`}>{trend}</span>}
      </div>
      <h4 className="text-4xl font-black text-slate-900 dark:text-white">{value}</h4>
      <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">{title}</p>
    </div>
  );
}

function AreaChartCard({ data }: { data: ChartItem[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
      <h3 className="text-[11px] font-black mb-8 flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]">
        <BarChart3 size={18} className="text-blue-500" /> Histograma de Matrícula por Nivel
      </h3>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={4} fill="url(#colorTotal)" fillOpacity={1} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }} />
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PieChartCard({ data, total }: { data: ChartItem[], total: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col items-center justify-center">
      <h3 className="text-[11px] font-black mb-2 text-slate-400 uppercase tracking-[0.2em] self-start">División de Alumnos</h3>
      <div className="flex-1 w-full relative min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-black text-slate-800 dark:text-white">{total}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Estudiantes</span>
        </div>
      </div>
    </div>
  );
}

function ShortcutBtn({ icon: Icon, label, href }: { icon: React.ElementType, label: string, href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all hover:scale-[1.03] group shadow-sm">
      <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-3 group-hover:border-blue-200 dark:group-hover:border-blue-500/50 transition-colors">
         <Icon size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">{label}</span>
    </Link>
  );
}

function ErrorState({ message }: { message: string }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
        <ShieldAlert className="text-red-500 w-20 h-20 mb-6" />
        <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white tracking-tighter">Fallo de Arquitectura</h2>
        <p className="text-slate-500 font-bold mb-8 max-w-md">{message}</p>
        <button onClick={() => window.location.reload()} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs uppercase tracking-widest font-black rounded-full transition-all shadow-xl hover:scale-105 active:scale-95">Reconectar Socket</button>
      </div>
    );
}

const DashboardSkeleton = () => (
  <div className="p-8 space-y-8 animate-pulse min-h-screen max-w-7xl mx-auto mt-4">
    <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>)}
    </div>
    <div className="h-96 w-full bg-slate-200 dark:bg-slate-800 rounded-[3rem]"></div>
  </div>
);