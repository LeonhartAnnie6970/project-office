import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

const NLP_API_URL = process.env.NLP_API_URL || "http://localhost:8000"

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  try {
    let tickets

    if (decoded.role === "admin") {
      // Admin sees all tickets
      tickets = await query(
        `SELECT t.*, u.name, u.email FROM tickets t 
         JOIN users u ON t.id_user = u.id 
         ORDER BY t.created_at DESC`,
      )
    } else {
      // User sees only their tickets
      tickets = await query(
        `SELECT t.*, u.name, u.email FROM tickets t 
         JOIN users u ON t.id_user = u.id 
         WHERE t.id_user = ? 
         ORDER BY t.created_at DESC`,
        [decoded.userId],
      )
    }

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Get tickets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  try {
    const { title, description } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description required" }, { status: 400 })
    }

    let category = null
    try {
      const nlpResponse = await fetch(`${NLP_API_URL}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${title} ${description}` }),
      })

      if (nlpResponse.ok) {
        const nlpResult = await nlpResponse.json()
        category = nlpResult.category
      }
    } catch (nlpError) {
      console.error("NLP classification error:", nlpError)
      // Continue without classification if NLP fails
    }

    const result = await query(
      "INSERT INTO tickets (id_user, title, description, category, status) VALUES (?, ?, ?, ?, ?)",
      [decoded.userId, title, description, category, "new"],
    )

    return NextResponse.json({ message: "Ticket created", ticketId: (result as any).insertId }, { status: 201 })
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
