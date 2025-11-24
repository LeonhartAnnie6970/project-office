"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeProvider } from "@/components/theme-provider"

function HomeContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = () => {
    setIsLoading(true)
    router.push("/login")
  }

  return (
    <main className="min-h-screen bg-gradient from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-balance">Helpdesk NLP</h1>
          <p className="text-lg text-muted-foreground text-balance">
            Sistem helpdesk otomatis dengan klasifikasi berbasis AI untuk Bahasa Indonesia dan Inggris
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Klasifikasi Otomatis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sistem NLP secara otomatis mengklasifikasikan tiket ke kategori yang tepat
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bilingual Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Mendukung Bahasa Indonesia dan Inggris dengan translasi otomatis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dashboard Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Admin dapat melihat statistik dan grafik real-time dari semua tiket
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Mulai Sekarang</CardTitle>
            <CardDescription>Buat akun atau login untuk menggunakan sistem helpdesk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleGetStarted} disabled={isLoading} className="w-full" size="lg">
              {isLoading ? "Loading..." : "Login / Daftar"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Demo Account: admin@helpdesk.com / password (lihat database.sql)
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  )
}
