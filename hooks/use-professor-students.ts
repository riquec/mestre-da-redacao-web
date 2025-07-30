import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { StudentInfo, StudentFilters, PlanChangeLog, SubscriptionType, Subscription } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context'

export function useProfessorStudents() {
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<StudentFilters>({
    search: '',
    planType: 'all',
    status: 'all',
    activity: 'all',
    dateRange: { start: null, end: null }
  })
  const [stats, setStats] = useState({
    total: 0,
    byPlan: {
      free: 0,
      avulsa: 0,
      mestre: 0,
      private: 0,
      partner: 0
    },
    active: 0,
    inactive: 0
  })
  const { toast } = useToast()
  const { user } = useAuth()

  // Buscar alunos com estatísticas
  const fetchStudents = async () => {
    setLoading(true)
    try {
      // Buscar usuários estudantes
      const usersRef = collection(db, 'users')
      const usersQuery = query(usersRef, where('role', '==', 'student'), orderBy('createdAt', 'desc'))
      const usersSnap = await getDocs(usersQuery)
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))

      // Buscar assinaturas
      const subsRef = collection(db, 'subscriptions')
      const subsSnap = await getDocs(subsRef)
      const subscriptions = subsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription))

      // Buscar redações para estatísticas
      const essaysRef = collection(db, 'essays')
      const essaysSnap = await getDocs(essaysRef)
      const essays = essaysSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Buscar progresso de aulas
      const progressRef = collection(db, 'lessonProgress')
      const progressSnap = await getDocs(progressRef)
      const progress = progressSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Montar dados completos dos alunos
      const studentsData: StudentInfo[] = users.map(user => {
        const subscription = subscriptions.find(sub => sub.userId === user.id && sub.status === 'active')
        const userEssays = essays.filter((essay: any) => essay.userId === user.id)
        const userProgress = progress.filter((prog: any) => prog.userId === user.id)

        const stats = {
          essaysSubmitted: userEssays.length,
          essaysCorrected: userEssays.filter((e: any) => e.status === 'done').length,
          lessonsWatched: userProgress.filter((p: any) => p.completed).length,
          tokensUsed: subscription ? (subscription.tokens.unlimited ? 0 : 15 - subscription.tokens.available) : 0,
          averageScore: userEssays.length > 0 ? 
            userEssays.reduce((acc: number, e: any) => acc + (e.correction?.score?.total || 0), 0) / userEssays.length : 0,
          lastActivity: user.lastLogin
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          subscription: subscription || null,
          stats,
          partnerInfo: subscription?.partnerInfo,
          privateInfo: subscription?.privateInfo
        }
      })

      setStudents(studentsData)
      updateStats(studentsData)
    } catch (error) {
      console.error('Erro ao buscar alunos:', error)
      toast({
        title: "Erro ao carregar alunos",
        description: "Não foi possível carregar a lista de alunos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Atualizar estatísticas
  const updateStats = (studentsData: StudentInfo[]) => {
    const byPlan = {
      free: studentsData.filter(s => s.subscription?.type === 'free').length,
      avulsa: studentsData.filter(s => s.subscription?.type === 'avulsa').length,
      mestre: studentsData.filter(s => s.subscription?.type === 'mestre').length,
      private: studentsData.filter(s => s.subscription?.type === 'private').length,
      partner: studentsData.filter(s => s.subscription?.type === 'partner').length
    }

    const active = studentsData.filter(s => s.subscription?.status === 'active').length
    const inactive = studentsData.length - active

    setStats({
      total: studentsData.length,
      byPlan,
      active,
      inactive
    })
  }

  // Alterar plano do aluno
  const changeStudentPlan = async (
    studentId: string, 
    subscriptionId: string | null, 
    newPlan: SubscriptionType,
    reason?: string,
    tokensToAdd?: number
  ) => {
    try {
      // Calcular tokens baseado no plano
      let tokensAvailable = 0
      let unlimited = false

      switch (newPlan) {
        case 'free':
          tokensAvailable = 0
          unlimited = false
          break
        case 'avulsa':
          tokensAvailable = 1
          unlimited = false
          break
        case 'mestre':
          tokensAvailable = 15
          unlimited = false
          break
        case 'private':
        case 'partner':
          tokensAvailable = 0
          unlimited = true
          break
      }

      // Adicionar tokens extras se especificado
      if (tokensToAdd) {
        tokensAvailable += tokensToAdd
      }

      let finalSubscriptionId = subscriptionId
      let oldPlan = 'none'

      if (subscriptionId) {
        // Atualizar assinatura existente
        const subRef = doc(db, 'subscriptions', subscriptionId)
        const subDoc = await getDocs(query(collection(db, 'subscriptions'), where('id', '==', subscriptionId)))
        if (!subDoc.empty) {
          oldPlan = subDoc.docs[0].data().type || 'none'
        }
        
        await updateDoc(subRef, {
          type: newPlan,
          tokens: {
            available: tokensAvailable,
            unlimited
          },
          updatedAt: serverTimestamp()
        })
      } else {
        // Criar nova assinatura
        const newSubscription = {
          userId: studentId,
          type: newPlan,
          status: 'active' as const,
          tokens: {
            available: tokensAvailable,
            unlimited
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        
        const subRef = await addDoc(collection(db, 'subscriptions'), newSubscription)
        finalSubscriptionId = subRef.id
      }

      // Log da mudança
      const logData = {
        studentId,
        oldPlan,
        newPlan,
        changedBy: user?.uid || 'unknown',
        changedAt: serverTimestamp(),
        reason: reason || '',
        tokensAdded: tokensToAdd || 0,
        subscriptionId: finalSubscriptionId
      }
      
      await addDoc(collection(db, 'planChangeLogs'), logData)

      // Atualizar estado local
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? {
              ...student,
              subscription: {
                id: finalSubscriptionId!,
                userId: studentId,
                type: newPlan,
                status: 'active',
                tokens: { available: tokensAvailable, unlimited },
                createdAt: serverTimestamp() as any,
                updatedAt: serverTimestamp() as any
              }
            }
          : student
      ))

      toast({
        title: "Plano alterado com sucesso!",
        description: `Aluno ${students.find(s => s.id === studentId)?.name} agora tem o plano ${newPlan}`,
      })

      // Recarregar dados para atualizar estatísticas
      await fetchStudents()
    } catch (error) {
      console.error('Erro ao alterar plano:', error)
      toast({
        title: "Erro ao alterar plano",
        description: "Não foi possível alterar o plano do aluno",
        variant: "destructive"
      })
      throw error // Re-throw para o componente tratar
    }
  }

  // Filtrar alunos
  const filteredStudents = students.filter(student => {
    const searchMatch = student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                       student.email.toLowerCase().includes(filters.search.toLowerCase())
    
    const planMatch = filters.planType === 'all' || student.subscription?.type === filters.planType
    
    const statusMatch = filters.status === 'all' || student.subscription?.status === filters.status
    
    const activityMatch = filters.activity === 'all' || 
      (filters.activity === 'active' && student.stats.lastActivity && 
       new Date().getTime() - student.stats.lastActivity.toDate().getTime() < 7 * 24 * 60 * 60 * 1000) ||
      (filters.activity === 'inactive' && (!student.stats.lastActivity || 
       new Date().getTime() - student.stats.lastActivity.toDate().getTime() >= 7 * 24 * 60 * 60 * 1000))

    return searchMatch && planMatch && statusMatch && activityMatch
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  return {
    students: filteredStudents,
    loading,
    stats,
    filters,
    setFilters,
    changeStudentPlan,
    refreshStudents: fetchStudents
  }
} 