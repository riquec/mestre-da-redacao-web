import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseFirestore } from '@/lib/firebase'
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { randomBytes } from 'crypto'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  let email = '';
  
  try {
    const requestBody = await request.json();
    email = requestBody.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' }, 
        { status: 400 }
      )
    }

    logger.info('Tentativa de recuperação de senha', {
      action: 'password_reset_attempt',
      component: 'send-reset-email-api',
      metadata: { email: email.substring(0, 3) + '***' }
    })

    // Verificar se o usuário existe (buscar por campo email, não por ID)
    const db = getFirebaseFirestore()
    const usersRef = collection(db, 'users')
    const userQuery = query(usersRef, where('email', '==', email))
    const userSnapshot = await getDocs(userQuery)
    
    if (userSnapshot.empty) {
      logger.warning('Tentativa de recuperação para email não cadastrado', {
        action: 'password_reset_user_not_found',
        component: 'send-reset-email-api',
        metadata: { 
          email: email.substring(0, 3) + '***',
          reason: 'user_not_found'
        }
      })
      
      // Por segurança, não revelamos se o email existe ou não
      // Mas retornamos um indicador interno para melhor UX
      return NextResponse.json({ 
        success: true, 
        message: 'Se o email existir, você receberá um link de recuperação.',
        debug: {
          found: false,
          reason: 'user_not_found'
        }
      })
    }
    
    // Usuário encontrado
    const userDoc = userSnapshot.docs[0]
    const userData = userDoc.data()
    
    logger.info('Usuário encontrado para recuperação de senha', {
      action: 'password_reset_user_found',
      component: 'send-reset-email-api',
      metadata: { 
        email: email.substring(0, 3) + '***',
        userId: userDoc.id.substring(0, 8) + '***',
        userRole: userData.role
      }
    })

    // Gerar token de reset seguro
    const resetToken = randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Salvar token no Firestore
    await setDoc(doc(db, 'passwordResets', resetToken), {
      email,
      token: resetToken,
      expiresAt: tokenExpiry,
      createdAt: new Date(),
      used: false
    })

    logger.info('Token de recuperação gerado', {
      action: 'password_reset_token_generated',
      component: 'send-reset-email-api',
      metadata: { 
        email: email.substring(0, 3) + '***',
        tokenPrefix: resetToken.substring(0, 8) + '...',
        expiresAt: tokenExpiry.toISOString()
      }
    })

    // Criar link de reset com nosso token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/redefinir-senha?token=${resetToken}`
    
    // Tentar enviar email via SendGrid (se configurado)
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    
    if (!sendgridApiKey || sendgridApiKey === 'your_sendgrid_api_key_here') {
      // SendGrid não configurado - modo desenvolvimento
      logger.warning('SendGrid não configurado - simulando envio de email', {
        action: 'password_reset_sendgrid_not_configured',
        component: 'send-reset-email-api',
        metadata: { 
          email: email.substring(0, 3) + '***',
          resetLink: resetLink
        }
      })
      
      console.log('\n🔗 LINK DE RESET (MODO DESENVOLVIMENTO):');
      console.log(resetLink);
      console.log('\n📧 Simular envio de email para:', email);
      
    } else {
      // SendGrid configurado - envio real
      try {
        const sgMail = require('@sendgrid/mail')
        sgMail.setApiKey(sendgridApiKey)

        // Template ID do SendGrid (se configurado) ou HTML direto
        const templateId = process.env.SENDGRID_RESET_TEMPLATE_ID
        
        const msg = {
          to: email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'admin@mestredaredacao.app.br',
            name: 'Mestre da Redação'
          },
          subject: '[Mestre da Redação] Redefinir sua senha',
          ...(templateId ? {
            templateId: templateId,
            dynamicTemplateData: {
              reset_url: resetLink,
              user_email: email,
              app_name: 'Mestre da Redação'
            }
          } : {
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2563eb; margin: 0;">Mestre da Redação</h1>
                </div>
                
                <h2 style="color: #1f2937; margin-bottom: 20px;">Redefinir sua senha</h2>
                
                <p style="color: #4b5563; line-height: 1.6;">Olá,</p>
                
                <p style="color: #4b5563; line-height: 1.6;">
                  Você solicitou a redefinição de senha para sua conta no <strong>Mestre da Redação</strong>.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" 
                     style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Redefinir Minha Senha
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Se o botão não funcionar, copie e cole este link no seu navegador:
                </p>
                <p style="word-break: break-all; color: #2563eb; font-size: 14px; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
                  ${resetLink}
                </p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                    <strong>⚠️ Importante:</strong><br>
                    • Este link expira em 1 hora por segurança<br>
                    • Se você não solicitou esta alteração, ignore este email<br>
                    • Nunca compartilhe este link com outras pessoas
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px;">
                    Equipe Mestre da Redação<br>
                    <em>Este é um email automático, não responda.</em>
                  </p>
                </div>
              </div>
            `
          })
        }

        await sgMail.send(msg)
        
        logger.info('Email SendGrid enviado com sucesso', {
          action: 'password_reset_sendgrid_success',
          component: 'send-reset-email-api',
          metadata: { 
            email: email.substring(0, 3) + '***',
            templateUsed: templateId ? 'dynamic_template' : 'html_direct',
            templateId: templateId || 'none'
          }
        })
        
      } catch (sendgridError: any) {
        logger.error('Erro específico do SendGrid', sendgridError, {
          action: 'password_reset_sendgrid_error',
          component: 'send-reset-email-api',
          metadata: { 
            email: email.substring(0, 3) + '***',
            sendgridError: sendgridError.message
          }
        })
        
        // Em caso de erro do SendGrid, mostrar o link no console para desenvolvimento
        console.log('\n🔗 LINK DE RESET (FALLBACK - ERRO SENDGRID):');
        console.log(resetLink);
        
        throw new Error(`Erro SendGrid: ${sendgridError.message}`)
      }
    }
    
    logger.info('Email de recuperação enviado com sucesso', {
      action: 'password_reset_email_sent',
      component: 'send-reset-email-api',
      metadata: { 
        email: email.substring(0, 3) + '***',
        tokenPrefix: resetToken.substring(0, 8) + '...',
        provider: 'sendgrid'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Email de reset enviado com sucesso!',
      debug: {
        found: true,
        resetLink: resetLink,
        tokenPrefix: resetToken.substring(0, 8) + '...',
        expiresAt: tokenExpiry.toISOString()
      }
    })

  } catch (error: any) {
    logger.error('Erro ao enviar email de recuperação', error, {
      action: 'password_reset_error',
      component: 'send-reset-email-api',
      metadata: { 
        email: email?.substring(0, 3) + '***',
        errorCode: error.code,
        errorMessage: error.message
      }
    })
    
    // Feedback mais amigável baseado no tipo de erro
    let userMessage = 'Ocorreu um erro ao enviar o email de recuperação.'
    
    if (error.code === 'auth/user-not-found') {
      userMessage = 'Não encontramos uma conta com este email.'
    } else if (error.code === 'auth/invalid-email') {
      userMessage = 'Email inválido. Verifique e tente novamente.'
    } else if (error.code === 'auth/too-many-requests') {
      userMessage = 'Muitas tentativas. Tente novamente em alguns minutos.'
    } else if (error.message?.includes('SendGrid') || error.message?.includes('email')) {
      userMessage = 'Erro temporário no envio de email. Tente novamente em alguns minutos.'
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        details: error.message,
        type: 'email_send_error'
      }, 
      { status: 500 }
    )
  }
} 