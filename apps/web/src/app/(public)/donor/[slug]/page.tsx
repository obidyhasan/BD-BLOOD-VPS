import DonorProfile from "@/components/modules/Donor/Profile/DonorProfile";
import { getPublicDonorById, getPublicDonorBySlug } from "@/services/user";
import { getPublicPosts } from "@/services/post";
import { buildEntityMetadata, notFoundMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const donor =
    (await getPublicDonorBySlug(slug))?.data ??
    (await getPublicDonorById(slug))?.data ??
    null;
  if (!donor) return notFoundMetadata("Donor");

  const locationBits = [donor.upazila?.name, donor.district?.name].filter(
    Boolean,
  );
  const description =
    donor.bio ||
    `${donor.bloodGroup?.groupName ?? ""} blood donor${
      locationBits.length ? ` in ${locationBits.join(", ")}` : ""
    }.`.trim();

  return buildEntityMetadata({
    title: donor.fullName,
    description,
    image: donor.profilePhoto,
    path: `/donor/${slug}`,
  });
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const donorRes = await getPublicDonorBySlug(slug);
  const donor =
    donorRes?.data ?? (await getPublicDonorById(slug))?.data ?? null;
  const donorId = donor?.id ?? slug;
  const postsRes = await getPublicPosts({ limit: 50, donorId });

  return (
    <DonorProfile
      isDashboard={false}
      slug={slug}
      initialDonor={donor}
      initialPosts={postsRes?.data ?? []}
    />
  );
}
