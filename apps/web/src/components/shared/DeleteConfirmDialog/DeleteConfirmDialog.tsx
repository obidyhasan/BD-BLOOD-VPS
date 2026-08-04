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
import { Trash2, AlertTriangle } from "lucide-react";

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  loading?: boolean;
};

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading = false,
}: DeleteConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-md overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4 mb-6">
          <div className="size-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertTriangle className="size-8" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-black text-foreground tracking-tighter uppercase leading-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
              {description ?? "This cannot be undone. It will be permanently deleted."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-4 mt-4 relative z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-14 rounded-2xl font-black text-xs uppercase  border-border/40 hover:bg-zinc-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-14 rounded-2xl font-black text-xs uppercase  bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 border-none transition-all text-white"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="size-4" />
                Delete
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
