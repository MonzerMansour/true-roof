import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { FeaturePageShell } from "@/components/marketing/feature-page-shell"
import { features, getFeature } from "@/lib/features"

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return features.map((feature) => ({ slug: feature.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const feature = getFeature(slug)

  if (!feature) {
    return { title: "Feature" }
  }

  return {
    title: feature.title,
    description: feature.lede,
  }
}

export default async function FeaturePage({ params }: { params: Params }) {
  const { slug } = await params
  const feature = getFeature(slug)

  if (!feature) {
    notFound()
  }

  return <FeaturePageShell feature={feature} />
}
