import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function EventRedirectPage({
  params,
}: {
  params: { id: string }
}) {
  // Fetch event by ID using Prisma directly
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { slug: true },
  })
  
  if (!event) {
    redirect("/dashboard?error=event_not_found")
  }
  
  redirect(`/event/${event.slug}`)
}
