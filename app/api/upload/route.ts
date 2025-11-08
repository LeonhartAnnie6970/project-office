// import { put } from "@vercel/blob"
// import { type NextRequest, NextResponse } from "next/server"
// import { verifyToken } from "@/lib/auth"

// export async function POST(request: NextRequest) {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "")

//     if (!token) {
//         return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const decoded = verifyToken(token)
//     if (!decoded) {
//         return NextResponse.json({ error: "Invalid token" }, { status: 401 })
//     }

//     try {
//     const formData = await request.formData()
//     const file = formData.get("file") as File
//     const type = formData.get("type") as string

//     if (!file) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 })
//     }

//     if (!type || !["user_report", "admin_resolution"].includes(type)) {
//       return NextResponse.json({ error: "Invalid upload type" }, { status: 400 })
//     }

//     // Validasi file adalah gambar
//     if (!file.type.startsWith("image/")) {
//       return NextResponse.json({ error: "File must be an image" }, { status: 400 })
//     }

//     // Validasi ukuran file (maksimal 5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
//     }

//     // Upload ke Vercel Blob dengan nama yang unik
//     const timestamp = Date.now()
//     const fileName = `${type}_${decoded.userId}_${timestamp}_${file.name}`

//     const blob = await put(fileName, file, {
//       access: "public",
//     })

//     return NextResponse.json({
//       url: blob.url,
//       filename: file.name,
//       size: file.size,
//       type: file.type,
//     })
//   } catch (error) {
//     console.error("Upload error:", error)
//     return NextResponse.json({ error: "Upload failed" }, { status: 500 })
//   }
// }


import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

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
    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploadType = formData.get("type") as string // 'user_report' or 'admin_resolution'

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/\s+/g, "_")
    const filename = `${timestamp}_${originalName}`

    // Determine upload directory based on type
    const uploadDir = uploadType === "admin_resolution" ? "admin_resolution" : "user_report"
    const uploadsPath = path.join(process.cwd(), "public", "uploads", uploadDir)

    // Create directory if it doesn't exist
    if (!existsSync(uploadsPath)) {
      await mkdir(uploadsPath, { recursive: true })
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filePath = path.join(uploadsPath, filename)
    await writeFile(filePath, buffer)

    // Return public URL
    const url = `/uploads/${uploadDir}/${filename}`

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        url,
        filename,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}