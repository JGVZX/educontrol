'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, Printer, Filter, Plus, 
  Clock, BookOpen, User, LayoutGrid, 
  Coffee, Utensils, MoreHorizontal 
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { getScheduleData, deleteScheduleBlock } from './actions';

// ==========================================================================
// INTERFACES ESTRICTAS
// ==========================================================================
export type DayOfWeek = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES';

export interface ScheduleSession {
  id: string;
  day: DayOfWeek;
  period: number;
  subjectName: string;
  courseName: string; // Aquí llegará "4to Informática A" desde el action
  teacherName: string;
  isTechnical: boolean;
}

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
  const [data, setData] = useState<ScheduleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  useEffect(() => {
    async function init() {
      if (user?.email && role) {
        setLoading(true);
        const result = await getScheduleData(user.email, role);
        setData(result as ScheduleSession[]);
        
        // Si hay datos y somos secretaria/director, preseleccionar el primer curso para evitar un horario en blanco
        if (result.length > 0 && (role === 'SECRETARIA' || role === 'DIRECTOR')) {
            const uniqueCourses = Array.from(new Set(result.map((s: any) => s.courseName)));
            if (uniqueCourses.length > 0) setSelectedCourse(uniqueCourses[0] as string);
        }
        setLoading(false);
      }
    }
    init();
  }, [user, role]);

  // Lista de cursos únicos con su sección (Ej: "1ro Secundaria A")
  const availableCourses = useMemo(() => {
    const courses = Array.from(new Set(data.map(s => s.courseName)));
    return courses.sort(); // Orden alfabético
  }, [data]);

  // ==========================================================================
  // MOTOR DE IMPRESIÓN (PDF)
  // ==========================================================================
  const printSchedule = () => {
    if (data.length === 0) return alert("No hay datos en el itinerario para imprimir.");
    if (role !== 'DOCENTE' && !selectedCourse) return alert("Seleccione un curso para imprimir su horario.");

    const win = window.open('', '_blank');
    if (!win) return alert("Permita las ventanas emergentes para generar el PDF.");

    const today = new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });
    const targetName = role === 'DOCENTE' ? `Docente: ${user?.nombre}` : `Curso: ${selectedCourse}`;

    const printStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 2px; }
        .header p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;}
        .info-bar { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; table-layout: fixed; }
        th { background-color: #f8fafc; color: #475569; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; padding: 10px; border: 1px solid #cbd5e1; text-align: center; }
        td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; text-align: center; height: 60px; }
        .break-row { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #64748b; text-align: center; }
        .subject-title { font-weight: 900; font-size: 12px; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; }
        .subject-subtitle { color: #475569; font-size: 10px; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.02); z-index: -1; white-space: nowrap; font-weight: 900; }
        @media print {
            body { padding: 0; margin: 1cm; }
            button { display: none; }
        }
      </style>
    `;

    // Generar filas de la tabla
    const rows = TIME_BLOCKS.map(block => {
      if (block.type === 'break') {
        return `<tr>
                  <td style="font-weight: bold; width: 120px;">${block.label}<br><span style="font-size:9px; font-weight:normal;">${block.range}</span></td>
                  <td colspan="5" class="break-row">${block.label}</td>
                </tr>`;
      }

      const dayCells = DAYS.map(dia => {
        const session = data.find(s => 
          s.day === dia && 
          Number(s.period) === Number(block.p) &&
          (role === 'DOCENTE' || s.courseName === selectedCourse)
        );

        if (session) {
          const subtitle = role === 'DOCENTE' ? session.courseName : session.teacherName;
          return `<td>
                    <div class="subject-title">${session.subjectName}</div>
                    <div class="subject-subtitle">${subtitle}</div>
                  </td>`;
        }
        return `<td></td>`;
      }).join('');

      return `<tr>
                <td style="font-weight: bold; width: 120px; background-color:#f8fafc;">${block.label}<br><span style="font-size:9px; font-weight:normal; color:#64748b;">${block.range}</span></td>
                ${dayCells}
              </tr>`;
    }).join('');

    const content = `
        <div class="watermark">EDUCONTROL ITINERARIO</div>
        <div class="header">
            <h1>Itinerario Escolar Oficial</h1>
            <p>Politécnico Educativo - La Vega, Rep. Dom.</p>
        </div>
        <div class="info-bar">
            <span>${targetName}</span>
            <span>Fecha de Emisión: ${today}</span>
            <span>Año Escolar: 2025-2026</span>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Bloque Horario</th>
                    ${DAYS.map(d => `<th>${d}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div style="margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center;">
            Documento generado por EduControl. Los horarios están sujetos a cambios por la Dirección Académica.
        </div>
    `;

    win.document.write(`
      <html>
        <head>
            <title>Impresión de Horario</title>
            ${printStyles}
        </head>
        <body>
            ${content}
            <script>
                window.onload = () => { window.print(); }
            </script>
        </body>
      </html>
    `);
    win.document.close();
  };

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
                className="bg-transparent text-sm font-bold outline-none text-slate-700 dark:text-slate-200 min-w-[200px]"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <button 
            onClick={printSchedule}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
            title="Imprimir Horario"
          >
            <Printer size={20} className="text-slate-600 dark:text-slate-400 transition-colors" />
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
                            {/* Espacio vacío - Opcional: botón de agregar si lo requieres luego */}
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