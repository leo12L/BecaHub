import Link from "next/link";
import { LogoutButton } from "@/components/admin/logout-button";

export default function AdminBecasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
          <nav className="flex items-center gap-4 text-sm font-medium">
            <span className="text-muted-foreground">BecaHub admin</span>
            <Link href="/admin/becas" className="hover:underline">
              Gestionar becas
            </Link>
            <Link href="/admin/becas/nueva" className="hover:underline">
              Agregar beca
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}
