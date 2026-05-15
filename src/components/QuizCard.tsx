import type { Question } from '../types'
import { Explanation } from './Explanation'
import { DOMAIN_COLORS } from '../data/sets-manifest'

interface QuizCardProps {
  question: Question
  questionNumber: number
  total: number
  chosenOption: 'A' | 'B' | 'C' | 'D' | null
  phase: 'question' | 'answered'
  examSim: boolean
  flagged: boolean
  onChoose: (opt: 'A' | 'B' | 'C' | 'D') => void
  onNext: () => void
  onFlag: () => void
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const

export function QuizCard({
  question,
  questionNumber,
  total,
  chosenOption,
  phase,
  examSim,
  flagged,
  onChoose,
  onNext,
  onFlag,
}: QuizCardProps) {
  const answered = phase === 'answered'
  const progress = ((questionNumber - 1) / total) * 100

  function optionClass(opt: (typeof OPTIONS)[number]) {
    const base =
      'w-full rounded-xl border px-4 py-4 text-left text-sm leading-snug transition-all min-h-[56px]'

    if (!answered) {
      return `${base} border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800 active:scale-[0.98]`
    }

    if (opt === question.correct) {
      return `${base} border-amber-500 bg-amber-950 text-amber-200`
    }
    if (opt === chosenOption && opt !== question.correct) {
      return `${base} border-red-500 bg-red-950 text-red-200`
    }
    return `${base} border-gray-800 bg-gray-900 text-gray-500 opacity-40`
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${DOMAIN_COLORS[question.domain] ?? DOMAIN_COLORS['Mixed']}`}
        >
          {question.domain}
        </span>
        <span className="text-xs text-gray-500">
          {questionNumber} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-gray-800">
        <div
          className="h-1 rounded-full bg-amber-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Scenario */}
      {question.scenario && (
        <div className="rounded-lg border border-sky-900 bg-sky-950 px-4 py-3 text-sm text-sky-200">
          {question.scenario}
        </div>
      )}

      {/* Question */}
      <p className="text-base font-medium leading-relaxed text-gray-100">{question.question}</p>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => !answered && onChoose(opt)}
            disabled={answered}
            className={optionClass(opt)}
          >
            <span className="mr-3 font-bold">{opt}.</span>
            {question.options[opt]}
            {answered && opt === question.correct && (
              <span className="ml-2 text-amber-400">✓</span>
            )}
            {answered && opt === chosenOption && opt !== question.correct && (
              <span className="ml-2 text-red-400">✗</span>
            )}
          </button>
        ))}
      </div>

      {/* Explanation — hidden in exam-sim until finished */}
      {answered && !examSim && chosenOption && (
        <Explanation
          question={question}
          chosenOption={chosenOption}
          onFlag={onFlag}
          flagged={flagged}
        />
      )}

      {/* Next button */}
      {answered && (
        <button
          onClick={onNext}
          className="mt-2 w-full rounded-xl bg-amber-400 py-4 text-base font-bold text-gray-950 transition-all active:scale-[0.98]"
        >
          Next →
        </button>
      )}
    </div>
  )
}
