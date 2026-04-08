'use client';

import { 
  Users, 
  GraduationCap, 
  BookOpen, // Reemplaza Wallet
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ClipboardList, // Icono para reportes/listas
  UserPlus,
  FileText,
  Activity,
  CalendarCheck, // Reemplaza DollarSign
  Clock,
  School
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart,
  Bar,
  Legend
} from 'recharts';

// --- DATOS SIMULADOS (ACADÉMICOS - NO FINANCIEROS) ---

// 1. Rendimiento Académico: Promedio por Asignatura (Reemplaza Finanzas)
const dataRendimiento = [
  { materia: 'Lengua Esp.', promedio: 85, aprobados: 92 },
  { materia: 'Matemáticas', promedio: 76, aprobados: 80 },
  { materia: 'Sociales', promedio: 88, aprobados: 95 },
  { materia: 'Naturales', promedio: 82, aprobados: 88 },
  { materia: 'Inglés', promedio: 79, aprobados: 85 },
  { materia: 'Educ. Física', promedio: 96, aprobados: 100 },
];

// 2. Asistencia Semanal (Se mantiene igual, es vital para escuelas)
const dataAsistencia = [
  { name: 'Lun', asistencia: 96 },
  { name: 'Mar', asistencia: 94 },
  { name: 'Mie', asistencia: 88 },
  { name: 'Jue', asistencia: 97 },
  { name: 'Vie', asistencia: 85 },
];

// 3. Distribución Demográfica (Requerimiento MINERD)
const dataDistribucion = [
  { name: 'Masculino', value: 540 },
  { name: 'Femenino', value: 620 },
];
const COLORS = ['#3b82f6', '#ec4899']; // Azul y Rosa

// 4. Actividad Reciente (Solo eventos académicos/administrativos)
const recentActivity = [
  { id: 1, user: "Secretaría", action: "Generó Acta de Calificaciones", time: "Hace 10 min", type: "admin" },
  { id: 2, user: "Prof. Maria", action: "Cierre de notas 4to A", time: "Hace 25 min", type: "academic" },
  { id: 3, user: "Sistema", action: "Respaldo de expediente estudiantil", time: "Hace 1 hora", type: "system" },
  { id: 4, user: "Psicología", action: "Reporte de conducta (Est. #4023)", time: "Hace 2 horas", type: "alert" },
];

export default function SuperDashboard() {
  return (
    <div className="space-y-8 pb-10">
      
      {/* ============================================================
          1. HEADER: BIENVENIDA Y ACCIONES RÁPIDAS
         ============================================================ */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Panel Académico</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Gestión Escolar • Periodo P2 (En Curso)
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all font-semibold text-sm">
            <UserPlus size={18} />
            Nueva Inscripción
          </button>
          {/* Botón cambiado de "Registrar Pago" a "Pasar Lista/Asistencia" */}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 hover:bg-emerald-700 transition-all font-semibold text-sm">
            <CalendarCheck size={18} />
            Registrar Asistencia
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold text-sm">
            <FileText size={18} />
            Reportes MINERD
          </button>
        </div>
      </div>

      {/* ============================================================
          2. TARJETAS DE MÉTRICAS (KPIs) - ENFOQUE ESCOLAR
         ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Matrícula Activa */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              Activos
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Matrícula General</p>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">1,160</h3>
        </div>

        {/* KPI 2: Asistencia Diaria (Reemplaza Dinero) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
              <CalendarCheck size={24} />
            </div>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              96% Presentes
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Asistencia de Hoy</p>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">1,113</h3>
        </div>

        {/* KPI 3: Docentes / Personal */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-violet-500 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-xl">
              <GraduationCap size={24} />
            </div>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
              Plantilla Completa
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Personal Docente</p>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">64</h3>
        </div>

        {/* KPI 4: Alertas Académicas (Riesgo de Reprobación/Deserción) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-red-500 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              Riesgo Académico
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Alertas / Conducta</p>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">5</h3>
        </div>
      </div>

      {/* ============================================================
          3. GRÁFICAS PRINCIPALES (Rendimiento Académico)
         ============================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Gráfica 1: Rendimiento por Materia (Reemplaza Finanzas) */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <School size={20} className="text-blue-500"/>
                Rendimiento Académico
              </h3>
              <p className="text-sm text-slate-500">Promedios por asignatura (Corte Evaluativo P2)</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button className="px-3 py-1 text-xs font-bold bg-white dark:bg-slate-700 shadow-sm rounded-md transition-all">Primaria</button>
                <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-all">Secundaria</button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataRendimiento}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="materia" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="promedio" name="Promedio" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica 2: Demografía (Género) - Requerido por MINERD */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Población Estudiantil</h3>
            <p className="text-sm text-slate-500">Distribución por género</p>
          </div>
          
          <div className="h-[220px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataDistribucion}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {dataDistribucion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800 dark:text-white">1,160</span>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total</span>
            </div>
          </div>

          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-bold">Masculino</span>
                <span className="text-lg font-bold text-slate-700 dark:text-white">46%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-bold">Femenino</span>
                <span className="text-lg font-bold text-slate-700 dark:text-white">54%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          4. SECCIÓN INFERIOR: ASISTENCIA Y BITÁCORA ACADÉMICA
         ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfica 3: Asistencia (Vital en escuelas públicas) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Asistencia Semanal</h3>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Meta: 90%</span>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataAsistencia}>
                <defs>
                  <linearGradient id="colorAsist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="asistencia" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAsist)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lista: Bitácora Administrativa (Sin pagos) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={20} className="text-blue-500" />
                Actividad Reciente del Sistema
            </h3>
            <button className="text-blue-600 text-sm font-medium hover:underline">Ver historial</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivity.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === 'admin' ? 'bg-green-100 text-green-600' :
                    item.type === 'alert' ? 'bg-red-100 text-red-600' :
                    item.type === 'system' ? 'bg-slate-100 text-slate-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {item.type === 'admin' && <ClipboardList size={18} />}
                    {item.type === 'alert' && <AlertTriangle size={18} />}
                    {item.type === 'system' && <Activity size={18} />}
                    {item.type === 'academic' && <GraduationCap size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{item.action}</p>
                    <p className="text-xs text-slate-500">Usuario: {item.user}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Clock size={12} />
                    {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
} 