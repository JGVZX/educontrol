'use client';

import { 
  Server, 
  Database, 
  ShieldAlert, 
  Activity, 
  HardDrive, 
  RefreshCw, 
  Lock, 
  UserCog, 
  Terminal,
  Save,
  AlertOctagon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// --- DATOS SIMULADOS TÉCNICOS ---
const dataServerLoad = [
  { time: '08:00', cpu: 12, ram: 24 },
  { time: '10:00', cpu: 45, ram: 55 },
  { time: '12:00', cpu: 32, ram: 40 },
  { time: '14:00', cpu: 78, ram: 85 }, // Pico de uso
  { time: '16:00', cpu: 55, ram: 60 },
  { time: '18:00', cpu: 20, ram: 30 },
];

const dataLoginAttempts = [
  { status: 'Exitosos', value: 1240, fill: '#10b981' }, // Verde
  { status: 'Fallidos', value: 45, fill: '#ef4444' },   // Rojo
];

const securityLogs = [
  { id: 1, action: "Bloqueo de IP (Brute Force)", ip: "192.168.1.105", time: "Hace 5 min", severity: "high" },
  { id: 2, action: "Cambio de Rol (Docente -> Admin)", target: "M. Rodriguez", user: "SuperAdmin", time: "Hace 20 min", severity: "medium" },
  { id: 3, action: "Backup Diario Completado", size: "2.4GB", time: "Hace 4 horas", severity: "low" },
  { id: 4, action: "Reinicio de Servicio API", user: "Sistema", time: "Hace 1 día", severity: "medium" },
];

export default function SystemAdminView() {
  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      {/* 1. HEADER TÉCNICO */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
             <Terminal className="text-slate-500" /> Panel de Infraestructura
           </h1>
           <p className="text-slate-500 text-sm font-mono mt-1">
             <span className="text-emerald-600 font-bold">● ONLINE</span> | v2.5.1 Stable | Servidor: AWS-USEast-1
           </p>
        </div>
        <div className="flex gap-3">
            <button className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors border border-slate-200 dark:border-slate-700">
                <RefreshCw size={16} className="animate-spin-slow" /> Purgar Caché
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                <Save size={16} /> Backup Manual
            </button>
        </div>
      </div>

      {/* 2. KPIs DE SALUD DEL SISTEMA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card CPU */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Activity size={20}/></div>
                <span className="text-xs font-mono text-slate-400">CPU LOAD</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">32%</h3>
            <p className="text-xs text-emerald-600 mt-1">Estable</p>
            {/* Pequeña barra de progreso visual */}
            <div className="w-full h-1 bg-slate-100 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[32%]"></div>
            </div>
        </div>

        {/* Card Almacenamiento */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-lg"><Database size={20}/></div>
                <span className="text-xs font-mono text-slate-400">STORAGE</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">84%</h3>
            <p className="text-xs text-orange-500 mt-1">Atención: Espacio bajo</p>
            <div className="w-full h-1 bg-slate-100 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 w-[84%]"></div>
            </div>
        </div>

        {/* Card Seguridad */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-red-500">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"><ShieldAlert size={20}/></div>
                <span className="text-xs font-mono text-slate-400">FIREWALL</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">2 IPS</h3>
            <p className="text-xs text-slate-500 mt-1">Bloqueadas hoy</p>
        </div>

        {/* Card Usuarios Sistema */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-lg"><UserCog size={20}/></div>
                <span className="text-xs font-mono text-slate-400">USERS</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">1,240</h3>
            <p className="text-xs text-slate-500 mt-1">Total registrados</p>
        </div>
      </div>

      {/* 3. GRÁFICAS DE MONITOREO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Carga del Servidor */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <Server size={18} className="text-blue-500"/> Rendimiento del Servidor (24h)
             </h3>
             <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Latencia: 24ms</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataServerLoad}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
                <Area type="monotone" dataKey="ram" stroke="#8b5cf6" strokeWidth={2} fillOpacity={0} fill="url(#colorCpu)" name="RAM %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intentos de Acceso */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Intentos de Acceso</h3>
            <p className="text-sm text-slate-500 mb-4">Seguridad de Login Global</p>
            <div className="flex-1 w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataLoginAttempts}>
                        <XAxis dataKey="status" axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                        <Bar dataKey="value" radius={[4,4,0,0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg flex items-center gap-3">
                <AlertOctagon className="text-red-600" size={20} />
                <div>
                    <p className="text-xs font-bold text-red-700 dark:text-red-400">45 Intentos Fallidos</p>
                    <p className="text-[10px] text-red-600/80">Revisar logs de IP sospechosas.</p>
                </div>
            </div>
        </div>
      </div>

      {/* 4. LOGS DE AUDITORÍA CRÍTICOS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive size={18} /> Auditoría del Sistema & Seguridad
              </h3>
              <button className="text-xs font-bold text-blue-600 hover:underline">Ver registro completo</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {securityLogs.map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                              log.severity === 'high' ? 'bg-red-100 text-red-600' :
                              log.severity === 'medium' ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                          }`}>
                              {log.severity === 'high' ? <ShieldAlert size={18} /> : <Terminal size={18} />}
                          </div>
                          <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-white">{log.action}</p>
                              <p className="text-xs text-slate-500 font-mono">
                                  {log.ip && `IP: ${log.ip} • `} 
                                  {log.user && `User: ${log.user} • `} 
                                  {log.target && `Target: ${log.target}`}
                              </p>
                          </div>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{log.time}</span>
                  </div>
              ))}
          </div>
      </div>

    </div>
  );
}