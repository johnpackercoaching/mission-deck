interface ProjectPreviewProps {
  previewUrl: string
}

export function ProjectPreview({ previewUrl }: ProjectPreviewProps) {
  if (!previewUrl) {
    return (
      <div className="flex items-center justify-center h-48 bg-neutral-900 border border-neutral-800 rounded text-neutral-500 text-sm">
        No preview available
      </div>
    )
  }

  return (
    <div className="h-48 border border-neutral-800 rounded overflow-hidden">
      <iframe
        src={previewUrl}
        title="Project Preview"
        className="w-full h-full bg-neutral-900"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}
