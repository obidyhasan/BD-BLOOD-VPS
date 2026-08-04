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
import { UserCog, ShieldCheck, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllPositionsQuery,
  useUpdateMemberStatusMutation,
} from "@/redux/features/organizations/organizationsApi";
import type { OrgMemberUIModel } from "@/lib/member";
import { mapOrganizationPositionToUI } from "@/lib/position";

type EditMemberModalProps = {
  member: OrgMemberUIModel;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

const EditMemberModal = ({
  member,
  trigger,
  onSuccess,
}: EditMemberModalProps) => {
  const [open, setOpen] = useState(false);
  const [updateMemberStatus, { isLoading }] = useUpdateMemberStatusMutation();
  const { data: positionsData } = useGetAllPositionsQuery(undefined, {
    skip: !open,
  });
  const positions = (positionsData?.data ?? []).map(
    mapOrganizationPositionToUI,
  );

  const [formData, setFormData] = useState({
    position: member.position,
    status: member.status,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFormData({
        position: member.position,
        status: member.status,
      });
    }
    setOpen(nextOpen);
  };

  const handleUpdate = async () => {
    try {
      const apiStatus = formData.status === "active" ? "ACTIVE" : "PENDING";
      await updateMemberStatus({
        memberId: member.id,
        status: apiStatus,
      }).unwrap();
      toast.success("Member details updated successfully");
      onSuccess?.();
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message)
          : "Failed to update member";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="icon"
            variant="outline"
            className="size-8 rounded-xl border-border/40 hover:border-primary/20 hover:text-primary"
          >
            <Edit className="size-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-md overflow-hidden">
        <DialogHeader className="space-y-4 mb-8">
          <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="size-8" />
          </div>
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase ">
              Edit Member
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60  mt-1">
              Update role parameters for <strong>{member.name}</strong>.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 relative z-10">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-muted-foreground  px-1 flex items-center gap-2">
              <UserCog className="size-3" /> Position
            </Label>
            <Select
              value={formData.position}
              onValueChange={(val) =>
                setFormData((p) => ({ ...p, position: val }))
              }
            >
              <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40 p-2">
                {positions.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.name}
                    className="rounded-xl font-bold text-xs uppercase my-1"
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-muted-foreground  px-1">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(val) =>
                setFormData((p) => ({
                  ...p,
                  status: val as "active" | "inactive",
                }))
              }
            >
              <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40 p-2">
                <SelectItem
                  value="active"
                  className="rounded-xl font-bold text-xs uppercase my-1"
                >
                  Active
                </SelectItem>
                <SelectItem
                  value="inactive"
                  className="rounded-xl font-bold text-xs uppercase my-1"
                >
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="h-14 rounded-2xl font-black text-xs uppercase  border-border/40 flex-1"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleUpdate}
              disabled={isLoading}
              className="h-14 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 text-white flex-1"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberModal;
