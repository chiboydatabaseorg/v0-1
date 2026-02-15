"use client"

import { X, Heart, ExternalLink, ShoppingCart } from "lucide-react"
import Link from "next/link"
import type { Product } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

interface ProductQuickViewProps {
  product: Product
  onClose: () => void
  isLiked: boolean
}

export function ProductQuickView({ product, onClose, isLiked }: ProductQuickViewProps) {
  const { user } = useAuth()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={onClose}>
      <div
        className="animate-fadeIn relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {product.images[0] ? (
            <img
              src={product.images[0] || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">No Image</div>
          )}
        </div>

        <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>

        <div className="mt-3 flex items-center gap-3">
          {product.hasDiscount ? (
            <>
              <span className="text-2xl font-bold text-primary">
                {"\u20A6"}{product.discountPrice.toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground line-through">
                {"\u20A6"}{product.normalPrice.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold text-primary">
              {"\u20A6"}{product.normalPrice.toLocaleString()}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Heart className={`h-4 w-4 ${isLiked ? "fill-destructive text-destructive" : ""}`} />
          <span>{product.likes || 0} likes</span>
        </div>

        {product.limitedToStates.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {"Available in: "}{product.limitedToStates.join(", ")}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={`/product/${product.id}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            onClick={onClose}
          >
            View Full Details
          </Link>

          {!user && (
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">Login</Link>
              {" to add to cart"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
