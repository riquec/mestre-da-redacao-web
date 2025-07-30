import { useState } from 'react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { ChatAttachment } from '@/lib/types'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export function useChatAttachments() {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])

  // Limites mais generosos para anexos
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB (mais generoso)
  const MAX_FILES_PER_MESSAGE = 5
  const ALLOWED_TYPES = [
    // Imagens
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    // Áudios
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/aac',
    // Vídeos (pequenos)
    'video/mp4', 'video/webm', 'video/ogg',
    // Arquivos compactados
    'application/zip', 'application/x-rar-compressed'
  ]

  const validateFile = (file: File): string | null => {
    // Verificar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return `O arquivo "${file.name}" é muito grande. Tamanho máximo: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
    }

    // Verificar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Tipo de arquivo não suportado: "${file.name}". Tipos permitidos: imagens, documentos, áudios, vídeos e arquivos compactados`
    }

    // Verificar nome do arquivo
    if (file.name.length > 100) {
      return `Nome do arquivo muito longo: "${file.name}". Máximo: 100 caracteres`
    }

    return null
  }

  const uploadAttachments = async (files: File[]): Promise<ChatAttachment[]> => {
    console.log('🚀 UPLOAD CORRIGIDO - Versão 2.0 - Bucket correto configurado!', new Date().toISOString());
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return [];
    }

    if (files.length > MAX_FILES_PER_MESSAGE) {
      throw new Error(`Máximo de ${MAX_FILES_PER_MESSAGE} arquivos por mensagem`)
    }

    setUploading(true)
    setUploadProgress(files.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    })))

    const uploadedAttachments: ChatAttachment[] = []
    const uploadedPaths: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validar arquivo
        const validationError = validateFile(file)
        if (validationError) {
          updateProgress(i, 'error', validationError)
          throw new Error(validationError)
        }

        try {
          // USAR EXATAMENTE A MESMA ESTRUTURA DAS REDAÇÕES QUE FUNCIONAM
          const storagePath = `essays/${user.uid}/${Date.now()}-${file.name}`
          
          console.log(`Iniciando upload do anexo ${i + 1}/${files.length}:`, file.name)
          console.log('Caminho no storage:', storagePath)
          
          // Criar referência no storage (exatamente como redações)
          const storageRef = ref(storage, storagePath)
          
          // Upload do arquivo (exatamente como nas redações funcionais)
          updateProgress(i, 'uploading', undefined, 50)
          console.log('Fazendo upload para o Firebase Storage...')
          const uploadResult = await uploadBytes(storageRef, file)
          console.log('Upload concluído:', uploadResult)
          
          // Obter URL de download (exatamente como redações)
          updateProgress(i, 'uploading', undefined, 90)
          console.log('Obtendo URL de download...')
          const downloadURL = await getDownloadURL(uploadResult.ref)
          console.log('URL de download obtida:', downloadURL)
          
          // Marcar como sucesso
          updateProgress(i, 'success')
          
          // Adicionar à lista de anexos
          const attachment: ChatAttachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size,
            uploadedAt: new Date() as any // Será convertido para Timestamp no Firestore
          }
          
          uploadedAttachments.push(attachment)
          uploadedPaths.push(storagePath)
          
          console.log(`Anexo ${i + 1}/${files.length} enviado com sucesso:`, file.name)
          
        } catch (error) {
          console.error(`Erro ao enviar anexo ${file.name}:`, error)
          updateProgress(i, 'error', `Erro ao enviar "${file.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
          
          // Fazer rollback dos arquivos já enviados
          await rollbackUploads(uploadedPaths)
          
          throw new Error(`Falha ao enviar "${file.name}". Tente novamente.`)
        }
      }

      toast.success(`${uploadedAttachments.length} anexo(s) enviado(s) com sucesso!`)
      return uploadedAttachments

    } catch (error) {
      console.error('Erro geral no upload de anexos:', error)
      throw error
    } finally {
      setUploading(false)
      // Limpar progresso após 3 segundos
      setTimeout(() => setUploadProgress([]), 3000)
    }
  }

  const updateProgress = (index: number, status: 'uploading' | 'success' | 'error', error?: string, progress?: number) => {
    setUploadProgress(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, status, error, progress: progress ?? item.progress }
        : item
    ))
  }

  const rollbackUploads = async (paths: string[]) => {
    console.log('Fazendo rollback de uploads:', paths)
    
    for (const path of paths) {
      try {
        const storageRef = ref(storage, path)
        await deleteObject(storageRef)
        console.log('Arquivo removido do storage:', path)
      } catch (error) {
        console.error('Erro ao remover arquivo do storage:', path, error)
        // Não lançar erro aqui para não interromper o processo
      }
    }
  }

  const deleteAttachment = async (attachment: ChatAttachment, ticketId: string) => {
    if (!user) {
      console.error('Usuário não autenticado para deletar anexo')
      return false
    }

    try {
      // Extrair o caminho do storage da URL usando a nova estrutura
      const urlParts = attachment.url.split('/')
      const fileName = urlParts[urlParts.length - 1].split('?')[0]
      const storagePath = `essays/${user.uid}/${fileName}` // Estrutura correta com user.uid
      
      const storageRef = ref(storage, storagePath)
      await deleteObject(storageRef)
      
      console.log('Anexo removido do storage:', attachment.name)
      return true
    } catch (error) {
      console.error('Erro ao remover anexo do storage:', error)
      return false
    }
  }

  return {
    uploadAttachments,
    deleteAttachment,
    uploading,
    uploadProgress,
    validateFile,
    MAX_FILE_SIZE,
    MAX_FILES_PER_MESSAGE,
    ALLOWED_TYPES
  }
} 