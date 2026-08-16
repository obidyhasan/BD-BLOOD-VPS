"use client"

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock3, MapPin, Phone, Stethoscope, ShieldCheck, Activity, Zap, Loader2, Hospital, Filter, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import DetailsHeader from "@/components/shared/DetailsHeader/DetailsHeader";
import { useGetInstitutionBySlugQuery } from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import type { MedicalInstitution } from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import { mapInstitutionToUI, type InstitutionUI } from "@/lib/medical";
import Link from "next/link";

const MedicalDetailsPage = ({
  slug,
  initialInstitution,
}: {
  slug: string;
  initialInstitution?: MedicalInstitution | null;
}) => {
  const { data, isLoading: loading, isError } = useGetInstitutionBySlugQuery(slug, {
    skip: !slug || !!initialInstitution,
  });
  const institution: InstitutionUI | null = useMemo(() => {
    const raw = data?.data ?? initialInstitution;
    if (!raw) return null;
    return mapInstitutionToUI(raw);
  }, [data, initialInstitution]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const allSpecialists = useMemo(() => {
    if (!institution) return [];
    return institution.specialists ?? [];
  }, [institution]);

  const uniqueSpecialties = useMemo(() => {
    const specialties = allSpecialists.map(s => s.specialist);
    return Array.from(new Set(specialties));
  }, [allSpecialists]);

  const filteredDoctors = useMemo(() => {
    if (selectedSpecialty === "all") return allSpecialists;
    return allSpecialists.filter(doc => doc.specialist === selectedSpecialty);
  }, [allSpecialists, selectedSpecialty]);

  if (loading && !initialInstitution) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-12 text-primary animate-spin" />
        <p className="text-xs font-black uppercase  opacity-40">Loading Facility Details...</p>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <Hospital className="size-20 text-muted-foreground/20" />
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter ">{isError ? "Unable to Load Institution" : "Institution Not Found"}</h2>
          <p className="text-sm font-medium text-muted-foreground">
            {isError
              ? "The medical directory is temporarily unavailable. Please try again."
              : "The requested medical facility is not registered in our directory."}
          </p>
        </div>
        <Link href="/medical">
          <Button variant="outline" className="h-12 px-8 rounded-2xl font-black text-xs uppercase ">
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-10 md:pb-16">
      <DetailsHeader
        backLink="/medical"
        backText="Back to Medical Directory"
        badge={
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full px-4 py-1.5 text-xs font-black uppercase  flex items-center gap-2">
            <ShieldCheck className="size-3" />
            Verified Institution
          </Badge>
        }
        title={institution.name}
        rightElement={
          <div className="p-6 rounded-[2rem] bg-white border border-border/50 text-center min-w-[180px]">
            <p className="text-xs font-black text-muted-foreground uppercase opacity-80">Current Status</p>
            <div className="flex items-center justify-center gap-2 pt-2 text-emerald-500">
              <Zap className=" size-4 fill-current animate-pulse" />
              <span className="text-xl font-bold">{institution.status}</span>
            </div>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Core Medical Profile */}
        <Card className="rounded-[3rem] border-border/40 overflow-hidden bg-white dark:bg-zinc-900 shadow-none">
          <CardContent className="p-8 md:p-12 space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <p className="text-xs font-black text-muted-foreground uppercase opacity-40">Location</p>
                <p className="flex items-center gap-2 text-sm font-black text-foreground tracking-tight underline decoration-primary/30 decoration-2 underline-offset-4">
                  <MapPin className="size-4 text-primary" />
                  {institution.upazila}, {institution.district}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-muted-foreground uppercase opacity-40">Emergency Hotline</p>
                <p className="flex items-center gap-2 text-sm font-black text-foreground tracking-tight underline decoration-primary/30 decoration-2 underline-offset-4">
                  <Phone className="size-4 text-primary" />
                  {institution.phone}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-muted-foreground uppercase opacity-40">Operating Hours</p>
                <p className="flex items-center gap-2 text-sm font-black text-foreground tracking-tight underline decoration-primary/30 decoration-2 underline-offset-4">
                  <Clock3 className="size-4 text-primary" />
                  {institution.status}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-muted-foreground uppercase opacity-40">Specialists</p>
                <p className="flex items-center gap-2 text-sm font-black text-foreground tracking-tight">
                  <Activity className="size-4 text-primary" />
                  {institution.doctorsCount}+ Verified Doctors
                </p>
              </div>
            </div>

            <Separator className="border-dashed" />

            <div className="space-y-8 prose prose-zinc dark:prose-invert max-w-none">
              <div className="text-lg font-medium text-muted-foreground leading-relaxed space-y-6 ">
                <p>
                  {institution.address}
                </p>
              </div>
            </div>

            {/* Specialists Section */}
            <div className="pt-10 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="text-lg sm:text-xl font-black text-foreground uppercase flex items-center gap-2">
                  <Stethoscope className="size-5" />
                  Available Medical Specialists
                </h4>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0 min-w-[240px]">
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full h-12 px-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-border/40 font-bold text-xs uppercase  hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all justify-between"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Filter className="size-3 text-primary shrink-0" />
                            <span className="truncate">
                              {selectedSpecialty === "all" ? "All Specialists" : selectedSpecialty}
                            </span>
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[240px] p-0 rounded-2xl border-border/40 shadow-2xl overflow-hidden">
                        <Command className="rounded-2xl">
                          <CommandInput
                            placeholder="Search specialty..."
                            className="h-12 border-none font-bold text-xs uppercase "
                          />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty className="py-6 text-center text-xs font-bold text-muted-foreground uppercase ">
                              No specialty found.
                            </CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="all"
                                onSelect={() => {
                                  setSelectedSpecialty("all");
                                  setOpen(false);
                                }}
                                className="flex items-center gap-3 py-3 px-4 font-bold text-xs uppercase  cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 text-primary",
                                    selectedSpecialty === "all" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                All Specialists
                              </CommandItem>
                              {uniqueSpecialties.map((specialty) => (
                                <CommandItem
                                  key={specialty}
                                  value={specialty}
                                  onSelect={() => {
                                    setSelectedSpecialty(specialty);
                                    setOpen(false);
                                  }}
                                  className="flex items-center gap-3 py-3 px-4 font-bold text-xs uppercase  cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                  <Check
                                    className={cn(
                                      "h-4 w-4 text-primary",
                                      selectedSpecialty === specialty ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {specialty}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDoctors.map((doc) => (
                  <div key={doc.name} className="flex flex-col p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/50 border border-border/40 hover:border-primary/30 transition-all group gap-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div>
                      <p className="text-base font-black text-foreground uppercase tracking-tight ">{doc.name}</p>
                      <p className="text-xs font-bold text-primary uppercase  mt-1">{doc.specialist}</p>
                    </div>
                    <div className="space-y-3 mt-2 flex-grow flex flex-col justify-end">
                      <div className="flex items-start gap-2 text-xs font-medium text-muted-foreground">
                        <Clock3 className="size-4 text-primary shrink-0" />
                        <span>{doc.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Phone className="size-4 text-primary shrink-0" />
                        <span>{doc.contact}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredDoctors.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-border/50 py-12 text-center text-sm font-semibold text-muted-foreground">
                    No doctors are currently listed for this institution.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MedicalDetailsPage;
