'use client';

import { BookOpen, Users, Clock, CheckCircle } from 'lucide-react';

export default function TeacherView() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel Docente</h1>
           <p className="text-slate-500">Bienvenido, Prof. Juan Pérez</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
            + Subir Calificaciones
        </button>
      </div>

      {/* Tarjetas del Profesor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BookOpen size={24}/></div>
                <div>
                    <h3 className="text-2xl font-bold dark:text-white">5</h3>
                    <p className="text-sm text-slate-500">Mis Asignaturas</p>
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Users size={24}/></div>
                <div>
                    <h3 className="text-2xl font-bold dark:text-white">142</h3>
                    <p className="text-sm text-slate-500">Mis Estudiantes</p>
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Clock size={24}/></div>
                <div>
                    <h3 className="text-2xl font-bold dark:text-white">P2</h3>
                    <p className="text-sm text-slate-500">Cierre de Notas</p>
                </div>
            </div>
        </div>
      </div>

      {/* Aquí iría la tabla de cursos del profesor */}
      <div className="p-10 border-2 border-dashed border-slate-300 rounded-xl text-center text-slate-400">
          Aquí iría el Horario del Profesor y sus Listas de Clases
      </div>
    </div>
  );
}