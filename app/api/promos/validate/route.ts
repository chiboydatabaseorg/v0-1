import { NextResponse } from "next/server"
import { collection, db, getDocs } from "@/lib/firebase"

export async function POST(request: Request) {
  try {
    const body = await request.json() as { code?: string }
    const code = String(body.code || "").trim().toUpperCase()
    if (!code) return NextResponse.json({ error: "Promo code is required" }, { status: 400 })

    const snapshot = await getDocs(collection(db, "promos"))
    const promo = snapshot.docs.map((item) => item.data()).find((item) => {
      const value = item as { code?: string; active?: boolean; expiresAt?: string | null }
      return value.code === code && value.active === true && (!value.expiresAt || value.expiresAt >= new Date().toISOString().slice(0, 10))
    }) as { code: string; discountPercent: number } | undefined

    if (!promo) return NextResponse.json({ error: "That promo code is invalid or expired" }, { status: 404 })
    return NextResponse.json({ code: promo.code, discountPercent: promo.discountPercent })
  } catch {
    return NextResponse.json({ error: "Unable to validate promo code" }, { status: 500 })
  }
}
