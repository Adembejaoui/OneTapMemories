import { validateToken, getToken } from "lib/db/tokens";
import EventCreationForm from "components/events/EventCreationForm";
import TokenErrorPage from "components/events/TokenErrorPage";
import { ErrorBoundary } from "components/error-boundary";

export default async function CreateEventPage({
  params,
}: {
  params: { token: string };
}) {
  const tokenRecord = await validateToken(params.token);

  if (!tokenRecord) {
    const rawToken = await getToken(params.token);
    let reason: "not_found" | "used" | "expired" = "not_found";

    if (rawToken) {
      if (rawToken.isUsed) {
        reason = "used";
      } else if (rawToken.expiresAt && rawToken.expiresAt < new Date()) {
        reason = "expired";
      }
    }

    return <TokenErrorPage reason={reason} />;
  }

  return (
    <ErrorBoundary>
      <EventCreationForm token={params.token} />
    </ErrorBoundary>
  );
}