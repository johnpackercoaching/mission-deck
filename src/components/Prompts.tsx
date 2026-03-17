import { useState, useCallback } from 'react'
import { writeData } from '../services/data'

interface PromptsProps {
  teamId: string
  prompts: Record<string, string>
}

export function Prompts({ teamId, prompts }: PromptsProps) {
  const [localPrompts, setLocalPrompts] = useState(prompts)

  const handleChange = useCallback((key: string, value: string) => {
    setLocalPrompts(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleBlur = useCallback(async (key: string) => {
    const value = localPrompts[key]
    if (value !== undefined) {
      await writeData(`teams/${teamId}/project/prompts/${key}`, value)
    }
  }, [teamId, localPrompts])

  const entries = Object.entries(localPrompts)

  return (
    <section className="space-y-2" aria-label="Team prompts">
      <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Prompts</h3>
      {entries.length === 0 ? (
        <div className="flex items-center justify-center h-20 bg-neutral-900/40 border border-neutral-800/40 rounded-lg">
          <div className="text-center space-y-0.5">
            <p className="text-sm text-neutral-600">No prompts configured</p>
            <p className="text-[10px] text-neutral-700">Prompts will appear when team data is seeded</p>
          </div>
        </div>
      ) : (
        entries.map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <label
              htmlFor={`prompt-${teamId}-${key}`}
              className="block text-xs text-neutral-500 font-medium capitalize"
            >
              {key}
            </label>
            <textarea
              id={`prompt-${teamId}-${key}`}
              className="focus-ring w-full bg-neutral-900/80 border border-neutral-800/60 rounded-lg px-3 py-2 text-sm text-neutral-200 resize-y min-h-16 focus:border-accent-500/50 transition-colors duration-150 placeholder:text-neutral-700"
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              onBlur={() => void handleBlur(key)}
              placeholder={`Enter ${key}...`}
            />
          </div>
        ))
      )}
    </section>
  )
}
