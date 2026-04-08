'use client';

import { useUser } from '@/context/UserContext';
import { 
  LayoutDashboard, Users, BookOpen, GraduationCap, 
  FileText, ShieldCheck, LogOut, CalendarCheck, Activity, Briefcase, Settings, CalendarDays
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { user, logout } = useUser();
  const pathname = usePathname();

  if (!user) return null; // Si no hay usuario, no mostrar nada

  // --- LÓGICA DINÁMICA PARA EL BOTÓN DE ADMINISTRACIÓN ---
  // Cambiamos el nombre y el icono dependiendo de quién inicie sesión
  const getAdminMenuDetails = () => {
    switch (user.role) {
      case 'ADMIN_SISTEMA': return { title: 'Gestión Maestra', icon: ShieldCheck };
      case 'DIRECTOR': return { title: 'Monitor Directivo', icon: Activity };
      case 'SECRETARIA': return { title: 'Centro Operativo', icon: Users };
      case 'DOCENTE': return { title: 'Mi Espacio', icon: Briefcase };
      default: return { title: 'Administración', icon: Settings };
    }
  };

  const adminMenu = getAdminMenuDetails();

  // --- DEFINICIÓN DE MENÚS Y PERMISOS ---
  const menuItems = [
    { 
      title: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      roles: ['DIRECTOR', 'DOCENTE', 'SECRETARIA', 'ADMIN_SISTEMA'] 
    },
    { 
      // Usamos los detalles dinámicos generados arriba
      title: adminMenu.title, 
      path: '/dashboard/administracion', 
      icon: adminMenu.icon, 
      roles: ['DIRECTOR', 'ADMIN_SISTEMA', 'SECRETARIA', 'DOCENTE'] // ¡Ahora todos tienen acceso a su propia vista!
    },
    { 
      title: 'Mi Horario', 
      path: '/dashboard/horario', 
      icon: CalendarDays, 
      roles: ['DIRECTOR', 'DOCENTE'] 
    },
    { 
      title: 'Estudiantes', 
      path: '/dashboard/estudiantes', 
      icon: GraduationCap, 
      roles: ['DIRECTOR', 'SECRETARIA', 'DOCENTE'] 
    },
    { 
      title: 'Asistencia', 
      path: '/dashboard/asistencia', 
      icon: CalendarCheck, 
      roles: ['DIRECTOR', 'DOCENTE'] 
    },
    { 
      title: 'Calificaciones', 
      path: '/dashboard/notas', 
      icon: BookOpen, 
      roles: ['DIRECTOR', 'DOCENTE', 'SECRETARIA'] 
    },
    { 
      title: 'Reportes Oficiales', 
      path: '/dashboard/reportes', 
      icon: FileText, 
      roles: ['DIRECTOR', 'SECRETARIA', 'DOCENTE', 'ADMIN_SISTEMA'] // <-- ADMIN_SISTEMA AGREGADO AQUÍ
    },
  ];

  // FILTRAR MENÚ SEGÚN EL ROL DEL USUARIO
  const allowedItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-72 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 z-40 border-r border-slate-800 shadow-2xl">
      
      {/* LOGO INSTITUCIONAL */}
      <div className="p-8 border-b border-slate-800/80 flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/20">
          E
        </div>
        <div>
           <span className="font-black text-2xl tracking-tighter leading-none block">EduControl</span>
           <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em]">Sistema de Gestión</span>
        </div>
      </div>

      {/* MENÚ DINÁMICO */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-4">Navegación Principal</p>
        
        {allowedItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-black' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white font-bold'
              }`}
            >
              <item.icon size={20} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform text-slate-500 group-hover:text-blue-400'} />
              <span className="tracking-tight">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* PERFIL DEL USUARIO Y LOGOUT (FOOTER) */}
      <div className="p-6 border-t border-slate-800/80 bg-slate-900/50">
        
        {/* Tarjeta de perfil resumida */}
        <div className="flex items-center gap-3 mb-6 px-2">
           <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black text-white">
              {user.nombre?.charAt(0) || 'U'}
           </div>
           <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate">{user.nombre}</p>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest truncate">{user.role.replace('_', ' ')}</p>
           </div>
        </div>

        <button 
          onClick={logout}
          className="flex items-center justify-center gap-3 w-full p-4 bg-slate-800 text-slate-300 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-bold group shadow-inner"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="uppercase text-[11px] tracking-widest">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}