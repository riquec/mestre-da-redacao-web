"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLogger } from "@/lib/logger"

export default function EmConstrucao() {
  const log = useLogger('EmConstrucaoPage', '/em-construcao')

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página Em Construção carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced' }
    })
  }, [log])

  const handleBackClick = () => {
    log.info('Clique em voltar ao dashboard', {
      action: 'back_to_dashboard',
      metadata: { from: '/em-construcao' }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Construction className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Em Construção</CardTitle>
          <CardDescription className="text-center text-blue-700">
            Estamos trabalhando para trazer essa funcionalidade em breve!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600 text-base md:text-lg">
            O chat com o professor está em desenvolvimento e será disponibilizado em breve. 
            Agradecemos sua compreensão enquanto trabalhamos para melhorar sua experiência.
          </p>
          <div className="flex justify-center">
            <Link href="/dashboard" onClick={handleBackClick}>
              <Button variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-50 transition-colors">Voltar ao Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 