import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone || dismissed) return null

  if (isIOS) {
    return (
      <div className="mx-4 mb-4 rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm text-gray-300">
        <div className="flex items-start justify-between gap-3">
          <p>
            To install: tap the <strong>Share</strong> button in Safari, then{' '}
            <strong>Add to Home Screen</strong>.
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-gray-500 hover:text-gray-300"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  if (deferredPrompt) {
    return (
      <div className="mx-4 mb-4 rounded-xl border border-gray-700 bg-gray-900 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-300">Install the app for offline access.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300"
            >
              Not now
            </button>
            <button
              onClick={async () => {
                await deferredPrompt.prompt()
                setDeferredPrompt(null)
              }}
              className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-gray-950"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
