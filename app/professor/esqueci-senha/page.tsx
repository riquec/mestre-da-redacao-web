"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, CheckCircle, AlertCircle, GraduationCap } from "lucide-react"
import Link from "next/link"

import { useToast } from "@/components/ui/use-toast"
import { useLogger } from "@/lib/logger"

export default function EsqueciSenhaProfessor() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const log = useLogger('EsqueciSenhaProfessor', '/professor/esqueci-senha')

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página de recuperação de senha (professor) carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced', userType: 'professor' }
    })
  }, [log])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Por favor, digite seu email")
      log.warning('Tentativa de recuperação sem email', {
        action: 'password_reset_attempt',
        metadata: { error: 'empty_email', userType: 'professor' }
      })
      return
    }

    log.info('Iniciando recuperação de senha via SendGrid (professor)', {
      action: 'password_reset_sendgrid_start',
      metadata: { email: email.substring(0, 3) + '***', userType: 'professor' }
    })
    
    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/send-reset-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      
      if (response.ok) {
        // Log baseado no que realmente aconteceu
        if (result.debug?.found === false) {
          log.warning('Tentativa de recuperação para email não cadastrado (professor)', {
            action: 'password_reset_user_not_found',
            metadata: { 
              email: email.substring(0, 3) + '***',
              reason: result.debug.reason,
              userType: 'professor'
            }
          })
        } else {
          log.info('Email de recuperação enviado com sucesso (professor)', {
            action: 'password_reset_sent',
            metadata: { email: email.substring(0, 3) + '***', userType: 'professor' }
          })
        }
        
        setEmailSent(true)
        
        // Feedback visual mais informativo
        const toastTitle = result.debug?.found === false 
          ? "Solicitação processada" 
          : "Email enviado!";
        
        const toastDescription = result.debug?.found === false
          ? "Se o email existir em nosso sistema, você receberá um link de recuperação."
          : "Verifique sua caixa de entrada para redefinir sua senha.";
        
        toast({
          title: toastTitle,
          description: toastDescription,
        })
      } else {
        throw new Error(result.error || 'Erro ao enviar email')
      }
    } catch (error: any) {
      log.error('Erro ao enviar email (professor)', error, {
        action: 'password_reset_error',
        metadata: { 
          email: email.substring(0, 3) + '***',
          errorMessage: error.message,
          userType: 'professor'
        }
      })
      
      let errorMessage = "Ocorreu um erro ao enviar o email de recuperação."
      
      // Mensagens mais amigáveis baseadas no tipo de erro
      if (error.message.includes('user-not-found')) {
        errorMessage = "Não encontramos uma conta de professor com este email."
      } else if (error.message.includes('invalid-email')) {
        errorMessage = "Email inválido. Verifique e tente novamente."
      } else if (error.message.includes('too-many-requests')) {
        errorMessage = "Muitas tentativas. Tente novamente em alguns minutos."
      } else if (error.message.includes('SendGrid') || error.message.includes('email')) {
        errorMessage = "Erro temporário no envio de email. Tente novamente em alguns minutos."
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
      } else {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      toast({
        title: "Erro ao enviar email",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }



  const handleTryAgain = () => {
    log.info('Tentando enviar email novamente (professor)', {
      action: 'password_reset_retry',
      metadata: { email: email.substring(0, 3) + '***', userType: 'professor' }
    })
    setEmailSent(false)
    setError("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader className="space-y-1 bg-white text-center">
            <div className="flex justify-center mb-4">
              {emailSent ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-indigo-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {emailSent ? "Email Enviado!" : "Esqueceu sua senha?"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {emailSent 
                ? "Verifique sua caixa de entrada (incluindo spam) e siga as instruções para redefinir sua senha."
                : "Digite seu email de professor para receber um link de recuperação de senha."
              }
            </CardDescription>
          </CardHeader>

          {!emailSent ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 bg-white">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900">Email do Professor</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Digite seu email de professor"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border-gray-300 focus:border-indigo-500 text-gray-900"
                    disabled={loading}
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4 bg-white">
                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>

                <Link 
                  href="/professor/login" 
                  className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Link>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4 bg-white">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Email enviado para:</strong> {email}
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Verifique sua caixa de entrada (e spam)</p>
                <p>• Clique no link de recuperação</p>
                <p>• Defina uma nova senha</p>
                <p>• Faça login com a nova senha</p>
              </div>

              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Não recebeu o email?</strong><br/>
                  • Verifique a pasta de spam<br/>
                  • Aguarde alguns minutos<br/>
                  • Verifique se o email está correto<br/>
                  • Tente novamente se necessário
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col space-y-3 pt-4">
                <Button 
                  onClick={handleTryAgain}
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                >
                  Não recebeu? Enviar novamente
                </Button>
                
                <Link 
                  href="/professor/login" 
                  className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Link>
              </div>
            </CardContent>
          )}
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Problemas? Entre em contato conosco pelo{" "}
            <Link href="/contato" className="text-indigo-600 hover:text-indigo-800 font-medium">
              WhatsApp
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 