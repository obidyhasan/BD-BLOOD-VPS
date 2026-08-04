"use client";

import { ShieldAlert, LogOut, Settings, Bell, User } from "lucide-react";
import React from "react";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardSearch from "@/components/shared/DashboardSearch/DashboardSearch";
import Link from "next/link";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useLogout } from "@/hooks/useLogout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { me, name } = useSessionUser();
  const handleLogout = useLogout();

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50 min-h-screen">
        <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border/40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 transition-[width,height] ease-linear">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 size-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-border/40" />
            <Separator orientation="vertical" className="h-6 opacity-40" />
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ShieldAlert className="size-4 text-red-500" />
              </div>
              <div className="hidden md:flex flex-col leading-none">
                <span className="text-xs font-black uppercase  text-red-500">Admin Console</span>
                <span className="text-[10px] font-bold text-muted-foreground opacity-40">Unrestricted Access</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex relative w-80">
              <DashboardSearch role="admin" placeholder="System-wide search..." />
            </div>

            <div className="flex items-center gap-2">
              <Link href="/dashboard/admin/notifications">
                <Button size="icon" variant="outline" className="size-11 rounded-2xl border-border/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 relative">
                  <Bell className="size-5" />
                  <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-950" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-11 px-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-3">
                    <Avatar className="size-9 rounded-xl border border-border/40 shadow-sm">
                      <AvatarImage src={me?.profilePhoto ?? undefined} alt={name} />
                      <AvatarFallback className="rounded-xl font-black text-[10px] bg-red-500/10 text-red-500">
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start leading-none shrink-0">
                      <span className="text-xs font-black truncate max-w-[120px]">{name}</span>
                      <span className="text-[10px] font-bold text-red-500 opacity-80">{me?.role ?? "ADMIN"}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-48">
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href="/dashboard/admin/settings">
                      <User className="size-4 mr-2" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href="/dashboard/admin/settings">
                      <Settings className="size-4 mr-2" />
                      System Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-xl cursor-pointer text-red-500 focus:text-red-500"
                    onClick={() => void handleLogout()}
                  >
                    <LogOut className="size-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 space-y-8 animate-in fade-in duration-700">
          <div className="mx-auto max-w-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
