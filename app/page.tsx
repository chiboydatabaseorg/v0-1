"use client"

import { useEffect, useMemo, useState } from "react"
import { db, collection, onSnapshot, orderBy, query } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import type { Product } from "@/lib/types"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
import { ProductQuickView } from "@/components/product-quick-view"
import { Loader2, ShoppingBag, TrendingUp, Shield, Truck } from "lucide-react"

export default function HomePage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product))
        setLoading(false)
      },
      () => setLoading(false),
    )

    return unsubscribe
  }, [])

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sort, setSort] = useState("newest")

  const activeProducts = products.filter((product) => product.isActive !== false)
  const categories = Array.from(new Set(activeProducts.map((product) => product.category).filter(Boolean)))
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return activeProducts
      .filter((product) => category === "all" || product.category === category)
      .filter((product) => !normalizedSearch || `${product.name} ${product.description ?? ""}`.toLowerCase().includes(normalizedSearch))
      .sort((a, b) => {
        if (sort === "price-low") return (a.hasDiscount ? a.discountPrice : a.normalPrice) - (b.hasDiscount ? b.discountPrice : b.normalPrice)
        if (sort === "price-high") return (b.hasDiscount ? b.discountPrice : b.normalPrice) - (a.hasDiscount ? a.discountPrice : a.normalPrice)
        return 0
      })
  }, [activeProducts, category, search, sort])
  const displayProducts = user ? filteredProducts : filteredProducts.slice(0, 8)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary px-4 py-16 text-primary-foreground md:py-24">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="text-balance text-4xl font-bold md:text-5xl lg:text-6xl">
              Shop Smart, Shop ChiStore
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-primary-foreground/80">
              Your one-stop destination for quality products at unbeatable prices. Discover amazing deals every day.
            </p>
            {!user && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <a
                  href="/register"
                  className="rounded-lg bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card/90"
                >
                  Get Started
                </a>
                <a
                  href="/login"
                  className="rounded-lg border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
                >
                  Login
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-border bg-card px-4 py-10">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:grid-cols-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Quality Products</h3>
              <p className="text-xs text-muted-foreground">Carefully curated items</p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Best Prices</h3>
              <p className="text-xs text-muted-foreground">Unbeatable deals daily</p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Secure Payment</h3>
              <p className="text-xs text-muted-foreground">Your money is safe</p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Fast Delivery</h3>
              <p className="text-xs text-muted-foreground">Right to your door</p>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="px-4 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {user ? "All Products" : "Featured Products"}
              </h2>
              {!user && activeProducts.length > 8 && (
                <a href="/login" className="text-sm font-medium text-primary hover:underline">
                  Login to see all
                </a>
              )}
            </div>

            <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]">
              <label className="sr-only" htmlFor="product-search">Search products</label>
              <input
                id="product-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none ring-primary transition focus:ring-2"
              />
              <label className="sr-only" htmlFor="product-category">Filter by category</label>
              <select id="product-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none">
                <option value="all">All categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <label className="sr-only" htmlFor="product-sort">Sort products</label>
              <select id="product-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none">
                <option value="newest">Newest first</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <ShoppingBag className="mb-3 h-12 w-12" />
                <p className="text-lg font-medium">No products available yet</p>
                <p className="text-sm">Check back soon for amazing deals!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                    isLiked={user?.likedProducts?.includes(product.id)}
                  />
                ))}
              </div>
            )}

            {!user && activeProducts.length > 0 && (
              <div className="mt-8 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  Login to browse all products and start shopping
                </p>
                <a
                  href="/register"
                  className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Create Account
                </a>
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          isLiked={user?.likedProducts?.includes(selectedProduct.id) || false}
        />
      )}

      <SiteFooter />
    </div>
  )
}
