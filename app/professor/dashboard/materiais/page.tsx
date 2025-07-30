"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderPlus, FilePlus, Folder as FolderIcon, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { db, storage } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

// Mock temporário para navegação
const breadcrumbs = [
  { id: null, name: "Material didático" },
]

type Breadcrumb = { id: string | null; name: string }

export default function MateriaisPage() {
  // Estado para navegação de pastas (futuramente via Firestore)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  // Estado para menu de adição
  const [showAddMenu, setShowAddMenu] = useState(false)
  // Estado para busca
  const [search, setSearch] = useState("")
  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [loadingFolder, setLoadingFolder] = useState(false)
  const [showAddFileDialog, setShowAddFileDialog] = useState(false)
  const [fileTitle, setFileTitle] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loadingFile, setLoadingFile] = useState(false)
  const { toast } = useToast()
  // Estado para materiais vindos do Firestore
  const [materiais, setMateriais] = useState<any[]>([])
  const [loadingMateriais, setLoadingMateriais] = useState(true)
  // Breadcrumbs dinâmicos
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: "Material didático" }])
  // Para nomes individuais dos arquivos
  const [fileNames, setFileNames] = useState<string[]>([])

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    console.log('Página de materiais do professor carregada')
  }, [])

  // Buscar materiais do Firestore ao carregar ou mudar de pasta
  useEffect(() => {
    async function fetchMateriais() {
      setLoadingMateriais(true)
      try {
        console.log('Buscando materiais para pasta:', currentFolder || 'raiz')
        const q = currentFolder
          ? query(collection(db, "materials"), where("parentId", "==", currentFolder))
          : query(collection(db, "materials"), where("parentId", "==", null))
        const snap = await getDocs(q)
        const materiaisData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
        
        console.log('Materiais carregados:', {
          total: materiaisData.length,
          folders: materiaisData.filter(m => m.type === 'folder').length,
          files: materiaisData.filter(m => m.type === 'file').length
        })
        
        setMateriais(materiaisData)
      } catch (err) {
        console.error('Erro ao buscar materiais:', err)
        setMateriais([])
      } finally {
        setLoadingMateriais(false)
      }
    }
    fetchMateriais()
  }, [currentFolder, showAddFolderDialog, showAddFileDialog])

  // Filtrar materiais pelo nome
  const materiaisFiltrados = materiais.filter(mat =>
    mat.name?.toLowerCase().includes(search.toLowerCase())
  )

  // Atualizar breadcrumbs ao navegar para uma pasta
  const handleOpenFolder = useCallback((folder: { id: string; name: string }) => {
    console.log('Navegando para pasta:', folder.name)
    setCurrentFolder(folder.id)
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
  }, [])

  // Voltar para uma pasta anterior pelo breadcrumb
  const handleBreadcrumbClick = (idx: number) => {
    const bc = breadcrumbs[idx]
    console.log('Navegando via breadcrumb para:', bc.name)
    setCurrentFolder(bc.id)
    setBreadcrumbs(breadcrumbs.slice(0, idx + 1))
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 flex items-center gap-2 mb-4 mt-2">
        {breadcrumbs.map((bc, idx) => (
          <span key={bc.id || "root"} className="flex items-center gap-1">
            {idx > 0 && <span className="mx-1">/</span>}
            <button
              className="hover:underline"
              onClick={() => handleBreadcrumbClick(idx)}
              disabled={idx === breadcrumbs.length - 1}
            >
              {bc.name}
            </button>
          </span>
        ))}
      </nav>

      <h1 className="text-3xl font-bold tracking-tight mb-6">Material didático</h1>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <Input
          placeholder="Buscar material..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-80"
        />
        <div className="flex-1 flex justify-end">
          <div className="relative">
            <Button onClick={() => setShowAddMenu((v) => !v)}>
              Adicionar material
            </Button>
            {showAddMenu && (
              <div className="absolute right-0 mt-2 bg-white border rounded shadow z-10 min-w-[160px]">
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100"
                  onClick={() => { setShowAddMenu(false); setShowAddFileDialog(true); }}
                >
                  <FilePlus className="h-4 w-4" /> Arquivo
                </button>
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100"
                  onClick={() => { setShowAddMenu(false); setShowAddFolderDialog(true); }}
                >
                  <FolderPlus className="h-4 w-4" /> Pasta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Conteúdo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingMateriais ? (
              <div className="col-span-full text-center text-gray-400 py-8">Carregando materiais...</div>
            ) : materiais.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-8">Nenhum material encontrado</div>
            ) : (
              materiaisFiltrados.map((mat) => (
                <div
                  key={mat.id}
                  className="flex items-center gap-3 p-5 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer shadow-sm transition"
                  onClick={mat.type === "folder" ? () => handleOpenFolder(mat) : undefined}
                >
                  {mat.type === "folder" ? (
                    <FolderIcon className="h-7 w-7 text-blue-600" />
                  ) : (
                    <FileText className="h-7 w-7 text-gray-500" />
                  )}
                  <span className="font-medium text-lg truncate">{mat.name}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de criação de pasta */}
      <Dialog open={showAddFolderDialog} onOpenChange={setShowAddFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova pasta</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!folderName.trim()) return
              setLoadingFolder(true)
              try {
                await addDoc(collection(db, "materials"), {
                  type: "folder",
                  name: folderName.trim(),
                  parentId: currentFolder || null,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                })
                toast({ title: "Pasta criada com sucesso!", variant: "default" })
                setShowAddFolderDialog(false)
                setFolderName("")
                // TODO: recarregar lista de materiais
              } catch (err) {
                toast({ title: "Erro ao criar pasta", description: "Tente novamente.", variant: "destructive" })
              } finally {
                setLoadingFolder(false)
              }
            }}
            className="space-y-4"
          >
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Nome da pasta"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              disabled={loadingFolder}
              autoFocus
              required
            />
            <DialogFooter>
              <Button type="submit" disabled={loadingFolder || !folderName.trim()}>
                {loadingFolder ? "Criando..." : "Criar pasta"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loadingFolder}>Cancelar</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de upload de arquivo */}
      <Dialog open={showAddFileDialog} onOpenChange={setShowAddFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar arquivo PDF</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (loadingFile) return
              if (selectedFiles.length === 0 || fileNames.length !== selectedFiles.length || fileNames.some(n => !n.trim())) {
                toast({ title: "Preencha todos os nomes dos arquivos.", variant: "destructive" })
                return
              }
              setLoadingFile(true)
              let uploadedPaths: string[] = []
              try {
                for (let i = 0; i < selectedFiles.length; i++) {
                  const file = selectedFiles[i]
                  const fileTitle = fileNames[i]
                  // Upload para o Storage
                  const storagePath = `materials/${Date.now()}-${file.name}`
                  const storageRef = ref(storage, storagePath)
                  await uploadBytes(storageRef, file)
                  uploadedPaths.push(storagePath)
                  const url = await getDownloadURL(storageRef)
                  // Criar documento no Firestore
                  await addDoc(collection(db, "materials"), {
                    type: "file",
                    name: fileTitle.trim(),
                    parentId: currentFolder || null,
                    file: {
                      name: file.name,
                      url,
                      size: file.size,
                      type: file.type
                    },
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  })
                }
                toast({ title: "Arquivo(s) adicionado(s) com sucesso!", variant: "default" })
                setShowAddFileDialog(false)
                setFileNames([])
                setSelectedFiles([])
                // TODO: recarregar lista de materiais
              } catch (err: any) {
                // Rollback: deletar arquivos enviados
                await Promise.all(uploadedPaths.map(async (path) => {
                  try { await deleteObject(ref(storage, path)) } catch {}
                }))
                toast({ title: "Erro ao adicionar arquivo", description: err?.message || "Tente novamente.", variant: "destructive" })
                console.error("Erro ao adicionar arquivo:", err)
              } finally {
                setLoadingFile(false)
              }
            }}
            className="space-y-4"
          >
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="w-full"
              onChange={e => {
                const files = e.target.files ? Array.from(e.target.files) : []
                setSelectedFiles(files)
                setFileNames(files.map(f => f.name.replace(/\.pdf$/i, "")))
              }}
              disabled={loadingFile}
              required
            />
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((f, idx) => (
                  <div key={f.name} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-40 truncate">{f.name}</span>
                    <input
                      type="text"
                      className="border rounded px-2 py-1 flex-1"
                      placeholder="Título do arquivo"
                      value={fileNames[idx] || ""}
                      onChange={e => {
                        const newNames = [...fileNames]
                        newNames[idx] = e.target.value
                        setFileNames(newNames)
                      }}
                      disabled={loadingFile}
                      required
                    />
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  loadingFile ||
                  selectedFiles.length === 0 ||
                  fileNames.length !== selectedFiles.length ||
                  fileNames.some(n => !n.trim())
                }
              >
                {loadingFile ? "Enviando..." : "Salvar arquivo(s)"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loadingFile}>Cancelar</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 