import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { addDoc, collection, db, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "@/lib/firebase"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature")
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!signature || !secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const digest = createHmac("sha512", secret).update(rawBody).digest("hex")
  const valid = signature.length === digest.length && timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 })

  const event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string; amount?: number; status?: string; metadata?: { orderId?: string } } }
  if (event.event !== "charge.success" || !event.data?.reference || !event.data.metadata?.orderId) return NextResponse.json({ received: true })

  const reference = event.data.reference
  const recordId = event.data.metadata.orderId
  const orderRef = doc(db, "orders", recordId)
  const intentRef = doc(db, "payment_intents", recordId)
  const orderSnap = await getDoc(orderRef)
  const intentSnap = orderSnap.exists() ? null : await getDoc(intentRef)
  const record = orderSnap.exists() ? orderSnap.data() : intentSnap?.data()
  if (!record) return NextResponse.json({ error: "Payment record not found" }, { status: 404 })

  const expectedAmount = Math.round(Number(record.amountPaid || 0) * 100)
  if (event.data.amount !== expectedAmount || event.data.status !== "success") return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 })

  let finalOrderId = recordId
  if (intentSnap?.exists() && intentSnap.data().orderId) {
    finalOrderId = String(intentSnap.data().orderId)
  } else if (intentSnap?.exists()) {
    const created = await addDoc(collection(db, "orders"), { ...record, status: "payment_verified", paymentMethod: "paystack", paymentReference: reference, paidAt: serverTimestamp(), createdAt: serverTimestamp() })
    finalOrderId = created.id
    await updateDoc(intentRef, { status: "completed", orderId: finalOrderId, paymentReference: reference, completedAt: serverTimestamp() })
  } else if (orderSnap.exists()) {
    await updateDoc(orderRef, { status: "payment_verified", paymentReference: reference, paidAt: serverTimestamp() })
  }

  await setDoc(doc(db, "transactions", `paystack_${reference}`), { userId: record.userId, type: "purchase", amount: Number(record.amountPaid || 0), description: `Paystack payment for order #${finalOrderId}`, orderId: finalOrderId, reference, createdAt: serverTimestamp() }, { merge: true })
  return NextResponse.json({ received: true, orderId: finalOrderId })
}
