"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, User, Mail } from "lucide-react"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

export default function Configuracoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    console.log('Página de configurações carregada')
  }, [])

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres"
    }
    return null
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError("Usuário não autenticado")
      return
    }

    // Validações
    const passwordError = validatePassword(passwordForm.newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError("A nova senha deve ser diferente da atual")
      return
    }

    console.log('Alterando senha do usuário:', user.email)
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Reautenticar o usuário com a senha atual
      const credential = EmailAuthProvider.credential(
        user.email!,
        passwordForm.currentPassword
      )
      
      await reauthenticateWithCredential(user, credential)
      console.log('Usuário reautenticado com sucesso')
      
      // Atualizar a senha
      await updatePassword(user, passwordForm.newPassword)
      
      console.log('Senha alterada com sucesso')
      setSuccess(true)
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso.",
      })
      
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      
      let errorMessage = "Erro ao alterar senha. Tente novamente."
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = "Senha atual incorreta."
          break
        case 'auth/weak-password':
          errorMessage = "Nova senha muito fraca. Use pelo menos 6 caracteres."
          break
        case 'auth/requires-recent-login':
          errorMessage = "Por segurança, faça login novamente antes de alterar a senha."
          break
        case 'auth/too-many-requests':
          errorMessage = "Muitas tentativas. Tente novamente em alguns minutos."
          break
        default:
          errorMessage = "Erro ao alterar senha. Verifique sua senha atual e tente novamente."
      }
      
      setError(errorMessage)
      toast({
        title: "Erro ao alterar senha",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configurações</h1>
          <p className="text-gray-500">Gerencie suas informações pessoais e preferências</p>
        </div>

        {/* Informações da Conta */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <User className="w-5 h-5" />
              Informações da Conta
            </CardTitle>
            <CardDescription className="text-gray-600">
              Suas informações básicas de cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 bg-white">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-900">Nome</Label>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-900">{user?.displayName || "Não informado"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-900">Email</Label>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-900">{user?.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-gray-200" />

        {/* Alterar Senha */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Lock className="w-5 h-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription className="text-gray-600">
              Mantenha sua conta segura com uma senha forte
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Senha alterada com sucesso!
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-900">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    placeholder="Digite sua senha atual"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    className="bg-white border-gray-300 focus:border-blue-500 text-gray-900 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-900">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    className="bg-white border-gray-300 focus:border-blue-500 text-gray-900 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Mínimo de 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-900">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="bg-white border-gray-300 focus:border-blue-500 text-gray-900 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Dicas de Segurança */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-900">💡 Dicas de Segurança</CardTitle>
          </CardHeader>
          <CardContent className="bg-blue-50">
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Use uma senha com pelo menos 8 caracteres</li>
              <li>• Combine letras maiúsculas, minúsculas, números e símbolos</li>
              <li>• Não use informações pessoais óbvias</li>
              <li>• Não compartilhe sua senha com ninguém</li>
              <li>• Altere sua senha regularmente</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 