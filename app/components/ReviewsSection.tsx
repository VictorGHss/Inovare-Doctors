"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { ActionButton } from "./ActionButton";
import { FiExternalLink, FiMapPin } from "react-icons/fi";

type Review = {
  author_name: string;
  rating: number;
  text?: string;
  relative_time_description?: string;
};

type ReviewsResponse = {
  rating?: number;
  user_ratings_total?: number;
  reviews?: Review[];
  url?: string;
  returned?: number;
  totalAfterFilter?: number;
  nextOffset?: number | null;
  displayLabel?: string;
};

type Props = {
  slug?: string;
  placeId?: string;
  mapsUrl?: string;
  fallbackLabel?: string;
};

export function ReviewsSection({ slug, placeId, mapsUrl, fallbackLabel }: Props) {
  const PAGE_SIZE = 3;
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    placeId || slug ? "loading" : "idle"
  );
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!slug && !placeId) return;

    setStatus("loading");
    setReviews([]);
    setNextOffset(null);
    const controller = new AbortController();

    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", "0");
    if (slug) params.set("slug", slug);
    if (placeId) params.set("placeId", placeId);

    fetch(`/api/reviews?${params.toString()}`, {
      signal: controller.signal
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as ReviewsResponse;
        setData(json);
        setReviews(json.reviews || []);
        setNextOffset(json.nextOffset ?? null);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });

    return () => controller.abort();
  }, [placeId, slug]);

  const fallbackMapsUrl =
    mapsUrl || (placeId ? `https://www.google.com/maps/search/?api=1&query=place_id:${placeId}` : undefined);
  const urlToGoogle = data?.url || fallbackMapsUrl;
  const labelToShow = fallbackLabel || data?.displayLabel;

  const handleLoadMore = async () => {
    if ((!slug && !placeId) || nextOffset === null) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(nextOffset));
      if (slug) params.set("slug", slug);
      if (placeId) params.set("placeId", placeId);

      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as ReviewsResponse;
      setReviews((prev) => [...prev, ...(json.reviews || [])]);
      setNextOffset(json.nextOffset ?? null);
      setData((prev) => ({ ...prev, ...json, reviews: undefined })); // keep rating/meta updated
    } catch {
      // keeps previous reviews; show a light error inline
      setData((prev) => prev || { reviews, rating: data?.rating, user_ratings_total: data?.user_ratings_total });
      setStatus("ready");
    } finally {
      setLoadingMore(false);
    }
  };

  if (!placeId && !mapsUrl && !slug) {
    return null;
  }

  return (
    <AnimatedSection delay={0.05}>
      <div className="section-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-800">Avaliações</p>
            {labelToShow && <p className="text-sm text-gray-600">{labelToShow}</p>}
          </div>
          {urlToGoogle && (
            <ActionButton href={urlToGoogle} variant="primary" icon={urlToGoogle.includes("maps") ? <FiMapPin /> : <FiExternalLink />}>
              Ver no Google
            </ActionButton>
          )}
        </div>

        {status === "error" && (
          <p className="mt-4 text-sm text-gray-600">Não foi possível carregar as avaliações agora.</p>
        )}

        {status === "ready" ? (
          <div className="mt-4 flex flex-col gap-4">
            {typeof data?.rating === "number" ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-full bg-secondary/80 px-3 py-2 text-ink">
                  <span className="text-lg font-semibold">★ {data.rating.toFixed(1)}</span>
                  {typeof data.user_ratings_total === "number" && (
                    <span className="text-sm text-gray-700">({data.user_ratings_total} avaliações)</span>
                  )}
                </div>
              </div>
            ) : null}
            {reviews.length ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {reviews.map((review, idx) => (
                  <motion.div
                    key={`${review.author_name}-${idx}`}
                    className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <p className="text-sm font-semibold text-ink">{review.author_name}</p>
                    <p className="text-xs text-amber-800">★ {review.rating}</p>
                    {review.text && <p className="mt-2 text-sm text-gray-700">{review.text}</p>}
                    {review.relative_time_description && (
                      <p className="mt-2 text-xs text-gray-500">{review.relative_time_description}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">Sem reviews públicas para exibir.</p>
            )}
            {nextOffset !== null && (
              <div className="mt-2">
                <ActionButton
                  onClick={handleLoadMore}
                  variant="soft"
                  disabled={loadingMore}
                  className="w-full sm:w-auto"
                >
                  {loadingMore ? "Carregando..." : "Ver mais avaliações"}
                </ActionButton>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AnimatedSection>
  );
}
