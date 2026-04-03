export type TimeRange = '1h' | '6h' | '24h' | '7d' | 'all'

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: 'all', label: 'All' },
]

const RANGE_MS: Record<TimeRange, number> = {
  '1h': 3_600_000,
  '6h': 21_600_000,
  '24h': 86_400_000,
  '7d': 604_800_000,
  all: Infinity,
}

export function getTimeRangeMs(range: TimeRange): number {
  return RANGE_MS[range]
}

interface TimelineFilterProps {
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
  eventCount: number
}

export function TimelineFilter({ selectedRange, onRangeChange, eventCount }: TimelineFilterProps) {
  return (
    <div className="flex items-center justify-between gap-3" data-testid="timeline-filter">
      <div
        role="radiogroup"
        aria-label="Filter timeline by time range"
        className="flex items-center gap-1"
      >
        {RANGES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selectedRange === value}
            data-testid={`timeline-range-${value}`}
            onClick={() => onRangeChange(value)}
            className={`focus-ring text-[10px] font-medium px-2 py-0.5 rounded transition-colors duration-100 ${
              selectedRange === value
                ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 border border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <span className="text-[10px] text-neutral-600 font-mono tabular-nums" aria-live="polite">
        {eventCount} {eventCount === 1 ? 'event' : 'events'}
      </span>
    </div>
  )
}
