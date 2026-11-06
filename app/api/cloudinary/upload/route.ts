import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const cloudName = String(formData.get("cloudName") || "")
    const uploadPreset = String(formData.get("uploadPreset") || "")

    if (!(file instanceof File) || !cloudName || !uploadPreset) {
      return NextResponse.json({ error: "A file, Cloudinary cloud name, and unsigned upload preset are required." }, { status: 400 })
    }

    const upload = new FormData()
    upload.append("file", file)
    upload.append("upload_preset", uploadPreset)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/auto/upload`, {
      method: "POST",
      body: upload,
    })

    const result = await response.json()
    if (!response.ok) return NextResponse.json({ error: result.error?.message || "Cloudinary upload failed." }, { status: response.status })

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type })
  } catch {
    return NextResponse.json({ error: "Unable to upload media right now." }, { status: 500 })
  }
}
