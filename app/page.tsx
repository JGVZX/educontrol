import Link from "next/link";
import { 
  ArrowRight, 
  LayoutDashboard, 
  Database, 
  Users, 
  Code2, 
  Cpu, 
  BarChart3, 
  ShieldCheck,
  CheckCircle2,
  Zap,
  BookOpen
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50/60 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 text-slate-800 dark:text-white transition-colors duration-300 relative overflow-x-hidden">
      
      {/* --- GLOW DE FONDO (ATMÓSFERA) --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-[1000px] h-[50vh] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] -z-10 opacity-60 dark:opacity-100 pointer-events-none" />

      {/* =========================================
          1. NAVBAR (Navegación Principal)
         ========================================= */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50 transition-all supports-[backdrop-filter]:bg-white/60">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* LOGO (Ahora es un Link al inicio y corrige el color en dark mode) */}
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white leading-none">
                  EduControl
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Gestión Escolar
                </span>
              </div>
            </Link>

            {/* ACCIONES DERECHA (Login Dividido) */}
            <div className="flex items-center gap-3 md:gap-4">
              <ThemeToggle />
              
              {/* Botón Docente (Enlace sutil) */}
              <Link 
                href="/login?role=docente" 
                className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors"
              >
                <Users size={18} />
                Portal Docente
              </Link>
              
              {/* Botón Admin (Botón fuerte) */}
              <Link 
                href="/login?role=admin" 
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-full transition-all shadow-lg shadow-slate-200 dark:shadow-blue-900/40 hover:scale-105 active:scale-95"
              >
                <ShieldCheck size={16} />
                <span className="hidden sm:inline">Administración</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* =========================================
          2. HERO SECTION (Portada)
         ========================================= */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 text-center flex flex-col items-center z-10">
        
        {/* Badge Tesis */}
        <div className="mb-8 px-4 py-1.5 bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-full shadow-sm animate-in fade-in zoom-in duration-500 inline-block">
          <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Sistema Oficial v1.0
          </span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white drop-shadow-sm max-w-5xl leading-tight">
          La nueva era de la <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 dark:from-blue-400 dark:via-violet-400 dark:to-blue-400 animate-gradient bg-300%">
            Gestión Académica Digital
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mb-10 leading-relaxed font-medium mx-auto">
          Simplifica la administración escolar, automatiza calificaciones y cumple con las normativas del <span className="text-blue-600 dark:text-blue-400 font-bold">MINERD</span>. 
          Una herramienta diseñada para potenciar a docentes y directores.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link href="/login?role=docente" className="group flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-blue-900/20 w-full sm:w-auto">
            Acceso Docente
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login?role=admin" className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md w-full sm:w-auto">
            Acceso Director
          </Link>
        </div>
      </section>

      {/* =========================================
          3. DASHBOARD PREVIEW
         ========================================= */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-24">
        <div className="relative rounded-t-2xl md:rounded-t-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 md:p-3 shadow-2xl shadow-blue-900/5 dark:shadow-none mx-auto overflow-hidden ring-1 ring-slate-900/5">
          <div className="h-6 md:h-8 bg-slate-50 dark:bg-slate-950 rounded-t-xl md:rounded-t-2xl flex items-center px-4 gap-2 border-b border-slate-100 dark:border-slate-800/50">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/50 p-8 h-[300px] md:h-[500px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-6">
             <div className="p-6 bg-white dark:bg-slate-900 rounded-full shadow-lg animate-pulse">
                <LayoutDashboard size={64} className="text-blue-500 opacity-80" />
             </div>
             <p className="text-sm font-bold tracking-widest uppercase">Vista Previa del Sistema</p>
          </div>
        </div>
      </div>

      {/* =========================================
          4. NUEVA SECCIÓN: IMPORTANCIA Y VALOR
         ========================================= */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Transformando la Gestión Educativa</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              EduControl no es solo un software, es la solución definitiva para modernizar los procesos escolares y eliminar la burocracia manual.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Beneficio 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Automatización Total</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Olvídate de calcular promedios manualmente. El sistema procesa notas, asistencia y reportes al instante, reduciendo errores humanos al 0%.
              </p>
            </div>

            {/* Beneficio 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Normativa MINERD</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Diseñado específicamente siguiendo los estándares del Ministerio de Educación. Escalas literales, cálculo de asistencia y formatos oficiales.
              </p>
            </div>

            {/* Beneficio 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Adiós al Papel</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Centraliza expedientes, historiales y documentos en una base de datos segura en la nube. Acceso 24/7 desde cualquier dispositivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          5. TECH STACK
         ========================================= */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
                Infraestructura Tecnológica de Vanguardia
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2"><Code2 className="text-black dark:text-white"/> <span className="font-bold">Next.js 14</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-600 rounded-sm"></div> <span className="font-bold">TypeScript</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-cyan-500 rounded-full"></div> <span className="font-bold">Tailwind</span></div>
                <div className="flex items-center gap-2"><Database className="text-blue-500"/> <span className="font-bold">PostgreSQL</span></div>
                <div className="flex items-center gap-2"><Cpu className="text-slate-600 dark:text-slate-400"/> <span className="font-bold">Prisma</span></div>
            </div>
        </div>
      </section>

      {/* =========================================
          6. MÓDULOS PRINCIPALES
         ========================================= */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 mb-6">
              <BarChart3 size={28} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Control Académico Preciso</h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              El corazón de EduControl. Permite a los docentes registrar calificaciones parciales, prácticas y exámenes. El sistema se encarga de las matemáticas complejas.
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3 text-slate-700 dark:text-slate-300"><CheckCircle2 className="text-green-500" size={20}/> Validación de rango (0-100)</li>
              <li className="flex gap-3 text-slate-700 dark:text-slate-300"><CheckCircle2 className="text-green-500" size={20}/> Cálculo de literales (A, B, C, D)</li>
              <li className="flex gap-3 text-slate-700 dark:text-slate-300"><CheckCircle2 className="text-green-500" size={20}/> Bloqueo de periodos cerrados</li>
            </ul>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 h-[300px] flex items-center justify-center">
             <span className="text-slate-400 font-medium">Ilustración de Tabla de Notas</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center flex-row-reverse">
           <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 h-[300px] flex items-center justify-center md:order-1">
             <span className="text-slate-400 font-medium">Ilustración de Roles</span>
          </div>
          <div className="md:order-2">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Seguridad Institucional</h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Cada usuario tiene su lugar. Los administradores tienen visión global, mientras que los docentes acceden únicamente a sus cargas académicas asignadas.
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3 text-slate-700 dark:text-slate-300"><CheckCircle2 className="text-green-500" size={20}/> Autenticación Encriptada</li>
              <li className="flex gap-3 text-slate-700 dark:text-slate-300"><CheckCircle2 className="text-green-500" size={20}/> Logs de Actividad</li>
              <li className="flex gap-3 text-slate-700 dark:text-slate-300"><CheckCircle2 className="text-green-500" size={20}/> Gestión de Permisos</li>
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================
          7. FOOTER
         ========================================= */}
      <footer className="py-12 border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-slate-900 text-sm font-bold">E</div>
                <div className="flex flex-col">
                   <span className="font-bold text-slate-700 dark:text-slate-200 leading-none">EduControl</span>
                   <span className="text-[10px] text-slate-400">Sistema de Gestión</span>
                </div>
            </div>
            
            <p className="text-sm text-slate-500 text-center">
                © 2026 Proyecto de Tesis • Ingeniería en Sistemas
            </p>

            <div className="flex gap-6">
                <Link href="#" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                    GitHub Repo
                </Link>
                <Link href="#" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                    Documentación Técnica
                </Link>
            </div>
        </div>
      </footer>

    </main>
  );
}