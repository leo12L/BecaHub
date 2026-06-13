import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { coverageLabels } from "@/lib/becas/format";
import type { CoverageType } from "@/generated/prisma/enums";

export function CoverageBadge({
  coverageType,
  className,
}: {
  coverageType: CoverageType;
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn(className)}>
      <Wallet data-icon="inline-start" aria-hidden="true" />
      {coverageLabels[coverageType]}
    </Badge>
  );
}
