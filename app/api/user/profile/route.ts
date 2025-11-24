import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = decoded.userId
    if (!userId) return NextResponse.json({ error: "Invalid token payload" }, { status: 400 })

    // Map 'name' DB column to 'username' expected by frontend
    const sql = `
      SELECT 
        id,
        name AS username,
        email,
        divisi,
        profile_image_url,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `
    const result = await query(sql, [userId])
    const rows = Array.isArray(result) ? result : []

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Profile GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
