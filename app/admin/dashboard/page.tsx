"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'  // ← Ada useSearchParams
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminStats } from "@/components/admin-stats"
import { AdminTickets } from "@/components/admin-tickets"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProfileModal } from "@/components/user-profile-modal"
import { AdminNotificationsPanel } from "@/components/admin-notifications-panel"
import { User } from 'lucide-react'

function AdminDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()  // ← NEW
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [token, setToken] = useState("")
  const [activeTab, setActiveTab] = useState("analytics")  // ← NEW
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)  // ← NEW

  useEffect(() => {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")

    if (!token || role !== "admin") {
      router.push("/login")
      return
    }

    setToken(token)
    setIsAuthenticated(true)

    // ← NEW SECTION
    const ticketId = searchParams.get('ticketId')
    if (ticketId) {
      setActiveTab("tickets")
      setSelectedTicketId(parseInt(ticketId))
    }
  }, [router, searchParams])  // ← searchParams added

  // ← NEW FUNCTION
  const handleTicketClick = (ticketId?: number | string | null) => {
    // defensive: ensure ticketId exists before using it
    if (ticketId === undefined || ticketId === null || ticketId === "") {
      console.warn("handleTicketClick called without a ticketId", ticketId)
      return
    }

    const idNum = Number(ticketId)
    if (Number.isNaN(idNum)) {
      console.warn("handleTicketClick received invalid ticketId", ticketId)
      return
    }

    setActiveTab("tickets")
    setSelectedTicketId(idNum)

    const url = new URL(window.location.href)
    url.searchParams.set('ticketId', String(idNum))
    window.history.pushState({}, '', url)
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-2">
            <AdminNotificationsPanel 
              token={token} 
              onTicketClick={handleTicketClick}  
            />
            <Button
              onClick={() => setIsProfileOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <User className="w-4 h-4" />
              Profil
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">  {/* ← CHANGED */}
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tickets">Kelola Tiket</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <AdminStats />
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <AdminTickets selectedTicketId={selectedTicketId} />  {/* ← NEW PROP */}
          </TabsContent>
        </Tabs>
      </div>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        token={token}
      />
    </main>
  )
}

export default function AdminDashboardPage() {
  return (
    <ThemeProvider>
      <AdminDashboardContent />
    </ThemeProvider>
  )
}