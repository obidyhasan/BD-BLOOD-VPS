"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Droplets } from "lucide-react";
import RequestBloodForm from "./RequestBloodForm";

type RequestBloodDialogProps = {
  organizationId?: string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
};

const RequestBloodDialog = ({
  organizationId,
  divisionId,
  districtId,
  upazilaId,
}: RequestBloodDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto h-14 px-6 rounded-2xl font-black text-xs uppercase  bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          <Droplets className="mr-2 size-5 fill-white" />
          Request Blood
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-6 md:p-8 border-border/40 shadow-premium overflow-hidden bg-white dark:bg-zinc-950">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

        <DialogHeader className="mb-6 relative z-10 space-y-3">
          <div className="size-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <Droplets className="size-6 fill-primary" />
          </div>
          <DialogTitle className="mt-4 text-2xl md:text-3xl font-bold text-foreground tracking-tighter leading-none">
            Request Blood Assistance
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed max-w-xl">
            Submit an urgent blood request to our organization. We will broadcast this requirement across our verified donor network immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 md:-mx-6 max-h-[50vh] overflow-y-auto px-4 md:px-6 relative z-10">
          <RequestBloodForm
            organizationId={organizationId}
            defaultDivisionId={divisionId}
            defaultDistrictId={districtId}
            defaultUpazilaId={upazilaId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestBloodDialog;
