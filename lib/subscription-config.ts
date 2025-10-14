/**
 * Configuração Central do Sistema de Assinaturas
 * 
 * IMPORTANTE: Este é o único lugar onde as regras de negócio
 * dos planos devem ser definidas. Qualquer mudança aqui
 * reflete em todo o sistema.
 */

export type PlanType = 'free' | 'avulso' | 'mestre' | 'private' | 'partner'

export interface PlanConfig {
  id: PlanType
  name: string
  displayName: string
  price: number | 'custom'
  tokens: {
    monthly?: number      // Para planos com renovação mensal
    perPurchase?: number  // Para planos avulsos
    unlimited?: boolean   // DEPRECATED: Removido - todos limitados a 6 correções
  }
  features: {
    propostas: boolean
    videoaulas: boolean | 'with_token'
    materiais: boolean | 'with_token'
    chat: boolean | 'with_token'
    envioRedacao: boolean | 'with_token'
  }
  description: string
  badge?: string
}

/**
 * Configuração dos Planos
 * Ordem de prioridade: free < avulso < mestre < partner
 */
export const SUBSCRIPTION_PLANS: Record<PlanType, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    displayName: 'Plano Gratuito',
    price: 0,
    tokens: {
      monthly: 0
    },
    features: {
      propostas: true,
      videoaulas: false,
      materiais: false,
      chat: false,
      envioRedacao: false
    },
    description: 'Acesso às propostas de redação',
    badge: 'FREE'
  },
  
  avulso: {
    id: 'avulso',
    name: 'Avulso',
    displayName: 'Compra Avulsa',
    price: 15,
    tokens: {
      perPurchase: 1
    },
    features: {
      propostas: true,
      videoaulas: 'with_token',
      materiais: 'with_token',
      chat: 'with_token',
      envioRedacao: 'with_token'
    },
    description: '1 correção + acesso temporário ao conteúdo',
    badge: 'AVULSO'
  },
  
  mestre: {
    id: 'mestre',
    name: 'Mestre',
    displayName: 'Plano Mestre',
    price: 100,
    tokens: {
      monthly: 6  // MUDANÇA PRINCIPAL: 15 → 6 correções
    },
    features: {
      propostas: true,
      videoaulas: true,
      materiais: true,
      chat: true,
      envioRedacao: true
    },
    description: '6 correções mensais + acesso completo',
    badge: 'MESTRE'
  },
  
  private: {
    id: 'private',
    name: 'Privado',
    displayName: 'Aluno Particular',
    price: 'custom',
    tokens: {
      monthly: 6
    },
    features: {
      propostas: true,
      videoaulas: true,
      materiais: true,
      chat: true,
      envioRedacao: true
    },
    description: '6 correções mensais + acesso completo',
    badge: 'PRIVADO'
  },
  
  partner: {
    id: 'partner',
    name: 'Parceiro',
    displayName: 'Aluno Parceiro',
    price: 'custom',
    tokens: {
      monthly: 6
    },
    features: {
      propostas: true,
      videoaulas: true,
      materiais: true,
      chat: true,
      envioRedacao: true
    },
    description: '6 correções mensais + acesso completo',
    badge: 'PARCEIRO'
  }
}

/**
 * Configurações Globais
 */
export const SUBSCRIPTION_CONFIG = {
  // Tokens
  MESTRE_MONTHLY_TOKENS: 6,  // Quantidade de tokens mensais para o plano Mestre
  AVULSO_TOKENS: 1,          // Tokens por compra avulsa
  
  // Reset de Tokens
  RESET_DAY: 1,              // Dia do mês para reset (1 = primeiro dia)
  RESET_HOUR: 0,             // Hora do reset (0 = meia-noite)
  
  // Validade do Token Avulso
  AVULSO_TOKEN_VALIDITY_DAYS: 30,  // Dias de validade do token avulso
  
  // Mensagens
  NO_TOKENS_MESSAGE: 'Você não possui correções disponíveis. Por favor, renove seu plano ou compre correções avulsas.',
  RESET_SUCCESS_MESSAGE: 'Seus tokens foram renovados com sucesso!',
  
  // URLs
  WHATSAPP_NUMBER: '5521981120169',
  WHATSAPP_MESSAGE: 'Olá! Gostaria de saber mais sobre os planos do Mestre da Redação.',
  
  // Feature Flags (para migração gradual)
  USE_NEW_SUBSCRIPTION_SYSTEM: false,  // Ativar quando estiver pronto
  ENABLE_AUTO_RESET: false,            // Ativar reset automático quando implementado
}

/**
 * Funções Auxiliares
 */

/**
 * Verifica se um plano tem acesso a uma funcionalidade
 */
export function hasFeatureAccess(
  planType: PlanType | undefined,
  feature: keyof PlanConfig['features'],
  hasActiveToken: boolean = false
): boolean {
  if (!planType) return false
  
  const plan = SUBSCRIPTION_PLANS[planType]
  if (!plan) return false
  
  const access = plan.features[feature]
  
  if (access === true) return true
  if (access === false) return false
  if (access === 'with_token') return hasActiveToken
  
  return false
}

/**
 * Obtém a quantidade de tokens mensais para um plano
 */
export function getMonthlyTokens(planType: PlanType): number {
  const plan = SUBSCRIPTION_PLANS[planType]
  if (!plan) return 0
  
  if (plan.tokens.monthly !== undefined) return plan.tokens.monthly
  if (plan.tokens.perPurchase !== undefined) return plan.tokens.perPurchase
  
  return 0
}

/**
 * Verifica se é o momento de resetar tokens
 */
export function shouldResetTokens(lastReset: Date | null): boolean {
  if (!lastReset) return true
  
  const now = new Date()
  const lastResetDate = new Date(lastReset)
  
  // Verifica se mudou o mês
  return now.getMonth() !== lastResetDate.getMonth() || 
         now.getFullYear() !== lastResetDate.getFullYear()
}

/**
 * Obtém descrição formatada do plano
 */
export function getPlanDescription(planType: PlanType): string {
  const plan = SUBSCRIPTION_PLANS[planType]
  if (!plan) return 'Plano desconhecido'
  
  if (plan.price === 'custom') {
    return plan.description
  }
  
  if (plan.price === 0) {
    return `${plan.description} - Gratuito`
  }
  
  return `${plan.description} - R$ ${plan.price}/mês`
}

/**
 * Verifica se usuário pode enviar redação
 */
export function canSubmitEssay(
  planType: PlanType | undefined,
  availableTokens: number
): boolean {
  if (!planType || planType === 'free') return false
  return availableTokens > 0
}

/**
 * Obtém URL do WhatsApp para contato
 */
export function getWhatsAppUrl(message?: string): string {
  const msg = message || SUBSCRIPTION_CONFIG.WHATSAPP_MESSAGE
  return `https://wa.me/${SUBSCRIPTION_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}