"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db, collection, query, where, getDocs, orderBy } from "@/lib/firebase"
import type { Order } from "@/lib/types"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Loader2, Package, ArrowLeft } from "lucide-react"
import Link from "next/link"

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Pending Payment", color: "bg-yellow-100 text-yellow-800" },
  payment_submitted: { label: "Payment Submitted", color: "bg-blue-100 text-blue-800" },
  payment_verified: { label: "Payment Verified", color: "bg-indigo-100 text-indigo-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-800" },
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    const fetch = async () => {
      try {
        const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
        const snap = await getDocs(q)
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order))
      } catch {}
      setLoading(false)
    }
    fetch()
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <button onClick={() => router.push("/profile")} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </button>
        <h1 className="mb-6 text-2xl font-bold text-foreground">My Orders</h1>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Package className="mb-3 h-12 w-12" />
            <p className="text-lg font-medium">No orders yet</p>
            <Link href="/" className="mt-4 text-primary hover:underline">Start shopping</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const st = statusLabels[order.status] || { label: order.status, color: "bg-muted text-foreground" }
              return (
                <div key={order.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{"Order #"}{order.id.slice(0, 8)}</p>
                      <p className="text-sm font-medium text-foreground">
                        {order.items.length}{" item"}{order.items.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${st.color}`}>{st.label}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                        {item.productImage && (
                          <img src={item.productImage || "/placeholder.svg"} alt={item.productName} className="h-8 w-8 rounded object-cover" />
                        )}
                        <span className="text-xs text-foreground">{item.productName}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-base font-bold text-primary">{"\u20A6"}{order.totalAmount.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ""}
                    </p>
                  </div>

                  {order.status === "pending_payment" && (
                    <Link
                      href={`/payment/${order.id}`}
                      className="mt-3 block w-full rounded-lg bg-primary py-2 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Complete Payment
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
