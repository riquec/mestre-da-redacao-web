"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Crown, 
  FileText, 
  Building, 
  User, 
  TrendingUp,
  Clock
} from 'lucide-react'

interface StudentsStatsProps {
  stats: {
    total: number
    byPlan: {
      free: number
      avulsa: number
      mestre: number
      private: number
      partner: number
    }
    active: number
    inactive: number
  }
}

const PLAN_ICONS = {
  free: User,
  avulsa: FileText,
  mestre: Crown,
  private: User,
  partner: Building
}

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-800',
  avulsa: 'bg-blue-100 text-blue-800',
  mestre: 'bg-yellow-100 text-yellow-800',
  private: 'bg-purple-100 text-purple-800',
  partner: 'bg-green-100 text-green-800'
}

export function StudentsStats({ stats }: StudentsStatsProps) {
  const totalActive = stats.byPlan.mestre + stats.byPlan.avulsa + stats.byPlan.private + stats.byPlan.partner

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total de Alunos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {totalActive} com planos ativos
          </p>
        </CardContent>
      </Card>

      {/* Alunos Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% do total
          </p>
        </CardContent>
      </Card>

      {/* Alunos Inativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alunos Inativos</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% do total
          </p>
        </CardContent>
      </Card>

      {/* Plano Mais Popular */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Plano Mais Popular</CardTitle>
          <Crown className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          {(() => {
            const plans = Object.entries(stats.byPlan)
            const mostPopular = plans.reduce((a, b) => a[1] > b[1] ? a : b)
            const Icon = PLAN_ICONS[mostPopular[0] as keyof typeof PLAN_ICONS]
            
            return (
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div>
                  <div className="text-lg font-bold">{mostPopular[1]}</div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {mostPopular[0]}
                  </p>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}

export function PlanDistribution({ stats }: StudentsStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Plano</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(stats.byPlan).map(([plan, count]) => {
            const Icon = PLAN_ICONS[plan as keyof typeof PLAN_ICONS]
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
            
            return (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="capitalize">{plan}</span>
                  <Badge className={PLAN_COLORS[plan as keyof typeof PLAN_COLORS]}>
                    {count}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{percentage}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 