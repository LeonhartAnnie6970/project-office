"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminStats } from "@/components/admin-stats"
import { AdminTickets } from "@/components/admin-tickets"
import { TicketImagesGalleryKelola } from "@/components/ticket-images-gallery-kelola"
import { ThemeProvider } from "@/components/theme-provider"

function AdminDashboardContent() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")

    if (!token || role !== "admin") {
      router.push("/login")
      return
    }

    setIsAuthenticated(true)
  }, [router])

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
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tickets">Kelola Tiket</TabsTrigger>
            {/* <TabsTrigger value="images">Galeri Gambar</TabsTrigger> */}
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <AdminStats />
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <AdminTickets />
          </TabsContent>

          {/* <TabsContent value="images" className="space-y-4">
            <TicketImagesGalleryKelola />
          </TabsContent> */}
        </Tabs>
      </div>
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
