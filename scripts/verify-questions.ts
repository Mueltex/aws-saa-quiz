/**
 * Verification pipeline — runs AFTER generation.
 * Run: npx ts-node scripts/verify-questions.ts
 *
 * For each question with verified: false, runs two checks:
 *   A. LLM-as-judge: second Claude call reviews correctness, currency, quality
 *   B. URL check: fetches source_url and verifies it returns 200
 *
 * Updates verified: true | false in place.
 * Writes scripts/verification-report.json with full audit trail.
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import type { Question } from '../src/types/index.js'

const client = new Anthropic()

const VERIFIER_SYSTEM = `You are an independent AWS certification expert verifying
practice exam questions for the SAA-C03 exam (2026). You did NOT write these questions.
Your job is to find errors, outdated information, and ambiguous questions.

Be strict. Flag anything you are not 100% sure about.
Return ONLY valid JSON — no markdown, no preamble.`

interface VerificationResult {
  questionId: string
  answer_correct: boolean
  correct_answer?: string
  issues: string[]
  outdated: boolean
  outdated_reason?: string
  ambiguous: boolean
  confidence: number
  verdict: 'PASS' | 'FAIL' | 'NEEDS_REVIEW'
  url_ok?: boolean
}

async function verifyQuestion(q: Question): Promise<VerificationResult> {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1000,
    system: VERIFIER_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Verify this SAA-C03 practice question. Think step by step, then return JSON.

QUESTION:
${q.question}
${q.scenario ? `SCENARIO: ${q.scenario}` : ''}

OPTIONS:
A: ${q.options.A}
B: ${q.options.B}
C: ${q.options.C}
D: ${q.options.D}

STATED CORRECT ANSWER: ${q.correct}
STATED EXPLANATION: ${q.explanation}
SOURCE URL: ${q.source_url}

Return this JSON:
{
  "answer_correct": true/false,
  "correct_answer": "letter if different from stated, else null",
  "issues": ["list all problems you found, empty array if none"],
  "outdated": true/false,
  "outdated_reason": "explanation if outdated, else null",
  "ambiguous": true/false,
  "confidence": 0-100,
  "reasoning": "your step-by-step analysis"
}`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const llmResult = JSON.parse(raw.replace(/```json|```/g, '').trim())

  let url_ok = false
  try {
    const res = await fetch(q.source_url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    url_ok = res.ok
  } catch {
    url_ok = false
  }

  const failed =
    !llmResult.answer_correct ||
    llmResult.outdated ||
    !url_ok ||
    llmResult.issues.length > 2

  const needsReview =
    !failed && (llmResult.confidence < 80 || llmResult.ambiguous || llmResult.issues.length > 0)

  const verdict: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' = failed
    ? 'FAIL'
    : needsReview
    ? 'NEEDS_REVIEW'
    : 'PASS'

  return {
    questionId: q.id,
    answer_correct: llmResult.answer_correct,
    correct_answer: llmResult.correct_answer,
    issues: llmResult.issues,
    outdated: llmResult.outdated,
    outdated_reason: llmResult.outdated_reason,
    ambiguous: llmResult.ambiguous,
    confidence: llmResult.confidence,
    verdict,
    url_ok,
  }
}

async function main() {
  const questionsDir = path.join(process.cwd(), 'src', 'data', 'questions')
  const files = fs.readdirSync(questionsDir).filter((f) => f.endsWith('.json'))

  const report = {
    runAt: new Date().toISOString(),
    total: 0,
    passed: 0,
    failed: 0,
    needsReview: 0,
    results: [] as VerificationResult[],
  }

  for (const file of files) {
    const filePath = path.join(questionsDir, file)
    const questions: (Question & { _rejection_reason?: string; _needs_review?: boolean; _review_reason?: string })[] =
      JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const pending = questions.filter((q) => !q.verified)

    if (pending.length === 0) {
      console.log(`${file}: all questions already verified, skipping`)
      continue
    }

    console.log(`${file}: verifying ${pending.length} questions...`)

    for (const q of pending) {
      console.log(`  Verifying ${q.id}...`)
      const result = await verifyQuestion(q)
      report.results.push(result)
      report.total++

      const idx = questions.findIndex((x) => x.id === q.id)
      if (result.verdict === 'PASS') {
        questions[idx].verified = true
        report.passed++
      } else if (result.verdict === 'FAIL') {
        questions[idx].verified = false
        questions[idx]._rejection_reason = result.issues.join('; ')
        report.failed++
      } else {
        questions[idx]._needs_review = true
        questions[idx]._review_reason = result.issues.join('; ')
        report.needsReview++
      }

      await new Promise((r) => setTimeout(r, 1500))
    }

    fs.writeFileSync(filePath, JSON.stringify(questions, null, 2))
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'scripts', 'verification-report.json'),
    JSON.stringify(report, null, 2)
  )

  console.log('\n=== VERIFICATION SUMMARY ===')
  console.log(`Total:        ${report.total}`)
  console.log(`Passed:       ${report.passed}`)
  console.log(`Failed:       ${report.failed}`)
  console.log(`Needs review: ${report.needsReview}`)
  console.log('Full report: scripts/verification-report.json')
}

main().catch(console.error)
