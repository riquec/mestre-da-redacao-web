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
import { createUserWithEmailAndPassword, deleteUser, updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { useLogger } from "@/lib/logger"
import { Loader2, Eye, EyeOff, ArrowLeft, Check, X } from "lucide-react"

export default function Register() {
  const log = useLogger('RegisterPage', '/register')
  const router = useRouter()
  const { user, createUserDocument, cleanupUserOnError, loading, role } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    promoCode: "",
  })

  // Validação em tempo real
  const passwordMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
  const passwordStrong = formData.password.length >= 6
  const emailValid = formData.email.includes('@') && formData.email.includes('.')
  const nameValid = formData.name.trim().length >= 2

  useEffect(() => {
    log.info('Página de cadastro carregada', {
      action: 'page_load',
      metadata: { hasUser: !!user, userRole: role, isLoading: loading }
    })

    // Regra de negócio: Redirecionamento se já estiver logado
    if (!loading && user && role) {
      log.userAction('redirect_already_logged', {
        fromPage: '/register',
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

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword)
    } else {
      setShowConfirmPassword(!showConfirmPassword)
    }
    
    log.userAction('toggle_password_visibility', {
      field,
      visible: field === 'password' ? !showPassword : !showConfirmPassword
    })
  }

  const validateForm = () => {
    if (!nameValid) {
      toast.error("Nome deve ter pelo menos 2 caracteres", {
        duration: 3000,
        position: "top-center",
      })
      return false
    }

    if (!emailValid) {
      toast.error("Por favor, insira um email válido", {
        duration: 3000,
        position: "top-center",
      })
      return false
    }

    if (!passwordStrong) {
      toast.error("A senha deve ter pelo menos 6 caracteres", {
        duration: 3000,
        position: "top-center",
      })
      return false
    }

    if (!passwordMatch) {
      toast.error("As senhas não coincidem", {
        duration: 3000,
        position: "top-center",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    log.userAction('tentativa_cadastro', { 
      email: formData.email,
      hasPromoCode: !!formData.promoCode,
      promoCode: formData.promoCode 
    })

    if (!validateForm()) {
      log.warning('Tentativa de cadastro com dados inválidos', {
        action: 'validation_error',
        metadata: { 
          nameValid, 
          emailValid, 
          passwordStrong, 
          passwordMatch 
        }
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
    let userCredential: any = null

    try {
      log.info('Iniciando processo de cadastro', { 
        action: 'register_start',
        metadata: { email: formData.email, hasPromoCode: !!formData.promoCode }
      })

      userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )
      
      log.apiCall('createUserWithEmailAndPassword', 'POST', { 
        userId: userCredential.user.uid,
        success: true 
      })
      
      // Atualizar o displayName do usuário
      await updateProfile(userCredential.user, {
        displayName: formData.name
      })
      
      log.apiCall('updateProfile', 'PUT', {
        userId: userCredential.user.uid,
        displayName: formData.name
      })
      
      // Criar documento do usuário com o nome fornecido
      log.info('Criando documento do usuário no Firestore', {
        action: 'create_user_document',
        metadata: { userId: userCredential.user.uid, promoCode: formData.promoCode }
      })

      const userData = await createUserDocument(userCredential.user, formData.name, formData.promoCode)
      
      if (!userData) {
        throw new Error('Não foi possível criar o perfil do usuário')
      }
      
      log.businessRule('cadastro_concluido_com_promocional', {
        userId: userCredential.user.uid,
        role: userData.role,
        promoCodeUsed: formData.promoCode
      })
      
      toast.success("Cadastro realizado com sucesso! Redirecionando...", {
        duration: 3000,
        position: "top-center",
      })
      
      log.userAction('cadastro_sucesso', {
        userId: userCredential.user.uid,
        role: userData.role,
        promoCodeUsed: formData.promoCode
      })
      
      // Redirecionar baseado na role do usuário
      const targetPath = userData.role === 'professor' ? '/professor/dashboard' : '/dashboard'
      router.push(targetPath)
    } catch (error: any) {
      log.error('Erro no processo de cadastro', error, {
        action: 'register_error',
        metadata: {
          email: formData.email,
          hasPromoCode: !!formData.promoCode,
          errorCode: error.code,
          errorMessage: error.message,
          userCreatedInAuth: !!userCredential?.user
        }
      })
      
      // Se o usuário foi criado no Auth mas falhou em alguma etapa posterior
      if (userCredential?.user) {
        try {
          log.info('Limpando dados do usuário devido ao erro', {
            action: 'cleanup_user_on_error',
            metadata: { userId: userCredential.user.uid }
          })
          await cleanupUserOnError(userCredential.user)
        } catch (cleanupError) {
          log.error('Erro ao limpar dados do usuário', cleanupError as Error, {
            action: 'cleanup_error',
            metadata: { userId: userCredential.user.uid }
          })
        }
      }

      // Mapeamento de erros mais específico
      let errorMessage = "Ocorreu um erro ao realizar o cadastro"
      
      if (error.message?.includes('Unsupported field value: undefined')) {
        errorMessage = "Erro interno do sistema. Por favor, tente novamente ou entre em contato com o suporte."
      } else if (error.message?.includes('Cupom inválido')) {
        errorMessage = error.message
      } else {
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "Este email já está em uso. Tente fazer login ou use outro email."
            break
          case "auth/invalid-email":
            errorMessage = "Email inválido. Verifique o formato do email."
            break
          case "auth/weak-password":
            errorMessage = "A senha deve ter pelo menos 6 caracteres."
            break
          case "auth/network-request-failed":
            errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
            break
          case "auth/operation-not-allowed":
            errorMessage = "Cadastro não permitido. Entre em contato com o suporte."
            break
          default:
            if (error.message) {
              errorMessage = error.message
            }
        }
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
          <Link href="/" onClick={() => log.userAction('back_to_home', { fromPage: '/register' })}>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="space-y-2 bg-blue-50 rounded-t-lg text-center">
            <CardTitle className="text-2xl md:text-3xl font-bold text-blue-900">Cadastro</CardTitle>
            <CardDescription className="text-blue-700 text-sm md:text-base">
              Crie sua conta na plataforma Mestre da Redação
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-blue-800 font-medium">
                  Nome Completo
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 h-11 pr-10"
                    autoComplete="name"
                  />
                  {formData.name && (
                    <div className="absolute right-3 top-3">
                      {nameValid ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.name && !nameValid && (
                  <p className="text-xs text-red-600">Nome deve ter pelo menos 2 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-800 font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Digite seu email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 h-11 pr-10"
                    autoComplete="email"
                  />
                  {formData.email && (
                    <div className="absolute right-3 top-3">
                      {emailValid ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.email && !emailValid && (
                  <p className="text-xs text-red-600">Email deve ter um formato válido</p>
                )}
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
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 h-11 pr-20"
                    autoComplete="new-password"
                  />
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    {formData.password && (
                      passwordStrong ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('password')}
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
                {formData.password && !passwordStrong && (
                  <p className="text-xs text-red-600">Senha deve ter pelo menos 6 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-blue-800 font-medium">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 h-11 pr-20"
                    autoComplete="new-password"
                  />
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    {formData.confirmPassword && (
                      passwordMatch ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      disabled={isLoading}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                {formData.confirmPassword && !passwordMatch && (
                  <p className="text-xs text-red-600">As senhas não coincidem</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="promoCode" className="text-blue-800 font-medium">
                  Código Promocional 
                  <span className="text-gray-500 font-normal">(opcional)</span>
                </Label>
                <Input
                  id="promoCode"
                  name="promoCode"
                  type="text"
                  placeholder="Digite seu código promocional"
                  value={formData.promoCode}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 h-11"
                  autoComplete="off"
                />
                {formData.promoCode && (
                  <p className="text-xs text-blue-600">
                    Código promocional será validado após o cadastro
                  </p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pb-6">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-medium"
                disabled={isLoading || !nameValid || !emailValid || !passwordStrong || !passwordMatch}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-gray-600">Já tem uma conta? </span>
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  onClick={() => log.userAction('go_to_login', { fromPage: '/register' })}
                >
                  Faça login
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
            onClick={() => log.userAction('go_to_professor_login', { fromPage: '/register' })}
          >
            Cadastrar como professor
          </Link>
        </div>
      </div>
    </div>
  )
}
