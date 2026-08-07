"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LayoutDashboard, Plane, ListChecks, Users, Menu, X, LogOut } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { logoutAction } from "@/app/logout-action";
import type { SessionUser } from "@/lib/auth";

type AircraftSummary = { id: string; registration: string; model: string };

export function AppShell({
  session,
  aircraftList,
  children,
}: {
  session: SessionUser;
  aircraftList: AircraftSummary[];
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Painel", icon: LayoutDashboard },
    { href: "/aircraft", label: "Aeronaves", icon: Plane },
    { href: "/tasks", label: "Tarefas", icon: ListChecks },
    ...(session.role === "INTERNAL" ? [{ href: "/users", label: "Equipe & Acessos", icon: Users }] : []),
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <Image src="/logo-horizontal.png" alt="TB Aviation" width={160} height={36} className="w-[150px] h-auto" priority />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-5 mt-4 border-t border-white/10">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Frota
          </p>
          <div className="space-y-0.5">
            {aircraftList.map((a) => {
              const href = `/aircraft/${a.id}/tarefas`;
              const active = pathname.startsWith(`/aircraft/${a.id}`);
              return (
                <Link
                  key={a.id}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex flex-col rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="font-medium">{a.registration}</span>
                  <span className="text-[11px] text-white/40 truncate">{a.model}</span>
                </Link>
              );
            })}
            {aircraftList.length === 0 && (
              <p className="px-3 text-xs text-white/40">Nenhuma aeronave disponível</p>
            )}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span
            className="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white shrink-0"
            style={{ backgroundColor: session.color }}
          >
            {session.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-white truncate">{session.name}</span>
            <span className="block text-[11px] text-white/50 truncate">
              {session.role === "INTERNAL" ? "Equipe interna" : "Cliente"}
            </span>
          </span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex md:w-64 md:flex-col bg-brand-navy shrink-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-brand-navy">{sidebarContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <GlobalSearch />
        </header>
        <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
