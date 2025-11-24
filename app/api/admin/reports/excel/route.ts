export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Get and verify token
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      console.error("No authorization token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      console.error("Invalid token or user is not admin", decoded)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse request body
    let status: string | undefined
    try {
      const body = await request.json().catch(() => ({}))
      status = body?.status
    } catch (err) {
      console.error("Failed to parse request body", err)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    // Build SQL query dengan parameter yang benar
    let sql = `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.category, 
        t.status, 
        t.created_at, 
        u.name, 
        u.divisi, 
        u.email
      FROM tickets t
      JOIN users u ON t.id_user = u.id
    `
    const params: any[] = []

    if (status && status !== "all") {
      sql += ` WHERE t.status = ?`
      params.push(status)
    }

    sql += ` ORDER BY t.created_at DESC`

    console.log("Executing SQL:", sql, "with params:", params)

    // Fetch data dari database
    const ticketsData = await query(sql, params)

    if (!Array.isArray(ticketsData)) {
      console.warn("Query returned non-array result:", ticketsData)
    }

    const rows = Array.isArray(ticketsData) ? ticketsData : []
    console.log(`Retrieved ${rows.length} tickets`)

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Laporan Tiket")

    // Configure columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Judul", key: "title", width: 25 },
      { header: "Deskripsi", key: "description", width: 35 },
      { header: "Kategori", key: "category", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "User", key: "name", width: 15 },
      { header: "Divisi", key: "divisi", width: 15 },
      { header: "Email", key: "email", width: 20 },
      { header: "Tanggal", key: "created_at", width: 18 },
    ]

    // Style header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3b82f6" } }
    headerRow.alignment = { horizontal: "center", vertical: "middle" }

    // Add data rows
    rows.forEach((ticket: any) => {
      worksheet.addRow({
        id: ticket.id ?? "-",
        title: ticket.title ?? "-",
        description: ticket.description ?? "-",
        category: ticket.category ?? "-",
        status: ticket.status ?? "-",
        name: ticket.name ?? "-",
        divisi: ticket.divisi ?? "-",
        email: ticket.email ?? "-",
        created_at: ticket.created_at
          ? new Date(ticket.created_at).toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "-",
      })
    })

    // Apply alternating row colors
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        if (rowNumber % 2 === 0) {
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }
        }
        row.alignment = { vertical: "middle" }
      }
    })

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer()

    console.log(`Generated Excel file with size: ${buffer.byteLength} bytes`)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="laporan-tiket-${Date.now()}.xlsx"`,
        "Content-Length": String(buffer.byteLength),
      },
    })
  } catch (error) {
    console.error("Excel generation error:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate Excel report",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
