"use client";

import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Stethoscope,
  Settings,
  ChevronRight,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BDLogo } from "@/components/ui/bd-logo";
import { NavUser } from "@/components/ui/nav-user";
import { cn } from "@/lib/utils";
import { resolveSidebarNavigation } from "@/lib/sidebarNavigation";

import { useSessionUser } from "@/hooks/useSessionUser";

const navItems = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    items: [{ title: "Overview", url: "/dashboard/admin" }],
  },
  {
    title: "Donor Management",
    icon: Users,
    items: [
      { title: "Donors", url: "/dashboard/admin/donors" },
      { title: "Blood Requests", url: "/dashboard/admin/blood-requests" },
      { title: "Donations", url: "/dashboard/admin/donations" },
      { title: "Achievements", url: "/dashboard/admin/achievements" },
    ],
  },
  {
    title: "Organization Management",
    icon: Building2,
    items: [
      { title: "Organizations", url: "/dashboard/admin/organizations" },
      {
        title: "Leadership & Members",
        url: "/dashboard/admin/organization-members",
      },
      {
        title: "Approval Queue",
        url: "/dashboard/admin/organization-approvals",
      },
      { title: "Inventory", url: "/dashboard/admin/inventory" },
      { title: "Positions", url: "/dashboard/admin/positions" },
    ],
  },
  {
    title: "Content",
    icon: FileText,
    items: [
      { title: "Posts", url: "/dashboard/admin/posts" },
      { title: "Our Work", url: "/dashboard/admin/work" },
      { title: "Blog", url: "/dashboard/admin/blogs" },
      { title: "Events", url: "/dashboard/admin/events" },
      { title: "Gallery", url: "/dashboard/admin/gallery" },
      { title: "FAQ", url: "/dashboard/admin/faqs" },
    ],
  },
  {
    title: "Medical",
    icon: Stethoscope,
    items: [
      { title: "Institutions", url: "/dashboard/admin/medical-institutions" },
      { title: "Doctors", url: "/dashboard/admin/doctors" },
      { title: "Library", url: "/dashboard/admin/library" },
      { title: "Ads", url: "/dashboard/admin/medical-ads" },
    ],
  },
  {
    title: "System",
    icon: Settings,
    items: [
      { title: "Reports", url: "/dashboard/admin/reports" },
      { title: "Policies", url: "/dashboard/admin/policies" },
      { title: "Notifications", url: "/dashboard/admin/notifications" },
      { title: "Settings", url: "/dashboard/admin/settings" },
    ],
  },
];

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const adminUser = useSessionUser();

  const resolvedNavItems = resolveSidebarNavigation(navItems);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40"
      {...props}
    >
      <SidebarHeader className="h-20 flex items-center justify-center p-0 border-b border-border/40 bg-zinc-50 dark:bg-zinc-950 transition-all duration-300">
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

      <SidebarContent className="p-4 space-y-4">
        <SidebarGroup className="px-2 p-0">
          <SidebarMenu className="gap-1.5">
            {resolvedNavItems.map((item) => {
              const isRouteActive = (url: string) => {
                if (
                  url === "/dashboard/organization" ||
                  url === "/dashboard/admin"
                ) {
                  return pathname === url;
                }
                return pathname === url || pathname.startsWith(url + "/");
              };

              const isSectionActive = item.items?.some((sub) =>
                isRouteActive(sub.url),
              );
              if (!item.items?.length) {
                const isActive = isRouteActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        "h-12 rounded-2xl border border-transparent px-4 transition-all hover:border-border/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                        isActive &&
                          "border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500/10",
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-5 shrink-0" />
                        <span className="text-[10px] font-black uppercase group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isSectionActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={cn(
                          "h-12 rounded-2xl border border-transparent hover:border-border/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all px-4",
                          "group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center",
                          isSectionActive &&
                            "bg-red-500/5 border-red-500/10 hover:bg-red-500/10",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "size-5 transition-colors shrink-0",
                            isSectionActive
                              ? "text-red-500"
                              : "text-muted-foreground group-hover/collapsible:text-red-500",
                          )}
                        />
                        <span
                          className={cn(
                            "font-black text-[10px] uppercase  transition-colors group-data-[collapsible=icon]:hidden",
                            isSectionActive
                              ? "text-red-500"
                              : "text-muted-foreground/80 group-hover/collapsible:text-foreground",
                          )}
                        >
                          {item.title}
                        </span>
                        <ChevronRight className="ml-auto size-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 opacity-40 shrink-0 group-data-[collapsible=icon]:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-4 pl-4 border-l-2 border-dashed border-border/40 space-y-0.5 my-2">
                        {item.items?.map((subItem) => {
                          const isActive = isRouteActive(subItem.url);
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  "h-10 rounded-xl transition-all duration-200 group/sub",
                                  isActive
                                    ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                                    : "hover:bg-red-500/5",
                                )}
                              >
                                <Link
                                  href={subItem.url}
                                  className="flex items-center gap-3"
                                >
                                  <div
                                    className={cn(
                                      "size-1.5 rounded-full transition-all shrink-0",
                                      isActive
                                        ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                                        : "bg-border group-hover/sub:bg-red-500",
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "text-[10px] font-black uppercase ",
                                      isActive
                                        ? "text-white"
                                        : "text-muted-foreground group-hover/sub:text-red-500",
                                    )}
                                  >
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="opacity-40 mx-4" />

      <SidebarFooter className="p-4">
        <NavUser user={adminUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
