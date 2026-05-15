import { useEffect } from 'react'
import type { Session } from '../types'
import type { StatsData } from '../hooks/useStats'
import { DOMAIN_COLORS } from '../data/sets-manifest'

interface StatsScreenProps {
  stats: StatsData
  onPracticeWeak: () => void
  onBack: () => void
}

function ActivityCalendar({ sessions }: { sessions: Session[] }) {
  const weeks = 8
  const days = weeks * 7
  const now = new Date()

  const dayCounts: Record<string, number> = {}
  for (const s of sessions) {
    const day = new Date(s.startTime).toISOString().slice(0, 10)
    dayCounts[day] = (dayCounts[day] ?? 0) + s.total
  }

  const cells: { date: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    cells.push({ date: key, count: dayCounts[key] ?? 0 })
  }

  function cellColor(count: number) {
    if (count === 0) return 'bg-gray-800'
    if (count < 10) return 'bg-amber-900'
    if (count < 30) return 'bg-amber-700'
    return 'bg-amber-400'
  }

  const columns: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) {
    columns.push(cells.slice(i, i + 7))
  }

  return (
    <div className="flex gap-1">
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-1">
          {col.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} questions`}
              className={`h-3 w-3 rounded-sm ${cellColor(cell.count)}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export function StatsScreen({ stats, onPracticeWeak, onBack }: StatsScreenProps) {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const trendIcon = (t: string) =>
    t === 'up' ? '↑' : t === 'down' ? '↓' : t === 'new' ? 'NEW' : '→'

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-200">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-100">Statistics</h1>
      </div>

      {/* Streak */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl border border-gray-800 bg-gray-900 p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">{stats.streak.current}</div>
          <div className="text-xs text-gray-500">day streak</div>
        </div>
        <div className="flex-1 rounded-2xl border border-gray-800 bg-gray-900 p-4 text-center">
          <div className="text-3xl font-bold text-gray-100">{stats.streak.longest}</div>
          <div className="text-xs text-gray-500">longest streak</div>
        </div>
        <div className="flex-1 rounded-2xl border border-gray-800 bg-gray-900 p-4 text-center">
          <div className="text-3xl font-bold text-gray-100">{stats.overallAccuracy}%</div>
          <div className="text-xs text-gray-500">accuracy</div>
        </div>
      </div>

      {/* Domain breakdown */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
          Domain Breakdown
        </h2>
        <div className="flex flex-col gap-3">
          {stats.domainStats.length === 0 && (
            <p className="text-sm text-gray-600">No data yet. Complete a quiz first.</p>
          )}
          {stats.domainStats.map((d) => (
            <div
              key={d.domain}
              className="rounded-xl border border-gray-800 bg-gray-900 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${DOMAIN_COLORS[d.domain]}`}
                >
                  {d.domain}
                </span>
                <span className="text-sm font-bold text-gray-100">
                  {d.correct}/{d.total} ({d.pct}%){' '}
                  <span
                    className={
                      d.trend === 'up'
                        ? 'text-amber-400'
                        : d.trend === 'down'
                        ? 'text-red-400'
                        : 'text-gray-500'
                    }
                  >
                    {trendIcon(d.trend)}
                  </span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-800">
                <div
                  className="h-2 rounded-full bg-amber-400"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Activity calendar */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
          Activity — last 8 weeks
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900 p-4">
          <ActivityCalendar sessions={stats.sessions} />
        </div>
      </section>

      {/* Weak spots */}
      {stats.weakestDomain && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
            Weakest Domain
          </h2>
          <div className="rounded-xl border border-red-900 bg-red-950 p-4">
            <p className="text-sm font-bold text-red-300">{stats.weakestDomain.domain}</p>
            <p className="mb-3 text-xs text-red-400">{stats.weakestDomain.pct}% accuracy</p>
            <button
              onClick={onPracticeWeak}
              className="w-full rounded-xl bg-red-500 py-3 text-sm font-bold text-white"
            >
              Practice Weak Spots
            </button>
          </div>
        </section>
      )}

      {/* Session history */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
          Recent Sessions
        </h2>
        {stats.sessions.length === 0 && (
          <p className="text-sm text-gray-600">No sessions yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {stats.sessions.slice(0, 20).map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-xs"
            >
              <div className="text-gray-400">
                {new Date(s.startTime).toLocaleDateString()} — {s.mode}
              </div>
              <div className="text-gray-300">
                {s.score}/{s.total}{' '}
                <span className="text-gray-500">
                  ({Math.round((s.score / s.total) * 100)}%)
                </span>{' '}
                <span className="text-gray-600">{formatDuration(s.endTime - s.startTime)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
