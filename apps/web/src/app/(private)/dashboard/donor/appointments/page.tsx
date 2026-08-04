"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Loader2, XCircle } from "lucide-react";
import {
  useGetMyAppointmentsQuery,
  useCancelAppointmentMutation,
} from "@/redux/features/appointments/appointmentsApi";
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

export default function DonorAppointmentsPage() {
  const { data, isLoading } = useGetMyAppointmentsQuery();
  const [cancelAppointment, { isLoading: cancelling }] =
    useCancelAppointmentMutation();

  const appointments = data?.data ?? [];

  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id).unwrap();
      toast.success("Appointment cancelled");
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to cancel appointment"));
    }
  };

  return (
    <div className="space-y-10">
      <DashboardHeader
        variant="clinical"
        title="Donation Appointments"
        subtitle="Book and manage your scheduled donation visits."
        badge="Appointments"
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      ) : appointments.length === 0 ? (
        <Card className="rounded-[2.5rem] border-dashed p-16 text-center">
          <CalendarDays className="size-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-black uppercase text-muted-foreground">
            No appointments scheduled
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {appointments.map((appt) => (
            <Card key={appt.id} className="rounded-[2.5rem] border-border/40">
              <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <Badge className={statusStyles[appt.status] ?? ""}>
                    {appt.status}
                  </Badge>
                  <h3 className="text-xl font-black uppercase tracking-tighter">
                    {appt.organization?.name ?? "Organization"}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {format(new Date(appt.scheduledAt), "PPP p")} ·{" "}
                    {appt.bloodGroup?.groupName}
                  </p>
                  {appt.event?.title && (
                    <p className="text-xs font-bold text-primary">
                      Event: {appt.event.title}
                    </p>
                  )}
                </div>
                {(appt.status === "PENDING" || appt.status === "CONFIRMED") && (
                  <Button
                    variant="outline"
                    className="rounded-xl text-red-500 border-red-500/20"
                    disabled={cancelling}
                    onClick={() => void handleCancel(appt.id)}
                  >
                    <XCircle className="size-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
