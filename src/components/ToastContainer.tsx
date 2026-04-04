import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface Toast {
  id: string
  teamName: string
  agentName: string
  timestamp: number
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

const AUTO_DISMISS_MS = 5000

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id)
    }, AUTO_DISMISS_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [toast.id, onDismiss])

  return (
    <div
      className="toast-enter flex items-start gap-3 bg-red-950/80 border border-red-900/50 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg shadow-red-950/20 max-w-sm"
      role="alert"
      data-testid={`toast-${toast.id}`}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse-dot" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-300 truncate">{toast.agentName}</p>
        <p className="text-xs text-red-400/70 truncate">Error in {toast.teamName}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="focus-ring shrink-0 text-red-500/60 hover:text-red-400 transition-colors duration-150 p-0.5 rounded"
        aria-label={`Dismiss notification for ${toast.agentName}`}
        data-testid={`toast-dismiss-${toast.id}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto"
      data-testid="toast-container"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  )
}
