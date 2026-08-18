"use client";

import { AppSidebar } from "@/components/ui/app-sidebar";
import DashboardSearch from "@/components/shared/DashboardSearch/DashboardSearch";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";
import { useGetMyNotificationsQuery } from "@/redux/features/notifications/notificationsApi";

const routeNames: Record<string, string> = {
  "/dashboard/organization": "Overview",
  "/dashboard/organization/donors": "Find Donors",
  "/dashboard/organization/manage-donors": "Manage Donors",
  "/dashboard/organization/manage-requests": "Manage Requests",
  "/dashboard/organization/posts": "All Posts",
  "/dashboard/organization/manage-posts": "Manage Posts",
  "/dashboard/organization/manage-galleries": "Manage Galleries",
  "/dashboard/organization/blogs": "Blogs",
  "/dashboard/organization/events": "Events",
  "/dashboard/organization/members": "All Members",
  "/dashboard/organization/profile": "Organization Details",
  "/dashboard/organization/positions": "Positions & Roles",
  "/dashboard/organization/inventory": "Blood Inventory",
  "/dashboard/organization/notifications": "Notifications",
  "/dashboard/organization/donor-query": "Donor Queue",
  "/dashboard/organization/donations": "Donation Verification",
  "/dashboard/organization/rules-regulations": "Rules & Policies",
};

export default function OrganizationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const currentRouteName = routeNames[pathname] || "Overview";
  const { me, name, organization, organizationId } =
    useOrganizationDashboardContext();
  const orgName = organization?.name;
  const organizationQuery = organizationId
    ? `?organizationId=${encodeURIComponent(organizationId)}`
    : "";
  const { data: unreadData } = useGetMyNotificationsQuery({
    isRead: false,
    limit: 1,
  });
  const unreadCount = unreadData?.meta.total ?? 0;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50 min-h-screen">
        <header className="sticky top-0 z-[50] flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border/40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 transition-[width,height] ease-linear">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 size-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-border/40" />
            <Separator orientation="vertical" className="h-6 opacity-40" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <Link
                    href={`/dashboard/organization${organizationQuery}`}
                    className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Organization
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-black text-foreground uppercase tracking-tight">
                    {currentRouteName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex relative w-80">
              <DashboardSearch
                role="organization"
                placeholder="Universal Search..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/organization/notifications${organizationQuery}`}
              >
                <Button
                  size="icon"
                  variant="outline"
                  className="size-11 rounded-2xl border-border/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 relative"
                >
                  <Bell className="size-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 size-2 bg-primary rounded-full ring-2 ring-white dark:ring-zinc-950" />
                  )}
                  <span className="sr-only">
                    {unreadCount} unread notifications
                  </span>
                </Button>
              </Link>

              <div>
                <Button
                  asChild
                  variant="ghost"
                  className="h-11 px-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-3"
                >
                  <Link
                    href={
                      organization?.id
                        ? `/organization/${organization.id}`
                        : "/dashboard/organization"
                    }
                  >
                    <Avatar className="size-9 rounded-xl border border-border/40 shadow-sm">
                      <AvatarImage
                        src={me?.profilePhoto ?? undefined}
                        alt={name}
                      />
                      <AvatarFallback className="rounded-xl font-black text-[10px] bg-primary/10 text-primary">
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start leading-none shrink-0">
                      <span className="text-xs font-black truncate max-w-[120px]">
                        {orgName ?? name}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground opacity-60">
                        {me?.role ?? "Manager"}
                      </span>
                    </div>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
          <div className="mx-auto max-w-full">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
