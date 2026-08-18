"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useGetMyMembershipQuery } from "@/redux/features/organizations/organizationsApi";
import { Building2, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function UserDropdown() {
  const sessionUser = useSessionUser();
  const user = sessionUser.me;
  const {
    data: membershipData,
    isLoading: membershipLoading,
    isFetching: membershipFetching,
  } = useGetMyMembershipQuery(undefined, {
    skip: user?.role !== "DONOR",
  });

  if (!user) return null;

  const profileHref =
    user.role === "ADMIN" ? "/dashboard/admin/settings" : "/dashboard/donor";
  const firstName = user.fullName?.split(" ")[0] || "User";
  const isMembershipResolving =
    user.role === "DONOR" && (membershipLoading || membershipFetching);
  const canAccessOrganization =
    user.role === "DONOR" &&
    membershipData?.data?.status === "ACTIVE" &&
    !!membershipData.data.organizationId &&
    membershipData.data.canAccessDashboard === true;

  const avatarContent = (showChevron: boolean) => (
    <>
      <Avatar className="size-8 border-2 border-primary/20 shadow-sm">
        <AvatarImage src={user.profilePhoto || ""} alt={user.fullName} />
        <AvatarFallback className="bg-primary/10 text-xs font-black text-primary">
          {user.fullName?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <span className="hidden max-w-[90px] truncate text-sm font-black text-foreground sm:inline-flex">
        {firstName}
      </span>
      {showChevron && (
        <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
      )}
    </>
  );

  const avatarButtonClassName =
    "h-11 rounded-full border border-primary/10 bg-white/60 p-1.5 pr-3 backdrop-blur-sm transition-all hover:border-primary/25 hover:bg-primary/5 dark:bg-zinc-950/60";

  if (isMembershipResolving) {
    return <Skeleton className="h-11 w-28 rounded-full bg-primary/15" />;
  }

  if (!canAccessOrganization) {
    return (
      <Button asChild variant="ghost" className={avatarButtonClassName}>
        <Link href={profileHref} aria-label="Open profile">
          {avatarContent(false)}
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={avatarButtonClassName}
          aria-label="Open account menu"
        >
          {avatarContent(true)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="mt-2 w-52 rounded-xl border-border/40 bg-white p-1.5 shadow-lg dark:bg-zinc-950"
        align="end"
      >
        <DropdownMenuItem
          asChild
          className="h-10 cursor-pointer rounded-lg px-3"
        >
          <Link href={profileHref} className="flex w-full items-center gap-3">
            <User className="size-4" />
            <span className="text-sm font-semibold">Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="h-10 cursor-pointer rounded-lg px-3"
        >
          <Link
            href="/dashboard/organization"
            className="flex w-full items-center gap-3"
          >
            <Building2 className="size-4" />
            <span className="text-sm font-semibold">Organization</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
