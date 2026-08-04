"use client";

/** @deprecated Use `useLocationCascade` / location API — kept for legacy admin forms. */
export const Divisions = [
  { name: "Dhaka" },
  { name: "Barishal" },
  { name: "Chattogram" },
  { name: "Khulna" },
  { name: "Rajshahi" },
  { name: "Rangpur" },
  { name: "Mymensingh" },
  { name: "Sylhet" },
];

export const khulnaDistricts = [
  { name: "Bagerhat" },
  { name: "Chuadanga" },
  { name: "Jashore" },
  { name: "Jhenaidah" },
  { name: "Khulna" },
  { name: "Kushtia" },
  { name: "Magura" },
  { name: "Meherpur" },
  { name: "Narail" },
  { name: "Satkhira" },
];

export const bagerhatUpazilas = [
  { name: "Bagerhat Sadar" },
  { name: "Chitalmari" },
  { name: "Fakirhat" },
  { name: "Kachua" },
  { name: "Mollahat" },
  { name: "Mongla" },
  { name: "Morrelganj" },
  { name: "Rampal" },
  { name: "Sarankhola" },
];

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocationCascade } from "@/hooks/useLocationCascade";

interface LocationSelectorProps {
  divisionId?: string;
  setDivisionId?: (value: string) => void;
  districtId?: string;
  setDistrictId?: (value: string) => void;
  upazilaId?: string;
  setUpazilaId?: (value: string) => void;
  /** Legacy: district name filter (maps to districtId when possible). */
  zila?: string;
  setZila?: (value: string) => void;
  /**
   * Optional hook fired right after an upazila is picked, in addition to
   * `setUpazilaId`. Opt-in only — most callers (Medical page, admin forms)
   * just want the id captured, but callers like the public Organization
   * directory use this to redirect straight to that upazila's public
   * organization profile page.
   */
  onUpazilaSelect?: (upazilaId: string) => void;
}

export const LocationSelector = ({
  divisionId,
  setDivisionId,
  districtId,
  setDistrictId,
  upazilaId,
  setUpazilaId,
  zila,
  setZila,
  onUpazilaSelect,
}: LocationSelectorProps) => {
  const { divisions, districts, upazilas } = useLocationCascade(
    divisionId,
    districtId,
  );

  const handleDistrictChange = (value: string) => {
    setDistrictId?.(value);
    setUpazilaId?.("");
    if (setZila) {
      const name = districts.find((d) => d.id === value)?.name ?? value;
      setZila(name);
    }
  };

  const handleUpazilaChange = (value: string) => {
    setUpazilaId?.(value);
    if (value) onUpazilaSelect?.(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
      <Select
        value={divisionId}
        onValueChange={(v) => {
          setDivisionId?.(v);
          setDistrictId?.("");
          setUpazilaId?.("");
          setZila?.("");
        }}
      >
        <SelectTrigger className="w-full py-6 bg-zinc-50 dark:bg-zinc-950 border border-border/40 rounded-2xl px-5 text-sm font-bold">
          <SelectValue placeholder="Division" />
        </SelectTrigger>
        <SelectContent>
          {divisions.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={districtId ?? (zila ? districts.find((d) => d.name === zila)?.id : undefined)}
        onValueChange={handleDistrictChange}
        disabled={!divisionId}
      >
        <SelectTrigger className="w-full py-6 bg-zinc-50 dark:bg-zinc-950 border border-border/40 rounded-2xl px-5 text-sm font-bold">
          <SelectValue placeholder="District" />
        </SelectTrigger>
        <SelectContent>
          {districts.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={upazilaId}
        onValueChange={handleUpazilaChange}
        disabled={!districtId && !zila}
      >
        <SelectTrigger className="w-full py-6 bg-zinc-50 dark:bg-zinc-950 border border-border/40 rounded-2xl px-5 text-sm font-bold">
          <SelectValue placeholder="Upazila" />
        </SelectTrigger>
        <SelectContent>
          {upazilas.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationSelector;
