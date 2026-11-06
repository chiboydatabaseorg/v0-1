export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY
  if (!apiKey) throw new Error("Image uploads are not configured. Add an ImgBB API key.")
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.")
  if (file.size > 8 * 1024 * 1024) throw new Error("Images must be smaller than 8MB.")

  const formData = new FormData()
  formData.append("image", file)

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    {
      method: "POST",
      body: formData,
    }
  )

  if (!res.ok) {
    throw new Error("Failed to upload image")
  }

  const data = await res.json()
  return data.data.url
}
