import type { Artifact } from '../schemas'

interface ArtifactsProps {
  artifacts: Record<string, Artifact>
}

export function Artifacts({ artifacts }: ArtifactsProps) {
  const items = Object.entries(artifacts).sort(
    ([, a], [, b]) => b.createdAt - a.createdAt
  )

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Artifacts</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-600">No artifacts</p>
      ) : (
        <ul className="space-y-1">
          {items.map(([id, artifact]) => (
            <li
              key={id}
              className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm"
            >
              <span className="text-neutral-200 truncate">{artifact.name}</span>
              <span className="text-neutral-500 text-xs ml-2 shrink-0">{artifact.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
