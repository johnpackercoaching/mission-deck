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
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Prompts</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-neutral-600">No prompts configured</p>
      ) : (
        entries.map(([key, value]) => (
          <div key={key}>
            <label className="block text-xs text-neutral-500 mb-1">{key}</label>
            <textarea
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm text-neutral-200 resize-y min-h-16 focus:outline-none focus:border-neutral-600"
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              onBlur={() => void handleBlur(key)}
            />
          </div>
        ))
      )}
    </div>
  )
}
