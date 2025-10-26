"use client"

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, ...props }) => (
  <NextThemesProvider enableSystem defaultTheme="system" attribute="class" {...props}>
    {children}
  </NextThemesProvider>
)
