"use client"

export type ChartPoint = {
  id: string
  label: string
  group: "synthetic_shelter" | "synthetic_parking" | "synthetic_need" | "real_listing"
  x: number
  y: number
  highlighted?: boolean
}

const GROUP_COLOR: Record<ChartPoint["group"], string> = {
  synthetic_shelter: "#6250d6",
  synthetic_parking: "#d95926",
  synthetic_need: "#1baf7a",
  real_listing: "#199e70",
}

const GROUP_LABEL: Record<ChartPoint["group"], string> = {
  synthetic_shelter: "Synthetic shelters",
  synthetic_parking: "Synthetic safe parking",
  synthetic_need: "Synthetic survey answers",
  real_listing: "Real listings",
}

// Plain inline SVG, no charting library. Points are already reduced to 2D
// by lib/eval/pca.ts on the server; this only lays them out and draws
// them, plus a hover tooltip using native <title>.
export function VectorChart({ points }: { points: ChartPoint[] }) {
  const width = 640
  const height = 440
  const pad = 24

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  const xSpan = xMax - xMin || 1
  const ySpan = yMax - yMin || 1

  function toSvgX(x: number) {
    return pad + ((x - xMin) / xSpan) * (width - pad * 2)
  }
  function toSvgY(y: number) {
    // Flip y: SVG y grows downward, we want up.
    return height - pad - ((y - yMin) / ySpan) * (height - pad * 2)
  }

  const groupsPresent = Array.from(new Set(points.map((p) => p.group)))

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {groupsPresent.map((group) => (
          <span key={group} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ backgroundColor: GROUP_COLOR[group] }}
            />
            {GROUP_LABEL[group]}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Scatter plot of shelter and survey-answer embeddings reduced to two dimensions"
        className="w-full rounded-lg border"
      >
        <title>
          Shelter and survey-answer embeddings, reduced to two dimensions with PCA.
        </title>
        {points.map((p) => {
          const cx = toSvgX(p.x)
          const cy = toSvgY(p.y)
          const isReal = p.group === "real_listing"

          return (
            <g key={p.id}>
              <circle
                cx={cx}
                cy={cy}
                r={p.highlighted ? 7 : isReal ? 6 : 4}
                fill={GROUP_COLOR[p.group]}
                stroke={p.highlighted ? "currentColor" : isReal ? "white" : "none"}
                strokeWidth={p.highlighted ? 2 : isReal ? 1.5 : 0}
                opacity={p.highlighted ? 1 : 0.85}
              >
                <title>{p.label}</title>
              </circle>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
