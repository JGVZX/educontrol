'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, Printer, Filter, Plus, 
  Clock, BookOpen, User, LayoutGrid, 
  Coffee, Utensils, MoreHorizontal 
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { getScheduleData, deleteScheduleBlock } from './actions';
// Define DayOfWeek type manually
type DayOfWeek = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES';

// Configuración de la Jornada Extendida Dominicana (8:00 AM - 4:00 PM)
const TIME_BLOCKS = [
  { p: 1, range: "08:00 - 08:50", label: "1ra Hora" },
  { p: 2, range: "08:50 - 09:40", label: "2da Hora" },
  { p: 3, range: "09:40 - 10:30", label: "3ra Hora" },
  { p: 'receso', range: "10:30 - 11:00", label: "RECREO", type: 'break' },
  { p: 4, range: "11:00 - 11:50", label: "4ta Hora" },
  { p: 5, range: "11:50 - 12:40", label: "5ta Hora" },
  { p: 'almuerzo', range: "12:40 - 01:40", label: "ALMUERZO", type: 'break' },
  { p: 6, range: "01:40 - 02:30", label: "6ta Hora" },
  { p: 7, range: "02:30 - 03:20", label: "7ma Hora" },
  { p: 8, range: "03:20 - 04:00", label: "8va Hora" },
];

const DAYS: DayOfWeek[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];

export default function SchedulePage() {
  const { user, role } = useUser();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  useEffect(() => {
    async function init() {
      if (user?.email && role) {
        setLoading(true);
        const result = await getScheduleData(user.email, role);
        setData(result);
        setLoading(false);
      }
    }
    init();
  }, [user, role]);

  // Obtener lista de cursos para el filtro de secretaria
  const availableCourses = useMemo(() => {
    return Array.from(new Set(data.map(s => s.courseName)));
  }, [data]);

  if (loading) return <ScheduleSkeleton />;

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/30 dark:bg-transparent min-h-screen animate-in fade-in duration-700">
      
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
            <CalendarDays size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Itinerario Escolar</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">EduControl Sistema Técnico</p>
          </div>
        </div>

        <div className="flex gap-3">
          {(role === 'SECRETARIA' || role === 'DIRECTOR') && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <Filter size={16} className="text-slate-400" />
              <select 
                className="bg-transparent text-sm font-bold outline-none text-slate-700 dark:text-slate-200 min-w-[150px]"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">Todos los Cursos</option>
                {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Printer size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </header>

      {/* CUADRO GRÁFICO DEL HORARIO */}
      <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-900/5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <th className="p-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Bloque</th>
              {DAYS.map(dia => (
                <th key={dia} className="p-5 text-center text-sm font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800">
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {TIME_BLOCKS.map((block, idx) => (
              <tr key={idx} className={block.type === 'break' ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}>
                <td className="p-4 border-r border-slate-100 dark:border-slate-800 bg-slate-50/20">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{block.label}</span>
                    <span className="text-[11px] font-bold text-slate-400">{block.range}</span>
                  </div>
                </td>

                {block.type ? (
                  <td colSpan={5} className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3 text-slate-300 dark:text-slate-600 font-black italic text-[10px] uppercase tracking-[0.4em]">
                      {block.p === 'receso' ? <Coffee size={14} /> : <Utensils size={14} />}
                      {block.label}
                    </div>
                  </td>
                ) : (
                  DAYS.map(dia => {
                    // Lógica de filtrado: Docente ve lo suyo / Secretaria ve por curso
                    const session = data.find(s => 
                      s.day === dia && 
                      Number(s.period) === Number(block.p) &&
                      (role === 'DOCENTE' || (selectedCourse === '' || s.courseName === selectedCourse))
                    );

                    return (
                      <td key={dia} className="p-2 min-w-[200px] transition-all duration-300">
                        {session ? (
                          <div className={`group/card relative p-4 rounded-2xl border-l-[6px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                            session.isTechnical 
                              ? 'bg-purple-50/80 dark:bg-purple-900/20 border-purple-500' 
                              : 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-500'
                          }`}>
                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight mb-2 line-clamp-2">
                              {session.subjectName}
                            </p>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                <LayoutGrid size={12} className="text-slate-400" />
                                {session.courseName}
                              </span>
                              {role !== 'DOCENTE' && (
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                  <User size={12} />
                                  {session.teacherName}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full min-h-[90px] rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800/40 flex items-center justify-center group/empty transition-colors hover:border-slate-200">
                            {(role === 'SECRETARIA' || role === 'DIRECTOR') && selectedCourse && (
                              <button className="opacity-0 group-hover/empty:opacity-100 p-2 bg-blue-600 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-90">
                                <Plus size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScheduleSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
            <div className="h-[600px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>
        </div>
    );
}