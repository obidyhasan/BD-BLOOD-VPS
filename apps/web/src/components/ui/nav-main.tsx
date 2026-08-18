"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { resolveSidebarNavigation } from "@/lib/sidebarNavigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedOrganizationId = searchParams.get("organizationId");

  const resolvedItems = resolveSidebarNavigation(items);

  return (
    <SidebarGroup className="px-2">
      <SidebarMenu className="gap-1.5">
        {resolvedItems.map((item) => {
          const withOrganizationContext = (url: string) => {
            if (
              !selectedOrganizationId ||
              !url.startsWith("/dashboard/organization")
            ) {
              return url;
            }
            return `${url}?organizationId=${selectedOrganizationId}`;
          };

          const isRouteActive = (url: string) => {
            if (
              url === "/dashboard/organization" ||
              url === "/dashboard/admin"
            ) {
              return pathname === url;
            }
            return pathname === url || pathname.startsWith(url + "/");
          };

          const isSectionActive = item.items?.some((sub) =>
            isRouteActive(sub.url),
          );

          if (!item.items?.length) {
            const isActive = isRouteActive(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    "h-12 rounded-2xl border border-transparent px-4 transition-all hover:border-border/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                    isActive &&
                      "border-primary/10 bg-primary/5 text-primary hover:bg-primary/10",
                  )}
                >
                  <Link href={withOrganizationContext(item.url)}>
                    {item.icon && <item.icon className="size-5 shrink-0" />}
                    <span className="text-[10px] font-black uppercase group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isSectionActive}
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
                    {item.icon && (
                      <item.icon
                        className={cn(
                          "size-5 transition-colors shrink-0",
                          isSectionActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover/collapsible:text-primary",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "font-black text-[10px] uppercase  transition-colors",
                        "group-data-[collapsible=icon]:hidden",
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
                    {item.items?.map((subItem) => {
                      const isActive = isRouteActive(subItem.url);
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(
                              "h-10 rounded-xl transition-all duration-200 group/sub",
                              isActive
                                ? "bg-primary hover:bg-emerald-600 shadow-lg shadow-primary/20"
                                : "hover:bg-primary/5",
                            )}
                          >
                            <Link
                              href={withOrganizationContext(subItem.url)}
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
  );
}
