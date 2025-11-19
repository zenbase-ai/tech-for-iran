"use client"

import { ThemeProvider, type ThemeProviderProps } from "next-themes"

export const NextThemeProvider: React.FC<ThemeProviderProps> = ({ children, ...props }) => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem {...props}>
    {children}
  </ThemeProvider>
)
