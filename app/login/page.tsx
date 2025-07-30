"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useLogger } from "@/lib/logger"

export default function Login() {
  const log = useLogger('LoginPage', '/login')
  const router = useRouter()
  const { user, loading, role, fetchUserData, updateLastLogin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    log.info('Página de login carregada', {
      action: 'page_load',
      metadata: { hasUser: !!user, userRole: role, isLoading: loading }
    })

    // Regra de negócio: Redirecionamento se já estiver logado
    if (!loading && user && role) {
      log.userAction('redirect_already_logged', {
        fromPage: '/login',
        toPage: role === "professor" ? "/professor/dashboard" : "/dashboard",
        userRole: role
      })

      const targetPath = role === "professor" ? "/professor/dashboard" : "/dashboard"
      router.push(targetPath)
    }
  }, [user, role, loading, router, log])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
    log.userAction('toggle_password_visibility', {
      action: 'toggle_password',
      visible: !showPassword
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    log.userAction('tentativa_login', { 
      email: formData.email,
      hasPassword: !!formData.password 
    })

    if (!formData.email || !formData.password) {
      toast.error("Por favor, preencha todos os campos", {
        duration: 3000,
        position: "top-center",
      })
      log.warning('Tentativa de login com campos vazios', {
        action: 'validation_error',
        metadata: { hasEmail: !!formData.email, hasPassword: !!formData.password }
      })
      return
    }

    if (!auth) {
      const error = new Error("Erro ao inicializar o Firebase")
      log.error("Firebase não inicializado", error)
      toast.error("Erro interno. Tente novamente mais tarde.", {
        duration: 5000,
        position: "top-center",
      })
      return
    }

    setIsLoading(true)

    try {
      log.info('Iniciando processo de login', { 
        action: 'login_start',
        metadata: { email: formData.email }
      })

      // Verificar se há redefinição de senha pendente
      try {
        const resetResponse = await fetch('/api/check-reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        })

        if (resetResponse.ok) {
          const resetData = await resetResponse.json()
          
          if (resetData.hasReset && resetData.applied) {
            // Senha foi atualizada automaticamente
            toast.success("Senha redefinida aplicada! Agora faça login com a nova senha.", {
              duration: 4000,
              position: "top-center",
            })
            
            // Tentar login com nova senha
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, resetData.newPassword)
            
            log.apiCall('signInWithEmailAndPassword', 'POST', { 
              userId: userCredential.user.uid,
              success: true,
              resetApplied: true
            })

            // Buscar dados do usuário
            const userData = await fetchUserData(userCredential.user.uid)
            if (!userData) {
              throw new Error('Não foi possível carregar o perfil do usuário')
            }
            
            log.businessRule('redirecionamento_por_role', {
              role: userData.role,
              targetPath: userData.role === 'professor' ? '/professor/dashboard' : '/dashboard'
            })

            // Atualizar lastLogin de forma assíncrona
            updateLastLogin(userCredential.user.uid)
            
            toast.success("Login realizado com sucesso! Redirecionando...", {
              duration: 3000,
              position: "top-center",
            })
            
            log.userAction('login_sucesso', {
              userId: userCredential.user.uid,
              role: userData.role,
              resetApplied: true
            })

            // Redirecionar baseado na role do usuário
            const targetPath = userData.role === 'professor' ? '/professor/dashboard' : '/dashboard'
            router.push(targetPath)
            return
          }
        }
      } catch (resetError) {
        // Se verificação de reset falhar, continuar com login normal
        console.log('Erro ao verificar reset, continuando com login normal:', resetError)
      }

      // Login normal se não há reset pendente
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
      
      log.apiCall('signInWithEmailAndPassword', 'POST', { 
        userId: userCredential.user.uid,
        success: true 
      })

      // Buscar dados do usuário
      const userData = await fetchUserData(userCredential.user.uid)
      if (!userData) {
        throw new Error('Não foi possível carregar o perfil do usuário')
      }
      
      log.businessRule('redirecionamento_por_role', {
        role: userData.role,
        targetPath: userData.role === 'professor' ? '/professor/dashboard' : '/dashboard'
      })

      // Atualizar lastLogin de forma assíncrona
      updateLastLogin(userCredential.user.uid)
      
      toast.success("Login realizado com sucesso! Redirecionando...", {
        duration: 3000,
        position: "top-center",
      })
      
      log.userAction('login_sucesso', {
        userId: userCredential.user.uid,
        role: userData.role
      })

      // Redirecionar baseado na role do usuário
      const targetPath = userData.role === 'professor' ? '/professor/dashboard' : '/dashboard'
      router.push(targetPath)
    } catch (error: any) {
      log.error('Erro no processo de login', error, {
        action: 'login_error',
        metadata: {
          email: formData.email,
          errorCode: error.code,
          errorMessage: error.message
        }
      })

      // Mapeamento de erros mais específico
      let errorMessage = 'Erro ao fazer login. Tente novamente.'
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.'
          break
        case 'auth/user-disabled':
          errorMessage = 'Esta conta foi desabilitada. Entre em contato com o suporte.'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
          break
        case 'auth/invalid-email':
          errorMessage = 'Email inválido. Verifique o formato do email.'
          break
        default:
          errorMessage = `Erro: ${error.message}`
      }

      toast.error(errorMessage, {
        duration: 5000,
        position: "top-center",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se já estiver logado, não mostrar o formulário
  if (user && role) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between">
          <Link href="/" onClick={() => log.userAction('back_to_home', { fromPage: '/login' })}>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="space-y-2 bg-blue-50 rounded-t-lg text-center">
            <CardTitle className="text-2xl md:text-3xl font-bold text-blue-900">Entrar</CardTitle>
            <CardDescription className="text-blue-700 text-sm md:text-base">
              Acesse sua conta na plataforma Mestre da Redação
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-800 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 h-11"
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-800 font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 h-11 pr-10"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="text-right">
                <Link 
                  href="/esqueci-senha" 
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  onClick={() => log.userAction('forgot_password_click', { fromPage: '/login' })}
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pb-6">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-gray-600">Não tem uma conta? </span>
                <Link 
                  href="/register" 
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  onClick={() => log.userAction('go_to_register', { fromPage: '/login' })}
                >
                  Cadastre-se
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Link para área do professor */}
        <div className="text-center">
          <Link 
            href="/professor/login" 
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            onClick={() => log.userAction('go_to_professor_login', { fromPage: '/login' })}
          >
            Acessar como professor
          </Link>
        </div>
      </div>
    </div>
  )
}
