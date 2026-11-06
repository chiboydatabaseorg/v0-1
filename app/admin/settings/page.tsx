"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db, doc, getDoc, setDoc } from "@/lib/firebase"
import { toast } from "sonner"
import { Cloud, CreditCard, Loader2, Save, ShieldCheck, Video } from "lucide-react"

interface IntegrationSettings {
  paystackEnabled: boolean
  manualPaymentEnabled: boolean
  cloudinaryCloudName: string
  cloudinaryUploadPreset: string
  muxPlaybackDomain: string
  deliveryFee: number
  supportWhatsapp: string
}

const defaults: IntegrationSettings = {
  paystackEnabled: true,
  manualPaymentEnabled: true,
  cloudinaryCloudName: "",
  cloudinaryUploadPreset: "",
  muxPlaybackDomain: "",
  deliveryFee: 0,
  supportWhatsapp: "",
}

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getDoc(doc(db, "settings", "integrations")).then((snapshot) => {
      if (snapshot.exists()) setSettings({ ...defaults, ...snapshot.data() } as IntegrationSettings)
      setLoading(false)
    }).catch(() => {
      toast.error("Could not load store settings")
      setLoading(false)
    })
  }, [])

  const update = <K extends keyof IntegrationSettings>(key: K, value: IntegrationSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const save = async () => {
    if (user?.role !== "admin") return
    setSaving(true)
    try {
      await setDoc(doc(db, "settings", "integrations"), { ...settings, updatedAt: new Date() }, { merge: true })
      toast.success("Store settings saved")
    } catch {
      toast.error("Could not save store settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Control centre</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Store settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Configure which providers are active and the public settings used by your storefront.</p>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
        <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><p><strong>Secrets stay protected.</strong> Paystack secret keys, Cloudinary API secrets, Mux tokens, and email credentials must remain in Vercel environment variables. This panel only stores safe public configuration.</p></div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3"><CreditCard className="h-5 w-5 text-primary" /><div><h2 className="font-semibold text-foreground">Payments</h2><p className="text-xs text-muted-foreground">Choose the payment methods customers can use.</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[['paystackEnabled', 'Paystack checkout', 'Accept verified online payments'], ['manualPaymentEnabled', 'Manual transfer', 'Accept proof of bank transfer']].map(([key, label, hint]) => (
            <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4 hover:bg-accent/50">
              <span><span className="block text-sm font-medium text-foreground">{label}</span><span className="text-xs text-muted-foreground">{hint}</span></span>
              <input type="checkbox" checked={settings[key as keyof IntegrationSettings] as boolean} onChange={(e) => update(key as keyof IntegrationSettings, e.target.checked as never)} className="h-4 w-4 accent-primary" />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3"><Cloud className="h-5 w-5 text-primary" /><div><h2 className="font-semibold text-foreground">Cloudinary media</h2><p className="text-xs text-muted-foreground">Use Cloudinary for product images and short videos.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground">Cloud name<input value={settings.cloudinaryCloudName} onChange={(e) => update("cloudinaryCloudName", e.target.value)} placeholder="your-cloud-name" className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" /></label>
          <label className="text-sm font-medium text-foreground">Unsigned upload preset<input value={settings.cloudinaryUploadPreset} onChange={(e) => update("cloudinaryUploadPreset", e.target.value)} placeholder="product_uploads" className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" /></label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3"><Video className="h-5 w-5 text-primary" /><div><h2 className="font-semibold text-foreground">Video and delivery</h2><p className="text-xs text-muted-foreground">Add Mux playback settings and delivery defaults.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground">Mux playback domain<input value={settings.muxPlaybackDomain} onChange={(e) => update("muxPlaybackDomain", e.target.value)} placeholder="stream.mux.com" className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" /></label>
          <label className="text-sm font-medium text-foreground">Default delivery fee (₦)<input type="number" min="0" value={settings.deliveryFee} onChange={(e) => update("deliveryFee", Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" /></label>
          <label className="text-sm font-medium text-foreground sm:col-span-2">Support WhatsApp number<input value={settings.supportWhatsapp} onChange={(e) => update("supportWhatsapp", e.target.value)} placeholder="2348012345678" className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" /></label>
        </div>
      </section>

      <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save settings"}</button>
    </div>
  )
}
