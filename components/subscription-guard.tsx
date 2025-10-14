"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useSubscription } from '@/hooks/use-subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, MessageCircle, Video, Folder } from 'lucide-react'
import { Loader2 } from 'lucide-react'

interface SubscriptionGuardProps {
  children: React.ReactNode
  requiredPlan: 'free' | 'avulsa' | 'mestre' | 'private' | 'partner'
  feature: 'videoaulas' | 'materiais' | 'redacoes' | 'propostas' | 'chat'
  fallback?: React.ReactNode
}

const FEATURE_INFO = {
  videoaulas: {
    title: 'Videoaulas Exclusivas',
    description: 'Acesso às videoaulas para planos Mestre, Parceiro ou Avulso com token ativo',
    icon: Video,
    plans: ['mestre', 'private', 'partner']  // Avulso é tratado separadamente
  },
  materiais: {
    title: 'Material Didático',
    description: 'Acesso ao material didático para planos Mestre, Parceiro ou Avulso com token ativo',
    icon: Folder,
    plans: ['mestre', 'private', 'partner']  // Avulso é tratado separadamente
  },
  redacoes: {
    title: 'Envio de Redações',
    description: 'Envio de redações disponível para todos os planos exceto o gratuito',
    icon: Lock,
    plans: ['avulsa', 'mestre', 'private', 'partner']
  },
  propostas: {
    title: 'Propostas de Redação',
    description: 'Acesso às propostas de redação é gratuito para todos',
    icon: Lock,
    plans: ['free', 'avulsa', 'mestre', 'private', 'partner']
  },
  chat: {
    title: 'Chat com Professor',
    description: 'Chat disponível para planos Mestre, Parceiro ou Avulso com token ativo',
    icon: MessageCircle,
    plans: ['mestre', 'private', 'partner']  // Avulso é tratado separadamente
  }
}

export function SubscriptionGuard({ 
  children, 
  requiredPlan, 
  feature, 
  fallback 
}: SubscriptionGuardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { subscription, loading } = useSubscription()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (!subscription) {
      // Usuário sem assinatura - redirecionar para página de planos
      setHasAccess(false)
      return
    }

    const featureInfo = FEATURE_INFO[feature]
    let hasRequiredAccess = featureInfo.plans.includes(subscription.type as any)
    
    // Regra especial para AVULSA: tem acesso se tiver token ativo
    if ((subscription.type as string) === 'avulsa' && subscription.tokens && subscription.tokens.available > 0) {
      // Avulsa com token ativo tem acesso a tudo exceto propostas (que já tem acesso livre)
      if (feature === 'videoaulas' || feature === 'materiais' || feature === 'chat') {
        hasRequiredAccess = true
      }
    }
    
    setHasAccess(hasRequiredAccess)
  }, [user, subscription, loading, feature, router])

  const handleWhatsAppContact = () => {
    let message = ''
    
    switch (feature) {
      case 'videoaulas':
        message = `Oi! 👋 Vi que as videoaulas são exclusivas para alguns planos. Queria saber quais planos dão acesso às videoaulas e como funciona esse recurso. Poderia me explicar? 📚✨`
        break
      case 'materiais':
        message = `Oi! 👋 Queria acessar o material didático da plataforma! Quais planos incluem esse recurso e que tipo de materiais vocês oferecem? 📖📚`
        break
      case 'redacoes':
        message = `Oi! 👋 Queria enviar redações para correção! Vi que preciso de um plano específico. Quais são as opções disponíveis e como funciona o processo de correção? 📝✨`
        break
      case 'propostas':
        message = `Oi! 👋 Queria acessar as propostas de redação! Vi que tem acesso gratuito, mas queria saber se tem propostas exclusivas nos planos pagos. Como funciona? 📋📝`
        break
      case 'chat':
        message = `Oi! 👋 Queria ter acesso ao chat com professor! Vi que é exclusivo para alguns planos. Como funciona essa funcionalidade e quais planos incluem? 💬👨‍🏫`
        break
      default:
        message = `Oi! 👋 Gostaria de saber mais sobre os planos que dão acesso às ${feature}. Poderia me ajudar? 😊`
    }
    
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/5521981120169?text=${encodedMessage}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (hasAccess === false) {
    if (fallback) {
      return <>{fallback}</>
    }

    const featureInfo = FEATURE_INFO[feature]
    const Icon = featureInfo.icon

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Icon className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle>{featureInfo.title}</CardTitle>
            <CardDescription>{featureInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Seu plano atual não tem acesso a este recurso.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={handleWhatsAppContact}
                  className="w-full flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar com o Mestre
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard/plano')}
                  className="w-full"
                >
                  Ver Planos Disponíveis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
} 