import { useState } from 'react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export type FileType = 'essay' | 'correction' | 'lesson' | 'proposal'

interface FileUploadOptions {
  type: FileType
  userId?: string
  onProgress?: (progress: number) => void
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getStoragePath = (file: File, options: FileUploadOptions) => {
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${file.name}`

    switch (options.type) {
      case 'essay':
        return `essays/${options.userId}/${filename}`
      case 'correction':
        return `corrections/${options.userId}/${filename}`
      case 'lesson':
        if (file.type.startsWith('video/')) {
          return `lessons/videos/${filename}`
        }
        return `lessons/materials/${filename}`
      case 'proposal':
        if (file.name.includes('exemplo')) {
          return `proposals/examples/${filename}`
        }
        return `proposals/materials/${filename}`
      default:
        throw new Error('Tipo de arquivo inválido')
    }
  }

  const uploadFile = async (file: File, options: FileUploadOptions) => {
    try {
      setUploading(true)
      setError(null)

      console.log('Iniciando upload do arquivo:', file.name)
      console.log('Tipo do arquivo:', file.type)
      console.log('Tamanho do arquivo:', file.size)

      const storagePath = getStoragePath(file, options)
      console.log('Caminho no storage:', storagePath)

      const storageRef = ref(storage, storagePath)

      // Configurações de metadados para o upload
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      }

      // Upload do arquivo
      console.log('Iniciando upload para o Firebase Storage...')
      const snapshot = await uploadBytes(storageRef, file, metadata)
      console.log('Upload concluído:', snapshot)
      
      // Obtém a URL de download
      console.log('Obtendo URL de download...')
      const downloadURL = await getDownloadURL(snapshot.ref)
      console.log('URL de download obtida:', downloadURL)

      return {
        url: downloadURL,
        path: storagePath,
        name: file.name,
        type: file.type,
        size: file.size
      }
    } catch (err) {
      console.error('Erro detalhado no upload:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload do arquivo'
      setError(errorMessage)
      throw new Error(`Falha no upload: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const deleteFile = async (path: string) => {
    try {
      const storageRef = ref(storage, path)
      await deleteObject(storageRef)
    } catch (err) {
      console.error('Erro ao deletar arquivo:', err)
      setError(err instanceof Error ? err.message : 'Erro ao deletar arquivo')
      throw err
    }
  }

  return {
    uploadFile,
    deleteFile,
    uploading,
    error
  }
} 