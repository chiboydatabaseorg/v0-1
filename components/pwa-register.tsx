"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined)
    }

    const handleInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleInstall)
    return () => window.removeEventListener("beforeinstallprompt", handleInstall)
  }, [])

  if (!installEvent || dismissed) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-2xl">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Download className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Install CHISTORE</p>
        <p className="text-xs text-muted-foreground">Add the store to your home screen.</p>
      </div>
      <Button
        size="sm"
        onClick={async () => {
          await installEvent.prompt()
          setInstallEvent(null)
        }}
      >
        Install
      </Button>
      <button
        type="button"
        aria-label="Dismiss install prompt"
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
