/**
 * Question generation pipeline.
 * Run: npx ts-node scripts/generate-questions.ts --set=set-02-secure-architectures
 *
 * Generates questions per topic using Claude, anchored to AWS documentation.
 * Output: src/data/questions/{setId}.json (appended, not overwritten)
 * All generated questions start with verified: false.
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'
import type { Question } from '../src/types/index.js'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a senior AWS-certified architect (SAA-C03) creating
practice exam questions for 2026. You have deep knowledge of all current AWS services
and pricing models as of 2026.

STRICT RULES — violating any of these causes the question to be rejected:
1. All information must reflect AWS services as they exist in 2026.
   Use gp3 (not gp2) as the standard EBS volume. Use current Lambda limits.
   Include newer services where appropriate: EKS/ECS/Fargate, Bedrock concepts,
   AWS Backup, Transfer Family, etc.
2. NEVER invent numeric limits (e.g. Lambda timeout, S3 limits). If unsure, omit them.
3. The correct answer MUST be verifiable at docs.aws.amazon.com. Provide the exact URL.
4. Distractors must be real AWS services or real options — just suboptimal for the scenario.
   Never make a distractor technically impossible; it must be plausible but wrong.
5. Do NOT test memorization of obscure limits. Test architectural reasoning:
   which service/pattern best satisfies the stated requirements (cost, HA, performance,
   security, operational complexity).
6. Questions must describe a realistic company scenario. Avoid abstract "a company needs X"
   — give context: company size, existing stack, constraints, budget concern, etc.
7. Never repeat topics covered in previous questions in this batch.
8. Return ONLY valid JSON — no markdown fences, no preamble, no trailing text.`

async function generateBatch(
  topic: string,
  setId: string,
  domain: string,
  batchSize = 5
): Promise<Partial<Question>[]> {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate ${batchSize} SAA-C03 exam questions on the topic: "${topic}"
for the domain: "${domain}".

Return a JSON array of ${batchSize} objects. Each object must follow this exact schema:
{
  "topic": "${topic}",
  "difficulty": "easy" | "medium" | "hard",
  "question": "full question text",
  "scenario": "1-2 sentence company context (optional, omit key if not applicable)",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correct": "A" | "B" | "C" | "D",
  "explanation": "3-4 sentences explaining why the correct answer is best",
  "distractors": {
    "A": "why A is wrong (only if A is not correct)",
    "B": "why B is wrong (only if B is not correct)",
    "C": "why C is wrong (only if C is not correct)",
    "D": "why D is wrong (only if D is not correct)"
  },
  "source_url": "https://docs.aws.amazon.com/... (exact URL, must return 200)",
  "tags": ["tag1", "tag2"]
}

Mix difficulty: roughly 20% easy, 60% medium, 20% hard.
Distribute correct answers across A/B/C/D — do not cluster on one letter.`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

  const now = new Date()
  const version = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return parsed.map((q: Record<string, unknown>) => ({
    ...q,
    id: `${setId.split('-')[1]}-${uuid().slice(0, 8)}`,
    version,
    setId,
    domain,
    verified: false,
  }))
}

async function main() {
  const args = process.argv.slice(2)
  const dryRunIfComplete = args.includes('--dry-run-if-complete')
  const setArg = args.find((a) => a.startsWith('--set='))?.split('=')[1]

  const configPath = path.join(process.cwd(), 'scripts', 'topics-config.json')
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const sets = setArg ? config.sets.filter((s: { id: string }) => s.id === setArg) : config.sets

  let anyGenerated = false

  for (const set of sets) {
    const outputPath = path.join(process.cwd(), 'src', 'data', 'questions', `${set.id}.json`)
    const existing: Partial<Question>[] = fs.existsSync(outputPath)
      ? JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
      : []

    // Skip simulation sets that need mixed questions — handled separately
    if (set.domain === 'Mixed') {
      console.log(`Skipping ${set.id} (mixed domain — populate manually or from other sets)`)
      continue
    }

    if (dryRunIfComplete && existing.length >= set.targetCount) {
      console.log(`${set.id}: ${existing.length}/${set.targetCount} questions — skipping`)
      continue
    }

    for (const topic of set.topics) {
      console.log(`Generating: [${set.id}] ${topic}`)
      try {
        const batch = await generateBatch(topic, set.id, set.domain)
        existing.push(...batch)
        fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2))
        anyGenerated = true
        await new Promise((r) => setTimeout(r, 2000))
      } catch (err) {
        console.error(`  Error generating topic "${topic}":`, err)
      }
    }

    console.log(`Done: ${set.id} — ${existing.length} questions total`)
  }

  if (dryRunIfComplete && !anyGenerated) {
    console.log('All sets complete — nothing to generate.')
  }
}

main().catch(console.error)
