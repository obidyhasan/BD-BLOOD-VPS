"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type ActionConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  loading?: boolean;
  actionText?: string;
  icon?: React.ReactNode;
  variant?: "danger" | "warning" | "success" | "primary";
};

export const ActionConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading = false,
  actionText = "Confirm",
  icon,
  variant = "warning",
}: ActionConfirmDialogProps) => {
  const getColors = () => {
    switch (variant) {
      case "danger":
        return {
          bg: "bg-red-500/5",
          iconBg: "bg-red-500/10",
          iconText: "text-red-500",
          btn: "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white",
        };
      case "warning":
        return {
          bg: "bg-amber-500/5",
          iconBg: "bg-amber-500/10",
          iconText: "text-amber-500",
          btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white",
        };
      case "success":
        return {
          bg: "bg-emerald-500/5",
          iconBg: "bg-emerald-500/10",
          iconText: "text-emerald-500",
          btn: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white",
        };
      case "primary":
      default:
        return {
          bg: "bg-primary/5",
          iconBg: "bg-primary/10",
          iconText: "text-primary",
          btn: "bg-primary hover:bg-primary/90 shadow-primary/20 text-primary-foreground",
        };
    }
  };

  const colors = getColors();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-md overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 ${colors.bg}`} />
        <DialogHeader className="space-y-4 mb-6">
          <div className={`size-16 rounded-3xl flex items-center justify-center ${colors.iconBg} ${colors.iconText}`}>
            {icon || <AlertTriangle className="size-8" />}
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-black text-foreground tracking-tighter uppercase leading-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
              {description ?? "Are you sure you want to do this?"}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-4 relative z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-12 rounded-2xl font-black text-xs uppercase  border-border/40 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-12 rounded-2xl font-black text-xs uppercase  shadow-xl border-none transition-all ${colors.btn}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">

                {actionText}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
