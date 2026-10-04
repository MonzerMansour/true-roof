// Server only. Never import this from a client component.
const DEFAULT_MODEL = "text-embedding-3-small"

export const EMBEDDING_DIMENSIONS = 1536

export function embeddingModel() {
  return process.env.EMBEDDING_MODEL || DEFAULT_MODEL
}

export function isEmbeddingsConfigured() {
  return Boolean(process.env.OPENAI_API_KEY)
}

export async function embedText(input: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.")
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: embeddingModel(), input }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Embeddings request failed (${response.status}). ${body}`)
  }

  const json = (await response.json()) as {
    data?: { embedding: number[] }[]
  }
  const embedding = json.data?.[0]?.embedding

  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Embeddings response had an unexpected shape.")
  }

  return embedding
}

// Several texts in one request. Results come back in the same order.
export async function embedTexts(inputs: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.")
  }
  if (inputs.length === 0) return []

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: embeddingModel(), input: inputs }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Embeddings request failed (${response.status}). ${body}`)
  }

  const json = (await response.json()) as {
    data?: { embedding: number[]; index: number }[]
  }
  const data = [...(json.data ?? [])].sort((a, b) => a.index - b.index)

  if (data.length !== inputs.length) {
    throw new Error("Embeddings response had an unexpected shape.")
  }

  return data.map((item) => item.embedding)
}
