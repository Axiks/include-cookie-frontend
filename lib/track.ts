import umami from "@umami/node";

export default async function Track(event_name: string){
    umami.init({
      websiteId: process.env.UMAMI_WEBSITE_ID,
      hostUrl: process.env.UMAMI_HOST_URL,
    });

    await umami.track(event_name);
}