import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, amount, orderId, callbackUrl } = await request.json()
    if (!email || !Number.isInteger(amount) || amount <= 0 || !orderId) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 })
    }
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) return NextResponse.json({ error: "Paystack is not configured" }, { status: 503 })

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount: amount * 100, reference: orderId, callback_url: callbackUrl }),
    })
    const data = await response.json()
    if (!response.ok || !data.status) return NextResponse.json({ error: data.message || "Paystack initialization failed" }, { status: 502 })
    return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference })
  } catch {
    return NextResponse.json({ error: "Unable to start payment" }, { status: 500 })
  }
}
