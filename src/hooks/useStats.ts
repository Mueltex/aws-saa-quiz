import { useState, useEffect } from 'react'
import type { DomainStat, Session } from '../types'
import { getDomainStats, getSessionHistory, getStreak } from '../db/queries'

export interface StatsData {
  domainStats: DomainStat[]
  sessions: Session[]
  streak: { current: number; longest: number }
  totalAnswered: number
  overallAccuracy: number
  weakestDomain: DomainStat | null
  strongestDomain: DomainStat | null
  loading: boolean
}

export function useStats(): StatsData & { refresh: () => void } {
  const [data, setData] = useState<StatsData>({
    domainStats: [],
    sessions: [],
    streak: { current: 0, longest: 0 },
    totalAnswered: 0,
    overallAccuracy: 0,
    weakestDomain: null,
    strongestDomain: null,
    loading: true,
  })

  const load = async () => {
    const [domainStats, sessions, streak] = await Promise.all([
      getDomainStats(),
      getSessionHistory(),
      getStreak(),
    ])

    const totalAnswered = domainStats.reduce((s, d) => s + d.total, 0)
    const totalCorrect = domainStats.reduce((s, d) => s + d.correct, 0)
    const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

    const sorted = [...domainStats].sort((a, b) => a.pct - b.pct)
    const weakestDomain = sorted[0] ?? null
    const strongestDomain = sorted[sorted.length - 1] ?? null

    setData({
      domainStats,
      sessions,
      streak,
      totalAnswered,
      overallAccuracy,
      weakestDomain,
      strongestDomain,
      loading: false,
    })
  }

  useEffect(() => { load() }, [])

  return { ...data, refresh: load }
}
