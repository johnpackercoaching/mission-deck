import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { TeamPanel } from './TeamPanel'

interface TeamDetailModalProps {
  teamId: string
  teamName: string
  isOpen: boolean
  onClose: () => void
}

export function TeamDetailModal({ teamId, teamName, isOpen, onClose }: TeamDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const scrollYRef = useRef(0)

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Focus trap and scroll lock
  useEffect(() => {
    if (!isOpen) return

    // Lock scroll
    scrollYRef.current = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollYRef.current}px`
    document.body.style.width = '100%'

    // Focus the close button after a short delay for animation
    const timer = setTimeout(() => {
      const closeBtn = contentRef.current?.querySelector<HTMLElement>('[data-modal-close]')
      closeBtn?.focus()
    }, 100)

    const savedScrollY = scrollYRef.current

    return () => {
      clearTimeout(timer)
      // Restore scroll
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, savedScrollY)

      // Return focus
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Escape key handler and focus trap
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }

      // Focus trap
      if (e.key === 'Tab' && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

  // Click outside to close
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose()
      }
    },
    [onClose]
  )

  if (!isOpen) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto modal-backdrop-enter"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${teamName} team details`}
      data-testid="team-detail-modal"
    >
      <div
        ref={contentRef}
        className="relative w-full max-w-5xl mx-2 sm:mx-4 my-4 sm:my-8 modal-content-enter"
      >
        {/* Close button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-100">{teamName} &mdash; Details</h2>
          <button
            onClick={onClose}
            data-modal-close
            className="focus-ring flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200 bg-neutral-900/80 border border-neutral-800/60 rounded-lg px-3 py-2 transition-all duration-150 hover:border-neutral-700/60"
            aria-label="Close team details"
            data-testid="modal-close-button"
          >
            <span className="text-xs text-neutral-600">Esc</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Full TeamPanel rendered in modal context */}
        <TeamPanel teamId={teamId} teamName={teamName} />
      </div>
    </div>,
    document.body
  )
}
