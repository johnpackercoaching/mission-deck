interface DashboardStatsProps {
  teamCount: number
  activeAgents: number
  errorCount: number
  completedPhases: number
  totalPhases: number
}

interface StatCardProps {
  label: string
  value: number
  color: string
  testId: string
  suffix?: string
}

function StatCard({ label, value, color, testId, suffix }: StatCardProps) {
  return (
    <div
      className="bg-neutral-900/60 border border-neutral-800/60 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 hover:border-neutral-700/60 transition-colors duration-200"
      data-testid={testId}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="text-xl sm:text-2xl font-semibold tabular-nums transition-colors duration-300"
          style={{ color }}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-xs text-neutral-600 font-mono">{suffix}</span>
        )}
      </div>
      <p className="text-[11px] text-neutral-500 mt-1 uppercase tracking-wider font-medium">
        {label}
      </p>
    </div>
  )
}

export function DashboardStats({
  teamCount,
  activeAgents,
  errorCount,
  completedPhases,
  totalPhases,
}: DashboardStatsProps) {
  const progressPct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in"
      data-testid="dashboard-stats"
      role="region"
      aria-label="Dashboard summary statistics"
    >
      <StatCard
        label="Teams"
        value={teamCount}
        color="#e5e5e5"
        testId="stat-teams"
      />
      <StatCard
        label="Active Agents"
        value={activeAgents}
        color="#34d399"
        testId="stat-active"
      />
      <StatCard
        label="Errors"
        value={errorCount}
        color={errorCount > 0 ? '#f87171' : '#6b7280'}
        testId="stat-errors"
      />
      <StatCard
        label="Phase Progress"
        value={progressPct}
        color="#38bdf8"
        testId="stat-progress"
        suffix="%"
      />
    </div>
  )
}
