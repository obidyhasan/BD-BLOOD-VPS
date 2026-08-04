"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Droplets, HeartPulse, Home, Hospital, User } from "lucide-react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { useSessionUser } from "@/hooks/useSessionUser";
import { cn } from "@/lib/utils";

const bottomNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Donors", icon: Droplets, href: "/donor" },
  { label: "Medical", icon: Hospital, href: "/medical" },
  { label: "Requests", icon: HeartPulse, href: "/donor/post" },
  { label: "Account", icon: User, href: "/dashboard/donor", isAccount: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const reduxUser = useAppSelector(selectCurrentUser);
  const sessionUser = useSessionUser();
  const user = reduxUser ?? sessionUser.me;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden">
      <div className="absolute inset-0 border-t border-primary/10 bg-white/95 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:bg-zinc-950/95" />
      <nav className="relative mx-auto flex h-[74px] max-w-lg items-center justify-around px-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const href = item.isAccount
            ? user
              ? `/dashboard/${user.role.toLowerCase()}`
              : "/login"
            : item.href;
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={item.label}
              href={href}
              className="relative flex h-full flex-1 flex-col items-center justify-center transition-all active:scale-90"
              aria-label={item.label}
            >
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
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
