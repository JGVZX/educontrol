'use client';

import { 
  BookOpen, 
  Users, 
  Clock, 
  Calendar, 
  CheckSquare, 
  Edit3, 
  AlertCircle,
  MoreVertical,
  GraduationCap
} from 'lucide-react';

// --- DATOS SIMULADOS DOCENTE ---
const teacherName = "Lic. Carlos Rodríguez";
const currentPeriod = "Periodo P2 (Oct-Dic)";

const scheduleToday = [
  { time: "08:00 - 08:45", curso: "4to A - Secundaria", materia: "Matemáticas", aula: "B-12", status: "finished" },
  { time: "08:45 - 09:30", curso: "4to B - Secundaria", materia: "Matemáticas", aula: "B-13", status: "current" },
  { time: "10:00 - 10:45", curso: "LIBRE", materia: "Planificación", aula: "Sala Profesores", status: "upcoming" },
  { time: "10:45 - 11:30", curso: "5to A - Secundaria", materia: "Física", aula: "Lab-1", status: "upcoming" },
];

const myCourses = [
  { id: 1, name: "4to A - Matemáticas", students: 32, gradeProgress: 100, nextTask: "Todo al día" },
  { id: 2, name: "4to B - Matemáticas", students: 30, gradeProgress: 85, nextTask: "Faltan 5 notas" },
  { id: 3, name: "5to A - Física", students: 28, gradeProgress: 40, nextTask: "Subir P2" },
  { id: 4, name: "6to A - Física", students: 25, gradeProgress: 0, nextTask: "Pendiente iniciar" },
];

export default function DocenteView() {
  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      {/* 1. HEADER PERSONALIZADO */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
             <GraduationCap className="text-blue-600" /> Hola, {teacherName}
           </h1>
           <p className="text-slate-500 text-sm mt-1">
             {currentPeriod} • <span className="text-emerald-600 font-bold">Semana 8 de 12</span>
           </p>
        </div>
        
        {/* Recordatorio Crítico */}
        <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-xl border border-orange-100 dark:border-orange-800">
            <Clock className="text-orange-600" size={20} />
            <div className="text-sm">
                <p className="font-bold text-orange-800 dark:text-orange-400">Cierre de Notas P2</p>
                <p className="text-orange-600/80 text-xs">Vence en 3 días</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. AGENDA DEL DÍA (COLUMNA IZQUIERDA - CRONOLOGÍA) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500"/> Agenda de Hoy
                </h3>
                <span className="text-xs font-bold text-slate-400 uppercase">Martes 24</span>
            </div>
            
            <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-8 pb-2">
                {scheduleToday.map((clase, idx) => (
                    <div key={idx} className="relative pl-6">
                        {/* Indicador de estado (Bolita) */}
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                            clase.status === 'current' ? 'bg-blue-600 animate-pulse' :
                            clase.status === 'finished' ? 'bg-slate-300' : 'bg-white border-blue-400'
                        }`}></div>
                        
                        <div className={`p-4 rounded-xl border transition-all ${
                            clase.status === 'current' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border-blue-600' 
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500'
                        }`}>
                            <div className="flex justify-between items-start">
                                <span className={`text-xs font-bold ${clase.status === 'current' ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {clase.time}
                                </span>
                                {clase.status === 'current' && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white">EN CURSO</span>}
                            </div>
                            <h4 className={`text-lg font-bold mt-1 ${clase.status === 'current' ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                                {clase.materia}
                            </h4>
                            <p className={`text-sm ${clase.status === 'current' ? 'text-blue-100' : 'text-slate-500'}`}>
                                {clase.curso} • Aula {clase.aula}
                            </p>
                            
                            {/* Botón rápido solo si es la clase actual */}
                            {clase.status === 'current' && (
                                <div className="mt-3 pt-3 border-t border-white/20 flex gap-2">
                                    <button className="flex-1 bg-white text-blue-700 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex justify-center gap-2 items-center">
                                        <CheckSquare size={14} /> Pasar Lista
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 3. MIS ASIGNATURAS (COLUMNA DERECHA - GRID) */}
        <div className="lg:col-span-2 space-y-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Mis Cursos Asignados</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCourses.map((course) => (
                    <div key={course.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 transition-all group relative overflow-hidden">
                        
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <BookOpen size={20}/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">{course.name}</h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Users size={12}/> {course.students} Estudiantes
                                    </p>
                                </div>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600">
                                <MoreVertical size={18} />
                            </button>
                        </div>

                        {/* Barra de Progreso de Calificaciones */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500 font-medium">Progreso Notas P2</span>
                                <span className={`font-bold ${
                                    course.gradeProgress === 100 ? 'text-emerald-600' : 
                                    course.gradeProgress < 50 ? 'text-orange-500' : 'text-blue-600'
                                }`}>{course.gradeProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        course.gradeProgress === 100 ? 'bg-emerald-500' : 
                                        course.gradeProgress < 50 ? 'bg-orange-400' : 'bg-blue-500'
                                    }`} 
                                    style={{ width: `${course.gradeProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 text-right italic">
                                Estado: {course.nextTask}
                            </p>
                        </div>

                        {/* Acciones Rápidas */}
                        <div className="mt-5 flex gap-2">
                            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <CheckSquare size={14} /> Asistencia
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20">
                                <Edit3 size={14} /> Calificar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Aviso de Sistema Educativo */}
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-xl flex gap-3 items-start">
                 <AlertCircle className="text-violet-600 shrink-0 mt-0.5" size={18} />
                 <div>
                     <h4 className="text-sm font-bold text-violet-800 dark:text-violet-300">Reunión de Área</h4>
                     <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">
                         Se convoca a todos los docentes de Ciencias Exactas para el Jueves a las 10:00 AM en la Biblioteca.
                     </p>
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
}