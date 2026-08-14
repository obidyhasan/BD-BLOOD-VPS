"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Power,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
} from "lucide-react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateOrganizationMutation,
  useDeleteOrganizationMutation,
  useGetAllOrganizationsQuery,
  useUpdateOrganizationMutation,
  useUpdateOrganizationVerificationMutation,
  type Organization,
} from "@/redux/features/organizations/organizationsApi";
import {
  useGetDistrictsQuery,
  useGetDivisionsQuery,
  useGetUpazilasQuery,
} from "@/redux/features/location/locationApi";

const PAGE_SIZE = 9;
const ALL_VALUE = "All";

type OrgStatus = Organization["organizationStatus"];
type VerificationStatus = Organization["verificationStatus"];

type OrganizationFormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  description: string;
  logo: string;
  type: string;
  organizationStatus: OrgStatus;
  verificationStatus: VerificationStatus;
};

const DEFAULT_FORM: OrganizationFormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  divisionId: "",
  districtId: "",
  upazilaId: "",
  description: "",
  logo: "",
  type: "",
  organizationStatus: "ACTIVE",
  verificationStatus: "VERIFIED",
};

const organizationTypes = [
  "Division Organization",
  "District Organization",
  "Upazila Organization",
  "Main Hub",
  "Regional Branch",
  "Blood Bank",
  "Volunteer Group",
];

const verificationColor = (v: string) =>
  v === "VERIFIED"
    ? "bg-emerald-500/10 text-emerald-500"
    : v === "REJECTED"
      ? "bg-red-500/10 text-red-500"
      : "bg-amber-500/10 text-amber-500";

const statusColor = (s: string) =>
  s === "ACTIVE"
    ? "bg-blue-500/10 text-blue-500"
    : s === "SUSPENDED"
      ? "bg-red-500/10 text-red-500"
      : "bg-zinc-500/10 text-zinc-500";

const compactDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const toFormState = (org: Organization): OrganizationFormState => ({
  name: org.name ?? "",
  phone: org.phone ?? "",
  email: org.email ?? "",
  address: org.address ?? "",
  divisionId: org.divisionId ?? "",
  districtId: org.districtId ?? "",
  upazilaId: org.upazilaId ?? "",
  description: org.description ?? "",
  logo: org.logo ?? "",
  type: org.type ?? "",
  organizationStatus: org.organizationStatus,
  verificationStatus: org.verificationStatus,
});

const buildPayload = (form: OrganizationFormState) => ({
  name: form.name.trim(),
  phone: form.phone.trim(),
  email: form.email.trim() || undefined,
  address: form.address.trim(),
  divisionId: form.divisionId,
  districtId: form.districtId,
  upazilaId: form.upazilaId,
  description: form.description.trim() || undefined,
  logo: form.logo.trim() || undefined,
  type: form.type.trim() || undefined,
  organizationStatus: form.organizationStatus,
  verificationStatus: form.verificationStatus,
});

export default function AdminOrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_VALUE);
  const [verificationFilter, setVerificationFilter] = useState(ALL_VALUE);
  const [typeFilter, setTypeFilter] = useState(ALL_VALUE);
  const [divisionFilter, setDivisionFilter] = useState(ALL_VALUE);
  const [districtFilter, setDistrictFilter] = useState(ALL_VALUE);
  const [upazilaFilter, setUpazilaFilter] = useState(ALL_VALUE);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<Organization | null>(null);
  const [editTarget, setEditTarget] = useState<Organization | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<OrganizationFormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useGetAllOrganizationsQuery({ limit: 1000, adminView: true });
  const { data: divisionsData } = useGetDivisionsQuery();
  const { data: districtsData } = useGetDistrictsQuery({ limit: 100 });
  const { data: upazilasData } = useGetUpazilasQuery({ limit: 600 });
  const { data: formDistrictsData } = useGetDistrictsQuery(
    form.divisionId
      ? { divisionId: form.divisionId, limit: 100 }
      : { limit: 100 },
  );
  const { data: formUpazilasData } = useGetUpazilasQuery(
    form.districtId
      ? { districtId: form.districtId, limit: 300 }
      : { limit: 300 },
  );
  const [createOrganization] = useCreateOrganizationMutation();
  const [updateOrganization] = useUpdateOrganizationMutation();
  const [updateVerification] = useUpdateOrganizationVerificationMutation();
  const [deleteOrganization] = useDeleteOrganizationMutation();

  const orgs = data?.data ?? [];
  const divisions = divisionsData?.data ?? [];
  const districts = districtsData?.data ?? [];
  const upazilas = upazilasData?.data ?? [];
  const formDistricts = formDistrictsData?.data ?? [];
  const formUpazilas = formUpazilasData?.data ?? [];

  const typeOptions = useMemo(() => {
    const fromApi = orgs.map((org) => org.type).filter(Boolean) as string[];
    return Array.from(new Set([...organizationTypes, ...fromApi]));
  }, [orgs]);

  const filteredDistricts = useMemo(
    () =>
      divisionFilter === ALL_VALUE
        ? districts
        : districts.filter(
          (district) => district.divisionId === divisionFilter,
        ),
    [districts, divisionFilter],
  );

  const filteredUpazilas = useMemo(
    () =>
      districtFilter === ALL_VALUE
        ? upazilas
        : upazilas.filter((upazila) => upazila.districtId === districtFilter),
    [upazilas, districtFilter],
  );

  const stats = useMemo(
    () => [
      {
        label: "Total Organizations",
        val: orgs.length.toString(),
        icon: Building2,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        sub: "Registered organizations",
      },
      {
        label: "Total Members",
        val: orgs
          .reduce((sum, o) => sum + (o._count?.members || 0), 0)
          .toLocaleString(),
        icon: Users,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        sub: "Across all organizations",
      },
      {
        label: "Verified",
        val: orgs
          .filter((o) => o.verificationStatus === "VERIFIED")
          .length.toString(),
        icon: ShieldCheck,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        sub: "Approved by admin",
      },
      {
        label: "Suspended",
        val: orgs
          .filter((o) => o.organizationStatus === "SUSPENDED")
          .length.toString(),
        icon: ShieldOff,
        color: "text-red-500",
        bg: "bg-red-500/10",
        sub: "Restricted access",
      },
    ],
    [orgs],
  );

  const filtered = useMemo(() => {
    return orgs.filter((org) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        org.name.toLowerCase().includes(q) ||
        org.phone.toLowerCase().includes(q) ||
        (org.email || "").toLowerCase().includes(q) ||
        (org.address || "").toLowerCase().includes(q) ||
        (org.type || "").toLowerCase().includes(q) ||
        (org.district?.name || "").toLowerCase().includes(q) ||
        (org.division?.name || "").toLowerCase().includes(q) ||
        (org.upazila?.name || "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === ALL_VALUE || org.organizationStatus === statusFilter;
      const matchVerification =
        verificationFilter === ALL_VALUE ||
        org.verificationStatus === verificationFilter;
      const matchType = typeFilter === ALL_VALUE || org.type === typeFilter;
      const matchDivision =
        divisionFilter === ALL_VALUE || org.divisionId === divisionFilter;
      const matchDistrict =
        districtFilter === ALL_VALUE || org.districtId === districtFilter;
      const matchUpazila =
        upazilaFilter === ALL_VALUE || org.upazilaId === upazilaFilter;
      return (
        matchSearch &&
        matchStatus &&
        matchVerification &&
        matchType &&
        matchDivision &&
        matchDistrict &&
        matchUpazila
      );
    });
  }, [
    orgs,
    searchQuery,
    statusFilter,
    verificationFilter,
    typeFilter,
    divisionFilter,
    districtFilter,
    upazilaFilter,
  ]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter(ALL_VALUE);
    setVerificationFilter(ALL_VALUE);
    setTypeFilter(ALL_VALUE);
    setDivisionFilter(ALL_VALUE);
    setDistrictFilter(ALL_VALUE);
    setUpazilaFilter(ALL_VALUE);
    setCurrentPage(1);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setFormOpen(true);
  };

  const openEdit = (org: Organization) => {
    setEditTarget(org);
    setForm(toFormState(org));
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (
      !form.name ||
      !form.phone ||
      !form.address ||
      !form.divisionId ||
      !form.districtId ||
      !form.upazilaId
    ) {
      toast.error("Please complete all required organization fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (editTarget) {
        await updateOrganization({ id: editTarget.id, data: payload }).unwrap();
        toast.success("Organization updated successfully.");
      } else {
        await createOrganization(payload).unwrap();
        toast.success("Organization created successfully.");
      }
      setFormOpen(false);
      setEditTarget(null);
      setForm(DEFAULT_FORM);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String(
            (err as { data?: { message?: string } }).data?.message ??
            "Failed to save organization",
          )
          : "Failed to save organization";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOrganization(deleteTarget.id).unwrap();
      toast.success("Organization deleted successfully.");
    } catch {
      toast.error("Failed to delete organization.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const quickVerification = async (
    org: Organization,
    verificationStatus: VerificationStatus,
  ) => {
    try {
      await updateVerification({ id: org.id, verificationStatus }).unwrap();
      toast.success(`Organization marked ${verificationStatus.toLowerCase()}.`);
    } catch {
      toast.error("Failed to update verification.");
    }
  };

  const quickStatus = async (
    org: Organization,
    organizationStatus: OrgStatus,
  ) => {
    try {
      await updateOrganization({
        id: org.id,
        data: { organizationStatus },
      }).unwrap();
      toast.success(
        `Organization status changed to ${organizationStatus.toLowerCase()}.`,
      );
    } catch {
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <DashboardHeader
          variant="clinical"
          title="Organizations"
          subtitle="Create, verify, suspend, and manage every organization on the platform."
          badge="Full Admin Control"
        />
        <Button
          onClick={openCreate}
          className="h-14 px-8 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase hover:bg-zinc-900 shadow-xl"
        >
          New Organization <Plus className="ml-2 size-4 text-emerald-500" />
        </Button>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="rounded-[2rem] border-border/40 shadow-none hover:shadow-premium transition-all duration-300 group h-full">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`size-11 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon className="size-5" />
                  </div>
                  <ArrowUpRight
                    className={`size-4 ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground  opacity-60">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-black text-foreground tracking-tighter">
                    {stat.val}
                  </p>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground opacity-40">
                  {stat.sub}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-3 lg:grid-cols-[1.6fr_repeat(6,minmax(140px,1fr))_auto] items-center"
      >
        <div className="relative border border-border/40 rounded-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search name, phone, email, address, location..."
            className="h-14 pl-12 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-none font-bold"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-border/40 font-black text-[10px] uppercase px-4">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value={ALL_VALUE}>All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={verificationFilter}
          onValueChange={(v) => {
            setVerificationFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-border/40 font-black text-[10px] uppercase px-4">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value={ALL_VALUE}>All Verification</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-border/40 font-black text-[10px] uppercase px-4">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40 max-h-72">
            <SelectItem value={ALL_VALUE}>All Types</SelectItem>
            {typeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={divisionFilter}
          onValueChange={(v) => {
            setDivisionFilter(v);
            setDistrictFilter(ALL_VALUE);
            setUpazilaFilter(ALL_VALUE);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-border/40 font-black text-[10px] uppercase px-4">
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40 max-h-72">
            <SelectItem value={ALL_VALUE}>All Divisions</SelectItem>
            {divisions.map((division) => (
              <SelectItem key={division.id} value={division.id}>
                {division.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={districtFilter}
          onValueChange={(v) => {
            setDistrictFilter(v);
            setUpazilaFilter(ALL_VALUE);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-border/40 font-black text-[10px] uppercase px-4">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40 max-h-72">
            <SelectItem value={ALL_VALUE}>All Districts</SelectItem>
            {filteredDistricts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={upazilaFilter}
          onValueChange={(v) => {
            setUpazilaFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-border/40 font-black text-[10px] uppercase px-4">
            <SelectValue placeholder="Upazila" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40 max-h-72">
            <SelectItem value={ALL_VALUE}>All Upazilas</SelectItem>
            {filteredUpazilas.map((upazila) => (
              <SelectItem key={upazila.id} value={upazila.id}>
                {upazila.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={resetFilters}
          className="h-14 rounded-2xl border-border/40 font-black text-[10px] uppercase"
        >
          Reset
        </Button>
      </motion.div>

      {isLoading && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && paginated.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-20 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6">
            <Building2 className="size-10" />
          </div>
          <p className="text-xl font-black uppercase tracking-tighter">
            No Organizations Found
          </p>
          <p className="text-sm text-muted-foreground mt-2 opacity-60">
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {!isLoading && paginated.length > 0 && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="group shadow-none rounded-[2.5rem] border-border/40 overflow-hidden hover:shadow-premium transition-all duration-300 h-full">
                <CardContent className="p-7 space-y-5 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="size-14 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black text-xl group-hover:bg-purple-500 group-hover:text-white transition-all">
                      <Building2 className="size-7" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge
                        className={`rounded-full px-3 py-1 text-[8px] font-black uppercase border-none ${statusColor(org.organizationStatus)}`}
                      >
                        {org.organizationStatus}
                      </Badge>
                      <Badge
                        className={`rounded-full px-3 py-1 text-[8px] font-black uppercase border-none ${verificationColor(org.verificationStatus)}`}
                      >
                        {org.verificationStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <Link
                      href={`/organization/${org.id}`}
                      className="font-black text-xl tracking-tighter uppercase group-hover:text-purple-500 transition-colors block w-fit"
                    >
                      {org.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3 text-purple-500/60 shrink-0" />
                      <span className="text-[10px] font-bold opacity-60">
                        {org.upazila?.name ?? "-"} / {org.district?.name ?? "-"}{" "}
                        / {org.division?.name ?? "-"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InfoPill label="Phone" value={org.phone} />
                      <InfoPill
                        label="Members"
                        value={org._count?.members?.toLocaleString() ?? "0"}
                      />
                      <InfoPill label="Type" value={org.type ?? "-"} />
                      <InfoPill
                        label="Created"
                        value={compactDate(org.createdAt)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/40">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-xl border-border/40 font-black text-[9px] uppercase hover:text-purple-500 hover:border-purple-500/20"
                      onClick={() => setViewTarget(org)}
                    >
                      <Eye className="mr-1 size-3" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-xl border-border/40 font-black text-[9px] uppercase hover:text-blue-500 hover:border-blue-500/20"
                      asChild
                    >
                      <Link
                        href={`/dashboard/organization?organizationId=${org.id}`}
                      >
                        <ArrowUpRight className="mr-1 size-3" /> Dashboard
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-xl border-border/40 font-black text-[9px] uppercase hover:text-blue-500 hover:border-blue-500/20"
                      onClick={() => openEdit(org)}
                    >
                      <Edit3 className="mr-1 size-3" /> Edit
                    </Button>
                    <Select
                      value={org.verificationStatus}
                      onValueChange={(v) =>
                        quickVerification(org, v as VerificationStatus)
                      }
                    >
                      <SelectTrigger className="h-10 rounded-xl border-border/40 font-black text-[8px] uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VERIFIED">Verified</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={org.organizationStatus}
                      onValueChange={(v) => quickStatus(org, v as OrgStatus)}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-border/40 font-black text-[8px] uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="col-span-2 h-10 rounded-xl border-red-500/10 text-red-500 font-black text-[9px] uppercase hover:bg-red-500/10"
                      onClick={() => setDeleteTarget(org)}
                    >
                      <Trash2 className="mr-1 size-3" /> Delete Organization
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase  text-muted-foreground opacity-60">
            Page {currentPage} of {totalPages} - {filtered.length} organizations
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase"
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase"
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => !open && setFormOpen(false)}
      >
        <DialogContent className="rounded-[2.5rem] border-border/40 p-8 sm:max-w-3xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <DialogHeader className="space-y-4 mb-4">
            <div className="size-16 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Building2 className="size-8" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tighter uppercase">
                {editTarget ? "Edit Organization" : "Create Organization"}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground/60  mt-1">
                Manage identity, location, operating status and verification
                from the admin dashboard.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[62vh] overflow-y-auto pr-2">
            <FormInput
              label="Organization Name"
              value={form.name}
              required
              onChange={(value) =>
                setForm((prev) => ({ ...prev, name: value }))
              }
            />
            <FormInput
              label="Phone"
              value={form.phone}
              required
              onChange={(value) =>
                setForm((prev) => ({ ...prev, phone: value }))
              }
            />
            <FormInput
              label="Email"
              value={form.email}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, email: value }))
              }
            />
            <FormInput
              label="Logo URL"
              value={form.logo}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, logo: value }))
              }
            />
            <FormInput
              label="Address"
              value={form.address}
              required
              className="md:col-span-2"
              onChange={(value) =>
                setForm((prev) => ({ ...prev, address: value }))
              }
            />

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                Division *
              </Label>
              <Select
                value={form.divisionId}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    divisionId: value,
                    districtId: "",
                    upazilaId: "",
                  }))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-border/40 font-bold">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-72">
                  {divisions.map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                District *
              </Label>
              <Select
                value={form.districtId}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    districtId: value,
                    upazilaId: "",
                  }))
                }
                disabled={!form.divisionId}
              >
                <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-border/40 font-bold">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-72">
                  {formDistricts.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                Upazila *
              </Label>
              <Select
                value={form.upazilaId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, upazilaId: value }))
                }
                disabled={!form.districtId}
              >
                <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-border/40 font-bold">
                  <SelectValue placeholder="Select upazila" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-72">
                  {formUpazilas.map((upazila) => (
                    <SelectItem key={upazila.id} value={upazila.id}>
                      {upazila.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                Type
              </Label>
              <Select
                value={form.type || "CUSTOM"}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    type: value === "CUSTOM" ? "" : value,
                  }))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-border/40 font-bold">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-72">
                  <SelectItem value="CUSTOM">Custom / Empty</SelectItem>
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormInput
              label="Custom Type"
              value={form.type}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, type: value }))
              }
            />
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                Organization Status
              </Label>
              <Select
                value={form.organizationStatus}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    organizationStatus: value as OrgStatus,
                  }))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-border/40 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                Verification
              </Label>
              <Select
                value={form.verificationStatus}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    verificationStatus: value as VerificationStatus,
                  }))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-border/40 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                Description
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="min-h-28 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-border/40 font-bold"
                placeholder="Organization details, coverage, rules or notes..."
              />
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-4 mt-6">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl font-black text-xs uppercase border-border/40"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="h-12 rounded-2xl font-black text-xs uppercase bg-purple-500 hover:bg-purple-600 text-white shadow-xl shadow-purple-500/20"
            >
              {saving
                ? "Saving..."
                : editTarget
                  ? "Update Organization"
                  : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
      >
        <DialogContent className="rounded-[2.5rem] border-border/40 p-8 sm:max-w-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <DialogHeader>
            <div className="size-16 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
              <Building2 className="size-8" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tighter uppercase">
              {viewTarget?.name}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium opacity-60">
              {viewTarget?.type ?? "Organization"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pb-4">
            {[
              { label: "Phone", val: viewTarget?.phone },
              { label: "Email", val: viewTarget?.email },
              { label: "Verification", val: viewTarget?.verificationStatus },
              { label: "Status", val: viewTarget?.organizationStatus },
              { label: "Division", val: viewTarget?.division?.name },
              { label: "District", val: viewTarget?.district?.name },
              { label: "Upazila", val: viewTarget?.upazila?.name },
              {
                label: "Members",
                val: viewTarget?._count?.members?.toLocaleString(),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/40"
              >
                <p className="text-[9px] font-black uppercase  opacity-40">
                  {item.label}
                </p>
                <p className="font-black text-sm mt-0.5 truncate">
                  {item.val ?? "-"}
                </p>
              </div>
            ))}
          </div>
          {viewTarget?.description && (
            <p className="text-sm font-medium text-muted-foreground leading-relaxed rounded-2xl border border-border/40 bg-zinc-50 dark:bg-zinc-900 p-4">
              {viewTarget.description}
            </p>
          )}
          <div className="flex gap-3 mt-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="h-12 rounded-2xl font-black text-xs uppercase border-border/40"
              >
                Close
              </Button>
            </DialogClose>
            {viewTarget && (
              <Link href={`/organization/${viewTarget.id}`} className="w-full">
                <Button className="w-full h-12 rounded-2xl font-black text-xs uppercase bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20">
                  View Public Profile
                </Button>
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Organization"
        description={`Delete ${deleteTarget?.name ?? "this organization"}? Related members, inventory, events and galleries may lose access because this record will be soft deleted.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/40 p-3">
      <p className="text-[8px] font-black uppercase  opacity-40">
        {label}
      </p>
      <p className="text-xs font-black truncate mt-0.5">{value}</p>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
        {label} {required ? "*" : ""}
      </Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-border/40 font-bold"
      />
    </div>
  );
}
