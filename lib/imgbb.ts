export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("image", file)

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
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
