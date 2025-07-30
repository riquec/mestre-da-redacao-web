"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfessorLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    console.log('Página de login do professor carregada')
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Tentativa de login do professor:', {
      email: formData.email,
      timestamp: new Date().toISOString()
    })
    // Here you would handle the login logic
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md bg-white border-gray-200">
        <CardHeader className="space-y-1 bg-white">
          <CardTitle className="text-2xl font-bold text-center text-gray-900">Área do Professor</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Acesse sua conta para gerenciar conteúdos e correções
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 bg-white">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Digite seu email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-white border-gray-300 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-900">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-white border-gray-300 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div className="text-right">
              <Link href="/professor/esqueci-senha" className="text-sm text-blue-600 hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="bg-white">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
