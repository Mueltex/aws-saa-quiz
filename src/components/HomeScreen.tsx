import type { QuizMode } from '../types'
import type { StatsData } from '../hooks/useStats'
import { SETS } from '../data/sets-manifest'
import { SetList } from './SetList'
import { InstallPrompt } from './InstallPrompt'

interface HomeScreenProps {
  stats: StatsData
  setProgress: Record<string, { answered: number; correct: number }>
  onStart: (setId: string, mode: QuizMode) => void
  onPracticeWeak: () => void
  onExamSim: () => void
  onStats: () => void
}

export function HomeScreen({
  stats,
  setProgress,
  onStart,
  onPracticeWeak,
  onExamSim,
  onStats,
}: HomeScreenProps) {
  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-lg font-bold text-amber-400">AWS SAA-C03</h1>
        <div className="flex items-center gap-3">
          {stats.streak.current > 0 && (
            <span className="rounded-full border border-amber-700 bg-amber-950 px-3 py-1 text-sm text-amber-400">
              {stats.streak.current} day streak
            </span>
          )}
          <button
            onClick={onStats}
            className="rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-gray-200"
          >
            Stats
          </button>
        </div>
      </div>

      {/* Metric cards */}
      {stats.totalAnswered > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Accuracy" value={`${stats.overallAccuracy}%`} />
          <MetricCard label="Answered" value={stats.totalAnswered.toString()} />
          {stats.weakestDomain && (
            <MetricCard
              label="Weakest"
              value={`${stats.weakestDomain.pct}%`}
              sub={stats.weakestDomain.domain.split(' ')[0]}
              accent="text-red-400"
            />
          )}
          {stats.strongestDomain && (
            <MetricCard
              label="Strongest"
              value={`${stats.strongestDomain.pct}%`}
              sub={stats.strongestDomain.domain.split(' ')[0]}
              accent="text-amber-400"
            />
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onPracticeWeak}
          className="flex-1 rounded-2xl border border-red-900 bg-red-950 px-4 py-5 text-left transition-all active:scale-[0.98]"
        >
          <div className="mb-1 text-sm font-bold text-red-300">Practice Weak Spots</div>
          <div className="text-xs text-red-500">Top 20 most-failed questions</div>
        </button>
        <button
          onClick={onExamSim}
          className="flex-1 rounded-2xl border border-violet-900 bg-violet-950 px-4 py-5 text-left transition-all active:scale-[0.98]"
        >
          <div className="mb-1 text-sm font-bold text-violet-300">Exam Simulation</div>
          <div className="text-xs text-violet-500">65 questions · 130 min · no feedback</div>
        </button>
      </div>

      {/* Install prompt */}
      <InstallPrompt />

      {/* Set grid */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
          Question Sets
        </h2>
        <SetList sets={SETS} progress={setProgress} onStart={onStart} />
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  accent = 'text-gray-100',
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-center">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  )
}
