"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Download, 
  FileText, 
  Image, 
  Music, 
  Video,
  Archive,
  Eye,
  Play,
  ExternalLink
} from "lucide-react"
import { ChatAttachment } from "@/lib/types"

interface ChatAttachmentViewerProps {
  attachment: ChatAttachment
  isOwnMessage?: boolean
}

export function ChatAttachmentViewer({ attachment, isOwnMessage = false }: ChatAttachmentViewerProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />
    if (type.includes('word') || type.includes('excel') || type.includes('text')) return <FileText className="h-4 w-4" />
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canPreview = () => {
    return attachment.type.startsWith('image/') || 
           attachment.type === 'application/pdf' ||
           attachment.type.startsWith('audio/') ||
           attachment.type.startsWith('video/')
  }

  const handlePreview = () => {
    if (canPreview()) {
      setIsPreviewOpen(true)
    } else {
      // Para arquivos que não podem ser visualizados, abrir em nova aba
      window.open(attachment.url, '_blank')
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderPreview = () => {
    if (!isPreviewOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">{attachment.name}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewOpen(false)}
            >
              ✕
            </Button>
          </div>
          <div className="p-4">
            {attachment.type.startsWith('image/') && (
              <img 
                src={attachment.url} 
                alt={attachment.name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
            {attachment.type === 'application/pdf' && (
              <iframe
                src={attachment.url}
                className="w-full h-[70vh]"
                title={attachment.name}
              />
            )}
            {attachment.type.startsWith('audio/') && (
              <audio controls className="w-full">
                <source src={attachment.url} type={attachment.type} />
                Seu navegador não suporta o elemento de áudio.
              </audio>
            )}
            {attachment.type.startsWith('video/') && (
              <video controls className="w-full max-h-[70vh]">
                <source src={attachment.url} type={attachment.type} />
                Seu navegador não suporta o elemento de vídeo.
              </video>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`flex items-center gap-2 p-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-blue-100 border border-blue-200' 
            : 'bg-gray-100 border border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getFileIcon(attachment.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {canPreview() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              className="h-8 w-8 p-0"
              title="Visualizar"
            >
              {attachment.type.startsWith('image/') ? (
                <Eye className="h-3 w-3" />
              ) : attachment.type.startsWith('audio/') || attachment.type.startsWith('video/') ? (
                <Play className="h-3 w-3" />
              ) : (
                <ExternalLink className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
            title="Baixar"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {renderPreview()}
    </>
  )
} 