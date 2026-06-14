import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default function SolicitudBecaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
