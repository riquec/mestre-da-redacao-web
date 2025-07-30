"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Crown, 
  FileText, 
  User, 
  Building, 
  Coins,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { SubscriptionType } from '@/lib/types'

interface PlanChangeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: {
    id: string
    name: string
    email: string
    subscription: {
      id: string
      type: SubscriptionType
      tokens: {
        available: number
        unlimited: boolean
      }
    } | null
  }
  onConfirm: (data: {
    newPlan: SubscriptionType
    tokensToAdd: number
    reason: string
  }) => Promise<void>
  loading?: boolean
}

const PLAN_CONFIG = {
  free: {
    name: 'Gratuito',
    description: 'Acesso apenas às propostas de redação',
    icon: User,
    color: 'bg-gray-100 text-gray-800',
    defaultTokens: 0,
    unlimited: false
  },
  avulsa: {
    name: 'Avulsa',
    description: 'Correção individual com tokens configuráveis',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800',
    defaultTokens: 1,
    unlimited: false
  },
  mestre: {
    name: 'Mestre',
    description: '15 correções mensais + acesso completo',
    icon: Crown,
    color: 'bg-yellow-100 text-yellow-800',
    defaultTokens: 15,
    unlimited: false
  },
  private: {
    name: 'Privado',
    description: 'Aluno particular com correções ilimitadas',
    icon: User,
    color: 'bg-purple-100 text-purple-800',
    defaultTokens: 0,
    unlimited: true
  },
  partner: {
    name: 'Parceiro',
    description: 'Aluno de instituição parceira com correções ilimitadas',
    icon: Building,
    color: 'bg-green-100 text-green-800',
    defaultTokens: 0,
    unlimited: true
  }
}

export function PlanChangeModal({ 
  open, 
  onOpenChange, 
  student, 
  onConfirm, 
  loading = false 
}: PlanChangeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionType>(
    student.subscription?.type || 'free'
  )
  const [tokensToAdd, setTokensToAdd] = useState(0)
  const [reason, setReason] = useState('')
  const [step, setStep] = useState<'select' | 'confirm'>('select')

  const currentPlanConfig = student.subscription ? PLAN_CONFIG[student.subscription.type] : null
  const newPlanConfig = PLAN_CONFIG[selectedPlan]
  
  const totalTokens = newPlanConfig.defaultTokens + tokensToAdd
  const isUnlimited = newPlanConfig.unlimited

  const handleConfirm = async () => {
    try {
      await onConfirm({
        newPlan: selectedPlan,
        tokensToAdd,
        reason: reason.trim()
      })
      handleClose()
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleClose = () => {
    setStep('select')
    setSelectedPlan(student.subscription?.type || 'free')
    setTokensToAdd(0)
    setReason('')
    onOpenChange(false)
  }

  const handlePlanSelect = (plan: SubscriptionType) => {
    setSelectedPlan(plan)
    setTokensToAdd(0) // Reset tokens when changing plan
  }

  const isPlanUnchanged = selectedPlan === student.subscription?.type && tokensToAdd === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alterar Plano do Aluno</DialogTitle>
          <DialogDescription>
            Configure o novo plano para {student.name}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-6">
            {/* Informações do Aluno */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Aluno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><span className="font-medium">Nome:</span> {student.name}</p>
                <p><span className="font-medium">Email:</span> {student.email}</p>
                {currentPlanConfig && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">Plano atual:</span>
                    <Badge className={currentPlanConfig.color}>
                      {currentPlanConfig.name}
                    </Badge>
                    {student.subscription?.tokens && (
                      <span className="text-sm text-gray-600">
                        {student.subscription.tokens.unlimited 
                          ? 'Ilimitado' 
                          : `${student.subscription.tokens.available} tokens`
                        }
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seleção de Plano */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Escolha o Novo Plano</Label>
              <div className="grid gap-3">
                {Object.entries(PLAN_CONFIG).map(([planKey, config]) => {
                  const Icon = config.icon
                  const isSelected = selectedPlan === planKey
                  
                  return (
                    <div
                      key={planKey}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePlanSelect(planKey as SubscriptionType)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{config.name}</h4>
                            {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                          </div>
                          <p className="text-sm text-gray-600">{config.description}</p>
                          {!config.unlimited && (
                            <p className="text-xs text-gray-500 mt-1">
                              {config.defaultTokens} token{config.defaultTokens !== 1 ? 's' : ''} padrão
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Configuração de Tokens (apenas para planos não ilimitados) */}
            {!newPlanConfig.unlimited && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Configuração de Tokens</Label>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="defaultTokens">Tokens Padrão</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Coins className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{newPlanConfig.defaultTokens}</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="extraTokens">Tokens Extras</Label>
                        <Input
                          id="extraTokens"
                          type="number"
                          min="0"
                          max="50"
                          value={tokensToAdd}
                          onChange={(e) => setTokensToAdd(parseInt(e.target.value) || 0)}
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          Total: {totalTokens} token{totalTokens !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Motivo da Mudança */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Mudança (opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Pagamento confirmado via WhatsApp, aluno solicitou upgrade..."
                rows={3}
              />
            </div>

            {/* Resumo */}
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Resumo da Mudança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Plano atual:</span>
                  <Badge variant="outline">
                    {currentPlanConfig?.name || 'Sem assinatura'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Novo plano:</span>
                  <Badge className={newPlanConfig.color}>
                    {newPlanConfig.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tokens disponíveis:</span>
                  <span className="font-medium">
                    {isUnlimited ? 'Ilimitados' : `${totalTokens} tokens`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={() => setStep('confirm')}
                disabled={isPlanUnchanged}
                className="flex-1"
              >
                Confirmar Mudança
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            {/* Confirmação Final */}
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Confirmar Alteração de Plano</h3>
                <p className="text-gray-600 mt-2">
                  Você está prestes a alterar o plano de <strong>{student.name}</strong>
                </p>
              </div>
            </div>

            {/* Detalhes da Mudança */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">De:</span>
                    <Badge variant="outline">
                      {currentPlanConfig?.name || 'Sem assinatura'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Para:</span>
                    <Badge className={newPlanConfig.color}>
                      {newPlanConfig.name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tokens:</span>
                    <span className="font-medium">
                      {isUnlimited ? 'Ilimitados' : `${totalTokens} tokens`}
                    </span>
                  </div>
                  {reason && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-600">Motivo:</span>
                      <p className="text-sm mt-1">{reason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Alterando...' : 'Confirmar Alteração'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 