import { auth } from "auth"
import { redirect } from "next/navigation"
import { getAllEvents } from "lib/db/events"
import { TokenGenerator } from "components/dashboard/TokenGenerator"
import { EventList } from "components/dashboard/EventList"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) {
    redirect("/sign-in")
  }

  const events = await getAllEvents()

  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your events and generate invitation links
        </p>
      </div>

      <TokenGenerator />

      <EventList events={events} />
    </div>
  )
}
