import Link from "next/link";
import { cn } from "@/lib/utils";
import { badgeVariants } from "@/components/ui/badge";

export type CategoryBadgeData = {
  name: string;
  slug: string;
  axis: "TYPE" | "AREA";
  colorHex: string;
};

export function CategoryBadge({
  category,
  className,
  asLink = true,
}: {
  category: CategoryBadgeData;
  className?: string;
  asLink?: boolean;
}) {
  const style = {
    backgroundColor: `${category.colorHex}1f`,
    color: category.colorHex,
  };

  const classes = cn(
    badgeVariants({ variant: "outline" }),
    "border-transparent font-medium",
    className,
  );

  if (!asLink) {
    return (
      <span className={classes} style={style}>
        {category.name}
      </span>
    );
  }

  const param = category.axis === "TYPE" ? "type" : "area";

  return (
    <Link
      href={`/becas?${param}=${category.slug}`}
      className={classes}
      style={style}
    >
      {category.name}
    </Link>
  );
}
