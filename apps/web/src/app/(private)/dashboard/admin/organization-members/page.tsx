"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Building2,
  UserCog,
  Calendar,
  Search,
  Edit,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog/DeleteConfirmDialog";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useGetAllOrganizationsQuery,
  useGetAllOrganizationMembersQuery,
  useGetAllPositionsQuery,
  useAssignOrganizationMemberMutation,
  useUpdateMemberStatusMutation,
  type Organization,
} from "@/redux/features/organizations/organizationsApi";
import {
  useGetAllDonorsQuery,
  type Donor,
} from "@/redux/features/donors/donorsApi";
import { mapOrganizationMemberToUI, type OrgMemberUIModel } from "@/lib/member";
import {
  mapOrganizationPositionToUI,
  type SystemPositionUI,
} from "@/lib/position";
import { syncAuthSession } from "@/lib/syncAuthSession";

// Sentinel combobox value representing "National Committee — no specific
// Organization" (backend: organizationId omitted/null). Kept out of the
// real organization id space so it can't collide with an actual org id.
const NATIONAL_SCOPE_VALUE = "__national__";

const promoteSchema = z.object({
  donorId: z.string().min(1, "Select a donor"),
  organizationId: z.string().min(1, "Select an organization"),
  position: z.string().min(1, "Select a position"),
});

const editSchema = z.object({
  organizationId: z.string().min(1, "Select an organization"),
  position: z.string().min(1, "Select a position"),
});

export default function OrganizationMembersPage() {
  const { data: orgsData } = useGetAllOrganizationsQuery({ limit: 200 });
  const { data: donorsData } = useGetAllDonorsQuery({ limit: 200 });
  const { data: positionsData } = useGetAllPositionsQuery();
  const {
    data: membersData,
    isLoading: membersLoading,
    isFetching: membersFetching,
    refetch: refetchMembers,
  } = useGetAllOrganizationMembersQuery();
  const [assignMember] = useAssignOrganizationMemberMutation();
  const [updateMemberStatus] = useUpdateMemberStatusMutation();

  const orgs: Organization[] = orgsData?.data ?? [];
  const donors: Donor[] = donorsData?.data ?? [];
  const positions: SystemPositionUI[] = useMemo(
    () => (positionsData?.data ?? []).map(mapOrganizationPositionToUI),
    [positionsData],
  );

  const members: OrgMemberUIModel[] = useMemo(
    () =>
      (membersData?.data ?? []).map((m) => ({
        ...mapOrganizationMemberToUI(m),
        organizationId: m.organization?.id ?? m.organizationId ?? undefined,
        organizationName: m.organization?.name ?? "Independent",
      })),
    [membersData],
  );
  const loading = membersLoading || membersFetching;
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<OrgMemberUIModel | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrgMemberUIModel | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // Combobox open states
  const [donorOpen, setDonorOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [editOrgOpen, setEditOrgOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [orgFilter, setOrgFilter] = useState("All");
  const [positionFilter, setPositionFilter] = useState("All");

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOrg =
        orgFilter === "All" ||
        m.organizationId === orgFilter ||
        m.organizationName === orgFilter;
      const matchesPosition =
        positionFilter === "All" || m.position === positionFilter;
      return matchesSearch && matchesOrg && matchesPosition;
    });
  }, [members, searchQuery, orgFilter, positionFilter]);

  const form = useForm<z.infer<typeof promoteSchema>>({
    resolver: zodResolver(promoteSchema),
    defaultValues: { donorId: "", organizationId: "", position: "" },
  });

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: { organizationId: "", position: "" },
  });

  useEffect(() => {
    if (editTarget) {
      editForm.reset({
        organizationId: editTarget.organizationId || NATIONAL_SCOPE_VALUE,
        position: editTarget.position || "",
      });
    }
  }, [editTarget, editForm]);

  const onPromote = async (data: z.infer<typeof promoteSchema>) => {
    setPromoteLoading(true);
    try {
      const position = positions.find((p) => p.name === data.position);
      await assignMember({
        donorId: data.donorId,
        positionId: position?.id ?? data.position,
        organizationId:
          data.organizationId === NATIONAL_SCOPE_VALUE
            ? undefined
            : data.organizationId,
      }).unwrap();
      const token = localStorage.getItem("accessToken");
      if (token) {
        await syncAuthSession({ accessToken: token }).catch(() => undefined);
      }
      toast.success("Donor promoted to organization member!");
      setPromoteOpen(false);
      form.reset();
      await refetchMembers();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message)
          : "Failed to promote donor";
      toast.error(message);
    } finally {
      setPromoteLoading(false);
    }
  };

  const onEdit = async (data: z.infer<typeof editSchema>) => {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const position = positions.find((p) => p.name === data.position);
      await assignMember({
        donorId: editTarget.donorId,
        positionId: position?.id ?? data.position,
        organizationId:
          data.organizationId === NATIONAL_SCOPE_VALUE
            ? undefined
            : data.organizationId,
      }).unwrap();
      toast.success("Member details updated!");
      setEditTarget(null);
      void refetchMembers();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message)
          : "Failed to update member";
      toast.error(message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await updateMemberStatus({
        memberId: deleteTarget.id,
        status: "REJECTED",
      }).unwrap();
      toast.success("Member removed from organization");
      void refetchMembers();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const availableDonors = useMemo(() => {
    return donors.filter((d) => !members.some((m) => m.donorId === d.id));
  }, [donors, members]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <DashboardHeader
          variant="clinical"
          title="Organization Members"
          subtitle="Promote donors and manage their roles within organizations."
          badge="Management"
        />
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-3xl bg-white dark:bg-zinc-900 border border-border/40 flex items-center gap-4">
            <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="size-5" />
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
          <Button
            onClick={() => setPromoteOpen(true)}
            className="h-14 px-8 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all"
          >
            Promote Donor <Plus className="ml-2 size-4 text-emerald-500" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-4"
      >
        <div className="relative flex-1 min-w-full sm:min-w-[300px] rounded-2xl border border-border/40">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by member name or email..."
            className="h-14 pl-12 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-none font-bold"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="py-7 w-[200px] rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-border/40 font-black text-[10px] uppercase  px-6">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40">
              <SelectItem value="All" className="font-bold">
                All Organizations
              </SelectItem>
              {orgs.map((o) => (
                <SelectItem key={o.id} value={o.id} className="font-bold">
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="py-7 w-[180px] rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-border/40 font-black text-[10px] uppercase  px-6">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40">
              <SelectItem value="All" className="font-bold">
                All Positions
              </SelectItem>
              {positions.map((p) => (
                <SelectItem key={p.id} value={p.name} className="font-bold">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        {!loading &&
          filteredMembers.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="rounded-[2.5rem] shadow-none border-border/40 overflow-hidden hover:shadow-premium transition-all duration-300 group h-full">
                <CardContent className="p-7 space-y-5 flex flex-col h-full">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-2xl  group-hover:bg-blue-500 group-hover:text-white transition-all">
                      {member.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/donor/${member.slug}`}
                        className="font-black text-lg tracking-tighter truncate group-hover:text-blue-500 transition-colors uppercase block w-fit"
                      >
                        {member.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="size-3 opacity-40" />
                        <p className="text-[10px] font-bold opacity-60 truncate">
                          {member.organizationName || "Independent"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className="rounded-full px-4 py-1.5 text-[9px] font-black uppercase  border-none bg-purple-500/10 text-purple-500">
                      <UserCog className="size-3 mr-1.5 inline" />
                      {member.position}
                    </Badge>
                    <Badge
                      className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase  border-none ${member.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500"}`}
                    >
                      {member.status}
                    </Badge>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-3 opacity-40" />
                      <div>
                        <p className="text-[10px] font-black uppercase opacity-40">
                          Joined
                        </p>
                        <p className="text-sm font-black tracking-tighter">
                          {member.joinedYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-9 rounded-xl border-border/40 hover:border-primary/20 hover:text-primary transition-colors"
                        onClick={() => setEditTarget(member)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-9 rounded-xl border-red-500/10 text-red-500/60 hover:bg-red-500/10 transition-colors"
                        onClick={() => setDeleteTarget(member)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

        {!loading && filteredMembers.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 text-center">
            <div className="size-20 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
              <Users className="size-10" />
            </div>
            <p className="text-xl font-black uppercase tracking-tighter">
              No Members Found
            </p>
            <p className="text-sm text-muted-foreground mt-2 opacity-60">
              Try adjusting your filters or promote a new donor.
            </p>
          </div>
        )}
      </div>

      {/* Promote Dialog */}
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent className="rounded-[2.5rem] border-border/40 p-8 sm:max-w-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <DialogHeader className="space-y-4 mb-8">
            <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-8" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
                Promote Donor
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground/60  mt-1">
                Elevate a donor to an organization member status with an
                official position.
              </DialogDescription>
            </div>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onPromote)}
              className="space-y-5 relative z-10 w-full overflow-y-auto max-h-[60vh] pr-2"
            >
              <FormField
                control={form.control}
                name="donorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                      Select Donor
                    </FormLabel>
                    <Popover open={donorOpen} onOpenChange={setDonorOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={donorOpen}
                            className={cn(
                              "w-full justify-between py-7 rounded-2xl bg-zinc-50 border-border/40 font-bold",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? (() => {
                                const donor = availableDonors.find(
                                  (d) => d.id.toString() === field.value,
                                );
                                return donor
                                  ? `${donor.fullName} (${donor.bloodGroup?.groupName ?? ""})`
                                  : "Choose a registered donor";
                              })()
                              : "Choose a registered donor"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-2xl border-border/40">
                        <Command>
                          <CommandInput
                            placeholder="Search donor..."
                            className="font-bold"
                          />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-sm font-semibold opacity-50">
                              No donor found.
                            </CommandEmpty>
                            <CommandGroup className="max-h-[250px] overflow-auto">
                              {availableDonors.map((d) => (
                                <CommandItem
                                  value={d.fullName}
                                  key={d.id}
                                  onSelect={() => {
                                    form.setValue("donorId", d.id.toString());
                                    setDonorOpen(false);
                                  }}
                                  className="rounded-xl font-bold text-xs uppercase  my-1 cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      d.id.toString() === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {d.fullName} ({d.bloodGroup?.groupName})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                      Assign Organization
                    </FormLabel>
                    <Popover open={orgOpen} onOpenChange={setOrgOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={orgOpen}
                            className={cn(
                              "w-full justify-between py-7 rounded-2xl bg-zinc-50 border-border/40 font-bold",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value === NATIONAL_SCOPE_VALUE
                              ? "National Committee (No Organization)"
                              : field.value
                                ? orgs.find((o) => o.id === field.value)?.name
                                : "Select organization"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-2xl border-border/40">
                        <Command>
                          <CommandInput
                            placeholder="Search organization..."
                            className="font-bold"
                          />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-sm font-semibold opacity-50">
                              No organization found.
                            </CommandEmpty>
                            <CommandGroup className="max-h-[250px] overflow-auto">
                              <CommandItem
                                value="National Committee (No Organization)"
                                onSelect={() => {
                                  form.setValue(
                                    "organizationId",
                                    NATIONAL_SCOPE_VALUE,
                                  );
                                  setOrgOpen(false);
                                }}
                                className="rounded-xl font-bold text-xs uppercase  my-1 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === NATIONAL_SCOPE_VALUE
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                National Committee (No Organization)
                              </CommandItem>
                              {orgs.map((o) => (
                                <CommandItem
                                  value={o.name}
                                  key={o.id}
                                  onSelect={() => {
                                    form.setValue("organizationId", o.id);
                                    setOrgOpen(false);
                                  }}
                                  className="rounded-xl font-bold text-xs uppercase  my-1 cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      o.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {o.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                      Assign Position
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select specific position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2 max-h-[250px]">
                        {positions.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.name}
                            className="rounded-xl font-bold text-xs uppercase  my-1"
                          >
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="grid grid-cols-2 gap-4">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl font-black text-xs uppercase  border-border/40"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={promoteLoading}
                  className="h-12 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
                >
                  {promoteLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                      Processing...
                    </span>
                  ) : (
                    "Promote to Member"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent className="rounded-[2.5rem] border-border/40 p-8 sm:max-w-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <DialogHeader className="space-y-4 mb-8">
            <div className="size-16 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <UserCog className="size-8" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
                Update Member
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground/60  mt-1">
                Modify organizational affiliation and structural position for{" "}
                {editTarget?.name}.
              </DialogDescription>
            </div>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEdit)}
              className="space-y-5 relative z-10 w-full overflow-y-auto max-h-[60vh] pr-2"
            >
              <FormField
                control={editForm.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                      Assign Organization
                    </FormLabel>
                    <Popover open={editOrgOpen} onOpenChange={setEditOrgOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={editOrgOpen}
                            className={cn(
                              "w-full justify-between py-7 rounded-2xl bg-zinc-50 border-border/40 font-bold",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value === NATIONAL_SCOPE_VALUE
                              ? "National Committee (No Organization)"
                              : field.value
                                ? orgs.find((o) => o.id === field.value)?.name
                                : "Select organization"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-2xl border-border/40">
                        <Command>
                          <CommandInput
                            placeholder="Search organization..."
                            className="font-bold"
                          />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-sm font-semibold opacity-50">
                              No organization found.
                            </CommandEmpty>
                            <CommandGroup className="max-h-[250px] overflow-auto">
                              <CommandItem
                                value="National Committee (No Organization)"
                                onSelect={() => {
                                  editForm.setValue(
                                    "organizationId",
                                    NATIONAL_SCOPE_VALUE,
                                  );
                                  setEditOrgOpen(false);
                                }}
                                className="rounded-xl font-bold text-xs uppercase  my-1 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === NATIONAL_SCOPE_VALUE
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                National Committee (No Organization)
                              </CommandItem>
                              {orgs.map((o) => (
                                <CommandItem
                                  value={o.name}
                                  key={o.id}
                                  onSelect={() => {
                                    editForm.setValue("organizationId", o.id);
                                    setEditOrgOpen(false);
                                  }}
                                  className="rounded-xl font-bold text-xs uppercase  my-1 cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      o.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {o.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                      Assign Position
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select specific position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2 max-h-[250px]">
                        {positions.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.name}
                            className="rounded-xl font-bold text-xs uppercase  my-1"
                          >
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="grid grid-cols-2 gap-4">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl font-black text-xs uppercase  border-border/40"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={editLoading}
                  className="h-12 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
                >
                  {editLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                      Saving...
                    </span>
                  ) : (
                    "Update Records"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Remove Member"
        description={`Remove ${deleteTarget?.name} from ${deleteTarget?.organizationName || "the organization"}? They will lose all member privileges.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
