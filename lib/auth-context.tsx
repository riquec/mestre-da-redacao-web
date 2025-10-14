"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User as FirebaseUser } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc, addDoc, collection, getDocs as getDocsFirestore, query as queryFirestore, where as whereFirestore } from "firebase/firestore"
import { getFirebaseAuth, getFirebaseFirestore } from "./firebase"
import { User } from "./types"
import { deleteUser } from "firebase/auth"
import { logger } from "./logger"

interface AuthContextType {
  user: FirebaseUser | null
  userName: string | null
  loading: boolean
  role: 'student' | 'professor' | 'admin' | null
  userProfile: User | null
  createUserDocument: (user: FirebaseUser, displayName: string, promoCode?: string) => Promise<User | null>
  cleanupUserOnError: (user: FirebaseUser) => Promise<void>
  fetchUserData: (userId: string) => Promise<User | null>
  updateLastLogin: (userId: string) => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'student' | 'professor' | 'admin' | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)

  const cleanupUserOnError = async (user: FirebaseUser) => {
    try {
      // Tentar deletar o documento do usuário no Firestore
      const db = getFirebaseFirestore()
      const userRef = doc(db, "users", user.uid)
      await deleteDoc(userRef)
      console.log('Documento do usuário deletado com sucesso')
      
      // Deletar o usuário do Auth
      await deleteUser(user)
      console.log('Usuário deletado do Auth com sucesso')
      
      // Limpar o estado
      setUser(null)
      setUserName(null)
      setRole(null)
    } catch (error) {
      console.error('Erro ao limpar usuário:', error)
      throw error
    }
  }

  const createUserDocument = async (user: FirebaseUser, displayName: string, promoCode?: string) => {
    try {
      console.log('Iniciando criação do documento do usuário:', user.uid)
      const db = getFirebaseFirestore()
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)
      let couponData: any = null
      let partnerId: string | null = null
      let subscriptionType: "free" | "private" | "partner" = "free"
      let tokens = { available: 0 }

      // Buscar cupom no Firestore se informado
      if (promoCode) {
        const couponSnap = await getDoc(doc(db, "coupons", promoCode.trim().toUpperCase()))
        if (!couponSnap.exists() || !couponSnap.data().active) {
          throw new Error("Cupom inválido ou inativo. Verifique o código e tente novamente.")
        }
        couponData = couponSnap.data()
        if (couponData.type === "partner") {
          subscriptionType = "partner"
          tokens = { available: 6 }
          partnerId = couponData.partnerId || null
        } else if (couponData.type === "private") {
          subscriptionType = "private"
          tokens = { available: 6 }
        }
      }
      
      if (!userDoc.exists()) {
        console.log('Criando novo documento para o usuário')
        const newUser: any = {
          id: user.uid,
          name: displayName,
          email: user.email || "",
          role: "student",
          createdAt: serverTimestamp() as any,
          lastLogin: serverTimestamp() as any,
        }
        
        // Adicionar campos opcionais apenas se existirem
        if (couponData) {
          newUser.couponUsed = couponData.id
        }
        if (partnerId) {
          newUser.partnerId = partnerId
        }
        
        console.log('Dados do novo usuário:', newUser)
        await setDoc(userRef, newUser, { merge: false })
        console.log('Documento criado com sucesso')
        // Criar assinatura baseada no cupom
        await addDoc(collection(db, "subscriptions"), {
          userId: user.uid,
          type: subscriptionType,
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tokens,
        })
        console.log('Assinatura criada com sucesso')
        setRole("student")
        setUserName(displayName)
        return newUser
      }
      return null
    } catch (error) {
      console.error('Erro ao criar documento do usuário:', error)
      throw error
    }
  }

  // Função para buscar dados do usuário
  const fetchUserData = async (userId: string) => {
    try {
      logger.debug('Buscando dados do usuário', { 
        action: 'fetch_user_data', 
        component: 'AuthProvider',
        metadata: { userId } 
      })

      const db = getFirebaseFirestore()
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        console.log('DEBUG fetchUserData Firestore:', userData)
        setUserName(userData.name)
        setRole(userData.role)
        setUserProfile(userData)

        // Configurar usuário no logger
        logger.setUser({ id: userData.id, role: userData.role })
        
        logger.info('Usuário autenticado com sucesso', {
          action: 'user_authenticated',
          component: 'AuthProvider',
          metadata: { 
            userId: userData.id, 
            role: userData.role,
            name: userData.name 
          }
        })

        return userData
      }
      setUserProfile(null)
      return null
    } catch (error) {
      logger.error('Erro ao buscar dados do usuário', error as Error, {
        action: 'fetch_user_data_error',
        component: 'AuthProvider',
        metadata: { userId }
      })
      setUserProfile(null)
      return null
    }
  }

  // Função para atualizar o lastLogin de forma assíncrona
  const updateLastLogin = (userId: string) => {
    const db = getFirebaseFirestore()
    const userRef = doc(db, "users", userId)
    setDoc(userRef, {
      lastLogin: serverTimestamp()
    }, { merge: true })
    .catch(error => {
      console.error('Erro ao atualizar lastLogin:', error)
    })
  }

  useEffect(() => {
    logger.debug('Inicializando listener de autenticação', {
      component: 'AuthProvider',
      action: 'auth_listener_init'
    })

    const auth = getFirebaseAuth()
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        logger.debug('Estado de autenticação alterado - usuário logado', {
          component: 'AuthProvider',
          action: 'auth_state_changed',
          metadata: { userId: user.uid }
        })
      setUser(user)
        await fetchUserData(user.uid)
        } else {
        logger.debug('Estado de autenticação alterado - usuário deslogado', {
          component: 'AuthProvider',
          action: 'auth_state_changed'
        })
        setUser(null)
          setUserName(null)
        setRole(null)
        setUserProfile(null)
        // Limpar usuário do logger
        logger.setUser(null)
      }
        setLoading(false)
    })

    return () => {
      logger.debug('Removendo listener de autenticação', {
        component: 'AuthProvider',
        action: 'auth_listener_cleanup'
      })
      unsubscribe()
    }
  }, [])

  const contextValue = {
    user,
    userName,
    loading,
    role,
    userProfile,
    createUserDocument,
    cleanupUserOnError,
    fetchUserData,
    updateLastLogin
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
} 