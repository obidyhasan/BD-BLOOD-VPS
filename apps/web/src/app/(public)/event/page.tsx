import EventsPage from "@/components/modules/Event/EventsPage";
import { getAllEvents } from "@/services/event";

export default async function Page() {
  const initialData = await getAllEvents({ limit: 100 });
  return <EventsPage initialData={initialData} />;
}
