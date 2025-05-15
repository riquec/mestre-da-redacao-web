"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User as FirebaseUser } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc, addDoc, collection } from "firebase/firestore"
import { auth, db } from "./firebase"
import { User } from "./types"
import { deleteUser } from "firebase/auth"

interface AuthContextType {
  user: FirebaseUser | null
  userName: string | null
  loading: boolean
  role: 'student' | 'professor' | null
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
  const [role, setRole] = useState<'student' | 'professor' | null>(null)

  const cleanupUserOnError = async (user: FirebaseUser) => {
    try {
      // Tentar deletar o documento do usuário no Firestore
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
      
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        console.log('Criando novo documento para o usuário')
        const newUser: User = {
          id: user.uid,
          name: displayName,
          email: user.email || "",
          role: "student",
          createdAt: serverTimestamp() as any,
          lastLogin: serverTimestamp() as any,
        }

        console.log('Dados do novo usuário:', newUser)
        
        // Usando setDoc com merge: false para garantir que estamos criando um novo documento
        await setDoc(userRef, newUser, { merge: false })
        console.log('Documento criado com sucesso')

        // Criar assinatura baseada no código promocional
        const subscriptionRef = await addDoc(collection(db, "subscriptions"), {
          userId: user.uid,
          type: promoCode === "MESTRE_AMIGO" ? "private" : "free",
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tokens: {
            available: promoCode === "MESTRE_AMIGO" ? 0 : 0,
            unlimited: promoCode === "MESTRE_AMIGO"
          }
        })
        console.log('Assinatura criada com sucesso')
        
        // Atualizar o estado imediatamente
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
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        setUserName(userData.name)
        setRole(userData.role)
        return userData
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
      return null
    }
  }

  // Função para atualizar o lastLogin de forma assíncrona
  const updateLastLogin = (userId: string) => {
    const userRef = doc(db, "users", userId)
    setDoc(userRef, {
      lastLogin: serverTimestamp()
    }, { merge: true })
    .catch(error => {
      console.error('Erro ao atualizar lastLogin:', error)
    })
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed, user:', user?.uid)
      setUser(user)
      setLoading(true)

      try {
        if (user) {
          // Buscar dados do usuário no Firestore
          const userData = await fetchUserData(user.uid)
          if (!userData) {
            setUserName(null)
            setRole(null)
          }
        } else {
          setUserName(null)
          setRole(null)
          console.log('User logged out, role set to null')
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        setRole(null)
        setUserName(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const contextValue = {
    user,
    userName,
    loading,
    role,
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