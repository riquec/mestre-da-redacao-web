"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, AlertTriangle, Trash2, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { db, storage } from "@/lib/firebase"
import { collection, addDoc, setDoc, doc, getDocs, query, orderBy, getDocs as getUserDocs, where } from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"

export default function ParceirosPage() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    website: "",
    image: null as File | null,
    coupon: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [parceiros, setParceiros] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [alunos, setAlunos] = useState<any[]>([])
  const [alunosLoading, setAlunosLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    console.log('Página de parceiros do professor carregada')
  }, [])

  function sugerirCupom(nome: string) {
    return nome
      .normalize("NFD")
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "_")
      .toUpperCase()
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      ? `ALUNO_${nome
          .normalize("NFD")
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "_")
          .toUpperCase()
          .replace(/_+/g, "_")
          .replace(/^_+|_+$/g, "")}`
      : ""
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, files } = e.target
    if (name === "image") {
      const selectedFile = files?.[0] || null
      console.log('Imagem selecionada para parceiro:', selectedFile?.name)
      setForm(f => ({ ...f, image: selectedFile }))
    } else {
      setForm(f => ({ ...f, [name]: value, coupon: name === "title" ? sugerirCupom(value) : f.coupon }))
    }
  }

  function handleOpen() {
    console.log('Abrindo modal para novo parceiro')
    setForm({ title: "", website: "", image: null, coupon: "" })
    setOpen(true)
  }

  async function fetchParceiros() {
    try {
      console.log('Buscando parceiros')
      const q = query(collection(db, "partners"), orderBy("createdAt", "desc"))
      const snap = await getDocs(q)
      const parceirosData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
      
      console.log('Parceiros carregados:', {
        total: parceirosData.length,
        active: parceirosData.filter(p => p.active).length,
        inactive: parceirosData.filter(p => !p.active).length
      })
      
      setParceiros(parceirosData)
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error)
    }
  }

  // Buscar parceiros ao carregar
  useEffect(() => {
    fetchParceiros()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.website || !form.coupon) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      // 1. Upload da imagem (se houver)
      let imageUrl = ""
      if (form.image) {
        const imgRef = storageRef(storage, `partners/${Date.now()}-${form.image.name}`)
        await uploadBytes(imgRef, form.image)
        imageUrl = await getDownloadURL(imgRef)
      }
      // 2. Criar cupom
      const couponId = form.coupon.trim().toUpperCase()
      await setDoc(doc(db, "coupons", couponId), {
        id: couponId,
        type: "partner",
        active: true,
        createdAt: new Date(),
        partnerId: null, // será preenchido depois
      })
      // 3. Criar parceiro
      const partnerRef = await addDoc(collection(db, "partners"), {
        title: form.title,
        website: form.website,
        imageUrl,
        active: true,
        createdAt: new Date(),
        couponId,
      })
      // 4. Atualizar cupom com partnerId
      await setDoc(doc(db, "coupons", couponId), { partnerId: partnerRef.id }, { merge: true })
      setOpen(false)
      setForm({ title: "", website: "", image: null, coupon: "" })
      toast({ title: "Parceiro cadastrado com sucesso!", variant: "default" })
      fetchParceiros()
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar parceiro", description: err?.message || "Tente novamente.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function openPartnerDialog(partner: any) {
    setSelected(partner)
    setDialogOpen(true)
    setAlunos([])
    setAlunosLoading(true)
    try {
      // Buscar alunos que usam o cupom do parceiro
      const q = query(collection(db, "users"), where("couponUsed", "==", partner.couponId))
      const snap = await getUserDocs(q)
      setAlunos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (err) {
      setAlunos([])
    } finally {
      setAlunosLoading(false)
    }
  }

  async function toggleAtivo() {
    if (!selected) return
    setActionLoading(true)
    try {
      await setDoc(doc(db, "partners", selected.id), { active: !selected.active }, { merge: true })
      toast({ title: `Parceiro ${selected.active ? "desativado" : "ativado"} com sucesso!` })
      setSelected({ ...selected, active: !selected.active })
      fetchParceiros()
    } catch (err: any) {
      toast({ title: "Erro ao atualizar status", description: err?.message, variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    setActionLoading(true)
    try {
      await setDoc(doc(db, "partners", selected.id), { active: false }, { merge: true }) // soft delete
      toast({ title: "Parceiro desativado (soft delete) com sucesso!" })
      setDialogOpen(false)
      fetchParceiros()
    } catch (err: any) {
      toast({ title: "Erro ao excluir parceiro", description: err?.message, variant: "destructive" })
    } finally {
      setActionLoading(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Parceiros</h1>
          <p className="text-gray-500">Gerencie cursos parceiros, cupons e alunos vinculados</p>
        </div>
        <Button onClick={handleOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Novo parceiro
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Buscar parceiro por nome, site ou cupom..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {/* Filtros futuros */}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Aqui virão os cards/lista de parceiros */}
        {parceiros.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-10">Nenhum parceiro cadastrado ainda</div>
        )}
        {parceiros.map((p) => (
          <div
            key={p.id}
            className="border rounded-lg p-4 flex flex-col gap-2 bg-white shadow-sm cursor-pointer hover:shadow-md transition"
            onClick={() => openPartnerDialog(p)}
          >
            <div className="flex items-center gap-3">
              {p.imageUrl && <img src={p.imageUrl} alt={p.title} className="w-12 h-12 rounded object-cover border" />}
              <div>
                <div className="font-semibold text-lg">{p.title}</div>
                <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">{p.website}</a>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs mt-2">
              <span className={`px-2 py-0.5 rounded-full ${p.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>{p.active ? "Ativo" : "Inativo"}</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Cupom: <b>{p.couponId}</b></span>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo parceiro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nome do parceiro*</Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleInput}
                required
                placeholder="Ex: Curso Nova Geração"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Site do parceiro*</Label>
              <Input
                id="website"
                name="website"
                value={form.website}
                onChange={handleInput}
                required
                placeholder="https://..."
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Logo do parceiro</Label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleInput}
                disabled={loading}
              />
              {form.image && <span className="text-xs text-green-600">{form.image.name}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon">Cupom*</Label>
              <Input
                id="coupon"
                name="coupon"
                value={form.coupon}
                onChange={handleInput}
                required
                disabled={loading}
                placeholder="Ex: ALUNO_CURSO_NOVA_GERACAO"
              />
              <span className="text-xs text-gray-500">O cupom é gerado automaticamente, mas pode ser editado antes de salvar. Após salvo, não poderá ser alterado.</span>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialog de detalhes do parceiro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selected.imageUrl && <img src={selected.imageUrl} alt={selected.title} className="w-16 h-16 rounded object-cover border" />}
                <div>
                  <h2 className="text-xl font-bold mb-1">{selected.title}</h2>
                  <a href={selected.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{selected.website}</a>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${selected.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>{selected.active ? "Ativo" : "Inativo"}</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">Cupom: <b>{selected.couponId}</b></span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant={selected.active ? "outline" : "default"} onClick={toggleAtivo} disabled={actionLoading}>
                  {actionLoading ? "Salvando..." : selected.active ? "Desativar" : "Ativar"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)} disabled={actionLoading}>
                  <Trash2 className="w-4 h-4 mr-1" /> Excluir
                </Button>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Alunos que usam este cupom</h3>
                {alunosLoading ? (
                  <div className="text-gray-400 py-4">Carregando alunos...</div>
                ) : alunos.length === 0 ? (
                  <div className="text-gray-400 py-4">Nenhum aluno utiliza este cupom</div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border rounded">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left">Nome</th>
                          <th className="px-3 py-2 text-left">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alunos.map(aluno => (
                          <tr key={aluno.id} className="border-b last:border-0">
                            <td className="px-3 py-2">{aluno.name || aluno.displayName || "-"}</td>
                            <td className="px-3 py-2">{aluno.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {/* Confirmação de exclusão */}
              {confirmDelete && (
                <div className="bg-red-50 border border-red-200 rounded p-4 flex flex-col gap-2 mt-4">
                  <div className="flex items-center gap-2 text-red-700 font-medium">
                    <AlertTriangle className="w-5 h-5" />
                    Tem certeza que deseja excluir este parceiro? (soft delete)
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)} disabled={actionLoading}>
                      Cancelar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                      {actionLoading ? "Excluindo..." : "Confirmar exclusão"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 