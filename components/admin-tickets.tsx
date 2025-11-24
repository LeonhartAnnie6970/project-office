"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, X, ImageIcon, Calendar, Pencil, Trash2, AlertCircle, Search, Filter } from "lucide-react"
import Image from "next/image"

interface Ticket {
  id: number
  title: string
  description: string
  category: string
  status: string
  created_at: string
  name: string
  image_user_url?: string
  image_admin_url?: string
  image_admin_uploaded_at?: string
  admin_notes?: string
  divisi?: string | null
}

interface AdminTicketsProps {
  selectedTicketId?: number | null
}

export function AdminTickets({ selectedTicketId }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>({})
  const [uploadingImage, setUploadingImage] = useState<Record<number, boolean>>({})
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    title: string
    type: "user" | "admin"
    userName?: string
    uploadedAt?: string
  } | null>(null)
  const [editingNotes, setEditingNotes] = useState<{
    ticketId: number
    notes: string
  } | null>(null)
  const [savingNotes, setSavingNotes] = useState(false)
  const [activeTab, setActiveTab] = useState("new")
  const ticketRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    if (selectedTicketId && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === selectedTicketId)
      if (ticket) {
        setActiveTab(ticket.status)
        
        setTimeout(() => {
          const element = ticketRefs.current[selectedTicketId]
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
            }, 3000)
          }
        }, 300)
      }
    }
  }, [selectedTicketId, tickets])

  const fetchTickets = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")

      const response = await fetch("/api/tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        setError("Failed to fetch tickets")
        return
      }

      const data = await response.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError("An error occurred while fetching tickets")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter tickets based on search query, date, and category
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets]

    // Search filter (keyword in title, description, name, or divisi)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.name.toLowerCase().includes(query) ||
        ticket.divisi?.toLowerCase().includes(query) ||
        ticket.category?.toLowerCase().includes(query) ||
        ticket.admin_notes?.toLowerCase().includes(query)
      )
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.created_at).toISOString().split('T')[0]
        return ticketDate === dateFilter
      })
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter)
    }

    return filtered
  }, [tickets, searchQuery, dateFilter, categoryFilter])

  // Group filtered tickets by status
  const newTickets = filteredTickets.filter(t => t.status === "new")
  const inProgressTickets = filteredTickets.filter(t => t.status === "in_progress")
  const resolvedTickets = filteredTickets.filter(t => t.status === "resolved")

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(tickets.map(t => t.category).filter(Boolean))
    return Array.from(cats)
  }, [tickets])

  const handleClearFilters = () => {
    setSearchQuery("")
    setDateFilter("")
    setCategoryFilter("all")
  }

  const hasActiveFilters = searchQuery || dateFilter || categoryFilter !== "all"

  const handleStatusUpdate = async (ticketId: number, newStatus: string) => {
    setUpdatingStatus((prev) => ({ ...prev, [ticketId]: true }))

    try {
      const token = localStorage.getItem("token")

      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)))
      }
    } catch (err) {
      console.error("Error updating ticket:", err)
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [ticketId]: false }))
    }
  }

  const handleImageUpload = async (ticketId: number, file: File) => {
    setUploadingImage((prev) => ({ ...prev, [ticketId]: true }))

    try {
      const token = localStorage.getItem("token")

      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "admin_resolution")

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image")
      }

      const uploadData = await uploadResponse.json()

      const updateResponse = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageAdminUrl: uploadData.url }),
      })

      if (updateResponse.ok) {
        await fetchTickets()
      }
    } catch (err) {
      console.error("Error uploading image:", err)
      alert("Gagal mengunggah gambar")
    } finally {
      setUploadingImage((prev) => ({ ...prev, [ticketId]: false }))
    }
  }

  const handleDeleteAdminImage = async (ticketId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus gambar ini?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")

      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageAdminUrl: null }),
      })

      if (response.ok) {
        await fetchTickets()
      }
    } catch (err) {
      console.error("Error deleting image:", err)
      alert("Gagal menghapus gambar")
    }
  }

  const handleFileSelect = (ticketId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("File harus berupa gambar")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB")
        return
      }

      handleImageUpload(ticketId, file)
    }
    event.target.value = ""
  }

  const openImageModal = (url: string, title: string, type: "user" | "admin", userName?: string, uploadedAt?: string) => {
    setSelectedImage({ url, title, type, userName, uploadedAt })
  }

  const openNotesEditor = (ticketId: number, currentNotes?: string) => {
    setEditingNotes({ ticketId, notes: currentNotes || "" })
  }

  const handleSaveNotes = async () => {
    if (!editingNotes) return

    setSavingNotes(true)
    try {
      const token = localStorage.getItem("token")

      const response = await fetch(`/api/tickets/${editingNotes.ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNotes: editingNotes.notes }),
      })

      if (response.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === editingNotes.ticketId ? { ...t, admin_notes: editingNotes.notes } : t
          )
        )
        setEditingNotes(null)
      }
    } catch (err) {
      console.error("Error saving notes:", err)
      alert("Gagal menyimpan catatan")
    } finally {
      setSavingNotes(false)
    }
  }

  const renderTicketCard = (ticket: Ticket) => (
    <div 
      key={ticket.id} 
      ref={(el) => { ticketRefs.current[ticket.id] = el }}
      className="border rounded-lg p-4 space-y-3 bg-card transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{ticket.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">{ticket.name}</p>
            {ticket.divisi && (
              <Badge variant="secondary" className="text-xs">{ticket.divisi}</Badge>
            )}
          </div>
        </div>
        <Badge variant="outline">{ticket.category || "Uncategorized"}</Badge>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Deskripsi User:</p>
        <p className="text-sm">{ticket.description}</p>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Catatan Admin:</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openNotesEditor(ticket.id, ticket.admin_notes)}
          >
            <Pencil className="h-3 w-3 mr-1" />
            {ticket.admin_notes ? "Edit" : "Tambah"}
          </Button>
        </div>
        {ticket.admin_notes ? (
          <p className="text-sm whitespace-pre-wrap">{ticket.admin_notes}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Belum ada catatan admin</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Gambar dari User:</p>
          {ticket.image_user_url ? (
            <div
              className="relative aspect-video border rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => openImageModal(ticket.image_user_url!, ticket.title, "user", ticket.name)}
            >
              <Image
                src={ticket.image_user_url}
                alt="User report"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video border rounded-lg flex items-center justify-center bg-muted">
              <div className="text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Tidak ada gambar</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Gambar Resolusi Admin:</p>
          {ticket.image_admin_url ? (
            <div className="space-y-2">
              <div
                className="relative aspect-video border rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group"
                onClick={() => openImageModal(
                  ticket.image_admin_url!,
                  ticket.title,
                  "admin",
                  ticket.name,
                  ticket.image_admin_uploaded_at
                )}
              >
                <Image
                  src={ticket.image_admin_url}
                  alt="Admin resolution"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="flex items-center justify-between">
                {ticket.image_admin_uploaded_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(ticket.image_admin_uploaded_at).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <label htmlFor={`reupload-${ticket.id}`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage[ticket.id]}
                      onClick={() => document.getElementById(`reupload-${ticket.id}`)?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Ganti
                    </Button>
                  </label>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAdminImage(ticket.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>
              <input
                id={`reupload-${ticket.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(ticket.id, e)}
                disabled={uploadingImage[ticket.id]}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="aspect-video border rounded-lg flex items-center justify-center bg-muted">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Belum ada gambar</p>
                </div>
              </div>
              <label htmlFor={`upload-${ticket.id}`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={uploadingImage[ticket.id]}
                  onClick={() => document.getElementById(`upload-${ticket.id}`)?.click()}
                >
                  {uploadingImage[ticket.id] ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Unggah Gambar Resolusi
                    </>
                  )}
                </Button>
                <input
                  id={`upload-${ticket.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(ticket.id, e)}
                  disabled={uploadingImage[ticket.id]}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={ticket.status} onValueChange={(value) => handleStatusUpdate(ticket.id, value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          {updatingStatus[ticket.id] && <span className="text-xs text-muted-foreground">Updating...</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(ticket.created_at).toLocaleString("id-ID")}
        </p>
      </div>
    </div>
  )

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>
  }

  return (
    <>
      {/* Search & Filter Section */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan judul, deskripsi, nama user, divisi, kategori, atau catatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Date Filter */}
              <div className="w-48">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  placeholder="Filter tanggal"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button variant="ghost" onClick={handleClearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Filter Info */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>
                  Menampilkan {filteredTickets.length} dari {tickets.length} tiket
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new" className="relative">
            New Tickets
            {newTickets.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {newTickets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="relative">
            In Progress
            {inProgressTickets.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {inProgressTickets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="relative">
            Resolved
            {resolvedTickets.length > 0 && (
              <Badge variant="outline" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {resolvedTickets.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Tiket Baru ({newTickets.length})
              </CardTitle>
              <CardDescription>
                Tiket yang baru masuk dan belum diproses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters ? "Tidak ada tiket yang sesuai dengan filter" : "Tidak ada tiket baru"}
                </div>
              ) : (
                <div className="space-y-4">
                  {newTickets.map(renderTicketCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-yellow-500 animate-pulse" />
                Tiket Sedang Diproses ({inProgressTickets.length})
              </CardTitle>
              <CardDescription>
                Tiket yang sedang dalam penanganan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inProgressTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters ? "Tidak ada tiket yang sesuai dengan filter" : "Tidak ada tiket yang sedang diproses"}
                </div>
              ) : (
                <div className="space-y-4">
                  {inProgressTickets.map(renderTicketCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-green-500" />
                Tiket Terselesaikan ({resolvedTickets.length})
              </CardTitle>
              <CardDescription>
                Tiket yang sudah selesai ditangani
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resolvedTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters ? "Tidak ada tiket yang sesuai dengan filter" : "Belum ada tiket yang terselesaikan"}
                </div>
              ) : (
                <div className="space-y-4">
                  {resolvedTickets.map(renderTicketCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedImage?.type === "user" ? "Gambar dari User" : "Gambar Resolusi Admin"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
              {selectedImage?.url && (
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{selectedImage?.title}</p>
              {selectedImage?.userName && (
                <p className="text-sm text-muted-foreground">
                  {selectedImage.type === "user" ? "Dilaporkan" : "Dikerjakan"} oleh: {selectedImage.userName}
                </p>
              )}
              {selectedImage?.uploadedAt && (
                <p className="text-sm text-muted-foreground">
                  Diunggah: {new Date(selectedImage.uploadedAt).toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingNotes} onOpenChange={() => setEditingNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catatan Admin</DialogTitle>
            <DialogDescription>
              Tambahkan catatan atau penjelasan untuk resolusi tiket ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes">Catatan</Label>
              <Textarea
                id="admin-notes"
                placeholder="Tulis catatan resolusi, langkah-langkah yang dilakukan, atau informasi penting lainnya..."
                value={editingNotes?.notes || ""}
                onChange={(e) =>
                  setEditingNotes((prev) => (prev ? { ...prev, notes: e.target.value } : null))
                }
                rows={6}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingNotes(null)}>
                Batal
              </Button>
              <Button onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? "Menyimpan..." : "Simpan Catatan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}