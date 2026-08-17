import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const { organizationId } = await searchParams;
  redirect(
    organizationId
      ? `/dashboard/organization?organizationId=${encodeURIComponent(organizationId)}`
      : "/dashboard/organization",
  );
}
