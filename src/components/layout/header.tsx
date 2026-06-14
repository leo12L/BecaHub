"use client";

import Link from "next/link";
import { useState } from "react";
import { GraduationCap, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/becas", label: "Explorar becas" },
  { href: "/solicitud-beca", label: "Solicitar beca" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-heading text-foreground focus-visible:outline-ring flex items-center gap-2 rounded-lg text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
            <GraduationCap className="size-5" aria-hidden="true" />
          </span>
          BecaHub
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="hidden sm:flex"
          >
            <Link href="/becas" aria-label="Buscar becas">
              <Search aria-hidden="true" />
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú de navegación"
            >
              <Menu aria-hidden="true" />
            </Button>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>BecaHub</SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Navegación móvil"
                className="flex flex-col gap-1 px-4"
              >
                {navLinks.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="text-foreground hover:bg-muted rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    href="/becas"
                    className="text-foreground hover:bg-muted flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                  >
                    <Search className="size-4" aria-hidden="true" />
                    Buscar becas
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
