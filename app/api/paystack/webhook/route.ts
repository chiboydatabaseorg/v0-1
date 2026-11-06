import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { collection, db, doc, getDoc, updateDoc } from "@/lib/firebase"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature")
  const secret = process.env.PAYSTACK_SECRET_KEY

  if (!signature || !secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const digest = createHmac("sha512", secret).update(rawBody).digest("hex")
  const valid = signature.length === digest.length && timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 })

  const event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string; amount?: number; status?: string; metadata?: { orderId?: string } } }
  if (event.event !== "charge.success" || !event.data?.reference) return NextResponse.json({ received: true })

  const orderId = event.data.metadata?.orderId
  if (!orderId) return NextResponse.json({ received: true })

  const orderRef = doc(collection(db, "orders"), orderId)
  const orderSnap = await getDoc(orderRef)
  if (!orderSnap.exists()) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const order = orderSnap.data() as { total?: number; paymentStatus?: string }
  const expectedAmount = Math.round(Number(order.total ?? 0) * 100)
  if (event.data.amount !== expectedAmount || event.data.status !== "success") {
    return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 })
  }

  if (order.paymentStatus !== "verified") {
    await updateDoc(orderRef, {
      paymentStatus: "verified",
      paymentReference: event.data.reference,
      paymentProvider: "paystack",
      status: "approved",
      paidAt: new Date(),
    })
  }

  return NextResponse.json({ received: true })
}
