"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hospital, Search, Loader2 } from "lucide-react";
import { PaginationSection, paginateList } from "@/components/shared/Pagination/Pagination";
import { InstitutionCard } from "./components/InstitutionCard";
import { DoctorCard } from "./components/DoctorCard";
import { LibraryCard } from "./components/LibraryCard";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import LocationSelector from "@/components/shared/LocationSelector/LocationSelector";
import {
  useGetAllInstitutionsQuery,
  useGetAllDoctorsQuery,
  useGetAllMedicalInfosQuery,
} from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import { mapInstitutionToUI } from "@/lib/medical";

import type { MedicalInstitution } from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";

type MedicalPageProps = {
  initialInstitutions?: MedicalInstitution[];
  initialDoctors?: unknown[];
  initialMedicalInfos?: unknown[];
};

const MedicalPage = ({
  initialInstitutions,
  initialDoctors,
  initialMedicalInfos,
}: MedicalPageProps) => {
  const [divisionId, setDivisionId] = useState<string>();
  const [districtId, setDistrictId] = useState<string>();
  const [upazilaId, setUpazilaId] = useState<string>();
  const hasLocationFilter = Boolean(divisionId || districtId || upazilaId);
  const locationQuery = { limit: 100, divisionId, districtId, upazilaId };
  const { data, isLoading: loading } = useGetAllInstitutionsQuery(
    locationQuery,
    { skip: !!initialInstitutions?.length && !hasLocationFilter },
  );
  const { data: doctorsData, isLoading: doctorsLoading } =
    useGetAllDoctorsQuery(locationQuery, { skip: !!initialDoctors?.length && !hasLocationFilter });
  const { data: infosData, isLoading: infosLoading } =
    useGetAllMedicalInfosQuery(locationQuery, {
      skip: !!initialMedicalInfos?.length && !hasLocationFilter,
    });

  const institutions = useMemo(
    () => (hasLocationFilter ? data?.data ?? [] : initialInstitutions ?? data?.data ?? []).map(mapInstitutionToUI),
    [data, hasLocationFilter, initialInstitutions],
  );
  const doctors = (hasLocationFilter ? doctorsData?.data ?? [] : initialDoctors ?? doctorsData?.data ?? []) as NonNullable<typeof doctorsData>["data"];
  const medicalInfos = (hasLocationFilter ? infosData?.data ?? [] : initialMedicalInfos ?? infosData?.data ?? []) as NonNullable<typeof infosData>["data"];
  const pageLoading = !initialInstitutions?.length && loading;

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [activeTab, setActiveTab] = useState("institutions");
  const filteredInstitutions = useMemo(() => {
    return institutions.filter((i) => {
      const matchesSearch =
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [institutions, searchQuery]);

  const filteredDoctors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q),
    );
  }, [doctors, searchQuery]);

  const filteredInfos = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return medicalInfos.filter(
      (info) =>
        info.title.toLowerCase().includes(q) ||
        (info.category ?? "").toLowerCase().includes(q),
    );
  }, [medicalInfos, searchQuery]);

  const institutionsPage = paginateList(filteredInstitutions, page, pageSize);
  const doctorsPage = paginateList(filteredDoctors, page, pageSize);
  const infosPage = paginateList(filteredInfos, page, pageSize);
  const paginationTotal =
    activeTab === "doctors"
      ? doctorsPage.total
      : activeTab === "medical-info"
        ? infosPage.total
        : institutionsPage.total;

  return (
    <div className="min-h-screen bg-white pb-10 md:pb-16">
      <PageHeader
        icon={<Hospital className="size-3.5" />}
        badgeText="Medical Directory"
        titleBase="Find"
        titleSpan="Hospitals"
        titleSuffix="& Doctors"
        description="Find verified hospitals, clinics, and doctors across Bangladesh. Search for blood transfusion services and emergency care near you."
      />

      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full lg:w-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search institutions, specialists, articles..."
              className="pl-14 h-12 rounded-[1.5rem] border-border/40 text-sm font-medium focus:border-primary transition-all shadow-sm"
            />
          </div>
          <LocationSelector
            divisionId={divisionId}
            setDivisionId={setDivisionId}
            districtId={districtId}
            setDistrictId={setDistrictId}
            upazilaId={upazilaId}
            setUpazilaId={setUpazilaId}
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setPage(1);
          }}
          className="w-full"
        >
          <TabsList className="bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] p-2 py-7 mb-12 flex w-full sm:w-fit mx-auto lg:mx-0">
            <TabsTrigger value="institutions" className="rounded-[1.5rem] px-4 md:px-8 py-5 h-full font-black text-sm uppercase tracking-wider">
              Medicals
            </TabsTrigger>
            <TabsTrigger value="doctors" className="rounded-[1.5rem] px-4 md:px-8 py-5 h-full font-black text-sm uppercase tracking-wider">
              Doctors
            </TabsTrigger>
            <TabsTrigger value="medical-info" className="rounded-[1.5rem] px-4 md:px-8 py-5 h-full font-black text-sm uppercase tracking-wider">
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="institutions" className="m-0 focus-visible:outline-none">
            {pageLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-[2rem] bg-zinc-50 animate-pulse border border-border/40" />
                ))}
              </div>
            ) : filteredInstitutions.length === 0 ? (
              <div className="py-20 text-center opacity-40">
                <Hospital className="size-16 mx-auto mb-4 stroke-1" />
                <p className="text-xl font-black uppercase tracking-tighter">No Institutions Found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {institutionsPage.items.map((item, i) => (
                  <InstitutionCard key={item.id} item={item} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="doctors" className="m-0 focus-visible:outline-none">
            {doctorsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="py-20 text-center opacity-40">
                <p className="text-xl font-black uppercase tracking-tighter">No doctors found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {doctorsPage.items.map((doctor, i) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={{
                      name: doctor.name,
                      specialty: doctor.specialization,
                      chamber: doctor.institution?.name ?? "Medical Institution",
                      phone: doctor.phone,
                      exp: doctor.experience ?? "",
                    }}
                    index={i}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="medical-info" className="m-0 focus-visible:outline-none">
            {infosLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : filteredInfos.length === 0 ? (
              <div className="py-20 text-center opacity-40">
                <p className="text-xl font-black uppercase tracking-tighter">No articles found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {infosPage.items.map((info, i) => (
                  <LibraryCard
                    key={info.id}
                    info={{
                      slug: info.id,
                      title: info.title,
                      summary: info.content.slice(0, 160),
                      category: info.category ?? "General",
                      date: new Date(info.createdAt).toLocaleDateString(),
                    }}
                    index={i}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {paginationTotal > pageSize && (
          <div className="pt-10 border-t border-border/40 border-dashed flex justify-center">
            <PaginationSection
              page={page}
              total={paginationTotal}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalPage;
