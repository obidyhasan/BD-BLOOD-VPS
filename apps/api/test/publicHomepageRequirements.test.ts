import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readApi = (path: string) => readFile(path, "utf8");
const readWeb = (path: string) => readFile(`../web/src/${path}`, "utf8");

test("public hero statistics use verified donors, successful requests, and total requests", async () => {
  const analytics = await readApi("src/app/modules/analytics/analytics.service.ts");
  const hero = await readWeb("components/modules/Home/Hero/Hero.tsx");

  assert.match(analytics, /accountStatus: AccountStatus\.ACTIVE,[\s\S]*?isVerified: true/);
  assert.match(
    analytics,
    /in: \[BloodRequestStatus\.FULFILLED, BloodRequestStatus\.COMPLETED\]/,
  );
  assert.match(analytics, /donorsTotal: platform\.donors\.verified/);
  assert.match(analytics, /worksCount: platform\.bloodRequests\.successful/);
  assert.match(analytics, /totalRequests: platform\.bloodRequests\.total/);
  assert.match(hero, /label: "Verified Donors"/);
  assert.match(hero, /label: "Success Stories"/);
  assert.match(hero, /label: "Total Requests"/);
  assert.doesNotMatch(hero, /label: "Upazila Covered"/);
});

test("hero text and medical sliders autoplay without visible controls", async () => {
  const hero = await readWeb("components/modules/Home/Hero/Hero.tsx");
  const medical = await readWeb("components/modules/Home/MedicalAds/MedicalAds.tsx");
  const carousel = await readWeb("components/shared/Carousel/Carousel.tsx");

  assert.match(hero, /const heroMessages = \[/);
  assert.match(hero, /autoplay: true/);
  assert.match(hero, /arrows: false/);
  assert.match(hero, /dots: false/);
  assert.match(hero, /<TextSlider/);
  assert.match(medical, /showDots=\{false\}/);
  assert.match(carousel, /autoplay: true/);
  assert.match(carousel, /arrows: false/);
});

test("Need Blood waits for the complete location hierarchy and resolves the canonical Upazila organization", async () => {
  const hero = await readWeb("components/modules/Home/Hero/Hero.tsx");

  assert.match(
    hero,
    /const locationComplete = !!divisionId && !!districtId && !!upazilaId/,
  );
  assert.match(hero, /useGetCanonicalOrganizationByUpazilaQuery\(upazilaId/);
  assert.match(hero, /skip: !locationComplete/);
  assert.match(hero, /const canSearch = locationComplete && !!matchedOrg && !orgFetching/);
  assert.match(hero, /Select Division, District & Upazila/);
});

test("homepage posts are limited, randomized, public, approved, and privacy-safe", async () => {
  const service = await readApi("src/app/modules/post/post.service.ts");
  const controller = await readApi("src/app/modules/post/post.controller.ts");
  const routes = await readApi("src/app/modules/post/post.routes.ts");
  const homeService = await readWeb("services/post/index.ts");

  assert.match(service, /const HOMEPAGE_LIMIT_MAX = 12/);
  assert.match(service, /const homepagePostSelect =/);
  assert.match(service, /approvalStatus: ApprovalStatus\.APPROVED/);
  assert.match(service, /visibility: PostVisibility\.PUBLIC/);
  assert.match(service, /organizationStatus: "ACTIVE"/);
  assert.match(service, /verificationStatus: VerificationStatus\.VERIFIED/);
  assert.match(service, /postType: \{ in: PERSONAL_DONATION_POST_TYPES \}/);
  assert.match(service, /affiliations:[\s\S]*?some:[\s\S]*?active: true/);
  assert.match(service, /Math\.random\(\)/);
  assert.match(service, /take: windowSize/);

  const publicSelect = service.slice(
    service.indexOf("const homepagePostSelect"),
    service.indexOf("const shuffle"),
  );
  assert.doesNotMatch(publicSelect, /email: true/);
  assert.doesNotMatch(publicSelect, /phone: true/);
  assert.doesNotMatch(publicSelect, /password: true/);

  assert.match(controller, /successLimit = Number\(req\.query\.successLimit\) \|\| 6/);
  assert.match(controller, /donorLimit = Number\(req\.query\.donorLimit\) \|\| 8/);
  assert.match(routes, /router\.get\("\/homepage", PostController\.getHomepagePosts\)/);
  assert.match(homeService, /cache: "no-store"/);
});

test("medical homepage data is limited, randomized, and exposes only public contact fields", async () => {
  const service = await readApi(
    "src/app/modules/medicalAdvertisement/medicalAdvertisement.service.ts",
  );
  const controller = await readApi(
    "src/app/modules/medicalAdvertisement/medicalAdvertisement.controller.ts",
  );
  const medicalMap = await readWeb("lib/medical.ts");
  const carousel = await readWeb("components/shared/Carousel/Carousel.tsx");

  assert.match(service, /const publicAdSelect =/);
  assert.match(service, /phone: true/);
  assert.match(service, /address: true/);
  assert.match(service, /data: shuffle\(result\)/);
  assert.match(controller, /Math\.min\(Math\.max\(Number\(req\.query\.limit\) \|\| 8, 1\), 12\)/);
  assert.match(medicalMap, /ctaText: "Visit Medical"/);
  assert.match(medicalMap, /phone: ad\.institution\?\.phone/);
  assert.match(medicalMap, /address: ad\.institution\?\.address/);
  assert.match(carousel, /Phone:/);
  assert.match(carousel, /Address:/);
  assert.match(carousel, /`\/medical\/\$\{slide\.medicalSlug\}`/);
});

test("public navigation disables donor browsing while preserving profile and dashboard code", async () => {
  const content = await readWeb("lib/siteContent.ts");
  const bottomNav = await readWeb("components/shared/Navbar/BottomNav.tsx");
  const donorDirectory = await readWeb("app/(public)/donor/page.tsx");
  const teamCard = await readWeb("components/modules/Home/OurTeam/TeamCard.tsx");

  assert.doesNotMatch(content, /label: "Donor", href: "\/donor"/);
  assert.doesNotMatch(content, /title: "Donor", href: "\/donor"/);
  assert.doesNotMatch(bottomNav, /href: "\/donor"/);
  assert.match(donorDirectory, /redirect\("\/"\)/);
  assert.match(teamCard, /href=\{`\/donor\/\$\{slug\}`\}/);
});

test("homepage composition uses randomized post sections and the established top-11 member order", async () => {
  const home = await readWeb("app/(public)/page.tsx");
  const success = await readWeb("components/modules/Home/OurWork/OurWork.tsx");
  const donorPosts = await readWeb(
    "components/modules/Home/CommitteeSection/CommitteeSection.tsx",
  );
  const team = await readWeb("components/modules/Home/OurTeam/OurTeam.tsx");
  const memberService = await readApi(
    "src/app/modules/organizationMember/organizationMember.service.ts",
  );

  assert.match(home, /getHomepagePosts\(\)/);
  assert.match(home, /data\?\.successHistory/);
  assert.match(home, /data\?\.donorPosts/);
  assert.doesNotMatch(home, /getAllOrganizations/);
  assert.match(success, /title="Our Success History"/);
  assert.match(donorPosts, /title="Donor Posts"/);
  assert.doesNotMatch(donorPosts, /Top Organizations/);
  assert.match(team, /title="Who's Behind"/);
  assert.match(team, /members\.slice\(0, 11\)/);
  assert.match(memberService, /take: LEADERSHIP_MEMBER_CAP/);
  assert.match(memberService, /positionOrder: "asc"/);
});
