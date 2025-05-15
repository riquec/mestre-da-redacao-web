"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, GraduationCap, BookOpen, Award } from "lucide-react"
import { TestimonialCarousel } from "@/components/testimonial-carousel"
import { app } from "../lib/firebase"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const router = useRouter()
  const { user, role, loading } = useAuth()

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "professor") {
        router.push("/professor/dashboard")
      } else if (role === "student") {
        router.push("/dashboard")
      }
    }
  }, [user, role, loading, router])

  if (loading || (user && role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-blue-50">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold text-blue-800">Mestre da Redação</h1>
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

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-blue-900">
            Redação nota máxima começa com a <span className="text-blue-600">mentoria certa</span>
          </h1>
          <p className="mt-6 text-xl text-blue-700 max-w-3xl">
            Plataforma completa para assistir a aulas e ter suas redações corrigidas por professores especializados, com
            feedbacks detalhados em áudio e imagem.
          </p>
          <Link href="/register" className="mt-10">
            <Button size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700">
              Começar agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-16 text-blue-900">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <path d="m21 8-2 2-5.5-5.5 2-2 5.5 5.5Z"></path>
                  <path d="M19 10 9 20l-5.5-5.5L13.5 5 19 10Z"></path>
                  <path d="m9 20 3 3"></path>
                  <path d="M9.5 14.5 4 20"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2 text-blue-800">Assista às aulas</h3>
              <p className="text-blue-700">Acesse videoaulas exclusivas sobre técnicas de redação e temas atuais.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-yellow-600"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2 text-blue-800">Envie sua redação</h3>
              <p className="text-blue-700">Escolha uma proposta e envie sua redação para correção.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2 text-blue-800">Receba feedback detalhado</h3>
              <p className="text-blue-700">Obtenha correções com marcações visuais e explicações em áudio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Professor Section */}
      <section className="py-20 bg-blue-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4 text-blue-900">Conheça o Professor</h2>
          <p className="text-center text-blue-700 mb-12 max-w-2xl mx-auto">
            Aprenda com quem tem experiência e resultados comprovados
          </p>

          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/3">
                <div className="rounded-full overflow-hidden border-4 border-yellow-200 shadow-lg mx-auto w-64 h-64">
                  <img
                    src="/images/professor-marcos.jpeg"
                    alt="Professor Marcos Cortinovis Carvalho"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center mt-6">
                  <h3 className="text-2xl font-bold text-blue-800">Prof. Marcos Cortinovis Carvalho</h3>
                  <p className="text-blue-600 font-medium">Mestre em Língua Portuguesa - UFRJ</p>
                </div>
              </div>

              <div className="md:w-2/3 bg-white rounded-xl p-8 shadow-md border border-blue-100">
                <p className="text-blue-800 leading-relaxed mb-6">
                  O professor Marcos Cortinovis Carvalho atua no ensino de Língua Portuguesa há 20 anos. É mestre em
                  Língua Portuguesa pela UFRJ, com pesquisas voltadas para leitura e produção textual. Desde 2015,
                  dedica-se à correção de redações, acumulando ampla experiência, especialmente com a banca do ENEM.
                </p>
                <p className="text-blue-800 leading-relaxed mb-6">
                  Servidor público da Seeduc RJ, é também o criador de um método de mentoria eficaz, focado no
                  desenvolvimento da escrita e na preparação para concursos públicos.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">20 anos</p>
                      <p className="text-sm text-blue-600">de experiência</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Mestre</p>
                      <p className="text-sm text-blue-600">pela UFRJ</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Especialista</p>
                      <p className="text-sm text-blue-600">em banca ENEM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4 text-blue-900">O que nossos alunos dizem</h2>
          <p className="text-center text-blue-700 mb-16 max-w-2xl mx-auto">
            Veja como o Mestre da Redação tem ajudado estudantes a alcançarem seus sonhos
          </p>

          <TestimonialCarousel />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4 text-blue-900">Planos</h2>
          <p className="text-center text-blue-700 mb-16 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu desenvolvimento. Todos incluem acesso às videoaulas e propostas de redação.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Plano Básico */}
            <Card className="flex flex-col border-yellow-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4 bg-yellow-50 rounded-t-lg">
                <CardTitle className="text-yellow-700">Plano Básico</CardTitle>
                <CardDescription className="text-yellow-600">Para começar</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-blue-900">Grátis</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <span className="text-blue-800">Acesso ilimitado às videoaulas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <span className="text-blue-800">Acesso às propostas de redação</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                  Começar grátis
                </Button>
              </CardFooter>
            </Card>

            {/* Plano Médio */}
            <Card className="flex flex-col border-yellow-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4 bg-yellow-50 rounded-t-lg">
                <CardTitle className="text-yellow-700">Plano Médio</CardTitle>
                <CardDescription className="text-yellow-600">Para praticar regularmente</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-blue-900">R$9,90</span>
                  <span className="text-blue-700">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-blue-800">Tudo do plano básico</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-blue-800">2 correções de redação por mês</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                  Assinar plano
                </Button>
              </CardFooter>
            </Card>

            {/* Plano Mestre */}
            <Card className="flex flex-col border-blue-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4 bg-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700">Plano Mestre</CardTitle>
                <CardDescription className="text-blue-600">Para quem busca evolução</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-blue-900">R$19,90</span>
                  <span className="text-blue-700">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <span className="text-blue-800">Tudo do plano médio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <span className="text-blue-800">4 correções de redação por mês</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                  Assinar plano
                </Button>
              </CardFooter>
            </Card>

            {/* Plano Mestre++ */}
            <Card className="flex flex-col border-yellow-200 hover:shadow-md transition-shadow bg-gradient-to-b from-white to-yellow-50">
              <CardHeader className="pb-4 bg-yellow-50 rounded-t-lg">
                <div className="bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded-full w-fit mb-2">
                  Mais Popular
                </div>
                <CardTitle className="text-yellow-700">Plano Mestre++</CardTitle>
                <CardDescription className="text-yellow-600">Experiência completa</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-blue-900">R$35,90</span>
                  <span className="text-blue-700">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-blue-800">Tudo do plano mestre</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-blue-800">6 correções de redação por mês</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-blue-800">Chat com professor</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">Assinar plano</Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-10 text-center">
            <p className="text-blue-700 mb-4">Precisa de correções extras?</p>
            <div className="inline-block bg-white rounded-lg border border-blue-200 p-4">
              <p className="font-medium text-blue-800">
                Compra avulsa: <span className="text-blue-600 font-bold">R$6,00</span> por correção
              </p>
            </div>
          </div>
        </div>
      </section>

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
