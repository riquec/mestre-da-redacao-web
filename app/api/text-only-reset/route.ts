import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [TEXT-ONLY] Iniciando teste texto puro')
    
    const { email } = await request.json()
    console.log('📧 [TEXT-ONLY] Email:', email)
    
    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL
    
    if (!apiKey || !fromEmail) {
      console.error('❌ [TEXT-ONLY] Faltam variáveis de ambiente')
      return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })
    }
    
    console.log('🔑 [TEXT-ONLY] Configurações OK')
    
    // Apenas texto puro
    const textContent = `
TESTE DE EMAIL - TEXTO PURO

Este é um email de teste usando apenas texto.
Sem HTML, sem formatação especial.

Se você está lendo isso, significa que o SendGrid está funcionando corretamente!

Enviado em: ${new Date().toISOString()}
Email destino: ${email}
    `
    
    const emailData = {
      to: email,
      from: fromEmail,
      subject: 'Teste Texto Puro - SendGrid',
      text: textContent
    }
    
    console.log('📤 [TEXT-ONLY] Enviando email texto puro...')
    
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(apiKey)
    
    const result = await sgMail.send(emailData)
    
    console.log('✅ [TEXT-ONLY] Sucesso!', result[0]?.statusCode)
    console.log('🆔 [TEXT-ONLY] Message ID:', result[0]?.headers?.['x-message-id'])
    
    return NextResponse.json({ 
      success: true, 
      status: result[0]?.statusCode,
      messageId: result[0]?.headers?.['x-message-id'],
      type: 'text-only'
    })
    
  } catch (error: any) {
    console.error('❌ [TEXT-ONLY] Erro:', error)
    console.error('❌ [TEXT-ONLY] Stack:', error.stack)
    
    return NextResponse.json({ 
      error: 'Erro no envio texto',
      details: error.message 
    }, { status: 500 })
  }
} 