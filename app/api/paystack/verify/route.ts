import { NextResponse } from "next/server"
import { db, doc, getDoc, updateDoc, setDoc, serverTimestamp } from "@/lib/firebase"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = url.searchParams.get("reference")
  const orderId = url.searchParams.get("orderId")

  if (!reference || !orderId || !process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
  }

  try {
    const orderSnap = await getDoc(doc(db, "orders", orderId))
    if (!orderSnap.exists()) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    const order = orderSnap.data()

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
    })
    const payload = await response.json()
    const transaction = payload?.data
    const expectedAmount = Math.round(Number(order.amountPaid || 0) * 100)

    if (!response.ok || !payload.status || transaction?.status !== "success" || Number(transaction.amount) !== expectedAmount) {
      return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 })
    }

    await updateDoc(doc(db, "orders", orderId), {
      status: "payment_verified",
      paymentMethod: "paystack",
      paymentReference: reference,
      paidAt: serverTimestamp(),
    })

    await setDoc(doc(db, "transactions", `paystack_${reference}`), {
      userId: order.userId,
      type: "purchase",
      amount: Number(order.amountPaid || 0),
      description: `Paystack payment for order #${orderId}`,
      orderId,
      reference,
      createdAt: serverTimestamp(),
    }, { merge: true })

    return NextResponse.json({ verified: true })
  } catch {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 })
  }
}
