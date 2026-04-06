function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString()
}

interface AgentEntry { name: string; status: string; lastActivity: number }
interface TimelineEntry { agentName: string; status: string; fromStatus?: string | null; timestamp: number; message?: string }
interface TerminalEntry { text: string; type: string; timestamp: number }
interface ArtifactEntry { name: string; path: string; type: string; createdAt: number }

interface ExportableTeamData {
  name?: string
  agents?: Record<string, AgentEntry>
  timeline?: Record<string, TimelineEntry>
  terminal?: { lines?: Record<string, TerminalEntry> }
  artifacts?: Record<string, ArtifactEntry>
}

export function exportTeamAsJSON(teamName: string, data: ExportableTeamData): void {
  const exportData = {
    teamName: data.name ?? teamName,
    exportedAt: new Date().toISOString(),
    agents: Object.entries(data.agents ?? {}).map(([id, agent]) => ({
      id,
      name: agent.name,
      status: agent.status,
      lastActivity: formatTimestamp(agent.lastActivity),
    })),
    timeline: Object.entries(data.timeline ?? {}).map(([id, event]) => ({
      id,
      agentName: event.agentName,
      status: event.status,
      fromStatus: event.fromStatus ?? null,
      timestamp: formatTimestamp(event.timestamp),
      message: event.message ?? '',
    })),
    terminal: Object.entries(data.terminal?.lines ?? {}).map(([id, line]) => ({
      id,
      text: line.text,
      type: line.type,
      timestamp: formatTimestamp(line.timestamp),
    })),
    artifacts: Object.entries(data.artifacts ?? {}).map(([id, artifact]) => ({
      id,
      name: artifact.name,
      path: artifact.path,
      type: artifact.type,
      createdAt: formatTimestamp(artifact.createdAt),
    })),
  }

  const json = JSON.stringify(exportData, null, 2)
  const filename = `${sanitizeFilename(teamName)}-export-${new Date().toISOString().slice(0, 10)}.json`
  triggerDownload(filename, json, 'application/json')
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportTeamAsCSV(teamName: string, data: ExportableTeamData): void {
  const headers = ['Event ID', 'Agent Name', 'Status', 'From Status', 'Timestamp', 'Message']
  const rows: string[][] = []

  const timeline = Object.entries(data.timeline ?? {})
    .map(([id, event]) => ({ id, agentName: event.agentName, status: event.status, fromStatus: event.fromStatus, timestamp: event.timestamp, message: event.message }))
    .sort((a, b) => b.timestamp - a.timestamp)

  for (const event of timeline) {
    rows.push([
      event.id,
      event.agentName,
      event.status,
      event.fromStatus ?? '',
      formatTimestamp(event.timestamp),
      event.message ?? '',
    ])
  }

  const terminalLines = Object.entries(data.terminal?.lines ?? {})
    .map(([id, line]) => ({ id, text: line.text, type: line.type, timestamp: line.timestamp }))
    .sort((a, b) => b.timestamp - a.timestamp)

  if (terminalLines.length > 0) {
    rows.push([])
    rows.push(['--- Terminal Logs ---', '', '', '', '', ''])
    rows.push(['Line ID', 'Text', 'Type', '', 'Timestamp', ''])
    for (const line of terminalLines) {
      rows.push([
        line.id,
        line.text,
        line.type,
        '',
        formatTimestamp(line.timestamp),
        '',
      ])
    }
  }

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n')

  const filename = `${sanitizeFilename(teamName)}-export-${new Date().toISOString().slice(0, 10)}.csv`
  triggerDownload(filename, csvContent, 'text/csv')
}
