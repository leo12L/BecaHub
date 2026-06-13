/**
 * Summary Card Component
 * Displays metric cards for the dashboard overview section.
 * Can be highlighted (e.g., profile completion) or standard.
 */

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
  if (highlighted) {
    return (
      <div
        className="rounded-lg p-6 text-white shadow-sm transition-shadow hover:shadow-md"
        style={{ backgroundColor: "#800020" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium opacity-90">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
            {description && <p className="mt-2 text-xs opacity-75">{description}</p>}
          </div>
          {icon && <div className="text-2xl opacity-70">{icon}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md"
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#800020",
        borderWidth: "1px",
        opacity: 0.85,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {description && <p className="mt-2 text-xs text-gray-500">{description}</p>}
        </div>
        {icon && <div className="text-2xl text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}
