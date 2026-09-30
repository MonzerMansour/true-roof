import type { Metadata } from "next"
import Link from "next/link"

import { CasePicker } from "@/components/eval/case-picker"
import { Container } from "@/components/marketing/container"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { loadEvalData } from "@/lib/eval/data"
import { rankSheltersForNeeds } from "@/lib/eval/similarity"
import { shelterFixtures } from "@/lib/eval/shelter-fixtures"
import {
  formatTime,
  householdLabel,
  idLabel,
  latestEntryLabel,
  partnerRoomsLabel,
  petLabel,
  stayLabel,
  vehicleLabel,
  vehicleRegisteredLabel,
  vehicleSizeLabel,
} from "@/lib/matching/needs"

export const metadata: Metadata = {
  title: "Embedding eval",
  description: "Dev tool: check that shelter matching embeddings pick up meaning.",
}

// A dev-only check, not part of the product. Fifty made-up shelter write-ups
// and fifty synthetic answer sets, embedded offline by
// `npm run embeddings:eval`. Picking a test case shows its survey answers
// and ranks the 50 shelters by cosine similarity, best match first, so we
// can eyeball whether the ranking makes sense or is just noise.
export default async function EmbeddingEvalPage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string }>
}) {
  const data = loadEvalData()
  const { case: caseParam } = await searchParams
  const caseNumber = Math.min(
    Math.max(1, Number(caseParam) || 1),
    data?.needs.length ?? 1
  )

  return (
    <Container className="py-12 sm:py-16">
      <p className="text-sm font-medium text-primary">Dev tool</p>
      <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Embedding eval
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        50 made-up shelters and 50 made-up survey answers, embedded once with
        the same model the app uses. Pick a test case to see its answers and
        how the 50 shelters rank by similarity. None of this is real data
        and none of it is saved to the database.
      </p>

      {!data ? (
        <Card className="mt-8 max-w-xl">
          <CardHeader>
            <CardTitle>No eval data yet</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Run <code className="rounded bg-muted px-1.5 py-0.5">npm run embeddings:eval</code>{" "}
            with <code className="rounded bg-muted px-1.5 py-0.5">OPENAI_API_KEY</code> set in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code>, then reload this
            page.
          </CardContent>
        </Card>
      ) : (
        <EvalResults data={data} caseNumber={caseNumber} />
      )}
    </Container>
  )
}

function EvalResults({
  data,
  caseNumber,
}: {
  data: NonNullable<ReturnType<typeof loadEvalData>>
  caseNumber: number
}) {
  const testCase = data.needs.find((n) => n.caseNumber === caseNumber)

  if (!testCase) return null

  const fixtureById = new Map(shelterFixtures.map((f) => [f.id, f]))
  const shelters = data.shelters.map((s) => ({
    ...s,
    fixture: fixtureById.get(s.id) ?? shelterFixtures[0],
  }))
  const ranked = rankSheltersForNeeds(testCase.needs, testCase.embedding, shelters)
  const needs = testCase.needs

  const attributes: [string, string][] = [
    ["Household", householdLabel[needs.household]],
    ...(needs.partnerRooms
      ? ([["Rooms", partnerRoomsLabel[needs.partnerRooms]]] as [string, string][])
      : []),
    [
      "Pet",
      needs.petWeightLbs
        ? `${petLabel[needs.pet]}, about ${needs.petWeightLbs} pounds`
        : petLabel[needs.pet],
    ],
    ["Photo ID", idLabel[needs.idStatus]],
    ["Vehicle", vehicleLabel[needs.vehicle]],
    ...(needs.vehicleSize
      ? ([["Vehicle size", vehicleSizeLabel[needs.vehicleSize]]] as [string, string][])
      : []),
    ...(needs.vehicleRegistered
      ? ([
          ["Vehicle registered", vehicleRegisteredLabel[needs.vehicleRegistered]],
        ] as [string, string][])
      : []),
    ["Can check in", `${formatTime(needs.arrivalFrom)} to ${formatTime(needs.arrivalTo)}`],
    ["Late entry", latestEntryLabel(needs.latestEntry)],
    ["Bed needed", stayLabel(needs.daysNeeded)],
  ]

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium">Test case</p>
          <CasePicker count={data.needs.length} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Survey answers, case {caseNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              {attributes.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 py-2 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 text-sm">
          {caseNumber > 1 ? (
            <Link
              href={`/dev/embedding-eval?case=${caseNumber - 1}`}
              className="underline underline-offset-4"
            >
              Previous case
            </Link>
          ) : null}
          {caseNumber < data.needs.length ? (
            <Link
              href={`/dev/embedding-eval?case=${caseNumber + 1}`}
              className="underline underline-offset-4"
            >
              Next case
            </Link>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">
          50 shelters, best match first ({data.model})
        </p>
        <p className="mb-3 text-sm text-muted-foreground">
          Match score blends two things: how the categorical fields (site
          type, pets, couples, parking status) agree, weighted more, and how
          close the embedded text is, weighted less. Both show separately so
          the blend is never hidden behind one number.
        </p>
        <ol className="space-y-3">
          {ranked.map((shelter, index) => (
            <li key={shelter.id}>
              <Card>
                <CardContent className="flex gap-4 py-4">
                  <span className="font-heading w-8 shrink-0 text-lg text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{shelter.name}</span>
                      <Badge>{(shelter.score * 100).toFixed(1)}% match</Badge>
                      <Badge variant="outline">
                        {(shelter.categorical * 100).toFixed(0)}% fields
                      </Badge>
                      <Badge variant="outline">
                        {(shelter.cosine * 100).toFixed(0)}% text
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {shelter.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
