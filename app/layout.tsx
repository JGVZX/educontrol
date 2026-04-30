import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import EduControlFloatingChat from "@/components/EduControlFloatingChat";

// 1. IMPORTA ESTO
import { UserProvider } from "@/context/UserContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduControl",
  description: "Sistema de Gestión Escolar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* 2. ENVUELVE TODO DENTRO DE ESTO */}
        <UserProvider>
            {children}

            <EduControlFloatingChat 
              userName="Usuario" 
              userRole="DOCENTE" 
            />
          </UserProvider>
        
      </body>
    </html>
  );
}