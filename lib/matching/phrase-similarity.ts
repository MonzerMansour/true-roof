// Developer-mode analytics: which phrase of a person's answers lines up with
// which phrase of a site's text, scored by cosine similarity between their
// embeddings. Display only. The list is still ordered by match_listings'
// whole-text cosine score alone.

export type PhrasePair = {
  // A sentence from the person's answers (needsToText).
  yours: string
  // The site sentence (listingToText) whose embedding is closest to it.
  theirs: string
  cosine: number
}

// Splits builder text into sentences. A period inside quotes (a person's own
// words, a site's description) does not end the sentence, so a quote stays
// whole.
export function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=\.)\s+/)
  const sentences: string[] = []
  let current = ""

  for (const part of parts) {
    current = current ? `${current} ${part}` : part
    const quotes = (current.match(/"/g) ?? []).length
    if (quotes % 2 === 0) {
      sentences.push(current.trim())
      current = ""
    }
  }
  if (current.trim()) sentences.push(current.trim())

  return sentences.filter(Boolean)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// For each of the person's sentences, the site sentence it is closest to.
// Highest first.
export function pairPhrases(
  yours: string[],
  yourVectors: number[][],
  theirs: string[],
  theirVectors: number[][]
): PhrasePair[] {
  if (theirs.length === 0) return []

  return yours
    .map((sentence, i) => {
      let best = 0
      let bestScore = -Infinity
      for (let j = 0; j < theirs.length; j++) {
        const score = cosineSimilarity(yourVectors[i], theirVectors[j])
        if (score > bestScore) {
          bestScore = score
          best = j
        }
      }
      return { yours: sentence, theirs: theirs[best], cosine: bestScore }
    })
    .sort((a, b) => b.cosine - a.cosine)
}
