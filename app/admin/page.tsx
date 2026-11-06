"use client"

import { useEffect, useState } from "react"
import { db, collection, getDocs } from "@/lib/firebase"
import { Users, Package, CreditCard, Truck, Loader2, ArrowUpRight, Clock3, ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, pendingOrders: 0, totalPurchaseAmount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "orders")),
        ])
        let pendingOrders = 0
        let totalPurchaseAmount = 0
        ordersSnap.docs.forEach((item) => {
          const data = item.data()
          if (["pending_payment", "payment_submitted", "payment_verified", "approved"].includes(data.status)) pendingOrders++
          if (["payment_verified", "approved", "shipped", "delivered"].includes(data.status)) totalPurchaseAmount += Number(data.totalAmount || 0)
        })
        setStats({ totalUsers: usersSnap.size, totalOrders: ordersSnap.size, pendingOrders, totalPurchaseAmount })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>

  const cards = [
    { label: "Total revenue", value: `₦${stats.totalPurchaseAmount.toLocaleString()}`, note: "Confirmed purchases", icon: CreditCard, tone: "bg-primary/10 text-primary" },
    { label: "Total orders", value: stats.totalOrders, note: "Across all customers", icon: Package, tone: "bg-blue-500/10 text-blue-600" },
    { label: "Needs attention", value: stats.pendingOrders, note: "Orders in progress", icon: Clock3, tone: "bg-amber-500/10 text-amber-600" },
    { label: "Customers", value: stats.totalUsers, note: "Registered accounts", icon: Users, tone: "bg-emerald-500/10 text-emerald-600" },
  ]

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-gradient-to-br from-foreground to-foreground/85 p-6 text-background shadow-xl sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/60">Operations overview</p>
          <h1 className="text-3xl font-bold tracking-tight">Good morning, Admin</h1>
          <p className="mt-2 max-w-xl text-sm text-background/65">Manage your store, orders, customers, and product catalog from one focused workspace.</p>
        </div>
        <Link href="/admin/products" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
          Add a product <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></div>
            <p className="mt-5 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between"><div><h2 className="font-semibold">Store activity</h2><p className="mt-1 text-sm text-muted-foreground">Your key numbers at a glance</p></div><ShoppingBag className="h-5 w-5 text-primary" /></div>
          <div className="flex h-44 items-end gap-3 rounded-xl bg-muted/50 p-5">{[35, 54, 43, 68, 52, 78, 92, 70, 86, 100, 82, 96].map((height, index) => <div key={index} className="group flex flex-1 flex-col justify-end gap-2"><div className="w-full rounded-t-md bg-primary/80 transition group-hover:bg-primary" style={{ height: `${height}%` }} /><span className="text-center text-[10px] text-muted-foreground">{index + 1}</span></div>)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><h2 className="font-semibold">Quick actions</h2><p className="mt-1 text-sm text-muted-foreground">Jump into daily operations</p><div className="mt-5 grid gap-3">{[["/admin/orders", "Review orders", Package], ["/admin/products", "Manage catalog", ShoppingBag], ["/admin/shipments", "Track shipments", Truck], ["/admin/users", "View customers", Users]].map(([href, label, Icon]) => <Link key={String(href)} href={String(href)} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm font-medium transition hover:border-primary/40 hover:bg-accent"><span className="rounded-lg bg-muted p-2 text-primary"><Icon className="h-4 w-4" /></span>{String(label)}<ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link>)}</div></div>
      </section>
    </div>
  )
}
