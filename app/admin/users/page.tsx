"use client"

import { useEffect, useState } from "react"
import { db, collection, getDocs, doc, updateDoc, query, where } from "@/lib/firebase"
import { auth, sendPasswordResetEmail } from "@/lib/firebase"
import type { UserProfile } from "@/lib/types"
import { Loader2, Mail, Edit3, Eye, X, Plus, Minus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [cashbackAdjust, setCashbackAdjust] = useState(0)
  const [adjusting, setAdjusting] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"))
        const usrs = snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)
        setUsers(usrs)
      } catch {}
      setLoading(false)
    }
    fetchUsers()
  }, [])

  const handleSendReset = async (email: string) => {
    if (!confirm(`Send a password reset link to ${email}?`)) return
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success(`Reset link sent to ${email}`)
    } catch {
      toast.error("Failed to send reset link")
    }
  }

  const handleAdjustCashback = async () => {
    if (!editingUser || cashbackAdjust === 0) return
    setAdjusting(true)
    try {
      const newBalance = Math.max(0, editingUser.cashbackBalance + cashbackAdjust)
      await updateDoc(doc(db, "users", editingUser.uid), { cashbackBalance: newBalance })
      setUsers((prev) =>
        prev.map((u) => u.uid === editingUser.uid ? { ...u, cashbackBalance: newBalance } : u)
      )
      setEditingUser(null)
      setCashbackAdjust(0)
      toast.success("Cashback updated!")
    } catch {
      toast.error("Failed to update cashback")
    } finally {
      setAdjusting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Total Users ({users.length})</h1>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium text-foreground">Email</th>
              <th className="px-4 py-3 font-medium text-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-foreground">Orders</th>
              <th className="px-4 py-3 font-medium text-foreground">Profile</th>
              <th className="px-4 py-3 font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{u.email}</td>
                <td className="px-4 py-3 text-foreground">{u.fullName}</td>
                <td className="px-4 py-3 text-foreground">{u.totalOrders}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${u.uid}`}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingUser(u); setCashbackAdjust(0) }}
                      className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleSendReset(u.email)}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setEditingUser(null)}>
          <div className="animate-fadeIn w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Edit Cashback</h3>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-2 text-sm text-muted-foreground">{editingUser.fullName} ({editingUser.email})</p>
            <p className="mb-4 text-sm text-foreground">
              {"Current balance: "}{"\u20A6"}{editingUser.cashbackBalance.toLocaleString()}
            </p>
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => setCashbackAdjust((p) => p - 100)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={cashbackAdjust}
                onChange={(e) => setCashbackAdjust(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-center text-sm text-foreground outline-none focus:border-primary"
              />
              <button
                onClick={() => setCashbackAdjust((p) => p + 100)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              {"New balance will be: \u20A6"}{Math.max(0, editingUser.cashbackBalance + cashbackAdjust).toLocaleString()}
            </p>
            <button
              onClick={handleAdjustCashback}
              disabled={adjusting || cashbackAdjust === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {adjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Cashback"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
