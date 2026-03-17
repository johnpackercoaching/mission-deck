import { useEffect, useRef, useState } from 'react'
import type { TerminalLine } from '../schemas'
import { formatRelativeTime } from '../utils/relative-time'

interface TerminalProps {
  lines: Record<string, TerminalLine>
}

const MAX_DISPLAY_LINES = 200

export function Terminal({ lines }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [userScrolled, setUserScrolled] = useState(false)
  const prevCountRef = useRef(0)

  const sortedLines = Object.entries(lines)
    .map(([key, line]) => ({ key, ...line }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_DISPLAY_LINES)

  const newLineCount = Math.max(0, sortedLines.length - prevCountRef.current)

  useEffect(() => {
    prevCountRef.current = sortedLines.length
  }, [sortedLines.length])

  useEffect(() => {
    const el = containerRef.current
    if (!el || userScrolled) return
    el.scrollTop = el.scrollHeight
  }, [sortedLines.length, userScrolled])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setUserScrolled(!isNearBottom)
  }

  const typeColor: Record<string, string> = {
    stdout: 'text-neutral-300',
    stderr: 'text-red-400',
    system: 'text-blue-400',
  }

  return (
    <section className="space-y-2" aria-label="Terminal output">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Terminal</h3>
        {sortedLines.length > 0 && (
          <span className="text-xs text-neutral-600 font-mono">{sortedLines.length} lines</span>
        )}
      </div>
      <div
        ref={containerRef}
        role="log"
        aria-live="polite"
        onScroll={handleScroll}
        className="h-52 overflow-y-auto bg-neutral-950 border border-neutral-800/60 rounded-lg p-3 font-mono text-xs leading-relaxed custom-scrollbar"
      >
        {sortedLines.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-1">
              <p className="text-neutral-600">No terminal output yet</p>
              <p className="text-neutral-700 text-[10px]">Output will appear here when agents run commands</p>
            </div>
          </div>
        ) : (
          sortedLines.map((line, i) => {
            const isNew = newLineCount > 0 && i >= sortedLines.length - newLineCount
            return (
              <div
                key={line.key}
                className={`${typeColor[line.type] ?? 'text-neutral-300'} py-0.5 px-1 -mx-1 rounded hover:bg-white/[0.02] transition-colors duration-100 flex items-baseline gap-2 ${isNew ? 'terminal-new-line' : ''}`}
              >
                <span className="text-neutral-700 text-[10px] shrink-0 select-none w-12 text-right">
                  {formatRelativeTime(line.timestamp)}
                </span>
                <span className="flex-1 break-all">{line.text}</span>
              </div>
            )
          })
        )}
      </div>
      {userScrolled && sortedLines.length > 0 && (
        <button
          onClick={() => {
            setUserScrolled(false)
            containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
          }}
          className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          Scroll to bottom
        </button>
      )}
    </section>
  )
}
