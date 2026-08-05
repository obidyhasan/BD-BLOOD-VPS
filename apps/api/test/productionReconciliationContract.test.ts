import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(path, "utf8");

test("public post reads enforce visibility and remove private donor contact fields", async () => {
  const service = await read("src/app/modules/post/post.service.ts");

  assert.match(service, /visibility:\s*PostVisibility\.PUBLIC/);
  assert.match(service, /const toPublicPost/);
  assert.match(service, /email:\s*_email/);
  assert.match(service, /phone:\s*_phone/);
  assert.match(service, /data:\s*onlyApproved\s*\?\s*result\.map\(toPublicPost\)/);
  assert.match(service, /return onlyApproved \? toPublicPost\(post\) : post/);
});

test("post organization attribution is authorized by affiliation or active membership", async () => {
  const service = await read("src/app/modules/post/post.service.ts");

  assert.match(service, /const assertCanAssociateWithOrganization/);
  assert.match(service, /donorOrganizationAffiliation\.findFirst/);
  assert.match(service, /organizationMember\.findFirst/);
  assert.match(service, /status:\s*OrganizationMemberStatus\.ACTIVE/);
  assert.match(service, /outside your affiliation/);
  assert.match(service, /await assertCanAssociateWithOrganization\(/);
});

test("public leadership and blog projections do not expose contact fields", async () => {
  const members = await read(
    "src/app/modules/organizationMember/organizationMember.service.ts",
  );
  const blogs = await read("src/app/modules/blog/blog.service.ts");

  assert.match(members, /const publicMemberDonorSelect/);
  const publicSelect = members.slice(
    members.indexOf("const publicMemberDonorSelect"),
    members.indexOf("type MembershipWithPosition"),
  );
  assert.doesNotMatch(publicSelect, /email:\s*true/);
  assert.doesNotMatch(publicSelect, /phone:\s*true/);
  assert.match(blogs, /const toPublicBlog/);
  assert.match(blogs, /email:\s*_email/);
  assert.match(blogs, /phone:\s*_phone/);
});

test("homepage national team and organization notices use dynamic authoritative data", async () => {
  const home = await read("../web/src/app/(public)/page.tsx");
  const team = await read(
    "../web/src/components/modules/Home/OurTeam/OurTeam.tsx",
  );
  const profile = await read(
    "../web/src/components/modules/Organization/PublicOrganizationProfile/PublicOrganizationProfile.tsx",
  );

  assert.match(home, /getPublicLeadershipMembers\(\{ level: "EXECUTIVE" \}\)/);
  assert.doesNotMatch(home, /getPublicDonors/);
  assert.match(team, /Who's Behind/);
  assert.match(team, /members\.slice\(0, 11\)/);
  assert.match(team, /member\.position\.positionName/);
  assert.match(profile, /works\.slice\(0, 5\)/);
  assert.doesNotMatch(profile, /Next Committee Meeting: Sunday/);
});

test("production messaging fails closed and verifies SMTP certificates", async () => {
  const sms = await read("src/app/helper/smsHelper.ts");
  const email = await read("src/app/helper/emailSender.ts");

  assert.match(sms, /config\.node_env === "production"/);
  assert.match(sms, /success:\s*false/);
  assert.match(sms, /SMS provider is not configured/);
  assert.match(email, /SMTP is not fully configured/);
  assert.match(email, /rejectUnauthorized:\s*config\.node_env === "production"/);
});

test("first-run seeds include achievements and canonical organization hierarchy", async () => {
  const entrypoint = await read("src/app/seed/seed.ts");
  const server = await read("src/server.ts");
  const achievementSeed = await read("src/app/seed/achievementSeed.ts");
  const organizationSeed = await read("src/app/seed/organizationSeed.ts");

  for (const source of [entrypoint, server]) {
    assert.match(source, /seedAchievements\(\)/);
    assert.match(source, /seedCanonicalOrganizations\(\)/);
  }
  assert.match(achievementSeed, /AchievementThresholdType\.VERIFIED_DONATIONS/);
  assert.match(achievementSeed, /thresholdValue:\s*4/);
  assert.match(organizationSeed, /ORGANIZATION_SEED_PHONE/);
  assert.match(organizationSeed, /OrganizationLevel\.CENTRAL/);
  assert.match(organizationSeed, /OrganizationLevel\.DIVISION/);
  assert.match(organizationSeed, /OrganizationLevel\.DISTRICT/);
  assert.match(organizationSeed, /OrganizationLevel\.UPAZILA/);
  assert.match(organizationSeed, /canonical:\s*true/);
});

test("geography seed detects partial District and Upazila data", async () => {
  const geographySeed = await read("src/app/seed/geoSeed.ts");

  assert.match(geographySeed, /existingDistrictCount/);
  assert.match(geographySeed, /existingUpazilaCount/);
  assert.match(geographySeed, /existingDistrictCount >= districts\.length/);
  assert.match(geographySeed, /existingUpazilaCount >= upazilas\.length/);
});
