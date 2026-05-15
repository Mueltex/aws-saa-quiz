import { useState } from 'react'
import type { Question } from '../types'

interface ExplanationProps {
  question: Question
  chosenOption: 'A' | 'B' | 'C' | 'D'
  onFlag: () => void
  flagged: boolean
}

export function Explanation({ question, chosenOption, onFlag, flagged }: ExplanationProps) {
  const [showDistractors, setShowDistractors] = useState(false)
  const isCorrect = chosenOption === question.correct

  return (
    <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className={`mb-3 text-lg font-bold ${isCorrect ? 'text-amber-400' : 'text-red-400'}`}>
        {isCorrect ? '✓ Correct' : `✗ Incorrect — correct answer: ${question.correct}`}
      </div>

      <p className="mb-4 text-sm leading-relaxed text-gray-300">{question.explanation}</p>

      <button
        onClick={() => setShowDistractors((v) => !v)}
        className="mb-3 text-xs text-sky-400 hover:text-sky-300"
      >
        {showDistractors ? 'Hide' : 'Show'} why the other options are wrong
      </button>

      {showDistractors && (
        <ul className="mb-4 space-y-2">
          {(['A', 'B', 'C', 'D'] as const)
            .filter((k) => k !== question.correct && question.distractors[k])
            .map((k) => (
              <li key={k} className="text-xs text-gray-400">
                <span className="font-bold text-gray-300">{k}:</span> {question.distractors[k]}
              </li>
            ))}
        </ul>
      )}

      <div className="flex items-center justify-between">
        <a
          href={question.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-400 underline hover:text-sky-300"
        >
          AWS Docs source
        </a>
        <button
          onClick={onFlag}
          className={`text-xs ${flagged ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'}`}
          title={flagged ? 'Unflag question' : 'Flag question as incorrect'}
        >
          {flagged ? '⚑ Flagged' : '⚐ Flag'}
        </button>
      </div>
    </div>
  )
}
