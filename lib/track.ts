import umami from "@umami/node";

// Fire-and-forget analytics — a missing UMAMI_HOST_URL/UMAMI_WEBSITE_ID or an unreachable
// Umami instance must never break the caller. Callers don't await this (see
// app/configurator/profile/action.ts), so an uncaught rejection here becomes an unhandled
// promise rejection, which crashes the whole Node process by default — not just this request.
export default async function Track(event_name: string) {
    try {
        umami.init({
            websiteId: process.env.UMAMI_WEBSITE_ID,
            hostUrl: process.env.UMAMI_HOST_URL,
        });
        await umami.track(event_name);
    } catch (e) {
        console.warn(`[track] umami unavailable, dropping event "${event_name}":`, (e as Error).message);
    }
}