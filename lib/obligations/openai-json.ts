// Server only. Never import this from a client component.
//
// One structured-output call to OpenAI. Used by the deadline reader (a typed
// sentence) and the scanner (a photo). Neither request nor reply is logged.

const DEFAULT_MODEL = "gpt-4.1-mini"

// Also reads photos, so it must be a model that accepts images.
export function readerModel() {
  return process.env.DEADLINE_MODEL || DEFAULT_MODEL
}

export function isReaderConfigured() {
  return Boolean(process.env.OPENAI_API_KEY)
}

type UserContent =
  | string
  | (
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } }
    )[]

export async function readJson<T>({
  name,
  schema,
  instructions,
  content,
}: {
  name: string
  schema: Record<string, unknown>
  instructions: string
  content: UserContent
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.")

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: readerModel(),
      temperature: 0,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name, strict: true, schema },
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Reader request failed (${response.status}). ${body.slice(0, 300)}`)
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string | null; refusal?: string | null } }[]
  }
  const message = json.choices?.[0]?.message
  if (message?.refusal) throw new Error("Reader refused.")
  if (!message?.content) throw new Error("Reader returned nothing.")

  return JSON.parse(message.content) as T
}

export function todayLine(today: string) {
  const weekday = new Date(`${today}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" })
  return `Today is ${weekday}, ${today}.`
}
