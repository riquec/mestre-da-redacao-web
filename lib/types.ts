import { Timestamp } from 'firebase/firestore'

export type UserRole = 'student' | 'professor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: Timestamp
  lastLogin: Timestamp
  couponUsed?: string
  partnerId?: string
}

export type SubscriptionType = 'free' | 'avulsa' | 'mestre' | 'private' | 'partner'
export type SubscriptionStatus = 'active' | 'cancelled'

export interface Subscription {
  id: string
  userId: string
  type: SubscriptionType
  status: SubscriptionStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  tokens: {
    available: number
    unlimited: boolean
  }
  partnerInfo?: {
    institutionId: string
    institutionName: string
    contractEndDate: Timestamp
  }
  privateInfo?: {
    teacherId: string
    teacherName: string
  }
}

export type EssayStatus = 'pending' | 'done' | 'rejected'
export type CorrectionType = 'grammar' | 'coherence' | 'argumentation'

export interface Correction {
  assignedAt: Timestamp | null
  assignedTo: string | null
  completedAt: Timestamp | null
  feedback: string | null
  score: number | null
  status: 'pending' | 'done'
  corrections?: {
    type: CorrectionType
    description: string
    suggestion: string
  }[]
}

export interface EssayCorrection {
  score: number
  comments: string
  corrections: Correction[]
  professorId: string
}

export interface Essay {
  id: string
  userId: string
  files: { name: string; url: string }[]
  themeId: string
  status: EssayStatus
  submittedAt: Timestamp
  correctedAt?: Timestamp
  correction?: {
    score: {
      coesaoTextual: number
      compreensaoProposta: number
      dominioNormaCulta: number
      propostaIntervencao: number
      selecaoArgumentos: number
      total: number
    }
    status: string
    assignedTo?: string
    assignedAt?: Timestamp
    completedAt?: Timestamp
    feedback?: string
    audioFileUrl?: string
    correctionFileUrl?: string
  }
  theme?: {
    title: string
    category: string
    labels: string[]
  }
  userName?: string
  fileName?: string
  fileUrl?: string
  fileType?: string
  fileSize?: number
}

export interface EssayTheme {
  id: string
  title: string
  category: string
  year?: number
  tags: string[]
  file: {
    name: string
    url: string
  }
  createdAt: any
  updatedAt: any
  active: boolean
}

export interface Lesson {
  id: string
  title: string
  description: string
  videoUrl: string
  duration: number
  category: string
  createdAt: Timestamp
  professorId: string
  views: number
}

export interface LessonProgress {
  id: string
  userId: string
  lessonId: string
  progress: number
  lastWatched: Timestamp
  completed: boolean
}

export type ChatStatus = 'open' | 'closed'

export interface ChatMessage {
  id: string
  senderId: string
  content: string
  timestamp: Timestamp
  read: boolean
  attachments?: ChatAttachment[]
}

export interface ChatAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: Timestamp
}

export interface ChatTicket {
  id: string
  essayId?: string  // Tornando opcional
  userId: string
  professorId: string
  status: ChatStatus
  subject: string
  createdAt: Timestamp
  closedAt?: Timestamp
  closedBy?: string
  lastMessageAt: Timestamp
  messages: ChatMessage[]
}

// Manter interface Chat para compatibilidade (deprecated)
export interface Chat {
  id: string
  userId: string
  professorId: string
  status: ChatStatus
  createdAt: Timestamp
  lastMessage: Timestamp
  messages: ChatMessage[]
}

// Sistema de Logs - OpenTelemetry Pattern
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical'

export interface LogEntry {
  id: string
  timestamp: Timestamp
  level: LogLevel
  message: string
  context?: {
    userId?: string
    userRole?: UserRole
    action?: string
    component?: string
    page?: string
    metadata?: Record<string, any>
  }
  error?: {
    name: string
    message: string
    stack?: string
  }
  environment: 'development' | 'production'
  version: string
  sessionId: string
  userAgent?: string
}

export interface LogFilter {
  level?: LogLevel[]
  userId?: string
  component?: string
  page?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

export interface LogStats {
  total: number
  byLevel: Record<LogLevel, number>
  byComponent: Record<string, number>
  byPage: Record<string, number>
  recentErrors: LogEntry[]
}

// Tipos para gestão de alunos do professor
export interface StudentStats {
  essaysSubmitted: number
  essaysCorrected: number
  lessonsWatched: number
  tokensUsed: number
  averageScore?: number
  lastActivity?: Timestamp
}

export interface StudentInfo {
  id: string
  name: string
  email: string
  createdAt: Timestamp
  lastLogin: Timestamp
  subscription: Subscription | null
  stats: StudentStats
  partnerInfo?: {
    institutionName: string
    contractEndDate: Timestamp
  }
  privateInfo?: {
    teacherName: string
  }
}

export interface PlanChangeLog {
  id: string
  studentId: string
  oldPlan: SubscriptionType
  newPlan: SubscriptionType
  changedBy: string
  changedAt: Timestamp
  reason?: string
  tokensAdded?: number
}

export interface StudentFilters {
  search: string
  planType: SubscriptionType | 'all'
  status: 'active' | 'cancelled' | 'all'
  activity: 'active' | 'inactive' | 'all'
  dateRange: {
    start: Date | null
    end: Date | null
  }
} 