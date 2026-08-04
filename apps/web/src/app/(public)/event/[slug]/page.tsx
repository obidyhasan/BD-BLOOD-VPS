import EventDetailsPage from "@/components/modules/Event/EventDetailsPage";
import { getEventBySlug } from "@/services/event";
import { buildEntityMetadata, notFoundMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const event = (await getEventBySlug(slug))?.data;
  if (!event) return notFoundMetadata("Event");

  const locationBits = [event.upazila?.name, event.district?.name].filter(
    Boolean,
  );
  const description =
    event.description ||
    (locationBits.length
      ? `Blood donation event in ${locationBits.join(", ")}.`
      : undefined);

  return buildEntityMetadata({
    title: event.title,
    description,
    path: `/event/${event.slug ?? slug}`,
  });
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventRes = await getEventBySlug(slug);

  return (
    <EventDetailsPage slug={slug} initialEvent={eventRes?.data ?? null} />
  );
}
