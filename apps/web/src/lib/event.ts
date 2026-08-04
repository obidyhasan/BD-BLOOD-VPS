import type { Event as ApiEvent } from "@/redux/features/events/eventsApi";

/** Shape used by legacy event UI components. */
export type EventCardModel = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  slots: string;
  image: string;
  joined: string;
  org: string;
};

const eventTypeLabel: Record<ApiEvent["eventType"], string> = {
  DONATION_CAMP: "Donation Camp",
  WORKSHOP: "Workshop",
  AWARENESS: "Awareness",
  SOCIAL_ACTIVITY: "Social Activity",
  BLOOD_CAMP: "Blood Camp",
};

export function mapApiEvent(event: ApiEvent): EventCardModel {
  const locationParts = [
    event.locationDetails,
    event.upazila?.name,
    event.district?.name,
  ].filter(Boolean);

  return {
    id: event.id,
    slug: event.id,
    title: event.title,
    description: event.description ?? "",
    date: event.eventDate,
    time: event.eventTime ?? "",
    location: locationParts.join(", ") || "Bangladesh",
    type: eventTypeLabel[event.eventType] ?? event.eventType,
    slots: event.slots ?? `${event._count?.participants ?? 0} participants`,
    image: "",
    joined: `${event._count?.participants ?? 0} joined`,
    org: event.organization?.name ?? "",
  };
}
