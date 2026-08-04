"use client";

import { Search, Filter, LayoutGrid, List, Calendar, Activity, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkCard from "@/components/modules/Home/OurWork/WorkCard";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { useGetAllOrganizationsQuery } from "@/redux/features/organizations/organizationsApi";
import type { Organization } from "@/redux/features/organizations/organizationsApi";
import { useGetPublicPostsQuery } from "@/redux/features/posts/postsApi";
import { findOrganizationBySlug } from "@/lib/organization";
import { mapApiPostToLegacy } from "@/lib/post";
import { PaginationSection, paginateList } from "@/components/shared/Pagination/Pagination";

const OrganizationPosts = ({
   slug,
   initialOrganization,
   initialPosts,
}: {
   slug: string;
   initialOrganization?: Organization | null;
   initialPosts?: Parameters<typeof mapApiPostToLegacy>[0][];
}) => {
   const [viewType, setViewType] = useState<"grid" | "list">("grid");
   const [isFilterOpen, setIsFilterOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
   const [page, setPage] = useState(1);
   const [pageSize, setPageSize] = useState(12);

   const { data: orgsData } = useGetAllOrganizationsQuery(
      { limit: 200 },
      { skip: !!initialOrganization },
   );
   const organization = useMemo(
      () =>
         initialOrganization ??
         findOrganizationBySlug(orgsData?.data ?? [], slug),
      [initialOrganization, orgsData, slug],
   );

   const { data: postsData, isLoading: loading } = useGetPublicPostsQuery(
      { limit: 100, organizationId: organization?.id, isWork: true },
      { skip: !organization?.id || !!initialPosts?.length },
   );

   const works = useMemo(
      () =>
         (postsData?.data ?? initialPosts ?? []).map((p) =>
            mapApiPostToLegacy(p, organization?.name ?? ""),
         ),
      [postsData, initialPosts, organization?.name],
   );

   const categories = useMemo(() => {
      const types = new Set(
         works.map((w) => w.type).filter(Boolean) as string[],
      );
      return types.size > 0 ? Array.from(types) : ["GENERAL", "EVENT", "URGENT"];
   }, [works]);

   const filteredWorks = useMemo(() => {
      const q = searchQuery.toLowerCase();
      return works.filter((w) => {
         const matchesSearch =
            !q ||
            w.title.toLowerCase().includes(q) ||
            w.content?.toLowerCase().includes(q);
         const matchesCategory = !categoryFilter || w.type === categoryFilter;
         return matchesSearch && matchesCategory;
      });
   }, [works, searchQuery, categoryFilter]);

   const { items: pagedWorks, total } = paginateList(filteredWorks, page, pageSize);

   return (
      <div className="w-full bg-zinc-50/50 dark:bg-zinc-950/30 mt-14 py-10 md:py-16 min-h-screen">
         <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="space-y-8">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="space-y-4">
                     <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase leading-none">
                        Our <span className="text-primary">Impact</span>
                     </h1>
                     <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-2xl">
                        Comprehensive archives of all verified life-saving campaigns, emergency deployments, and community impact reports.
                     </p>
                  </div>

                  <div className="flex items-center gap-3">
                     <Button
                        variant={viewType === "grid" ? "primary" : "outline"}
                        size="icon"
                        onClick={() => setViewType("grid")}
                        className="rounded-xl size-12"
                     >
                        <LayoutGrid className="size-5" />
                     </Button>
                     <Button
                        variant={viewType === "list" ? "primary" : "outline"}
                        size="icon"
                        onClick={() => setViewType("list")}
                        className="rounded-xl size-12"
                     >
                        <List className="size-5" />
                     </Button>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-border/40 flex flex-col md:flex-row items-center gap-4">
                  <div className="relative flex-1 w-full">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground opacity-40" />
                     <Input
                        value={searchQuery}
                        onChange={(e) => {
                           setSearchQuery(e.target.value);
                           setPage(1);
                        }}
                        placeholder="Search missions, dates, or keywords..."
                        className="pl-12 h-14 bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl focus-visible:ring-primary/20"
                     />
                  </div>
                  <Button
                     variant={isFilterOpen ? "primary" : "outline"}
                     onClick={() => setIsFilterOpen(!isFilterOpen)}
                     className="h-14 px-8 rounded-2xl border-border/40 font-bold flex items-center gap-3 w-full md:w-auto transition-all duration-300"
                  >
                     <Filter className={`size-4 transition-transform duration-300 ${isFilterOpen ? "rotate-180" : ""}`} />
                     {isFilterOpen ? "Hide Filters" : "Advance Filter"}
                  </Button>
               </div>

               <AnimatePresence>
                  {isFilterOpen && (
                     <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                     >
                        <div className="p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-border/40 grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-4">
                              <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                                 <Tag className="size-3 text-primary" />
                                 Post Category
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                 <Badge
                                    variant={categoryFilter === null ? "primary" : "outline"}
                                    className="rounded-lg px-3 py-1.5 cursor-pointer font-bold"
                                    onClick={() => {
                                       setCategoryFilter(null);
                                       setPage(1);
                                    }}
                                 >
                                    All
                                 </Badge>
                                 {categories.map((cat) => (
                                    <Badge
                                       key={cat}
                                       variant={categoryFilter === cat ? "primary" : "outline"}
                                       className="rounded-lg px-3 py-1.5 cursor-pointer hover:bg-primary hover:text-white transition-colors border-border/40 font-bold"
                                       onClick={() => {
                                          setCategoryFilter(cat);
                                          setPage(1);
                                       }}
                                    >
                                       {cat}
                                    </Badge>
                                 ))}
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                                 <Calendar className="size-3 text-primary" />
                                 Sort By Date
                              </h4>
                              <p className="text-sm text-muted-foreground font-medium">
                                 Posts are sorted newest first by default.
                              </p>
                           </div>

                           <div className="md:col-span-2 pt-6 border-t border-border/40 flex items-center justify-between">
                              <Button
                                 variant="ghost"
                                 className="text-xs font-black uppercase  text-muted-foreground hover:text-red-500"
                                 onClick={() => {
                                    setCategoryFilter(null);
                                    setSearchQuery("");
                                    setPage(1);
                                 }}
                              >
                                 Clear All Filters
                              </Button>
                           </div>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>

            <div className={viewType === "grid"
               ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
               : "flex flex-col gap-6"
            }>
               {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                     <div key={i} className="aspect-[16/18] rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-border/40 border-dashed" />
                  ))
               ) : (
                  <>
                     {pagedWorks.map((work, index) => (
                        <motion.div
                           key={work.id}
                           initial={{ opacity: 0, y: 20 }}
                           whileInView={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.5, delay: index * 0.05 }}
                           viewport={{ once: true }}
                        >
                           <WorkCard post={work} />
                        </motion.div>
                     ))}
                     {filteredWorks.length === 0 && (
                        <div className="md:col-span-3 py-24 flex flex-col items-center justify-center text-center opacity-40">
                           <Activity className="size-12 mb-4 text-primary" />
                           <p className="text-sm font-black uppercase  ">No impact reports match your filters</p>
                        </div>
                     )}
                  </>
               )}
            </div>

            {total > 0 && (
               <PaginationSection
                  page={page}
                  total={total}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                     setPageSize(size);
                     setPage(1);
                  }}
               />
            )}
         </div>
      </div>
   );
};

export default OrganizationPosts;
