// import { type NextRequest, NextResponse } from "next/server"
// import { query } from "@/lib/db"
// import { verifyToken } from "@/lib/auth"

// export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
//   const token = request.headers.get("authorization")?.replace("Bearer ", "")

//   if (!token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   }

//   const decoded = verifyToken(token)
//   if (!decoded) {
//     return NextResponse.json({ error: "Invalid token" }, { status: 401 })
//   }

//   try {
//     const tickets = await query(
//       `SELECT t.*, u.name, u.email FROM tickets t 
//        JOIN users u ON t.id_user = u.id 
//        WHERE t.id = ?`,
//       [params.id],
//     )

//     if (!Array.isArray(tickets) || tickets.length === 0) {
//       return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
//     }

//     const ticket = tickets[0] as any

//     // Check authorization
//     if (decoded.role !== "admin" && ticket.id_user !== decoded.userId) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 })
//     }

//     return NextResponse.json(ticket)
//   } catch (error) {
//     console.error("Get ticket error:", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }

// export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
//     let bodyData: any

//     if (contentType.includes("application/json")) {
//       bodyData = await request.json()
//     } else {
//       return NextResponse.json({ error: "Invalid content type"}, { status: 400 })
//     }
    
//     const { status, category, imageAdminUrl, adminNotes } = bodyData

//     // Only admin can update status, category, image, and notes
//     if (decoded.role !== "admin") {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 })
//     }

//     const updates = []
//     const values = []

//     if (status !== undefined) {
//       updates.push("status = ?")
//       values.push(status)
//     }
//     if (category !== undefined) {
//       updates.push("category = ?")
//       values.push(category)
//     }
//     if (imageAdminUrl !== undefined) {
//       if (imageAdminUrl === null) {
//         // Delete image
//         updates.push("image_admin_url = NULL")
//         updates.push("image_admin_uploaded_at = NULL")
//       } else {
//         // Upload new image
//         updates.push("image_admin_url = ?")
//         updates.push("image_admin_uploaded_at = NOW()")
//         values.push(imageAdminUrl)
//       }
//     }
//     if (adminNotes !== undefined) {
//       updates.push("admin_notes = ?")
//       values.push(adminNotes)
//     }

//     if (updates.length === 0) {
//       return NextResponse.json({ error: "No updates provided" }, { status: 400 })
//     }

//     values.push(params.id)

//     await query(`UPDATE tickets SET ${updates.join(", ")} WHERE id = ?`, values)

//     return NextResponse.json({ message: "Ticket updated" })
//   } catch (error) {
//     console.error("Update ticket error:", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }


import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  try {
    const tickets = await query(
      `SELECT t.*, u.name, u.email FROM tickets t 
       JOIN users u ON t.id_user = u.id 
       WHERE t.id = ?`,
      [params.id]
    )

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = tickets[0] as any

    if (decoded.role !== "admin" && ticket.id_user !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Get ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { status, category, adminNotes, imageAdminUrl } = body

    // Only admin can update
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get ticket info for notification
    const ticketResult = await query(
      "SELECT id_user, title, status FROM tickets WHERE id = ?",
      [params.id]
    )

    if (!Array.isArray(ticketResult) || ticketResult.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = ticketResult[0] as any
    const userId = ticket.id_user
    const ticketTitle = ticket.title
    const oldStatus = ticket.status

    const updates = []
    const values = []
    let notificationMessage = ""
    let notificationType: string | null = null

    // Status update
    if (status && status !== oldStatus) {
      updates.push("status = ?")
      values.push(status)
      
      const statusText = {
        'new': 'Baru',
        'in_progress': 'Sedang Diproses',
        'resolved': 'Terselesaikan'
      }[status as 'new' | 'in_progress' | 'resolved'] || status

      notificationMessage = `Admin telah mengubah status ticket Anda menjadi "${statusText}"`
      notificationType = status === 'resolved' ? 'ticket_resolved' : 'status_update'
    }

    // Category update
    if (category) {
      updates.push("category = ?")
      values.push(category)
    }

    // Admin notes update
    if (adminNotes !== undefined) {
      updates.push("admin_notes = ?")
      values.push(adminNotes)
      
      if (!notificationMessage) {
        notificationMessage = "Admin telah menambahkan catatan pada ticket Anda"
        notificationType = 'admin_note'
      }
    }

    // Admin image update
    if (imageAdminUrl !== undefined) {
      updates.push("image_admin_url = ?, image_admin_uploaded_at = NOW()")
      values.push(imageAdminUrl)
      
      if (!notificationMessage && imageAdminUrl) {
        notificationMessage = "Admin telah mengunggah gambar resolusi untuk ticket Anda"
        notificationType = 'admin_image'
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    values.push(params.id)

    // Update ticket
    await query(`UPDATE tickets SET ${updates.join(", ")} WHERE id = ?`, values)

    // Create notification for user
    if (notificationMessage && notificationType) {
      await query(
        `INSERT INTO user_notifications (user_id, ticket_id, ticket_title, message, type) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, params.id, ticketTitle, notificationMessage, notificationType]
      )
    }

    return NextResponse.json({ message: "Ticket updated" })
  } catch (error) {
    console.error("Update ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}