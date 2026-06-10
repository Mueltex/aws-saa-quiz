export type Difficulty = 'easy' | 'medium' | 'hard'
export type VerificationStatus = 'verified' | 'rejected' | 'needs_review'

export interface Question {
  id: string
  version: string
  setId: string
  domain: ExamDomain
  topic: string
  difficulty: Difficulty
  question: string
  scenario?: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correct: 'A' | 'B' | 'C' | 'D'
  explanation: string
  distractors: {
    [key: string]: string
  }
  source_url: string
  tags: string[]
  verified: boolean
}

export type ExamDomain =
  | 'Resilient Architectures'
  | 'High-Performing Architectures'
  | 'Secure Architectures'
  | 'Cost-Optimized Architectures'

export const DOMAIN_WEIGHTS: Record<ExamDomain, number> = {
  'Secure Architectures': 30,
  'Resilient Architectures': 26,
  'High-Performing Architectures': 24,
  'Cost-Optimized Architectures': 20,
}

export interface QuizSet {
  id: string
  name: string
  description: string
  domain: ExamDomain | 'Mixed'
  questionCount: number
}

export interface Answer {
  id: string
  questionId: string
  setId: string
  correct: boolean
  chosenOption: 'A' | 'B' | 'C' | 'D'
  timestamp: number
  timeSpentSeconds: number
}

export interface Session {
  id: string
  setId: string
  mode: QuizMode
  score: number
  total: number
  startTime: number
  endTime: number
  domainBreakdown: Record<ExamDomain, { correct: number; total: number }>
}

export type QuizMode =
  | 'sequential'
  | 'random'
  | 'weak-first'
  | 'exam-sim'
  | 'pack'

export interface DomainStat {
  domain: ExamDomain
  total: number
  correct: number
  pct: number
  trend: 'up' | 'down' | 'stable' | 'new'
}
