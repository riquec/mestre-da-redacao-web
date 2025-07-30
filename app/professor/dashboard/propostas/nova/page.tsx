"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, FileText, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useFileUpload } from '@/hooks/use-file-upload'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface UploadedFile {
  url: string
  path: string
  name: string
  type: string
  size: number
}

export default function NovaProposta() {
  const { toast } = useToast()
  const { uploadFile, uploading, error, deleteFile } = useFileUpload()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    proposalFile: null as File | null,
    tags: [] as string[]
  })

  const [tagInput, setTagInput] = useState("")

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    console.log('Página de nova proposta carregada')
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    console.log('Campo alterado:', name, 'para:', value)
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      console.log('Adicionando tag:', tagInput.trim())
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    console.log('Removendo tag:', tagToRemove)
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Array para armazenar os caminhos dos arquivos no Storage para possível rollback
    const uploadedFilePaths: string[] = []

    try {
      console.log('Iniciando envio da proposta...')
      console.log('Dados do formulário:', formData)

      // Validar tamanho dos arquivos
      const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
      const validateFileSize = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`O arquivo ${file.name} excede o limite de 5MB`)
        }
      }

      // Validar arquivo da proposta
      if (!formData.proposalFile) {
        throw new Error("É necessário enviar o arquivo da proposta")
      }
      validateFileSize(formData.proposalFile)

      // Upload do arquivo da proposta
      let proposalFileUrl: UploadedFile | null = null
      console.log('Iniciando upload do arquivo da proposta...')
      try {
        proposalFileUrl = await uploadFile(formData.proposalFile, { type: 'proposal' })
        uploadedFilePaths.push(proposalFileUrl.path)
        console.log('Upload do arquivo da proposta concluído:', proposalFileUrl)
      } catch (error) {
        console.error('Erro no upload do arquivo da proposta:', error)
        setLoading(false)
        toast({
          title: "Erro no upload",
          description: "Falha ao enviar arquivo da proposta. Por favor, tente novamente.",
          variant: "destructive",
          duration: 5000
        })
        return
      }

      console.log('Criando documento no Firestore...')
      try {
        // Criar a proposta no Firestore
        const proposalRef = await addDoc(collection(db, 'essayThemes'), {
          title: formData.title,
          category: formData.category,
          tags: formData.tags,
          file: {
            name: proposalFileUrl.name,
            url: proposalFileUrl.url
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          active: true
        })
        console.log('Documento criado com sucesso:', proposalRef.id)

        setShowSuccessModal(true)
      } catch (error) {
        console.error("Erro ao criar documento no Firestore:", error)
        
        // Rollback: deletar todos os arquivos do Storage
        console.log('Iniciando rollback dos arquivos...')
        try {
          await Promise.all(uploadedFilePaths.map(path => {
            console.log(`Deletando arquivo: ${path}`)
            return deleteFile(path)
          }))
          console.log('Rollback concluído com sucesso')
        } catch (deleteError) {
          console.error('Erro durante o rollback:', deleteError)
        }

        toast({
          title: "Erro ao criar proposta",
          description: "Ocorreu um erro ao salvar a proposta. Por favor, tente novamente.",
          variant: "destructive",
          duration: 5000
        })
      }
    } catch (error) {
      console.error("Erro detalhado ao criar proposta:", error)
      
      // Garantir que os arquivos sejam deletados em caso de erro não tratado
      if (uploadedFilePaths.length > 0) {
        console.log('Iniciando limpeza de arquivos após erro...')
        try {
          await Promise.all(uploadedFilePaths.map(path => deleteFile(path)))
          console.log('Limpeza de arquivos concluída')
        } catch (deleteError) {
          console.error('Erro durante a limpeza de arquivos:', deleteError)
        }
      }

      toast({
        title: "Erro ao criar proposta",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar a proposta. Tente novamente.",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Proposta de Redação</h1>
        <p className="text-gray-500">Adicione uma nova proposta de redação à plataforma</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informações da proposta</CardTitle>
            <CardDescription>Preencha os detalhes da nova proposta de redação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título da proposta</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Os desafios da educação no Brasil pós-pandemia"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select onValueChange={(value) => handleSelectChange("category", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENEM_PASSADO">ENEM (Edições passadas)</SelectItem>
                  <SelectItem value="ENEM_MESTRE">ENEM (Mestre da redação)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Arquivo da proposta</Label>
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                <FileText className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium mb-1">
                  Arraste e solte o arquivo da proposta ou clique para selecionar
                </p>
                <p className="text-xs text-gray-500 mb-4">Formatos aceitos: PDF, DOC, DOCX</p>
                <Input
                  id="proposal-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData(prev => ({ ...prev, proposalFile: e.target.files![0] }))
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("proposal-file")?.click()}
                >
                  Selecionar arquivo
                </Button>
                {formData.proposalFile && (
                  <div className="mt-4 text-sm text-green-600 font-medium">
                    Arquivo selecionado: {formData.proposalFile.name}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Educação, Tecnologia, Meio Ambiente"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded-md flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading || !formData.title || !formData.category || !formData.proposalFile}
            >
              {loading || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "Enviando arquivo..." : "Salvando..."}
                </>
              ) : (
                "Publicar proposta"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proposta criada com sucesso!</AlertDialogTitle>
            <AlertDialogDescription>
              A proposta foi cadastrada e está disponível para os alunos. Você pode gerenciá-la a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push('/professor/dashboard/propostas')}>
              Ver todas as propostas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
