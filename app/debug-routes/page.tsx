'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

export default function DebugRoutes() {
  const [email, setEmail] = useState('henriqueeejc@gmail.com')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const addResult = (result: any) => {
    setResults(prev => [{ ...result, timestamp: new Date().toISOString() }, ...prev])
  }

  const clearResults = () => setResults([])

  // Teste de Envio SendGrid
  const testSendGridEmail = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/simple-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      addResult({
        test: 'Envio SendGrid',
        status: response.status,
        success: response.ok,
        data
      })
    } catch (error) {
      addResult({
        test: 'Envio SendGrid',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  // Verificar Status SendGrid
  const checkSendGridStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/check-sendgrid-status')
      const data = await response.json()
      
      addResult({
        test: 'Status SendGrid',
        status: response.status,
        success: response.ok,
        data: {
          delivered: data.data?.stats?.[0]?.stats?.[0]?.metrics?.delivered || 0,
          blocks: data.data?.stats?.[0]?.stats?.[0]?.metrics?.blocks || 0,
          bounces: data.data?.stats?.[0]?.stats?.[0]?.metrics?.bounces || 0,
          suppressions: data.data?.suppressions?.length || 0
        }
      })
    } catch (error) {
      addResult({
        test: 'Status SendGrid',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  // Teste com Email Alternativo
  const testAlternativeEmail = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gmail-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      addResult({
        test: 'Email Alternativo',
        status: response.status,
        success: response.ok,
        data
      })
    } catch (error) {
      addResult({
        test: 'Email Alternativo',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  // Teste específico do botão do email
  const testResetButton = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      // Extrair o link do resultado para teste
      let resetLink = null
      if (data.success) {
        // Simular extração do link para teste
        resetLink = `https://mestre-da-redacao.firebaseapp.com/redefinir-senha?mode=resetPassword&oobCode=exemplo123&continueUrl=https://mestre-da-redacao.firebaseapp.com/login`
      }
      
      addResult({
        test: '🔗 Teste do Botão Reset',
        status: response.status,
        success: response.ok,
        data: {
          ...data,
          resetLink: resetLink,
          instructions: 'Clique no link recebido no email para testar o botão'
        }
      })
    } catch (error) {
      addResult({
        test: '🔗 Teste do Botão Reset',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  // Teste da página de redefinir senha
  const testResetPage = async () => {
    setLoading(true)
    try {
      // Testar se a página /redefinir-senha está acessível
      const response = await fetch('/redefinir-senha')
      
      addResult({
        test: '📄 Página Redefinir Senha',
        status: response.status,
        success: response.ok,
        data: {
          message: 'Página /redefinir-senha está acessível',
          url: `${window.location.origin}/redefinir-senha`,
          note: 'Precisa dos parâmetros ?mode=resetPassword&oobCode=XXX para funcionar'
        }
      })
    } catch (error) {
      addResult({
        test: '📄 Página Redefinir Senha',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Seção de Testes de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📧 Validações de Email
              <Badge variant="outline">Debug</Badge>
            </CardTitle>
            <CardDescription>
              Testes específicos para validar o sistema de envio de emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Email para teste"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={clearResults}
                variant="outline"
                disabled={results.length === 0}
              >
                Limpar
              </Button>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={testSendGridEmail}
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? 'Enviando...' : '📧 Testar Envio'}
              </Button>
              
              <Button
                onClick={checkSendGridStatus}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Verificando...' : '📊 Status SendGrid'}
              </Button>
              
              <Button
                onClick={testAlternativeEmail}
                disabled={loading || !email}
                variant="secondary"
                className="w-full"
              >
                {loading ? 'Enviando...' : '📫 Email Alternativo'}
              </Button>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={testResetButton}
                disabled={loading || !email}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Testando...' : '🔗 Testar Botão Reset'}
              </Button>
              
              <Button
                onClick={testResetPage}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Verificando...' : '📄 Testar Página Reset'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Resultados</CardTitle>
              <CardDescription>
                Últimos {results.length} teste(s) executado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <Alert key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{result.test}</span>
                          <Badge variant={result.success ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </div>
                        
                        {result.data && (
                          <div className="text-xs bg-gray-50 p-2 rounded">
                            {typeof result.data === 'object' ? (
                              <pre className="overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            ) : (
                              <span>{result.data}</span>
                            )}
                          </div>
                        )}
                        
                        {result.error && (
                          <div className="text-red-600 text-sm">
                            <strong>Erro:</strong> {result.error}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações Importantes */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Diagnóstico Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-orange-200">
                <AlertDescription>
                  <strong>⚠️ Problema DMARC:</strong> Seu domínio está configurado com <code>p=reject</code>, 
                  causando bloqueios no Gmail. Altere para <code>p=quarantine</code> no Registro.br.
                </AlertDescription>
              </Alert>
              
              <Alert className="border-blue-200">
                <AlertDescription>
                  <strong>💡 Solução Recomendada:</strong> Configure Domain Authentication no SendGrid 
                  clicando em "Get Started" para habilitar DKIM e melhorar a deliverability.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>✅ Configurado:</strong>
                  <ul className="list-disc list-inside mt-1 text-gray-600">
                    <li>SPF com SendGrid</li>
                    <li>Single Sender verificado</li>
                    <li>API Key funcionando</li>
                  </ul>
                </div>
                
                <div>
                  <strong>❌ Pendente:</strong>
                  <ul className="list-disc list-inside mt-1 text-gray-600">
                    <li>DMARC (p=reject → p=quarantine)</li>
                    <li>Domain Authentication (DKIM)</li>
                    <li>Teste de deliverability</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 