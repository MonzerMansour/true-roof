import { cn } from "cn"

import {
  artworkForListing,
  artworkPalette,
  type ArtworkSpec,
} from "@/lib/listings/site-artwork"
import type { Listing } from "@/lib/listings/types"

/**
 * The drawing shown for a site nobody has photographed.
 *
 * Inline SVG rather than a file: there are a hundred and nineteen sites and
 * every one gets its own hue and its own lit windows, which is not something
 * a folder of images can do. It also costs no request and no bytes over the
 * wire beyond the markup, which matters on the cheap phone this is for.
 *
 * Decorative, so aria-hidden. Whatever is around it owns the alt text, and
 * says there that this is a drawing and not the place.
 */

function Windows({
  spec,
  x,
  y,
  cols,
  rows,
  w,
  h,
  gapX,
  gapY,
  offset = 0,
}: {
  spec: ArtworkSpec
  x: number
  y: number
  cols: number
  rows: number
  w: number
  h: number
  gapX: number
  gapY: number
  offset?: number
}) {
  const palette = artworkPalette(spec.hue)
  const cells = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = offset + row * cols + col
      const lit = (spec.litWindows >> index % 16) & 1
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={x + col * (w + gapX)}
          y={y + row * (h + gapY)}
          width={w}
          height={h}
          rx={1.5}
          fill={lit ? palette.lit : palette.unlit}
          opacity={lit ? 0.95 : 0.7}
        />
      )
    }
  }

  return <>{cells}</>
}

function Car({ x, y, fill, lit }: { x: number; y: number; fill: string; lit: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M2 18 Q4 8 14 7 L30 6 Q40 6 46 13 L56 15 Q60 16 60 20 L60 24 Q60 26 57 26 L5 26 Q2 26 2 24 Z"
        fill={fill}
      />
      <path d="M15 9 L29 8 Q36 8 41 13 L16 14 Z" fill={lit} opacity={0.5} />
      <circle cx={16} cy={26} r={4.5} fill={fill} />
      <circle cx={48} cy={26} r={4.5} fill={fill} />
    </g>
  )
}

function Van({ x, y, fill, lit }: { x: number; y: number; fill: string; lit: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M2 6 L44 6 Q52 6 58 14 L66 17 Q70 18 70 22 L70 27 Q70 29 67 29 L5 29 Q2 29 2 27 Z"
        fill={fill}
      />
      <rect x={8} y={10} width={16} height={9} rx={1.5} fill={lit} opacity={0.45} />
      <rect x={28} y={10} width={14} height={9} rx={1.5} fill={lit} opacity={0.45} />
      <circle cx={18} cy={29} r={5} fill={fill} />
      <circle cx={56} cy={29} r={5} fill={fill} />
    </g>
  )
}

function Rv({ x, y, fill, lit }: { x: number; y: number; fill: string; lit: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={2} y={0} width={86} height={28} rx={4} fill={fill} />
      <path d="M88 10 Q104 11 108 18 L108 25 Q108 28 105 28 L88 28 Z" fill={fill} />
      <rect x={10} y={6} width={20} height={11} rx={1.5} fill={lit} opacity={0.5} />
      <rect x={36} y={6} width={20} height={11} rx={1.5} fill={lit} opacity={0.5} />
      <rect x={62} y={6} width={18} height={11} rx={1.5} fill={lit} opacity={0.5} />
      <rect x={92} y={15} width={12} height={8} rx={1.5} fill={lit} opacity={0.35} />
      <circle cx={24} cy={28} r={5.5} fill={fill} />
      <circle cx={70} cy={28} r={5.5} fill={fill} />
      <circle cx={98} cy={28} r={5} fill={fill} />
    </g>
  )
}

function Scene({ spec }: { spec: ArtworkSpec }) {
  const p = artworkPalette(spec.hue)
  const horizon = 168

  // One extra storey or one fewer, so two sites with a near hue still differ.
  const lift = spec.variant * 14

  return (
    <>
      {spec.scene === "block" ? (
        <>
          <rect
            x={54}
            y={62 - lift}
            width={176}
            height={horizon - 62 + lift}
            fill={p.solid}
          />
          <rect
            x={236}
            y={100}
            width={104}
            height={horizon - 100}
            fill={p.solidLight}
          />
          <Windows
            spec={spec}
            x={70}
            y={78 - lift}
            cols={5}
            rows={4 + spec.variant}
            w={20}
            h={14}
            gapX={12}
            gapY={12}
          />
          <Windows
            spec={spec}
            x={250}
            y={116}
            cols={3}
            rows={2}
            w={18}
            h={13}
            gapX={11}
            gapY={12}
            offset={7}
          />
          <rect x={130} y={horizon - 26} width={24} height={26} rx={2} fill={p.unlit} />
        </>
      ) : null}

      {spec.scene === "terrace" ? (
        <>
          {[0, 1, 2].map((i) => {
            const x = 52 + i * 102
            const top = 92 - (i === 1 ? lift : 0)
            return (
              <g key={i}>
                <path
                  d={`M${x - 6} ${top} L${x + 44} ${top - 26} L${x + 94} ${top} Z`}
                  fill={p.solidLight}
                />
                <rect
                  x={x}
                  y={top}
                  width={88}
                  height={horizon - top}
                  fill={p.solid}
                />
                <Windows
                  spec={spec}
                  x={x + 12}
                  y={top + 16}
                  cols={2}
                  rows={2}
                  w={24}
                  h={16}
                  gapX={16}
                  gapY={14}
                  offset={i * 4}
                />
                <rect
                  x={x + 34}
                  y={horizon - 24}
                  width={20}
                  height={24}
                  rx={2}
                  fill={p.unlit}
                />
              </g>
            )
          })}
        </>
      ) : null}

      {spec.scene === "cottage" ? (
        <>
          <circle cx={86} cy={128} r={30} fill={p.solidLight} />
          <rect x={82} y={128} width={8} height={40} fill={p.solid} />
          <path d={`M138 96 L196 58 L254 96 Z`} fill={p.solidLight} />
          <rect x={146} y={96} width={100} height={horizon - 96} fill={p.solid} />
          <Windows
            spec={spec}
            x={158}
            y={112}
            cols={2}
            rows={1}
            w={26}
            h={20}
            gapX={24}
            gapY={0}
          />
          <rect x={184} y={horizon - 30} width={24} height={30} rx={2} fill={p.unlit} />
          <circle cx={300} cy={140} r={20} fill={p.solidLight} opacity={0.7} />
          <rect x={297} y={140} width={6} height={28} fill={p.solid} opacity={0.7} />
        </>
      ) : null}

      {spec.scene.startsWith("lot_") ? (
        <>
          {/* Stall lines, drawn in perspective so it reads as a lot and not a
              road. */}
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M${40 + i * 80} ${horizon + 6} L${10 + i * 94} 250`}
              stroke={p.lit}
              strokeWidth={3}
              opacity={0.4}
            />
          ))}
          <rect x={332} y={70} width={6} height={98} fill={p.solid} />
          <rect x={320} y={64} width={30} height={9} rx={3} fill={p.solid} />
          <circle cx={335} cy={76} r={16} fill={p.lit} opacity={0.22} />

          {spec.scene === "lot_rv" ? (
            <>
              <Rv x={30} y={136} fill={p.solid} lit={p.lit} />
              <Car x={236} y={166} fill={p.solidLight} lit={p.lit} />
            </>
          ) : null}
          {spec.scene === "lot_van" ? (
            <>
              <Van x={46} y={138} fill={p.solid} lit={p.lit} />
              <Car x={226} y={166} fill={p.solidLight} lit={p.lit} />
            </>
          ) : null}
          {spec.scene === "lot_car" ? (
            <>
              <Car x={56} y={142} fill={p.solid} lit={p.lit} />
              <Car x={232} y={166} fill={p.solidLight} lit={p.lit} />
            </>
          ) : null}
        </>
      ) : null}
    </>
  )
}

export function SiteArtwork({
  listing,
  className,
}: {
  listing: Listing
  className?: string
}) {
  const spec = artworkForListing(listing)
  const p = artworkPalette(spec.hue)
  const gradientId = `sky-${listing.id}`
  const horizon = 168

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <svg
        aria-hidden
        viewBox="0 0 400 250"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.skyTop} />
            <stop offset="100%" stopColor={p.skyBottom} />
          </linearGradient>
        </defs>
        <rect width="400" height="250" fill={`url(#${gradientId})`} />
        <rect y={horizon} width="400" height={250 - horizon} fill={p.ground} />
        <Scene spec={spec} />
      </svg>
    </div>
  )
}
