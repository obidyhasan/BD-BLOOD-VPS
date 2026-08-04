"use client";

import { ChevronsUpDown, LogOut, ShieldCheck } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const handleLogout = useLogout();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-14 rounded-2xl border border-transparent data-[state=open]:border-border/40 data-[state=open]:bg-zinc-100 dark:data-[state=open]:bg-zinc-900 transition-all px-3"
            >
              <div className="relative">
                <Avatar className="h-10 w-10 rounded-xl border-2 border-background shadow-md">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-xl bg-primary text-white font-black text-xs">OH</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center shadow-lg">
                  <ShieldCheck className="size-2 text-white" />
                </div>
              </div>
              <div className="grid flex-1 text-left ml-2 leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-xs font-black uppercase tracking-tighter text-foreground">{user.name}</span>
                <span className="truncate text-[10px] font-bold text-muted-foreground opacity-60 lowercase">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-20 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-48 rounded-2xl border-border/40 p-2 shadow-premium bg-white dark:bg-zinc-950/90 backdrop-blur-2xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={12}
          >
            {/* <DropdownMenuLabel className="p-0 font-normal mb-2">
              <div className="flex items-center gap-4 px-2 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
                <Avatar className="h-12 w-12 rounded-xl border border-border/40">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-xl">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <p className="truncate text-sm font-black uppercase text-foreground tracking-tighter">{user.name}</p>
                  <p className="truncate text-[10px] font-bold text-muted-foreground opacity-60">{user.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-4 opacity-40" />
            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuItem className="h-11 rounded-xl focus:bg-primary/5 focus:text-primary cursor-pointer px-4">
                <BadgeCheck className="size-4 mr-3" />
                <span className="text-[10px] font-black uppercase ">Profile</span>
              </DropdownMenuItem>


            </DropdownMenuGroup> */}

            <DropdownMenuItem
              className="h-11 bg-red-500/10 rounded-lg focus:bg-red-500/10 focus:text-red-500 text-muted-foreground cursor-pointer px-4 text-red-500"
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-4 mr-3 text-red-500" />
              <span className="text-[10px] font-black uppercase ">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
