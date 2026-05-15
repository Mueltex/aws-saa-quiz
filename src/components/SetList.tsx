import type { QuizSet, QuizMode } from '../types'
import { DOMAIN_COLORS } from '../data/sets-manifest'

interface SetProgress {
  answered: number
  correct: number
}

interface SetListProps {
  sets: QuizSet[]
  progress: Record<string, SetProgress>
  onStart: (setId: string, mode: QuizMode) => void
}

export function SetList({ sets, progress, onStart }: SetListProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {sets.map((set) => {
        const p = progress[set.id] ?? { answered: 0, correct: 0 }
        const pct = p.answered > 0 ? Math.round((p.correct / p.answered) * 100) : 0
        const hasProgress = p.answered > 0

        return (
          <div
            key={set.id}
            className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-4"
          >
            <div>
              <span
                className={`mb-2 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${DOMAIN_COLORS[set.domain] ?? DOMAIN_COLORS['Mixed']}`}
              >
                {set.domain}
              </span>
              <h3 className="text-sm font-bold leading-tight text-gray-100">{set.name}</h3>
            </div>

            {hasProgress && (
              <div>
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>{p.answered}/{set.questionCount} answered</span>
                  <span className="text-amber-400">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-800">
                  <div
                    className="h-1.5 rounded-full bg-amber-400"
                    style={{ width: `${(p.answered / set.questionCount) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => onStart(set.id, 'random')}
                className="flex-1 rounded-xl bg-amber-400 py-3 text-sm font-bold text-gray-950 transition-all active:scale-[0.98]"
              >
                {hasProgress ? 'Continue' : 'Start'}
              </button>
              <button
                onClick={() => onStart(set.id, 'sequential')}
                className="rounded-xl border border-gray-700 px-3 py-3 text-xs text-gray-400 hover:border-gray-500 hover:text-gray-200"
                title="Sequential order"
              >
                1→
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
