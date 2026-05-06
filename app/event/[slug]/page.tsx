import GuestUploadPage from "@/components/guest/GuestUploadPage";
import { getEventBySlug } from "@/lib/db/events";
import { notFound } from "next/navigation";

export default async function EventGuestUploadPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug);

  if (!event) {
    notFound();
  }

  // Type assertion to include the image field from the updated Prisma schema
  const eventWithImage = event as typeof event & { image: string | null | undefined };

  const { id, name, slug, maxUploadsPerGuest, image } = eventWithImage;

  return <GuestUploadPage event={{ id, name, slug, maxUploadsPerGuest, image }} />;
}

 