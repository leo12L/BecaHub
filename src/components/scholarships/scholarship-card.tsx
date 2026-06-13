import Link from "next/link";
import { MapPin, Landmark } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CategoryBadge } from "@/components/scholarships/category-badge";
import { CoverageBadge } from "@/components/scholarships/coverage-badge";
import { DeadlineBadge } from "@/components/scholarships/deadline-badge";
import { academicLevelLabels, formatAmount } from "@/lib/becas/format";
import type { BecaListItem } from "@/lib/becas/queries";

export function ScholarshipCard({
  scholarship,
}: {
  scholarship: BecaListItem;
}) {
  const amount = formatAmount(
    scholarship.amountMin,
    scholarship.amountMax,
    scholarship.currency,
  );

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-1.5">
          <CoverageBadge coverageType={scholarship.coverageType} />
          {scholarship.categories.slice(0, 2).map((category) => (
            <CategoryBadge key={category.id} category={category} />
          ))}
        </div>
        <CardTitle className="mt-1 text-lg leading-snug">
          <Link
            href={`/becas/${scholarship.slug}`}
            className="hover:text-primary focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {scholarship.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {scholarship.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-1.5">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span>
            {scholarship.countryDestination} ·{" "}
            {academicLevelLabels[scholarship.academicLevel]}
          </span>
        </div>
        {amount && <div className="text-foreground font-medium">{amount}</div>}
        <div className="flex items-center gap-1.5">
          <Landmark className="size-4 shrink-0" aria-hidden="true" />
          <span>{scholarship.source.name}</span>
        </div>
      </CardContent>

      <CardFooter className="border-t-0 bg-transparent">
        <DeadlineBadge
          deadline={scholarship.deadline}
          status={scholarship.status}
        />
      </CardFooter>
    </Card>
  );
}
