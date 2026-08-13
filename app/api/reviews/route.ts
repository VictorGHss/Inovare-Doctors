import { getClinicConfig, getDoctorBySlug, getDoctors } from "@/lib/doctors";
import { resolveReviewConfig } from "@/lib/reviewSources";
import { getEnv } from "@/lib/env";

export const runtime = "edge";

const CACHE_TTL = 60 * 60 * 6; // 6 hours cache for valid reviews

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

// Helper function to fetch and scrape Doctoralia reviews via JSON-LD + regex fallbacks
async function fetchDoctoraliaReviews(doctoraliaUrl: string): Promise<DoctoraliaData | null> {
  try {
    const response = await fetch(doctoraliaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://www.google.com/",
        "Sec-Ch-Ua": '"Not-A.Brand";v="99", "Chromium";v="124"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      }
    });

    if (!response.ok) {
      console.error(`reviews: fetch failed for ${doctoraliaUrl} with status ${response.status}`);
      return null;
    }

    const html = await response.text();

    // 1. Try parsing JSON-LD script blocks (Doctoralia standard schema)
    const jsonLdBlocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
    for (const block of jsonLdBlocks) {
      const rawJson = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
      try {
        const data = JSON.parse(rawJson);
        if (data["@type"] === "Physician" || data.aggregateRating || data.review) {
          const rating = data.aggregateRating?.ratingValue ? Number(data.aggregateRating.ratingValue) : null;
          const user_ratings_total = data.aggregateRating?.reviewCount ? Number(data.aggregateRating.reviewCount) : 0;
          const rawReviews = Array.isArray(data.review) ? data.review : data.review ? [data.review] : [];
          
          const reviews: Review[] = rawReviews.map((r: any) => {
            const authorName = typeof r.author === "object" ? (r.author?.name || "Paciente") : (r.author || "Paciente");
            const ratingVal = typeof r.reviewRating === "object" ? Number(r.reviewRating?.ratingValue || 5) : Number(r.reviewRating || 5);
            const text = (r.reviewBody || "").trim();
            
            let relativeTime = "Recente";
            if (r.datePublished) {
              try {
                const d = new Date(r.datePublished);
                if (!isNaN(d.getTime())) {
                  relativeTime = d.toLocaleDateString("pt-BR");
                }
              } catch (e) {}
            }
            
            return {
              author_name: authorName,
              rating: ratingVal,
              text,
              relative_time_description: relativeTime
            };
          });

          return { rating, user_ratings_total, reviews };
        }
      } catch (e) {
        // Continue if JSON parsing fails for a block
      }
    }

    // 2. Fallback: regex search for AggregateRating in HTML
    const ratingValMatch = html.match(/"ratingValue"\s*:\s*([\d.]+)/) || html.match(/ratingValue["']?\s*[:=]\s*["']?([\d.]+)/);
    const reviewCountMatch = html.match(/"reviewCount"\s*:\s*(\d+)/) || html.match(/reviewCount["']?\s*[:=]\s*["']?(\d+)/);
    
    const user_ratings_total = reviewCountMatch ? Number(reviewCountMatch[1]) : 0;
    const rating = ratingValMatch && user_ratings_total > 0 ? Number(ratingValMatch[1]) : null;

    return {
      rating,
      user_ratings_total,
      reviews: []
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
      return new Response(
        JSON.stringify({ error: "Doctor not found" }),
        { status: 404, headers: { "Content-Type": "application/json", "x-reviews-handler": "doctoralia-v4" } }
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
      return new Response(
        JSON.stringify({
          rating: null,
          user_ratings_total: 0,
          url: undefined,
          reviews: [],
          returned: 0,
          totalAfterFilter: 0,
          nextOffset: null,
          displayLabel: resolved.displayLabel ?? "Avaliações do Doctoralia"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Access-Control-Allow-Origin": "*",
            "x-reviews-handler": "doctoralia-v4"
          }
        }
      );
    }

    const cacheKey = new Request(
      `${url.origin}/api/reviews?slug=${slugParam ?? ""}&limit=${limit}&offset=${offset}&minRating=${minRating}&v=doctoralia-v4`
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

    const filteredReviews = doctoraliaData?.reviews
      ? doctoraliaData.reviews.filter((review) => {
          if (typeof review.rating === "number" && review.rating < minRating) return false;
          return true;
        })
      : [];

    const totalAfterFilter = filteredReviews.length;
    const paged = filteredReviews.slice(offset, offset + limit);
    const nextOffset = offset + limit < totalAfterFilter ? offset + limit : null;

    const payload = {
      rating: doctoraliaData?.rating ?? null,
      user_ratings_total: doctoraliaData?.user_ratings_total ?? 0,
      url: doctoraliaUrl,
      reviews: paged,
      returned: paged.length,
      totalAfterFilter,
      nextOffset,
      displayLabel: resolved.displayLabel ?? "Avaliações do Doctoralia"
    };

    // If no reviews found or fetch failed, do not cache empty response
    if (!doctoraliaData || payload.reviews.length === 0) {
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "x-reviews-handler": "doctoralia-v4"
        }
      });
    }

    // Only cache successful responses with actual reviews
    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_TTL}`,
        "Access-Control-Allow-Origin": "*",
        "x-reviews-handler": "doctoralia-v4"
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
    return new Response(
      JSON.stringify({
        error: "Unexpected error fetching reviews",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json", "x-reviews-handler": "doctoralia-v4" } }
    );
  }
}
