"use client"

import { ProfessorRoute } from "@/components/professor-route"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    <ProfessorRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="container flex items-center justify-between h-16">
            <Link href="/professor/dashboard" className="text-xl font-bold text-blue-800 whitespace-nowrap">
              Mestre da Redação - Professor
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm sm:text-base">Olá, {userName}</span>
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
    </ProfessorRoute>
  )
} 