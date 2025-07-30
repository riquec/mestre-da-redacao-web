"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Instagram, Mail, MessageSquare, ArrowLeft } from "lucide-react"
import { useLogger } from "@/lib/logger"
import { toast } from "sonner"

export default function Contato() {
  const log = useLogger('ContatoPage', '/contato')

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    // Força tema light e remove dark mode
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    
    log.info('Página de contato carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced' }
    })
  }, [log])

  // Regras de negócio centralizadas
  const handleContactClick = (method: string, value: string) => {
    log.info('Clique em método de contato', {
      action: 'contact_method_click',
      metadata: { method, value }
    })

    switch(method) {
      case 'instagram':
        window.open('https://instagram.com/mestre_redacao', '_blank')
        break
      case 'email':
        window.open(`mailto:${value}`, '_blank')
        break
      case 'whatsapp':
        const phoneNumber = value.replace(/\D/g, '')
        const message = encodeURIComponent('Oi! 👋 Queria saber mais sobre o Mestre da Redação! Como funciona a plataforma e quais são os planos disponíveis? Poderia me explicar? 😊📝')
        window.open(`https://wa.me/55${phoneNumber}?text=${message}`, '_blank')
        toast.success('Redirecionando para o WhatsApp...')
        break
    }
  }

  const handleNavigationClick = (destination: string, action: string) => {
    log.info('Clique em navegação', {
      action,
      metadata: { destination, source: 'contato_page' }
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b bg-blue-50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3 md:py-4 px-4">
          <Link href="/" onClick={() => handleNavigationClick('/', 'logo_click')}>
            <h1 className="text-xl md:text-2xl font-bold text-blue-800 hover:text-blue-600 transition-colors">
              Mestre da Redação
            </h1>
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/login" onClick={() => handleNavigationClick('/login', 'header_login_click')}>
              <Button 
                variant="outline" 
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 text-sm"
              >
                Entrar
              </Button>
            </Link>
            <Link href="/register" onClick={() => handleNavigationClick('/register', 'header_register_click')}>
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-sm"
              >
                Cadastrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8 md:py-12 px-4 bg-white">
        <Link 
          href="/" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 md:mb-8 transition-colors"
          onClick={() => handleNavigationClick('/', 'back_button_click')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="text-sm md:text-base">Voltar para a página inicial</span>
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mb-4">
              Entre em contato
            </h1>
            <p className="text-lg md:text-xl text-blue-700 max-w-2xl mx-auto leading-relaxed">
              Estamos à disposição para ajudar você a alcançar a nota máxima na redação
            </p>
          </div>

          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12 md:mb-16">
            <Card className="border-blue-200 hover:shadow-lg transition-all hover:scale-105 bg-white">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Instagram className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                </div>
                <CardTitle className="text-center text-blue-800 text-lg md:text-xl">Instagram</CardTitle>
                <CardDescription className="text-center text-blue-600 text-sm md:text-base">
                  Siga-nos nas redes sociais
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-base md:text-lg font-medium text-blue-900 mb-4">@mestre_redacao</p>
                <Button 
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 w-full text-sm md:text-base"
                  onClick={() => handleContactClick('instagram', '@mestre_redacao')}
                >
                  Seguir
                </Button>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 hover:shadow-lg transition-all hover:scale-105 bg-white">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 md:h-7 md:w-7 text-yellow-600" />
                </div>
                <CardTitle className="text-center text-blue-800 text-lg md:text-xl">Email</CardTitle>
                <CardDescription className="text-center text-blue-600 text-sm md:text-base">
                  Envie-nos uma mensagem
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm md:text-base font-medium text-blue-900 mb-4 break-words leading-relaxed">
                  mestredaredacao2025@gmail.com
                </p>
                <Button 
                  variant="outline" 
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 w-full text-sm md:text-base"
                  onClick={() => handleContactClick('email', 'mestredaredacao2025@gmail.com')}
                >
                  Enviar email
                </Button>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-lg transition-all hover:scale-105 bg-white sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 md:h-7 md:w-7 text-green-600" />
                </div>
                <CardTitle className="text-center text-blue-800 text-lg md:text-xl">WhatsApp</CardTitle>
                <CardDescription className="text-center text-blue-600 text-sm md:text-base">
                  Atendimento rápido
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-base md:text-lg font-medium text-blue-900 mb-4">(21) 98112-0169</p>
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-white w-full text-sm md:text-base shadow-md hover:shadow-lg transition-all"
                  onClick={() => handleContactClick('whatsapp', '21981120169')}
                >
                  Conversar
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 p-6 md:p-8 rounded-xl border border-blue-200 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 text-center">
              Horário de atendimento
            </h2>
            <p className="text-center text-blue-700 mb-6 text-sm md:text-base max-w-2xl mx-auto">
              Nossa equipe está disponível para atendê-lo nos seguintes horários:
            </p>
            <div className="max-w-md mx-auto bg-white rounded-lg p-4 md:p-6 shadow-sm">
              <div className="flex justify-between py-3 border-b border-blue-200">
                <span className="font-medium text-blue-800 text-sm md:text-base">Segunda a Sexta</span>
                <span className="text-blue-700 text-sm md:text-base">8h às 20h</span>
              </div>
              <div className="flex justify-between py-3 border-b border-blue-200">
                <span className="font-medium text-blue-800 text-sm md:text-base">Sábado</span>
                <span className="text-blue-700 text-sm md:text-base">9h às 15h</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="font-medium text-blue-800 text-sm md:text-base">Domingo e Feriados</span>
                <span className="text-blue-700 text-sm md:text-base">Fechado</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t py-6 md:py-8 bg-blue-900 text-white">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-lg md:text-xl font-bold">Mestre da Redação</h2>
              <p className="text-blue-200 text-xs md:text-sm">
                © {new Date().getFullYear()} Todos os direitos reservados
              </p>
            </div>
            <div className="flex gap-4 md:gap-6">
              <Link 
                href="/termos" 
                className="text-blue-200 hover:text-white text-sm transition-colors"
                onClick={() => handleNavigationClick('/termos', 'footer_termos_click')}
              >
                Termos
              </Link>
              <Link 
                href="/privacidade" 
                className="text-blue-200 hover:text-white text-sm transition-colors"
                onClick={() => handleNavigationClick('/privacidade', 'footer_privacidade_click')}
              >
                Privacidade
              </Link>
              <Link 
                href="/contato" 
                className="text-blue-200 hover:text-white text-sm transition-colors"
                onClick={() => handleNavigationClick('/contato', 'footer_contato_click')}
              >
                Contato
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
