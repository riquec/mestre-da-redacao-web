import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] Iniciando chamada para /api/simple-reset')
    console.log('🌐 [API] Timestamp:', new Date().toISOString())
    
    // Receber dados da requisição
    console.log('📥 [API] Recebendo dados da requisição...')
    const { email } = await request.json()
    console.log('📧 [API] Email recebido:', email)
    
    // Verificar variáveis de ambiente
    console.log('🔑 [API] Verificando variáveis de ambiente...')
    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    
    console.log('🔑 [API] SENDGRID_API_KEY existe:', !!apiKey)
    console.log('🔑 [API] SENDGRID_FROM_EMAIL:', fromEmail)
    console.log('🔑 [API] NEXT_PUBLIC_SITE_URL:', siteUrl)
    
    if (!apiKey || !fromEmail) {
      console.error('❌ [API] Variáveis de ambiente não encontradas')
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 })
    }
    
    // Criar link de reset simples
    const resetLink = `${siteUrl}/redefinir-senha?email=${encodeURIComponent(email)}`
    console.log('🔗 [API] Link de reset:', resetLink)
    
    // Template HTML mais simples
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redefinir Senha</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Redefinir Senha - Mestre da Redação</h2>
          <p>Olá!</p>
          <p>Você solicitou a redefinição de sua senha. Clique no link abaixo:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
          <p>Se você não solicitou esta redefinição, ignore este email.</p>
          <p>Atenciosamente,<br>Equipe Mestre da Redação</p>
        </body>
      </html>
    `
    
    console.log('📄 [API] Template HTML criado, tamanho:', htmlContent.length, 'caracteres')
    
    // Configurar dados do email
    const emailData = {
      to: email,
      from: {
        email: fromEmail,
        name: 'Mestre da Redação'
      },
      subject: 'Redefinir Senha - Mestre da Redação',
      html: htmlContent
    }
    
    console.log('🔄 Enviando email para:', email)
    console.log('📧 Configuração do email:', {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject
    })
    
    // Enviar via SendGrid
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(apiKey)
    
    const result = await sgMail.send(emailData)
    console.log('✅ Email enviado com sucesso!')
    console.log('📊 Resposta do SendGrid:', result[0]?.statusCode, result[0]?.headers)
    
    // Verificar se obtivemos message ID
    if (result[0]?.headers && result[0].headers['x-message-id']) {
      console.log('🔍 Message ID:', result[0].headers['x-message-id'])
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado com sucesso!',
      messageId: result[0]?.headers?.['x-message-id'] || 'N/A'
    })
    
  } catch (error: any) {
    console.error('❌ [API] Erro completo:', error)
    console.error('❌ [API] Erro stack:', error.stack)
    console.error('❌ [API] Erro response:', error.response?.body)
    
    return NextResponse.json({ 
      error: 'Erro ao enviar email',
      details: error.message,
      sendgridError: error.response?.body
    }, { status: 500 })
  }
} 