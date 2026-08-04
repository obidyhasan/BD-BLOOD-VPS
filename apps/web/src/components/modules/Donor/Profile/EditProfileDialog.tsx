"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserCog } from "lucide-react";
import EditProfileForm from "./EditProfileForm";

export function EditProfileDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-2xl border-border/40 hover:bg-primary/5 hover:text-primary transition-all shadow-sm group"
        >
          <UserCog className="size-5 group-hover:scale-110 transition-transform" />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-3xl rounded-[3rem] p-0 border-border/40 shadow-premium overflow-hidden bg-white dark:bg-zinc-950"
      >
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

        <div className="p-8 md:p-12 relative z-10">
          <DialogHeader className="mb-10 space-y-4">
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">
                Update <span className="text-primary">Profile</span>
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-muted-foreground leading-relaxed max-w-lg mt-3">
                Ensure your biological biomarkers and contact vectors are
                current to maintain your standing within the elite life-saver
                network.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="no-scrollbar max-h-[60vh] overflow-y-auto pr-2 -mr-2">
            {open ? <EditProfileForm dialogOpen={open} /> : null}
          </div>

          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="absolute top-6 right-6 size-12 rounded-2xl border-border/40 hover:bg-primary/5 hover:text-primary transition-all shadow-sm group"
            >
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
