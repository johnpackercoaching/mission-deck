import { useEffect, useRef } from 'react'
import type { TerminalLine } from '../schemas'

interface TerminalProps {
  lines: Record<string, TerminalLine>
}

export function Terminal({ lines }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const sortedLines = Object.values(lines).sort((a, b) => a.timestamp - b.timestamp)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [sortedLines.length])

  const typeColor: Record<string, string> = {
    stdout: 'text-neutral-300',
    stderr: 'text-red-400',
    system: 'text-blue-400',
  }

  const typePrefix: Record<string, string> = {
    stdout: '',
    stderr: '',
    system: '',
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
        className="h-52 overflow-y-auto bg-neutral-950 border border-neutral-800/60 rounded-lg p-3 font-mono text-xs leading-relaxed"
      >
        {sortedLines.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-1">
              <p className="text-neutral-600">No terminal output yet</p>
              <p className="text-neutral-700 text-[10px]">Output will appear here when agents run commands</p>
            </div>
          </div>
        ) : (
          sortedLines.map((line, i) => (
            <div
              key={i}
              className={`${typeColor[line.type] ?? 'text-neutral-300'} py-0.5 px-1 -mx-1 rounded hover:bg-white/[0.02] transition-colors duration-100`}
            >
              {typePrefix[line.type]}{line.text}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
