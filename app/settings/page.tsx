"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, ChevronLeft, Loader2, LogOut, Mail, ShieldCheck, Smartphone } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { auth, db, doc, updateDoc, signOut } from "@/lib/firebase"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [orderAlerts, setOrderAlerts] = useState(true)

  useEffect(() => { if (!loading && !user) router.push("/login") }, [loading, router, user])
  if (loading || !user) return <div className="min-h-screen bg-background" />

  const savePreferences = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, "users", user.uid), { emailUpdates, orderAlerts })
      toast.success("Preferences saved")
    } catch { toast.error("Could not save preferences") } finally { setSaving(false) }
  }

  const logout = async () => { await signOut(auth); router.push("/") }
  return <div className="flex min-h-screen flex-col bg-muted/30"><SiteHeader /><main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:py-12"><Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Account dashboard</Link><div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Account controls</p><h1 className="text-3xl font-bold tracking-tight text-foreground">Preferences & security</h1><p className="mt-2 text-sm text-muted-foreground">Choose how CHISTORE NG keeps you informed and protects your account.</p></div><div className="space-y-4"><section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Bell className="h-5 w-5 text-primary" /></div><div><h2 className="font-semibold text-foreground">Notifications</h2><p className="text-sm text-muted-foreground">Stay updated about your shopping activity.</p></div></div><div className="space-y-4"><label className="flex items-center justify-between gap-4"><span className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span><span className="block text-sm font-medium text-foreground">Store updates</span><span className="block text-xs text-muted-foreground">New arrivals and exclusive offers</span></span></span><input aria-label="Store updates" type="checkbox" checked={emailUpdates} onChange={(e) => setEmailUpdates(e.target.checked)} className="h-4 w-4 accent-primary" /></label><label className="flex items-center justify-between gap-4"><span className="flex items-center gap-3"><Smartphone className="h-4 w-4 text-muted-foreground" /><span><span className="block text-sm font-medium text-foreground">Order alerts</span><span className="block text-xs text-muted-foreground">Payment, shipping and delivery updates</span></span></span><input aria-label="Order alerts" type="checkbox" checked={orderAlerts} onChange={(e) => setOrderAlerts(e.target.checked)} className="h-4 w-4 accent-primary" /></label></div><button onClick={savePreferences} disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save preferences</button></section><section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><ShieldCheck className="h-5 w-5 text-primary" /></div><div className="flex-1"><h2 className="font-semibold text-foreground">Account security</h2><p className="mt-1 text-sm text-muted-foreground">Manage your password and personal information from your profile.</p><Link href="/profile" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Open profile security <span aria-hidden="true">→</span></Link></div></div></section><section className="rounded-2xl border border-destructive/20 bg-card p-5 shadow-sm sm:p-6"><button onClick={logout} className="inline-flex items-center gap-2 text-sm font-semibold text-destructive hover:underline"><LogOut className="h-4 w-4" /> Sign out of this account</button></section></div></main><SiteFooter /></div>
}
