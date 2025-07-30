"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useLogger } from "@/lib/logger"

function RedefinirSenhaContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [tokenValid, setTokenValid] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const logger = useLogger('RedefinirSenha', '/redefinir-senha')

  // Verificar token na URL
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const tokenFromUrl = searchParams.get('token')
        
        if (!tokenFromUrl) {
          setError("Token de redefinição não encontrado na URL")
          logger.warning('Token não encontrado na URL', {
            action: 'verify_token_missing'
          })
          setVerifying(false)
          return
        }

        setToken(tokenFromUrl)
        logger.info('Verificando token de reset', {
          action: 'verify_token_start',
          metadata: { tokenPrefix: tokenFromUrl.substring(0, 8) + '...' }
        })

        // Verificar token no Firestore
        const tokenDoc = await getDoc(doc(db, 'passwordResets', tokenFromUrl))
        
        if (!tokenDoc.exists()) {
          setError("Token de redefinição inválido ou expirado")
          logger.warning('Token não encontrado no Firestore', {
            action: 'verify_token_not_found',
            metadata: { tokenPrefix: tokenFromUrl.substring(0, 8) + '...' }
          })
          setVerifying(false)
          return
        }

        const tokenData = tokenDoc.data()
        
        // Verificar se token já foi usado
        if (tokenData.used) {
          setError("Este token já foi utilizado")
          logger.warning('Token já utilizado', {
            action: 'verify_token_used',
            metadata: { email: tokenData.email }
          })
          setVerifying(false)
          return
        }

        // Verificar se token expirou
        const now = new Date()
        const expiresAt = tokenData.expiresAt.toDate()
        
        if (now > expiresAt) {
          setError("Token de redefinição expirado")
          logger.warning('Token expirado', {
            action: 'verify_token_expired',
            metadata: { 
              email: tokenData.email,
              expiresAt: expiresAt.toISOString()
            }
          })
          setVerifying(false)
          return
        }

        // Token válido
        setEmail(tokenData.email)
        setTokenValid(true)
        setVerifying(false)
        
        logger.info('Token verificado com sucesso', {
          action: 'verify_token_success',
          metadata: { email: tokenData.email }
        })

      } catch (error) {
        console.error('Erro ao verificar token:', error)
        setError("Erro ao verificar token de redefinição")
        logger.error('Erro ao verificar token', error instanceof Error ? error : new Error('verify_token_error'), {
          action: 'verify_token_error',
          metadata: { 
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
        setVerifying(false)
      }
    }

    verifyToken()
  }, [searchParams, logger])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!password || !confirmPassword) {
      setError("Todos os campos são obrigatórios")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    setLoading(true)
    logger.info('Iniciando redefinição de senha', {
      action: 'reset_password_start',
      metadata: { email }
    })

    try {
      // Chamar API para redefinir senha
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          newPassword: password 
        }),
      })

      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error('Erro ao parsear JSON:', jsonError)
        throw new Error('Erro de comunicação com o servidor. Tente novamente.')
      }

      if (!response.ok) {
        // Usar mensagem de erro mais específica do servidor
        let errorMessage = result.error || 'Erro ao redefinir senha'
        
        // Melhorar mensagens baseadas no código de erro
        if (result.code === 'token_expired') {
          errorMessage = 'O link de redefinição expirou. Solicite um novo link.'
        } else if (result.code === 'token_used') {
          errorMessage = 'Este link já foi utilizado. Solicite um novo link se necessário.'
        } else if (result.code === 'weak_password') {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.'
        } else if (result.code === 'invalid_token') {
          errorMessage = 'Link de redefinição inválido. Verifique se copiou corretamente.'
        }
        
        throw new Error(errorMessage)
      }

      logger.info('Senha redefinida com sucesso', {
        action: 'reset_password_success',
        metadata: { email }
      })

      setSuccess(true)
      
      // Verificar se há próximos passos
      if (result.nextStep === 'firebase_reset') {
        toast({
          title: "✅ Reset processado!",
          description: "Agora solicite um novo reset através do sistema padrão do Firebase.",
        })

        // Não redirecionar automaticamente - mostrar instruções
      } else {
        toast({
          title: "✅ Senha redefinida com sucesso!",
          description: "Você será redirecionado para a página de login em 3 segundos.",
        })

        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push('/login?message=password_reset_success')
        }, 3000)
      }

    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error)
      
      let errorMessage = error.message || "Erro interno. Tente novamente."
      
      setError(errorMessage)
      logger.error('Erro ao redefinir senha', error instanceof Error ? error : new Error('reset_password_error'), {
        action: 'reset_password_error',
        metadata: { 
          email,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Loading state durante verificação
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Verificando token de redefinição...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado de erro ou token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Token Inválido</CardTitle>
            <CardDescription>
              {error || "Token de redefinição inválido ou expirado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado de sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Reset Processado!</CardTitle>
            <CardDescription>
              Sua solicitação foi processada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> {email}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Para finalizar, solicite um novo reset através do sistema padrão do Firebase.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Próximos passos:</strong>
              </p>
              <ol className="text-sm text-yellow-700 mt-2 list-decimal list-inside">
                <li>Vá para a página de login</li>
                <li>Clique em "Esqueci minha senha"</li>
                <li>Digite seu email para receber o reset do Firebase</li>
                <li>Use a nova senha que você definiu aqui</li>
              </ol>
            </div>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription>
            Defina uma nova senha para a conta: <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 

export default function RedefinirSenha() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <RedefinirSenhaContent />
    </Suspense>
  )
} 