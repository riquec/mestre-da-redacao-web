import { Timestamp } from 'firebase/firestore'

export type UserRole = 'student' | 'professor'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: Timestamp
  lastLogin: Timestamp
}

export type SubscriptionType = 'free' | 'private' | 'partner' | 'medium' | 'master' | 'master_plus'
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
}

export interface Chat {
  id: string
  userId: string
  professorId: string
  status: ChatStatus
  createdAt: Timestamp
  lastMessage: Timestamp
  messages: ChatMessage[]
} 