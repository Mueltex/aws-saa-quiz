import { getDB } from './schema'
import type { Answer, Session, DomainStat, ExamDomain } from '../types'

export async function saveAnswer(answer: Answer): Promise<void> {
  const db = await getDB()
  await db.put('answers', answer)
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDB()
  await db.put('sessions', session)
}

export async function getWeakQuestionIds(limit = 20): Promise<string[]> {
  const db = await getDB()
  const all = await db.getAll('answers')

  const byQuestion: Record<string, { correct: number; total: number }> = {}
  for (const a of all) {
    if (!byQuestion[a.questionId]) byQuestion[a.questionId] = { correct: 0, total: 0 }
    byQuestion[a.questionId].total++
    if (a.correct) byQuestion[a.questionId].correct++
  }

  return Object.entries(byQuestion)
    .filter(([, stats]) => stats.total >= 2)
    .sort(([, a], [, b]) => a.correct / a.total - b.correct / b.total)
    .slice(0, limit)
    .map(([id]) => id)
}

export async function getDomainStats(): Promise<DomainStat[]> {
  const db = await getDB()
  const sessions = await db.getAll('sessions')

  const totals: Record<string, { correct: number; total: number; recent: number[] }> = {}

  for (const s of sessions) {
    for (const [domain, stats] of Object.entries(s.domainBreakdown)) {
      if (!totals[domain]) totals[domain] = { correct: 0, total: 0, recent: [] }
      totals[domain].correct += stats.correct
      totals[domain].total += stats.total
      if (stats.total > 0) {
        totals[domain].recent.push(stats.correct / stats.total)
      }
    }
  }

  return Object.entries(totals).map(([domain, stats]) => {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    const recent = stats.recent.slice(-3)
    const avg = recent.length > 1 ? recent.reduce((a, b) => a + b, 0) / recent.length : pct / 100
    const trend =
      stats.recent.length < 2
        ? 'new'
        : avg > pct / 100 + 0.05
        ? 'up'
        : avg < pct / 100 - 0.05
        ? 'down'
        : 'stable'

    return { domain: domain as ExamDomain, total: stats.total, correct: stats.correct, pct, trend }
  })
}

export async function getSessionHistory(setId?: string): Promise<Session[]> {
  const db = await getDB()
  const all = setId
    ? await db.getAllFromIndex('sessions', 'by-set', setId)
    : await db.getAll('sessions')
  return all.sort((a, b) => b.startTime - a.startTime).slice(0, 50)
}

export async function getStreak(): Promise<{ current: number; longest: number }> {
  const db = await getDB()
  const sessions = await db.getAll('sessions')
  if (sessions.length === 0) return { current: 0, longest: 0 }

  const days = new Set(
    sessions.map((s) => new Date(s.startTime).toISOString().slice(0, 10))
  )
  const sortedDays = [...days].sort().reverse()

  let current = 0
  let longest = 0
  let streak = 0
  let prev: string | null = null

  for (const day of sortedDays) {
    if (prev === null) {
      const today = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      if (day !== today && day !== yesterday) break
      streak = 1
    } else {
      const prevDate = new Date(prev)
      const currDate = new Date(day)
      const diff = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000)
      if (diff === 1) streak++
      else break
    }
    current = streak
    longest = Math.max(longest, streak)
    prev = day
  }

  return { current, longest }
}

export async function getAnswersForQuestion(questionId: string): Promise<Answer[]> {
  const db = await getDB()
  return db.getAllFromIndex('answers', 'by-question', questionId)
}

export async function getPref<T>(key: string, fallback: T): Promise<T> {
  const db = await getDB()
  const val = await db.get('prefs', key)
  return val !== undefined ? (val as T) : fallback
}

export async function setPref(key: string, value: string | number | boolean): Promise<void> {
  const db = await getDB()
  await db.put('prefs', value, key)
}
