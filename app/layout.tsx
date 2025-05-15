import type React from "react"
import type { Metadata } from "next"
import "../styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { AuthProvider } from "@/lib/auth-context"

export const metadata: Metadata = {
  title: "Mestre da Redação - Plataforma de Redação Online",
  description: "Plataforma online para assistir aulas e ter redações corrigidas com excelência",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-foreground">
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </AuthProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
