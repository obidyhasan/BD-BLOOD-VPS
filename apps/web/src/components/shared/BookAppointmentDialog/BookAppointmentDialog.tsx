"use client";

import { useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAppointmentMutation } from "@/redux/features/appointments/appointmentsApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetBloodGroupsQuery } from "@/redux/features/blood/bloodApi";
import { extractErrorMessage } from "@/lib/apiError";
import { toast } from "sonner";
import Link from "next/link";

interface BookAppointmentDialogProps {
  organizationId: string;
  organizationName?: string;
  eventId?: string;
  eventTitle?: string;
  triggerLabel?: string;
  triggerClassName?: string;
}

export default function BookAppointmentDialog({
  organizationId,
  organizationName,
  eventId,
  eventTitle,
  triggerLabel = "Book Donation",
  triggerClassName,
}: BookAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [bloodGroupId, setBloodGroupId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: meData } = useGetMeQuery(undefined, { skip: !open });
  const { data: bloodGroupsData } = useGetBloodGroupsQuery(undefined, {
    skip: !open,
  });
  const [createAppointment, { isLoading }] = useCreateAppointmentMutation();

  const user = meData?.data;
  const bloodGroups = bloodGroupsData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in as a donor to book an appointment.");
      return;
    }

    if (!scheduledAt) {
      toast.error("Please select a date and time.");
      return;
    }

    try {
      await createAppointment({
        organizationId,
        eventId,
        bloodGroupId: bloodGroupId || user.bloodGroupId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes: notes.trim() || undefined,
      }).unwrap();

      toast.success("Appointment booked successfully!");
      setOpen(false);
      setScheduledAt("");
      setNotes("");
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to book appointment"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName}>
          <CalendarDays className="size-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2rem] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-tighter">
            Book Donation Appointment
          </DialogTitle>
          <DialogDescription>
            Schedule a visit with {organizationName ?? "this organization"}
            {eventTitle ? ` for ${eventTitle}` : ""}.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Sign in as a donor to book an appointment.
            </p>
            <Button asChild className="rounded-xl w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Date &amp; Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Select
                value={bloodGroupId || user.bloodGroupId || ""}
                onValueChange={setBloodGroupId}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((bg) => (
                    <SelectItem key={bg.id} value={bg.id}>
                      {bg.groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
                className="rounded-xl min-h-[80px]"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-black uppercase text-xs "
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Confirm Booking
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
