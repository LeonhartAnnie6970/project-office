export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse body
    let status: string | undefined
    try {
      const body = await request.json().catch(() => ({}))
      status = typeof body?.status === "string" ? body.status : undefined
    } catch {
      status = undefined
    }

    // Build query
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
      LEFT JOIN users u ON t.id_user = u.id
    `
    const params: any[] = []
    if (status && status !== "all") {
      sql += ` WHERE t.status = ?`
      params.push(status)
    }
    sql += ` ORDER BY t.created_at DESC`

    const result = await query(sql, params)
    const rows = Array.isArray(result) ? result : []

    // Generate PDF dengan jsPDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    let yPosition = 15

    // Header
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Laporan Tiket Helpdesk", 105, yPosition, { align: "center" })
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Tanggal: ${new Date().toLocaleString("id-ID")}`, 15, yPosition)
    yPosition += 8

    if (status && status !== "all") {
      doc.text(`Filter Status: ${status.toUpperCase()}`, 15, yPosition)
      yPosition += 8
    }

    yPosition += 5

    // Manual table drawing
    const colWidths = [12, 35, 40, 25, 20, 28]
    const colHeaders = ["ID", "Judul", "User/Divisi", "Kategori", "Status", "Tanggal"]
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width
    const rowHeight = 7
    const marginLeft = 12
    const marginRight = 12
    const availableWidth = pageWidth - marginLeft - marginRight

    // Draw header row
    let xPos = marginLeft
    doc.setFillColor(59, 130, 246)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)

    // Header background
    doc.rect(marginLeft, yPosition - 4, availableWidth, rowHeight, "F")

    // Header text
    for (let i = 0; i < colHeaders.length; i++) {
      doc.text(colHeaders[i], xPos + 2, yPosition + 2, { maxWidth: colWidths[i] - 2 })
      xPos += colWidths[i]
    }

    yPosition += rowHeight
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)

    // Draw data rows
    for (const r of rows as any[]) {
      // Check if need new page
      if (yPosition + rowHeight > pageHeight - 10) {
        doc.addPage()
        yPosition = 15
      }

      xPos = marginLeft
      const title = String(r.title ?? "-").slice(0, 20)
      const userDiv = `${r.name ?? "-"}/${r.divisi ?? "-"}`
      const created = r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "-"
      const rowData = [
        String(r.id ?? "-"),
        title,
        userDiv,
        String(r.category ?? "-"),
        String(r.status ?? "-"),
        created,
      ]

      // Draw row background (alternating)
      if ((rows.indexOf(r) + 1) % 2 === 0) {
        doc.setFillColor(240, 240, 240)
        doc.rect(marginLeft, yPosition - 4, availableWidth, rowHeight, "F")
      }

      // Draw row text
      for (let i = 0; i < rowData.length; i++) {
        doc.text(rowData[i], xPos + 2, yPosition + 2, { maxWidth: colWidths[i] - 2 })
        xPos += colWidths[i]
      }

      // Draw row borders
      doc.setDrawColor(200, 200, 200)
      doc.line(marginLeft, yPosition + rowHeight - 4, marginLeft + availableWidth, yPosition + rowHeight - 4)

      yPosition += rowHeight
    }

    // Draw final border
    doc.setDrawColor(59, 130, 246)
    doc.rect(marginLeft, 15 - 4, availableWidth, yPosition - (15 - 4))

    // Footer
    const pageCount = doc.getNumberOfPages()
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100)
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      )
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-tiket-${Date.now()}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    })
  } catch (error) {
    console.error("PDF route error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}