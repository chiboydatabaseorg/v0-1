"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  auth, db, doc, updateDoc, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential,
  collection, query, where, getDocs, orderBy,
} from "@/lib/firebase"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { toast } from "sonner"
import {
  User, Package, Wallet, Clock, Shield, Edit3, Save, Loader2, ChevronRight, Eye, EyeOff,
} from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [savingName, setSavingName] = useState(false)
  const [orderCount, setOrderCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    setNewName(user.fullName)
    const fetchCounts = async () => {
      try {
        const ordersQ = query(collection(db, "orders"), where("userId", "==", user.uid))
        const snap = await getDocs(ordersQ)
        setOrderCount(snap.size)
        const pending = snap.docs.filter((d) => {
          const s = d.data().status
          return s === "pending_payment" || s === "payment_submitted" || s === "payment_verified" || s === "approved"
        })
        setPendingCount(pending.length)
      } catch {}
    }
    fetchCounts()
  }, [user, authLoading, router])

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return
    setSavingName(true)
    try {
      await updateDoc(doc(db, "users", user.uid), { fullName: newName.trim() })
      await refreshUser()
      setEditingName(false)
      toast.success("Name updated!")
    } catch {
      toast.error("Failed to update name")
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both fields")
      return
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }
    setChangingPassword(true)
    try {
      const credential = EmailAuthProvider.credential(user!.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser!, credential)
      await updatePassword(auth.currentUser!, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setShowPasswordSection(false)
      toast.success("Password changed successfully!")
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        toast.error("Current password is incorrect")
      } else {
        toast.error("Failed to change password")
      }
    } finally {
      setChangingPassword(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-foreground">My Profile</h1>

        {/* User Info Card */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <button onClick={handleSaveName} disabled={savingName} className="rounded-md bg-primary p-1.5 text-primary-foreground">
                    {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { setEditingName(false); setNewName(user.fullName) }} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{user.fullName}</h2>
                  <button onClick={() => setEditingName(true)} className="rounded-md p-1 text-muted-foreground hover:text-primary">
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {"Member since "}{user.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <Package className="mb-2 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{orderCount}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <Clock className="mb-2 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending Orders</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <Wallet className="mb-2 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{"\u20A6"}{user.cashbackBalance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Cashback Balance</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <Wallet className="mb-2 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{"\u20A6"}{user.totalSpending.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Spending</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-6 flex flex-col gap-2">
          <Link href="/orders" className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">My Orders</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link href="/transactions" className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Transactions</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link href="/notifications" className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Notifications</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Security Settings</span>
            </div>
            <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${showPasswordSection ? "rotate-90" : ""}`} />
          </button>

          {showPasswordSection && (
            <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change Password"}
              </button>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
