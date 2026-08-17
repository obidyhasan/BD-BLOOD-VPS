"use client";

import {
  Bell,
  Clipboard,
  HeartPlus,
  LayoutDashboard,
  Newspaper,
  ShieldPlus,
  UserRound,
} from "lucide-react";

import { NavMain } from "@/components/ui/nav-main";
import { NavUser } from "@/components/ui/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { BDLogo } from "@/components/ui/bd-logo";
import Link from "next/link";

import { useSessionUser } from "@/hooks/useSessionUser";
import { useGetMyMembershipQuery } from "@/redux/features/organizations/organizationsApi";

const navMain = [
  {
    title: "Overview",
    url: "/dashboard/organization",
    icon: LayoutDashboard,
  },
  {
    title: "Blood Management",
    url: "#",
    icon: HeartPlus,
    items: [
      {
        title: "Blood Requests",
        url: "/dashboard/organization/manage-requests",
        managerOnly: true,
      },
      {
        title: "Donation Verification",
        url: "/dashboard/organization/donations",
        managerOnly: true,
      },
      { title: "Blood Inventory", url: "/dashboard/organization/inventory" },
    ],
  },
  {
    title: "Donors",
    url: "#",
    icon: ShieldPlus,
    items: [
      { title: "Donor Directory", url: "/dashboard/organization/donors" },
      {
        title: "Affiliated Donors",
        url: "/dashboard/organization/manage-donors",
        managerOnly: true,
      },
      { title: "Donor Queue", url: "/dashboard/organization/donor-query" },
    ],
  },
  {
    title: "Organization",
    url: "#",
    icon: UserRound,
    items: [
      { title: "Profile", url: "/dashboard/organization/profile", managerOnly: true },
      { title: "Members", url: "/dashboard/organization/members" },
      {
        title: "Positions & Roles",
        url: "/dashboard/organization/positions",
        managerOnly: true,
      },
      { title: "Rules & Policies", url: "/dashboard/organization/rules-regulations" },
    ],
  },
  {
    title: "Posts & Activities",
    url: "#",
    icon: Clipboard,
    items: [
      { title: "Organization Posts", url: "/dashboard/organization/posts" },
      {
        title: "Donor Post Moderation",
        url: "/dashboard/organization/manage-posts",
        managerOnly: true,
      },
    ],
  },
  {
    title: "Content",
    url: "#",
    icon: Newspaper,
    items: [
      {
        title: "Blogs",
        url: "/dashboard/organization/blogs",
        managerOnly: true,
      },
      {
        title: "Events",
        url: "/dashboard/organization/events",
        managerOnly: true,
      },
      {
        title: "Gallery",
        url: "/dashboard/organization/manage-galleries",
        managerOnly: true,
      },
    ],
  },
  {
    title: "Notifications",
    url: "/dashboard/organization/notifications",
    icon: Bell,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSessionUser();
  const { data: membershipData } = useGetMyMembershipQuery(undefined, {
    skip: user.me?.role === "ADMIN",
  });
  const canManageOrganization =
    user.me?.role === "ADMIN" || !!membershipData?.data?.canAccessDashboard;
  const visibleNavMain = navMain
    .map((section) => ({
      ...section,
      items: section.items?.filter(
        (item) => canManageOrganization || !item.managerOnly,
      ),
    }))
    .filter((section) => !section.items || section.items.length > 0);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40"
      {...props}
    >
      <SidebarHeader className="h-20 flex items-center justify-center p-0 border-b border-border/40 transition-all duration-300">
        <Link
          href={"/"}
          className="transition-transform hover:scale-105 active:scale-95 px-6 group-data-[collapsible=icon]:px-0"
        >
          <BDLogo
            size="md"
            className="py-1 opacity-90 group-data-[collapsible=icon]:hidden"
          />
          <BDLogo
            size="sm"
            iconOnly
            className="py-1 opacity-90 hidden group-data-[collapsible=icon]:block"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-4 space-y-6">
        <NavMain items={visibleNavMain} />
      </SidebarContent>

      <SidebarSeparator className="opacity-40 mx-4" />

      <SidebarFooter className="p-4">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
