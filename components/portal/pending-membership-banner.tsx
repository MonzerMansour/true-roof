import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function PendingMembershipBanner({ orgName }: { orgName: string }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">Waiting on the site director</CardTitle>
          <Badge variant="secondary">Pending</Badge>
        </div>
        <CardDescription className="text-base">
          You asked to join {orgName}. A director has to accept before you can
          edit the listing. They will use the Access page to approve staff.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
