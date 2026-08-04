"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
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
import { Edit, Droplets, Phone, MapPin } from "lucide-react";
import { bloodGroup } from "@/constant/BloodGroup";
import {
  useAdminUpdateDonorMutation,
  type Donor,
} from "@/redux/features/donors/donorsApi";

const editDonorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  phone: z.string().min(11, "Phone must be at least 11 digits"),
  district: z.string().min(2, "District is required"),
  available: z.string(),
});

type EditDonorModalProps = {
  donor: Donor;
  trigger?: React.ReactNode;
  onSuccess?: (updated: Donor) => void;
};

const EditDonorModal = ({ donor, trigger, onSuccess }: EditDonorModalProps) => {
  const [open, setOpen] = useState(false);
  const [adminUpdateDonor, { isLoading: loading }] = useAdminUpdateDonorMutation();

  const form = useForm<z.infer<typeof editDonorSchema>>({
    resolver: zodResolver(editDonorSchema),
    defaultValues: {
      name: donor.fullName,
      bloodGroup: donor.bloodGroup?.groupName ?? "",
      phone: donor.phone ?? "",
      district: donor.district?.name ?? "",
      available: donor.availabilityStatus === "AVAILABLE" ? "true" : "false",
    },
  });

  useEffect(() => {
    form.reset({
      name: donor.fullName,
      bloodGroup: donor.bloodGroup?.groupName ?? "",
      phone: donor.phone ?? "",
      district: donor.district?.name ?? "",
      available: donor.availabilityStatus === "AVAILABLE" ? "true" : "false",
    });
  }, [donor, form]);

  const onSubmit = async (data: z.infer<typeof editDonorSchema>) => {
    try {
      const result = await adminUpdateDonor({
        id: donor.id,
        data: {
          fullName: data.name,
          phone: data.phone,
          availabilityStatus: data.available === "true" ? "AVAILABLE" : "UNAVAILABLE",
        },
      }).unwrap();
      toast.success("Donor profile updated successfully");
      onSuccess?.(result.data);
      setOpen(false);
    } catch {
      toast.error("Failed to update donor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="icon" variant="outline" className="size-9 rounded-xl border-border/40">
            <Edit className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4 mb-8">
          <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-2">
            <Edit className="size-8" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase leading-tight ">
              Edit Donor
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60  leading-relaxed">
              Update the clinical profile for <strong>{donor.fullName}</strong>. Changes are saved immediately.
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">Full Name</FormLabel>
                    <FormControl>
                      <Input className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/40 p-2">
                        {bloodGroup.map((g) => (
                          <SelectItem key={g} value={g} className="rounded-xl font-bold text-xs uppercase  my-1">
                            <div className="flex items-center gap-2">
                              <Droplets className="size-3 text-red-500 fill-red-500" />{g}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">Phone</FormLabel>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                    <FormControl>
                      <Input className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">District</FormLabel>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                      <FormControl>
                        <Input className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">Availability</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/40 p-2">
                        <SelectItem value="true" className="rounded-xl font-bold text-xs uppercase  my-1">Available</SelectItem>
                        <SelectItem value="false" className="rounded-xl font-bold text-xs uppercase  my-1">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border/10">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-14 rounded-2xl font-black text-xs uppercase  border-border/40">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={loading}
                className="h-14 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDonorModal;
