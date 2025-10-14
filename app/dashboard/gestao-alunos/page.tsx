"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getAllStudents, deleteUserCompletely, StudentData } from "@/lib/user-management"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Search, 
  Trash2, 
  User, 
  Mail, 
  Calendar,
  FileText,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

export default function GestaoAlunos() {
  const { role, user } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<StudentData[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Verificar se é professor
  useEffect(() => {
    if (!loading && role !== 'professor' && role !== 'admin') {
      router.push('/dashboard')
    }
  }, [role, loading, router])

  // Carregar alunos
  useEffect(() => {
    loadStudents()
  }, [])

  // Filtrar alunos baseado na busca
  useEffect(() => {
    const filtered = students.filter(student => {
      const searchLower = searchTerm.toLowerCase()
      return (
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.subscription?.type?.toLowerCase().includes(searchLower)
      )
    })
    setFilteredStudents(filtered)
  }, [searchTerm, students])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const data = await getAllStudents()
      setStudents(data)
      setFilteredStudents(data)
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
      toast.error('Erro ao carregar lista de alunos')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (student: StudentData) => {
    setSelectedStudent(student)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return

    try {
      setDeleting(true)
      await deleteUserCompletely(selectedStudent.id)
      
      toast.success(`Aluno ${selectedStudent.name} foi removido com sucesso`)
      
      // Recarregar lista
      await loadStudents()
      
      setShowDeleteDialog(false)
      setSelectedStudent(null)
    } catch (error) {
      console.error('Erro ao deletar aluno:', error)
      toast.error('Erro ao deletar aluno. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  const getPlanBadgeColor = (type?: string) => {
    switch (type) {
      case 'partner':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'mestre':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'avulso':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'free':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPlanDisplayName = (type?: string) => {
    switch (type) {
      case 'partner': return 'Parceiro'
      case 'mestre': return 'Mestre'
      case 'avulso': return 'Avulso'
      case 'free': return 'Gratuito'
      default: return 'Sem plano'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (role !== 'professor' && role !== 'admin') {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Alunos</h1>
        <p className="text-gray-500">
          Gerencie todos os alunos cadastrados na plataforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alunos Cadastrados</CardTitle>
              <CardDescription>
                Total de {students.length} alunos na plataforma
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Redações</TableHead>
                  <TableHead>Última Atividade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Nenhum aluno encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 rounded-full p-2">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getPlanBadgeColor(student.subscription?.type)}
                        >
                          {getPlanDisplayName(student.subscription?.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {student.subscription?.tokens?.available || 0} disponíveis
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{student.essaysCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {student.lastActivity 
                            ? format(new Date(student.lastActivity), "dd/MM/yyyy", { locale: ptBR })
                            : 'Nunca'
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(student)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmação de deleção */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              {selectedStudent && (
                <div className="bg-gray-50 p-3 rounded-md space-y-1">
                  <p className="font-medium">{selectedStudent.name}</p>
                  <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                  <p className="text-sm">
                    Plano: <Badge variant="outline" className="ml-1">
                      {getPlanDisplayName(selectedStudent.subscription?.type)}
                    </Badge>
                  </p>
                </div>
              )}
              <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                <p className="text-sm font-medium text-red-800 mb-1">
                  ⚠️ Esta ação é irreversível!
                </p>
                <p className="text-sm text-red-700">
                  Todos os dados do aluno serão permanentemente deletados, incluindo:
                </p>
                <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                  <li>Perfil e dados pessoais</li>
                  <li>Assinatura e histórico de pagamentos</li>
                  <li>Todas as redações enviadas</li>
                  <li>Todas as correções recebidas</li>
                  <li>Histórico de conversas no chat</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deletando...
                </>
              ) : (
                'Deletar Permanentemente'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}