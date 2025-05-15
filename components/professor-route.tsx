"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface ProfessorRouteProps {
  children: React.ReactNode
}

export function ProfessorRoute({ children }: ProfessorRouteProps) {
  const { user, loading, role } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || role !== 'professor')) {
      toast.error("Acesso restrito a professores", {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#ef4444",
          color: "white",
          fontSize: "16px",
          padding: "16px",
        },
      })
      router.push("/dashboard")
    }
  }, [user, loading, role, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || role !== 'professor') {
    return null
  }

  return <>{children}</>
} 