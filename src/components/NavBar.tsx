"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Users,
  FolderOpen,
  PartyPopper,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/voluntarios", label: "Voluntários", icon: Users },
  { href: "/materiais", label: "Materiais Apoio", icon: FolderOpen },
  { href: "/eventos", label: "Eventos", icon: PartyPopper },
];

type NavBarProps = {
  email: string;
  ehOrganizador: boolean;
};

export function NavBar({ email, ehOrganizador }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);

  async function handleSair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/calendario" className="flex items-center gap-2 text-lg font-semibold text-text-main">
          <Image
            src="/logo.png"
            alt="Cantinho da Meimei"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="hidden sm:inline">Cantinho da Meimei</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const ativo = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  ativo
                    ? "bg-primary/10 text-primary"
                    : "text-text-main/70 hover:bg-black/5 hover:text-text-main"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {ehOrganizador && (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <ShieldCheck size={14} />
              Organizador
            </span>
          )}
          <span className="text-sm text-text-main/60">{email}</span>
          <button
            onClick={handleSair}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>

        <button
          className="p-2 md:hidden"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label="Abrir menu"
        >
          {menuAberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuAberto && (
        <nav className="flex flex-col gap-1 border-t border-black/10 px-4 py-3 md:hidden">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const ativo = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuAberto(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  ativo
                    ? "bg-primary/10 text-primary"
                    : "text-text-main/70 hover:bg-black/5"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-3">
            <div className="flex flex-col">
              {ehOrganizador && (
                <span className="mb-1 flex w-fit items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <ShieldCheck size={14} />
                  Organizador
                </span>
              )}
              <span className="text-sm text-text-main/60">{email}</span>
            </div>
            <button
              onClick={handleSair}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
