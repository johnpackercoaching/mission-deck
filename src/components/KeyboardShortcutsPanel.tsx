import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface KeyboardShortcutsPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  label: string
  shortcuts: ShortcutItem[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['/'], description: 'Focus search bar' },
      { keys: ['⌘', 'K'], description: 'Open command palette' },
    ],
  },
  {
    label: 'Panels',
    shortcuts: [
      { keys: ['Esc'], description: 'Close panel or modal' },
      { keys: ['?'], description: 'Keyboard shortcuts' },
    ],
  },
  {
    label: 'Command Palette',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate items' },
      { keys: ['Enter'], description: 'Select item' },
    ],
  },
]

export function KeyboardShortcutsPanel({
  isOpen,
  onClose,
}: KeyboardShortcutsPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Save previous focus on open
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Focus trap and scroll lock
  useEffect(() => {
    if (!isOpen) return

    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      const firstFocusable = contentRef.current?.querySelector<HTMLElement>(
        'button, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
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
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      data-testid="keyboard-shortcuts-panel"
    >
      <div
        ref={contentRef}
        className="w-full max-w-md mx-4 bg-surface-900 border border-neutral-800/60 rounded-xl shadow-2xl modal-content-enter"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-heading">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="focus-ring text-secondary hover:text-heading p-1 rounded-md hover:bg-surface-800/80 transition-all duration-150"
            aria-label="Close keyboard shortcuts"
            data-testid="shortcuts-close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Shortcut groups */}
        <div className="px-6 py-4 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-2">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between"
                    data-testid="shortcut-item"
                  >
                    <span className="text-sm text-secondary">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-1.5 text-xs font-medium text-heading bg-surface-800 border border-neutral-700/60 rounded-md shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="focus-ring text-sm font-medium text-white bg-accent-600 hover:bg-accent-500 px-4 py-2 rounded-lg transition-all duration-150"
            data-testid="shortcuts-done"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
