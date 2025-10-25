"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Ticket {
  id: number
  title: string
  description: string
  category: string
  status: string
  created_at: string
  name: string
}

export function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>({})

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

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola Tiket</CardTitle>
        <CardDescription>Update status dan kategori tiket</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{ticket.title}</h3>
                  <p className="text-sm text-muted-foreground">{ticket.name}</p>
                </div>
                <Badge variant="outline">{ticket.category || "Uncategorized"}</Badge>
              </div>

              <p className="text-sm text-muted-foreground">{ticket.description}</p>

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

              <p className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleString("id-ID")}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
