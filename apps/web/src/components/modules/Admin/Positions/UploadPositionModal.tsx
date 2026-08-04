"use client";

import { useEffect, useState } from "react";
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
import {
  ShieldCheck,
  Plus,
  Loader2,
  Briefcase,
  Users2,
  Activity,
} from "lucide-react";
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
  name: z.string().min(3, "Position name is required"),
  members: z.coerce.number().min(0, "Member count must be positive"),
  level: z.enum(["Executive", "Management", "Support"]),
  status: z.enum(["Main Role", "Assistant", "Active", "General"]),
});

interface UploadPositionModalProps {
  position?: SystemPositionUI;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const UploadPositionModal = ({
  position,
  trigger,
  onSuccess,
}: UploadPositionModalProps) => {
  const [open, setOpen] = useState(false);
  const [createPosition, { isLoading: creating }] = useCreatePositionMutation();
  const [updatePosition, { isLoading: updating }] = useUpdatePositionMutation();
  const loading = creating || updating;

  const form = useForm<z.infer<typeof positionSchema>>({
    // zod v4 + hookform resolver compatibility requires cast until @hookform/resolvers supports zod v4
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(positionSchema as any),
    defaultValues: {
      name: "",
      members: 0,
      level: "Support",
      status: "General",
    },
  });

  useEffect(() => {
    if (position) {
      form.reset({
        name: position.name,
        members: position.members,
        level: position.level,
        status: position.status,
      });
    } else {
      form.reset({
        name: "",
        members: 0,
        level: "Support",
        status: "General",
      });
    }
  }, [position, form, open]);

  const onSubmit = async (data: z.infer<typeof positionSchema>) => {
    try {
      const payload = mapUIToCreatePositionPayload({
        name: data.name,
        level: data.level,
        status: data.status,
      });
      if (position) {
        await updatePosition({
          id: position.id,
          data: mapUIToUpdatePositionPayload({
            name: data.name,
            level: data.level,
            status: data.status,
          }),
        }).unwrap();
        toast.success("Position updated");
      } else {
        await createPosition(payload).unwrap();
        toast.success("New position created");
      }
      setOpen(false);
      onSuccess?.();
      form.reset();
    } catch {
      toast.error("Operation failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-12 px-6 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all">
            Create Position <Plus className="ml-2 size-4 text-primary" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-8 sm:max-w-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4 mb-8">
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
              {position ? "Refine Position" : "New Position"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60 mt-1">
              {position
                ? "Update the details of this position."
                : "Define a new official position for the organization structure."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 relative z-10"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Role Title
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                      <Input
                        className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                        placeholder="E.g., Chief Coordinator"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Hierarchy Level
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem
                          value="Executive"
                          className="font-bold text-primary"
                        >
                          Executive Tier
                        </SelectItem>
                        <SelectItem
                          value="Management"
                          className="font-bold text-amber-500"
                        >
                          Management
                        </SelectItem>
                        <SelectItem value="Support" className="font-bold">
                          Support Staff
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="members"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Member Capacity
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Users2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                        <Input
                          type="number"
                          className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                          placeholder="0"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Role Classification
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                        <SelectValue placeholder="Classification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem
                        value="Main Role"
                        className="font-bold text-primary"
                      >
                        Main Protocol Role
                      </SelectItem>
                      <SelectItem value="Assistant" className="font-bold">
                        Assistant / Deputy
                      </SelectItem>
                      <SelectItem value="Active" className="font-bold">
                        Active Member
                      </SelectItem>
                      <SelectItem value="General" className="font-bold">
                        General Position
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="grid grid-cols-2 gap-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl font-black text-xs uppercase  border-border/40"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Processing...
                  </span>
                ) : position ? (
                  "Edit Position"
                ) : (
                  "Create Position"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadPositionModal;
