'use client';

/**
 * @file AdministracionPage.tsx
 * @description Centro de Mando Administrativo - EduControl v3.0 (NOC Edition)
 * @author Jose Junior Guzmán Veloz - Tesis Ingeniería en Sistemas
 */

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { 
  getUsersForMonitoring, 
  getAllTickets, 
  updateTicketStatus,
  generateDatabaseBackup 
} from './actions';

import { 
  ShieldCheck, Database, ShieldAlert, Clock, CheckCircle2, 
  AlertTriangle, Loader2, Users, Activity, Search, 
  Eye, Server, Wifi, Cpu, Globe, HardDriveDownload,
  Terminal, BarChart3, Shield
} from 'lucide-react';

export default function AdministracionPage() {
  const { user: currentUser } = useUser();
  const role = currentUser?.role;

  // ESTADOS
  const [isLoading, setIsLoading] = useState(true);
  const [monitorData, setMonitorData] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchAdmin, setSearchAdmin] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupUrl, setLastBackupUrl] = useState<string | null>(null);

  // SIMULACIÓN DE FLUJO DE DATOS (Real-time Feel)
  const [metrics, setMetrics] = useState({ ping: 22, traffic: 1.2 });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        ping: Math.floor(Math.random() * (35 - 18) + 18),
        traffic: Number((Math.random() * (2.5 - 0.8) + 0.8).toFixed(1))
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      if (role === 'ADMIN_SISTEMA') {
        const [users, ticketList] = await Promise.all([
          getUsersForMonitoring(),
          getAllTickets()
        ]);
        setMonitorData(users || []);
        setTickets(ticketList || []);
      }
    } catch (err) {
      console.error("Error en carga administrativa:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (role) loadInitialData(); }, [role]);

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const result = await generateDatabaseBackup(currentUser?.email || "", "ADMIN_SISTEMA");
      if (result.success) {
        setLastBackupUrl(result.url);
        alert("Sincronización con Vercel Blob exitosa.");
      }
    } catch (error) {
      alert("Fallo en el protocolo de respaldo.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const filteredUsers = monitorData.filter(u => {
    const term = searchAdmin.toLowerCase();
    return u.nombre.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
      <div className="relative">
        <Loader2 className="animate-spin text-blue-600 w-16 h-16" />
        <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 w-6 h-6" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Autenticando Terminal de Mando...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-1000">
      
      {/* 1. HEADER TÉCNICO (NOC STYLE) */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Terminal size={20} /></div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Admin Console <span className="text-blue-600">v3.0</span></h1>
          </div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
            <Globe size={14} className="text-emerald-500" /> Infraestructura Global de EduControl
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">Latencia</p>
              <p className="text-sm font-mono font-black text-emerald-500">{metrics.ping}ms</p>
            </div>
            <Wifi size={20} className="text-emerald-500" />
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">Tráfico</p>
              <p className="text-sm font-mono font-black text-blue-500">{metrics.traffic} MB/s</p>
            </div>
            <Activity size={20} className="text-blue-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* 2. MEGA-BACKUP & INFRAESTRUCTURA (Bóveda de Seguridad) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-600/20 transition-all duration-1000"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner">
                <Database size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Sincronización de Bóveda</h2>
                <p className="text-slate-400 text-xs font-medium max-w-sm">Protocolo de respaldo íntegro (JSON/PostgreSQL) hacia la nube perimetral de Vercel.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <button 
                onClick={handleBackup}
                disabled={isBackingUp}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isBackingUp ? <Loader2 className="animate-spin" size={18} /> : <HardDriveDownload size={18} />}
                {isBackingUp ? "Extrayendo..." : "Generar Backup Seguro"}
              </button>

              {lastBackupUrl && (
                <a href={lastBackupUrl} target="_blank" className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-300 transition-colors">
                  <CheckCircle2 size={14} /> Descargar última copia en la nube
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Status</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Cpu size={24} className="text-emerald-500" /> Core Engine
              </h3>
            </div>
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="space-y-4">
             <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
               <span>Carga de Servidor</span>
               <span>12%</span>
             </div>
             <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-[12%]"></div>
             </div>
          </div>

          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Instancia: vercel-edge-us-east-1</p>
        </div>
      </section>

      {/* 3. MONITOR DE INCIDENCIAS (OPERACIONES) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-6">
          <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
             Tickets de Soporte Docente
          </h3>
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-800/50">
            {tickets.filter(t => t.status === 'PENDIENTE').length} Pendientes
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    ticket.priority === 'ALTA' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'
                  }`}>
                    {ticket.priority}
                  </span>
                  <AlertTriangle className={ticket.status === 'PENDIENTE' ? 'text-amber-500 animate-pulse' : 'text-slate-300'} size={20} />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-tight">{ticket.issue}</h4>
                <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 line-clamp-3">"{ticket.description}"</p>
              </div>

              <div className="mt-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center font-black text-[10px]">{ticket.docente.nombre[0]}</div>
                  <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase truncate">{ticket.docente.nombre} {ticket.docente.apellido}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateTicketStatus(ticket.id, 'RESUELTO')} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">Resolver</button>
                  <button className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-blue-500 transition-all"><Search size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. GESTIÓN DE PERSONAL (SEGURIDAD) */}
      <section className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
           <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
             <ShieldCheck className="text-blue-600" /> Control de Acceso Perimetral
           </h3>
           <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="BUSCAR CREDENCIAL..." value={searchAdmin}
                onChange={(e) => setSearchAdmin(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest focus:border-blue-500 outline-none transition-all"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-10 py-6">Usuario / Endpoint</th>
                <th className="px-6 py-6 text-center">Protocolo</th>
                <th className="px-6 py-6 text-center">Estado</th>
                <th className="px-10 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">{u.nombre[0]}</div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tighter">{u.nombre} {u.apellido}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="text-[9px] font-black px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-md uppercase">{u.role}</span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${u.estado === 'ACTIVO' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                       <span className="text-[10px] font-black uppercase text-slate-500">{u.estado}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                     <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Eye size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}