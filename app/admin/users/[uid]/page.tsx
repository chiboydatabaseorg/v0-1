"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { db, doc, getDoc, collection, getDocs, query, where } from "@/lib/firebase"
import type { UserProfile, Order, Product } from "@/lib/types"
import { Loader2, ArrowLeft, User, Package, CreditCard, Heart, Calendar, Shield } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [likedProducts, setLikedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!params.uid) return
      try {
        const uid = params.uid as string
        const userDoc = await getDoc(doc(db, "users", uid))
        if (!userDoc.exists()) {
          toast.error("User not found")
          router.push("/admin/users")
          return
        }

        const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile
        setUserProfile(userData)

        // Fetch user orders
        const ordersSnap = await getDocs(query(collection(db, "orders"), where("userId", "==", uid)))
        setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order))

        // Fetch liked products
        if (userData.likedProducts && userData.likedProducts.length > 0) {
          const productPromises = userData.likedProducts.slice(0, 20).map(async (pid) => {
            const pDoc = await getDoc(doc(db, "products", pid))
            return pDoc.exists() ? { id: pDoc.id, ...pDoc.data() } as Product : null
          })
          const prods = (await Promise.all(productPromises)).filter(Boolean) as Product[]
          setLikedProducts(prods)
        }
      } catch {
        toast.error("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [params.uid, router])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
    return d.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!userProfile) {
    return <div className="py-20 text-center text-muted-foreground">User not found</div>
  }

  const totalSpending = orders
    .filter((o) => ["payment_verified", "approved", "shipped", "delivered"].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0)

  return (
    <div>
      <button onClick={() => router.push("/admin/users")} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>

      <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{userProfile.fullName}</h1>
            <p className="text-sm text-muted-foreground">{userProfile.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${userProfile.role === "admin" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>
                <Shield className="h-3 w-3" />
                {userProfile.role}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${userProfile.emailVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                {userProfile.emailVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <Calendar className="mb-2 h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Date Joined</p>
          <p className="text-sm font-bold text-foreground">{formatDate(userProfile.createdAt)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <Package className="mb-2 h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-sm font-bold text-foreground">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <CreditCard className="mb-2 h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Total Spending</p>
          <p className="text-sm font-bold text-foreground">{"\u20A6"}{totalSpending.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <CreditCard className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Cashback Balance</p>
          <p className="text-sm font-bold text-primary">{"\u20A6"}{userProfile.cashbackBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Liked Products */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-foreground">
          <Heart className="mr-2 inline h-5 w-5 text-destructive" />
          Liked Products ({userProfile.likedProducts?.length || 0})
        </h2>
        {likedProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No liked products</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {likedProducts.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-card p-3">
                {p.images[0] && (
                  <img src={p.images[0] || "/placeholder.svg"} alt={p.name} className="mb-2 h-16 w-full rounded-md object-cover" />
                )}
                <p className="text-xs font-medium text-foreground">{p.name}</p>
                <p className="text-xs font-bold text-primary">
                  {"\u20A6"}{(p.hasDiscount ? p.discountPrice : p.normalPrice).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          <Package className="mr-2 inline h-5 w-5" />
          Purchased Products ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground">#{order.id.slice(0, 8)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    order.status === "delivered" ? "bg-green-50 text-green-700"
                    : order.status === "rejected" ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
                  }`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1">
                    {item.productImage && (
                      <img src={item.productImage || "/placeholder.svg"} alt={item.productName} className="h-8 w-8 rounded object-cover" />
                    )}
                    <span className="flex-1 text-xs text-foreground">{item.productName}</span>
                    <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                    <span className="text-xs font-bold text-foreground">{"\u20A6"}{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="mt-2 border-t border-border pt-2 text-right text-sm font-bold text-primary">
                  Total: {"\u20A6"}{order.totalAmount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
