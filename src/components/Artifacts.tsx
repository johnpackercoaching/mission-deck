import type { Artifact } from '../schemas'

interface ArtifactsProps {
  artifacts: Record<string, Artifact>
}

const typeColors: Record<string, string> = {
  typescript: 'text-blue-400 bg-blue-950/30 border-blue-900/30',
  javascript: 'text-yellow-400 bg-yellow-950/30 border-yellow-900/30',
  json: 'text-green-400 bg-green-950/30 border-green-900/30',
  markdown: 'text-purple-400 bg-purple-950/30 border-purple-900/30',
  css: 'text-pink-400 bg-pink-950/30 border-pink-900/30',
  html: 'text-orange-400 bg-orange-950/30 border-orange-900/30',
}

const defaultTypeColor = 'text-neutral-400 bg-neutral-900/50 border-neutral-800/30'

export function Artifacts({ artifacts }: ArtifactsProps) {
  const items = Object.entries(artifacts).sort(
    ([, a], [, b]) => b.createdAt - a.createdAt
  )

  return (
    <section className="space-y-2" aria-label="Project artifacts">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Artifacts</h3>
        {items.length > 0 && (
          <span className="text-xs text-neutral-600 font-mono">{items.length} files</span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-20 bg-neutral-900/40 border border-neutral-800/40 rounded-lg">
          <div className="text-center space-y-0.5">
            <p className="text-sm text-neutral-600">No artifacts yet</p>
            <p className="text-[10px] text-neutral-700">Files will appear here as agents create them</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-1" role="list">
          {items.map(([id, artifact]) => (
            <li
              key={id}
              className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800/40 rounded-lg px-3 py-2 hover:border-neutral-700/50 hover:bg-neutral-900/80 transition-all duration-150 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-neutral-200 truncate" title={artifact.name}>
                  {artifact.name}
                </span>
              </div>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ml-2 ${typeColors[artifact.type] ?? defaultTypeColor}`}
              >
                {artifact.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
