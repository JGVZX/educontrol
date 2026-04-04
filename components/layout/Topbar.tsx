'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext'; 
import { searchGlobalDirectory, SearchResults } from './actions'; // <-- IMPORTAMOS EL SERVER ACTION
import { 
  Bell, Search, User, LogOut, Settings, 
  AlertTriangle, CheckCircle, Clock, Calendar, ChevronRight,
  Shield, GraduationCap, Headphones, MonitorSmartphone, BookOpen, UserCircle, Loader2, FileText
} from 'lucide-react';

/* ==========================================================================
   COMPONENTE PRINCIPAL: TOPBAR (Omnisearch Integrado)
   ========================================================================== */
export default function Topbar() {
  const { user, role } = useUser();
  const router = useRouter();
  
  // --- Estados de la Interfaz ---
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  
  // --- Estados del Motor de Búsqueda ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({ estudiantes: [], cursos: [] });
  
  // --- Referencias para control de clics ---
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Controlador del Buscador en Vivo (Server Action Integrado) ---
  useEffect(() => {
    const fetchResults = async () => {
        if (searchQuery.trim().length > 1 && user?.email && role) {
            setIsSearching(true);
            try {
                // Invocación segura al backend usando Server Actions (Aislamiento RBAC)
                const results = await searchGlobalDirectory(searchQuery, role, user.email);
                setSearchResults(results);
            } catch (error) {
                console.error("Error en el sistema de búsqueda:", error);
                setSearchResults({ estudiantes: [], cursos: [] }); 
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults({ estudiantes: [], cursos: [] });
            setIsSearching(false);
        }
    };

    // Debounce de 400ms para no saturar la base de datos
    const timeoutId = setTimeout(fetchResults, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, role, user?.email]);

  // Redirección del usuario
  const handleResultClick = (type: 'ESTUDIANTE' | 'CURSO', id: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    const targetRoute = type === 'ESTUDIANTE' ? `/dashboard/estudiantes/${id}` : `/dashboard/cursos/${id}`;
    router.push(targetRoute);
  };

  // --- Configuración Dinámica de Tema por Rol ---
  const roleTheme = useMemo(() => {
    const baseTheme = { dot: 'bg-blue-400', avatarBg: 'bg-blue-600', text: 'text-blue-700', ring: 'ring-blue-200' };
    switch (role) {
      case 'DIRECTOR': return { ...baseTheme, icon: Shield };
      case 'SECRETARIA': return { ...baseTheme, icon: Headphones };
      case 'ADMIN_SISTEMA': return { ...baseTheme, icon: MonitorSmartphone };
      case 'DOCENTE':
      default: return { ...baseTheme, icon: GraduationCap }; 
    }
  }, [role]);

  // --- Generador de Notificaciones Dinámicas ---
  const notifications = useMemo(() => {
    const baseStyle = "text-blue-600 bg-blue-50";
    switch (role) {
        case 'DIRECTOR':
            return [
                { id: 1, title: 'Auditoría Pendiente', desc: 'Faltan 3 docentes por cerrar el mes.', time: 'Hace 2 horas', icon: AlertTriangle, color: baseStyle, link: '/dashboard/auditoria' },
                { id: 2, title: 'Nuevas Matrículas', desc: 'Se han registrado 12 nuevos ingresos.', time: 'Hace 5 horas', icon: CheckCircle, color: baseStyle, link: '/dashboard/estudiantes' }
            ];
        case 'DOCENTE':
            return [
                { id: 3, title: 'Cierre de Calificaciones', desc: 'Evalúa el mes. Cierra en 4 días.', time: 'Hoy, 08:00 AM', icon: Calendar, color: baseStyle, link: '/dashboard/notas' },
                { id: 4, title: 'Reunión de Área', desc: 'Recordatorio metodológico este viernes.', time: 'Ayer', icon: Clock, color: baseStyle, link: '/dashboard/calendario' }
            ];
        case 'SECRETARIA':
            return [
                { id: 5, title: 'Solicitud de Récord', desc: 'Estudiante solicita impresión de récord.', time: 'Hace 10 min', icon: FileText, color: baseStyle, link: '/dashboard/notas' },
            ];
        default:
            return [
                { id: 7, title: 'Respaldo de Sistema', desc: 'Base de datos sincronizada correctamente.', time: '02:00 AM', icon: CheckCircle, color: baseStyle, link: '#' }
            ];
    }
  }, [role]);

  const handleNotificationClick = (link: string) => {
      setIsNotifOpen(false);
      if (link && link !== '#') router.push(link);
  };

  // Renderizado esqueleto si no hay usuario
  if (!user) {
      return (
        <header className="h-[88px] bg-white border-b border-slate-100 flex items-center px-8 z-30">
          <div className="w-64 h-10 bg-slate-100 animate-pulse rounded-full"></div>
        </header>
      );
  }

  const RoleIcon = roleTheme.icon; 

  return (
    <header className="h-[88px] bg-white/95 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 transition-all shadow-sm">
      
      {/* SECCIÓN IZQUIERDA: MOTOR DE BÚSQUEDA GLOBAL */}
      <div className="flex-1 flex items-center" ref={searchRef}>
        <div className="relative hidden md:block w-full max-w-xl group">
          <div className={`absolute left-5 top-0 bottom-0 flex items-center pointer-events-none transition-colors duration-300 ${isSearchOpen ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
            <Search size={18} strokeWidth={2.5} />
          </div>
          
          <input 
            type="text" 
            placeholder={role === 'DOCENTE' ? "Buscar: Mis aulas y estudiantes..." : "Búsqueda global: Expedientes, cursos..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-full text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 placeholder:text-slate-400"
          />
          
          {/* Contenedor de Resultados Dinámicos */}
          {isSearchOpen && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-3xl border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto hide-scrollbar">
                
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isSearching ? <Loader2 size={16} className="text-blue-600 animate-spin" /> : <Search size={16} className="text-slate-500" />}
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                            {isSearching ? 'Consultando registros...' : 'Resultados de consulta para'} <span className="text-blue-600 font-black">"{searchQuery}"</span>
                        </p>
                    </div>
                </div>

                <div className="p-3 space-y-2">
                    {/* Renderizado de Estudiantes */}
                    {searchResults.estudiantes.length > 0 && (
                        <div className="mb-3">
                            <p className="px-3 pt-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Expedientes Académicos</p>
                            {searchResults.estudiantes.map(est => (
                                <button 
                                    key={est.id}
                                    onClick={() => handleResultClick('ESTUDIANTE', est.id)}
                                    className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:text-blue-800 hover:bg-blue-50/80 rounded-2xl transition-all flex items-center justify-between group/btn border border-transparent hover:border-blue-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-colors">
                                            <UserCircle size={20} strokeWidth={2}/>
                                        </div>
                                        <div>
                                            <p className="leading-tight mb-0.5 text-slate-900 group-hover/btn:text-blue-800 transition-colors">{est.nombre}</p>
                                            <p className="text-[11px] text-slate-500 font-mono tracking-widest">{est.matricula}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-blue-500 opacity-0 group-hover/btn:opacity-100 transition-all translate-x-[-10px] group-hover/btn:translate-x-0" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Renderizado de Cursos */}
                    {searchResults.cursos.length > 0 && (
                        <div>
                            <p className="px-3 pt-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Asignaturas y Espacios</p>
                            {searchResults.cursos.map(curso => (
                                <button 
                                    key={curso.id}
                                    onClick={() => handleResultClick('CURSO', curso.id)}
                                    className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:text-blue-800 hover:bg-blue-50/80 rounded-2xl transition-all flex items-center justify-between group/btn border border-transparent hover:border-blue-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-colors">
                                            <BookOpen size={18} strokeWidth={2.5}/>
                                        </div>
                                        <div>
                                            <p className="leading-tight mb-0.5 text-slate-900 group-hover/btn:text-blue-800 transition-colors">{curso.nombre}</p>
                                            <p className="text-[11px] text-slate-500 uppercase tracking-widest">{curso.tipo}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-blue-500 opacity-0 group-hover/btn:opacity-100 transition-all translate-x-[-10px] group-hover/btn:translate-x-0" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Estado Vacío */}
                    {!isSearching && searchResults.estudiantes.length === 0 && searchResults.cursos.length === 0 && (
                        <div className="px-4 py-10 text-center text-slate-500 text-sm font-medium flex flex-col items-center gap-3">
                            <Search size={28} className="opacity-20 text-slate-400" />
                            No existen registros coincidentes.
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN DERECHA: PANELES DE CONTROL Y PERFIL */}
      <div className="flex items-center gap-4 lg:gap-6">
        
        {/* Panel de Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative p-3 rounded-2xl transition-all duration-300 border ${isNotifOpen ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 shadow-sm hover:shadow-md'}`}
          >
            <Bell size={20} strokeWidth={2.5} />
            {notifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-4 ring-white animate-pulse"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute top-full right-0 mt-4 w-[380px] bg-white rounded-3xl border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h4 className="font-bold text-base text-slate-900 tracking-tight">Centro de Alertas</h4>
                    <span className="text-[10px] font-bold bg-white shadow-sm border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full uppercase tracking-wider">{notifications.length} Pendientes</span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto hide-scrollbar p-3">
                    {notifications.map((n) => {
                        const Icon = n.icon;
                        return (
                            <div 
                                key={n.id} 
                                onClick={() => handleNotificationClick(n.link)}
                                className="p-4 rounded-2xl hover:bg-slate-50 hover:shadow-sm transition-all flex gap-4 items-start cursor-pointer group/notif mb-2 border border-transparent hover:border-slate-200"
                            >
                                <div className={`p-3 rounded-xl shrink-0 transition-transform group-hover/notif:scale-105 shadow-sm ${n.color}`}>
                                    <Icon size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 leading-tight group-hover/notif:text-blue-700 transition-colors">{n.title}</p>
                                    <p className="text-xs font-medium text-slate-600 mt-1.5 leading-relaxed">{n.desc}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2.5 uppercase tracking-widest">{n.time}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-slate-200 hidden md:block"></div>

        {/* Panel de Perfil de Usuario */}
        <div className="relative flex items-center gap-4 cursor-pointer group" ref={profileRef} onClick={() => setIsProfileOpen(!isProfileOpen)}>
          
          <div className="text-right hidden md:flex flex-col items-end">
            <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
              {user.nombre}
            </h4>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider group-hover:border-blue-200 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full ${roleTheme.dot}`}></div>
                {user.role?.replace('_', ' ')}
            </span>
          </div>
          
          <div className={`relative w-12 h-12 rounded-2xl text-white flex items-center justify-center font-black text-lg shadow-md transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg ring-4 ring-transparent group-hover:${roleTheme.ring} ${roleTheme.avatarBg}`}>
            <RoleIcon size={24} strokeWidth={2.5} />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-white rounded-full z-10"></span>
          </div>

          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-5 w-64 bg-white rounded-3xl border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-50 overflow-hidden py-3 animate-in fade-in slide-in-from-top-4 duration-200 origin-top-right">
                
                <div className="px-5 py-4 border-b border-slate-100 mb-2 bg-slate-50">
                    <p className="text-sm font-bold text-slate-900 truncate mb-1">{user.nombre}</p>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className={`w-1.5 h-1.5 rounded-full ${roleTheme.dot}`}></div>
                        {user.role}
                    </span>
                </div>
                
                <div className="px-3 space-y-1">
                    <button 
                        onClick={() => router.push('/dashboard/perfil')}
                        className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-all"
                    >
                        <User size={18} strokeWidth={2.5} className="text-slate-400"/> Mi Perfil Profesional
                    </button>
                    <button 
                        onClick={() => router.push('/dashboard/configuracion')}
                        className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-all"
                    >
                        <Settings size={18} strokeWidth={2.5} className="text-slate-400"/> Panel de Configuración
                    </button>
                </div>
                
                <div className="h-px bg-slate-100 my-2 mx-5"></div>
                
                <div className="px-3">
                    <button 
                        onClick={() => router.push('/login')}
                        className="w-full text-left px-4 py-3 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-3 transition-all"
                    >
                        <LogOut size={18} strokeWidth={2.5} className="text-rose-400"/> Finalizar Sesión
                    </button>
                </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}