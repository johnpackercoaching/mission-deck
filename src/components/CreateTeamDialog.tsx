import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface CreateTeamDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string) => void
  currentTeamCount: number
  maxTeams: number
}

export function CreateTeamDialog({
  isOpen,
  onClose,
  onSubmit,
  currentTeamCount,
  maxTeams,
}: CreateTeamDialogProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const trimmedName = name.trim()
  const isAtLimit = currentTeamCount >= maxTeams

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setError(null)
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Focus input and scroll lock
  useEffect(() => {
    if (!isOpen) return

    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      inputRef.current?.focus()
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

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const validated = name.trim()

      if (validated.length < 3) {
        setError('Team name must be at least 3 characters')
        return
      }
      if (validated.length > 50) {
        setError('Team name must be 50 characters or fewer')
        return
      }
      if (isAtLimit) {
        setError(`Maximum of ${maxTeams} teams reached`)
        return
      }

      onSubmit(validated)
    },
    [name, isAtLimit, maxTeams, onSubmit]
  )

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop-enter"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Create new team"
      data-testid="create-team-dialog"
    >
      <div
        ref={contentRef}
        className="w-full max-w-md mx-4 bg-neutral-900 border border-neutral-800/60 rounded-xl shadow-2xl modal-content-enter"
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold text-neutral-100">Create New Team</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {isAtLimit
                ? `You have reached the maximum of ${maxTeams} teams.`
                : `${currentTeamCount} of ${maxTeams} teams used.`}
            </p>
          </div>

          <div className="px-6 py-4">
            <label htmlFor="create-team-name" className="block text-sm font-medium text-neutral-400 mb-2">
              Team name
            </label>
            <input
              ref={inputRef}
              id="create-team-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="e.g. Alpha Strike"
              maxLength={50}
              disabled={isAtLimit}
              className="w-full px-3 py-2 text-sm bg-neutral-950/60 border border-neutral-800/60 rounded-lg text-neutral-200 placeholder-neutral-600 search-focus-ring transition-all duration-150 hover:border-neutral-700/60 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Team name"
              aria-describedby={error ? 'create-team-error' : undefined}
              aria-invalid={error ? 'true' : 'false'}
              data-testid="create-team-name-input"
            />
            {error && (
              <p id="create-team-error" className="text-xs text-red-400 mt-2" role="alert">
                {error}
              </p>
            )}
            <p className="text-xs text-neutral-600 mt-2">
              {trimmedName.length}/50 characters (minimum 3)
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring text-sm text-neutral-400 hover:text-neutral-200 px-4 py-2 rounded-lg hover:bg-neutral-800/50 transition-all duration-150 border border-transparent"
              data-testid="create-team-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAtLimit || trimmedName.length < 3}
              className="focus-ring text-sm font-medium text-white bg-accent-600 hover:bg-accent-500 px-4 py-2 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="create-team-submit"
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
