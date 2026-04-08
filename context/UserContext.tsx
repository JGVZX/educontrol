'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Definimos la estructura del usuario real
interface User {
  id: string;
  nombre: string;
  email: string;
  role: 'DIRECTOR' | 'DOCENTE' | 'SECRETARIA' | 'ORIENTADOR' | 'ADMIN_SISTEMA';
}

interface UserContextType {
  user: User | null;
  role: string | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // AL CARGAR: Verificar si hay alguien guardado en "memoria" (localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('educontrol_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // FUNCIÓN LOGIN REAL
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('educontrol_user', JSON.stringify(userData)); // Guardar en memoria del navegador
    router.push('/dashboard'); // Mandar al dashboard
  };

  // FUNCIÓN LOGOUT REAL
  const logout = () => {
    setUser(null);
    localStorage.removeItem('educontrol_user');
    router.push('/'); // Mandar al login
  };

  return (
    <UserContext.Provider value={{ user, role: user?.role || null, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser debe usarse dentro de un UserProvider');
  return context;
};