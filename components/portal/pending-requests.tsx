"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { IconCheck, IconX } from "@tabler/icons-react"

import {
  approveMemberRequest,
  rejectMemberRequest,
} from "@/lib/portal/actions"
import type { PendingMemberRequest } from "@/lib/portal/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AssignRole = "staff" | "manager"

function formatRequestedAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "recently"
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function RequestRow({ request }: { request: PendingMemberRequest }) {
  const router = useRouter()
  const [role, setRole] = React.useState<AssignRole>("staff")
  const [pending, setPending] = React.useState(false)

  async function onApprove() {
    setPending(true)
    try {
      const result = await approveMemberRequest(request.id, role)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Member approved.")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  async function onReject() {
    setPending(true)
    try {
      const result = await rejectMemberRequest(request.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Request declined.")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">
          {request.email ?? "Staff member"}
        </p>
        <p className="text-sm text-muted-foreground">
          Requested {formatRequestedAt(request.createdAt)}. Reference{" "}
          <span className="font-mono">{request.userId.slice(0, 8)}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={role}
          onValueChange={(value) => setRole(value as AssignRole)}
        >
          <SelectTrigger className="w-32" aria-label="Role on approval">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={onApprove}
        >
          <IconCheck />
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={onReject}
        >
          <IconX />
          Reject
        </Button>
      </div>
    </div>
  )
}

export function PendingRequests({
  requests,
}: {
  requests: PendingMemberRequest[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending requests</CardTitle>
        <CardDescription>
          Approve a person to let them edit your site. Staff can update the
          listing. Managers can also publish it and edit the org.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one is waiting right now. Share your access code to bring staff
            on.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
