import type { Metadata } from "next"
import Link from "next/link"

import { CasePicker } from "@/components/eval/case-picker"
import { RankedResult } from "@/components/eval/ranked-result"
import { VectorChart, type ChartPoint } from "@/components/eval/vector-chart"
import { Container } from "@/components/marketing/container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { categoricalAgreement } from "@/lib/matching/categorical-score"
import { loadEvalData } from "@/lib/eval/data"
import { reduceToTwoDimensions } from "@/lib/eval/pca"
import { loadRealListingsWithEmbeddings } from "@/lib/eval/real-listings"
import { cosineSimilarity, rankSheltersForNeeds } from "@/lib/eval/similarity"
import { shelterFixtures } from "@/lib/eval/shelter-fixtures"
import { hybridScore } from "@/lib/matching/score-blend"
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
import { listingToText } from "@/lib/embeddings/text"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Embedding eval",
  description: "Dev tool: check that shelter matching embeddings pick up meaning.",
}

// A dev-only check, not part of the product. Fifty made-up shelter write-ups
// and fifty synthetic answer sets, embedded offline by
// `npm run embeddings:eval`. Picking a test case shows its survey answers,
// ranks the 50 synthetic shelters, ranks the real published listings the
// same way, and plots every embedding (synthetic and real) on one chart,
// so it is possible to see both whether the ranking makes sense and
// whether a real listing lands anywhere near the synthetic ones that
// resemble it.
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
  const realListings = await loadRealListingsWithEmbeddings()

  return (
    <Container className="py-12 sm:py-16">
      <p className="text-sm font-medium text-primary">Dev tool</p>
      <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Embedding eval
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        50 made-up shelters and 50 made-up survey answers, embedded once with
        the same model the app uses, checked against {realListings.length}{" "}
        real published listing{realListings.length === 1 ? "" : "s"}. None of
        the synthetic data is saved to the database.
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
        <EvalResults data={data} caseNumber={caseNumber} realListings={realListings} />
      )}
    </Container>
  )
}

function EvalResults({
  data,
  caseNumber,
  realListings,
}: {
  data: NonNullable<ReturnType<typeof loadEvalData>>
  caseNumber: number
  realListings: Awaited<ReturnType<typeof loadRealListingsWithEmbeddings>>
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

  const realRanked = realListings
    .map(({ listing, embedding }) => {
      const cosine = cosineSimilarity(testCase.embedding, embedding)
      const { score: categorical, factors } = categoricalAgreement(needs, listing)
      return {
        id: listing.id,
        name: listing.name,
        description: listingToText(listing),
        cosine,
        categorical,
        factors,
        score: hybridScore(cosine, categorical),
      }
    })
    .sort((a, b) => b.score - a.score)

  // One PCA run across everything so synthetic and real points share the
  // same axes and are directly comparable on the chart.
  const allVectors = [
    ...data.shelters.map((s) => s.embedding),
    ...data.needs.map((n) => n.embedding),
    ...realListings.map((r) => r.embedding),
  ]
  const projected = reduceToTwoDimensions(allVectors)

  const chartPoints: ChartPoint[] = []
  let cursor = 0
  for (const s of data.shelters) {
    const fixture = fixtureById.get(s.id)
    chartPoints.push({
      id: s.id,
      label: s.name,
      group: fixture?.kind === "parking" ? "synthetic_parking" : "synthetic_shelter",
      ...projected[cursor++],
    })
  }
  for (const n of data.needs) {
    chartPoints.push({
      id: `need-${n.caseNumber}`,
      label: `Case ${n.caseNumber}`,
      group: "synthetic_need",
      highlighted: n.caseNumber === caseNumber,
      ...projected[cursor++],
    })
  }
  for (const { listing } of realListings) {
    chartPoints.push({
      id: listing.id,
      label: `${listing.name} (real)`,
      group: "real_listing",
      ...projected[cursor++],
    })
  }

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

      <div className="space-y-10">
        <div>
          <p className="mb-1 text-sm font-medium">
            Every embedding, reduced to 2 dimensions
          </p>
          <p className="mb-3 text-sm text-muted-foreground">
            Case {caseNumber} is the larger, outlined green point. Real
            listings are outlined so they stand out from the synthetic ones
            around them. Points that land close together read as similar to
            the model, this is the same check as the ranked lists below, just
            visual.
          </p>
          <VectorChart points={chartPoints} />
        </div>

        {realRanked.length > 0 ? (
          <div>
            <p className="mb-1 text-sm font-medium">
              Real published listings, best match first
            </p>
            <p className="mb-3 text-sm text-muted-foreground">
              The {realRanked.length} real site{realRanked.length === 1 ? "" : "s"}{" "}
              currently published, checked against this synthetic test case
              with the same scoring as the app uses.
            </p>
            <ol className="space-y-3">
              {realRanked.map((listing, index) => (
                <li key={listing.id}>
                  <RankedResult
                    id={listing.id}
                    rank={index + 1}
                    name={listing.name}
                    description={listing.description}
                    score={listing.score}
                    categorical={listing.categorical}
                    cosine={listing.cosine}
                    factors={listing.factors}
                    badge="Real listing"
                  />
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <div>
          <p className="mb-1 text-sm font-medium">
            50 synthetic shelters, best match first ({data.model})
          </p>
          <p className="mb-3 text-sm text-muted-foreground">
            Match score blends two things: how close the embedded text is
            (65%, and stretched to a fuller range since raw text similarity
            rarely gets near 100%), and how the categorical fields (site
            type, pets, couples, parking status) agree (35%). Click a result
            to see which answers drove that score.
          </p>
          <ol className="space-y-3">
            {ranked.map((shelter, index) => (
              <li key={shelter.id}>
                <RankedResult
                  id={shelter.id}
                  rank={index + 1}
                  name={shelter.name}
                  description={shelter.description}
                  score={shelter.score}
                  categorical={shelter.categorical}
                  cosine={shelter.cosine}
                  factors={shelter.factors}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
