"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  HeartPulse,
  Home,
  Hospital,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSessionUser } from "@/hooks/useSessionUser";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetMyMembershipQuery } from "@/redux/features/organizations/organizationsApi";

const bottomNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Organizations", icon: Building2, href: "/organization" },
  { label: "Medical", icon: Hospital, href: "/medical" },
  { label: "Requests", icon: HeartPulse, href: "/donor/post" },
  { label: "Account", icon: User, href: "/dashboard/donor", isAccount: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const sessionUser = useSessionUser();
  const user = sessionUser.me;
  const {
    data: membershipData,
    isLoading: membershipLoading,
    isFetching: membershipFetching,
  } = useGetMyMembershipQuery(undefined, {
    skip: user?.role !== "DONOR",
  });
  const isMembershipResolving =
    user?.role === "DONOR" && (membershipLoading || membershipFetching);
  const canAccessOrganization =
    user?.role === "DONOR" &&
    membershipData?.data?.status === "ACTIVE" &&
    !!membershipData.data.organizationId &&
    membershipData.data.canAccessDashboard === true;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden">
      <div className="absolute inset-0 border-t border-primary/10 bg-white/95 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:bg-zinc-950/95" />
      <nav className="relative mx-auto flex h-[74px] max-w-lg items-center justify-around px-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const href = item.isAccount
            ? user
              ? user.role === "ADMIN"
                ? "/dashboard/admin/settings"
                : "/dashboard/donor"
              : "/login"
            : item.href;
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));

          const accountContent = (
            <>
              <motion.div
                initial={false}
                animate={{ scale: isActive ? 1.12 : 1 }}
                className={cn(
                  "relative rounded-2xl p-2 transition-colors duration-300",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
              >
                {item.isAccount && user ? (
                  <Avatar className="size-6 border-2 border-primary/20">
                    <AvatarImage
                      src={user.profilePhoto || ""}
                      alt={user.fullName}
                    />
                    <AvatarFallback className="bg-primary/10 text-[10px] font-black text-primary">
                      {user.fullName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : item.label === "Requests" ? (
                  <>
                    <Icon size={22} strokeWidth={isActive ? 2.7 : 2.2} />
                    <Bell className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-red-500 p-0.5 text-white" />
                  </>
                ) : (
                  <Icon size={22} strokeWidth={isActive ? 2.7 : 2.2} />
                )}
              </motion.div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-black tracking-tighter transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground/70",
                )}
              >
                {item.label}
              </span>
            </>
          );

          if (item.isAccount && canAccessOrganization) {
            return (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative flex h-full flex-1 flex-col items-center justify-center transition-all active:scale-90"
                    aria-label="Open account menu"
                  >
                    {accountContent}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="end"
                  className="w-52 rounded-xl p-1.5"
                >
                  <DropdownMenuItem asChild>
                    <Link href={href} className="flex items-center gap-3">
                      <User className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/organization"
                      className="flex items-center gap-3"
                    >
                      <Building2 className="size-4" />
                      Organization
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <Link
              key={item.label}
              href={href}
              aria-disabled={
                item.isAccount &&
                (sessionUser.isLoading || isMembershipResolving)
              }
              onClick={(event) => {
                if (
                  item.isAccount &&
                  (sessionUser.isLoading || isMembershipResolving)
                ) {
                  event.preventDefault();
                }
              }}
              className="relative flex h-full flex-1 flex-col items-center justify-center transition-all active:scale-90"
              aria-label={item.label}
            >
              {accountContent}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
