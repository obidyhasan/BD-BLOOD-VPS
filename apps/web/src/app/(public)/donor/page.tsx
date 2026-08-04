import DonorDirectoryPage from "@/components/modules/Donor/Directory/DonorDirectoryPage";
import { getPublicDonors } from "@/services/user";
import { getDivisions } from "@/services/location";
import { getBloodGroups } from "@/services/blood";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const rawSearch = params.search ?? params.searchTerm;
  const searchTerm = Array.isArray(rawSearch) ? rawSearch[0] : rawSearch;

  const [donorsRes, divisionsRes, bloodGroupsRes] = await Promise.all([
    getPublicDonors({
      page: 1,
      limit: 12,
      searchTerm: searchTerm || undefined,
      divisionId: Array.isArray(params.division)
        ? params.division[0]
        : params.division,
      districtId: Array.isArray(params.district)
        ? params.district[0]
        : params.district,
      upazilaId: Array.isArray(params.upazila)
        ? params.upazila[0]
        : params.upazila,
      bloodGroupId:
        Array.isArray(params.bloodGroup) ? params.bloodGroup[0] : params.bloodGroup,
    }),
    getDivisions(),
    getBloodGroups(),
  ]);

  return (
    <DonorDirectoryPage
      initialDonors={donorsRes}
      initialDivisions={divisionsRes?.data ?? []}
      initialBloodGroups={bloodGroupsRes?.data ?? []}
    />
  );
}
