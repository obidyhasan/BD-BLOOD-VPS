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
import { getHomepagePosts } from "@/services/post";
import { getAllGalleries } from "@/services/gallery";
import { getFaqs } from "@/services/faq";
import { getMedicalAds } from "@/services/medicalInstitution";
import { getPublicLeadershipMembers } from "@/services/organization";
import { getDivisions } from "@/services/location";

export default async function HomePage() {
  const [
    statsRes,
    blogsRes,
    homepagePostsRes,
    galleriesRes,
    faqsRes,
    adsRes,
    divisionsRes,
    leadershipRes,
  ] = await Promise.all([
    getPublicStats(),
    getPublicBlogs({
      limit: 3,
      status: "APPROVED",
      sortBy: "created_at",
      sortOrder: "desc",
    }),
    getHomepagePosts(),
    getAllGalleries({ limit: 3, scope: "homepage" }),
    getFaqs({ active: true, limit: 12, sortBy: "order", sortOrder: "asc" }),
    getMedicalAds({ limit: 8 }),
    getDivisions(),
    getPublicLeadershipMembers({ category: "COMMITTEE", level: "EXECUTIVE" }),
  ]);

  return (
    <div className="relative isolate bg-white dark:bg-zinc-950 overflow-hidden min-h-screen">
      <Hero
        initialStats={statsRes?.data ?? null}
        initialDivisions={divisionsRes?.data ?? []}
      />
      <OurWork initialPosts={homepagePostsRes?.data?.successHistory ?? []} />
      <MedicalAds initialAds={adsRes?.data ?? []} />
      <CommitteeSection initialPosts={homepagePostsRes?.data?.donorPosts ?? []} />
      <OurBlogs initialBlogs={blogsRes?.data ?? []} />
      <OurTeam initialMembers={leadershipRes?.data ?? []} />
      <GallerySection initialGalleries={galleriesRes?.data ?? []} />
      <FaqSection initialFaqs={faqsRes?.data ?? []} />
      <ContactSection />
    </div>
  );
}
