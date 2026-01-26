/// <reference types="@cloudflare/workers-types" />
import type { EventContext } from "@cloudflare/workers-types/experimental";

type GoogleReview = {
  author_name: string;
  rating: number;
  text?: string;
  relative_time_description?: string;
};

type GoogleResponse = {
  status: string;
  result?: {
    rating?: number;
    user_ratings_total?: number;
    url?: string;
    reviews?: GoogleReview[];
  };
};

type Env = {
  GOOGLE_PLACES_API_KEY: string;
  CLINIC_PLACE_ID?: string;
};

const CACHE_TTL = 60 * 60 * 6; // 6 hours

export const onRequest = async (context: EventContext<Env, string, unknown>) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const placeId = url.searchParams.get("placeId") || env.CLINIC_PLACE_ID;

  if (!placeId) {
    return new Response(JSON.stringify({ error: "Missing placeId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!env.GOOGLE_PLACES_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing Google Places API key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(`${url.origin}/api/reviews?placeId=${placeId}`, request as unknown as RequestInit);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const googleUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  googleUrl.searchParams.set("place_id", placeId);
  googleUrl.searchParams.set("key", env.GOOGLE_PLACES_API_KEY);
  googleUrl.searchParams.set("fields", "rating,user_ratings_total,reviews,url");
  googleUrl.searchParams.set("reviews_no_translations", "true");

  const googleResponse = await fetch(googleUrl.toString());

  if (!googleResponse.ok) {
    return new Response(JSON.stringify({ error: "Failed to fetch Google Places" }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }

  const googleJson = (await googleResponse.json()) as GoogleResponse;

  if (googleJson.status !== "OK" || !googleJson.result) {
    return new Response(JSON.stringify({ error: "Invalid Google response" }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }

  const payload = {
    rating: googleJson.result.rating,
    user_ratings_total: googleJson.result.user_ratings_total,
    url: googleJson.result.url,
    reviews: (googleJson.result.reviews || []).map((review) => ({
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      relative_time_description: review.relative_time_description
    }))
  };

  const response = new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CACHE_TTL}`,
      "Access-Control-Allow-Origin": "*"
    }
  });

  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
};
