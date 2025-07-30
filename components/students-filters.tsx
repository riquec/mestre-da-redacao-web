"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  X,
  Users,
  Crown,
  FileText,
  User,
  Building
} from 'lucide-react'
import { StudentFilters, SubscriptionType } from '@/lib/types'

interface StudentsFiltersProps {
  filters: StudentFilters
  onFiltersChange: (filters: StudentFilters) => void
  stats: {
    byPlan: {
      free: number
      avulsa: number
      mestre: number
      private: number
      partner: number
    }
  }
}

const PLAN_LABELS = {
  free: 'Gratuito',
  avulsa: 'Avulsa',
  mestre: 'Mestre',
  private: 'Privado',
  partner: 'Parceiro'
}

const PLAN_ICONS = {
  free: User,
  avulsa: FileText,
  mestre: Crown,
  private: User,
  partner: Building
}

export function StudentsFilters({ filters, onFiltersChange, stats }: StudentsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilter = (key: keyof StudentFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      planType: 'all',
      status: 'all',
      activity: 'all',
      dateRange: { start: null, end: null }
    })
  }

  const hasActiveFilters = filters.search || 
    filters.planType !== 'all' || 
    filters.status !== 'all' || 
    filters.activity !== 'all'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Simples' : 'Avançado'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros Rápidos por Plano */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.planType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('planType', 'all')}
            className="flex items-center gap-1"
          >
            <Users className="h-3 w-3" />
            Todos ({Object.values(stats.byPlan).reduce((a, b) => a + b, 0)})
          </Button>
          
          {Object.entries(stats.byPlan).map(([plan, count]) => {
            const Icon = PLAN_ICONS[plan as keyof typeof PLAN_ICONS]
            return (
              <Button
                key={plan}
                variant={filters.planType === plan ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilter('planType', plan)}
                className="flex items-center gap-1"
              >
                <Icon className="h-3 w-3" />
                {PLAN_LABELS[plan as keyof typeof PLAN_LABELS]} ({count})
              </Button>
            )
          })}
        </div>

        {/* Filtros Avançados */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Atividade */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Atividade</label>
              <Select value={filters.activity} onValueChange={(value) => updateFilter('activity', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos (últimos 7 dias)</SelectItem>
                  <SelectItem value="inactive">Inativos (7+ dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Plano Específico */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Plano Específico</label>
              <Select value={filters.planType} onValueChange={(value) => updateFilter('planType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Planos</SelectItem>
                  {Object.entries(PLAN_LABELS).map(([plan, label]) => (
                    <SelectItem key={plan} value={plan}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Filtros Ativos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-gray-500">Filtros ativos:</span>
            
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Busca: "{filters.search}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('search', '')}
                />
              </Badge>
            )}
            
            {filters.planType !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Plano: {PLAN_LABELS[filters.planType as keyof typeof PLAN_LABELS]}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('planType', 'all')}
                />
              </Badge>
            )}
            
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {filters.status === 'active' ? 'Ativos' : 'Cancelados'}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('status', 'all')}
                />
              </Badge>
            )}
            
            {filters.activity !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Atividade: {filters.activity === 'active' ? 'Ativos' : 'Inativos'}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('activity', 'all')}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 