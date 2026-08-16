"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DonorSidebar } from "@/components/ui/donor-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import DashboardSearch from "@/components/shared/DashboardSearch/DashboardSearch";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileCompletionGate } from "@/components/modules/Donor/Profile/ProfileCompletionGate";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useGetMyNotificationsQuery } from "@/redux/features/notifications/notificationsApi";

const routeNames: Record<string, string> = {
  "/dashboard/donor": "My Profile",
  "/dashboard/donor/donations": "My Donations",
  "/dashboard/donor/notifications": "Notifications",
  "/dashboard/donor/posts": "Community Posts",
  "/dashboard/donor/settings": "Account Safety",
};

export default function DonorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  useNotificationSocket();
  const { data: unreadData } = useGetMyNotificationsQuery({ isRead: false, limit: 1 });
  const unreadCount = unreadData?.meta.total ?? 0;
  const currentRouteName =
    routeNames[pathname] ??
    (pathname.startsWith("/dashboard/donor/posts/") ? "Post Preview" : "My Profile");

  return (
    <SidebarProvider defaultOpen={true}>
      <ProfileCompletionGate />
      <div className=" flex min-h-screen w-full bg-white dark:bg-zinc-950">
        <DonorSidebar />
        <SidebarInset className="flex w-full flex-col overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/50">
          <header className="sticky top-0 z-[50] flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border/40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 transition-[width,height] ease-linear">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2 size-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-border/40" />
              <Separator orientation="vertical" className="h-6 opacity-40" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <Link
                      href="/dashboard/donor"
                      className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                    >
                      Donor
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
              <div className="hidden lg:flex relative w-80">
                <DashboardSearch role="donor" placeholder="System Search..." />
              </div>

              <div className="flex items-center gap-2">
                <Link href="/dashboard/donor/notifications">
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-11 rounded-2xl border-border/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 relative"
                  >
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[9px] font-black leading-5 text-primary-foreground ring-2 ring-white dark:ring-zinc-950">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
            <div className="w-full animate-in fade-in duration-700">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
