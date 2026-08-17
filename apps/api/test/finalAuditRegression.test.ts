import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { updateUserZodSchema } from "../src/app/modules/user/user.validation";

const repoRoot = resolve(__dirname, "../../..");
const source = (relativePath: string) =>
  readFileSync(resolve(repoRoot, relativePath), "utf8");

test("donor self-service cannot rewrite authoritative referral attribution", () => {
  const parsed = updateUserZodSchema.parse({
    fullName: "Updated donor",
    referrerId: "attacker-controlled-id",
  });

  assert.equal("referrerId" in parsed, false);
  const userService = source("apps/api/src/app/modules/user/user.service.ts");
  assert.match(userService, /delete payload\.referrerId/);
  assert.match(userService, /You cannot refer yourself/);
});

test("donor self-service cannot rewrite platform account status", () => {
  const parsed = updateUserZodSchema.parse({
    fullName: "Updated donor",
    accountStatus: "ACTIVE",
  });
  assert.equal("accountStatus" in parsed, false);
});

test("donation post capability requires an unused verified donation", () => {
  const userService = source("apps/api/src/app/modules/user/user.service.ts");
  assert.match(userService, /verificationStatus: "VERIFIED"/);
  assert.match(userService, /post: null/);
  assert.match(
    userService,
    /capabilities\.canCreateDonationPost = Boolean\([\s\S]*eligibleDonation/,
  );
});

test("request contact and private server reads respect the donor authorization boundary", () => {
  const requestService = source(
    "apps/api/src/app/modules/bloodRequest/bloodRequest.service.ts",
  );
  const serverFetch = source("apps/web/src/helper/server-fetch.ts");
  assert.match(requestService, /requesterPhone: canViewRequesterPhone/);
  assert.match(requestService, /RequestAssignmentStatus\.ACCEPTED/);
  assert.match(serverFetch, /const requiresAuthentication =/);
  assert.match(serverFetch, /method !== "GET" && !isAnonymousMutation\(endpoint\)/);
  assert.match(serverFetch, /endpoint === "\/blood-requests"/);
  assert.match(serverFetch, /endpoint === "\/contact"/);
  assert.match(serverFetch, /privateEndpoint \|\|/);
  assert.match(serverFetch, /endpoint\.startsWith\("\/faqs"\)/);
  assert.match(serverFetch, /CACHE_TAGS\.LOCATION/);
  assert.match(serverFetch, /CACHE_TAGS\.BLOOD_GROUPS/);
});

test("system notification broadcasts use bounded cursor batches", () => {
  const notificationService = source(
    "apps/api/src/app/modules/notification/notification.service.ts",
  );

  assert.match(notificationService, /const batchSize = 500/);
  assert.match(notificationService, /cursor: \{ id: cursor \}, skip: 1/);
  assert.match(notificationService, /notification\.createMany/);
  assert.match(notificationService, /return \{ count \}/);
  assert.doesNotMatch(notificationService, /return \{ count, notifications \}/);
});

test("phone and email verification refresh persisted profile readiness", () => {
  const userService = source("apps/api/src/app/modules/user/user.service.ts");
  const authService = source("apps/api/src/app/modules/auth/auth.service.ts");

  assert.match(userService, /nextData\.phoneVerifiedAt = null/);
  assert.match(authService, /refreshProfileReadiness\(userData\.id\)/);
  assert.match(authService, /refreshProfileReadiness\(donor\.id\)/);
});

test("medical library details and doctor contact actions are connected", () => {
  const libraryCard = source(
    "apps/web/src/components/modules/Medical/components/LibraryCard.tsx",
  );
  const doctorCard = source(
    "apps/web/src/components/modules/Medical/components/DoctorCard.tsx",
  );

  assert.match(libraryCard, /\/medical\/library\/\$\{info\.slug\}/);
  assert.match(doctorCard, /href=\{`tel:\$\{doctor\.phone\}`\}/);
  assert.equal(
    existsSync(
      resolve(
        repoRoot,
        "apps/web/src/app/(public)/medical/library/[id]/page.tsx",
      ),
    ),
    true,
  );
  assert.equal(
    existsSync(
      resolve(
        repoRoot,
        "apps/web/src/components/modules/Home/Stats/SelectLocation.tsx",
      ),
    ),
    false,
  );
});

test("donor dashboard mounts realtime notifications and renders an authoritative unread count", () => {
  const donorLayout = source(
    "apps/web/src/app/(private)/dashboard/donor/layout.tsx",
  );
  const notificationsApi = source(
    "apps/web/src/redux/features/notifications/notificationsApi.ts",
  );

  assert.match(donorLayout, /useNotificationSocket\(\)/);
  assert.match(donorLayout, /unreadData\?\.meta\.total/);
  assert.match(notificationsApi, /query\.set\("isRead"/);
});
