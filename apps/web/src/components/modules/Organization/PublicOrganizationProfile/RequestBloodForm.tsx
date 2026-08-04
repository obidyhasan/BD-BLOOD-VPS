"use client";

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
import { DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, MapPin, Activity, Phone, Loader2 } from "lucide-react";
import { useGetBloodGroupsQuery } from "@/redux/features/blood/bloodApi";
import { useCreateBloodRequestMutation } from "@/redux/features/bloodRequests/bloodRequestsApi";
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetUpazilasQuery,
} from "@/redux/features/location/locationApi";

const requestSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  phone: z.string().min(11, "Valid phone number is required"),
  bloodGroupId: z.string().min(1, "Blood group is required"),
  hospital: z.string().min(2, "Hospital name is required"),
  quantity: z.string().min(1, "Quantity is required"),
  divisionId: z.string().min(1, "Division is required"),
  districtId: z.string().min(1, "District is required"),
  upazilaId: z.string().min(1, "Upazila is required"),
  problem: z.string().min(5, "Brief problem description is required"),
  type: z.enum(["URGENT", "GENERAL"]),
});

type RequestBloodFormProps = {
  organizationId?: string;
  defaultDivisionId?: string;
  defaultDistrictId?: string;
  defaultUpazilaId?: string;
};

const RequestBloodForm = ({
  organizationId,
  defaultDivisionId = "",
  defaultDistrictId = "",
  defaultUpazilaId = "",
}: RequestBloodFormProps) => {
  const { data: bloodGroupsData, isLoading: bloodGroupsLoading } =
    useGetBloodGroupsQuery();
  const [createBloodRequest, { isLoading: submitting }] =
    useCreateBloodRequestMutation();

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      patientName: "",
      phone: "",
      bloodGroupId: "",
      hospital: "",
      quantity: "1",
      divisionId: defaultDivisionId,
      districtId: defaultDistrictId,
      upazilaId: defaultUpazilaId,
      problem: "",
      type: "GENERAL",
    },
  });

  const divisionId = form.watch("divisionId");
  const districtId = form.watch("districtId");

  const { data: divisionsData } = useGetDivisionsQuery();
  const { data: districtsData } = useGetDistrictsQuery(
    divisionId ? { divisionId } : undefined,
    { skip: !divisionId },
  );
  const { data: upazilasData } = useGetUpazilasQuery(
    districtId ? { districtId } : undefined,
    { skip: !districtId },
  );

  const onSubmit = async (data: z.infer<typeof requestSchema>) => {
    try {
      const result = await createBloodRequest({
        requesterName: data.patientName,
        requesterPhone: data.phone,
        bloodGroupId: data.bloodGroupId,
        hospitalName: data.hospital,
        divisionId: data.divisionId,
        districtId: data.districtId,
        upazilaId: data.upazilaId,
        requiredUnits: parseInt(data.quantity, 10) || 1,
        requestType: data.type,
        message: data.problem,
      }).unwrap();
      toast.success(
        `Request submitted. Reference: ${result.data.referenceCode}`,
      );
      form.reset({
        patientName: "",
        phone: "",
        bloodGroupId: "",
        hospital: "",
        quantity: "1",
        divisionId: defaultDivisionId,
        districtId: defaultDistrictId,
        upazilaId: defaultUpazilaId,
        problem: "",
        type: "GENERAL",
      });
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to submit request.";
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="patientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground  px-1">Patient Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Patient Full Name"
                    className="h-14 rounded-2xl bg-zinc-50 border-border/40 focus:ring-red-500/20 font-bold"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground  px-1">Contact Number</FormLabel>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                  <FormControl>
                    <Input
                      placeholder="01XXX-XXXXXX"
                      className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 focus:ring-red-500/20 font-bold"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="bloodGroupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground  px-1">Blood Group</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={bloodGroupsLoading}
                >
                  <FormControl>
                    <SelectTrigger className="w-full py-7 rounded-2xl bg-zinc-50 border-border/40 focus:ring-red-500/20 font-bold">
                      <SelectValue placeholder={bloodGroupsLoading ? "Loading…" : "Select Group"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-border/40 p-2">
                    {(bloodGroupsData?.data ?? []).map((group) => (
                      <SelectItem key={group.id} value={group.id} className="">
                        {group.groupName}
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
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground  px-1">Units (Bags)</FormLabel>
                <div className="relative">
                  <Activity className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 focus:ring-red-500/20 font-bold"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground  px-1">Urgency Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={`w-full py-7 rounded-2xl bg-zinc-50 border-border/40 focus:ring-red-500/20 font-bold ${field.value === "URGENT" ? "text-red-500" : ""}`}>
                      <SelectValue placeholder="Select Urgency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-border/40 p-2">
                    <SelectItem value="GENERAL" className="font-bold">General Need</SelectItem>
                    <SelectItem value="URGENT" className="font-bold text-red-500">Urgent Emergency</SelectItem>
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
            name="hospital"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground  px-1">Hospital Name</FormLabel>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                  <FormControl>
                    <Input
                      placeholder="Hospital Name"
                      className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 focus:ring-red-500/20 font-bold"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="divisionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground px-1">Division</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue("districtId", "");
                    form.setValue("upazilaId", "");
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                      <SelectValue placeholder="Division" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(divisionsData?.data ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="districtId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground px-1">District</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue("upazilaId", "");
                  }}
                  disabled={!divisionId}
                >
                  <FormControl>
                    <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                      <SelectValue placeholder="District" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(districtsData?.data ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="upazilaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground px-1">Upazila</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={!districtId}>
                  <FormControl>
                    <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                      <SelectValue placeholder="Upazila" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(upazilasData?.data ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
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
          name="problem"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase text-muted-foreground  px-1">Problem / Patient Condition</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. Emergency surgery, Thalassemia, etc."
                  className="min-h-[100px] rounded-2xl bg-zinc-50 border-border/40 focus:ring-red-500/20 font-bold py-4"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border/10">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-14 rounded-2xl font-black text-xs uppercase  border-border/40 hover:bg-zinc-50"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={submitting || bloodGroupsLoading}
            className="h-14 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-primary/90 shadow-xl border-none transition-all hover:scale-[1.02] active:scale-95 text-white"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RequestBloodForm;
