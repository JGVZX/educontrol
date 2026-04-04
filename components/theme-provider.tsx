"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Si usas una versión reciente de next-themes, los tipos vienen incluidos o se infieren.
// Usamos 'any' aquí temporalmente para evitar conflictos de tipado estricto en la tesis, 
// pero idealmente se importan de la librería.

export function ThemeProvider({ children, ...props }: any) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}