"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "@/lib/firebase"
import { Plus, Trash2, Tag, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Promo { id: string; code: string; discountPercent: number; active: boolean; expiresAt?: string }

export default function AdminPromosPage() {
  const { user } = useAuth()
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ code: "", discountPercent: 10, expiresAt: "" })

  useEffect(() => onSnapshot(collection(db, "promos"), (snap) => {
    setPromos(snap.docs.map((item) => ({ id: item.id, ...item.data() } as Promo)))
    setLoading(false)
  }, () => { toast.error("Could not load promo codes"); setLoading(false) }), [])

  const addPromo = async () => {
    if (user?.role !== "admin") return
    const code = form.code.trim().toUpperCase()
    if (!code || form.discountPercent <= 0 || form.discountPercent > 100) { toast.error("Enter a valid code and discount"); return }
    try {
      await addDoc(collection(db, "promos"), { code, discountPercent: form.discountPercent, expiresAt: form.expiresAt || null, active: true, createdAt: serverTimestamp() })
      setForm({ code: "", discountPercent: 10, expiresAt: "" })
      toast.success("Promo code created")
    } catch { toast.error("Could not create promo code") }
  }

  const togglePromo = async (promo: Promo) => { await updateDoc(doc(db, "promos", promo.id), { active: !promo.active }) }
  const removePromo = async (promo: Promo) => { await deleteDoc(doc(db, "promos", promo.id)); toast.success("Promo removed") }

  return <div className="mx-auto max-w-5xl space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Growth tools</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Vouchers & promos</h1><p className="mt-2 text-sm text-muted-foreground">Create discounts customers can apply at checkout.</p></div>
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3"><Tag className="h-5 w-5 text-primary" /><div><h2 className="font-semibold text-foreground">Create a promo</h2><p className="text-xs text-muted-foreground">Discounts are calculated server-side again before payment.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-[1.2fr_0.7fr_1fr_auto] sm:items-end">
        <label className="text-sm font-medium text-foreground">Code<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WELCOME10" className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 uppercase" /></label>
        <label className="text-sm font-medium text-foreground">Discount %<input type="number" min="1" max="100" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5" /></label>
        <label className="text-sm font-medium text-foreground">Expires<input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5" /></label>
        <button onClick={addPromo} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Add</button>
      </div>
    </section>
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {loading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : promos.length === 0 ? <p className="p-8 text-sm text-muted-foreground">No promo codes yet.</p> : <div className="divide-y divide-border">{promos.map((promo) => <div key={promo.id} className="flex flex-wrap items-center justify-between gap-4 p-4"><div><p className="font-semibold tracking-wide text-foreground">{promo.code}</p><p className="text-sm text-muted-foreground">{promo.discountPercent}% off{promo.expiresAt ? ` · expires ${promo.expiresAt}` : " · no expiry"}</p></div><div className="flex items-center gap-2"><button onClick={() => togglePromo(promo)} className={`rounded-full px-3 py-1 text-xs font-semibold ${promo.active ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{promo.active ? "Active" : "Paused"}</button><button onClick={() => removePromo(promo)} aria-label={`Delete ${promo.code}`} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>}
    </section>
  </div>
}
