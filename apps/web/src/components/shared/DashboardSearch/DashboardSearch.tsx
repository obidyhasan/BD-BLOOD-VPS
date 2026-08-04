"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Search } from "lucide-react";
import { BACKEND_API_URL } from "@/lib/backend";

type DashboardSearchProps = {
  placeholder?: string;
  role?: "admin" | "donor" | "organization";
  className?: string;
};

type SearchTarget = {
  prefix: string;
  label: string;
  keywords?: string[];
};

const searchTargets: Record<
  DashboardSearchProps["role"] & string,
  SearchTarget[]
> = {
  admin: [
    { prefix: "/dashboard/admin/donors", label: "Donors" },
    { prefix: "/dashboard/admin/organizations", label: "Organizations" },
    { prefix: "/dashboard/admin/blood-requests", label: "Blood Requests" },
    { prefix: "/dashboard/admin/posts", label: "Posts" },
    { prefix: "/dashboard/admin/events", label: "Events" },
    {
      prefix: "/dashboard/admin",
      label: "Dashboard",
      keywords: ["admin", "dashboard", "overview", "command center"],
    },
  ],
  donor: [
    { prefix: "/donor", label: "Donors" },
    { prefix: "/post", label: "Posts" },
    { prefix: "/event", label: "Events" },
    { prefix: "/organization", label: "Organizations" },
    { prefix: "/medical", label: "Medical" },
  ],
  organization: [
    { prefix: "/dashboard/organization/donors", label: "Donors" },
    { prefix: "/dashboard/organization/manage-posts", label: "Posts" },
    { prefix: "/dashboard/organization/manage-requests", label: "Requests" },
    { prefix: "/dashboard/organization/inventory", label: "Inventory" },
    { prefix: "/event", label: "Events" },
  ],
};

export default function DashboardSearch({
  placeholder = "Search...",
  role = "donor",
  className = "",
}: DashboardSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const [isFocused, setIsFocused] = useState(false);
  const targets = searchTargets[role];
  const searchableTargets = useMemo(
    () =>
      targets.map((target) => ({
        ...target,
        normalizedTerms: [target.label, ...(target.keywords ?? [])].map(
          (term) => term.toLowerCase(),
        ),
      })),
    [targets],
  );

  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return searchableTargets;
    }

    return searchableTargets.filter((target) =>
      target.normalizedTerms.some((term) => term.includes(normalizedQuery)),
    );
  }, [query, searchableTargets]);

  const navigateToTarget = (target: (typeof searchableTargets)[number]) => {
    const q = query.trim() || target.label;
    const params = new URLSearchParams({ search: q, searchTerm: q });
    router.push(`${target.prefix}?${params.toString()}`);
    setIsFocused(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    navigateToTarget(suggestions[0] ?? searchableTargets[0]);
  };

  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        placeholder={placeholder}
        className="w-full h-11 bg-zinc-100/50 dark:bg-zinc-900/50 border border-border/40 rounded-2xl pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
      />

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border/40 bg-white p-2 shadow-xl dark:bg-zinc-950">
          <div className="px-3 py-2 text-[10px] font-black uppercase  text-muted-foreground/50">
            Suggestions
          </div>
          {suggestions.map((target) => (
            <button
              key={target.prefix}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => navigateToTarget(target)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:hover:bg-zinc-900 dark:focus:bg-zinc-900"
            >
              <span>{target.label}</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground/50" />
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

export const getGoogleAuthUrl = () => `${BACKEND_API_URL}/auth/google`;
