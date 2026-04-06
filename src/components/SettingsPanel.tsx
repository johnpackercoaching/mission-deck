import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Theme } from '../hooks/useTheme'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

export function SettingsPanel({
  isOpen,
  onClose,
  theme,
  onThemeChange,
}: SettingsPanelProps) {
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
        'button, input, [tabindex]:not([tabindex="-1"])'
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
          'button, input, [tabindex]:not([tabindex="-1"])'
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
      aria-label="Settings"
      data-testid="settings-panel"
    >
      <div
        ref={contentRef}
        className="w-full max-w-md mx-4 bg-surface-900 border border-neutral-800/60 rounded-xl shadow-2xl modal-content-enter"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-heading">Settings</h2>
          <button
            onClick={onClose}
            className="focus-ring text-secondary hover:text-heading p-1 rounded-md hover:bg-surface-800/80 transition-all duration-150"
            aria-label="Close settings"
            data-testid="settings-close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Theme setting */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-heading" id="theme-label">
                Appearance
              </label>
              <p className="text-xs text-secondary mt-0.5">
                Choose light or dark theme
              </p>
            </div>
            <div
              className="flex items-center rounded-lg border border-neutral-700/60 overflow-hidden"
              role="radiogroup"
              aria-labelledby="theme-label"
              data-testid="theme-toggle"
            >
              <button
                role="radio"
                aria-checked={theme === 'dark'}
                onClick={() => onThemeChange('dark')}
                className={`focus-ring px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  theme === 'dark'
                    ? 'bg-accent-600 text-white'
                    : 'text-secondary hover:text-heading hover:bg-surface-800/50'
                }`}
                data-testid="theme-dark"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Dark
                </span>
              </button>
              <button
                role="radio"
                aria-checked={theme === 'light'}
                onClick={() => onThemeChange('light')}
                className={`focus-ring px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  theme === 'light'
                    ? 'bg-accent-600 text-white'
                    : 'text-secondary hover:text-heading hover:bg-surface-800/50'
                }`}
                data-testid="theme-light"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Light
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-neutral-800/40" />

        {/* Info section */}
        <div className="px-6 py-4">
          <p className="text-xs text-tertiary">
            Settings are saved automatically and persist across sessions.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 pb-6">
          <button
            onClick={onClose}
            className="focus-ring text-sm font-medium text-white bg-accent-600 hover:bg-accent-500 px-4 py-2 rounded-lg transition-all duration-150"
            data-testid="settings-done"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
