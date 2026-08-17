import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readApi = (path: string) => readFile(`src/${path}`, "utf8");
const readWeb = (path: string) => readFile(`../web/src/${path}`, "utf8");

test("organization activity ignores a member-supplied organization ID", async () => {
  const controller = await readApi("app/modules/analytics/analytics.controller.ts");
  const service = await readApi("app/modules/analytics/analytics.service.ts");

  assert.match(controller, /req\.user as IJWTPayload/);
  assert.match(service, /user\.role === Role\.ADMIN[\s\S]*organizationIdFromQuery[\s\S]*resolveMemberOrganizationId\(user\)/);
  assert.match(service, /handledByOrganizationId: organizationId/);
});

test("overview owns analytics and sidebar single destinations are direct links", async () => {
  const sidebar = await readWeb("components/ui/app-sidebar.tsx");
  const nav = await readWeb("components/ui/nav-main.tsx");
  const overview = await readWeb("components/modules/Organization/Dashboard/DashboardPage.tsx");
  const redirect = await readWeb("app/(private)/dashboard/organization/(management)/analytics/page.tsx");

  assert.doesNotMatch(sidebar, /title: "Analytics"/);
  assert.match(sidebar, /title: "Overview",[\s\S]*url: "\/dashboard\/organization"/);
  assert.match(nav, /if \(!item\.items\?\.length\)/);
  assert.match(nav, /<SidebarMenuButton[\s\S]*asChild/);
  assert.match(overview, /useGetActivityFeedQuery/);
  assert.match(overview, /ChartAreaInteractive organizationId=\{orgId\}/);
  assert.match(redirect, /redirect\(/);
});

test("organization profile mutation exposes only public fields", async () => {
  const validation = await readApi("app/modules/organization/organization.validation.ts");
  const routes = await readApi("app/modules/organization/organization.routes.ts");
  const profile = await readWeb("components/modules/Organization/Profile/OrganizationProfilePage.tsx");

  const publicSchema = validation.slice(validation.indexOf("updateOrganizationProfileZodSchema"));
  assert.match(routes, /orgMemberAccess\("params"\)[\s\S]*orgManagerAccess\(\)/);
  for (const field of ["phone", "email", "address", "description", "logo"]) {
    assert.match(publicSchema, new RegExp(`${field}:`));
  }
  for (const protectedField of ["divisionId", "districtId", "upazilaId", "verificationStatus", "organizationStatus"]) {
    assert.doesNotMatch(publicSchema, new RegExp(`${protectedField}:`));
  }
  assert.match(profile, /Admin-controlled structure/);
});
