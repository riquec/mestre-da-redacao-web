"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { useEssayThemes } from "@/hooks/use-essay-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Upload, Loader2, ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface Essay {
  id: string
  title: string
  status: string
  submittedAt: any
  correction: {
    status: string
    score?: number
  }
}

export default function NovaRedacao() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const { themes, loading: themesLoading } = useEssayThemes({ activeOnly: true })
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [recentEssays, setRecentEssays] = useState<Essay[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string>("")
  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showNoCorrectionsModal, setShowNoCorrectionsModal] = useState(false)

  // Verificar se os dados necessários estão carregando
  const isLoading = authLoading || subscriptionLoading || themesLoading

  // Buscar redações recentes
  useEffect(() => {
    async function fetchRecentEssays() {
      if (!user) return

      const essaysRef = collection(db, "essays")
      const q = query(
        essaysRef,
        where("userId", "==", user.uid),
        orderBy("submittedAt", "desc"),
        limit(5)
      )

      const querySnapshot = await getDocs(q)
      const essays = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Essay[]

      setRecentEssays(essays)
    }

    fetchRecentEssays()
  }, [user])

  // Pré-selecionar tema quando houver themeId na URL
  useEffect(() => {
    const themeId = searchParams.get("themeId")
    if (themeId && themes.length > 0) {
      const theme = themes.find(t => t.id === themeId)
      if (theme) {
        setSelectedTheme(themeId)
      }
    }
  }, [searchParams, themes])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Por favor, selecione um arquivo PDF, JPG ou PNG')
        return
      }

      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
        setError('O arquivo deve ter no máximo 5MB')
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!selectedTheme) {
      errors.theme = "Selecione um tema para a redação"
    }

    if (!file) {
      errors.file = "Selecione um arquivo para a redação"
    }

    // Só exige consentimento se não for private nem partner
    if (subscription && subscription.type !== 'private' && subscription.type !== 'partner') {
      if (!consentChecked) {
        errors.consent = "Você precisa confirmar o uso do token"
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Iniciando envio da redação...')
    console.log('Estado atual:', {
      user,
      subscription,
      file,
      selectedTheme,
      consentChecked,
      isLoading
    })

    if (isLoading) {
      console.log('Ainda carregando dados necessários...')
      toast({
        title: "Aguarde",
        description: "Estamos carregando os dados necessários. Por favor, aguarde um momento.",
        variant: "destructive"
      })
      return
    }

    if (!user) {
      console.log('Usuário não autenticado')
      toast({
        title: "Usuário não autenticado",
        description: "Por favor, faça login novamente.",
        variant: "destructive"
      })
      return
    }

    if (!subscription) {
      console.log('Plano não encontrado')
      toast({
        title: "Plano não encontrado",
        description: "Você precisa ter um plano ativo para enviar redações. Por favor, assine um plano primeiro.",
        variant: "destructive"
      })
      router.push("/dashboard/assinatura")
      return
    }

    if (!file) {
      console.log('Arquivo não selecionado')
      toast({
        title: "Arquivo não selecionado",
        description: "Por favor, selecione um arquivo para a redação.",
        variant: "destructive"
      })
      return
    }

    if (!validateForm()) {
      console.log('Formulário inválido:', validationErrors)
      return
    }

    // Só checa tokens se NÃO for private ou partner
    if (subscription.type !== 'private' && subscription.type !== 'partner') {
      if (
        !subscription.tokens ||
        subscription.tokens.unlimited !== true && (
          typeof subscription.tokens.available !== 'number' || subscription.tokens.available <= 0
        )
      ) {
        setShowNoCorrectionsModal(true)
        return
      }
    }

    setLoading(true)
    setError(null)
    let uploadedFilePath: string | null = null

    try {
      console.log('Iniciando processo de upload...')
      // Buscar um professor corretor disponível
      const usersRef = collection(db, "users")
      const professorsQuery = query(usersRef, where("role", "==", "professor"))
      const professorsSnapshot = await getDocs(professorsQuery)
      const professor = professorsSnapshot.docs[0]
      if (!professor) {
        throw new Error("Nenhum professor disponível para correção")
      }
      const professorId = professor.id
      console.log('Professor corretor encontrado:', professorId)

      // Buscar e-mails de todos os professores para notificação
      const professorsSnapshotAll = await getDocs(professorsQuery)
      const professorEmails = professorsSnapshotAll.docs.map(doc => doc.data().email).filter(Boolean)

      // Upload do arquivo para o Storage
      console.log('Iniciando upload do arquivo...')
      const storageRef = ref(storage, `essays/${user.uid}/${Date.now()}-${file.name}`)
      const uploadResult = await uploadBytes(storageRef, file)
      uploadedFilePath = uploadResult.ref.fullPath
      const fileUrl = await getDownloadURL(uploadResult.ref)
      console.log('Arquivo enviado com sucesso:', fileUrl)

      // Criar a redação no Firestore
      console.log('Criando documento no Firestore...')
      console.log('themeId a ser salvo:', selectedTheme)
      const essayData = {
        userId: user.uid,
        title: "",
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        themeId: selectedTheme,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        correction: {
          status: "pending",
          assignedTo: professorId,
          assignedAt: serverTimestamp(),
          completedAt: null,
          score: null,
          feedback: null
        }
      }

      const essayRef = await addDoc(collection(db, "essays"), essayData)
      console.log('Documento criado com sucesso:', essayRef.id)

      // Só atualiza tokens se NÃO for private ou partner
      if (subscription.type !== 'private' && subscription.type !== 'partner') {
        if (subscription.tokens && !subscription.tokens.unlimited) {
          await updateDoc(doc(db, "subscriptions", subscription.id), {
            "tokens.available": subscription.tokens.available - 1
          })
        }
      }

      // Enviar notificação por e-mail para professores (assíncrono)
      fetch("/api/send-essay-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: user.displayName || 'Aluno',
          essayTitle: "",
          themeTitle: themes.find(t => t.id === selectedTheme)?.title || '',
          professorEmails
        })
      })

      toast({
        title: "Redação enviada com sucesso!",
        description: "Sua redação foi enviada para correção.",
        variant: "default"
      })

      // Redirecionar para a página de redações
      router.push("/dashboard/redacoes")
    } catch (error) {
      console.error("Erro detalhado ao enviar redação:", error)
      
      // Se houve upload do arquivo mas falhou em criar o documento, deletar o arquivo
      if (uploadedFilePath) {
        try {
          const fileRef = ref(storage, uploadedFilePath)
          await deleteObject(fileRef)
        } catch (deleteError) {
          console.error("Erro ao deletar arquivo após falha:", deleteError)
        }
      }

      toast({
        title: "Erro ao enviar redação",
        description: "Ocorreu um erro ao enviar sua redação. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      })
      setError("Erro ao enviar redação. Tente novamente mais tarde.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Modal para sem correções disponíveis */}
      <Dialog open={showNoCorrectionsModal} onOpenChange={setShowNoCorrectionsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sem correções disponíveis</DialogTitle>
            <DialogDescription>
              Você não possui correções disponíveis no momento. Para continuar enviando redações, é necessário renovar ou atualizar seu plano.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => { setShowNoCorrectionsModal(false); router.push("/dashboard/assinatura") }}>
              Ir para assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Redação</h1>
            <p className="text-gray-500">Envie sua redação para avaliação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Redação</CardTitle>
                <CardDescription>Preencha os dados da sua redação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Carregando dados...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="theme">Tema da Redação</Label>
                      <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tema" />
                        </SelectTrigger>
                        <SelectContent>
                          {themes.map((theme) => (
                            <SelectItem key={theme.id} value={theme.id}>
                              {theme.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.theme && (
                        <p className="text-sm text-red-500">{validationErrors.theme}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file">Arquivo da Redação</Label>
                      <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                        <FileText className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm font-medium mb-1">
                          Arraste e solte o arquivo da redação ou clique para selecionar
                        </p>
                        <p className="text-xs text-gray-500 mb-4">Formatos aceitos: PDF, JPG, PNG (máximo 5MB)</p>
                        <Input
                          id="file"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("file")?.click()}
                        >
                          Selecionar arquivo
                        </Button>
                        {file && (
                          <div className="mt-4 text-sm text-green-600 font-medium">
                            Arquivo selecionado: {file.name}
                          </div>
                        )}
                      </div>
                      {validationErrors.file && (
                        <p className="text-sm text-red-500">{validationErrors.file}</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {error && <p className="text-red-500">{error}</p>}

            {(subscription && subscription.type !== 'private' && subscription.type !== 'partner') && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Confirmo que estou ciente que esta correção utilizará um token do meu plano
                </label>
              </div>
            )}
            {(subscription && subscription.type !== 'private' && subscription.type !== 'partner') && validationErrors.consent && (
              <p className="text-sm text-red-500">{validationErrors.consent}</p>
            )}

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={
                  loading || isLoading || !selectedTheme || !file || 
                  ((!!subscription && subscription.type !== 'private' && subscription.type !== 'partner') && !consentChecked)
                }
                className={loading || isLoading ? "opacity-50 cursor-not-allowed" : ""}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  "Enviar Redação"
                )}
              </Button>
            </div>
          </form>

          {/* Redações recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Redações recentes</CardTitle>
              <CardDescription>Suas últimas redações enviadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEssays.map((essay) => (
                  <div key={essay.id} className="flex items-start gap-4">
                    <div className="bg-gray-100 rounded-md p-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{essay.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          essay.correction.status === 'done' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {essay.correction.status === 'done' ? 'Corrigida' : 'Pendente'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Enviada em {essay.submittedAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentEssays.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma redação enviada ainda
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/redacoes")}>Ver todas as redações</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}