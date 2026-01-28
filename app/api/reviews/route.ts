import { NextResponse } from "next/server";
import { getClinicConfig } from "@/lib/doctors";

export const runtime = "edge";

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

const CACHE_TTL = 60 * 60 * 6; // 6 horas

export async function GET(req: Request) {
  const url = new URL(req.url);
  const placeId = url.searchParams.get("placeId");

  const clinic = getClinicConfig();
  const effectivePlaceId = placeId || clinic.google.placeId;

  if (!effectivePlaceId) {
    console.error("reviews: missing placeId and clinic fallback");
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("reviews: GOOGLE_PLACES_API_KEY not set");
    return NextResponse.json({ error: "Missing Google Places API key" }, { status: 500 });
  }

  const cacheKey = new Request(`${url.origin}/api/reviews?placeId=${effectivePlaceId}`);
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const googleUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    googleUrl.searchParams.set("place_id", effectivePlaceId);
    googleUrl.searchParams.set("key", apiKey);
    googleUrl.searchParams.set("fields", "rating,user_ratings_total,reviews,url");
    googleUrl.searchParams.set("reviews_no_translations", "true");

    const googleResponse = await fetch(googleUrl.toString(), {
      headers: {
        Referer: process.env.SITE_BASE_URL || url.origin
      }
    });

    if (!googleResponse.ok) {
      console.error(`reviews: google fetch failed status=${googleResponse.status}`);
      return NextResponse.json({ error: "Failed to fetch Google Places" }, { status: 502 });
    }

    const googleJson = (await googleResponse.json()) as GoogleResponse;
    if (googleJson.status !== "OK" || !googleJson.result) {
      console.error(`reviews: invalid google response status=${googleJson.status}`);
      return NextResponse.json({ error: "Invalid Google response" }, { status: 502 });
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

    const response = new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_TTL}`,
        "Access-Control-Allow-Origin": "*"
      }
    });

    // put in cache asynchronously
    // @ts-expect-error waitUntil is available in the runtime
    response.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    console.error("reviews: unexpected error", err);
    return NextResponse.json({ error: "Unexpected error fetching reviews" }, { status: 500 });
  }
}
