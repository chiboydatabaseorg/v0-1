"use client"

import { useEffect, useMemo, useState } from "react"
import { db, collection, onSnapshot } from "@/lib/firebase"
import { Users, Package, CreditCard, Truck, Loader2, ArrowUpRight, Clock3, ShoppingBag, TrendingUp } from "lucide-react"
import Link from "next/link"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Order = { createdAt?: { toDate?: () => Date } | Date; status?: string; totalAmount?: number }

const confirmedStatuses = new Set(["payment_verified", "approved", "processing", "shipped", "delivered"])
const pendingStatuses = new Set(["pending_payment", "payment_submitted", "payment_verified", "approved", "processing"])

function toDate(value: Order["createdAt"]) {
  if (!value) return null
  if (value instanceof Date) return value
  return typeof value.toDate === "function" ? value.toDate() : null
}

export default function AdminDashboard() {
  const [usersCount, setUsersCount] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => setUsersCount(snapshot.size))
    const unsubscribeOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      setOrders(snapshot.docs.map((item) => item.data() as Order))
      setLoading(false)
    }, () => setLoading(false))
    return () => { unsubscribeUsers(); unsubscribeOrders() }
  }, [])

  const stats = useMemo(() => ({
    totalUsers: usersCount,
    totalOrders: orders.length,
    pendingOrders: orders.filter((order) => pendingStatuses.has(order.status ?? "")).length,
    totalPurchaseAmount: orders.filter((order) => confirmedStatuses.has(order.status ?? "")).reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
  }), [orders, usersCount])

  const chartData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today)
      day.setHours(0, 0, 0, 0)
      day.setDate(today.getDate() - (6 - index))
      const nextDay = new Date(day)
      nextDay.setDate(day.getDate() + 1)
      const dayOrders = orders.filter((order) => {
        const created = toDate(order.createdAt)
        return created && created >= day && created < nextDay
      })
      return {
        day: day.toLocaleDateString("en-NG", { weekday: "short" }),
        orders: dayOrders.length,
        revenue: dayOrders.filter((order) => confirmedStatuses.has(order.status ?? "")).reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
      }
    })
  }, [orders])

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
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/60">Operations overview</p><h1 className="text-3xl font-bold tracking-tight">Good morning, Admin</h1><p className="mt-2 max-w-xl text-sm text-background/65">Manage your store, orders, customers, and product catalog from one focused workspace.</p></div>
        <Link href="/admin/products" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Add a product <ArrowUpRight className="h-4 w-4" /></Link>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></div><p className="mt-5 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></article>)}</section>
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-semibold">Revenue & order activity</h2><p className="mt-1 text-sm text-muted-foreground">Live performance over the last seven days</p></div><TrendingUp className="h-5 w-5 text-primary" /></div><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(value, name) => [name === "revenue" ? `₦${Number(value).toLocaleString()}` : value, name === "revenue" ? "Revenue" : "Orders"]} /><Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div></div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><h2 className="font-semibold">Quick actions</h2><p className="mt-1 text-sm text-muted-foreground">Jump into daily operations</p><div className="mt-5 grid gap-3">{[["/admin/orders", "Review orders", Package], ["/admin/products", "Manage catalog", ShoppingBag], ["/admin/shipments", "Track shipments", Truck], ["/admin/users", "View customers", Users]].map(([href, label, Icon]) => <Link key={String(href)} href={String(href)} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm font-medium transition hover:border-primary/40 hover:bg-accent"><span className="rounded-lg bg-muted p-2 text-primary"><Icon className="h-4 w-4" /></span>{String(label)}<ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link>)}</div></div>
      </section>
    </div>
  )
}
