import { useState } from 'react'

interface ProjectPreviewProps {
  previewUrl: string
}

export function ProjectPreview({ previewUrl }: ProjectPreviewProps) {
  const [isLoading, setIsLoading] = useState(!!previewUrl)

  if (!previewUrl) {
    return (
      <section aria-label="Project preview">
        <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Preview</h3>
        <div className="flex items-center justify-center h-48 bg-neutral-900/40 border border-neutral-800/40 rounded-lg">
          <div className="text-center space-y-1">
            <svg className="w-8 h-8 text-neutral-700 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <circle cx="6.5" cy="6" r="0.5" fill="currentColor" />
              <circle cx="9" cy="6" r="0.5" fill="currentColor" />
              <circle cx="11.5" cy="6" r="0.5" fill="currentColor" />
            </svg>
            <p className="text-sm text-neutral-600">No preview available</p>
            <p className="text-[10px] text-neutral-700">Set a preview URL to see the live project here</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Project preview">
      <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Preview</h3>
      <div className="relative h-48 border border-neutral-800/60 rounded-lg overflow-hidden bg-neutral-950">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 z-10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-pulse-dot" />
              <span className="text-xs text-neutral-600">Loading preview...</span>
            </div>
          </div>
        )}
        <iframe
          src={previewUrl}
          title="Project Preview"
          className="w-full h-full bg-neutral-900"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </section>
  )
}
