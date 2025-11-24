"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon, Calendar, Pencil, Trash2 } from "lucide-react"
import Image from "next/image"
// import { AdminTicketsByStatus } from "./admin-tickets-by-status"

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

export function AdminTickets() {
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

  useEffect(() => {
    fetchTickets()
  }, [])

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

      // Upload file
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

      // Update ticket with image URL
      const updateResponse = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageAdminUrl: uploadData.url }),
      })

      if (updateResponse.ok) {
        // Refresh tickets to get updated data
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
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("File harus berupa gambar")
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB")
        return
      }

      handleImageUpload(ticketId, file)
    }
    // Reset input value to allow uploading the same file again
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

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Kelola Tiket</CardTitle>
          <CardDescription>Update status, unggah gambar resolusi, dan tambahkan catatan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{ticket.title}</h3>
                    <p className="text-sm text-muted-foreground">{ticket.name}
                      {ticket.divisi && (
                  <i className="text-xs"> Divisi : {ticket.divisi}
                  </i>
                )}
                    </p>
                  </div>
                  <Badge variant="outline">{ticket.category || "Uncategorized"}</Badge>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Deskripsi User:</p>
                  <p className="text-sm">{ticket.description}</p>
                </div>

                {/* Admin Notes Section */}
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

                {/* Images Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* User Image */}
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

                  {/* Admin Image */}
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
                  Dibuat: {new Date(ticket.created_at).toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
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

      {/* Notes Editor Modal */}
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