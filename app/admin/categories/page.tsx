"use client"

import { useEffect, useState } from "react"
import { collection, db, deleteDoc, doc, onSnapshot, addDoc, serverTimestamp, updateDoc } from "@/lib/firebase"
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react"
import { toast } from "sonner"

interface Category { id: string; name: string; slug?: string }

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [editing, setEditing] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => onSnapshot(collection(db, "categories"), (snapshot) => {
    setCategories(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Category).sort((a, b) => a.name.localeCompare(b.name)))
    setLoading(false)
  }, () => { toast.error("Failed to load categories"); setLoading(false) }), [])

  const save = async () => {
    const cleanName = name.trim()
    if (!cleanName) return toast.error("Enter a category name")
    if (categories.some((category) => category.name.toLowerCase() === cleanName.toLowerCase() && category.id !== editing?.id)) {
      return toast.error("That category already exists")
    }
    setSaving(true)
    try {
      if (editing) {
        await updateDoc(doc(db, "categories", editing.id), { name: cleanName, slug: slugify(cleanName), updatedAt: serverTimestamp() })
        toast.success("Category updated")
      } else {
        await addDoc(collection(db, "categories"), { name: cleanName, slug: slugify(cleanName), createdAt: serverTimestamp() })
        toast.success("Category created")
      }
      setName(""); setEditing(null)
    } catch { toast.error("Could not save category") } finally { setSaving(false) }
  }

  const remove = async (category: Category) => {
    if (!confirm(`Delete ${category.name}? Products already assigned to it will keep their label.`)) return
    try { await deleteDoc(doc(db, "categories", category.id)); toast.success("Category deleted") } catch { toast.error("Could not delete category") }
  }

  return <div className="mx-auto max-w-4xl">
    <div className="mb-8 flex items-end justify-between gap-4">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Catalog structure</p><h1 className="text-3xl font-bold text-foreground">Categories</h1><p className="mt-2 text-sm text-muted-foreground">Create reusable categories, then assign them to products from the product form.</p></div>
      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{categories.length} total</span>
    </div>
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /><h2 className="font-semibold text-foreground">{editing ? "Edit category" : "Add category"}</h2></div>
      <div className="flex flex-col gap-3 sm:flex-row"><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && save()} placeholder="e.g. Electronics" className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" /><button onClick={save} disabled={saving} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : editing ? "Save changes" : "Create category"}</button>{editing && <button onClick={() => { setEditing(null); setName("") }} className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground"><X className="h-4 w-4" /></button>}</div>
    </div>
    {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : <div className="grid gap-3 sm:grid-cols-2">{categories.map((category) => <div key={category.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm"><div><p className="font-semibold text-foreground">{category.name}</p><p className="mt-1 text-xs text-muted-foreground">/{category.slug || slugify(category.name)}</p></div><div className="flex gap-1"><button onClick={() => { setEditing(category); setName(category.name) }} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={`Edit ${category.name}`}><Pencil className="h-4 w-4" /></button><button onClick={() => remove(category)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${category.name}`}><Trash2 className="h-4 w-4" /></button></div></div>)}{categories.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No categories yet. Create your first one above.</div>}</div>}
  </div>
}
