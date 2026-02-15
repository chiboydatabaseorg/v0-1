"use client"

import type { Product } from "@/lib/types"
import { Heart } from "lucide-react"

interface ProductCardProps {
  product: Product
  onClick: () => void
  isLiked?: boolean
}

export function ProductCard({ product, onClick, isLiked }: ProductCardProps) {
  const discount = product.hasDiscount
    ? Math.round(((product.normalPrice - product.discountPrice) / product.normalPrice) * 100)
    : 0

  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {product.images[0] ? (
          <img
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        {product.hasDiscount && discount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
            {`-${discount}%`}
          </span>
        )}
        {isLiked && (
          <span className="absolute right-2 top-2">
            <Heart className="h-5 w-5 fill-destructive text-destructive" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{product.description}</p>
        <div className="mt-auto flex items-center gap-2 pt-2">
          {product.hasDiscount ? (
            <>
              <span className="text-base font-bold text-primary">
                {"\u20A6"}{product.discountPrice.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {"\u20A6"}{product.normalPrice.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-primary">
              {"\u20A6"}{product.normalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="h-3 w-3" />
          <span>{product.likes || 0} likes</span>
        </div>
      </div>
    </button>
  )
}
