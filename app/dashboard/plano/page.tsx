"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle, CreditCard, Plus, MessageCircle } from "lucide-react"
import { useLogger } from "@/lib/logger"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/hooks/use-subscription"

export default function Plano() {
  const [selectedPlan, setSelectedPlan] = useState("mestre")
  const [tokenQuantity, setTokenQuantity] = useState(1)
  const { user } = useAuth()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const log = useLogger('PlanoAluno', '/dashboard/plano')

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página de plano carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced' }
    })
  }, [log])

  const plans = [
    {
      id: "free",
      name: "Plano Gratuito",
      price: 0,
      corrections: 0,
      features: ["Acesso às propostas de redação"],
      color: "green",
    },
    {
      id: "avulsa",
      name: "Compra Avulsa",
      price: 15.0,
      corrections: 1,
      features: ["Acesso às propostas de redação", "1 correção de redação"],
      color: "blue",
    },
    {
      id: "mestre",
      name: "Plano Mestre",
      price: 100.0,
      corrections: 6,
      features: ["Acesso completo às videoaulas", "Material didático completo", "6 correções por mês"],
      color: "yellow",
      popular: true,
    },
  ]

  const handlePlanChange = (value: string) => {
    setSelectedPlan(value)
  }

  const handleTokenQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setTokenQuantity(value)
    }
  }

  const handleWhatsAppContact = (planType: string) => {
    const plan = plans.find(p => p.id === planType)
    
    let message = ''
    
    switch (planType) {
      case 'free':
        message = `Oi! 👋 Vi que vocês têm um plano gratuito. Queria entender melhor como funciona a plataforma e quais são as opções pagas disponíveis. Poderia me explicar? 😊`
        break
      case 'avulsa':
        message = `Oi! 👋 Me interessei pelo plano avulso de R$ 15,00. Queria saber mais sobre como funciona essa correção única e se posso escolher qualquer tema de redação. Como é o processo? 📝`
        break
      case 'mestre':
        message = `Oi! 👋 Me interessei pelo Plano Mestre de R$ 100,00/mês! Queria entender melhor como funciona a plataforma, quantas correções posso fazer por mês e se tem acesso às videoaulas e materiais. Poderia me explicar tudo? 🎓✨`
        break
      default:
        message = `Oi! 👋 Gostaria de saber mais sobre o ${plan?.name} (${plan?.price === 0 ? 'Grátis' : `R$ ${plan?.price.toFixed(2).replace('.', ',')}${planType === 'mestre' ? '/mês' : ''}`}). Como funciona? 😊`
    }
    
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/5521981120169?text=${encodedMessage}`, '_blank')
  }

  const getColorClass = (color: string) => {
    switch (color) {
      case "green":
        return "border-green-400"
      case "yellow":
        return "border-yellow-400"
      case "blue":
        return "border-blue-400"
      case "red":
        return "border-red-400"
      default:
        return ""
    }
  }

  const getTextColorClass = (color: string) => {
    switch (color) {
      case "green":
        return "text-green-500"
      case "yellow":
        return "text-yellow-500"
      case "blue":
        return "text-blue-500"
      case "red":
        return "text-red-500"
      default:
        return ""
    }
  }

  // Dados reais do usuário
  const userData = {
    currentPlan: subscription?.type === 'private' ? 'Plano Mestre' : 
                 subscription?.type === 'partner' ? 'Aluno Parceiro' : 
                 subscription?.type === 'free' ? 'Plano Gratuito' : 'Sem plano',
    renewalDate: subscription?.updatedAt?.toDate ? subscription.updatedAt.toDate().toLocaleDateString() : "N/A",
    corrections: {
              used: subscription?.tokens ? (6 - subscription.tokens.available) : 0,
        total: subscription?.tokens?.available || 0,
    },
    tokens: subscription?.tokens?.available || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Plano</h1>
        <p className="text-gray-500">Gerencie seu plano e compre tokens adicionais</p>
      </div>

      <Tabs defaultValue="current">
        <TabsList className="mb-4">
          <TabsTrigger value="current">Plano Atual</TabsTrigger>
          <TabsTrigger value="upgrade">Mudar Plano</TabsTrigger>
          <TabsTrigger value="tokens">Comprar Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <div className="grid gap-6 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do plano</CardTitle>
                <CardDescription>Informações sobre seu plano atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Plano atual</p>
                  <p className="text-xl font-bold">{userData.currentPlan}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Última atualização</p>
                  <p className="font-medium">{userData.renewalDate}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500">Correções utilizadas</p>
                    <p className="font-medium">
                      {`${userData.corrections.used}/6`}
                    </p>
                  </div>
                  <Progress value={(userData.corrections.used / 6) * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Tokens disponíveis</p>
                  <p className="font-medium">
                    {userData.tokens}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => handleWhatsAppContact('mestre')}
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar com o Mestre
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upgrade">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={`${getColorClass(plan.color)} ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`}>
                <CardHeader>
                  <CardTitle className={getTextColorClass(plan.color)}>{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.price === 0 ? "Grátis" : `R$ ${plan.price.toFixed(2).replace('.', ',')}${plan.id === 'mestre' ? '/mês' : ''}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full flex items-center gap-2"
                    onClick={() => handleWhatsAppContact(plan.id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Falar com o Mestre
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Comprar tokens adicionais</CardTitle>
              <CardDescription>Cada token permite enviar uma redação para correção</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4">
                <div className="space-y-2 flex-grow">
                  <Label htmlFor="token-quantity">Quantidade de tokens</Label>
                  <div className="flex">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-r-none"
                      onClick={() => tokenQuantity > 1 && setTokenQuantity(tokenQuantity - 1)}
                    >
                      -
                    </Button>
                    <Input
                      id="token-quantity"
                      type="number"
                      min="1"
                      value={tokenQuantity}
                      onChange={handleTokenQuantityChange}
                      className="rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-l-none"
                      onClick={() => setTokenQuantity(tokenQuantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 w-1/3">
                  <Label>Valor total</Label>
                  <div className="text-2xl font-bold">R${(tokenQuantity * 15).toFixed(2).replace('.', ',')}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Informações sobre tokens</p>
                    <ul className="text-sm text-gray-600 space-y-1 mt-1">
                      <li>• Cada token custa R$15,00</li>
                      <li>• Tokens não expiram e ficam disponíveis na sua conta</li>
                      <li>• Você pode usar tokens a qualquer momento para enviar redações extras</li>
                      <li>• Tokens são consumidos apenas quando você envia uma redação para correção</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full flex items-center gap-2"
                onClick={() => handleWhatsAppContact('avulsa')}
              >
                <MessageCircle className="h-4 w-4" />
                Falar com o Mestre
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
