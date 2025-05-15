export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log('API send-essay-notification chamada com:', body)
  const { studentName, essayTitle, themeTitle, professorEmails } = body
  console.log('E-mails de destino:', professorEmails)

  if (!studentName || !essayTitle || !themeTitle || !professorEmails) {
    console.log('Dados incompletos recebidos')
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const msg = {
    to: professorEmails, // array de e-mails dos professores
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Nova redação enviada para correção',
    text: `O aluno ${studentName} enviou uma nova redação para correção.\n\nTítulo: ${essayTitle}\nTema: ${themeTitle}`,
    html: `
      <p>O aluno <strong>${studentName}</strong> enviou uma nova redação para correção.</p>
      <p><strong>Título:</strong> ${essayTitle}</p>
      <p><strong>Tema:</strong> ${themeTitle}</p>
    `,
  }

  try {
    await sgMail.sendMultiple(msg)
    console.log('E-mail enviado com sucesso!')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    if ((error as any)?.response?.body) {
      console.error('Detalhe do erro SendGrid:', (error as any).response.body)
    }
    return NextResponse.json({ error: 'Erro ao enviar e-mail' }, { status: 500 })
  }
} 