"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useProfessorStudents } from "@/hooks/use-professor-students"
import { deleteUserCompletely } from "@/lib/user-management"
import { StudentCard } from "@/components/student-card"
import { StudentsStats, PlanDistribution } from "@/components/students-stats"
import { StudentsFilters } from "@/components/students-filters"
import { 
  RefreshCw, 
  Download, 
  Users, 
  TrendingUp,
  Loader2
} from "lucide-react"
import { useLogger } from "@/lib/logger"
import { SubscriptionType } from "@/lib/types"

export default function ProfessorAlunos() {
  const { toast } = useToast()
  const log = useLogger('ProfessorAlunos', '/professor/dashboard/alunos')
  const {
    students,
    loading,
    stats,
    filters,
    setFilters,
    changeStudentPlan,
    refreshStudents
  } = useProfessorStudents()

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página de gestão de alunos carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced' }
    })
  }, [log])

  const handlePlanChange = async (
    studentId: string, 
    subscriptionId: string | null, 
    newPlan: SubscriptionType,
    reason?: string,
    tokensToAdd?: number
  ) => {
    try {
      await changeStudentPlan(studentId, subscriptionId, newPlan, reason, tokensToAdd)
    } catch (error) {
      console.error('Erro ao alterar plano:', error)
    }
  }

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    try {
      await deleteUserCompletely(studentId)
      toast({
        title: "Aluno removido",
        description: `${studentName} foi removido permanentemente do sistema.`,
      })
      // Recarregar lista de alunos
      await refreshStudents()
    } catch (error) {
      console.error('Erro ao deletar aluno:', error)
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o aluno. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshStudents()
      toast({
        title: "Dados atualizados!",
        description: "A lista de alunos foi atualizada com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados.",
        variant: "destructive"
      })
    }
  }

  const handleExport = () => {
    // TODO: Implementar exportação de dados
    toast({
      title: "Exportação",
      description: "Funcionalidade de exportação será implementada em breve.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Alunos</h1>
          <p className="text-gray-500">
            Gerencie os planos e acompanhe o progresso dos seus alunos
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <StudentsStats stats={stats} />

      {/* Filtros */}
      <StudentsFilters 
        filters={filters}
        onFiltersChange={setFilters}
        stats={stats}
      />

      {/* Distribuição por Plano */}
      <div className="grid gap-6 md:grid-cols-2">
        <PlanDistribution stats={stats} />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo de Atividade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-green-700">Alunos Ativos</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
                <div className="text-sm text-orange-700">Alunos Inativos</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>• <strong>{stats.byPlan.mestre}</strong> alunos no plano Mestre</p>
              <p>• <strong>{stats.byPlan.avulsa}</strong> compras avulsas</p>
              <p>• <strong>{stats.byPlan.private + stats.byPlan.partner}</strong> alunos especiais</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alunos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alunos ({students.length})
            </CardTitle>
            
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24" />
                        <div className="h-3 bg-gray-200 rounded w-32" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-20" />
                    <div className="grid grid-cols-3 gap-4">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-8 bg-gray-200 rounded" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum aluno encontrado
              </h3>
              <p className="text-gray-500">
                {filters.search || filters.planType !== 'all' || filters.status !== 'all' || filters.activity !== 'all'
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Ainda não há alunos cadastrados na plataforma.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onPlanChange={handlePlanChange}
                  onDelete={handleDeleteStudent}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 