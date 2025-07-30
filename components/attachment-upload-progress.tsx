"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  XCircle, 
  Upload, 
  FileText, 
  Image, 
  Music, 
  Video,
  Archive
} from "lucide-react"

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

interface AttachmentUploadProgressProps {
  uploadProgress: UploadProgress[]
  onRetry?: (index: number) => void
}

export function AttachmentUploadProgress({ uploadProgress, onRetry }: AttachmentUploadProgressProps) {
  if (uploadProgress.length === 0) return null

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '')) {
      return <Image className="h-4 w-4" />
    }
    if (['mp3', 'wav', 'ogg', 'aac'].includes(extension || '')) {
      return <Music className="h-4 w-4" />
    }
    if (['mp4', 'webm', 'ogg'].includes(extension || '')) {
      return <Video className="h-4 w-4" />
    }
    if (['zip', 'rar'].includes(extension || '')) {
      return <Archive className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 animate-pulse" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Enviando anexos ({uploadProgress.length})
          </h4>
          
          {uploadProgress.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(item.fileName)}
                  <span className="text-sm truncate">{item.fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  {item.status === 'error' && onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetry(index)}
                      className="h-6 px-2 text-xs"
                    >
                      Tentar novamente
                    </Button>
                  )}
                </div>
              </div>
              
              {item.status === 'uploading' && (
                <Progress value={item.progress} className="h-2" />
              )}
              
              {item.status === 'error' && item.error && (
                <p className="text-xs text-red-600">{item.error}</p>
              )}
              
              {item.status === 'success' && (
                <p className="text-xs text-green-600">Enviado com sucesso!</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 