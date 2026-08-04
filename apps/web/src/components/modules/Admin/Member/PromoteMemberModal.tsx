"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ShieldPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllPositionsQuery,
  useAssignOrganizationMemberMutation,
  useGetMyMembershipQuery,
} from "@/redux/features/organizations/organizationsApi";
import type { Donor } from "@/redux/features/donors/donorsApi";
import { mapOrganizationPositionToUI } from "@/lib/position";

type PromoteMemberModalProps = {
  donor: Donor;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

const PromoteMemberModal = ({ donor, trigger, onSuccess }: PromoteMemberModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [assignMember, { isLoading }] = useAssignOrganizationMemberMutation();
  const { data: positionsData } = useGetAllPositionsQuery(undefined, { skip: !open });
  const { data: membershipData } = useGetMyMembershipQuery(undefined, { skip: !open });

  const positions = (positionsData?.data ?? []).map(mapOrganizationPositionToUI);
  const organizationId = membershipData?.data?.organizationId;

  const handlePromote = async () => {
    if (!selectedPosition) {
      toast.error("Please select a position");
      return;
    }
    if (!organizationId) {
      toast.error("No active organization membership");
      return;
    }

    try {
      const position = positions.find((p) => p.name === selectedPosition);
      await assignMember({
        donorId: donor.id,
        positionId: position?.id ?? selectedPosition,
        organizationId,
      }).unwrap();
      toast.success(`${donor.fullName} is now a verified organization member!`);
      onSuccess?.();
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message)
          : "Failed to promote donor";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="h-10 rounded-xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 font-black text-[9px] uppercase ">
            <ShieldPlus className="mr-2 size-3.5" /> Promote
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-md overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4 mb-8">
          <div className="size-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <UserCheck className="size-8" />
          </div>
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase ">
              Promote Donor
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60  mt-1">
              Elevate <strong>{donor.fullName}</strong> to an official organization member with a defined role.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 relative z-10">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-muted-foreground  px-1">
              Assign Position
            </Label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40 p-2">
                {positions.map((p) => (
                  <SelectItem key={p.id} value={p.name} className="rounded-xl font-bold text-xs uppercase my-1">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <DialogClose asChild>
              <Button variant="outline" className="h-14 rounded-2xl font-black text-xs uppercase  border-border/40 flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handlePromote}
              disabled={isLoading}
              className="h-14 rounded-2xl font-black text-xs uppercase  bg-emerald-500 hover:bg-emerald-600 text-white flex-1"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Confirm Promotion"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromoteMemberModal;
