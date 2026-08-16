"use client";

import { useMemo } from "react";
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetUpazilasQuery,
} from "@/redux/features/location/locationApi";

export function useLocationCascade(divisionId?: string, districtId?: string) {
  const { data: divisionsData, isLoading: divisionsLoading, isError: divisionsError } =
    useGetDivisionsQuery();
  const { data: districtsData, isLoading: districtsLoading, isError: districtsError } =
    useGetDistrictsQuery(
      divisionId ? { divisionId } : undefined,
      { skip: !divisionId },
    );
  const { data: upazilasData, isLoading: upazilasLoading, isError: upazilasError } =
    useGetUpazilasQuery(
      districtId ? { districtId } : undefined,
      { skip: !districtId },
    );

  const divisions = useMemo(() => divisionsData?.data ?? [], [divisionsData]);
  const districts = useMemo(() => districtsData?.data ?? [], [districtsData]);
  const upazilas = useMemo(() => upazilasData?.data ?? [], [upazilasData]);

  return {
    divisions,
    districts,
    upazilas,
    isLoading: divisionsLoading || districtsLoading || upazilasLoading,
    isError: divisionsError || districtsError || upazilasError,
  };
}
