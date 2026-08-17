import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWeb = (path: string) => readFile(`../web/src/${path}`, "utf8");

test("public navbar resolves the cookie session and refreshes an expired access token", async () => {
  const baseApi = await readWeb("redux/api/baseApi.ts");
  const session = await readWeb("hooks/useSessionUser.ts");
  const navbar = await readWeb("components/shared/Navbar/Navbar.tsx");
  const mobile = await readWeb("components/shared/Navbar/navigation-sheet.tsx");

  assert.match(baseApi, /result\.error\?\.status === 401/);
  assert.match(baseApi, /"\/auth\/refresh-token"/);
  assert.match(baseApi, /result = await query\(args, api, extraOptions\)/);
  assert.match(baseApi, /let refreshPromise: Promise<boolean> \| null/);
  assert.match(session, /useGetMeQuery/);
  assert.match(session, /dispatch\(setCredentials\(\{ user: me \}\)\)/);
  assert.match(navbar, /const user = sessionUser\.me/);
  assert.match(navbar, /<Skeleton/);
  assert.doesNotMatch(navbar, /reduxUser \?\? sessionUser\.me/);
  assert.match(mobile, /session\.me \? "Open Dashboard" : "Sign In"/);
});

test("homepage sections consume client fallback data when server arrays are empty", async () => {
  const postsApi = await readWeb("redux/features/posts/postsApi.ts");
  const success = await readWeb("components/modules/Home/OurWork/OurWork.tsx");
  const donors = await readWeb("components/modules/Home/CommitteeSection/CommitteeSection.tsx");
  const team = await readWeb("components/modules/Home/OurTeam/OurTeam.tsx");
  const ads = await readWeb("components/modules/Home/MedicalAds/MedicalAds.tsx");
  const blogs = await readWeb("components/modules/Home/OurBlogs/OurBlogs.tsx");
  const gallery = await readWeb("components/modules/Home/GallerySection/GallerySection.tsx");
  const faq = await readWeb("components/modules/Home/FaqSection/FaqSection.tsx");
  const hero = await readWeb("components/modules/Home/Hero/Hero.tsx");

  assert.match(postsApi, /getHomepagePosts: builder\.query/);
  assert.match(success, /query\.data\?\.data\.successHistory \?\? \[\]/);
  assert.match(donors, /query\.data\?\.data\.donorPosts \?\? \[\]/);
  assert.match(team, /useGetPublicLeadershipMembersQuery/);

  for (const source of [ads, blogs, gallery, faq]) {
    assert.match(source, /initial[A-Za-z]+\?\.length \? initial[A-Za-z]+ : data\?\.data \?\? \[\]/);
    assert.match(source, /isError/);
    assert.match(source, /refetch/);
  }

  assert.match(hero, /initialDivisions\?\.length[\s\S]*?divisionsData\?\.data \?\? \[\]/);
  assert.doesNotMatch(hero, /initialDivisions \?\? divisionsData/);
});

test("medical banner keeps the managed image visible with responsive cover behavior", async () => {
  const carousel = await readWeb("components/shared/Carousel/Carousel.tsx");

  assert.match(carousel, /className="object-cover object-center opacity-100/);
  assert.match(carousel, /sizes="\(max-width: 768px\) 100vw, 1280px"/);
  assert.match(carousel, /priority=\{index === 0\}/);
  assert.match(carousel, /!slide\.bannerImage/);
  assert.doesNotMatch(carousel, /opacity-10 grayscale/);
});
