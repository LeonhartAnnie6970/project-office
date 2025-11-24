// import { type NextRequest, NextResponse } from "next/server"
// import { query } from "@/lib/db"
// import { verifyToken } from "@/lib/auth"

// const NLP_API_URL = process.env.NLP_API_URL || "http://localhost:8000"

// export async function GET(request: NextRequest) {
//   const token = request.headers.get("authorization")?.replace("Bearer ", "")

//   if (!token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   }

//   const decoded = verifyToken(token)
//   if (!decoded) {
//     return NextResponse.json({ error: "Invalid token" }, { status: 401 })
//   }

//   try {
//     let tickets

//     if (decoded.role === "admin") {
//       // Admin sees all tickets
//       tickets = await query(
//         `SELECT t.*, u.name, u.email FROM tickets t 
//          JOIN users u ON t.id_user = u.id 
//          ORDER BY t.created_at DESC`,
//       )
//     } else {
//       // User sees only their tickets
//       tickets = await query(
//         `SELECT t.*, u.name, u.email FROM tickets t 
//          JOIN users u ON t.id_user = u.id 
//          WHERE t.id_user = ? 
//          ORDER BY t.created_at DESC`,
//         [decoded.userId],
//       )
//     }

//     return NextResponse.json(tickets)
//   } catch (error) {
//     console.error("Get tickets error:", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }

// export async function POST(request: NextRequest) {
//   const token = request.headers.get("authorization")?.replace("Bearer ", "")

//   if (!token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   }

//   const decoded = verifyToken(token)
//   if (!decoded) {
//     return NextResponse.json({ error: "Invalid token" }, { status: 401 })
//   }

//   try {
//     const contentType = request.headers.get("content-type") || ""
//     let title: string
//     let description: string
//     let imageUserUrl: string | null = null

//     if (contentType.includes ("application/json")) {
//       // Old JSON format for backward compatibility
//       const body = await request.json()
//     title = body.title
//     description = body.description
//   } else if (contentType.includes("multipart/form-data")) {
//       // New FormData format with optional image
//       const formData = await
//       request.formData()
//       title = formData.get("title") as string
//       description = formData.get("description") as string
//       imageUserUrl = formData.get ("imageUserUrl") as string
//     } else {
//         return NextResponse.json({ error: "Invalid content type" }, { status: 400})
//       }
    
//     // const { title, description } = await request.json()

//     if (!title || !description) {
//       return NextResponse.json({ error: "Title and description required" }, { status: 400 })
//     }

//     let category = null
//     try {
//       const nlpResponse = await fetch(`${NLP_API_URL}/classify`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text: `${title} ${description}` }),
//       })

//       if (nlpResponse.ok) {
//         const nlpResult = await nlpResponse.json()
//         category = nlpResult.category
//       }
//     } catch (nlpError) {
//       console.error("NLP classification error:", nlpError)
//       // Continue without classification if NLP fails
//     }

//     const result = await query(
//       "INSERT INTO tickets (id_user, title, description, image_user_url, category, status) VALUES (?, ?, ?, ?, ?, ?)",
//       [decoded.userId, title, description, imageUserUrl, category, "new"],
//     )

//     return NextResponse.json({ message: "Ticket created", ticketId: (result as any).insertId }, { status: 201 })
//   } catch (error) {
//     console.error("Create ticket error:", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }


import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { sendNotificationEmail } from "@/lib/email"


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
        `SELECT t.*, u.name, u.email, u.divisi FROM tickets t 
         JOIN users u ON t.id_user = u.id 
         ORDER BY t.created_at DESC`
      )
    } else {
      // User sees only their tickets
      tickets = await query(
        `SELECT t.*, u.name, u.email, u.divisi FROM tickets t 
         JOIN users u ON t.id_user = u.id 
         WHERE t.id_user = ? 
         ORDER BY t.created_at DESC`,
        [decoded.userId]
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
    // Check content type
    const contentType = request.headers.get("content-type") || ""
    
    let title, description, imageUserUrl
    
    if (contentType.includes("multipart/form-data")) {
      // Handle FormData
      const formData = await request.formData()
      title = formData.get("title") as string
      description = formData.get("description") as string
      imageUserUrl = formData.get("imageUserUrl") as string | null
    } else {
      // Handle JSON
      const body = await request.json()
      title = body.title
      description = body.description
      imageUserUrl = body.imageUserUrl
    }

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description required" }, { status: 400 })
    }

    // NLP Classification
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

    // Insert ticket with image
    const result = await query(
      `INSERT INTO tickets (id_user, title, description, category, status, image_user_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [decoded.userId, title, description, category, "new", imageUserUrl || null]
    )

    // return NextResponse.json(
    //   { 
    //     message: "Ticket created", 
    //     ticketId: (result as any).insertId,
    //     category 
    //   }, 
    //   { status: 201 }
    // )

    const ticketId = (result as any).insertId

    try {
      // Get semua admin users
      const admins = await query("SELECT id, name, email FROM users WHERE role = 'admin'")
      const userInfo = await query("SELECT name, divisi FROM users WHERE id = ?", [decoded.userId])
      const user = (userInfo as any)[0]

      // Create notification untuk setiap admin and send email only once
      for (const admin of admins as any[]) {
        try {
          // Check if a notification already exists for this admin + ticket
          const existing = await query(
            "SELECT id, email_sent FROM notifications WHERE id_admin = ? AND id_ticket = ? LIMIT 1",
            [admin.id, ticketId],
          )

          let notificationId: number | null = null
          const existingRow = (existing as any[])[0]

          if (existingRow) {
            notificationId = existingRow.id
            // If email already sent for this notification, skip
            if (existingRow.email_sent) {
              continue
            }
            // Otherwise update message/title/is_read in case we want to refresh
            await query(
              "UPDATE notifications SET id_user = ?, title = ?, message = ?, is_read = ? WHERE id = ?",
              [decoded.userId, title, `Tiket baru dari ${user.name}`, false, notificationId],
            )
          } else {
            // Insert notification with email_sent default 0
            const insertRes = await query(
              "INSERT INTO notifications (id_admin, id_ticket, id_user, title, message, is_read, email_sent) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [admin.id, ticketId, decoded.userId, title, `Tiket baru dari ${user.name}`, false, 0],
            )
            notificationId = (insertRes as any).insertId
          }

          // Send email notification only if not already sent
          try {
            await sendNotificationEmail(admin.email, admin.name, title, user.name, user.divisi, ticketId)
            // Mark notification as email_sent = 1
            if (notificationId) {
              await query("UPDATE notifications SET email_sent = 1 WHERE id = ?", [notificationId])
            }
          } catch (emailErr) {
            console.error("[v0] Error sending notification email to", admin.email, emailErr)
            // Do not throw — notification row remains with email_sent = 0
          }
        } catch (e) {
          console.error("[v0] Notification handling error for admin", admin, e)
        }
      }

      console.log("[v0] Notifications processed for ticket", ticketId)
    } catch (notificationError) {
      console.error("[v0] Error creating notifications:", notificationError)
      // Continue even if notification fails
    }

    return NextResponse.json({ message: "Ticket created", ticketId }, { status: 201 })
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}