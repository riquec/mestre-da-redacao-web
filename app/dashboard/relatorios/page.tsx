"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, FileText, Award, Target, Calendar } from "lucide-react"
import { useEssays } from "@/hooks/use-essays"
import { Skeleton } from "@/components/ui/skeleton"

interface EssayScore {
  coesaoTextual: number
  compreensaoProposta: number
  dominioNormaCulta: number
  propostaIntervencao: number
  selecaoArgumentos: number
  total: number
}

interface EssayData {
  id: string
  submittedAt: any
  correctedAt?: any
  correction?: {
    score: EssayScore
    status: string
  }
  theme?: {
    title: string
    category: string
  }
}

const COMPETENCIA_COLORS = [
  '#ef4444', // Competência 1 - Vermelho
  '#f97316', // Competência 2 - Laranja
  '#a855f7', // Competência 3 - Roxo
  '#22c55e', // Competência 4 - Verde
  '#3b82f6', // Competência 5 - Azul
]

// Mapeamento das competências na ordem correta do ENEM
const COMPETENCIA_MAPPING = [
  { key: 'dominioNormaCulta', name: 'Competência 1', description: 'Norma culta' },
  { key: 'compreensaoProposta', name: 'Competência 2', description: 'Compreensão da proposta, estrutura textual e uso de repertório sociocultural' },
  { key: 'selecaoArgumentos', name: 'Competência 3', description: 'Desenvolvimento argumentativo' },
  { key: 'coesaoTextual', name: 'Competência 4', description: 'Coesão textual' },
  { key: 'propostaIntervencao', name: 'Competência 5', description: 'Proposta de intervenção' }
]

export default function Relatorios() {
  const { essays, loading, error } = useEssays({ limit: 100 }) // Buscar mais redações para análise
  
  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    
    console.log('Página de relatórios carregada')
  }, [])

  // Log de debug dos dados
  useEffect(() => {
    if (essays && essays.length > 0) {
      console.log('Redações carregadas para relatórios:', {
        total_essays: essays.length,
        corrected_essays: essays.filter(e => e?.correction?.status === 'done').length
      })
    }
  }, [essays])
  
  // Filtrar apenas redações corrigidas
  const correctedEssays = useMemo(() => {
    if (!Array.isArray(essays)) return []
    return essays.filter(essay => 
      essay?.correction?.status === 'done' && 
      essay?.correction?.score?.total > 0
    ).sort((a, b) => {
      const dateA = a.correctedAt?.toDate?.() || a.submittedAt?.toDate?.() || new Date(0)
      const dateB = b.correctedAt?.toDate?.() || b.submittedAt?.toDate?.() || new Date(0)
      return dateA.getTime() - dateB.getTime()
    })
  }, [essays])

  // Dados para gráfico de evolução temporal
  const evolutionData = useMemo(() => {
    return correctedEssays.map((essay, index) => {
      const date = essay.correctedAt?.toDate?.() || essay.submittedAt?.toDate?.()
      return {
        redacao: `Redação ${index + 1}`,
        data: date ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '',
        competencia1: essay.correction?.score?.dominioNormaCulta || 0,
        competencia2: essay.correction?.score?.compreensaoProposta || 0,
        competencia3: essay.correction?.score?.selecaoArgumentos || 0,
        competencia4: essay.correction?.score?.coesaoTextual || 0,
        competencia5: essay.correction?.score?.propostaIntervencao || 0,
        total: essay.correction?.score?.total || 0,
      }
    })
  }, [correctedEssays])

  // Dados para gráfico de distribuição por competência
  const competencyData = useMemo(() => {
    if (correctedEssays.length === 0) return []
    
    const totals = correctedEssays.reduce((acc, essay) => {
      const score = essay.correction?.score
      if (score) {
        acc.dominioNormaCulta += score.dominioNormaCulta
        acc.compreensaoProposta += score.compreensaoProposta
        acc.selecaoArgumentos += score.selecaoArgumentos
        acc.coesaoTextual += score.coesaoTextual
        acc.propostaIntervencao += score.propostaIntervencao
      }
      return acc
    }, {
      dominioNormaCulta: 0,
      compreensaoProposta: 0,
      selecaoArgumentos: 0,
      coesaoTextual: 0,
      propostaIntervencao: 0
    })

    const count = correctedEssays.length
    
    return COMPETENCIA_MAPPING.map((comp, index) => ({
      name: comp.name,
      value: Math.round((totals[comp.key as keyof typeof totals] / count) * 10) / 10,
      color: COMPETENCIA_COLORS[index]
    }))
  }, [correctedEssays])

  // Estatísticas gerais
  const stats = useMemo(() => {
    if (correctedEssays.length === 0) {
      return {
        totalRedacoes: 0,
        mediaGeral: 0,
        melhorNota: 0,
        ultimaNota: 0,
        progressoUltimaRedacao: 0
      }
    }

    const notas = correctedEssays.map(essay => essay.correction?.score?.total || 0)
    const mediaGeral = notas.reduce((sum, nota) => sum + nota, 0) / notas.length
    const melhorNota = Math.max(...notas)
    const ultimaNota = notas[notas.length - 1] || 0
    
    // Progresso comparando última com penúltima redação
    const progressoUltimaRedacao = notas.length > 1 
      ? ultimaNota - notas[notas.length - 2]
      : 0

    console.log('Estatísticas calculadas:', {
      totalRedacoes: correctedEssays.length,
      mediaGeral: Math.round(mediaGeral * 10) / 10,
      melhorNota,
      ultimaNota,
      progressoUltimaRedacao: Math.round(progressoUltimaRedacao * 10) / 10
    })

    return {
      totalRedacoes: correctedEssays.length,
      mediaGeral: Math.round(mediaGeral * 10) / 10,
      melhorNota,
      ultimaNota,
      progressoUltimaRedacao: Math.round(progressoUltimaRedacao * 10) / 10
    }
  }, [correctedEssays])

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="space-y-6">
          <div className="bg-white">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Relatórios de Desempenho</h1>
            <p className="text-gray-500">Acompanhe sua evolução nas redações</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-white border-gray-200">
                <CardHeader className="pb-2 bg-white">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent className="bg-white">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white border-gray-200">
              <CardHeader className="bg-white">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="bg-white">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200">
              <CardHeader className="bg-white">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="bg-white">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <div className="text-center py-10">
          <p className="text-red-500">{String(error)}</p>
        </div>
      </div>
    )
  }

  if (correctedEssays.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <div className="space-y-6">
          <div className="bg-white">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Relatórios de Desempenho</h1>
            <p className="text-gray-500">Acompanhe sua evolução nas redações</p>
          </div>
          
          <Card className="bg-white border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12 bg-white">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma redação corrigida ainda</h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                Envie suas redações e aguarde as correções para ver seus relatórios de desempenho
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-6">
        <div className="bg-white">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Relatórios de Desempenho</h1>
          <p className="text-gray-500">Acompanhe sua evolução nas redações</p>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-white">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-900">
                <FileText className="h-4 w-4" />
                Total de Redações
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="text-2xl font-bold text-gray-900">{stats.totalRedacoes}</div>
              <p className="text-xs text-gray-500">Redações corrigidas</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-white">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-900">
                <Target className="h-4 w-4" />
                Média Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="text-2xl font-bold text-gray-900">{stats.mediaGeral}</div>
              <p className="text-xs text-gray-500">Pontos em média</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-white">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-900">
                <Award className="h-4 w-4" />
                Melhor Nota
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="text-2xl font-bold text-gray-900">{stats.melhorNota}</div>
              <p className="text-xs text-gray-500">Sua maior pontuação</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-white">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-900">
                <TrendingUp className="h-4 w-4" />
                Progresso
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="flex items-center gap-1">
                <div className="text-2xl font-bold text-gray-900">{stats.progressoUltimaRedacao > 0 ? '+' : ''}{stats.progressoUltimaRedacao}</div>
                <Badge variant={stats.progressoUltimaRedacao >= 0 ? 'default' : 'destructive'} className="text-xs">
                  {stats.progressoUltimaRedacao >= 0 ? 'Melhora' : 'Queda'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">Última redação</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Evolução ao longo do tempo */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Evolução por Competência</CardTitle>
              <CardDescription className="text-gray-600">Progresso ao longo das redações</CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="redacao" fontSize={12} />
                    <YAxis domain={[0, 200]} fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="competencia1" stroke={COMPETENCIA_COLORS[0]} strokeWidth={2} name="Competência 1" />
                    <Line type="monotone" dataKey="competencia2" stroke={COMPETENCIA_COLORS[1]} strokeWidth={2} name="Competência 2" />
                    <Line type="monotone" dataKey="competencia3" stroke={COMPETENCIA_COLORS[2]} strokeWidth={2} name="Competência 3" />
                    <Line type="monotone" dataKey="competencia4" stroke={COMPETENCIA_COLORS[3]} strokeWidth={2} name="Competência 4" />
                    <Line type="monotone" dataKey="competencia5" stroke={COMPETENCIA_COLORS[4]} strokeWidth={2} name="Competência 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Média por competência */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Média por Competência</CardTitle>
              <CardDescription className="text-gray-600">Suas médias em cada competência</CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={competencyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 200]} fontSize={12} />
                    <Tooltip 
                      formatter={(value) => [value, 'Nota']}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evolução da nota total */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-gray-900">Evolução da Nota Total</CardTitle>
            <CardDescription className="text-gray-600">Progresso geral ao longo das redações</CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="redacao" fontSize={12} />
                  <YAxis domain={[0, 1000]} fontSize={12} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    name="Nota Total"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Legenda das competências */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-gray-900">Legenda das Competências</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
              {COMPETENCIA_MAPPING.map((comp, index) => (
                <div key={comp.key} className="flex items-start gap-3">
                  <div 
                    className="w-4 h-4 rounded-full mt-0.5 shrink-0"
                    style={{ backgroundColor: COMPETENCIA_COLORS[index] }}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{comp.name}</span>
                    <p className="text-xs text-gray-500 mt-1">{comp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 