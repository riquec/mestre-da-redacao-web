import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { LogLevel, LogEntry, UserRole } from './types'
import { v4 as uuidv4 } from 'uuid'

class Logger {
  private sessionId: string
  private environment: 'development' | 'production'
  private version: string
  private fallbackLogs: LogEntry[] = []
  private currentUser: { id?: string; role?: UserRole } | null = null

  constructor() {
    this.sessionId = uuidv4()
    this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    this.version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    
    // Tentar enviar logs em fallback a cada 30 segundos
    if (typeof window !== 'undefined') {
      setInterval(() => this.flushFallbackLogs(), 30000)
    }
  }

  setUser(user: { id: string; role: UserRole } | null) {
    this.currentUser = user
  }

  private async createLogEntry(
    level: LogLevel,
    message: string,
    options?: {
      action?: string
      component?: string
      page?: string
      metadata?: Record<string, any>
      error?: Error
    }
  ): Promise<LogEntry> {
    // Função para limpar valores undefined
    const cleanObject = (obj: any): any => {
      if (obj === null || obj === undefined) return null
      if (typeof obj !== 'object') return obj
      
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = typeof value === 'object' ? cleanObject(value) : value
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : null
    }

    const logEntry: LogEntry = {
      id: uuidv4(),
      timestamp: serverTimestamp() as any,
      level,
      message,
      context: cleanObject({
        userId: this.currentUser?.id || null,
        userRole: this.currentUser?.role || null,
        action: options?.action || null,
        component: options?.component || null,
        page: options?.page || null,
        metadata: options?.metadata ? cleanObject(options.metadata) : null,
      }),
      error: options?.error ? cleanObject({
        name: options.error.name,
        message: options.error.message,
        stack: options.error.stack,
      }) : null,
      environment: this.environment,
      version: this.version,
      sessionId: this.sessionId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    }

    return logEntry
  }

  private async sendToFirebase(logEntry: LogEntry): Promise<boolean> {
    try {
      // Verificar se o usuário está autenticado
      const { auth } = await import('./firebase')
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        // Se não estiver autenticado, não tentar enviar para Firestore
        console.log('Usuário não autenticado, pulando envio para Firestore')
        return false
      }

      // Criar uma cópia limpa do logEntry removendo campos undefined
      const cleanEntry = JSON.parse(JSON.stringify(logEntry, (key, value) => {
        return value === undefined ? null : value
      }))
      
      await addDoc(collection(db, 'logs'), {
        ...cleanEntry,
        timestamp: serverTimestamp(), // Garantir timestamp do servidor
      })
      return true
    } catch (error: any) {
      console.error('Falha ao enviar log para Firebase:', error)
      
      // Se for erro de permissão, não é crítico
      if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        console.log('Erro de permissão esperado para usuário não autenticado')
        return false
      }
      
      return false
    }
  }

  private async sendToAnalyticsFallback(logEntry: LogEntry): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      // Tentar usar Firebase Analytics como fallback
      const { analytics } = await import('./firebase')
      if (analytics) {
        const { logEvent } = await import('firebase/analytics')
        await logEvent(analytics, 'error_logged', {
          level: logEntry.level,
          message: logEntry.message.substring(0, 100), // Limitar tamanho
          action: logEntry.context?.action || 'unknown',
          component: logEntry.context?.component || 'unknown',
          page: logEntry.context?.page || 'unknown',
          user_role: logEntry.context?.userRole || 'unknown',
        })
        console.log('Log enviado para Firebase Analytics como fallback')
        return true
      }
    } catch (error) {
      console.error('Erro ao enviar para Analytics:', error)
    }
    return false
  }

  private async sendToFallback(logEntry: LogEntry) {
    // Tentar Analytics primeiro para logs críticos
    if (logEntry.level === 'error' || logEntry.level === 'critical') {
      const analyticsSuccess = await this.sendToAnalyticsFallback(logEntry)
      if (analyticsSuccess) return
    }

    // Armazenar em localStorage como fallback final
    if (typeof window === 'undefined') return
    
    try {
      const existingLogs = localStorage.getItem('fallback_logs')
      const logs = existingLogs ? JSON.parse(existingLogs) : []
      logs.push({
        ...logEntry,
        timestamp: new Date().toISOString(), // Converter para string para localStorage
      })
      
      // Manter apenas os últimos 50 logs no fallback (reduzido de 100)
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50)
      }
      
      localStorage.setItem('fallback_logs', JSON.stringify(logs))
      this.fallbackLogs.push(logEntry)
      
      // Fallback final - console estruturado apenas para logs críticos
      if (logEntry.level === 'error' || logEntry.level === 'critical') {
        console.error('FALLBACK FINAL - Log crítico:', {
          level: logEntry.level,
          message: logEntry.message,
          timestamp: new Date().toISOString(),
          context: logEntry.context,
          error: logEntry.error,
        })
      }
    } catch (error) {
      console.error('Falha ao armazenar log em fallback:', error)
    }
  }

  private async flushFallbackLogs() {
    if (this.fallbackLogs.length === 0) return

    const logsToSend = [...this.fallbackLogs]
    this.fallbackLogs = []

    for (const log of logsToSend) {
      const success = await this.sendToFirebase(log)
      if (!success) {
        // Se falhar novamente, recolocar na fila
        this.fallbackLogs.push(log)
      }
    }

    // Limpar localStorage se conseguiu enviar
    if (this.fallbackLogs.length === 0 && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('fallback_logs')
      } catch (error) {
        console.error('Erro ao limpar fallback logs:', error)
      }
    }
  }

  private async logWithLevel(
    level: LogLevel,
    message: string,
    options?: {
      action?: string
      component?: string
      page?: string
      metadata?: Record<string, any>
      error?: Error
    }
  ) {
    const logEntry = await this.createLogEntry(level, message, options)

    // Sempre mostrar no console em desenvolvimento
    if (this.environment === 'development') {
      const consoleMethod = level === 'error' || level === 'critical' ? 'error' 
                          : level === 'warning' ? 'warn'
                          : level === 'debug' ? 'debug'
                          : 'log'
      
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, {
        context: logEntry.context,
        error: logEntry.error,
      })
    }

    // Em desenvolvimento, só tentar enviar para Firebase se for crítico
    if (this.environment === 'development' && level !== 'error' && level !== 'critical') {
      return // Não enviar logs não críticos em desenvolvimento
    }

    // Tentar enviar para Firebase
    const success = await this.sendToFirebase(logEntry)
    
    // Se falhar, usar fallback
    if (!success) {
      await this.sendToFallback(logEntry)
    }
  }

  // Métodos públicos seguindo padrão OpenTelemetry
  debug(message: string, options?: { 
    action?: string; component?: string; page?: string; metadata?: Record<string, any> 
  }) {
    return this.logWithLevel('debug', message, options)
  }

  info(message: string, options?: { 
    action?: string; component?: string; page?: string; metadata?: Record<string, any> 
  }) {
    return this.logWithLevel('info', message, options)
  }

  warning(message: string, options?: { 
    action?: string; component?: string; page?: string; metadata?: Record<string, any> 
  }) {
    return this.logWithLevel('warning', message, options)
  }

  error(message: string, error?: Error, options?: { 
    action?: string; component?: string; page?: string; metadata?: Record<string, any> 
  }) {
    return this.logWithLevel('error', message, { ...options, error })
  }

  critical(message: string, error?: Error, options?: { 
    action?: string; component?: string; page?: string; metadata?: Record<string, any> 
  }) {
    return this.logWithLevel('critical', message, { ...options, error })
  }

  // Métodos de conveniência para casos específicos
  userAction(action: string, metadata?: Record<string, any>, options?: {
    component?: string; page?: string
  }) {
    return this.info(`Ação do usuário: ${action}`, {
      action: 'user_action',
      metadata: { userAction: action, ...metadata },
      ...options
    })
  }

  apiCall(endpoint: string, method: string, metadata?: Record<string, any>) {
    return this.info(`API Call: ${method} ${endpoint}`, {
      action: 'api_call',
      metadata: { endpoint, method, ...metadata }
    })
  }

  businessRule(rule: string, metadata?: Record<string, any>, options?: {
    component?: string; page?: string
  }) {
    return this.info(`Regra de negócio: ${rule}`, {
      action: 'business_rule',
      metadata: { rule, ...metadata },
      ...options
    })
  }

  // Método para forçar flush dos logs
  async flush() {
    await this.flushFallbackLogs()
  }
}

// Instância singleton
const logger = new Logger()

// Hook para usar o logger com contexto
export function useLogger(component?: string, page?: string) {
  return {
    debug: (message: string, options?: { action?: string; metadata?: Record<string, any> }) =>
      logger.debug(message, { ...options, component, page }),
    
    info: (message: string, options?: { action?: string; metadata?: Record<string, any> }) =>
      logger.info(message, { ...options, component, page }),
    
    warning: (message: string, options?: { action?: string; metadata?: Record<string, any> }) =>
      logger.warning(message, { ...options, component, page }),
    
    error: (message: string, error?: Error, options?: { action?: string; metadata?: Record<string, any> }) =>
      logger.error(message, error, { ...options, component, page }),
    
    critical: (message: string, error?: Error, options?: { action?: string; metadata?: Record<string, any> }) =>
      logger.critical(message, error, { ...options, component, page }),
    
    userAction: (action: string, metadata?: Record<string, any>) =>
      logger.userAction(action, metadata, { component, page }),
    
    apiCall: (endpoint: string, method: string, metadata?: Record<string, any>) =>
      logger.apiCall(endpoint, method, metadata),
    
    businessRule: (rule: string, metadata?: Record<string, any>) =>
      logger.businessRule(rule, metadata, { component, page }),
  }
}

export { logger }
export default logger 