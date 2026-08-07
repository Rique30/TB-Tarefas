"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plane, ListChecks, CalendarClock, Wrench, Loader2 } from "lucide-react";
import { globalSearch, type SearchResult } from "@/app/actions/search";

const ICONS: Record<SearchResult["type"], React.ComponentType<{ className?: string }>> = {
  aircraft: Plane,
  task: ListChecks,
  expiry: CalendarClock,
  maintenance: Wrench,
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const hasQuery = query.trim().length >= 2;
  const displayResults = hasQuery ? results : [];

  useEffect(() => {
    if (!hasQuery) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await globalSearch(query);
        setResults(r);
        setOpen(true);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query, hasQuery]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <Search className="size-4 text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 2) setOpen(false);
          }}
          onFocus={() => displayResults.length > 0 && setOpen(true)}
          placeholder="Buscar aeronave, tarefa, vencimento, responsável..."
          className="w-full text-sm outline-none placeholder:text-muted"
        />
        {pending && <Loader2 className="size-4 animate-spin text-muted shrink-0" />}
      </div>

      {open && displayResults.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg max-h-96 overflow-y-auto">
          {displayResults.map((r) => {
            const Icon = ICONS[r.type];
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  router.push(r.href);
                }}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-background transition-colors border-b border-border last:border-b-0"
              >
                <Icon className="size-4 mt-0.5 text-brand-blue shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground truncate">{r.title}</span>
                  <span className="block text-xs text-muted truncate">{r.subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {open && hasQuery && displayResults.length === 0 && !pending && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg px-3 py-3 text-sm text-muted">
          Nenhum resultado para &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
