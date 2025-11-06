// netlify/edge-functions/prerender.ts
// Edge Function to proxy crawler requests to Prerender.io while serving normal users directly
// Documentation: https://docs.netlify.com/edge-functions/overview/

const CRAWLER_UA_SUBSTRINGS = [
  "Googlebot",
  "Bingbot",
  "Yandex",
  "DuckDuckBot",
  "Baiduspider",
  "facebookexternalhit",
  "twitterbot",
  "rogerbot",
  "linkedinbot",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "pinterest",
  "slackbot",
  "vkShare",
  "W3C_Validator"
];

// Helper to detect if a user-agent string belongs to a crawler
function isCrawler(ua: string): boolean {
  return CRAWLER_UA_SUBSTRINGS.some((bot) => ua.toLowerCase().includes(bot.toLowerCase()));
}

export default async (request: Request, context: any) => {
  const userAgent = request.headers.get("user-agent") || "";

  // Skip if request is for static assets (e.g., .js, .css, images) to reduce unnecessary proxying
  const { pathname } = new URL(request.url);
  if (pathname.match(/\.[a-zA-Z0-9]{2,5}$/)) {
    return await context.next();
  }

  if (isCrawler(userAgent)) {
    try {
      const prerenderToken = Deno.env.get("PRERENDER_TOKEN") || "V85u5WS8kbxdXKCF5KuR";
      const prerenderUrl = `https://service.prerender.io/${request.url}`;

      const prerenderResponse = await fetch(prerenderUrl, {
        headers: {
          "X-Prerender-Token": prerenderToken,
          "User-Agent": userAgent,
        },
      });

      // Clone headers to modify (Netlify Edge Responses require a Headers instance)
      const headers = new Headers(prerenderResponse.headers);

      // Ensure CORS and caching headers are forwarded correctly
      headers.set("x-prerendered", "true");

      return new Response(prerenderResponse.body, {
        status: prerenderResponse.status,
        headers,
      });
    } catch (error) {
      console.error("Prerender proxy failed", error);
      // Fallback to standard rendering on failure
      return await context.next();
    }
  }

  return await context.next();
};