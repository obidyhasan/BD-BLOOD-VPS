"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useUpdateInventoryItemMutation,
  useUpsertInventoryMutation,
} from "@/redux/features/inventory/inventoryApi";

interface UpdateInventoryModalProps {
  organizationId: string;
  bloodGroupId: string;
  inventoryItemId?: string;
  group: string;
  currentUnits: number;
  trigger?: React.ReactNode;
}

export function UpdateInventoryModal({
  organizationId,
  bloodGroupId,
  inventoryItemId,
  group,
  currentUnits,
  trigger,
}: UpdateInventoryModalProps) {
  const [units, setUnits] = useState(currentUnits);
  const [prevCurrentUnits, setPrevCurrentUnits] = useState(currentUnits);
  const [updateItem, { isLoading: updating }] = useUpdateInventoryItemMutation();
  const [upsertItem, { isLoading: upserting }] = useUpsertInventoryMutation();
  const isLoading = updating || upserting;

  // Keep `units` in sync with `currentUnits` when the prop changes (e.g. the
  // modal is reused for a different blood group) without doing it in an
  // effect, per the React "adjusting state during render" pattern.
  if (currentUnits !== prevCurrentUnits) {
    setPrevCurrentUnits(currentUnits);
    setUnits(currentUnits);
  }

  const handleUpdate = async () => {
    try {
      if (inventoryItemId) {
        await updateItem({ id: inventoryItemId, availableUnits: units }).unwrap();
      } else {
        await upsertItem({
          organizationId,
          bloodGroupId,
          availableUnits: units,
        }).unwrap();
      }
      toast.success(`Updated ${group} stock to ${units} units`, {
        description: "Inventory records have been updated successfully.",
      });
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to update inventory.";
      toast.error(message);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="rounded-xl px-6 font-black text-[10px] uppercase  shadow-xl shadow-primary/20">
            Edit Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[3rem] border-border/40 p-6 max-w-md shadow-2xl">
        <DialogHeader className="gap-2 text-center items-center">
          <div className="size-20 rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center mb-4">
            <Droplets className="size-10" />
          </div>
          <DialogTitle className="text-4xl font-black uppercase tracking-tight">
            Update <span className="text-primary">{group}</span>
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-muted-foreground text-center">
            Adjust the current number of available blood units for this group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-6 border-y border-border/20">
          <div className="space-y-3 px-1">
            <Label htmlFor="units" className="text-[10px] font-black uppercase text-muted-foreground  ml-1">
              Current Units Count
            </Label>
            <div className="relative">
              <Input
                id="units"
                type="number"
                min={0}
                value={units}
                onChange={(e) => setUnits(Math.max(0, Number(e.target.value)))}
                className="h-20 rounded-2xl border-border/40 bg-zinc-50 dark:bg-zinc-950 focus:ring-primary/20 transition-all font-black text-4xl tracking-tighter pl-8 pr-20"
              />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-muted-foreground opacity-40">
                Units
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-4">
          <DialogClose asChild>
            <Button variant="outline" className="h-12 rounded-2xl font-black text-xs uppercase  border-border/40">
              Go Back
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={handleUpdate}
              disabled={isLoading}
              className="h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase  shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Save Changes
                  <CheckCircle2 className="size-4" />
                </>
              )}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
