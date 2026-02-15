"use client"

import { useEffect, useState } from "react"
import { db, collection, getDocs, query, where } from "@/lib/firebase"
import { Users, Package, CreditCard, Truck, Loader2 } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, pendingOrders: 0, totalPurchaseAmount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"))
        const ordersSnap = await getDocs(collection(db, "orders"))

        let pendingOrders = 0
        let totalPurchaseAmount = 0

        ordersSnap.docs.forEach((d) => {
          const data = d.data()
          if (["pending_payment", "payment_submitted", "payment_verified", "approved"].includes(data.status)) {
            pendingOrders++
          }
          if (["payment_verified", "approved", "shipped", "delivered"].includes(data.status)) {
            totalPurchaseAmount += data.totalAmount || 0
          }
        })

        setStats({
          totalUsers: usersSnap.size,
          totalOrders: ordersSnap.size,
          pendingOrders,
          totalPurchaseAmount,
        })
      } catch {}
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <Users className="mb-3 h-6 w-6 text-primary" />
          <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <Package className="mb-3 h-6 w-6 text-primary" />
          <p className="text-3xl font-bold text-foreground">{stats.totalOrders}</p>
          <p className="text-sm text-muted-foreground">Total Orders</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <Truck className="mb-3 h-6 w-6 text-primary" />
          <p className="text-3xl font-bold text-foreground">{stats.pendingOrders}</p>
          <p className="text-sm text-muted-foreground">Pending Orders</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <CreditCard className="mb-3 h-6 w-6 text-primary" />
          <p className="text-3xl font-bold text-foreground">{"\u20A6"}{stats.totalPurchaseAmount.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total Purchases</p>
        </div>
      </div>
    </div>
  )
}
