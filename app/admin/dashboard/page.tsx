"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Sidebar } from "@/components/sidebar"
import { AdminStats } from "@/components/admin-stats"
import { AdminTickets } from "@/components/admin-tickets"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProfileModal } from "@/components/user-profile-modal"
import { AdminNotificationsPanel } from "@/components/admin-notifications-panel"
import { Bell, User } from 'lucide-react'
import { Button } from "@/components/ui/button"

function AdminDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [token, setToken] = useState("")
  const [activeTab, setActiveTab] = useState("analytics")
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")

    if (!token || role !== "admin") {
      router.push("/login")
      return
    }

    setToken(token)
    setIsAuthenticated(true)

    const ticketId = searchParams.get('ticketId')
    if (ticketId) {
      setActiveTab("tickets")
      setSelectedTicketId(parseInt(ticketId))
    }
  }, [router, searchParams])

  const handleTicketClick = (ticketId?: number | string | null) => {
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

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("role")
    router.push("/login")
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        role="admin"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileOpen(true)}
        notificationCount={notificationCount}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto ml-64 transition-all duration-300">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold">
                {activeTab === "analytics" ? "Analytics Dashboard" : "Kelola Tiket"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "analytics" 
                  ? "Monitor performa dan statistik sistem" 
                  : "Kelola dan proses ticket dari user"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <AdminNotificationsPanel 
                token={token} 
                onTicketClick={handleTicketClick}
              />
              <Button
                onClick={() => setIsProfileOpen(true)}
                variant="outline"
                size="icon"
              >
                <User className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          {activeTab === "analytics" && <AdminStats />}
          {activeTab === "tickets" && <AdminTickets selectedTicketId={selectedTicketId} />}
        </div>
      </main>

      {/* Modals */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        token={token}
      />
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <ThemeProvider>
      <AdminDashboardContent />
    </ThemeProvider>
  )
}