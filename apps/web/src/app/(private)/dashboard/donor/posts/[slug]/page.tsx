"use client";

import PostDetail from "@/components/modules/Donor/Posts/PostDetail";
import { useParams } from "next/navigation";

export default function DonorPostPreviewPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  return (
    <PostDetail
      slug={slug}
      isPreview
      backHref="/dashboard/donor/posts"
      backLabel="← Back to my posts"
    />
  );
}
