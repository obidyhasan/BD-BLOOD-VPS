"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/useLogout";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useGetMyMembershipQuery } from "@/redux/features/organizations/organizationsApi";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  Droplets,
  Fingerprint,
  LayoutDashboard,
  LogOut,
  Settings2,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const donorShortcuts = [
  { label: "Profile", href: "/dashboard/donor", icon: User },
  { label: "My Donations", href: "/dashboard/donor/donations", icon: Droplets },
  {
    label: "Notifications",
    href: "/dashboard/donor/notifications",
    icon: Bell,
  },
  { label: "Posts", href: "/dashboard/donor/posts", icon: ClipboardList },
  { label: "Reports", href: "/dashboard/donor/reports", icon: Fingerprint },
  { label: "Settings", href: "/dashboard/donor/settings", icon: Settings2 },
];

export function UserDropdown() {
  const sessionUser = useSessionUser();
  const user = sessionUser.me;
  const handleLogout = useLogout();
  const { data: membershipData } = useGetMyMembershipQuery(undefined, {
    skip: user?.role !== "DONOR",
  });

  if (!user) return null;

  const dashboardUrl = `/dashboard/${user.role.toLowerCase()}`;
  const firstName = user.fullName?.split(" ")[0] || "User";
  const donorMenu = membershipData?.data?.canAccessDashboard
    ? [
      ...donorShortcuts,
      {
        label: "Organization",
        href: "/dashboard/organization",
        icon: LayoutDashboard,
      },
    ]
    : donorShortcuts;
  const shortcuts =
    user.role === "DONOR"
      ? donorMenu
      : [
        { label: "Dashboard", href: dashboardUrl, icon: LayoutDashboard },
        {
          label: "Settings",
          href: "/dashboard/admin/settings",
          icon: Settings2,
        },
      ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 rounded-full border border-primary/10 bg-white/60 p-1.5 pr-3 backdrop-blur-sm transition-all hover:border-primary/25 hover:bg-primary/5 dark:bg-zinc-950/60"
        >
          <Avatar className="size-8 border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-105">
            <AvatarImage src={user.profilePhoto || ""} alt={user.fullName} />
            <AvatarFallback className="bg-primary/10 text-xs font-black text-primary">
              {user.fullName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[90px] truncate text-sm font-black text-foreground sm:inline-flex">
            {firstName}
          </span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="mt-2 w-72 rounded-3xl border-border/40 bg-white p-2 shadow-premium backdrop-blur-2xl dark:bg-zinc-950/95"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="p-3 font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="size-11 border border-primary/15">
              <AvatarImage src={user.profilePhoto || ""} alt={user.fullName} />
              <AvatarFallback className="bg-primary/10 text-sm font-black text-primary">
                {user.fullName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black uppercase leading-none tracking-tighter text-foreground">
                {user.fullName}
              </p>
              <p className="mt-1 truncate text-[10px] font-bold leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2 opacity-40" />
        <DropdownMenuItem
          asChild
          className="mb-1 h-10 cursor-pointer rounded-xl px-4 focus:bg-primary/5 focus:text-primary"
        >
          <Link href={dashboardUrl} className="flex w-full items-center">
            <LayoutDashboard className="mr-3 size-4" />
            <span className="text-[10px] font-black uppercase ">
              Dashboard
            </span>
          </Link>
        </DropdownMenuItem>
        <div className="grid grid-cols-2 gap-1 p-1">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center rounded-2xl border border-transparent p-3 text-center transition-colors hover:border-primary/10 hover:bg-primary/5 hover:text-primary"
              >
                <Icon className="mb-1 size-4" />
                <span className="text-[10px] font-black uppercase leading-tight tracking-tighter">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        <DropdownMenuSeparator className="my-2 opacity-40" />
        <DropdownMenuItem
          className="h-10 cursor-pointer rounded-xl bg-red-500/10 px-4 text-red-500 focus:bg-red-500/20 focus:text-red-600"
          onClick={() => void handleLogout()}
        >
          <LogOut className="mr-3 size-4" />
          <span className="text-[10px] font-black uppercase ">
            Log out
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
