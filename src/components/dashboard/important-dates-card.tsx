/**
 * Important Dates Card Component
 * Displays a vertical timeline of important scholarship-related dates.
 */

interface TimelineEvent {
  date: string;
  title: string;
  icon?: React.ReactNode;
}

interface ImportantDatesCardProps {
  events: TimelineEvent[];
}

export function ImportantDatesCard({ events }: ImportantDatesCardProps) {
  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(128, 0, 32, 0.15)",
      }}
    >
      <h3 className="mb-6 text-lg font-semibold text-gray-900">
        Fechas Importantes
      </h3>

      <div className="relative space-y-6">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div
                className="mt-1.5 h-3 w-3 rounded-full"
                style={{
                  backgroundColor: "#800020",
                  boxShadow: "0 0 0 4px rgba(128, 0, 32, 0.1)",
                }}
              ></div>
              {index !== events.length - 1 && (
                <div
                  className="my-3 w-0.5 flex-1"
                  style={{
                    backgroundColor: "rgba(128, 0, 32, 0.15)",
                    minHeight: "2rem",
                  }}
                ></div>
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pt-0.5">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                {event.date}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {event.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
