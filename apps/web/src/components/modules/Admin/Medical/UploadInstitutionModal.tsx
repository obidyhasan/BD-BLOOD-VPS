"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Hospital,
  Plus,
  Loader2,
  MapPin,
  Phone,
  Clock,
  Stethoscope,
} from "lucide-react";
import {
  useCreateInstitutionMutation,
  useUpdateInstitutionMutation,
} from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import type { InstitutionUI } from "@/lib/medical";
import GalleryUpload from "@/components/ui/gallery-upload";
import { useLocationCascade } from "@/hooks/useLocationCascade";

const institutionSchema = z.object({
  name: z.string().min(3, "Name is required"),
  slug: z.string().min(3, "Slug is required"),
  type: z.string().min(1, "Type is required"),
  phone: z.string().min(5, "Phone is required"),
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  upazila: z.string().min(1, "Upazila is required"),
  status: z.string().min(1, "Status is required"),
  doctorsCount: z.number().min(0),
  image: z.string().optional(),
  description: z.string().optional(),
  departments: z.string().optional(),
  emergencyServices: z.string().optional(),
  specialists: z.string().optional(),
});

interface UploadInstitutionModalProps {
  institution?: InstitutionUI;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const UploadInstitutionModal = ({
  institution,
  trigger,
  onSuccess,
}: UploadInstitutionModalProps) => {
  const [open, setOpen] = useState(false);
  const [createInstitution, { isLoading: creating }] =
    useCreateInstitutionMutation();
  const [updateInstitution, { isLoading: updating }] =
    useUpdateInstitutionMutation();
  const loading = creating || updating;

  const form = useForm<z.infer<typeof institutionSchema>>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      name: "",
      slug: "",
      type: "Public Hospital",
      phone: "",
      division: "",
      district: "",
      upazila: "",
      status: "Open 24/7",
      doctorsCount: 0,
      image: "",
      description: "",
      departments: "",
      emergencyServices: "",
      specialists: "",
    },
  });

  const divisionId = form.watch("division");
  const districtId = form.watch("district");
  const { divisions, districts, upazilas } = useLocationCascade(
    divisionId,
    districtId,
  );

  useEffect(() => {
    if (institution) {
      form.reset({
        name: institution.name,
        slug: institution.slug,
        type: institution.type,
        phone: institution.phone,
        division: institution.divisionId || "",
        district: institution.districtId || "",
        upazila: institution.upazilaId || "",
        status: institution.status,
        doctorsCount: institution.doctorsCount,
        image: institution.image || "",
        description: institution.description || "",
        departments: institution.departments?.join(", ") || "",
        emergencyServices: institution.emergencyServices?.join(", ") || "",
        specialists:
          institution.specialists
            ?.map(
              (s) =>
                `${s.name} | ${s.specialist} | ${s.schedule} | ${s.contact}`,
            )
            .join("\n") || "",
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        type: "Public Hospital",
        phone: "",
        division: "",
        district: "",
        upazila: "",
        status: "Open 24/7",
        doctorsCount: 0,
        image: "",
        description: "",
        departments: "",
        emergencyServices: "",
        specialists: "",
      });
    }
  }, [institution, form, open]);

  const initialFiles = useMemo(() => {
    if (institution?.image) {
      return [
        {
          id: institution.id,
          name: institution.name || "Current Image",
          size: 0,
          type: "image/*",
          url: institution.image,
        },
      ];
    }
    return [];
  }, [institution]);

  const onSubmit = async (data: z.infer<typeof institutionSchema>) => {
    try {
      const body = {
        name: data.name,
        phone: data.phone,
        type: data.type,
        openStatus: data.status,
        address: data.description || data.name,
        slug: data.slug,
        divisionId: data.division,
        districtId: data.district,
        upazilaId: data.upazila,
        ...(data.image ? { coverImage: data.image } : {}),
      };

      if (institution) {
        await updateInstitution({ id: institution.id, data: body }).unwrap();
        toast.success("Institution updated successfully");
      } else {
        await createInstitution(body).unwrap();
        toast.success("New institution added");
      }
      setOpen(false);
      onSuccess?.();
      form.reset();
    } catch {
      toast.error("Failed to process institution");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-12 px-6 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all">
            Add Institution <Plus className="ml-2 size-4 text-emerald-500" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4">
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
              {institution ? "Edit Institution" : "Add Institution"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60 mt-1">
              {institution
                ? "Modify the details of this medical facility."
                : "Add a new hospital or clinic."}
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
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Institution Visual
                  </FormLabel>
                  <FormControl>
                    <GalleryUpload
                      maxFiles={1}
                      multiple={false}
                      initialFiles={initialFiles}
                      onFilesChange={(files) => {
                        if (files.length > 0 && files[0].preview) {
                          field.onChange(files[0].preview);
                        } else {
                          field.onChange("");
                        }
                      }}
                      className="max-w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Institution Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                      placeholder="E.g., Dhaka Medical College Hospital"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!institution) {
                          form.setValue("slug", generateSlug(e.target.value));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Facility Type
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {[
                          "Public Hospital",
                          "Government",
                          "Private Clinic",
                          "Medical College",
                          "Diagnostic Center",
                          "Other",
                        ].map((t) => (
                          <SelectItem
                            key={t}
                            value={t}
                            className="rounded-xl font-bold text-xs uppercase my-1"
                          >
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      URL Slug
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                        placeholder="dhaka-medical-college"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="division"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Division
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("district", "");
                        form.setValue("upazila", "");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Division" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {divisions.map((d) => (
                          <SelectItem
                            key={d.id}
                            value={d.id}
                            className="font-bold"
                          >
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      District
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("upazila", "");
                      }}
                      value={field.value}
                      disabled={!divisionId}
                    >
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="District" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {districts.map((d) => (
                          <SelectItem
                            key={d.id}
                            value={d.id}
                            className="font-bold"
                          >
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Emergency Contact
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                        <Input
                          className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                          placeholder="+88017..."
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="upazila"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Upazila
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!districtId}
                    >
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Upazila" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {upazilas.map((u) => (
                          <SelectItem
                            key={u.id}
                            value={u.id}
                            className="font-bold"
                          >
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Availability Status
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                        <Input
                          className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                          placeholder="Open 24/7"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="doctorsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Doctor Count
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                        <Input
                          type="number"
                          className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Brief Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="rounded-2xl bg-zinc-50 border-border/40 font-bold min-h-[100px]"
                      placeholder="Enter a brief summary of the institution's services..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="departments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Departments (Comma separated)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="rounded-2xl bg-zinc-50 border-border/40 font-bold min-h-[100px]"
                        placeholder="Hematology, Cardiology, Neurology..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyServices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Emergency Services (Comma separated)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="rounded-2xl bg-zinc-50 border-border/40 font-bold min-h-[100px]"
                        placeholder="ICU, Ambulance, Blood Bank..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialists"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Specialists List
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="rounded-2xl bg-zinc-50 border-border/40 font-bold min-h-[150px]"
                      placeholder="Dr. John Doe | Hematologist | Mon-Fri 10AM-2PM | +88017..."
                      {...field}
                    />
                  </FormControl>
                  <p className="text-[10px] font-bold text-muted-foreground/60 px-1 ">
                    Format: Name | Role | Schedule | Contact (One per line)
                  </p>
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
                ) : institution ? (
                  "Update Facility"
                ) : (
                  "Submit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadInstitutionModal;
