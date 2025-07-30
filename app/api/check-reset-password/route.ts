import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' }, 
        { status: 400 }
      )
    }

    console.log('🔍 Verificando reset pendente para:', email)

    // Procurar resets pendentes para este email
    const resetsQuery = query(
      collection(db, 'passwordResets'),
      where('email', '==', email),
      where('step', '==', 'password_set'),
      where('used', '==', true)
    )

    const resetDocs = await getDocs(resetsQuery)
    
    if (resetDocs.empty) {
      // Não há reset pendente, login normal
      return NextResponse.json({ 
        hasReset: false,
        message: 'Nenhuma redefinição pendente'
      })
    }

    // Há reset pendente, vamos aplicar a nova senha
    const resetDoc = resetDocs.docs[0]
    const resetData = resetDoc.data()
    const newPassword = resetData.newPassword

    console.log('✅ Reset pendente encontrado, aplicando nova senha')

    try {
      // Primeiro fazer login com senha atual para obter o usuário
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Atualizar senha
      await updatePassword(userCredential.user, newPassword)
      
      // Marcar reset como completo
      await updateDoc(doc(db, 'passwordResets', resetDoc.id), {
        step: 'completed',
        appliedAt: new Date()
      })

      console.log('✅ Senha atualizada com sucesso')

      return NextResponse.json({ 
        hasReset: true,
        applied: true,
        message: 'Senha atualizada com sucesso! Faça login com a nova senha.',
        newPassword: newPassword // Só para debug
      })

    } catch (authError: any) {
      console.error('❌ Erro ao aplicar nova senha:', authError)
      
      return NextResponse.json({ 
        hasReset: true,
        applied: false,
        error: 'Erro ao aplicar nova senha. Tente fazer login com a senha nova.',
        suggestion: 'Se não funcionar, solicite um novo reset.'
      })
    }

  } catch (error: any) {
    console.error('❌ Erro ao verificar reset:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message
      }, 
      { status: 500 }
    )
  }
} 