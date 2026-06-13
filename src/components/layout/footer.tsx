import Link from "next/link";
import { GraduationCap } from "lucide-react";

const exploreLinks = [
  { href: "/", label: "Inicio" },
  { href: "/becas", label: "Explorar becas" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-muted/40 border-t">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <div className="font-heading text-foreground flex items-center gap-2 text-base font-semibold">
              <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <GraduationCap className="size-4" aria-hidden="true" />
              </span>
              BecaHub
            </div>
            <p className="text-muted-foreground mt-3 max-w-sm text-sm">
              Buscamos y organizamos becas de distintas fuentes para que
              encuentres tu próxima oportunidad académica en un solo lugar.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-foreground text-sm font-semibold">
              Explorar
            </h2>
            <ul className="mt-3 space-y-2">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-foreground text-sm font-semibold">
              Aviso importante
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">
              Cada beca enlaza a su convocatoria oficial. BecaHub no gestiona
              postulaciones ni solicita pagos: verifica siempre la información
              directamente en la fuente original antes de postular.
            </p>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-8 border-t pt-6 text-sm">
          © {year} BecaHub. Información recopilada con fines informativos.
        </div>
      </div>
    </footer>
  );
}
