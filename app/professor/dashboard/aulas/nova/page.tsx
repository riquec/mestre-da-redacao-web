"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Video } from "lucide-react"

export default function NovaAula() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoFile: null as File | null,
    thumbnail: null as File | null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: "videoFile" | "thumbnail") => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, [fileType]: e.target.files![0] }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would handle the submission logic
    console.log("Form submitted:", formData)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Videoaula</h1>
        <p className="text-gray-500">Adicione uma nova videoaula à plataforma</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informações da aula</CardTitle>
            <CardDescription>Preencha os detalhes da nova videoaula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título da aula</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Introdução à redação dissertativa"
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
                placeholder="Descreva o conteúdo da aula..."
                value={formData.description}
                onChange={handleChange}
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Vídeo da aula</Label>
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                <Video className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium mb-1">Arraste e solte o arquivo de vídeo ou clique para selecionar</p>
                <p className="text-xs text-gray-500 mb-4">Formatos aceitos: MP4, MOV, AVI (máx. 500MB)</p>
                <Input
                  id="video-file"
                  type="file"
                  accept=".mp4,.mov,.avi"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "videoFile")}
                />
                <Button type="button" variant="outline" onClick={() => document.getElementById("video-file")?.click()}>
                  Selecionar arquivo
                </Button>
                {formData.videoFile && (
                  <div className="mt-4 text-sm text-green-600 font-medium">
                    Arquivo selecionado: {formData.videoFile.name}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium mb-1">
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
                <Button type="button" variant="outline" onClick={() => document.getElementById("thumbnail")?.click()}>
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
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!formData.title || !formData.description || !formData.videoFile || !formData.thumbnail}
            >
              Publicar aula
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
