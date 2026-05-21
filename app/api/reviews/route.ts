import { NextResponse } from "next/server";
import { getClinicConfig, getDoctorBySlug, getDoctors } from "@/lib/doctors";
import { resolveReviewConfig } from "@/lib/reviewSources";
import { getEnv } from "@/lib/env";

export const runtime = "edge";

const CACHE_TTL = 60 * 60 * 6; // 6 hours cache

type Review = {
  author_name: string;
  rating: number;
  text?: string;
  relative_time_description?: string;
};

type DoctoraliaData = {
  rating: number | null;
  user_ratings_total: number;
  reviews: Review[];
};

// Helper function to fetch and scrape Doctoralia reviews
async function fetchDoctoraliaReviews(doctoraliaUrl: string): Promise<DoctoraliaData | null> {
  try {
    const response = await fetch(doctoraliaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      }
    });

    if (!response.ok) {
      console.error(`reviews: fetch failed for ${doctoraliaUrl} with status ${response.status}`);
      return null;
    }

    const html = await response.text();

    // 1. Extract Overall Rating & Review Count
    const ratingValueMatch = html.match(/itemprop="ratingValue"\s+content="([\d.]+)"/) || html.match(/content="([\d.]+)"\s+itemprop="ratingValue"/);
    const reviewCountMatch = html.match(/itemprop="reviewCount"\s+content="(\d+)"/) || html.match(/content="(\d+)"\s+itemprop="reviewCount"/);
    
    const user_ratings_total = reviewCountMatch ? Number(reviewCountMatch[1]) : 0;
    const rating = user_ratings_total > 0 && ratingValueMatch ? Number(ratingValueMatch[1]) : null;

    // 2. Extract Individual Reviews
    const reviews: Review[] = [];
    const reviewBlockRegex = /itemprop="review"\s+itemscope\s+itemtype="http:\/\/schema\.org\/Review"[\s\S]*?itemprop="reviewBody"[\s\S]*?<\/p>/gi;
    
    let match;
    while ((match = reviewBlockRegex.exec(html)) !== null) {
      const block = match[0];
      
      const authorMatch = block.match(/itemprop="name"[^>]*>\s*([^<]+?)\s*<\/span>/i);
      const author = authorMatch ? authorMatch[1].trim() : "Paciente";
      
      const scoreMatch = block.match(/data-score="(\d+)"/i) || block.match(/content="(\d+)"\s+itemprop="ratingValue"/i);
      const reviewRating = scoreMatch ? Number(scoreMatch[1]) : 5;
      
      const bodyMatch = block.match(/itemprop="reviewBody"[^>]*>\s*([\s\S]+?)\s*<\/p>/i);
      const text = bodyMatch ? bodyMatch[1].trim().replace(/\s+/g, ' ') : "";
      
      const dateMatch = block.match(/<time[^>]*>([^<]+)<\/time>/i);
      const relativeTime = dateMatch ? dateMatch[1].trim() : "Recentemente";
      
      reviews.push({
        author_name: author,
        rating: reviewRating,
        text,
        relative_time_description: relativeTime
      });
    }

    return {
      rating,
      user_ratings_total,
      reviews
    };
  } catch (error) {
    console.error(`reviews: failed to fetch or parse doctoralia reviews for URL ${doctoraliaUrl}:`, error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const placeIdParam = url.searchParams.get("placeId");
    const slugParam = url.searchParams.get("slug");
    const limitParam = Number(url.searchParams.get("limit") ?? "3");
    const offsetParam = Number(url.searchParams.get("offset") ?? "0");

    const clinic = getClinicConfig();
    
    // Find doctor by slug or placeId
    let doctor = slugParam ? getDoctorBySlug(slugParam) : undefined;
    if (!doctor && placeIdParam) {
      doctor = getDoctors().find((d) => d.google?.placeId === placeIdParam);
    }

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
          minRating: Number(getEnv("MIN_REVIEW_RATING") ?? "3.5"),
          surnameTokens: [],
          useSurnameFilter: false,
          displayLabel: "Avaliações do Doctoralia",
          sourceMode: "clinic" as const
        };

    const minRating = resolved.minRating;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 3;
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

    // Search for a Doctoralia link in the doctor's links
    const doctoraliaUrl = doctor?.contacts?.links?.find((l) =>
      l.url.toLowerCase().includes("doctoralia.com.br")
    )?.url;

    console.info(
      `reviews: handler=doctoralia slug=${slugParam ?? "n/a"} doctoraliaUrl=${doctoraliaUrl ?? "none"} minRating=${minRating}`
    );

    // If no Doctoralia link is available for the doctor, return empty payload gracefully
    if (!doctoraliaUrl) {
      return NextResponse.json(
        {
          rating: null,
          user_ratings_total: 0,
          url: undefined,
          reviews: [],
          returned: 0,
          totalAfterFilter: 0,
          nextOffset: null,
          displayLabel: resolved.displayLabel ?? "Avaliações do Doctoralia"
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${CACHE_TTL}`,
            "Access-Control-Allow-Origin": "*",
            "x-reviews-handler": "next-route"
          }
        }
      );
    }

    const cacheKey = new Request(
      `${url.origin}/api/reviews?slug=${slugParam ?? ""}&limit=${limit}&offset=${offset}&minRating=${minRating}`
    );
    
    let cache: any = undefined;
    try {
      if (typeof caches !== "undefined" && (caches as any).default) {
        cache = (caches as any).default;
      }
    } catch (e) {
      console.warn("Cache storage is not available in this environment:", e);
    }

    if (cache) {
      try {
        const cached = await cache.match(cacheKey);
        if (cached) return cached;
      } catch (e) {
        console.warn("Failed to retrieve from cache:", e);
      }
    }

    // Fetch and parse the Doctoralia reviews
    const doctoraliaData = await fetchDoctoraliaReviews(doctoraliaUrl);

    if (!doctoraliaData) {
      return NextResponse.json(
        { error: "Failed to fetch Doctoralia reviews" },
        { status: 502, headers: { "x-reviews-handler": "next-route" } }
      );
    }

    const filteredReviews = doctoraliaData.reviews
      .filter((review) => {
        if (typeof review.rating === "number" && review.rating < minRating) return false;
        return true;
      });

    const totalAfterFilter = filteredReviews.length;
    const paged = filteredReviews.slice(offset, offset + limit);
    const nextOffset = offset + limit < totalAfterFilter ? offset + limit : null;

    const payload = {
      rating: doctoraliaData.rating,
      user_ratings_total: doctoraliaData.user_ratings_total,
      url: doctoraliaUrl,
      reviews: paged,
      returned: paged.length,
      totalAfterFilter,
      nextOffset,
      displayLabel: resolved.displayLabel ?? "Avaliações do Doctoralia"
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
      try {
        await cache.put(cacheKey, response.clone());
      } catch (e) {
        console.warn("Failed to write to cache:", e);
      }
    }

    return response;
  } catch (err: any) {
    console.error("reviews: unexpected error in doctoralia route handler", err);
    return NextResponse.json(
      {
        error: "Unexpected error fetching reviews",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      },
      { status: 500, headers: { "Content-Type": "application/json", "x-reviews-handler": "next-route" } }
    );
  }
}
