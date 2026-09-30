"use client"

import { useRouter, useSearchParams } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CasePicker({ count }: { count: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("case") ?? "1"

  return (
    <Select
      value={current}
      onValueChange={(value) => {
        router.push(`/dev/embedding-eval?case=${value}`)
      }}
    >
      <SelectTrigger className="w-48" aria-label="Test case">
        <SelectValue placeholder="Pick a test case" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
          <SelectItem key={n} value={String(n)}>
            Test case {n}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
