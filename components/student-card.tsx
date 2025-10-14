"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  MoreVertical, 
  FileText, 
  Video, 
  TrendingUp, 
  Clock, 
  User,
  Building,
  Crown,
  Settings,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { StudentInfo, SubscriptionType } from '@/lib/types'
import { PlanChangeModal } from './plan-change-modal'

interface StudentCardProps {
  student: StudentInfo
  onPlanChange: (studentId: string, subscriptionId: string | null, newPlan: SubscriptionType, reason?: string, tokensToAdd?: number) => void
  onDelete?: (studentId: string, studentName: string) => void
  loading?: boolean
}

const PLAN_CONFIG = {
  free: {
    name: 'Gratuito',
    color: 'bg-gray-100 text-gray-800',
    icon: User,
    description: 'Acesso básico'
  },
  avulsa: {
    name: 'Avulsa',
    color: 'bg-blue-100 text-blue-800',
    icon: FileText,
    description: '1 correção'
  },
  mestre: {
    name: 'Mestre',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Crown,
            description: '6 correções/mês'
  },
  private: {
    name: 'Privado',
    color: 'bg-purple-100 text-purple-800',
    icon: User,
    description: '6 correções/mês'
  },
  partner: {
    name: 'Parceiro',
    color: 'bg-green-100 text-green-800',
    icon: Building,
    description: '6 correções/mês'
  }
}

export function StudentCard({ student, onPlanChange, onDelete, loading = false }: StudentCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showPlanChange, setShowPlanChange] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [changingPlan, setChangingPlan] = useState(false)

  const planConfig = student.subscription ? PLAN_CONFIG[student.subscription.type] : PLAN_CONFIG.free
  const PlanIcon = planConfig.icon

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getLastActivityText = () => {
    if (!student.stats.lastActivity) return 'Nunca acessou'
    
    const lastActivity = student.stats.lastActivity.toDate()
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) return `${diffInHours}h atrás`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d atrás`
    return `${Math.floor(diffInHours / 168)}s atrás`
  }

  const handlePlanChange = async (data: {
    newPlan: SubscriptionType
    tokensToAdd: number
    reason: string
  }) => {
    setChangingPlan(true)
    try {
      await onPlanChange(
        student.id, 
        student.subscription?.id || null, 
        data.newPlan, 
        data.reason, 
        data.tokensToAdd
      )
    } finally {
      setChangingPlan(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-semibold">{student.name}</CardTitle>
              <p className="text-sm text-gray-500">{student.email}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDetails(true)}>
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPlanChange(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Plano
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Aluno
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status do Plano */}
        <div className="flex items-center gap-2">
          <Badge className={planConfig.color}>
            <PlanIcon className="h-3 w-3 mr-1" />
            {planConfig.name}
          </Badge>
          {student.subscription?.tokens && (
            <span className="text-sm text-gray-600">
              {`${student.subscription.tokens.available} tokens`}
            </span>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <FileText className="h-4 w-4" />
              <span className="font-semibold">{student.stats.essaysSubmitted}</span>
            </div>
            <p className="text-xs text-gray-500">Redações</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-green-600">
              <Video className="h-4 w-4" />
              <span className="font-semibold">{student.stats.lessonsWatched}</span>
            </div>
            <p className="text-xs text-gray-500">Aulas</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-purple-600">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">
                {student.stats.averageScore ? Math.round(student.stats.averageScore) : '-'}
              </span>
            </div>
            <p className="text-xs text-gray-500">Média</p>
          </div>
        </div>

        {/* Última Atividade */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>{getLastActivityText()}</span>
        </div>
      </CardContent>

      {/* Modal de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Aluno</DialogTitle>
            <DialogDescription>
              Informações completas sobre {student.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Informações Pessoais</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Nome:</span> {student.name}</p>
                  <p><span className="text-gray-500">Email:</span> {student.email}</p>
                  <p><span className="text-gray-500">Cadastro:</span> {student.createdAt.toDate().toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Plano Atual</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Tipo:</span> {planConfig.name}</p>
                  <p><span className="text-gray-500">Status:</span> {student.subscription?.status || 'Sem assinatura'}</p>
                  <p><span className="text-gray-500">Tokens:</span> {`${student.subscription?.tokens.available || 0} disponíveis`}</p>
                </div>
              </div>
            </div>

            {/* Estatísticas Detalhadas */}
            <div>
              <h4 className="font-semibold mb-2">Estatísticas de Uso</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p><span className="text-gray-500">Redações enviadas:</span> {student.stats.essaysSubmitted}</p>
                  <p><span className="text-gray-500">Redações corrigidas:</span> {student.stats.essaysCorrected}</p>
                  <p><span className="text-gray-500">Aulas assistidas:</span> {student.stats.lessonsWatched}</p>
                </div>
                <div className="space-y-1">
                  <p><span className="text-gray-500">Tokens utilizados:</span> {student.stats.tokensUsed}</p>
                  <p><span className="text-gray-500">Nota média:</span> {
                    student.stats.averageScore ? Math.round(student.stats.averageScore) : 'N/A'
                  }</p>
                  <p><span className="text-gray-500">Última atividade:</span> {getLastActivityText()}</p>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={() => handlePlanChange({ newPlan: 'mestre', tokensToAdd: 0, reason: 'Definido como Mestre' })}
                disabled={changingPlan || student.subscription?.type === 'mestre'}
                className="flex-1"
              >
                Definir como Mestre
              </Button>
              <Button 
                onClick={() => handlePlanChange({ newPlan: 'avulsa', tokensToAdd: 0, reason: 'Definido como Avulsa' })}
                disabled={changingPlan || student.subscription?.type === 'avulsa'}
                variant="outline"
                className="flex-1"
              >
                Definir como Avulsa
              </Button>
              <Button 
                onClick={() => handlePlanChange({ newPlan: 'free', tokensToAdd: 0, reason: 'Definido como Gratuito' })}
                disabled={changingPlan || student.subscription?.type === 'free'}
                variant="outline"
                className="flex-1"
              >
                Definir como Gratuito
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Alteração de Plano */}
      <PlanChangeModal
        open={showPlanChange}
        onOpenChange={setShowPlanChange}
        student={student}
        onConfirm={handlePlanChange}
        loading={changingPlan}
      />

      {/* Modal de Confirmação de Deleção */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a deletar permanentemente o aluno:
              </p>
              <div className="bg-gray-50 p-3 rounded-md space-y-1">
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-gray-600">{student.email}</p>
                <p className="text-sm">
                  Plano: <Badge variant="outline" className="ml-1">
                    {planConfig.name}
                  </Badge>
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                <p className="text-sm font-medium text-red-800 mb-1">
                  ⚠️ Esta ação é irreversível!
                </p>
                <p className="text-sm text-red-700">
                  Todos os dados do aluno serão permanentemente deletados, incluindo:
                </p>
                <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                  <li>Perfil e dados pessoais</li>
                  <li>Assinatura e histórico</li>
                  <li>Todas as redações enviadas</li>
                  <li>Todas as correções recebidas</li>
                  <li>Histórico de conversas no chat</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) {
                  onDelete(student.id, student.name)
                }
                setShowDeleteConfirm(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 