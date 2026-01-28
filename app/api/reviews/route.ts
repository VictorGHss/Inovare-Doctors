import { NextResponse } from "next/server";
import { getClinicConfig, getDoctorBySlug } from "@/lib/doctors";
import { resolveReviewConfig } from "@/lib/reviewSources";

export const runtime = "edge";

type GoogleReview = {
  author_name: string;
  rating: number;
  text?: string;
  relative_time_description?: string;
};

type GoogleResponse = {
  status: string;
  error_message?: string;
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
  const placeIdParam = url.searchParams.get("placeId");
  const slugParam = url.searchParams.get("slug");
  const limitParam = Number(url.searchParams.get("limit") ?? "3");
  const offsetParam = Number(url.searchParams.get("offset") ?? "0");

  const clinic = getClinicConfig();
  const doctor = slugParam ? getDoctorBySlug(slugParam) : undefined;
  if (slugParam && !doctor) {
    return NextResponse.json(
      { error: "Doctor not found" },
      { status: 404, headers: { "x-reviews-handler": "next-route" } }
    );
  }

  const resolved = doctor
    ? resolveReviewConfig(doctor, clinic)
    : {
        placeId: placeIdParam || clinic.google.placeId || "",
        minRating: Number(process.env.MIN_REVIEW_RATING ?? "3.5"),
        surnameTokens: [],
        useSurnameFilter: false,
        displayLabel: undefined,
        sourceMode: placeIdParam ? "individual" : "clinic"
      };
  const effectivePlaceId = placeIdParam || resolved.placeId;
  const minRating = resolved.minRating;
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 3;
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
  const surnamesRaw = (process.env.REVIEW_SURNAMES || process.env.REVIEW_SURNAME || "").trim();
  const surnameList = surnamesRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const normalizeToken = (token: string) =>
    token
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  const surnameTokens = (resolved.surnameTokens.length > 0 ? resolved.surnameTokens : surnameList).map(normalizeToken);
  const useSurnameFilter = resolved.useSurnameFilter && surnameTokens.length > 0;
  const isClinicFallback = resolved.sourceMode === "clinic" || effectivePlaceId === clinic.google.placeId;
  const applySurnameFilter = useSurnameFilter && (isClinicFallback || resolved.sourceMode === "group");

  console.info(
    `reviews: handler=edge slug=${slugParam ?? "n/a"} placeIdProvided=${Boolean(placeIdParam)} clinicPlaceId=${Boolean(
      clinic.google.placeId
    )} apiKeyPresent=${Boolean(process.env.GOOGLE_PLACES_API_KEY)} minRating=${minRating} surnames=${
      surnameTokens.length
    } isClinicFallback=${isClinicFallback}`
  );

  if (!effectivePlaceId) {
    console.error("reviews: missing placeId and clinic fallback");
    return NextResponse.json(
      { error: "Missing placeId" },
      { status: 400, headers: { "x-reviews-handler": "next-route" } }
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("reviews: GOOGLE_PLACES_API_KEY not set");
    return NextResponse.json(
      { error: "Missing Google Places API key" },
      { status: 500, headers: { "x-reviews-handler": "next-route" } }
    );
  }

  const cacheKey = new Request(
    `${url.origin}/api/reviews?placeId=${effectivePlaceId}&minRating=${minRating}&surnames=${surnameTokens.join(
      "|"
    )}&limit=${limit}&offset=${offset}&slug=${slugParam ?? ""}`
  );
  const cache = (caches as unknown as { default?: Cache }).default;
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  try {
    const googleUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    googleUrl.searchParams.set("place_id", effectivePlaceId);
    googleUrl.searchParams.set("key", apiKey);
    googleUrl.searchParams.set("fields", "rating,user_ratings_total,reviews,url");
    googleUrl.searchParams.set("reviews_no_translations", "true");

    const googleResponse = await fetch(googleUrl.toString());

    if (!googleResponse.ok) {
      console.error(`reviews: google fetch failed status=${googleResponse.status}`);
      return NextResponse.json({ error: "Failed to fetch Google Places" }, { status: 502 });
    }

    const googleJson = (await googleResponse.json()) as GoogleResponse;

    if (googleJson.status !== "OK" || !googleJson.result) {
      // Log detailed error to help diagnose (billing, key restriction, etc.)
      console.error(
        `reviews: invalid google response status=${googleJson.status} message=${googleJson.error_message ?? "n/a"}`
      );

      if (googleJson.status === "REQUEST_DENIED") {
        return NextResponse.json(
          {
            error: "REQUEST_DENIED",
            status: googleJson.status,
            error_message: googleJson.error_message ?? "Request denied by Google Places"
          },
          { status: 403, headers: { "Content-Type": "application/json", "x-reviews-handler": "next-route" } }
        );
      }

      if (googleJson.status === "ZERO_RESULTS") {
        return NextResponse.json(
          {
            rating: null,
            user_ratings_total: 0,
            reviews: [],
            url: googleJson.result?.url,
            displayLabel: resolved.displayLabel
          },
          { status: 200, headers: { "Content-Type": "application/json", "x-reviews-handler": "next-route" } }
        );
      }

      return NextResponse.json(
        {
          error: "Invalid Google response",
          status: googleJson.status,
          error_message: googleJson.error_message
        },
        { status: 502, headers: { "Content-Type": "application/json", "x-reviews-handler": "next-route" } }
      );
    }

    const filteredReviews = (googleJson.result.reviews || [])
      .filter((review) => {
        if (typeof review.rating === "number" && review.rating < minRating) return false;
        if (applySurnameFilter) {
          const text = (review.text || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
          if (!text) return false;
          return surnameTokens.some((sn) => text.includes(sn));
        }
        return true;
      })
      .map((review) => ({
        author_name: review.author_name,
        rating: review.rating,
        text: review.text,
        relative_time_description: review.relative_time_description
      }));

    const totalAfterFilter = filteredReviews.length;
    const paged = filteredReviews.slice(offset, offset + limit);
    const nextOffset = offset + limit < totalAfterFilter ? offset + limit : null;

    const payload = {
      rating: googleJson.result.rating,
      user_ratings_total: googleJson.result.user_ratings_total,
      url: googleJson.result.url,
      reviews: paged,
      returned: paged.length,
      totalAfterFilter,
      nextOffset,
      displayLabel: resolved.displayLabel
    };

    const response = new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_TTL}`,
        "Access-Control-Allow-Origin": "*",
        "x-reviews-handler": "next-route"
      }
    });

    if (cache) {
      await cache.put(cacheKey, response.clone());
    }

    return response;
  } catch (err) {
    console.error("reviews: unexpected error", err);
    return NextResponse.json(
      { error: "Unexpected error fetching reviews" },
      { status: 500, headers: { "Content-Type": "application/json", "x-reviews-handler": "next-route" } }
    );
  }
}
