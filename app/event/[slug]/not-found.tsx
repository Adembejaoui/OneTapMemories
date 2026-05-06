import Link from "next/link";
import { Camera } from "lucide-react";

export default function EventNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm text-center space-y-4">
        <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Event not found</h2>
        <p className="text-muted-foreground">
          This event link doesn't exist or may have been removed.
        </p>
        <Link href="/" className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Back to home
        </Link>
      </div>
    </div>
  );
}