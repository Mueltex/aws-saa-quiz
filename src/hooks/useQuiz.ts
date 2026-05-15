import { useState, useCallback, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import type { Question, Answer, Session, QuizMode, ExamDomain } from '../types'
import { saveAnswer, saveSession, getWeakQuestionIds } from '../db/queries'

interface QuizState {
  questions: Question[]
  currentIndex: number
  chosenOption: 'A' | 'B' | 'C' | 'D' | null
  answers: Answer[]
  phase: 'idle' | 'question' | 'answered' | 'finished'
  sessionId: string
  startTime: number
  questionStartTime: number
  examTimeLeft: number | null
  flagged: Set<string>
}

const EXAM_DURATION_SECONDS = 130 * 60

export function useQuiz(setId: string, mode: QuizMode) {
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    chosenOption: null,
    answers: [],
    phase: 'idle',
    sessionId: uuid(),
    startTime: Date.now(),
    questionStartTime: Date.now(),
    examTimeLeft: mode === 'exam-sim' ? EXAM_DURATION_SECONDS : null,
    flagged: new Set(),
  })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadQuestions = useCallback(
    async (allQuestions: Question[]) => {
      let ordered = allQuestions.filter((q) => q.verified)

      if (mode === 'random' || mode === 'exam-sim') {
        ordered = [...ordered].sort(() => Math.random() - 0.5)
        if (mode === 'exam-sim') ordered = ordered.slice(0, 65)
      } else if (mode === 'weak-first') {
        const weakIds = await getWeakQuestionIds(20)
        const weakSet = new Set(weakIds)
        const weak = ordered.filter((q) => weakSet.has(q.id))
        const rest = ordered.filter((q) => !weakSet.has(q.id)).sort(() => Math.random() - 0.5)
        ordered = [...weak, ...rest]
      }

      const now = Date.now()

      setState((prev) => ({
        ...prev,
        questions: ordered,
        currentIndex: 0,
        chosenOption: null,
        answers: [],
        phase: ordered.length > 0 ? 'question' : 'finished',
        sessionId: uuid(),
        startTime: now,
        questionStartTime: now,
        examTimeLeft: mode === 'exam-sim' ? EXAM_DURATION_SECONDS : null,
        flagged: new Set(),
      }))

      if (mode === 'exam-sim') {
        timerRef.current = setInterval(() => {
          setState((prev) => {
            if (prev.examTimeLeft === null || prev.examTimeLeft <= 0) {
              clearInterval(timerRef.current!)
              return { ...prev, phase: 'finished', examTimeLeft: 0 }
            }
            return { ...prev, examTimeLeft: prev.examTimeLeft - 1 }
          })
        }, 1000)
      }
    },
    [mode]
  )

  const choose = useCallback((option: 'A' | 'B' | 'C' | 'D') => {
    setState((prev) => {
      if (prev.phase !== 'question') return prev
      const q = prev.questions[prev.currentIndex]
      const now = Date.now()
      const timeSpent = Math.round((now - prev.questionStartTime) / 1000)

      const answer: Answer = {
        id: uuid(),
        questionId: q.id,
        setId: q.setId,
        correct: option === q.correct,
        chosenOption: option,
        timestamp: now,
        timeSpentSeconds: timeSpent,
      }

      saveAnswer(answer)

      if (prev.phase === 'question' && mode === 'exam-sim') {
        // In exam-sim, don't reveal feedback — just record and advance
        const newAnswers = [...prev.answers, answer]
        const nextIndex = prev.currentIndex + 1
        if (nextIndex >= prev.questions.length) {
          clearInterval(timerRef.current!)
          finishSession(prev.sessionId, setId, mode, newAnswers, prev.questions, prev.startTime)
          return { ...prev, answers: newAnswers, phase: 'finished' }
        }
        return {
          ...prev,
          answers: newAnswers,
          currentIndex: nextIndex,
          chosenOption: null,
          questionStartTime: Date.now(),
        }
      }

      return { ...prev, chosenOption: option, answers: [...prev.answers, answer], phase: 'answered' }
    })
  }, [mode, setId])

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'answered') return prev
      const nextIndex = prev.currentIndex + 1
      if (nextIndex >= prev.questions.length) {
        clearInterval(timerRef.current!)
        finishSession(prev.sessionId, setId, mode, prev.answers, prev.questions, prev.startTime)
        return { ...prev, phase: 'finished' }
      }
      return {
        ...prev,
        currentIndex: nextIndex,
        chosenOption: null,
        phase: 'question',
        questionStartTime: Date.now(),
      }
    })
  }, [setId, mode])

  const flag = useCallback((questionId: string) => {
    setState((prev) => {
      const next = new Set(prev.flagged)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return { ...prev, flagged: next }
    })
  }, [])

  return { state, loadQuestions, choose, next, flag }
}

function finishSession(
  sessionId: string,
  setId: string,
  mode: QuizMode,
  answers: Answer[],
  questions: Question[],
  startTime: number
) {
  const domainBreakdown: Record<string, { correct: number; total: number }> = {}
  for (const q of questions) {
    if (!domainBreakdown[q.domain]) domainBreakdown[q.domain] = { correct: 0, total: 0 }
    const ans = answers.find((a) => a.questionId === q.id)
    if (ans) {
      domainBreakdown[q.domain].total++
      if (ans.correct) domainBreakdown[q.domain].correct++
    }
  }

  const session: Session = {
    id: sessionId,
    setId,
    mode,
    score: answers.filter((a) => a.correct).length,
    total: answers.length,
    startTime,
    endTime: Date.now(),
    domainBreakdown: domainBreakdown as Record<ExamDomain, { correct: number; total: number }>,
  }

  saveSession(session)
}
