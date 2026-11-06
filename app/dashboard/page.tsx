"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, ChevronRight, Clock3, Heart, Package, Settings2, ShoppingBag, Wallet } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { collection, db, getDocs, query, where } from "@/lib/firebase"
import type { Order } from "@/lib/types"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const statusCopy: Record<string, string> = {
  pending_payment: "Payment pending",
  payment_submitted: "Under review",
  payment_verified: "Payment verified",
  approved: "Preparing order",
  shipped: "On the way",
  delivered: "Delivered",
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (loading) return
    if (!user) { router.push("/login"); return }
    getDocs(query(collection(db, "orders"), where("userId", "==", user.uid)))
      .then((snap) => setOrders(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Order).slice(0, 3)))
      .catch(() => setOrders([]))
  }, [loading, router, user])

  if (loading || !user) return <div className="min-h-screen bg-background" />

  const firstName = user.fullName?.split(" ")[0] || "there"
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Your account</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Welcome back, {firstName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Keep track of your orders, rewards and account preferences.</p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">Continue shopping <ArrowUpRight className="h-4 w-4" /></Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Orders placed", value: orders.length, icon: ShoppingBag },
            { label: "Pending orders", value: orders.filter((item) => !["delivered", "rejected"].includes(item.status)).length, icon: Clock3 },
            { label: "Cashback balance", value: `₦${user.cashbackBalance.toLocaleString()}`, icon: Wallet },
            { label: "Total spent", value: `₦${user.totalSpending.toLocaleString()}`, icon: Package },
          ].map((stat) => <div key={stat.label} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><stat.icon className="mb-6 h-5 w-5 text-primary" /><p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p><p className="mt-1 text-sm text-muted-foreground">{stat.label}</p></div>)}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-foreground">Recent orders</h2><p className="mt-1 text-sm text-muted-foreground">Your latest CHISTORE activity</p></div><Link href="/orders" className="text-sm font-semibold text-primary hover:underline">View all</Link></div>
            {orders.length ? <div className="divide-y divide-border">{orders.map((order) => <Link key={order.id} href={`/payment/${order.id}`} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Package className="h-4 w-4 text-primary" /></div><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">Order #{order.id.slice(0, 8)}</p><p className="mt-1 text-xs text-muted-foreground">{order.items.length} item{order.items.length === 1 ? "" : "s"}</p></div></div><div className="text-right"><p className="text-sm font-semibold text-foreground">₦{order.totalAmount.toLocaleString()}</p><p className="mt-1 text-xs text-primary">{statusCopy[order.status] || order.status}</p></div></Link>)}</div> : <div className="rounded-xl bg-muted/60 px-5 py-10 text-center"><ShoppingBag className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-sm font-medium text-foreground">Your order history will appear here</p><Link href="/" className="mt-3 inline-block text-sm font-semibold text-primary">Explore the store</Link></div>}
          </section>
          <section className="space-y-3">
            {[{ href: "/profile", label: "Profile details", note: "Update your personal information", icon: Settings2 }, { href: "/orders", label: "Order history", note: "Track every purchase", icon: Package }, { href: "/transactions", label: "Wallet & rewards", note: "Review your cashback activity", icon: Wallet }, { href: "/settings", label: "Preferences", note: "Manage notifications and security", icon: Heart }].map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><item.icon className="h-4 w-4 text-primary" /></div><div className="flex-1"><p className="text-sm font-semibold text-foreground">{item.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.note}</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>)}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
