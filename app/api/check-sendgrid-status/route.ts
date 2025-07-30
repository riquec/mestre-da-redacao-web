import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [STATUS] Verificando status do SendGrid...')
    
    const apiKey = process.env.SENDGRID_API_KEY
    
    if (!apiKey) {
      console.error('❌ [STATUS] API Key não encontrada')
      return NextResponse.json({ error: 'API Key não configurada' }, { status: 500 })
    }
    
    // Verificar estatísticas recentes (última hora)
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 60 * 60 * 1000) // 1 hora atrás
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    console.log('📅 [STATUS] Período:', startDateStr, 'até', endDateStr)
    
    // Buscar estatísticas
    const statsResponse = await fetch(
      `https://api.sendgrid.com/v3/stats?start_date=${startDateStr}&end_date=${endDateStr}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const stats = await statsResponse.json()
    console.log('📊 [STATUS] Stats:', stats)
    
    // Verificar suppressions (bloqueios)
    const suppressionsResponse = await fetch(
      'https://api.sendgrid.com/v3/suppression/blocks',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const suppressions = await suppressionsResponse.json()
    console.log('🚫 [STATUS] Suppressions:', suppressions)
    
    // Verificar sender reputation
    const reputationResponse = await fetch(
      'https://api.sendgrid.com/v3/reputation/accessing',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const reputation = await reputationResponse.json()
    console.log('⭐ [STATUS] Reputation:', reputation)
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        suppressions,
        reputation,
        period: `${startDateStr} até ${endDateStr}`
      }
    })
    
  } catch (error: any) {
    console.error('❌ [STATUS] Erro:', error)
    
    return NextResponse.json({ 
      error: 'Erro ao verificar status',
      details: error.message 
    }, { status: 500 })
  }
} 