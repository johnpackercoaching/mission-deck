import {
  initReporter,
  reportTeamName,
  reportAgentStatus,
  reportTerminalLine,
  reportArtifact,
  cleanup,
} from './agent-reporter.ts'

const AGENTS = [
  { id: 'project-resume-agent', name: 'Project Resume', phase: 'Orientation' },
  { id: 'next-steps-agent', name: 'Next Steps', phase: 'Direction' },
  { id: 'product-manager-agent', name: 'Product Manager', phase: 'Product Scoping' },
  { id: 'plan-builder-agent', name: 'Plan Builder', phase: 'Planning' },
  { id: 'plan-validation-agent', name: 'Plan Validation', phase: 'Validation' },
  { id: 'blocker-analysis-agent', name: 'Blocker Analysis', phase: 'Diagnostics' },
  { id: 'execution-agent', name: 'Execution', phase: 'Implementation' },
  { id: 'playwright-test-agent', name: 'Playwright Test', phase: 'Verification' },
] as const

const TERMINAL_LINES: Record<string, string[]> = {
  'project-resume-agent': [
    '[project-resume] Reading project memory...',
    '[project-resume] Found 12 session files, last updated 2 hours ago',
    '[project-resume] Current state: dashboard deployed, 22 E2E tests passing',
    '[project-resume] Orientation complete -- ready for direction',
  ],
  'next-steps-agent': [
    '[next-steps] Analyzing current state and priorities...',
    '[next-steps] Evaluating 3 candidate next actions',
    '[next-steps] Recommendation: implement real-time agent integration',
  ],
  'product-manager-agent': [
    '[product-manager] Creating Decision Brief...',
    '[product-manager] JTBD: operators need live visibility into agent workflows',
    '[product-manager] Success metric: terminal updates appear within 2 seconds',
    '[product-manager] Guardrail: no changes to existing dashboard components',
  ],
  'plan-builder-agent': [
    '[plan-builder] Creating step-by-step implementation plan...',
    '[plan-builder] Plan has 6 steps, 14 substeps',
    '[plan-builder] Each substep has defined input, output, and verification',
    '[plan-builder] Plan saved to session memory',
  ],
  'plan-validation-agent': [
    '[plan-validation] Scanning plan for uncertainties...',
    '[plan-validation] Checking for duplicate code patterns...',
    '[plan-validation] Confirming all dependencies exist in package.json',
    '[plan-validation] Validation passed -- plan is ready for execution',
  ],
  'blocker-analysis-agent': [
    '[blocker-analysis] No blockers detected',
    '[blocker-analysis] All prerequisites confirmed',
    '[blocker-analysis] Proceeding to implementation',
  ],
  'execution-agent': [
    '[execution] Step 1: Creating scripts/tsconfig.json...',
    '[execution] Step 2: Writing scripts/agent-reporter.ts...',
    '[execution] Step 3: Writing scripts/report-cli.ts...',
    '[execution] Step 4: Writing scripts/simulate-agent.ts...',
    '[execution] Step 5: Updating package.json scripts...',
  ],
  'playwright-test-agent': [
    '[playwright] Starting verification...',
    '[playwright] Running npm run build...',
    '[playwright] Build succeeded -- 0 errors, 0 warnings',
    '[playwright] Running 22 E2E tests...',
    '[playwright] 22/22 passed -- console clean, no regressions',
  ],
}

const EXECUTION_ARTIFACTS = [
  { name: 'agent-reporter.ts', path: 'scripts/agent-reporter.ts', type: 'typescript' },
  { name: 'report-cli.ts', path: 'scripts/report-cli.ts', type: 'typescript' },
  { name: 'simulate-agent.ts', path: 'scripts/simulate-agent.ts', type: 'typescript' },
]

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let shuttingDown = false

async function main(): Promise<void> {
  // Parse --team argument
  const teamArgIndex = process.argv.indexOf('--team')
  const teamId = teamArgIndex !== -1 && process.argv[teamArgIndex + 1]
    ? process.argv[teamArgIndex + 1]
    : 'sim-team-1'

  console.log(`Starting simulation for team: ${teamId}`)

  initReporter(teamId)

  // Handle SIGINT for clean shutdown
  process.on('SIGINT', async () => {
    if (shuttingDown) return
    shuttingDown = true
    console.log('\nReceived SIGINT -- cleaning up...')
    await cleanup()
    console.log('Cleanup complete')
    process.exit(0)
  })

  // Set team name
  await reportTeamName('Simulation Alpha')
  console.log('Set team name: Simulation Alpha')

  // Initialize all agents as idle
  for (const agent of AGENTS) {
    if (shuttingDown) break
    await reportAgentStatus(agent.id, 'idle', agent.name)
  }
  console.log('All 8 agents initialized as idle')

  await reportTerminalLine('Simulation started -- waterfall workflow beginning', 'system')

  // Cycle through agents in waterfall order
  for (const agent of AGENTS) {
    if (shuttingDown) break

    console.log(`Phase: ${agent.phase} (${agent.id})`)

    // Set agent to active
    await reportAgentStatus(agent.id, 'active', agent.name)
    await sleep(500)

    // Write terminal lines with delays
    const lines = TERMINAL_LINES[agent.id] ?? []
    for (const line of lines) {
      if (shuttingDown) break
      await reportTerminalLine(line, 'stdout')
      // Vary delay between 1-2 seconds for realistic pacing
      await sleep(1000 + Math.floor(Math.random() * 1000))
    }

    // At execution-agent phase: write artifacts
    if (agent.id === 'execution-agent') {
      for (const artifact of EXECUTION_ARTIFACTS) {
        if (shuttingDown) break
        await reportArtifact(artifact.name, artifact.path, artifact.type)
        await reportTerminalLine(`[execution] Created ${artifact.name}`, 'stdout')
        await sleep(800)
      }
    }

    // Set agent to complete
    await reportAgentStatus(agent.id, 'complete', agent.name)

    // Pause between phases
    await sleep(1500)
  }

  if (!shuttingDown) {
    await reportTerminalLine('Simulation complete -- all phases finished', 'system')
    console.log('Simulation complete')
  }

  await cleanup()
}

main().catch(async (err: unknown) => {
  console.error('Simulation error:', err instanceof Error ? err.message : err)
  await cleanup()
  process.exit(1)
})
