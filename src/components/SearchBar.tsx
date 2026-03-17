import { useState, useRef, useEffect } from 'react'

export type StatusFilter = 'all' | 'active' | 'error' | 'idle'

interface StatusCount {
  all: number
  active: number
  error: number
  idle: number
}

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  statusCounts: StatusCount
}

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'error', label: 'Error' },
  { value: 'idle', label: 'Idle' },
]

export function SearchBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3" role="search" aria-label="Filter teams">
      {/* Search input */}
      <div className="relative w-full sm:w-64">
        <svg
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-150 ${
            isFocused ? 'text-accent-400' : 'text-neutral-500'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder='Search teams... (press "/")'
          className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-900/60 border border-neutral-800/60 rounded-lg text-neutral-200 placeholder-neutral-500 search-focus-ring transition-all duration-150 hover:border-neutral-700/60"
          aria-label="Search teams by name"
          data-testid="search-input"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Filter by team status">
        {FILTER_OPTIONS.map(({ value, label }) => {
          const isSelected = statusFilter === value
          const count = statusCounts[value]
          return (
            <button
              key={value}
              onClick={() => onStatusFilterChange(value)}
              role="radio"
              aria-checked={isSelected}
              className={`focus-ring text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150 ${
                isSelected
                  ? value === 'error'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : value === 'active'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : value === 'idle'
                    ? 'bg-neutral-500/20 text-neutral-300 border border-neutral-500/30'
                    : 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                  : 'bg-neutral-900/40 text-neutral-500 border border-neutral-800/40 hover:text-neutral-400 hover:border-neutral-700/40'
              }`}
              data-testid={`filter-${value}`}
            >
              {label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
