import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table"
import { Button } from "components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card"
import Link from "next/link"
import { Event } from "@prisma/client"
import { Badge } from "components/ui/badge"

type EventWithCount = Event & {
  _count: {
    uploads: number
  }
}

interface EventListProps {
  events: EventWithCount[]
}

export async function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No events yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Uploads</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  /{event.slug}
                </TableCell>
                <TableCell className="text-sm">{event.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{event._count.uploads}</Badge>
                </TableCell>
  
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/events/${event.id}`}>View photos</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
