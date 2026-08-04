/* eslint-disable react-hooks/immutability */
"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { ComponentProps } from "react";
import { usePathname } from "next/navigation";

import { navLinks } from "@/lib/siteContent";

export const NavMenu = (props: ComponentProps<typeof NavigationMenu>) => {
  const pathname = usePathname();

  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    e.preventDefault();

    if (pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <NavigationMenu {...props}>
      <NavigationMenuList className="space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
        {navLinks.map((link) => {
          const isCurrentPage = pathname === "/";
          const href = link.isExternal
            ? link.href
            : isCurrentPage
              ? link.href
              : `/${link.href}`;

          return (
            <NavigationMenuItem key={link.label}>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                {link.isExternal ? (
                  <Link href={href}>{link.label}</Link>
                ) : (
                  <Link
                    href={href}
                    onClick={(e) =>
                      link.sectionId && handleSectionClick(e, link.sectionId)
                    }
                  >
                    {link.label}
                  </Link>
                )}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};
