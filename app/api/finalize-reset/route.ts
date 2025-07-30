import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { updatePassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { email, currentPassword } = await request.json()

    if (!email || !currentPassword) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('🔍 Verificando reset pendente para:', email)

    // Buscar tokens de reset pendentes para este email
    const resetQuery = query(
      collection(db, 'passwordResets'),
      where('email', '==', email),
      where('step', '==', 'password_set'),
      where('used', '==', false)
    )

    const resetDocs = await getDocs(resetQuery)
    
    if (resetDocs.empty) {
      return NextResponse.json({ hasReset: false })
    }

    const resetDoc = resetDocs.docs[0]
    const resetData = resetDoc.data()

    // Verificar se token expirou
    const now = new Date()
    const expiresAt = resetData.expiresAt.toDate()
    
    if (now > expiresAt) {
      return NextResponse.json({ hasReset: false })
    }

    console.log('🔄 Finalizando reset de senha para:', email)

    try {
      // Fazer login com a senha atual para obter o usuário
      const userCredential = await signInWithEmailAndPassword(auth, email, currentPassword)
      const user = userCredential.user

      // Atualizar para a nova senha
      await updatePassword(user, resetData.newPassword)

      // Marcar token como usado
      await updateDoc(doc(db, 'passwordResets', resetDoc.id), {
        used: true,
        usedAt: new Date(),
        finalizedAt: new Date()
      })

      console.log('✅ Reset de senha finalizado com sucesso para:', email)

      return NextResponse.json({
        success: true,
        message: 'Reset de senha finalizado com sucesso!',
        hasReset: true
      })

    } catch (authError: any) {
      console.error('❌ Erro no Firebase Auth:', authError)
      
      // Se a senha atual não funcionar, usar a nova senha do reset
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-login-credentials') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, resetData.newPassword)
          
          // Marcar token como usado
          await updateDoc(doc(db, 'passwordResets', resetDoc.id), {
            used: true,
            usedAt: new Date(),
            finalizedAt: new Date()
          })

          console.log('✅ Reset já aplicado - usuário logado com nova senha')

          return NextResponse.json({
            success: true,
            message: 'Reset já aplicado anteriormente',
            hasReset: true
          })
        } catch (newPasswordError) {
          console.error('❌ Erro com nova senha:', newPasswordError)
          return NextResponse.json({ hasReset: false })
        }
      }

      return NextResponse.json({ hasReset: false })
    }

  } catch (error: any) {
    console.error('❌ Erro ao finalizar reset:', error)
    return NextResponse.json({ hasReset: false })
  }
} 