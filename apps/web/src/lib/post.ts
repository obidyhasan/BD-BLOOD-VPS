import type { Post as ApiPost } from "@/redux/features/posts/postsApi";

export type LegacyPost = {
  id: string;
  slug?: string;
  likeCount?: number;
  commentCount?: number;
  title: string;
  org: string;
  author: string;
  date: string;
  status: "Published" | "Pending" | "Draft" | "Rejected";
  type: "URGENT" | "EMERGENCY" | "EVENT" | "ANNOUNCEMENT" | "GENERAL" | "RECAP";
  visibility: "Public" | "Private";
  content?: string;
  images?: string[];
  division?: string;
  district?: string;
  upazila?: string;
  isWork?: boolean;
  orgSlug?: string;
};

export type ModerationPostRow = {
  id: string;
  title: string;
  org: string;
  author: string;
  date: string;
  status: "Published" | "Pending" | "Rejected" | "Draft";
  type: string;
  visibility: string;
};

export function mapApiPostToModerationRow(
  post: ApiPost,
  orgNameFallback = "",
): ModerationPostRow {
  const statusMap: Record<string, ModerationPostRow["status"]> = {
    APPROVED: "Published",
    PENDING: "Pending",
    REJECTED: "Rejected",
  };
  return {
    id: post.id,
    title: post.title,
    org: post.organization?.name ?? orgNameFallback,
    author: post.donor?.fullName ?? "",
    date: new Date(post.createdAt).toLocaleDateString(),
    status: statusMap[post.approvalStatus] ?? "Pending",
    type: post.postType,
    visibility: post.visibility === "PUBLIC" ? "Public" : "Private",
  };
}

export function getPostPath(
  post: Pick<LegacyPost, "id" | "slug" | "status">,
  options?: { fromDashboard?: boolean },
) {
  const slug = post.slug ?? post.id;
  if (options?.fromDashboard && post.status !== "Published") {
    return `/dashboard/donor/posts/${slug}`;
  }
  return `/post/${slug}`;
}

export function mapApiPostToLegacy(
  post: ApiPost,
  orgNameFallback = "",
): LegacyPost {
  return {
    id: post.id,
    slug: post.slug,
    likeCount: post._count?.likes ?? 0,
    commentCount: post._count?.comments ?? 0,
    title: post.title,
    org: post.organization?.name ?? orgNameFallback,
    author: post.donor?.fullName ?? "",
    date: new Date(post.createdAt).toLocaleDateString(),
    status:
      post.approvalStatus === "APPROVED"
        ? "Published"
        : post.approvalStatus === "REJECTED"
          ? "Rejected"
          : "Pending",
    type: post.postType as LegacyPost["type"],
    visibility: post.visibility === "PUBLIC" ? "Public" : "Private",
    content: post.content,
    images: post.images ?? [],
    isWork: post.isWork,
  };
}
