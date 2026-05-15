import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Answer, Session } from '../types'

interface QuizDB extends DBSchema {
  answers: {
    key: string
    value: Answer
    indexes: {
      'by-question': string
      'by-set': string
      'by-correct': number
      'by-timestamp': number
    }
  }
  sessions: {
    key: string
    value: Session
    indexes: {
      'by-set': string
      'by-date': number
    }
  }
  prefs: {
    key: string
    value: string | number | boolean
  }
}

let _db: IDBPDatabase<QuizDB> | null = null

export async function getDB(): Promise<IDBPDatabase<QuizDB>> {
  if (_db) return _db
  _db = await openDB<QuizDB>('saa-quiz-db', 1, {
    upgrade(db) {
      const answersStore = db.createObjectStore('answers', { keyPath: 'id' })
      answersStore.createIndex('by-question', 'questionId')
      answersStore.createIndex('by-set', 'setId')
      answersStore.createIndex('by-correct', 'correct')
      answersStore.createIndex('by-timestamp', 'timestamp')

      const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' })
      sessionsStore.createIndex('by-set', 'setId')
      sessionsStore.createIndex('by-date', 'startTime')

      db.createObjectStore('prefs')
    },
  })
  return _db
}
