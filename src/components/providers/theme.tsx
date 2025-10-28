"use client"

import { ThemeProvider, type ThemeProviderProps } from "next-themes"

export const NextThemeProvider: React.FC<ThemeProviderProps> = ({ children, ...props }) => (
  <ThemeProvider enableSystem defaultTheme="system" attribute="class" {...props}>
    {children}
  </ThemeProvider>
)
