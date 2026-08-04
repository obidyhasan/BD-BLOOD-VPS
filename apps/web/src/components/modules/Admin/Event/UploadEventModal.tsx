"use client";

import { useEffect, useState } from "react";
import { extractErrorMessage } from "@/lib/apiError";
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
import { Calendar, Plus, Loader2, MapPin, Clock, Users } from "lucide-react";
import {
  useCreateEventMutation,
  useUpdateEventMutation,
  type Event,
} from "@/redux/features/events/eventsApi";
import { useGetAllOrganizationsQuery } from "@/redux/features/organizations/organizationsApi";
import {
  useGetDistrictsQuery,
  useGetDivisionsQuery,
  useGetUpazilasQuery,
} from "@/redux/features/location/locationApi";

const eventSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  eventType: z.enum([
    "DONATION_CAMP",
    "WORKSHOP",
    "AWARENESS",
    "SOCIAL_ACTIVITY",
    "BLOOD_CAMP",
  ]),
  eventDate: z.string().min(1, "Date is required"),
  eventTime: z.string().optional(),
  slots: z.string().optional(),
  locationDetails: z.string().optional(),
  organizationId: z.string().min(1, "Organization ID is required"),
  divisionId: z.string().min(1, "Division is required"),
  districtId: z.string().min(1, "District is required"),
  upazilaId: z.string().min(1, "Upazila is required"),
});

const eventTypeLabels: Record<string, string> = {
  DONATION_CAMP: "Donation Camp",
  WORKSHOP: "Workshop",
  AWARENESS: "Awareness",
  SOCIAL_ACTIVITY: "Social Activity",
  BLOOD_CAMP: "Blood Camp",
};

interface UploadEventModalProps {
  event?: Event;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const UploadEventModal = ({
  event,
  trigger,
  onSuccess,
}: UploadEventModalProps) => {
  const [open, setOpen] = useState(false);

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const { data: organizationsData, isLoading: organizationsLoading } =
    useGetAllOrganizationsQuery({
      limit: 200,
      verificationStatus: "VERIFIED",
      organizationStatus: "ACTIVE",
    });
  const { data: divisionsData, isLoading: divisionsLoading } =
    useGetDivisionsQuery();
  const isLoading = isCreating || isUpdating;

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "DONATION_CAMP",
      eventDate: "",
      eventTime: "",
      slots: "",
      locationDetails: "",
      organizationId: "",
      divisionId: "",
      districtId: "",
      upazilaId: "",
    },
  });

  const divisionId = form.watch("divisionId");
  const districtId = form.watch("districtId");

  const { data: districtsData, isLoading: districtsLoading } =
    useGetDistrictsQuery(divisionId ? { divisionId } : undefined, {
      skip: !divisionId,
    });
  const { data: upazilasData, isLoading: upazilasLoading } =
    useGetUpazilasQuery(districtId ? { districtId } : undefined, {
      skip: !districtId,
    });

  const organizations = organizationsData?.data ?? [];
  const divisions = divisionsData?.data ?? [];
  const districts = districtsData?.data ?? [];
  const upazilas = upazilasData?.data ?? [];

  useEffect(() => {
    if (open && event) {
      form.reset({
        title: event.title,
        description: event.description ?? "",
        eventType: event.eventType,
        eventDate: event.eventDate?.slice(0, 10) ?? "",
        eventTime: event.eventTime ?? "",
        slots: event.slots ?? "",
        locationDetails: event.locationDetails ?? "",
        organizationId: event.organizationId,
        divisionId: event.divisionId,
        districtId: event.districtId,
        upazilaId: event.upazilaId,
      });
    } else if (open && !event) {
      form.reset({
        title: "",
        description: "",
        eventType: "DONATION_CAMP",
        eventDate: "",
        eventTime: "",
        slots: "",
        locationDetails: "",
        organizationId: "",
        divisionId: "",
        districtId: "",
        upazilaId: "",
      });
    }
  }, [open, event, form]);

  const onSubmit = async (data: z.infer<typeof eventSchema>) => {
    try {
      if (event) {
        await updateEvent({ id: event.id, data }).unwrap();
        toast.success("Event updated successfully");
      } else {
        // zod v4 schema output type differs from API mutation input type (optional vs nullable fields)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createEvent(data as any).unwrap();
        toast.success("New event created successfully");
      }
      setOpen(false);
      onSuccess?.();
      form.reset();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Failed to process event");
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-14 px-8 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all">
            Create Event <Plus className="ml-2 size-4 text-emerald-500" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4 mb-8">
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
              {event ? "Edit Event" : "Create Event"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60 mt-1">
              {event
                ? "Update the details of this event."
                : "Plan a new community event."}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Mission Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                      placeholder="E.g., Community Blood Drive 2026"
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
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Mission Type
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {Object.entries(eventTypeLabels).map(([val, label]) => (
                          <SelectItem
                            key={val}
                            value={val}
                            className="rounded-xl font-bold text-xs uppercase my-1"
                          >
                            {label}
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
                name="eventDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Event Date
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                        <Input
                          type="date"
                          className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="eventTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Event Time
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                        <Input
                          className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                          placeholder="10:00 AM - 04:00 PM"
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
                name="slots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Expected Capacity
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                        <Input
                          className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                          placeholder="150+ Expected"
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
              name="locationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Location
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                      <Input
                        className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                        placeholder="Khulna Medical College"
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
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Organization
                    </FormLabel>
                    <Select
                      value={field.value}
                      disabled={organizationsLoading}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const organization = organizations.find(
                          (item) => item.id === value,
                        );
                        if (organization) {
                          form.setValue("divisionId", organization.divisionId);
                          form.setValue("districtId", organization.districtId);
                          form.setValue("upazilaId", organization.upazilaId);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {organizations.map((organization) => (
                          <SelectItem
                            key={organization.id}
                            value={organization.id}
                            className="rounded-xl font-bold text-xs uppercase my-1"
                          >
                            {organization.name}
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
                name="divisionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Division
                    </FormLabel>
                    <Select
                      value={field.value}
                      disabled={divisionsLoading}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("districtId", "");
                        form.setValue("upazilaId", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {divisions.map((division) => (
                          <SelectItem
                            key={division.id}
                            value={division.id}
                            className="rounded-xl font-bold text-xs uppercase my-1"
                          >
                            {division.name}
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
                name="districtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      District
                    </FormLabel>
                    <Select
                      value={field.value}
                      disabled={!divisionId || districtsLoading}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("upazilaId", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {districts.map((district) => (
                          <SelectItem
                            key={district.id}
                            value={district.id}
                            className="rounded-xl font-bold text-xs uppercase my-1"
                          >
                            {district.name}
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
                name="upazilaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Upazila
                    </FormLabel>
                    <Select
                      value={field.value}
                      disabled={!districtId || upazilasLoading}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select upazila" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {upazilas.map((upazila) => (
                          <SelectItem
                            key={upazila.id}
                            value={upazila.id}
                            className="rounded-xl font-bold text-xs uppercase my-1"
                          >
                            {upazila.name}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Mission Briefing
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="rounded-2xl bg-zinc-50 border-border/40 font-bold min-h-[120px]"
                      placeholder="Enter details about the event..."
                      {...field}
                    />
                  </FormControl>
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
                disabled={isLoading}
                className="h-12 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Processing...
                  </span>
                ) : event ? (
                  "Update Event"
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

export default UploadEventModal;
