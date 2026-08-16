"use client";

import UploadEventModal from "@/components/modules/Admin/Event/UploadEventModal";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";
import {
  useDeleteEventMutation,
  useGetManagedEventsQuery,
} from "@/redux/features/events/eventsApi";
import { CalendarDays, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function OrganizationEventsPage() {
  const { organizationId } = useOrganizationDashboardContext();
  const { data, isLoading } = useGetManagedEventsQuery(
    { organizationId, limit: 100, sortBy: "createdAt", sortOrder: "desc" },
    { skip: !organizationId },
  );
  const [deleteEvent] = useDeleteEventMutation();

  const remove = async (id: string) => {
    try {
      await deleteEvent(id).unwrap();
      toast.success("Event removed");
    } catch {
      toast.error("Unable to remove event");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DashboardHeader
          variant="clinical"
          title="Organization Events"
          subtitle="Plan local activities and submit them for Admin review."
          badge="Community"
        />
        <UploadEventModal organizationId={organizationId || undefined} />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading events…</p>
      ) : !data?.data.length ? (
        <div className="rounded-3xl border border-dashed p-12 text-center text-muted-foreground">
          <CalendarDays className="mx-auto mb-3 size-10" /> No events yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.data.map((event) => (
            <article key={event.id} className="space-y-4 rounded-3xl border bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-black leading-tight">{event.title}</h2>
                <Badge variant="outline">{event.approvalStatus ?? "PENDING"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(event.eventDate).toLocaleDateString()} · {event.eventType.replaceAll("_", " ")}
              </p>
              <div className="flex gap-2">
                <UploadEventModal
                  event={event}
                  organizationId={organizationId}
                  trigger={<Button size="sm" variant="outline"><Edit3 className="mr-2 size-4" /> Edit</Button>}
                />
                <Button size="sm" variant="destructive" onClick={() => void remove(event.id)}>
                  <Trash2 className="mr-2 size-4" /> Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
