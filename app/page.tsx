"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, GraduationCap, BookOpen, Award } from "lucide-react"
import { TestimonialCarousel } from "@/components/testimonial-carousel"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useLogger } from "@/lib/logger"

export default function Home() {
  const router = useRouter()
  const { user, role, loading } = useAuth()
  const log = useLogger('Homepage', '/')

  useEffect(() => {
    log.info('Página inicial carregada', {
      action: 'page_load',
      metadata: { hasUser: !!user, userRole: role, isLoading: loading }
    })

    // Regra de negócio: Redirecionamento baseado em role
    if (!loading && user && role) {
      log.userAction('redirect_authenticated_user', {
        fromPage: '/',
        toPage: role === "professor" ? "/professor/dashboard" : "/dashboard",
        userRole: role
      })

      if (role === "professor") {
        router.push("/professor/dashboard")
      } else if (role === "student") {
        router.push("/dashboard")
      }
    }
  }, [user, role, loading, router, log])

  const handlePlanClick = (planName: string, price: string) => {
    log.userAction('plan_click', {
      planName,
      price,
      redirectTo: '/register'
    })
    router.push('/register')
  }

  const handleNavigationClick = (destination: string, action: string) => {
    log.userAction(action, {
      destination,
      fromPage: '/'
    })
  }

  if (loading || (user && role)) {
    log.debug('Renderizando loading state', {
      action: 'render_loading',
      metadata: { loading, hasUser: !!user, hasRole: !!role }
    })
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-blue-50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-xl md:text-2xl font-bold text-blue-800">Mestre da Redação</h1>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/login" onClick={() => handleNavigationClick('/login', 'header_login_click')}>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 text-sm md:text-base">
                Entrar
              </Button>
            </Link>
            <Link href="/register" onClick={() => handleNavigationClick('/register', 'header_register_click')}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-sm md:text-base">Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container flex flex-col items-center text-center px-4">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight text-blue-900 max-w-4xl">
            Redação nota máxima começa com a <span className="text-blue-600">mentoria certa</span>
          </h1>
          <p className="mt-4 md:mt-6 text-lg md:text-xl text-blue-700 max-w-3xl leading-relaxed">
            Plataforma completa para assistir a aulas e ter suas redações corrigidas por professores especializados, com
            feedbacks detalhados em áudio e imagem.
          </p>
          <Link href="/register" className="mt-8 md:mt-10" onClick={() => handleNavigationClick('/register', 'hero_cta_click')}>
            <Button size="lg" className="text-lg px-6 md:px-8 py-3 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all">
              Começar agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 md:mb-16 text-blue-900">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            <div className="flex flex-col items-center text-center p-4 bg-white">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 hover:scale-105 transition-transform">
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
              <p className="text-blue-700 leading-relaxed">Acesse videoaulas exclusivas sobre técnicas de redação e temas atuais.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4 hover:scale-105 transition-transform">
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
              <p className="text-blue-700 leading-relaxed">Escolha uma proposta e envie sua redação para correção.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 hover:scale-105 transition-transform">
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
              <p className="text-blue-700 leading-relaxed">Obtenha correções com marcações visuais e explicações em áudio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Professor Section */}
      <section className="py-12 md:py-20 bg-blue-50">
        <div className="container px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-blue-900">Conheça o Professor</h2>
          <p className="text-center text-blue-700 mb-8 md:mb-12 max-w-2xl mx-auto">
            Aprenda com quem tem experiência e resultados comprovados
          </p>

          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-center">
              <div className="lg:w-1/3 flex flex-col items-center">
                <div className="rounded-full overflow-hidden border-4 border-yellow-200 shadow-lg w-48 h-48 md:w-64 md:h-64">
                  <img
                    src="/images/professor-marcos.jpeg"
                    alt="Professor Marcos Cortinovis Carvalho"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center mt-6">
                  <h3 className="text-xl md:text-2xl font-bold text-blue-800">Prof. Marcos Cortinovis Carvalho</h3>
                  <p className="text-blue-600 font-medium text-sm md:text-base">Mestre em Língua Portuguesa - UFRJ</p>
                </div>
              </div>

              <div className="lg:w-2/3 bg-white rounded-xl p-6 md:p-8 shadow-md border border-blue-100">
                <p className="text-blue-800 leading-relaxed mb-4 md:mb-6 text-sm md:text-base">
                  O professor Marcos Cortinovis Carvalho atua no ensino de Língua Portuguesa há 20 anos. É mestre em
                  Língua Portuguesa pela UFRJ, com pesquisas voltadas para leitura e produção textual. Desde 2015,
                  dedica-se à correção de redações, acumulando ampla experiência, especialmente com a banca do ENEM.
                </p>
                <p className="text-blue-800 leading-relaxed mb-6 md:mb-8 text-sm md:text-base">
                  Servidor público da Seeduc RJ, é também o criador de um método de mentoria eficaz, focado no
                  desenvolvimento da escrita e na preparação para concursos públicos.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 md:mt-8">
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 text-sm md:text-base">20 anos</p>
                      <p className="text-xs md:text-sm text-blue-600">de experiência</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 text-sm md:text-base">Mestre</p>
                      <p className="text-xs md:text-sm text-blue-600">pela UFRJ</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 text-sm md:text-base">Especialista</p>
                      <p className="text-xs md:text-sm text-blue-600">em banca ENEM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-blue-900">O que nossos alunos dizem</h2>
          <p className="text-center text-blue-700 mb-12 md:mb-16 max-w-2xl mx-auto">
            Veja como o Mestre da Redação tem ajudado estudantes a alcançarem seus sonhos
          </p>

          <TestimonialCarousel />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-blue-900">Planos</h2>
          <p className="text-center text-blue-700 mb-12 md:mb-16 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu desenvolvimento. Todos os planos incluem acesso às propostas de redação.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Plano Gratuito */}
            <Card className="flex flex-col border-gray-200 hover:shadow-lg transition-all hover:scale-105">
              <CardHeader className="pb-4 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-gray-700 text-lg">Plano Gratuito</CardTitle>
                <CardDescription className="text-gray-600 text-sm">Para conhecer a plataforma</CardDescription>
                <div className="mt-2">
                  <span className="text-2xl md:text-3xl font-bold text-blue-900">Grátis</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-blue-800 text-sm md:text-base">Acesso às propostas de redação</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-blue-800 text-sm md:text-base">Visualização dos temas disponíveis</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span className="text-gray-500 text-sm md:text-base">Videoaulas</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span className="text-gray-500 text-sm md:text-base">Material didático</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span className="text-gray-500 text-sm md:text-base">Envio de redações</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 text-sm md:text-base"
                  onClick={() => handlePlanClick('Gratuito', 'Grátis')}
                >
                  Começar grátis
                </Button>
              </CardFooter>
            </Card>

            {/* Compra Avulsa */}
            <Card className="flex flex-col border-blue-200 hover:shadow-lg transition-all hover:scale-105">
              <CardHeader className="pb-4 bg-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 text-lg">Compra Avulsa</CardTitle>
                <CardDescription className="text-blue-600 text-sm">Para quem quer testar</CardDescription>
                <div className="mt-2">
                  <span className="text-2xl md:text-3xl font-bold text-blue-900">R$15,00</span>
                  <span className="text-blue-700 text-sm">por redação</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-blue-800 text-sm md:text-base">Acesso às propostas de redação</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-blue-800 text-sm md:text-base">1 correção de redação</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span className="text-gray-500 text-sm md:text-base">Videoaulas</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span className="text-gray-500 text-sm md:text-base">Material didático</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 text-sm md:text-base"
                  onClick={() => handlePlanClick('Compra Avulsa', 'R$15,00')}
                >
                  Comprar redação
                </Button>
              </CardFooter>
            </Card>

            {/* Plano Mestre */}
            <Card className="flex flex-col border-yellow-200 hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-b from-white to-yellow-50">
              <CardHeader className="pb-4 bg-yellow-50 rounded-t-lg">
                <div className="bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded-full w-fit mb-2">
                  Mais Popular
                </div>
                <CardTitle className="text-yellow-700 text-lg">Plano Mestre</CardTitle>
                <CardDescription className="text-yellow-600 text-sm">Experiência completa</CardDescription>
                <div className="mt-2">
                  <span className="text-2xl md:text-3xl font-bold text-blue-900">R$70,00</span>
                  <span className="text-blue-700 text-sm">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-blue-800 text-sm md:text-base">Acesso às propostas de redação</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-blue-800 text-sm md:text-base">Acesso completo às videoaulas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-blue-800 text-sm md:text-base">Material didático completo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-blue-800 text-sm md:text-base">15 correções de redação por mês</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-blue-800 text-sm md:text-base">Feedback detalhado em áudio</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm md:text-base"
                  onClick={() => handlePlanClick('Mestre', 'R$70,00')}
                >
                  Assinar plano
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-8 md:mt-10 text-center">
            <p className="text-blue-700 mb-4 text-sm md:text-base">Aluno de instituição parceira?</p>
            <div className="inline-block bg-white rounded-lg border border-blue-200 p-3 md:p-4">
              <p className="font-medium text-blue-800 text-sm md:text-base">
                Entre em contato com sua instituição para obter o <span className="text-blue-600 font-bold">cupom de acesso</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-6 md:py-8 bg-blue-900 text-white">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-lg md:text-xl font-bold">Mestre da Redação</h2>
              <p className="text-blue-200 text-xs md:text-sm">© {new Date().getFullYear()} Todos os direitos reservados</p>
            </div>
            <div className="flex gap-4 md:gap-6">
              <Link 
                href="/termos" 
                className="text-blue-200 hover:text-white text-sm md:text-base transition-colors"
                onClick={() => handleNavigationClick('/termos', 'footer_terms_click')}
              >
                Termos
              </Link>
              <Link 
                href="/privacidade" 
                className="text-blue-200 hover:text-white text-sm md:text-base transition-colors"
                onClick={() => handleNavigationClick('/privacidade', 'footer_privacy_click')}
              >
                Privacidade
              </Link>
              <Link 
                href="/contato" 
                className="text-blue-200 hover:text-white text-sm md:text-base transition-colors"
                onClick={() => handleNavigationClick('/contato', 'footer_contact_click')}
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
