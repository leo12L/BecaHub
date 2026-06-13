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
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Fechas Importantes</h3>

      <div className="relative space-y-6">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full mt-1.5"
                style={{
                  backgroundColor: "#800020",
                  boxShadow: "0 0 0 4px rgba(128, 0, 32, 0.1)",
                }}
              ></div>
              {index !== events.length - 1 && (
                <div
                  className="w-0.5 flex-1 my-3"
                  style={{
                    backgroundColor: "rgba(128, 0, 32, 0.15)",
                    minHeight: "2rem",
                  }}
                ></div>
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pt-0.5">
              <p className="text-xs font-semibold text-gray-500 uppercase">{event.date}</p>
              <p className="text-sm text-gray-900 font-medium mt-1">{event.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
