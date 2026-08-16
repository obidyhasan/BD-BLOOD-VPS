"use client";

import {
  Bell,
  User,
  Settings,
  ChevronRight,
  Droplets,
  ClipboardList,
  Fingerprint,
  Settings2,
  Building2,
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

import { useSessionUser } from "@/hooks/useSessionUser";
import { useGetMyMembershipQuery } from "@/redux/features/organizations/organizationsApi";

const navItems = [
  {
    title: "Profile",
    icon: User,
    url: "/dashboard/donor",
  },
  {
    title: "History",
    icon: Droplets,
    items: [
      { title: "My Donations", url: "/dashboard/donor/donations" },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    url: "/dashboard/donor/notifications",
    badge: "",
  },
  {
    title: "Posts",
    icon: ClipboardList,
    url: "/dashboard/donor/posts",
  },
  {
    title: "Reports",
    icon: Fingerprint,
    url: "/dashboard/donor/reports",
  },
  {
    title: "Settings",
    icon: Settings2,
    url: "/dashboard/donor/settings",
  },
];

export function DonorSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const donorUser = useSessionUser();
  const pathname = usePathname();
  const { data: membershipData } = useGetMyMembershipQuery();
  const visibleNavItems = membershipData?.data?.canAccessDashboard
    ? [
      ...navItems,
      {
        title: "Organization",
        icon: Building2,
        url: "/dashboard/organization",
      },
    ]
    : navItems;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40"
      {...props}
    >
      <SidebarHeader className="h-20 flex items-center justify-center p-0 border-b border-border/40 dark:bg-zinc-950 transition-all duration-300">
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
            {visibleNavItems.map((item) => {
              const isRouteActive = (url?: string) => {
                if (!url) return false;
                if (url === "/dashboard/donor") {
                  return pathname === url;
                }
                return pathname === url || pathname.startsWith(url + "/");
              };
              const isSectionActive =
                item.items?.some((sub) => isRouteActive(sub.url)) ||
                isRouteActive(item.url || "");

              if (!item.items) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        "h-12 rounded-2xl border border-transparent hover:border-border/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all px-4",
                        "group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center",
                        isSectionActive &&
                        "bg-primary/5 border-primary/10 hover:bg-primary/10",
                      )}
                    >
                      <Link href={item.url || "#"}>
                        <item.icon
                          className={cn(
                            "size-5 transition-colors shrink-0",
                            isSectionActive
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                        <span
                          className={cn(
                            "font-black text-[10px] uppercase  transition-colors group-data-[collapsible=icon]:hidden",
                            isSectionActive
                              ? "text-primary"
                              : "text-muted-foreground/80",
                          )}
                        >
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[8px] font-black uppercase text-primary-foreground group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </span>
                        )}
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
                          "bg-primary/5 border-primary/10 hover:bg-primary/10",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "size-5 transition-colors shrink-0",
                            isSectionActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover/collapsible:text-primary",
                          )}
                        />
                        <span
                          className={cn(
                            "font-black text-[10px] uppercase  transition-colors group-data-[collapsible=icon]:hidden",
                            isSectionActive
                              ? "text-primary"
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
                        {item.items.map((subItem) => {
                          const isActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  "h-10 rounded-xl transition-all duration-200 group/sub",
                                  isActive
                                    ? "bg-primary hover:bg-primary/80 shadow-lg shadow-primary/20"
                                    : "hover:bg-primary/5",
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
                                        : "bg-border group-hover/sub:bg-primary",
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "text-[10px] font-black uppercase ",
                                      isActive
                                        ? "text-white"
                                        : "text-muted-foreground group-hover/sub:text-primary",
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
        <NavUser user={donorUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
