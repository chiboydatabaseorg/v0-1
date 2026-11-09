import { NextResponse } from "next/server"
import { db, doc, getDoc, updateDoc, setDoc, addDoc, collection, serverTimestamp } from "@/lib/firebase"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = url.searchParams.get("reference")
  const orderId = url.searchParams.get("orderId")

  if (!reference || !orderId || !process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
  }

  try {
    const orderSnap = await getDoc(doc(db, "orders", orderId))
    const intentSnap = orderSnap.exists() ? null : await getDoc(doc(db, "payment_intents", orderId))
    if (!orderSnap.exists() && !intentSnap?.exists()) return NextResponse.json({ error: "Payment intent not found" }, { status: 404 })
    const paymentRecord = orderSnap.exists() ? orderSnap.data() : intentSnap?.data()
    if (!paymentRecord) return NextResponse.json({ error: "Payment record not found" }, { status: 404 })

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
    })
    const payload = await response.json()
    const transaction = payload?.data
    const expectedAmount = Math.round(Number(paymentRecord.amountPaid || 0) * 100)

    if (!response.ok || !payload.status || transaction?.status !== "success" || Number(transaction.amount) !== expectedAmount) {
      return NextResponse.json({ error: "Payment was unsuccessful. No order was placed." }, { status: 400 })
    }

    let finalOrderId = orderId
    if (intentSnap?.exists()) {
      const intent = intentSnap.data()
      if (intent.orderId) {
        finalOrderId = String(intent.orderId)
      } else {
      const created = await addDoc(collection(db, "orders"), {
        ...intent,
        status: "payment_verified",
        paymentMethod: "paystack",
        paymentReference: reference,
        paidAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
      finalOrderId = created.id
      await updateDoc(doc(db, "payment_intents", orderId), { status: "completed", orderId: created.id, paymentReference: reference, completedAt: serverTimestamp() })
      if (Number(intent.cashbackUsed || 0) > 0) {
        const userRef = doc(db, "users", intent.userId)
        const userSnap = await getDoc(userRef)
        const balance = Number(userSnap.data()?.cashbackBalance || 0)
        await updateDoc(userRef, { cashbackBalance: Math.max(0, balance - Number(intent.cashbackUsed)) })
      }
      }
    } else {
      await updateDoc(doc(db, "orders", orderId), { status: "payment_verified", paymentMethod: "paystack", paymentReference: reference, paidAt: serverTimestamp() })
    }

    await setDoc(doc(db, "transactions", `paystack_${reference}`), {
      userId: paymentRecord.userId,
      type: "purchase",
      amount: Number(paymentRecord.amountPaid || 0),
      description: `Paystack payment for order #${finalOrderId}`,
      orderId: finalOrderId,
      reference,
      createdAt: serverTimestamp(),
    }, { merge: true })

    return NextResponse.json({ verified: true, orderId: finalOrderId })
  } catch {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 })
  }
}
