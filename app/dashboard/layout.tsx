"use client"

import { AuthRoute } from "@/components/auth-route"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { AuthProvider } from "@/lib/auth-context"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, userName } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth)
        router.push("/")
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  return (
    <AuthRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="container flex items-center justify-between h-16">
            <Link href="/dashboard" className="text-xl font-bold text-blue-800 whitespace-nowrap">
              Mestre da Redação
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm sm:text-base">Olá, {userName}</span>
              <Link href="/dashboard/configuracoes">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  Configurações
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </nav>
        <main className="container py-8">
          {children}
        </main>
      </div>
    </AuthRoute>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  )
}
