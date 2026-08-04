"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, MapPin, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useGetOrganizationShortagesQuery } from "@/redux/features/analytics/analyticsApi";

export interface OrganizationShortage {
  id: string;
  name: string;
  location: string;
  lowGroups: string[];
  outGroups: string[];
}

interface OrganizationShortageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrganizationShortageModal = ({
  open,
  onOpenChange,
}: OrganizationShortageModalProps) => {
  const { data, isLoading, isError } = useGetOrganizationShortagesQuery(undefined, {
    skip: !open,
  });

  const shortages = data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[3rem] border-border/40 p-0 overflow-hidden bg-white dark:bg-zinc-950">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-500/5 to-transparent -z-10" />

        <div className="p-8 pb-4">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertTriangle className="size-7" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none">
                  Blood <span className="text-red-500">Shortages</span>
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground mt-1">
                  Live inventory shortages across registered organizations.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="h-[450px] px-8 pb-8">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <p className="text-center text-sm text-muted-foreground py-16">
              Failed to load shortage data.
            </p>
          ) : shortages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">
              No organizations currently report low or empty stock.
            </p>
          ) : (
            <div className="space-y-4">
              {shortages.map((org, index) => (
                <motion.div
                  key={org.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border border-border/40 hover:border-red-500/20 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-white dark:bg-zinc-800 border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <Building2 className="size-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-lg tracking-tight leading-none uppercase">
                            {org.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground mt-1.5 uppercase opacity-60">
                            <MapPin className="size-3" /> {org.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {org.outGroups.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase  text-red-500 flex items-center gap-1.5">
                            <XCircle className="size-3" /> Empty Stock
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {org.outGroups.map((group) => (
                              <Badge
                                key={group}
                                variant="destructive"
                                className="rounded-lg h-7 px-2.5 font-black text-[11px] bg-red-500 text-white border-none shadow-lg shadow-red-500/20"
                              >
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {org.lowGroups.length > 0 && (
                        <div className="space-y-2 border-l border-border/40 pl-4">
                          <p className="text-[9px] font-black uppercase  text-amber-500 flex items-center gap-1.5">
                            <AlertTriangle className="size-3" /> Low Stock
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {org.lowGroups.map((group) => (
                              <Badge
                                key={group}
                                variant="outline"
                                className="rounded-lg h-7 px-2.5 font-black text-[11px] border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              >
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
