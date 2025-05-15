import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Instagram, Mail, MessageSquare, ArrowLeft } from "lucide-react"

export default function Contato() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-blue-50">
        <div className="container flex items-center justify-between py-4">
          <Link href="/">
            <h1 className="text-2xl font-bold text-blue-800">Mestre da Redação</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700">Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-12">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a página inicial
        </Link>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">Entre em contato</h1>
            <p className="text-xl text-blue-700">
              Estamos à disposição para ajudar você a alcançar a nota máxima na redação
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-blue-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Instagram className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-center text-blue-800">Instagram</CardTitle>
                <CardDescription className="text-center text-blue-600">Siga-nos nas redes sociais</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg font-medium text-blue-900 mb-4">@mestre_redacao</p>
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  Seguir
                </Button>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-center text-blue-800">Email</CardTitle>
                <CardDescription className="text-center text-blue-600">Envie-nos uma mensagem</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-base font-medium text-blue-900 mb-4 break-words">mestredaredacao2025@gmail.com</p>
                <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                  Enviar email
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-center text-blue-800">WhatsApp</CardTitle>
                <CardDescription className="text-center text-blue-600">Atendimento rápido</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg font-medium text-blue-900 mb-4">(21) 98112-0169</p>
                <Button className="bg-green-500 hover:bg-green-600 text-white">Conversar</Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 bg-blue-50 p-8 rounded-xl border border-blue-200">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">Horário de atendimento</h2>
            <p className="text-center text-blue-700 mb-6">
              Nossa equipe está disponível para atendê-lo nos seguintes horários:
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex justify-between py-2 border-b border-blue-200">
                <span className="font-medium text-blue-800">Segunda a Sexta</span>
                <span className="text-blue-700">8h às 20h</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blue-200">
                <span className="font-medium text-blue-800">Sábado</span>
                <span className="text-blue-700">9h às 15h</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-blue-800">Domingo e Feriados</span>
                <span className="text-blue-700">Fechado</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t py-8 bg-blue-900 text-white">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Mestre da Redação</h2>
              <p className="text-blue-200 text-sm">© {new Date().getFullYear()} Todos os direitos reservados</p>
            </div>
            <div className="flex gap-6">
              <Link href="/termos" className="text-blue-200 hover:text-white">
                Termos
              </Link>
              <Link href="/privacidade" className="text-blue-200 hover:text-white">
                Privacidade
              </Link>
              <Link href="/contato" className="text-blue-200 hover:text-white">
                Contato
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
