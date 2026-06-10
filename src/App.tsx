import { useState, useEffect, useCallback } from 'react'
import type { Question, QuizMode } from './types'
import { SETS } from './data/sets-manifest'
import { useStats } from './hooks/useStats'
import { useQuiz } from './hooks/useQuiz'
import { getSessionHistory } from './db/queries'
import { HomeScreen } from './components/HomeScreen'
import { QuizCard } from './components/QuizCard'
import { StatsScreen } from './components/StatsScreen'

type Screen = 'home' | 'quiz' | 'stats' | 'results'

interface ActiveSet {
  setId: string
  mode: QuizMode
}

function useSetProgress(refreshKey: number) {
  const [progress, setProgress] = useState<Record<string, { answered: number; correct: number }>>({})

  useEffect(() => {
    getSessionHistory().then((sessions) => {
      const p: Record<string, { answered: number; correct: number }> = {}
      for (const s of sessions) {
        if (!p[s.setId]) p[s.setId] = { answered: 0, correct: 0 }
        p[s.setId].answered += s.total
        p[s.setId].correct += s.score
      }
      setProgress(p)
    })
  }, [refreshKey])

  return progress
}

async function loadQuestionsForSet(setId: string): Promise<Question[]> {
  try {
    const m = await import(`./data/questions/${setId}.json`)
    return m.default as Question[]
  } catch {
    return []
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [active, setActive] = useState<ActiveSet>({ setId: '', mode: 'random' })
  const [refreshKey, setRefreshKey] = useState(0)

  const stats = useStats()
  const setProgress = useSetProgress(refreshKey)
  const { state: quiz, loadQuestions, choose, next, flag } = useQuiz(active.setId, active.mode)

  const startQuiz = useCallback(async (setId: string, mode: QuizMode) => {
    setActive({ setId, mode })
    setScreen('quiz')
    const questions = await loadQuestionsForSet(setId)
    await loadQuestions(questions, mode)
  }, [loadQuestions])

  const handlePracticeWeak = useCallback(async () => {
    const allQuestions: Question[] = []
    for (const set of SETS) {
      const qs = await loadQuestionsForSet(set.id)
      allQuestions.push(...qs)
    }
    setActive({ setId: 'weak-practice', mode: 'weak-first' })
    setScreen('quiz')
    await loadQuestions(allQuestions)
  }, [loadQuestions])

  const handleExamSim = useCallback(async () => {
    const allQuestions: Question[] = []
    for (const set of SETS) {
      const qs = await loadQuestionsForSet(set.id)
      allQuestions.push(...qs)
    }
    setActive({ setId: 'exam-sim', mode: 'exam-sim' })
    setScreen('quiz')
    await loadQuestions(allQuestions)
  }, [loadQuestions])

  const handleFinish = useCallback(() => {
    setRefreshKey((k) => k + 1)
    stats.refresh()
    setScreen('results')
  }, [stats])

  useEffect(() => {
    if (quiz.phase === 'finished' && screen === 'quiz') {
      handleFinish()
    }
  }, [quiz.phase, screen, handleFinish])

  const currentQuestion = quiz.questions[quiz.currentIndex]

  const examTimeLeft = quiz.examTimeLeft
  const timerDisplay = examTimeLeft !== null
    ? `${Math.floor(examTimeLeft / 60)}:${String(examTimeLeft % 60).padStart(2, '0')}`
    : null

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        {screen === 'home' && (
          <HomeScreen
            stats={stats}
            setProgress={setProgress}
            onStart={startQuiz}
            onPracticeWeak={handlePracticeWeak}
            onExamSim={handleExamSim}
            onStats={() => setScreen('stats')}
          />
        )}

        {screen === 'quiz' && currentQuestion && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setScreen('home')}
                className="text-sm text-gray-500 hover:text-gray-300"
              >
                ← Exit
              </button>
              {timerDisplay && (
                <span
                  className={`font-mono text-sm font-bold ${
                    (examTimeLeft ?? Infinity) < 600 ? 'text-red-400' : 'text-gray-400'
                  }`}
                >
                  {timerDisplay}
                </span>
              )}
            </div>

            <QuizCard
              question={currentQuestion}
              questionNumber={quiz.currentIndex + 1}
              total={quiz.questions.length}
              chosenOption={quiz.chosenOption}
              phase={quiz.phase === 'answered' ? 'answered' : 'question'}
              examSim={active.mode === 'exam-sim'}
              flagged={quiz.flagged.has(currentQuestion.id)}
              onChoose={choose}
              onNext={next}
              onFlag={() => flag(currentQuestion.id)}
            />
          </div>
        )}

        {screen === 'results' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-amber-400">Session Complete</h2>
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
              <div className="mb-1 text-5xl font-bold text-gray-100">
                {quiz.answers.filter((a) => a.correct).length}/{quiz.answers.length}
              </div>
              <div className="text-gray-500">
                {quiz.answers.length > 0
                  ? Math.round(
                      (quiz.answers.filter((a) => a.correct).length / quiz.answers.length) * 100
                    )
                  : 0}
                % correct
              </div>
            </div>

            {active.mode === 'exam-sim' && (
              <div className="rounded-xl border border-violet-900 bg-violet-950 p-4 text-sm text-violet-300">
                Exam simulation complete. The passing score for SAA-C03 is 720/1000 (approximately 72%).
              </div>
            )}

            {active.mode === 'pack' && (
              <div className="rounded-xl border border-amber-900 bg-amber-950 p-4 text-sm text-amber-300">
                Pack complete! Hit <strong>Retry</strong> for a fresh 15-question mix, or go back to pick another set.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => startQuiz(active.setId, active.mode)}
                className="flex-1 rounded-2xl bg-amber-400 py-4 font-bold text-gray-950"
              >
                Retry
              </button>
              <button
                onClick={() => setScreen('home')}
                className="flex-1 rounded-2xl border border-gray-700 py-4 text-gray-300"
              >
                Home
              </button>
            </div>
          </div>
        )}

        {screen === 'stats' && (
          <StatsScreen
            stats={stats}
            onPracticeWeak={handlePracticeWeak}
            onBack={() => setScreen('home')}
          />
        )}
      </div>
    </div>
  )
}
