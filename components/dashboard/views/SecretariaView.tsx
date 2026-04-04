'use client';

import { 
  FileText, 
  UserPlus, 
  Printer, 
  Search, 
  ClipboardList, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Users,
  FolderOpen
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- DATOS SIMULADOS OPERATIVOS ---
const tramitesPendientes = [
  { id: 1, estudiante: "Ana García (4to A)", documento: "Récord de Notas", fecha: "Hace 20 min", estado: "pendiente" },
  { id: 2, estudiante: "Luis Méndez (2do B)", documento: "Carta de Buena Conducta", fecha: "Hace 1 hora", estado: "pendiente" },
  { id: 3, estudiante: "Carla Ortiz (6to A)", documento: "Certificación de Estudios", fecha: "Hace 2 horas", estado: "listo" },
  { id: 4, estudiante: "Pedro Almonte (1ro C)", documento: "Copia de Acta de Nacimiento", fecha: "Ayer", estado: "listo" },
];

const inscripcionesSemana = [
  { dia: 'Lun', nuevos: 12 },
  { dia: 'Mar', nuevos: 8 },
  { dia: 'Mié', nuevos: 15 },
  { dia: 'Jue', nuevos: 5 },
  { dia: 'Vie', nuevos: 9 },
];

export default function SecretariaView() {
  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      {/* 1. HEADER OPERATIVO + BUSCADOR RÁPIDO */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="text-blue-600" /> Registro y Control
           </h1>
           <p className="text-slate-500 text-sm mt-1">Gestión de Expedientes y Admisiones</p>
        </div>

        {/* Buscador de Expediente (Herramienta #1 de la Secretaria) */}
        <div className="flex-1 max-w-lg relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
                type="text" 
                placeholder="Buscar por RNE, Nombre o Matrícula..." 
                className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
            />
        </div>

        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all shrink-0">
            <UserPlus size={18} /> Nueva Inscripción
        </button>
      </div>

      {/* 2. ACCESOS RÁPIDOS (TRÁMITES FRECUENTES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 hover:shadow-md transition-all text-left group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Printer size={60} />
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg w-fit mb-3"><FileText size={24}/></div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Emisión de Documentos</h3>
            <p className="text-sm text-slate-500 mt-1">Récords, Cartas y Boletines</p>
        </button>

        <button className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all text-left group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <ClipboardList size={60} />
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg w-fit mb-3"><Users size={24}/></div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Listados Oficiales</h3>
            <p className="text-sm text-slate-500 mt-1">Reportes para SIGERD / MINERD</p>
        </button>
        
        <button className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-violet-400 hover:shadow-md transition-all text-left group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle size={60} />
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-lg w-fit mb-3"><CheckCircle size={24}/></div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Validar Expedientes</h3>
            <p className="text-sm text-slate-500 mt-1">3 Alumnos con documentos faltantes</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3. LISTA DE SOLICITUDES (COLA DE TRABAJO) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Clock size={18} className="text-orange-500"/> Solicitudes en Cola
                </h3>
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">2 Pendientes</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tramitesPendientes.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex gap-4 items-start">
                             <div className={`mt-1 p-2 rounded-full shrink-0 ${
                                 item.estado === 'pendiente' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                             }`}>
                                 {item.estado === 'pendiente' ? <Clock size={16} /> : <CheckCircle size={16} />}
                             </div>
                             <div>
                                 <h4 className="font-bold text-slate-900 dark:text-white">{item.documento}</h4>
                                 <p className="text-sm text-slate-500">{item.estudiante}</p>
                                 <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                     <Clock size={10} /> Solicitado: {item.fecha}
                                 </p>
                             </div>
                        </div>
                        <div className="flex gap-2">
                            {item.estado === 'pendiente' ? (
                                <>
                                    <button className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Ver Detalle</button>
                                    <button className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-1">
                                        <Printer size={12} /> Imprimir
                                    </button>
                                </>
                            ) : (
                                <button className="px-3 py-1.5 text-xs font-bold text-green-700 bg-green-100 rounded-lg border border-green-200 cursor-default">
                                    Entregado
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-800">
                <button className="text-sm text-blue-600 font-bold hover:underline">Ver historial completo de trámites</button>
            </div>
        </div>

        {/* 4. ESTADÍSTICA DE INSCRIPCIONES */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">Flujo de Inscripciones</h3>
            <p className="text-sm text-slate-500 mb-6">Nuevos ingresos esta semana</p>
            
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inscripcionesSemana}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                        <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{borderRadius: '8px', border: 'none'}}
                        />
                        <Bar dataKey="nuevos" fill="#3b82f6" radius={[4,4,0,0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-yellow-600 shrink-0" size={18} />
                <div>
                    <p className="text-xs font-bold text-yellow-800 dark:text-yellow-400">Cupos Limitados</p>
                    <p className="text-[10px] text-yellow-700 dark:text-yellow-500 mt-0.5">
                        Las secciones de 4to de Secundaria están al 95% de capacidad.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}