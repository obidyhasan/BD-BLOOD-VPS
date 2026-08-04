"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-2 text-primary font-black text-xs uppercase  hover:-translate-x-2 transition-transform"
    >
      <ArrowLeft className="size-4" />
      Previous Journey
    </button>
  );
}
