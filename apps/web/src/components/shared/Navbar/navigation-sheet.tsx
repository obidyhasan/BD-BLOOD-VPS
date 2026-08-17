"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu, Droplets, LayoutDashboard } from "lucide-react";
import { NavMenu } from "@/components/shared/Navbar/nav-menu";
import Link from "next/link";
import { BDLogo } from "@/components/ui/bd-logo";
import { useSessionUser } from "@/hooks/useSessionUser";
import { Skeleton } from "@/components/ui/skeleton";

export const NavigationSheet = () => {
  const session = useSessionUser();
  const dashboardHref = session.me
    ? `/dashboard/${session.me.role.toLowerCase()}`
    : "/login";
  return (
    <Sheet>
      <VisuallyHidden>
        <SheetTitle>Navigation Menu</SheetTitle>
      </VisuallyHidden>

      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-md border-border/40">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="z-[200] px-6 py-6 w-80 bg-white border-r border-border/40">
        <div className="flex items-center gap-3 mb-8 pb-6">
          <Link href="/">
            <BDLogo size="md" />
          </Link>
        </div>

        <NavMenu orientation="vertical" className="[&>div]:h-full w-full" />

        <div className="mt-8 pt-6">
          {session.isLoading ? (
            <Skeleton className="h-12 w-full rounded-xl" />
          ) : (
          <Link href={dashboardHref} className="block">
            <Button className="w-full h-12 rounded-xl bg-primary text-white font-black text-xs uppercase ">
              {session.me ? (
                <LayoutDashboard className="size-4 mr-2" />
              ) : (
                <Droplets className="size-4 mr-2" />
              )}
              {session.me ? "Open Dashboard" : "Sign In"}
            </Button>
          </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
