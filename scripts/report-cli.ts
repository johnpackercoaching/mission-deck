import {
  initReporter,
  reportAgentStatus,
  reportTerminalLine,
  reportArtifact,
  reportTeamName,
  reportPreviewUrl,
  cleanup,
} from './agent-reporter.ts'

const USAGE = `
Usage:
  npx tsx scripts/report-cli.ts status <teamId> <agentId> <status> [name]
  npx tsx scripts/report-cli.ts terminal <teamId> <text> [type=stdout]
  npx tsx scripts/report-cli.ts artifact <teamId> <name> <path> <type>
  npx tsx scripts/report-cli.ts team-name <teamId> <name>
  npx tsx scripts/report-cli.ts preview-url <teamId> <url>
`.trim()

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log(USAGE)
    process.exit(1)
  }

  switch (command) {
    case 'status': {
      const [, teamId, agentId, status, name] = args
      if (!teamId || !agentId || !status) {
        console.error('Missing required args: status <teamId> <agentId> <status> [name]')
        process.exit(1)
      }
      const validStatuses = ['idle', 'active', 'complete', 'error'] as const
      if (!validStatuses.includes(status as typeof validStatuses[number])) {
        console.error(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`)
        process.exit(1)
      }
      initReporter(teamId)
      await reportAgentStatus(
        agentId,
        status as 'idle' | 'active' | 'complete' | 'error',
        name ?? agentId,
      )
      console.log(`Reported ${agentId} as ${status}`)
      break
    }

    case 'terminal': {
      const [, teamId, text, type] = args
      if (!teamId || !text) {
        console.error('Missing required args: terminal <teamId> <text> [type=stdout]')
        process.exit(1)
      }
      const validTypes = ['stdout', 'stderr', 'system'] as const
      const lineType = (type ?? 'stdout') as typeof validTypes[number]
      if (!validTypes.includes(lineType)) {
        console.error(`Invalid type "${type}". Must be one of: ${validTypes.join(', ')}`)
        process.exit(1)
      }
      initReporter(teamId)
      await reportTerminalLine(text, lineType)
      console.log(`Wrote terminal line to ${teamId}`)
      break
    }

    case 'artifact': {
      const [, teamId, name, path, type] = args
      if (!teamId || !name || !path || !type) {
        console.error('Missing required args: artifact <teamId> <name> <path> <type>')
        process.exit(1)
      }
      initReporter(teamId)
      await reportArtifact(name, path, type)
      console.log(`Wrote artifact "${name}" to ${teamId}`)
      break
    }

    case 'team-name': {
      const [, teamId, name] = args
      if (!teamId || !name) {
        console.error('Missing required args: team-name <teamId> <name>')
        process.exit(1)
      }
      initReporter(teamId)
      await reportTeamName(name)
      console.log(`Set team name to "${name}" for ${teamId}`)
      break
    }

    case 'preview-url': {
      const [, teamId, url] = args
      if (!teamId || !url) {
        console.error('Missing required args: preview-url <teamId> <url>')
        process.exit(1)
      }
      initReporter(teamId)
      await reportPreviewUrl(url)
      console.log(`Set preview URL for ${teamId}`)
      break
    }

    default:
      console.error(`Unknown command: ${command}`)
      console.log(USAGE)
      process.exit(1)
  }

  await cleanup()
}

main().catch((err: unknown) => {
  console.error('CLI error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
