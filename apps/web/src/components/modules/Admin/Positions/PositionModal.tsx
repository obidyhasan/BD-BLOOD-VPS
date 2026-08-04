"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { Grid2X2Check, Plus, Loader2 } from "lucide-react";
import {
  useCreatePositionMutation,
  useUpdatePositionMutation,
} from "@/redux/features/organizations/organizationsApi";
import {
  mapUIToCreatePositionPayload,
  mapUIToUpdatePositionPayload,
  type SystemPositionUI,
} from "@/lib/position";

const positionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  level: z.string().min(1, "Level is required"),
  status: z.string().min(1, "Status is required"),
});

type PositionModalProps = {
  position?: SystemPositionUI;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

const PositionModal = ({ position, trigger, onSuccess }: PositionModalProps) => {
  const [open, setOpen] = useState(false);
  const [createPosition, { isLoading: creating }] = useCreatePositionMutation();
  const [updatePosition, { isLoading: updating }] = useUpdatePositionMutation();
  const loading = creating || updating;

  const form = useForm<z.infer<typeof positionSchema>>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: position?.name || "",
      level: position?.level || "Support",
      status: position?.status || "General",
    },
  });

  useEffect(() => {
    if (open && position) {
      form.reset({
        name: position.name,
        level: position.level,
        status: position.status,
      });
    }
  }, [open, position, form]);

  const onSubmit = async (data: z.infer<typeof positionSchema>) => {
    try {
      const payload = mapUIToCreatePositionPayload({
        name: data.name,
        level: data.level as SystemPositionUI["level"],
        status: data.status as SystemPositionUI["status"],
      });
      if (position) {
        await updatePosition({
          id: position.id,
          data: mapUIToUpdatePositionPayload({
            name: data.name,
            level: data.level as SystemPositionUI["level"],
            status: data.status as SystemPositionUI["status"],
          }),
        }).unwrap();
        toast.success("Role updated");
      } else {
        await createPosition(payload).unwrap();
        toast.success("New role created");
      }
      onSuccess?.();
      setOpen(false);
      form.reset();
    } catch {
      toast.error("Failed to save role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-14 px-8 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all shrink-0">
            {position ? "Modify" : <>New Role <Plus className="ml-2 size-4 text-emerald-500" /></>}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-md overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4 mb-8">
          <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
            <Grid2X2Check className="size-8" />
          </div>
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase ">
              {position ? "Update Role" : "Create Role"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60  mt-1">
              {position ? `Configuring hierarchy for: ${position.name}` : "Add a new leadership position for the organization."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">Role Name</FormLabel>
                  <FormControl>
                    <Input className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold" placeholder="E.g., Senior Coordinator" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">Clearance Tier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/40 p-2">
                        {["Executive", "Management", "Support"].map((lvl) => (
                          <SelectItem key={lvl} value={lvl} className="rounded-xl font-bold text-xs uppercase  my-1">{lvl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">Functional Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/40 p-2">
                        {["Main Role", "Assistant", "General"].map((st) => (
                          <SelectItem key={st} value={st} className="rounded-xl font-bold text-xs uppercase  my-1">{st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border/10">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-14 rounded-2xl font-black text-xs uppercase  border-border/40">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading} className="h-14 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Saving...
                  </span>
                ) : position ? "Update Position" : "Create Position"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PositionModal;
