import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface DeleteTeamDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  teamName: string
}

export function DeleteTeamDialog({
  isOpen,
  onClose,
  onConfirm,
  teamName,
}: DeleteTeamDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Store previous focus on open
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Scroll lock and focus management
  useEffect(() => {
    if (!isOpen) return

    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      const cancelBtn = contentRef.current?.querySelector<HTMLElement>('[data-testid="delete-team-cancel"]')
      cancelBtn?.focus()
    }, 50)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }

      if (e.key === 'Tab' && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0] as HTMLElement | undefined
        const last = focusable[focusable.length - 1] as HTMLElement | undefined
        if (!first || !last) return

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop-enter"
      onClick={handleOverlayClick}
      role="alertdialog"
      aria-modal="true"
      aria-label={`Delete team ${teamName}`}
      data-testid="delete-team-dialog"
    >
      <div
        ref={contentRef}
        className="w-full max-w-sm mx-4 bg-neutral-900 border border-neutral-800/60 rounded-xl shadow-2xl modal-content-enter"
      >
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-neutral-100">Delete Team</h2>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-neutral-400">
            Are you sure you want to delete{' '}
            <span className="font-medium text-neutral-200">{teamName}</span>?
            This will permanently remove all team data including terminal logs, artifacts, and agent history.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring text-sm text-neutral-400 hover:text-neutral-200 px-4 py-2 rounded-lg hover:bg-neutral-800/50 transition-all duration-150 border border-transparent"
            data-testid="delete-team-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="focus-ring text-sm font-medium text-white bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg transition-all duration-150"
            data-testid="delete-team-confirm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
