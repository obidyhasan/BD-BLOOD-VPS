"use client";

import { useState, useMemo } from "react";
import { useGetPublicPostsQuery } from "@/redux/features/posts/postsApi";
import { mapApiPostToLegacy } from "@/lib/post";
import type { LegacyPost as Post } from "@/lib/post";
import PostCard from "@/components/reusable/Donor/PostCard";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ClipboardList,
  Send,
  Grid2X2,
  List,
  Filter,
  SlidersHorizontal,
  Users,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PaginationSection,
  paginateList,
} from "@/components/shared/Pagination/Pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetUpazilasQuery,
} from "@/redux/features/location/locationApi";

interface PostFeedProps {
  filterAuthor?: string;
  title?: string;
  description?: string;
  initialData?: { data?: unknown[]; meta?: object };
}

export default function PostFeed({
  filterAuthor,
  title,
  description,
  initialData,
}: PostFeedProps) {
  const { data, isLoading } = useGetPublicPostsQuery(
    {
      limit: 100,
      approvalStatus: "APPROVED",
    },
    { skip: !!initialData?.data?.length },
  );

  const resolvedData = data ?? initialData;
  const loading = !resolvedData && isLoading;

  const posts: Post[] = useMemo(
    () =>
      (resolvedData?.data ?? []).map((p) =>
        mapApiPostToLegacy(p as Parameters<typeof mapApiPostToLegacy>[0]),
      ),
    [resolvedData],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Advanced Filter States
  const [categoryFilter, setCategoryFilter] = useState("any");
  const [orgFilter, setOrgFilter] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazilaId, setUpazilaId] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const { data: divisionsData } = useGetDivisionsQuery();
  const { data: districtsData } = useGetDistrictsQuery(
    divisionId ? { divisionId } : undefined,
    { skip: !divisionId },
  );
  const { data: upazilasData } = useGetUpazilasQuery(
    districtId ? { districtId } : undefined,
    { skip: !districtId },
  );

  const divisionName = divisionsData?.data?.find(
    (d) => d.id === divisionId,
  )?.name;
  const districtName = districtsData?.data?.find(
    (d) => d.id === districtId,
  )?.name;
  const upazilaName = upazilasData?.data?.find((u) => u.id === upazilaId)?.name;

  const sortedAndFilteredPosts = useMemo(() => {
    const result = posts.filter((post) => {
      if (filterAuthor && post.author !== filterAuthor) return false;
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "any" || post.type === categoryFilter;
      const matchesOrg =
        !orgFilter || post.org.toLowerCase().includes(orgFilter.toLowerCase());

      const matchesDivision =
        !divisionName ||
        post.division?.toLowerCase() === divisionName.toLowerCase();
      const matchesDistrict =
        !districtName ||
        post.district?.toLowerCase() === districtName.toLowerCase();
      const matchesUpazila =
        !upazilaName ||
        post.upazila?.toLowerCase() === upazilaName.toLowerCase();

      return (
        matchesSearch &&
        matchesCategory &&
        matchesOrg &&
        matchesDivision &&
        matchesDistrict &&
        matchesUpazila
      );
    });

    if (sortOrder === "newest") {
      result.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } else {
      result.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }

    return result;
  }, [
    posts,
    filterAuthor,
    searchQuery,
    sortOrder,
    categoryFilter,
    orgFilter,
    divisionName,
    districtName,
    upazilaName,
  ]);

  const resetFilters = () => {
    setCategoryFilter("any");
    setOrgFilter("");
    setDivisionId("");
    setDistrictId("");
    setUpazilaId("");
    setUpazilaId("");
    setSearchQuery("");
    setPage(1);
  };

  const { items: pagedPosts, total: filteredTotal } = paginateList(
    sortedAndFilteredPosts,
    page,
    pageSize,
  );

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-12 pb-16">
      {/* Search & Control Hub */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search posts..."
            className="pl-12 h-14 rounded-2xl border-white dark:border-zinc-950 bg-white dark:bg-zinc-950 focus:border-primary transition-all text-base shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="hidden sm:flex bg-white dark:bg-zinc-950 p-2 rounded-2xl border border-border/10 shadow-xs gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-10 rounded-xl",
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground",
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid2X2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-10 rounded-xl",
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground",
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="size-4" />
            </Button>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="primary"
                className="h-14 px-6 rounded-2xl border-white dark:border-zinc-950 font-black text-xs uppercase  gap-2 shadow-sm hover:border-primary/20 transition-all"
              >
                <SlidersHorizontal className="size-4" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] rounded-[3rem] p-10 border-border/40 overflow-hidden shadow-premium">
              <DialogHeader className=" relative z-10">
                <DialogTitle className="text-3xl font-black text-foreground  uppercase leading-none">
                  Advanced <span className="text-primary">Filters</span>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 mt-6 relative z-10 max-h-[50vh] overflow-y-auto no-scrollbar">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-muted-foreground pl-1 flex items-center gap-2">
                    Post Category
                  </Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) => {
                      setCategoryFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="py-6 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold text-xs uppercase  px-6">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/40">
                      <SelectItem value="any" className="font-bold text-xs ">
                        All Categories
                      </SelectItem>
                      {[
                        "URGENT",
                        "EMERGENCY",
                        "EVENT",
                        "ANNOUNCEMENT",
                        "GENERAL",
                        "RECAP",
                      ].map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                          className="font-bold text-xs "
                        >
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-muted-foreground pl-1 flex items-center gap-2">
                    Division
                  </Label>
                  <Select
                    value={divisionId || "any"}
                    onValueChange={(v) => {
                      if (v === "any") {
                        setDivisionId("");
                        setDistrictId("");
                        setUpazilaId("");
                      } else {
                        setDivisionId(v);
                        setDistrictId("");
                        setUpazilaId("");
                      }
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="py-6 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold text-xs uppercase  px-6">
                      <SelectValue placeholder="Any Division" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/40">
                      <SelectItem value="any" className="font-bold text-xs ">
                        Any Division
                      </SelectItem>
                      {(divisionsData?.data ?? []).map((d) => (
                        <SelectItem
                          key={d.id}
                          value={d.id}
                          className="font-bold text-xs "
                        >
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-muted-foreground pl-1 flex items-center gap-2">
                    District
                  </Label>
                  <Select
                    value={districtId || "any"}
                    onValueChange={(v) => {
                      if (v === "any") {
                        setDistrictId("");
                        setUpazilaId("");
                      } else {
                        setDistrictId(v);
                        setUpazilaId("");
                      }
                      setPage(1);
                    }}
                    disabled={!divisionId}
                  >
                    <SelectTrigger className="py-6 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold text-xs uppercase  px-6">
                      <SelectValue placeholder="Any District" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/40">
                      <SelectItem value="any" className="font-bold text-xs ">
                        Any District
                      </SelectItem>
                      {(districtsData?.data ?? []).map((d) => (
                        <SelectItem
                          key={d.id}
                          value={d.id}
                          className="font-bold text-xs "
                        >
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-muted-foreground pl-1 flex items-center gap-2">
                    Upazila / Area
                  </Label>
                  <Select
                    value={upazilaId || "any"}
                    onValueChange={(v) => {
                      setUpazilaId(v === "any" ? "" : v);
                      setPage(1);
                    }}
                    disabled={!districtId}
                  >
                    <SelectTrigger className="py-6 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold text-xs uppercase  px-6">
                      <SelectValue placeholder="Any Area" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/40">
                      <SelectItem value="any" className="font-bold text-xs ">
                        Any Area
                      </SelectItem>
                      {(upazilasData?.data ?? []).map((u) => (
                        <SelectItem
                          key={u.id}
                          value={u.id}
                          className="font-bold text-xs "
                        >
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-muted-foreground pl-1 flex items-center gap-2">
                    Sort
                  </Label>
                  <Select
                    value={sortOrder}
                    onValueChange={(value) => {
                      setSortOrder(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="py-6 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold text-xs uppercase  px-6">
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/40">
                      <SelectItem value="newest" className="font-bold text-xs ">
                        Newest First
                      </SelectItem>
                      <SelectItem value="oldest" className="font-bold text-xs ">
                        Oldest First
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="h-12 rounded-2xl font-black text-xs uppercase  border-border/40 hover:bg-zinc-50 transition-all active:scale-95"
                >
                  Clear
                </Button>
                <DialogTrigger asChild>
                  <Button className="h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase  shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    Apply
                  </Button>
                </DialogTrigger>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Posts Grid */}
      {sortedAndFilteredPosts.length === 0 ? (
        <div className="py-32 text-center space-y-6">
          <div className="size-24 rounded-[3rem] bg-zinc-50 dark:bg-zinc-900 border border-border/40 flex items-center justify-center mx-auto shadow-sm">
            <ClipboardList className="size-10 text-muted-foreground/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black uppercase  ">
              No Signals Found
            </h3>
            <p className="text-muted-foreground font-medium text-lg">
              We couldn&apos;t find any posts matching your search criteria.
            </p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div
            className={cn(
              "grid gap-8",
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1",
            )}
          >
            {pagedPosts.map((post, i) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <PostCard post={post} isModify={false} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {filteredTotal > 0 && (
        <PaginationSection
          page={page}
          total={filteredTotal}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
