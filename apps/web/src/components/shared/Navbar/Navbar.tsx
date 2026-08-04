"use client";

import { Button } from "@/components/ui/button";
import { NavMenu } from "@/components/shared/Navbar/nav-menu";
import { NavigationSheet } from "@/components/shared/Navbar/navigation-sheet";
import Link from "next/link";
import { BDLogo } from "@/components/ui/bd-logo";
import { LogIn } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { UserDropdown } from "./user-dropdown";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { useSessionUser } from "@/hooks/useSessionUser";
import { Skeleton } from "@/components/ui/skeleton";

const Navbar = () => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const reduxUser = useAppSelector(selectCurrentUser);
  const sessionUser = useSessionUser();
  const user = reduxUser ?? sessionUser.me;
  const isUserLoading =
    !reduxUser && (sessionUser.isLoading || sessionUser.isFetching);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
        <motion.nav
          initial={false}
          animate={{
            y: 0,
          }}
          className={cn(
            `w-full h-17 flex items-center justify-between transition-all duration-700 pointer-events-auto ${isScrolled && "border-b bg-white/70"} dark:bg-zinc-900/70 backdrop-blur-3xl border-primary/10`,
          )}
        >
          {/* Brand Node */}
          <div className="relative w-full max-w-7xl mx-auto h-full flex items-center justify-between px-6">
            <div className="flex items-center gap-12">
              <Link
                href={"/"}
                className="transition-all hover:opacity-80 active:scale-95 shrink-0 flex items-center gap-2 max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2"
              >
                <BDLogo size="md" />
              </Link>

              <div className="hidden lg:block">
                <NavMenu />
              </div>
            </div>

            {/* Global Controls */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="max-sm:hidden">
                  {isUserLoading ? (
                    <Skeleton className="h-10 w-28 rounded-full bg-primary/15" />
                  ) : user ? (
                    <UserDropdown />
                  ) : (
                    <Link href={"/login"}>
                      <Button
                        className="h-10 px-6 rounded-full font-black text-[10px] uppercase  bg-primary hover:bg-emerald-600 text-white shadow-lg shadow-primary/10 border-none transition-all flex items-center gap-2 group"
                        variant="primary"
                      >
                        <LogIn className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="lg:hidden">
                  <NavigationSheet />
                </div>
              </div>
            </div>
          </div>
        </motion.nav>
      </header>
      <BottomNav />
    </>
  );
};

export default Navbar;
