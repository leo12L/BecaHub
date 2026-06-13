import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDeadlineInfo } from "@/lib/becas/format";
import type { ScholarshipStatus } from "@/generated/prisma/enums";

const variantClasses: Record<string, string> = {
  default: "bg-secondary text-secondary-foreground",
  warning: "bg-highlight/25 text-highlight-foreground",
  urgent: "bg-destructive/10 text-destructive",
  closed: "bg-muted text-muted-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function DeadlineBadge({
  deadline,
  status,
  className,
}: {
  deadline: Date | string | null;
  status: ScholarshipStatus;
  className?: string;
}) {
  const info = getDeadlineInfo(deadline, status);

  return (
    <Badge className={cn(variantClasses[info.variant], className)}>
      <Clock data-icon="inline-start" aria-hidden="true" />
      {info.label}
    </Badge>
  );
}
