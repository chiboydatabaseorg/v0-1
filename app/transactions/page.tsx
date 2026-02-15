"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db, collection, query, where, getDocs, orderBy } from "@/lib/firebase"
import type { Transaction } from "@/lib/types"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Loader2, ArrowUpRight, ArrowDownLeft, ArrowLeft, Wallet } from "lucide-react"

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    const fetch = async () => {
      try {
        const q = query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
        const snap = await getDocs(q)
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction))
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
        <h1 className="mb-6 text-2xl font-bold text-foreground">Transactions</h1>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Wallet className="mb-3 h-12 w-12" />
            <p className="text-lg font-medium">No transactions yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  t.type === "cashback_credit" ? "bg-green-100" : t.type === "cashback_debit" ? "bg-red-100" : "bg-blue-100"
                }`}>
                  {t.type === "cashback_credit" ? (
                    <ArrowDownLeft className="h-5 w-5 text-green-700" />
                  ) : (
                    <ArrowUpRight className={`h-5 w-5 ${t.type === "cashback_debit" ? "text-red-700" : "text-blue-700"}`} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.createdAt?.toDate ? new Date(t.createdAt.toDate()).toLocaleString() : ""}
                  </p>
                </div>
                <span className={`text-sm font-bold ${
                  t.type === "cashback_credit" ? "text-green-700" : "text-foreground"
                }`}>
                  {t.type === "cashback_credit" ? "+" : "-"}{"\u20A6"}{t.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
