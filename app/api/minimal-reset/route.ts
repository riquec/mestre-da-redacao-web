import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [MINIMAL] Iniciando teste minimal')
    
    const { email } = await request.json()
    console.log('📧 [MINIMAL] Email:', email)
    
    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL
    
    if (!apiKey || !fromEmail) {
      console.error('❌ [MINIMAL] Faltam variáveis de ambiente')
      return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })
    }
    
    console.log('🔑 [MINIMAL] Configurações OK')
    
    // Template super simples
    const htmlContent = `
      <html>
        <body>
          <h1>Teste Mínimo</h1>
          <p>Este é um email de teste básico do SendGrid.</p>
          <p>Se você está lendo isso, o SendGrid está funcionando!</p>
        </body>
      </html>
    `
    
    const emailData = {
      to: email,
      from: fromEmail,
      subject: 'Teste Mínimo SendGrid',
      html: htmlContent
    }
    
    console.log('📤 [MINIMAL] Enviando email...')
    
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(apiKey)
    
    const result = await sgMail.send(emailData)
    
    console.log('✅ [MINIMAL] Sucesso!', result[0]?.statusCode)
    console.log('🆔 [MINIMAL] Message ID:', result[0]?.headers?.['x-message-id'])
    
    return NextResponse.json({ 
      success: true, 
      status: result[0]?.statusCode,
      messageId: result[0]?.headers?.['x-message-id']
    })
    
  } catch (error: any) {
    console.error('❌ [MINIMAL] Erro:', error)
    
    return NextResponse.json({ 
      error: 'Erro no envio',
      details: error.message 
    }, { status: 500 })
  }
} 