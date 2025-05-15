"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, Check, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Plan {
  type: 'free' | 'medium' | 'master' | 'master_plus'
  name: string
  description: string
  price: number
  tokens: number
  features: string[]
}

const PLANS: Plan[] = [
  {
    type: "free",
    name: "Plano Básico",
    description: "Para conhecer a plataforma",
    price: 0,
    tokens: 0,
    features: [
      "Acesso ilimitado às videoaulas",
      "Acesso às propostas de redação",
      "Materiais de apoio básicos"
    ]
  },
  {
    type: "medium",
    name: "Plano Médio",
    description: "Para praticar regularmente",
    price: 9.90,
    tokens: 2,
    features: [
      "Tudo do plano básico",
      "2 correções de redação por mês",
      "Feedback detalhado por escrito",
      "Acesso a materiais exclusivos"
    ]
  },
  {
    type: "master",
    name: "Plano Mestre",
    description: "Para quem busca excelência",
    price: 19.90,
    tokens: 4,
    features: [
      "Tudo do plano médio",
      "4 correções de redação por mês",
      "Feedback detalhado por escrito",
      "Feedback em áudio do professor",
      "Acesso a materiais premium",
      "Prioridade na correção",
      "Suporte prioritário"
    ]
  },
  {
    type: "master_plus",
    name: "Plano Mestre++",
    description: "Experiência completa",
    price: 35.90,
    tokens: 6,
    features: [
      "Tudo do plano mestre",
      "6 correções de redação por mês",
      "Chat com professor",
      "Mentoria individual mensal",
      "Acesso a correções de outros alunos"
    ]
  }
]

interface Subscription {
  id: string
  userId: string
  type: Plan["type"] | 'private' | 'partner'
  status: "active" | "cancelled"
  createdAt: any
  updatedAt: any
  tokens: {
    available: number
    unlimited: boolean
  }
  partnerInfo?: {
    institutionId: string
    institutionName: string
    contractEndDate: any
  }
  privateInfo?: {
    teacherId: string
    teacherName: string
  }
}

export default function Assinatura() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successPlan, setSuccessPlan] = useState<Plan | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) return

      try {
        const subscriptionsRef = collection(db, "subscriptions")
        const q = query(
          subscriptionsRef,
          where("userId", "==", user.uid),
          where("status", "==", "active")
        )
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]
          setCurrentSubscription({
            id: doc.id,
            ...doc.data()
          } as Subscription)
        }
      } catch (error) {
        console.error("Erro ao buscar assinatura:", error)
      } finally {
        setLoadingSubscription(false)
      }
    }

    fetchSubscription()
  }, [user])

  const handleSubscribe = async () => {
    if (!user || !selectedPlan) return

    setLoading(true)

    try {
      const plan = PLANS.find(p => p.type === selectedPlan)
      if (!plan) throw new Error("Plano não encontrado")

      // Criar a subscription no Firestore
      const subscriptionRef = await addDoc(collection(db, "subscriptions"), {
        userId: user.uid,
        type: plan.type,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tokens: {
          available: plan.tokens,
          unlimited: false
        }
      })

      setSuccessPlan(plan)
      setShowSuccessModal(true)

      // Navegar de volta ou para o dashboard após 3 segundos
      setTimeout(() => {
        const returnTo = searchParams.get("returnTo")
        if (returnTo) {
          router.push(returnTo)
        } else {
          router.push("/dashboard")
        }
      }, 3000)
    } catch (error) {
      console.error("Erro ao criar assinatura:", error)
      toast({
        title: "Erro ao realizar assinatura",
        description: "Ocorreu um erro ao processar sua assinatura. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return

    setCancelling(true)

    try {
      // Atualizar o status da assinatura para cancelled
      const subscriptionRef = doc(db, "subscriptions", currentSubscription.id)
      await updateDoc(subscriptionRef, {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Buscar e atualizar todas as redações pendentes do usuário
      const essaysRef = collection(db, "essays")
      const essaysQuery = query(
        essaysRef,
        where("userId", "==", user?.uid),
        where("status", "==", "pending")
      )
      const essaysSnapshot = await getDocs(essaysQuery)
      
      const updatePromises = essaysSnapshot.docs.map(async (doc) => {
        await updateDoc(doc.ref, {
          status: "cancelled",
          cancelledAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      })

      await Promise.all(updatePromises)

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso.",
      })

      // Atualizar o estado local
      setCurrentSubscription(null)
      setShowCancelModal(false)
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error)
      toast({
        title: "Erro ao cancelar assinatura",
        description: "Ocorreu um erro ao cancelar sua assinatura. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      })
    } finally {
      setCancelling(false)
    }
  }

  if (loadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (currentSubscription) {
    const currentPlan = PLANS.find(p => p.type === currentSubscription.type)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sua Assinatura</h1>
          <p className="text-gray-500">Gerencie seu plano atual</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentPlan?.name}</CardTitle>
            <CardDescription>{currentPlan?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Assinatura ativa</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correções disponíveis</p>
                <p className="text-lg font-semibold">
                  {currentSubscription.type === 'partner' || currentSubscription.type === 'private' 
                    ? "Correções ilimitadas" 
                    : `${currentSubscription.tokens.available} / ${currentSubscription.tokens.available}`}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button variant="outline" disabled>
              Trocar Plano
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelModal(true)}
              disabled={currentSubscription.type === 'partner' || currentSubscription.type === 'private'}
            >
              Cancelar Assinatura
            </Button>
          </CardFooter>
        </Card>

        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-6 w-6" />
                Cancelar Assinatura
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar sua assinatura? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Suas correções pendentes serão canceladas</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Você perderá acesso aos benefícios do plano</span>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Manter Assinatura
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  "Confirmar Cancelamento"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <>
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Assinatura realizada com sucesso!
            </DialogTitle>
            <DialogDescription>
              Seu plano {successPlan?.name} foi ativado com sucesso. Você será redirecionado para o dashboard em instantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>Plano ativado: {successPlan?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>{successPlan?.tokens} correções disponíveis por mês</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>Suporte prioritário ativado</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">Escolha seu Plano</h1>
          <p className="text-gray-500 mt-2">
            Invista no seu futuro com a melhor plataforma de correção de redações
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <Card 
              key={plan.type} 
              className={`cursor-pointer transition-all relative ${
                selectedPlan === plan.type ? "border-primary ring-2 ring-primary" : ""
              } ${
                plan.type === "master" ? "border-2 border-primary shadow-lg" : ""
              }`}
              onClick={() => setSelectedPlan(plan.type)}
            >
              {plan.type === "master" && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Mais Popular
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  {plan.price === 0 ? "Grátis" : `R$ ${plan.price.toFixed(2)}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mês</span>}
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={selectedPlan === plan.type ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPlan(plan.type)
                  }}
                >
                  {selectedPlan === plan.type ? "Plano Selecionado" : "Selecionar Plano"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button 
            size="lg" 
            onClick={handleSubscribe}
            disabled={!selectedPlan || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Assinar Plano"
            )}
          </Button>
        </div>
      </div>
    </>
  )
} 