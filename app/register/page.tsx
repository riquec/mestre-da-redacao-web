"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createUserWithEmailAndPassword, deleteUser, updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

export default function Register() {
  const router = useRouter()
  const { createUserDocument, cleanupUserOnError, loading, role } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    promoCode: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (!auth) {
      toast.error("Erro ao inicializar o Firebase")
      return
    }

    setIsLoading(true)
    let userCredential: any = null

    try {
      console.log('Iniciando criação do usuário no Firebase Auth')
      userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )
      console.log('Usuário criado no Firebase Auth:', userCredential.user.uid)
      
      // Atualizar o displayName do usuário
      await updateProfile(userCredential.user, {
        displayName: formData.name
      })
      console.log('DisplayName atualizado:', formData.name)
      
      // Criar documento do usuário com o nome fornecido
      console.log('Criando documento do usuário')
      const userData = await createUserDocument(userCredential.user, formData.name, formData.promoCode)
      console.log('Documento do usuário criado:', userData)
      
      if (!userData) {
        throw new Error('Não foi possível criar o perfil do usuário')
      }
      
      toast.success("Cadastro realizado com sucesso!", {
        duration: 4000,
        position: "top-center",
      })
      
      // Redirecionar baseado na role do usuário
      const targetPath = userData.role === 'professor' ? '/professor/dashboard' : '/dashboard'
      console.log('Redirecionando para:', targetPath, 'baseado na role:', userData.role)
      router.push(targetPath)
    } catch (error: any) {
      console.error('Erro durante o cadastro:', error)
      
      // Se o usuário foi criado no Auth mas falhou em alguma etapa posterior
      if (userCredential?.user) {
        try {
          console.log('Limpando dados do usuário devido ao erro')
          await cleanupUserOnError(userCredential.user)
        } catch (cleanupError) {
          console.error('Erro ao limpar dados do usuário:', cleanupError)
          // Mesmo se falhar a limpeza, continuamos para mostrar o erro original ao usuário
        }
      }

      let errorMessage = "Ocorreu um erro ao realizar o cadastro"
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Este email já está em uso"
          break
        case "auth/invalid-email":
          errorMessage = "Email inválido"
          break
        case "auth/weak-password":
          errorMessage = "A senha deve ter pelo menos 6 caracteres"
          break
        case "auth/network-request-failed":
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente"
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
          <CardTitle className="text-2xl font-bold text-center text-blue-900">Cadastro</CardTitle>
          <CardDescription className="text-center text-blue-700">
            Crie sua conta na plataforma Mestre da Redação
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-blue-800">
                Nome
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Digite seu nome"
                value={formData.name}
                onChange={handleChange}
                required
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-blue-800">
                Confirmar Senha
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoCode" className="text-blue-800">
                Código Promocional (opcional)
              </Label>
              <Input
                id="promoCode"
                name="promoCode"
                type="text"
                placeholder="Digite seu código promocional"
                value={formData.promoCode}
                onChange={handleChange}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-600">Já tem uma conta? </span>
              <Link href="/login" className="text-blue-600 hover:underline">
                Faça login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
