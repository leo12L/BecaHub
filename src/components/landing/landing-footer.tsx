import Link from "next/link";

const exploreLinks = [
  { href: "/", label: "Inicio" },
  { href: "/becas", label: "Explorar becas" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "/solicitud-beca", label: "Solicitar beca" },
];

const accountLinks = [
  { href: "/login", label: "Iniciar sesión" },
  { href: "/login", label: "Crear cuenta" },
  { href: "/dashboard", label: "Panel" },
];

const pendingSocials = [
  { label: "Instagram", glyph: "Ig" },
  { label: "X (Twitter)", glyph: "X" },
  { label: "Facebook", glyph: "Fb" },
  { label: "TikTok", glyph: "Tt" },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-muted/70 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-foreground text-base font-bold">BecaHub</p>
          <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-relaxed">
            Becas para universitarias y universitarios en México. Información
            organizada, enlaces oficiales, sin inventar convocatorias.
          </p>
        </div>

        <div>
          <h2 className="text-foreground text-sm font-semibold">Explorar</h2>
          <ul className="mt-3 space-y-2">
            {exploreLinks.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-foreground text-sm font-semibold">Cuenta</h2>
          <ul className="mt-3 space-y-2">
            {accountLinks.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-foreground text-sm font-semibold">Redes</h2>
          <p className="text-muted-foreground mt-3 text-xs">
            Espacios reservados. Todavía no hay URL pública.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {pendingSocials.map(({ label, glyph }) => (
              <li key={label}>
                <button
                  type="button"
                  disabled
                  data-social-pending={label}
                  title={`Pendiente: ${label} (sin URL todavía)`}
                  aria-label={`Pendiente: ${label} (sin URL todavía)`}
                  className="border-border text-muted-foreground inline-flex size-10 items-center justify-center rounded-full border text-[11px] font-bold tracking-wide opacity-60"
                >
                  <span aria-hidden="true">{glyph}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-border text-muted-foreground mx-auto max-w-6xl border-t px-4 py-6 text-sm sm:px-6">
        © {year} BecaHub. Cada beca enlaza a su convocatoria oficial. No
        gestionamos postulaciones ni pedimos pagos.
      </div>
    </footer>
  );
}
