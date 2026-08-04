import Hero from "@/components/modules/Home/Hero/Hero";
import OurWork from "@/components/modules/Home/OurWork/OurWork";
import MedicalAds from "@/components/modules/Home/MedicalAds/MedicalAds";
import OurTeam from "@/components/modules/Home/OurTeam/OurTeam";
import OurBlogs from "@/components/modules/Home/OurBlogs/OurBlogs";
import FaqSection from "@/components/modules/Home/FaqSection/FaqSection";
import ContactSection from "@/components/modules/Home/ContactSection/ContactSection";
import CommitteeSection from "@/components/modules/Home/CommitteeSection/CommitteeSection";
import GallerySection from "@/components/modules/Home/GallerySection/GallerySection";
import { getPublicStats } from "@/services/analytics";
import { getPublicBlogs } from "@/services/blog";
import { getPublicPosts } from "@/services/post";
import { getAllGalleries } from "@/services/gallery";
import { getFaqs } from "@/services/faq";
import { getMedicalAds } from "@/services/medicalInstitution";
import { GEO_ORGANIZATION_TYPES } from "@/lib/organizationGeo";
import { getAllOrganizations } from "@/services/organization";
import { getDivisions } from "@/services/location";
import { getPublicDonors } from "@/services/user";

export default async function HomePage() {
  const [
    statsRes,
    blogsRes,
    worksRes,
    galleriesRes,
    faqsRes,
    adsRes,
    orgsRes,
    divisionsRes,
    donorsRes,
  ] = await Promise.all([
    getPublicStats(),
    getPublicBlogs({
      limit: 3,
      status: "APPROVED",
      sortBy: "created_at",
      sortOrder: "desc",
    }),
    getPublicPosts({ isWork: true, approvalStatus: "APPROVED", limit: 6 }),
    getAllGalleries({ limit: 3, scope: "homepage" }),
    getFaqs({ active: true, limit: 12, sortBy: "order", sortOrder: "asc" }),
    getMedicalAds(),
    getAllOrganizations({
      limit: 8,
      verificationStatus: "VERIFIED",
      organizationStatus: "ACTIVE",
      type: GEO_ORGANIZATION_TYPES.division,
    }),
    getDivisions(),
    getPublicDonors({ page: 1, limit: 8, availabilityStatus: "AVAILABLE" }),
  ]);

  return (
    <div className="relative isolate bg-white dark:bg-zinc-950 overflow-hidden min-h-screen">
      <Hero
        initialStats={statsRes?.data ?? null}
        initialDivisions={divisionsRes?.data ?? []}
      />
      <OurWork initialPosts={worksRes?.data ?? []} />
      <MedicalAds initialAds={adsRes?.data ?? []} />
      <CommitteeSection initialOrganizations={orgsRes?.data ?? []} />
      <OurBlogs initialBlogs={blogsRes?.data ?? []} />
      <OurTeam initialMembers={donorsRes?.data ?? []} />
      <GallerySection initialGalleries={galleriesRes?.data ?? []} />
      <FaqSection initialFaqs={faqsRes?.data ?? []} />
      <ContactSection />
    </div>
  );
}
