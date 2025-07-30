import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

// Template HTML para o email
const getEmailTemplate = (resetLink: string, userName: string = 'Usuário') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha - Mestre da Redação</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Mestre da Redação</h1>
            <p>Redefinir Senha</p>
        </div>
        
        <div class="content">
            <h2>Olá, ${userName}!</h2>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Mestre da Redação</strong>.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="button">Redefinir Senha</a>
            </div>
            
            <p><strong>⚠️ Este link expira em 1 hora por segurança.</strong></p>
            
            <p>Se você não solicitou esta redefinição, ignore este email.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe Mestre da Redação</strong></p>
        </div>
        
        <div class="footer">
            <p>© 2024 Mestre da Redação. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
`

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()
        
        if (!email) {
            return NextResponse.json(
                { error: 'Email é obrigatório' },
                { status: 400 }
            )
        }
        
        // Gerar token de reset
        const resetToken = Math.random().toString(36).substr(2, 15)
        const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/redefinir-senha?token=${resetToken}&email=${encodeURIComponent(email)}`
        
        // Configurar email com Gmail verificado
        const msg = {
            to: email,
            from: {
                email: 'henriqueeejc@gmail.com', // Gmail verificado
                name: 'Mestre da Redação (Teste)'
            },
            subject: '🔑 Redefinir Senha - Mestre da Redação (TESTE)',
            html: getEmailTemplate(resetLink, email.split('@')[0]),
            text: `
Olá!

Recebemos uma solicitação para redefinir a senha da sua conta no Mestre da Redação.

Para criar uma nova senha, acesse este link:
${resetLink}

Este link expira em 1 hora por segurança.

Se você não solicitou esta redefinição, ignore este email.

Atenciosamente,
Equipe Mestre da Redação (TESTE)
            `.trim()
        }
        
        console.log('🔄 [GMAIL] Enviando email para:', email)
        console.log('📧 [GMAIL] Configuração:', {
            to: email,
            from: msg.from,
            subject: msg.subject
        })
        
        const result = await sgMail.send(msg)
        
        console.log('✅ [GMAIL] Email enviado com sucesso!')
        console.log('📊 [GMAIL] Resposta:', result[0]?.statusCode)
        
        return NextResponse.json({ 
            success: true, 
            message: 'Email enviado via Gmail com sucesso!',
            resetToken: resetToken
        })
        
    } catch (error: any) {
        console.error('❌ [GMAIL] Erro ao enviar email:', error)
        
        if (error.response?.body?.errors) {
            console.error('🔍 [GMAIL] Erros SendGrid:', error.response.body.errors)
        }
        
        return NextResponse.json(
            { 
                error: 'Erro ao enviar email via Gmail',
                details: error.message
            },
            { status: 500 }
        )
    }
} 