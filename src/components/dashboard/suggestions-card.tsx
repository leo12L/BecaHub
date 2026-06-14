/**
 * Suggestions Card Component
 * Displays actionable suggestions and tips for the user.
 */

import Link from "next/link";
import { Lightbulb } from "lucide-react";

interface SuggestionItem {
  text: string;
  href?: string;
  icon?: React.ReactNode;
}

interface SuggestionsCardProps {
  suggestions: SuggestionItem[];
}

export function SuggestionsCard({ suggestions }: SuggestionsCardProps) {
  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Lightbulb size={20} className="text-primary" />
        <h3 className="text-foreground text-lg font-semibold">Sugerencias</h3>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="bg-highlight mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
            {suggestion.href ? (
              <Link
                href={suggestion.href}
                className="text-muted-foreground hover:text-primary text-sm"
              >
                {suggestion.text}
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm">{suggestion.text}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
