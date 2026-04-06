import { useState, useRef, useEffect, useCallback } from 'react'
import { exportTeamAsJSON, exportTeamAsCSV } from '../utils/export'

interface ExportMenuProps {
  teamName: string
  data: Parameters<typeof exportTeamAsJSON>[1] | null
}

export function ExportMenu({ teamName, data }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(prev => !prev)
  }, [])

  const handleExportJSON = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!data) return
    exportTeamAsJSON(teamName, data)
    setIsOpen(false)
  }, [teamName, data])

  const handleExportCSV = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!data) return
    exportTeamAsCSV(teamName, data)
    setIsOpen(false)
  }, [teamName, data])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const disabled = !data

  return (
    <div className="relative" ref={menuRef} data-testid="export-menu">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setIsOpen(prev => !prev) } }}
        disabled={disabled}
        className={`focus-ring inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all duration-150 ${
          disabled
            ? 'text-neutral-600 border-neutral-800/30 cursor-not-allowed'
            : 'text-secondary hover:text-heading border-themed hover:bg-hover'
        }`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Export team data"
        data-testid="export-trigger"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="hidden sm:inline">Export</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-20 w-40 bg-surface-900 border border-neutral-700/60 rounded-lg shadow-xl overflow-hidden"
          role="menu"
          aria-label="Export format options"
          data-testid="export-dropdown"
        >
          <button
            role="menuitem"
            onClick={handleExportJSON}
            className="focus-ring w-full text-left px-3 py-2 text-xs text-secondary hover:text-heading hover:bg-hover transition-all duration-150 flex items-center gap-2"
            data-testid="export-json"
          >
            <svg className="w-3.5 h-3.5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export as JSON
          </button>
          <div className="mx-2 border-t border-neutral-800/40" />
          <button
            role="menuitem"
            onClick={handleExportCSV}
            className="focus-ring w-full text-left px-3 py-2 text-xs text-secondary hover:text-heading hover:bg-hover transition-all duration-150 flex items-center gap-2"
            data-testid="export-csv"
          >
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Export as CSV
          </button>
        </div>
      )}
    </div>
  )
}
