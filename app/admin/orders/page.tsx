"use client"

import { useEffect, useState } from "react"
import { db, collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from "@/lib/firebase"
import type { Order } from "@/lib/types"
import { WHATSAPP_LINK } from "@/lib/types"
import { Loader2, Eye, Check, X, CreditCard, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [rejectingOrder, setRejectingOrder] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snap) => {
      const ords = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
      const priority: Record<string, number> = { payment_submitted: 0, payment_verified: 1, pending_payment: 2, approved: 3, shipped: 4, delivered: 5, rejected: 6 }
      ords.sort((a, b) => (priority[a.status] ?? 99) - (priority[b.status] ?? 99))
      setOrders(ords)
      setLoading(false)
    }, () => {
      toast.error("Failed to load orders")
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const handleApproveOrder = async (order: Order) => {
    if (!confirm("Approve this order?")) return
    setProcessing(order.id)
    try {
      await updateDoc(doc(db, "orders", order.id), { status: "approved" })

      await addDoc(collection(db, "users", order.userId, "notifications"), {
        userId: order.userId,
        title: "Order Approved",
        message: `Your order #${order.id} has been approved and will be delivered soon. If you have any issues, please contact us on WhatsApp.`,
        read: false,
        createdAt: serverTimestamp(),
        whatsappLink: WHATSAPP_LINK,
      })

      // Update user pending orders count
      const userDoc = await getDoc(doc(db, "users", order.userId))
      if (userDoc.exists()) {
        const data = userDoc.data()
        await updateDoc(doc(db, "users", order.userId), {
          totalOrders: (data.totalOrders || 0) + 1,
        })
      }

      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "approved" } : o))
      toast.success("Order approved!")
    } catch {
      toast.error("Failed to approve order")
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectOrder = async (order: Order) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }
    if (!confirm("Are you sure you want to reject this order? The payment will be refunded to the user's cashback balance.")) return
    setProcessing(order.id)
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "rejected",
        rejectionReason: rejectionReason,
      })

      // Credit the total amount to user cashback
      const userDoc = await getDoc(doc(db, "users", order.userId))
      if (userDoc.exists()) {
        const data = userDoc.data()
        await updateDoc(doc(db, "users", order.userId), {
          cashbackBalance: (data.cashbackBalance || 0) + order.totalAmount,
        })
      }

      // Add cashback transaction
      await addDoc(collection(db, "transactions"), {
        userId: order.userId,
        type: "cashback_credit",
        amount: order.totalAmount,
        description: `Refund for rejected order #${order.id}`,
        orderId: order.id,
        createdAt: serverTimestamp(),
      })

      // Notify user
      await addDoc(collection(db, "users", order.userId, "notifications"), {
        userId: order.userId,
        title: "Order Rejected",
        message: `Your order request #${order.id} has been rejected and \u20A6${order.totalAmount.toLocaleString()} has been credited to your cashback balance. The order was rejected because: "${rejectionReason}". If you feel that there was an error please contact admin.`,
        read: false,
        createdAt: serverTimestamp(),
        whatsappLink: WHATSAPP_LINK,
      })

      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "rejected", rejectionReason } : o))
      setRejectingOrder(null)
      setRejectionReason("")
      toast.success("Order rejected and cashback credited")
    } catch {
      toast.error("Failed to reject order")
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending_payment: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending Payment" },
      payment_submitted: { bg: "bg-blue-50", text: "text-blue-700", label: "Payment Submitted" },
      payment_verified: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Payment Verified" },
      approved: { bg: "bg-green-50", text: "text-green-700", label: "Approved" },
      rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
      shipped: { bg: "bg-purple-50", text: "text-purple-700", label: "Shipped" },
      delivered: { bg: "bg-teal-50", text: "text-teal-700", label: "Delivered" },
    }
    const s = map[status] || { bg: "bg-muted", text: "text-muted-foreground", label: status }
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Order List ({orders.length})</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">#{order.id.slice(0, 8)}</p>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{order.userEmail} - {order.userName}</p>
                  <p className="text-sm font-bold text-primary">{"\u20A6"}{order.totalAmount.toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                    {expandedOrder === order.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {(order.status === "pending_payment" || order.status === "payment_submitted") && (
                    <Link
                      href="/admin/payments"
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Verify Payment
                    </Link>
                  )}

                  {order.status === "payment_verified" && (
                    <>
                      <button
                        onClick={() => handleApproveOrder(order)}
                        disabled={processing === order.id}
                        className="inline-flex items-center gap-1 rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        {processing === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingOrder(order.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="animate-fadeIn border-t border-border p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">Items</h4>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="mb-2 flex items-center gap-2 rounded-lg border border-border p-2">
                          {item.productImage && (
                            <img src={item.productImage || "/placeholder.svg"} alt={item.productName} className="h-10 w-10 rounded-md object-cover" />
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity} - {"\u20A6"}{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">Shipping</h4>
                      <div className="rounded-lg bg-accent p-3 text-xs">
                        <p><strong>Address:</strong> {order.shipmentDetails.address}, {order.shipmentDetails.state}</p>
                        <p><strong>Phone:</strong> {order.shipmentDetails.phone}</p>
                        <p><strong>Alt Phone:</strong> {order.shipmentDetails.alternativePhone}</p>
                        {order.shipmentDetails.landmarks && <p><strong>Landmarks:</strong> {order.shipmentDetails.landmarks}</p>}
                        <p className="mt-2"><strong>Payment:</strong> {order.paymentMethod}</p>
                        {order.cashbackUsed > 0 && <p><strong>Cashback Used:</strong> {"\u20A6"}{order.cashbackUsed.toLocaleString()}</p>}
                        <p><strong>Amount Paid:</strong> {"\u20A6"}{order.amountPaid.toLocaleString()}</p>
                      </div>
                      {order.rejectionReason && (
                        <div className="mt-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                          <strong>Rejection Reason:</strong> {order.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {rejectingOrder === order.id && (
                <div className="animate-fadeIn border-t border-border p-4">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Rejection Reason</h4>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Why are you rejecting this order?"
                    rows={3}
                    className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectOrder(order)}
                      disabled={processing === order.id}
                      className="inline-flex items-center gap-1 rounded-md bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                    >
                      {processing === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Rejection"}
                    </button>
                    <button
                      onClick={() => { setRejectingOrder(null); setRejectionReason("") }}
                      className="rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
