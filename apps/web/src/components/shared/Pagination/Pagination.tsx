"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export interface PaginationSectionProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function PaginationSection({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48],
}: PaginationSectionProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total <= pageSize && !onPageSizeChange) return null;

  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("ellipsis");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <Pagination className="w-full">
      <PaginationContent className="w-full flex-col md:flex-row justify-between gap-8 md:gap-4">
        <PaginationItem className="hidden lg:flex">
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/40 font-black text-[10px] uppercase  text-muted-foreground whitespace-nowrap">
            Page{" "}
            <span className="text-foreground border-l border-border pl-3 ml-1">
              {page} / {totalPages}
            </span>
            <span className="text-muted-foreground/60 ml-2">({total} total)</span>
          </div>
        </PaginationItem>

        <PaginationItem className="flex items-center gap-2 p-1.5 rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-900 border border-border/40">
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onPageChange(page - 1);
            }}
            className={`rounded-xl h-11 px-4 hover:bg-white dark:hover:bg-zinc-800 transition-all font-black text-[10px] uppercase  ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          />
          <div className="flex items-center gap-1 mx-2">
            {pages.map((p, idx) =>
              p === "ellipsis" ? (
                <PaginationEllipsis key={`e-${idx}`} className="size-11 opacity-40" />
              ) : (
                <PaginationLink
                  key={p}
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(p);
                  }}
                  className={`size-11 rounded-xl font-black text-xs transition-all ${p === page
                      ? "bg-primary text-white shadow-xl shadow-primary/20"
                      : "hover:bg-white dark:hover:bg-zinc-800"
                    }`}
                >
                  {p}
                </PaginationLink>
              ),
            )}
          </div>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages) onPageChange(page + 1);
            }}
            className={`rounded-xl h-11 px-4 hover:bg-white dark:hover:bg-zinc-800 transition-all font-black text-[10px] uppercase  ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
          />
        </PaginationItem>

        {onPageSizeChange && (
          <PaginationItem className="hidden md:flex">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="w-full py-5 bg-zinc-50 dark:bg-zinc-950 border border-primary/5 rounded-2xl px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40">
                <SelectGroup>
                  <SelectLabel className="text-[10px] font-black uppercase text-muted-foreground">
                    Entries
                  </SelectLabel>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)} className="rounded-lg">
                      {size} / Page
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}

/** Client-side slice helper for lists already loaded in memory. */
export function paginateList<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
  };
}
