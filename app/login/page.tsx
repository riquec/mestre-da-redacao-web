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

export default function Login() {
  const router = useRouter()
  const { loading, role, fetchUserData, updateLastLogin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    console.log('Auth state changed:', { role, loading })
  }, [role, loading])

  // Função para esperar o loading terminar
  const waitForAuthState = () => {
    return new Promise<void>((resolve) => {
      const checkLoading = () => {
        if (!loading) {
          resolve()
        } else {
          setTimeout(checkLoading, 100)
        }
      }
      checkLoading()
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!auth) {
      toast.error("Erro ao inicializar o Firebase")
      return
    }

    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
      
      // Buscar dados do usuário
      const userData = await fetchUserData(userCredential.user.uid)
      if (!userData) {
        throw new Error('Não foi possível carregar o perfil do usuário')
      }
      
      // Atualizar lastLogin de forma assíncrona
      updateLastLogin(userCredential.user.uid)
      
      toast.success("Login realizado com sucesso!", {
        duration: 4000,
        position: "top-center",
      })
      
      // Redirecionar baseado na role do usuário
      const targetPath = userData.role === 'professor' ? '/professor/dashboard' : '/dashboard'
      console.log('Redirecionando para:', targetPath, 'baseado na role:', userData.role)
      router.push(targetPath)
    } catch (error: any) {
      console.error('Erro durante o login:', error)
      
      let errorMessage = "Ocorreu um erro ao fazer login"
      
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Email inválido"
          break
        case "auth/user-disabled":
          errorMessage = "Esta conta foi desativada"
          break
        case "auth/user-not-found":
          errorMessage = "Usuário não encontrado"
          break
        case "auth/wrong-password":
          errorMessage = "Senha incorreta"
          break
        case "auth/network-request-failed":
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente"
          break
        case "auth/too-many-requests":
          errorMessage = "Muitas tentativas. Tente novamente mais tarde"
          break
        default:
          if (error.message) {
            errorMessage = error.message
          }
          console.error("Erro não tratado:", error)
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-center",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <Card className="w-full max-w-md border-blue-200">
        <CardHeader className="space-y-1 bg-blue-50 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center text-blue-900">Entrar</CardTitle>
          <CardDescription className="text-center text-blue-700">
            Acesse sua conta na plataforma Mestre da Redação
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-800">
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
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-800">
                Senha
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
                required
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-600">Não tem uma conta? </span>
              <Link href="/register" className="text-blue-600 hover:underline">
                Cadastre-se
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
