"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle, CreditCard, Plus } from "lucide-react"

export default function Plano() {
  const [selectedPlan, setSelectedPlan] = useState("mestre")
  const [tokenQuantity, setTokenQuantity] = useState(1)

  // Mock data - in a real app, this would come from your backend
  const userData = {
    currentPlan: "Plano Mestre",
    renewalDate: "15/05/2023",
    corrections: {
      used: 2,
      total: 4,
    },
    tokens: 2,
  }

  const plans = [
    {
      id: "basico",
      name: "Plano Básico",
      price: 0,
      corrections: 0,
      features: ["Acesso ilimitado às videoaulas", "Acesso às propostas de redação"],
      color: "green",
    },
    {
      id: "medio",
      name: "Plano Médio",
      price: 9.9,
      corrections: 2,
      features: ["Tudo do plano básico", "2 correções de redação por mês"],
      color: "yellow",
    },
    {
      id: "mestre",
      name: "Plano Mestre",
      price: 19.9,
      corrections: 4,
      features: ["Tudo do plano médio", "4 correções de redação por mês"],
      color: "blue",
    },
    {
      id: "mestre-plus",
      name: "Plano Mestre++",
      price: 35.9,
      corrections: 6,
      features: ["Tudo do plano mestre", "6 correções de redação por mês", "Chat com professor"],
      color: "red",
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
          <div className="grid gap-6 md:grid-cols-2">
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
                  <p className="text-sm text-gray-500">Próxima renovação</p>
                  <p className="font-medium">{userData.renewalDate}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500">Correções utilizadas</p>
                    <p className="font-medium">
                      {userData.corrections.used}/{userData.corrections.total}
                    </p>
                  </div>
                  <Progress value={(userData.corrections.used / userData.corrections.total) * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Tokens extras disponíveis</p>
                  <p className="font-medium">{userData.tokens}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Cancelar assinatura
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de pagamentos</CardTitle>
                <CardDescription>Seus pagamentos recentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <div className="flex justify-between mb-1">
                      <p className="font-medium">Plano Mestre</p>
                      <p className="font-medium">R$19,90</p>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <p>Renovação mensal</p>
                      <p>15/04/2023</p>
                    </div>
                  </div>
                  <div className="border-b pb-4">
                    <div className="flex justify-between mb-1">
                      <p className="font-medium">Tokens extras (2)</p>
                      <p className="font-medium">R$12,00</p>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <p>Compra avulsa</p>
                      <p>10/04/2023</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="font-medium">Plano Mestre</p>
                      <p className="font-medium">R$19,90</p>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <p>Renovação mensal</p>
                      <p>15/03/2023</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upgrade">
          <Card>
            <CardHeader>
              <CardTitle>Escolha seu plano</CardTitle>
              <CardDescription>Selecione o plano que melhor atende às suas necessidades</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedPlan}
                onValueChange={handlePlanChange}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
              >
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-md border-2 p-4 ${selectedPlan === plan.id ? `${getColorClass(plan.color)} ring-2 ring-offset-2 ring-${plan.color}-400` : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Popular
                      </div>
                    )}
                    <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                    <Label htmlFor={plan.id} className="flex flex-col h-full cursor-pointer">
                      <span className={`font-medium ${getTextColorClass(plan.color)}`}>{plan.name}</span>
                      <span className="mt-1 mb-2 text-2xl font-bold">
                        {plan.price === 0 ? "Grátis" : `R$${plan.price.toFixed(2)}`}
                        {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mês</span>}
                      </span>
                      <span className="text-sm mb-4">
                        {plan.corrections === 0 ? "Sem correções inclusas" : `${plan.corrections} correções/mês`}
                      </span>
                      <ul className="space-y-2 text-sm text-gray-700 flex-grow">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className={`h-4 w-4 mt-0.5 ${getTextColorClass(plan.color)}`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Mudar para este plano</Button>
            </CardFooter>
          </Card>
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
                  <div className="text-2xl font-bold">R${(tokenQuantity * 6).toFixed(2)}</div>
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
                      <li>• Cada token custa R$6,00</li>
                      <li>• Tokens não expiram e ficam disponíveis na sua conta</li>
                      <li>• Você pode usar tokens a qualquer momento para enviar redações extras</li>
                      <li>• Tokens são consumidos apenas quando você envia uma redação para correção</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="font-medium">Informações de pagamento</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-number">Número do cartão</Label>
                    <div className="flex">
                      <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input id="card-number" placeholder="0000 0000 0000 0000" className="rounded-l-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Validade</Label>
                      <Input id="expiry" placeholder="MM/AA" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" placeholder="123" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome no cartão</Label>
                    <Input id="name" placeholder="Nome completo" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Finalizar compra</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
