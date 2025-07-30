"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Video } from "lucide-react"
import { db, storage } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function NovaAula() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoFile: null as File | null,
    thumbnail: null as File | null,
  })
  const [duration, setDuration] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    console.log('Página de nova aula carregada')
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: "videoFile" | "thumbnail") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      console.log('Arquivo selecionado:', {
        type: fileType,
        name: file.name,
        size: file.size,
        format: file.type
      })
      
      setFormData((prev) => ({ ...prev, [fileType]: file }))
      if (fileType === "videoFile") {
        // Extrair duração do vídeo
        const video = document.createElement("video")
        video.preload = "metadata"
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src)
          const videoDuration = video.duration
          console.log('Duração do vídeo extraída:', videoDuration, 'segundos')
          setDuration(videoDuration)
        }
        video.src = URL.createObjectURL(file)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.videoFile || !duration) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" })
      return
    }
    
    console.log('Iniciando publicação de nova aula:', {
      title: formData.title,
      description: formData.description,
      video_file: formData.videoFile?.name,
      duration: duration
    })
    
    setLoading(true)
    try {
      // Upload do vídeo
      const storagePath = `lessons/${Date.now()}-${formData.videoFile.name}`
      console.log('Fazendo upload do vídeo para:', storagePath)
      
      const storageRef = ref(storage, storagePath)
      await uploadBytes(storageRef, formData.videoFile)
      const videoUrl = await getDownloadURL(storageRef)
      
      console.log('Upload concluído, URL do vídeo:', videoUrl)
      
      // Criar documento no Firestore
      const lessonData = {
        title: formData.title,
        description: formData.description,
        videoUrl,
        duration: Math.round(duration),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: 0,
        active: true,
      }
      
      await addDoc(collection(db, "lessons"), lessonData)
      
      console.log('Aula publicada com sucesso no Firestore')
      toast({ title: "Aula publicada com sucesso!", variant: "default" })
      
      setFormData({ title: "", description: "", videoFile: null, thumbnail: null })
      setDuration(null)
      setTimeout(() => {
        router.push("/professor/dashboard/aulas")
      }, 800)
    } catch (err: any) {
      console.error('Erro ao publicar aula:', err)
      toast({ title: "Erro ao publicar aula", description: err?.message || "Tente novamente.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nova Videoaula</h1>
          <p className="text-gray-500">Adicione uma nova videoaula à plataforma</p>
        </div>

        <Card className="bg-white border-gray-200">
          <form onSubmit={handleSubmit}>
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Informações da aula</CardTitle>
              <CardDescription className="text-gray-600">Preencha os detalhes da nova videoaula</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 bg-white">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-900">Título da aula</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Introdução à redação dissertativa"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-900">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Descreva o conteúdo da aula..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="min-h-[100px] bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900">Vídeo da aula</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center bg-white hover:border-gray-400 transition-colors">
                  <Video className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium mb-1 text-gray-900">Arraste e solte o arquivo de vídeo ou clique para selecionar</p>
                  <p className="text-xs text-gray-500 mb-4">Formatos aceitos: MP4, MOV, AVI (máx. 500MB)</p>
                  <Input
                    id="video-file"
                    type="file"
                    accept=".mp4,.mov,.avi"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "videoFile")}
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById("video-file")?.click()}
                    className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                    Selecionar arquivo
                  </Button>
                  {formData.videoFile && (
                    <div className="mt-4 text-sm text-green-600 font-medium">
                      Arquivo selecionado: {formData.videoFile.name}
                      {duration && <span className="block text-xs text-gray-500">Duração: {Math.round(duration)}s</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900">Thumbnail</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center bg-white hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium mb-1 text-gray-900">
                    Arraste e solte a imagem de thumbnail ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500 mb-4">Formatos aceitos: JPEG, PNG (recomendado: 1280x720px)</p>
                  <Input
                    id="thumbnail"
                    type="file"
                    accept=".jpeg,.jpg,.png"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "thumbnail")}
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById("thumbnail")?.click()}
                    className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                    Selecionar arquivo
                  </Button>
                  {formData.thumbnail && (
                    <div className="mt-4 text-sm text-green-600 font-medium">
                      Arquivo selecionado: {formData.thumbnail.name}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-white">
              <Button type="button" variant="outline" className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!formData.title || !formData.description || !formData.videoFile || !duration || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Publicando..." : "Publicar aula"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
