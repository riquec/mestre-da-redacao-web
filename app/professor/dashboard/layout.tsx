"use client"

import { Badge } from "@/components/ui/badge"

import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Video, FileText, Inbox, MessageSquare, Settings, LogOut, Menu, Users, Folder } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMobile } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function ProfessorDashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useMobile()
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

  const NavItems = () => (
    <>
      <Link href="/professor/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100">
        <Home className="h-5 w-5" />
        <span>Início</span>
      </Link>
      <Link
        href="/professor/dashboard/aulas"
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        <Video className="h-5 w-5" />
        <span>Videoaulas</span>
      </Link>
      <Link
        href="/professor/dashboard/propostas"
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        <FileText className="h-5 w-5" />
        <span>Propostas</span>
      </Link>
      <Link
        href="/professor/dashboard/materiais"
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        <Folder className="h-5 w-5" />
        <span>Material didático</span>
      </Link>
      <Link
        href="/professor/dashboard/correcoes"
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        <Inbox className="h-5 w-5" />
        <span>Correções</span>
      </Link>

      <Link
        href="/professor/dashboard/alunos"
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        <Users className="h-5 w-5" />
        <span>Alunos</span>
      </Link>
      <Link
        href="/professor/dashboard/parceiros"
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        <Users className="h-5 w-5" />
        <span>Parceiros</span>
      </Link>
      <Link
        href="/professor/dashboard/chat"
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        <MessageSquare className="h-5 w-5" />
        <span>Chat</span>
      </Link>
      <Link
        href="/professor/dashboard/configuracoes"
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        <Settings className="h-5 w-5" />
        <span>Configurações</span>
      </Link>
    </>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="flex flex-col h-full">
                    <div className="py-4 border-b">
                      <Link href="/" className="text-xl font-bold">
                        Mestre da Redação
                      </Link>
                      <p className="text-sm text-gray-500">Área do Professor</p>
                    </div>
                    <nav className="flex-1 py-4 flex flex-col gap-1">
                      <NavItems />
                    </nav>
                    <div className="py-4 border-t">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sair</span>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Link href="/" className="text-xl font-bold">
              Mestre da Redação
            </Link>
            <Badge variant="outline" className="bg-gray-100">
              Professor
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Avatar" />
              <AvatarFallback>PF</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar (desktop only) */}
        {!isMobile && (
          <aside className="w-64 border-r flex-shrink-0">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <p className="text-sm text-gray-500">Área do Professor</p>
              </div>
              <nav className="flex-1 py-6 px-3 flex flex-col gap-1">
                <NavItems />
              </nav>
              <div className="p-3 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </Button>
              </div>
            </div>
          </aside>
        )}

        {/* Content */}
        <main className="flex-1">
          <div className="container py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
