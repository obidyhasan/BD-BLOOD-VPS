import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const apiRoot = path.resolve(__dirname, "..");
const webRoot = path.resolve(apiRoot, "../web/src");

const readApi = (relativePath: string) =>
  readFile(path.join(apiRoot, relativePath), "utf8");
const readWeb = (relativePath: string) =>
  readFile(path.join(webRoot, relativePath), "utf8");

test("public cards and detail route use one ID-or-slug contract", async () => {
  const [workCard, postCard, postLibrary, page, service] = await Promise.all([
    readWeb("components/modules/Home/OurWork/WorkCard.tsx"),
    readWeb("components/reusable/Donor/PostCard.tsx"),
    readWeb("lib/post.ts"),
    readWeb("app/(public)/post/[slug]/page.tsx"),
    readWeb("services/post/index.ts"),
  ]);

  assert.match(workCard, /const postPath = getPostPath\(post\)/);
  assert.doesNotMatch(workCard, /`\/post\/\$\{post\.id\}`/);
  assert.match(postCard, /const postPath = getPostPath\(post/);
  assert.match(postLibrary, /const slug = post\.slug \?\? post\.id/);
  assert.match(postLibrary, /return `\/post\/\$\{slug\}`/);
  assert.match(page, /params: Promise<\{ slug: string \}>/);
  assert.match(page, /getPublicPost\(identifier\)/);
  assert.match(service, /`\/posts\/\$\{encodeURIComponent\(identifier\)\}`/);
  assert.doesNotMatch(page, /getPublicPostBySlug/);
});

test("API resolves UUID or unique slug with one indexed public lookup", async () => {
  const [postService, schema, routes] = await Promise.all([
    readApi("src/app/modules/post/post.service.ts"),
    readApi("prisma/schema/schema.prisma"),
    readApi("src/app/modules/post/post.routes.ts"),
  ]);

  assert.match(schema, /model Post[\s\S]*?slug String @unique/);
  assert.match(
    postService,
    /isUuid\(slugOrId\) \? \{ id: slugOrId \} : \{ slug: slugOrId \}/,
  );
  assert.doesNotMatch(postService, /posts\.find\(\(p\) => toSlug\(p\.title\)/);
  assert.match(
    postService,
    /throw new ApiError\(httpStatus\.NOT_FOUND, "Post not found!"\)/,
  );
  assert.match(
    routes,
    /router\.get\("\/:id", PostController\.getSinglePostPublic\)/,
  );
});

test("list and detail share approved public source visibility", async () => {
  const service = await readApi("src/app/modules/post/post.service.ts");

  assert.match(service, /const publicPostVisibilityWhere/);
  assert.match(service, /approvalStatus: ApprovalStatus\.APPROVED/);
  assert.match(service, /visibility: PostVisibility\.PUBLIC/);
  assert.match(service, /isDeleted: false/);
  assert.match(service, /postType: \{ notIn: PERSONAL_DONATION_POST_TYPES \}/);
  assert.match(service, /organization: activePublicOrganizationWhere/);
  assert.match(service, /postType: \{ in: PERSONAL_DONATION_POST_TYPES \}/);
  assert.match(service, /affiliations:[\s\S]*?active: true/);
  assert.match(
    service,
    /onlyApproved \? publicPostVisibilityWhere : \{ isDeleted: false \}/,
  );
});

test("detail UI distinguishes genuine 404 from upstream errors", async () => {
  const [page, detail, service] = await Promise.all([
    readWeb("app/(public)/post/[slug]/page.tsx"),
    readWeb("components/modules/Donor/Posts/PostDetail.tsx"),
    readWeb("services/post/index.ts"),
  ]);

  assert.match(service, /if \(res\.status === 404\).*status: "not-found"/);
  assert.match(service, /status: "error"/);
  assert.match(page, /initialStatus=\{result\.status\}/);
  assert.match(detail, /Post Not Found/);
  assert.match(detail, /Unable to Load Post/);
  assert.match(detail, /Try Again/);
  assert.match(detail, /status\?: number/);
});

test("post updates and approvals revalidate list and detail caches", async () => {
  const [serverFetch, postActions] = await Promise.all([
    readWeb("helper/server-fetch.ts"),
    readWeb("services/post/index.ts"),
  ]);

  assert.match(
    serverFetch,
    /CACHE_TAGS\.POST\(match\[1\]\), CACHE_TAGS\.POSTS/,
  );
  assert.match(postActions, /revalidateTag\(CACHE_TAGS\.POSTS, \{\}\)/);
  assert.match(postActions, /revalidateTag\(CACHE_TAGS\.POST\(id\), \{\}\)/);
});
