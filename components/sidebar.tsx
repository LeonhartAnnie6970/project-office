"use client"

import { useState } from "react"
import { 
  LayoutDashboard, 
  Ticket, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  User,
  Bell,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface SidebarProps {
  role: "admin" | "user"
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  onOpenProfile: () => void
  notificationCount?: number
}

export function Sidebar({
  role,
  activeTab,
  onTabChange,
  onLogout,
  onOpenProfile,
  notificationCount = 0
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  const adminMenuItems = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "tickets", label: "Kelola Tiket", icon: Ticket },
  ]

  const userMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "my-tickets", label: "Tiket Saya", icon: FileText },
  ]

  const menuItems = role === "admin" ? adminMenuItems : userMenuItems

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 border-r bg-background",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {!collapsed && (
          <h2 className="text-lg font-bold">
            {role === "admin" ? "Admin Panel" : "User Dashboard"}
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                collapsed && "justify-center px-2"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn("w-5 h-5", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          )
        })}
      </nav>

      {/* Footer Actions */}
      <div className="border-t p-4 space-y-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start relative",
            collapsed && "justify-center px-2"
          )}
          onClick={() => {
            // Notification panel will be handled by parent
          }}
        >
          <Bell className={cn("w-5 h-5", !collapsed && "mr-3")} />
          {!collapsed && <span>Notifikasi</span>}
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Button>

        {/* Profile */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            collapsed && "justify-center px-2"
          )}
          onClick={onOpenProfile}
        >
          <User className={cn("w-5 h-5", !collapsed && "mr-3")} />
          {!collapsed && <span>Profil</span>}
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
          onClick={onLogout}
        >
          <LogOut className={cn("w-5 h-5", !collapsed && "mr-3")} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  )
}