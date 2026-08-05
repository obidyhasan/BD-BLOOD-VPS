import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(path, "utf8");

test("organization dashboard uses the command-oriented request table", async () => {
  const page = await read(
    "../web/src/components/modules/Organization/BloodRequest/ManageRequestPage.tsx",
  );
  assert.match(page, /AdminBloodRequestsTable/);
  assert.match(page, /useGetAllBloodRequestsQuery/);
  assert.doesNotMatch(page, /ManageBloodRequestDataTable/);
  assert.doesNotMatch(page, /useGetOrganizationBloodRequestNotificationsQuery/);
});

test("donor assignment UX handles capacity conflicts and submits linked donations", async () => {
  const notifications = await read(
    "../web/src/app/(private)/dashboard/donor/notifications/page.tsx",
  );
  assert.match(notifications, /REQUEST_CAPACITY_REACHED/);
  assert.match(notifications, /ASSIGNMENT_NOT_ACTIONABLE/);
  assert.match(notifications, /requestAssignmentId:\s*id/);
  assert.match(notifications, /canSubmitDonation/);
});

test("public request UX validates Bangladesh phones and exposes safe tracking", async () => {
  const form = await read(
    "../web/src/components/modules/Organization/PublicOrganizationProfile/RequestBloodForm.tsx",
  );
  const trackingPage = await read(
    "../web/src/app/(public)/blood-request/track/page.tsx",
  );
  const api = await read(
    "../web/src/redux/features/bloodRequests/bloodRequestsApi.ts",
  );

  assert.match(form, /01\[3-9\]/);
  assert.match(form, /bags >= 1 && bags <= 10/);
  assert.match(form, /\/blood-request\/track/);
  assert.match(trackingPage, /phoneSuffix/);
  assert.match(trackingPage, /assignmentSummary\.committedBags/);
  assert.match(api, /\/blood-requests\/track\//);
});

test("profile and donation-post capabilities are represented in donor UX", async () => {
  const gate = await read(
    "../web/src/components/modules/Donor/Profile/ProfileCompletionGate.tsx",
  );
  const posts = await read(
    "../web/src/components/modules/Donor/Posts/DonorPosts.tsx",
  );
  const postDialog = await read(
    "../web/src/components/reusable/Donor/PostDialog.tsx",
  );

  assert.match(gate, /showCloseButton=\{false\}/);
  assert.match(gate, /onInteractOutside/);
  assert.match(posts, /canCreateDonationPost/);
  assert.match(postDialog, /useGetPostEligibilityQuery/);
  assert.match(postDialog, /formData\.append\("donationId"/);
});
