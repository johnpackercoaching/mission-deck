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

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Terminal</h3>
      <div
        ref={containerRef}
        className="h-48 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded p-2 font-mono text-xs"
      >
        {sortedLines.length === 0 ? (
          <span className="text-neutral-600">No output</span>
        ) : (
          sortedLines.map((line, i) => (
            <div key={i} className={typeColor[line.type] ?? 'text-neutral-300'}>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
