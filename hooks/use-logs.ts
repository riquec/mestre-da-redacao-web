import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LogEntry, LogFilter, LogStats, LogLevel } from '@/lib/types'

export function useLogs(filter?: LogFilter, pageSize: number = 50) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      try {
        let q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(pageSize))

        // Aplicar filtros
        if (filter?.level && filter.level.length > 0) {
          q = query(q, where('level', 'in', filter.level))
        }
        if (filter?.userId) {
          q = query(q, where('context.userId', '==', filter.userId))
        }
        if (filter?.component) {
          q = query(q, where('context.component', '==', filter.component))
        }
        if (filter?.page) {
          q = query(q, where('context.page', '==', filter.page))
        }

        const querySnapshot = await getDocs(q)
        const logsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LogEntry[]

        // Filtro de busca textual (client-side)
        let filteredLogs = logsData
        if (filter?.search) {
          const searchTerm = filter.search.toLowerCase()
          filteredLogs = logsData.filter(log => 
            log.message.toLowerCase().includes(searchTerm) ||
            log.context?.action?.toLowerCase().includes(searchTerm) ||
            log.context?.metadata && JSON.stringify(log.context.metadata).toLowerCase().includes(searchTerm)
          )
        }

        // Filtro de data (client-side)
        if (filter?.startDate) {
          filteredLogs = filteredLogs.filter(log => {
            const logDate = log.timestamp instanceof Timestamp ? log.timestamp.toDate() : new Date(log.timestamp)
            return logDate >= filter.startDate!
          })
        }
        if (filter?.endDate) {
          filteredLogs = filteredLogs.filter(log => {
            const logDate = log.timestamp instanceof Timestamp ? log.timestamp.toDate() : new Date(log.timestamp)
            return logDate <= filter.endDate!
          })
        }

        setLogs(filteredLogs)

        // Calcular estatísticas
        const statsData: LogStats = {
          total: filteredLogs.length,
          byLevel: {
            debug: filteredLogs.filter(l => l.level === 'debug').length,
            info: filteredLogs.filter(l => l.level === 'info').length,
            warning: filteredLogs.filter(l => l.level === 'warning').length,
            error: filteredLogs.filter(l => l.level === 'error').length,
            critical: filteredLogs.filter(l => l.level === 'critical').length,
          },
          byComponent: {},
          byPage: {},
          recentErrors: filteredLogs.filter(l => l.level === 'error' || l.level === 'critical').slice(0, 10)
        }

        // Contar por componente
        filteredLogs.forEach(log => {
          const component = log.context?.component || 'Unknown'
          statsData.byComponent[component] = (statsData.byComponent[component] || 0) + 1
        })

        // Contar por página
        filteredLogs.forEach(log => {
          const page = log.context?.page || 'Unknown'
          statsData.byPage[page] = (statsData.byPage[page] || 0) + 1
        })

        setStats(statsData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [filter, pageSize])

  return { logs, stats, loading, error }
}

export function useLogStats() {
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        // Buscar logs das últimas 24 horas
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        const q = query(
          collection(db, 'logs'),
          where('timestamp', '>=', yesterday),
          orderBy('timestamp', 'desc'),
          limit(1000)
        )

        const querySnapshot = await getDocs(q)
        const logs = querySnapshot.docs.map(doc => doc.data()) as LogEntry[]

        const statsData: LogStats = {
          total: logs.length,
          byLevel: {
            debug: logs.filter(l => l.level === 'debug').length,
            info: logs.filter(l => l.level === 'info').length,
            warning: logs.filter(l => l.level === 'warning').length,
            error: logs.filter(l => l.level === 'error').length,
            critical: logs.filter(l => l.level === 'critical').length,
          },
          byComponent: {},
          byPage: {},
          recentErrors: logs.filter(l => l.level === 'error' || l.level === 'critical').slice(0, 10)
        }

        // Contar por componente
        logs.forEach(log => {
          const component = log.context?.component || 'Unknown'
          statsData.byComponent[component] = (statsData.byComponent[component] || 0) + 1
        })

        // Contar por página
        logs.forEach(log => {
          const page = log.context?.page || 'Unknown'
          statsData.byPage[page] = (statsData.byPage[page] || 0) + 1
        })

        setStats(statsData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
} 