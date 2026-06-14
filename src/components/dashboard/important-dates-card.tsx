/**
 * Important Dates Card Component
 * Displays a vertical timeline of important scholarship-related dates.
 */

import Link from "next/link";

interface TimelineEvent {
  date: string;
  title: string;
  href?: string;
  icon?: React.ReactNode;
}

interface ImportantDatesCardProps {
  events: TimelineEvent[];
}

export function ImportantDatesCard({ events }: ImportantDatesCardProps) {
  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm">
      <h3 className="text-foreground mb-6 text-lg font-semibold">
        Próximos cierres
      </h3>

      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No hay fechas limite proximas en el catalogo.
        </p>
      ) : (
        <div className="relative space-y-6">
          {events.map((event, index) => (
            <div key={`${event.title}-${event.date}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-primary ring-primary/10 mt-1.5 h-3 w-3 rounded-full ring-4" />
                {index !== events.length - 1 && (
                  <div className="bg-border my-3 w-0.5 flex-1" />
                )}
              </div>

              <div className="flex-1 pt-0.5">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  {event.date}
                </p>
                {event.href ? (
                  <Link
                    href={event.href}
                    className="text-foreground hover:text-primary mt-1 block text-sm font-medium"
                  >
                    {event.title}
                  </Link>
                ) : (
                  <p className="text-foreground mt-1 text-sm font-medium">
                    {event.title}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
