import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const tickets = await query(`
      SELECT 
        t.id,
        t.title,
        t.status,
        t.image_user_url,
        t.image_admin_url,
        u.name,
        t.description
      FROM tickets t
      JOIN users u ON t.id_user = u.id
      WHERE t.image_user_url IS NOT NULL 
         OR t.image_admin_url IS NOT NULL
      ORDER BY t.created_at DESC
    `)

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Error fetching ticket images:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
