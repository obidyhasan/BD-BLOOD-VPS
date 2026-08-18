import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const apiRoot = path.resolve(__dirname, "..");
const webRoot = path.resolve(apiRoot, "../web/src");

const readWeb = (relativePath: string) =>
  readFile(path.join(webRoot, relativePath), "utf8");

test("sidebar navigation resolves zero, one, and multiple child groups generically", async () => {
  const resolver = await readWeb("lib/sidebarNavigation.ts");

  assert.match(resolver, /if \(item\.items\.length === 0\) return null/);
  assert.match(resolver, /if \(item\.items\.length === 1\)/);
  assert.match(resolver, /url: item\.items\[0\]\.url/);
  assert.match(resolver, /items: undefined/);
  assert.match(resolver, /url: item\.url \?\? "#"/);
});

test("admin, organization, and donor sidebars share resolved direct-or-nested behavior", async () => {
  const [adminSidebar, navMain, donorSidebar, organizationSidebar] =
    await Promise.all([
      readWeb("components/ui/admin-sidebar.tsx"),
      readWeb("components/ui/nav-main.tsx"),
      readWeb("components/ui/donor-sidebar.tsx"),
      readWeb("components/ui/app-sidebar.tsx"),
    ]);

  assert.match(adminSidebar, /resolveSidebarNavigation\(navItems\)/);
  assert.match(adminSidebar, /if \(!item\.items\?\.length\)/);
  assert.match(navMain, /resolveSidebarNavigation\(items\)/);
  assert.match(navMain, /if \(!item\.items\?\.length\)/);
  assert.match(donorSidebar, /resolveSidebarNavigation<DonorNavItem>/);
  assert.match(donorSidebar, /if \(!item\.items\?\.length\)/);
  assert.match(
    organizationSidebar,
    /items: section\.items\?\.filter\([\s\S]*?canManageOrganization/,
  );
  assert.match(organizationSidebar, /<NavMain items=\{visibleNavMain\}/);
});

test("admin and organization overview remain direct navigation destinations", async () => {
  const [adminSidebar, organizationSidebar] = await Promise.all([
    readWeb("components/ui/admin-sidebar.tsx"),
    readWeb("components/ui/app-sidebar.tsx"),
  ]);

  assert.match(
    adminSidebar,
    /title: "Overview",[\s\S]*?items: \[\{ title: "Overview", url: "\/dashboard\/admin" \}\]/,
  );
  assert.match(
    organizationSidebar,
    /title: "Overview",\s*url: "\/dashboard\/organization"/,
  );
});

test("public avatar waits for authoritative membership and exposes only valid destinations", async () => {
  const [dropdown, bottomNav] = await Promise.all([
    readWeb("components/shared/Navbar/user-dropdown.tsx"),
    readWeb("components/shared/Navbar/BottomNav.tsx"),
  ]);

  assert.match(dropdown, /useGetMyMembershipQuery/);
  assert.match(dropdown, /membershipData\?\.data\?\.status === "ACTIVE"/);
  assert.match(dropdown, /membershipData\.data\.canAccessDashboard === true/);
  assert.match(dropdown, /if \(isMembershipResolving\)/);
  assert.match(
    dropdown,
    /<Link href=\{profileHref\} aria-label="Open profile">/,
  );
  assert.match(dropdown, />Profile<\/span>/);
  assert.match(dropdown, />Organization<\/span>/);
  assert.doesNotMatch(
    dropdown,
    /My Donations|Notifications|Posts|Reports|Log out/,
  );
  assert.match(bottomNav, /useGetMyMembershipQuery/);
  assert.match(bottomNav, /if \(item\.isAccount && canAccessOrganization\)/);
  assert.match(bottomNav, /side="top"/);
  assert.match(bottomNav, /membershipData\?\.data\?\.status === "ACTIVE"/);
  assert.match(bottomNav, /sessionUser\.isLoading \|\| isMembershipResolving/);
});

test("organization profile URL is preserved as organization details rather than personal profile", async () => {
  const [sidebar, layout, detailsPage] = await Promise.all([
    readWeb("components/ui/app-sidebar.tsx"),
    readWeb("app/(private)/dashboard/organization/layout.tsx"),
    readWeb(
      "components/modules/Organization/Profile/OrganizationProfilePage.tsx",
    ),
  ]);

  assert.match(
    sidebar,
    /title: "Details",\s*url: "\/dashboard\/organization\/profile"/,
  );
  assert.match(
    layout,
    /"\/dashboard\/organization\/profile": "Organization Details"/,
  );
  assert.match(detailsPage, /title="Organization Details"/);
  assert.match(detailsPage, /useUpdateOrganizationProfileMutation/);
  assert.match(detailsPage, /Save details/);
});
