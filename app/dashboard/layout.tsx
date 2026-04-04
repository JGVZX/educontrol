import { ReactNode } from 'react';
// Ajustamos las rutas para que coincidan con la carpeta 'components' normal
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { UserProvider } from '@/context/UserContext'; 

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    // El Provider envuelve todo para dar acceso a la sesión
    <UserProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex">
        
        {/* 1. SIDEBAR FIJO A LA IZQUIERDA */}
        <Sidebar />

        {/* 2. CONTENIDO PRINCIPAL (A la derecha del Sidebar) */}
        {/* Agregamos 'w-full' para que ocupe el espacio restante */}
        <main className="flex-1 ml-64 min-h-screen flex flex-col transition-all duration-300">
          
          {/* Topbar arriba */}
          <Topbar />
          
          {/* El contenido cambiante (Páginas) */}
          <div className="p-8 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>

        </main>
        
      </div>
    </UserProvider>
  );
}