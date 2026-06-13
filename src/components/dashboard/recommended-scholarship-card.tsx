/**
 * Recommended Scholarship Card Component
 * Displays individual scholarship opportunities with compatibility badge,
 * save option, and apply button.
 */

"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface RecommendedScholarshipCardProps {
  id: string;
  name: string;
  institution: string;
  compatibility: number;
  tags: string[];
  closingDate: string;
  description?: string;
}

export function RecommendedScholarshipCard({
  id,
  name,
  institution,
  compatibility,
  tags,
  closingDate,
  description,
}: RecommendedScholarshipCardProps) {
  // TODO(auth): Replace with actual user saved scholarships
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg transition-shadow hover:shadow-md"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(128, 0, 32, 0.15)",
      }}
    >
      {/* Header with compatibility badge */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600">{institution}</p>
          </div>
          <div
            className="rounded-full px-3 py-1 text-center text-sm font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor: "#004451" }}
          >
            {compatibility}% Compatibilidad
          </div>
        </div>
      </div>

      {/* Description and tags */}
      <div className="flex-1 px-6 py-4">
        {description && <p className="text-sm text-gray-700 mb-4">{description}</p>}

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "#F5F5F5",
                color: "#004451",
                border: "1px solid rgba(0, 68, 81, 0.2)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div
        className="h-px"
        style={{ backgroundColor: "rgba(128, 0, 32, 0.1)" }}
      ></div>

      {/* Footer with date and actions */}
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex-1">
          <p className="text-xs text-gray-500">Fecha de cierre</p>
          <p className="text-sm font-semibold text-gray-900">{closingDate}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Save button */}
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800020]"
            aria-label={isSaved ? "Unsave scholarship" : "Save scholarship"}
            title={isSaved ? "Unsave" : "Save"}
          >
            {isSaved ? (
              <BookmarkCheck
                size={20}
                className="text-gray-900"
                style={{ color: "#800020" }}
              />
            ) : (
              <Bookmark size={20} className="text-gray-400" />
            )}
          </button>

          {/* Apply button */}
          <button
            className="px-4 py-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800020]"
            style={{
              backgroundColor: "#800020",
            }}
            onClick={() => {
              // TODO(api): Handle apply action - open application modal or navigate
              console.log(`Aplicar a ${id}`);
            }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
