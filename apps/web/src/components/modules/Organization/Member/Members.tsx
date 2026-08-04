"use client";
import { useState, useMemo } from "react";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import MemberCard from "./MemberCard";
import {
  Search,
  ShieldCheck,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import {
  useGetAllPositionsQuery,
  useGetOrganizationMembersQuery,
} from "@/redux/features/organizations/organizationsApi";
import { mapOrganizationMemberToUI, type OrgMemberUIModel } from "@/lib/member";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";

const PAGE_SIZE = 9;

const Members = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const { organizationId } = useOrganizationDashboardContext();

  const { data: membersData, isLoading: membersLoading } =
    useGetOrganizationMembersQuery(organizationId, { skip: !organizationId });

  const { data: positionsData } = useGetAllPositionsQuery();

  const members: OrgMemberUIModel[] = useMemo(
    () => (membersData?.data ?? []).map(mapOrganizationMemberToUI),
    [membersData],
  );

  const availablePositions = positionsData?.data ?? [];

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.employeeId.toLowerCase().includes(q) ||
        m.position.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q);
      const matchesPosition =
        positionFilter === "All" || m.position === positionFilter;
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "active" && m.status === "active") ||
        (statusFilter === "inactive" && m.status === "inactive");
      return matchesSearch && matchesPosition && matchesStatus;
    });
  }, [members, searchQuery, positionFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <DashboardHeader
          variant="clinical"
          title="Organization Members"
          subtitle="Manage your organization's staff and team members."
          badge="Verified Operational Hub"
        />
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-3xl bg-white dark:bg-zinc-900 border border-border/40 shadow-premium flex items-center gap-4 h-full">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">
                Total Members
              </p>
              <p className="text-xl font-black tracking-tighter">
                {members.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-4"
      >
        <div className="relative flex-1 min-w-full sm:min-w-[300px] border rounded-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, phone or location..."
            className="h-14 pl-12 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={positionFilter}
            onValueChange={(value) => {
              setPositionFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="py-7 min-w-[170px] w-auto rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-border/40 font-black text-[10px] uppercase  px-6">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium p-1">
              <SelectItem value="All" className="font-bold rounded-lg my-1">
                All Positions
              </SelectItem>
              {availablePositions.map((pos) => (
                <SelectItem
                  key={pos.id}
                  value={pos.positionName}
                  className="font-bold rounded-lg my-1"
                >
                  {pos.positionName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="py-7 w-[150px] rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-border/40 font-black text-[10px] uppercase  px-6">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem value="All" className="font-bold rounded-lg my-1">
                All Status
              </SelectItem>
              <SelectItem value="active" className="font-bold rounded-lg my-1">
                Active
              </SelectItem>
              <SelectItem
                value="inactive"
                className="font-bold rounded-lg my-1"
              >
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {membersLoading && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {!membersLoading && paginated.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="size-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6">
            <UserPlus className="size-10" />
          </div>
          <p className="text-xl font-black uppercase tracking-tighter">
            No Members Found
          </p>
          <p className="text-sm text-muted-foreground font-medium mt-2 opacity-60">
            Try adjusting filters or add a new member from the donor directory.
          </p>
        </motion.div>
      )}

      {!membersLoading && paginated.length > 0 && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((member, index) => (
            <MemberCard key={member.id} member={member} index={index} />
          ))}
        </div>
      )}

      {!membersLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase  text-muted-foreground opacity-60">
            Page {currentPage} of {totalPages} · {filtered.length} members
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase "
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase "
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
