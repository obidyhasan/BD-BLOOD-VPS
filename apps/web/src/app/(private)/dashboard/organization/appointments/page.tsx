"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Loader2, Phone, UserRound } from "lucide-react";
import {
  useGetOrganizationAppointmentsQuery,
  useUpdateAppointmentStatusMutation,
  type DonationAppointment,
} from "@/redux/features/appointments/appointmentsApi";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/apiError";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600",
  CONFIRMED: "bg-emerald-500/10 text-emerald-600",
  COMPLETED: "bg-blue-500/10 text-blue-600",
  CANCELLED: "bg-zinc-500/10 text-zinc-500",
  NO_SHOW: "bg-red-500/10 text-red-500",
};

export default function OrganizationAppointmentsPage() {
  const { organizationId: orgId } = useOrganizationDashboardContext();

  const { data, isLoading } = useGetOrganizationAppointmentsQuery(
    { organizationId: orgId, limit: 50 },
    { skip: !orgId },
  );
  const [updateStatus, { isLoading: updating }] =
    useUpdateAppointmentStatusMutation();

  const appointments = data?.data ?? [];

  const handleStatusChange = async (
    appt: DonationAppointment,
    status: DonationAppointment["status"],
  ) => {
    try {
      await updateStatus({ id: appt.id, status }).unwrap();
      toast.success(`Appointment marked as ${status.toLowerCase()}`);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to update appointment"));
    }
  };

  return (
    <div className="space-y-10">
      <DashboardHeader
        variant="clinical"
        title="Donation Appointments"
        subtitle="Review and manage scheduled donor visits."
        badge="Operations"
      />

      {!orgId ? (
        <Card className="rounded-[2.5rem] border-dashed p-16 text-center">
          <p className="font-black uppercase text-muted-foreground">
            Select an organization to manage appointments
          </p>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      ) : appointments.length === 0 ? (
        <Card className="rounded-[2.5rem] border-dashed p-16 text-center">
          <CalendarDays className="size-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-black uppercase text-muted-foreground">
            No appointments yet
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {appointments.map((appt) => {
            const donor = (
              appt as DonationAppointment & {
                donor?: {
                  fullName?: string;
                  phone?: string;
                  bloodGroup?: { groupName?: string };
                };
              }
            ).donor;

            return (
              <Card key={appt.id} className="rounded-[2.5rem] border-border/40">
                <CardContent className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <Badge className={statusStyles[appt.status] ?? ""}>
                      {appt.status}
                    </Badge>
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                      <UserRound className="size-5 text-primary" />
                      {donor?.fullName ?? "Donor"}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {format(new Date(appt.scheduledAt), "PPP p")} ·{" "}
                      {appt.bloodGroup?.groupName ??
                        donor?.bloodGroup?.groupName}
                    </p>
                    {donor?.phone && (
                      <p className="text-xs font-bold flex items-center gap-2 text-primary">
                        <Phone className="size-3.5" />
                        {donor.phone}
                      </p>
                    )}
                    {appt.event?.title && (
                      <p className="text-xs font-bold text-muted-foreground">
                        Event: {appt.event.title}
                      </p>
                    )}
                  </div>

                  {appt.status === "PENDING" || appt.status === "CONFIRMED" ? (
                    <Select
                      disabled={updating}
                      value={appt.status}
                      onValueChange={(v) =>
                        void handleStatusChange(
                          appt,
                          v as DonationAppointment["status"],
                        )
                      }
                    >
                      <SelectTrigger className="w-full lg:w-48 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="NO_SHOW">No Show</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button variant="outline" disabled className="rounded-xl">
                      Closed
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
