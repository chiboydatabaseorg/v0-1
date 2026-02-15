"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db, collection, query, getDocs, orderBy, updateDoc, doc } from "@/lib/firebase"
import type { Notification } from "@/lib/types"
import { WHATSAPP_LINK } from "@/lib/types"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Loader2, Bell, ArrowLeft, CheckCheck, MessageCircle } from "lucide-react"

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    const fetch = async () => {
      try {
        const q = query(collection(db, "users", user.uid, "notifications"), orderBy("createdAt", "desc"))
        const snap = await getDocs(q)
        const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Notification)
        setNotifications(notifs)

        // Mark all as read
        const unread = snap.docs.filter((d) => !d.data().read)
        await Promise.all(unread.map((d) => updateDoc(doc(db, "users", user.uid, "notifications", d.id), { read: true })))
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
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Notifications</h1>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bell className="mb-3 h-12 w-12" />
            <p className="text-lg font-medium">No notifications</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border p-4 shadow-sm ${
                  !n.read ? "border-primary/30 bg-accent" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                    <Bell className={`h-4 w-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{n.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{n.message}</p>
                    {n.whatsappLink && (
                      <a
                        href={n.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-200"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Contact on WhatsApp
                      </a>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleString() : ""}
                    </p>
                  </div>
                  {!n.read && <CheckCheck className="h-4 w-4 text-primary" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
