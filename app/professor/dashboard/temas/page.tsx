"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { useEssayThemes } from "@/hooks/use-essay-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Loader2, Pencil, Trash2, Upload, X } from "lucide-react"

export default function Temas() {
  const { user } = useAuth()
  const { themes, loading, refetch } = useEssayThemes()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    year: new Date().getFullYear(),
    exam: "",
    active: true,
    files: [] as File[]
  })
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    console.log('Página de temas do professor carregada')
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      console.log('Arquivos selecionados para tema:', newFiles.map(f => f.name))
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }))
    }
  }

  const removeFile = (index: number) => {
    const removedFile = formData.files[index]
    console.log('Removendo arquivo:', removedFile?.name)
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Criando novo tema:', {
      title: formData.title,
      category: formData.category,
      files_count: formData.files.length
    })
    
    setUploadingFiles(true)

    try {
      // Upload dos arquivos
      const fileUrls = await Promise.all(
        formData.files.map(async (file) => {
          console.log('Fazendo upload do arquivo:', file.name)
          const storageRef = ref(storage, `essayThemes/${Date.now()}-${file.name}`)
          await uploadBytes(storageRef, file)
          return getDownloadURL(storageRef)
        })
      )

      console.log('Upload concluído, criando tema no Firestore')

      // Criar o tema no Firestore
      await addDoc(collection(db, "essayThemes"), {
        ...formData,
        files: fileUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      console.log('Tema criado com sucesso')
      toast({
        title: "Tema criado com sucesso!",
        description: "O novo tema foi adicionado à plataforma.",
      })

      setFormData({
        title: "",
        description: "",
        category: "",
        year: new Date().getFullYear(),
        exam: "",
        active: true,
        files: []
      })
      setIsCreating(false)
      refetch()
    } catch (error) {
      console.error("Erro ao criar tema:", error)
      toast({
        title: "Erro ao criar tema",
        description: "Ocorreu um erro ao criar o tema. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleToggleActive = async (themeId: string, currentActive: boolean) => {
    try {
      console.log('Alterando status do tema:', themeId, 'para:', !currentActive)
      await updateDoc(doc(db, "essayThemes", themeId), {
        active: !currentActive,
        updatedAt: serverTimestamp()
      })

      toast({
        title: "Status atualizado",
        description: `O tema foi ${currentActive ? "desativado" : "ativado"} com sucesso.`,
      })

      refetch()
    } catch (error) {
      console.error("Erro ao atualizar tema:", error)
      toast({
        title: "Erro ao atualizar tema",
        description: "Ocorreu um erro ao atualizar o tema. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Temas de Redação</h1>
          <p className="text-gray-500">Gerencie os temas disponíveis para correção</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo tema
        </Button>
      </div>

      {isCreating && (
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Novo tema</CardTitle>
              <CardDescription>Adicione um novo tema de redação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Os desafios da educação no Brasil"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Descreva o tema da redação..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enem">ENEM</SelectItem>
                      <SelectItem value="fuvest">FUVEST</SelectItem>
                      <SelectItem value="unicamp">UNICAMP</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam">Vestibular</Label>
                <Input
                  id="exam"
                  name="exam"
                  placeholder="Ex: ENEM, FUVEST, UNICAMP"
                  value={formData.exam}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Arquivos adicionais</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="files"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clique para enviar</span> ou arraste os arquivos
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG ou PDF</p>
                    </div>
                    <input
                      id="files"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span>{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={uploadingFiles}
              >
                {uploadingFiles ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Criar tema"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="grid gap-6">
        {themes.map((theme) => (
          <Card key={theme.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{theme.title}</CardTitle>
                  <CardDescription>
                    {theme.category}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(theme.id, theme.active)}
                >
                  {theme.active ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Removido: <p className="text-sm text-gray-600">{theme.description}</p> */}
              {/* Removido: arquivos adicionais */}
            </CardContent>
            <CardFooter>
              <span className={`text-xs px-2 py-1 rounded-full ${
                theme.active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {theme.active ? 'Ativo' : 'Inativo'}
              </span>
            </CardFooter>
          </Card>
        ))}

        {themes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-gray-500 text-center">
                Nenhum tema cadastrado ainda
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 