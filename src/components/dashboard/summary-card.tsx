import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  highlighted?: boolean;
  description?: string;
}

export function SummaryCard({
  title,
  value,
  icon,
  highlighted = false,
  description,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md",
        highlighted
          ? "border-primary/20 bg-primary text-white"
          : "border-border bg-card text-foreground",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p
            className={cn(
              "text-sm font-semibold",
              highlighted ? "text-white/80" : "text-muted-foreground",
            )}
          >
            {title}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
          {description && (
            <p
              className={cn(
                "mt-1.5 text-xs leading-relaxed",
                highlighted ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "rounded-xl p-2.5",
              highlighted ? "bg-white/15" : "bg-secondary text-highlight",
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
