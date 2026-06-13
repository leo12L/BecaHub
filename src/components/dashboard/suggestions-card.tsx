/**
 * Suggestions Card Component
 * Displays actionable suggestions and tips for the user.
 */

import { Lightbulb } from "lucide-react";

interface SuggestionItem {
  text: string;
  icon?: React.ReactNode;
}

interface SuggestionsCardProps {
  suggestions: SuggestionItem[];
}

export function SuggestionsCard({ suggestions }: SuggestionsCardProps) {
  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(128, 0, 32, 0.15)",
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Lightbulb size={20} style={{ color: "#800020" }} />
        <h3 className="text-lg font-semibold text-gray-900">Sugerencias</h3>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div
              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
              style={{ backgroundColor: "#004451" }}
            ></div>
            <p className="text-sm text-gray-700">{suggestion.text}</p>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button
        className="w-full mt-5 px-4 py-2 rounded-lg font-medium text-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: "#F5F5F5",
          color: "#800020",
          border: "1px solid rgba(128, 0, 32, 0.2)",
        }}
        onClick={() => {
          // TODO(api): Navigate to profile completion or settings
          console.log("Ver más sugerencias");
        }}
      >
        Ver más
      </button>
    </div>
  );
}
