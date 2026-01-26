"use client";

import { useEffect, useMemo, useState } from "react";
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
};

type Props = {
  placeId?: string;
  mapsUrl?: string;
  fallbackLabel?: string;
};

export function ReviewsSection({ placeId, mapsUrl, fallbackLabel }: Props) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    placeId ? "loading" : "idle"
  );

  useEffect(() => {
    if (!placeId) return;

    setStatus("loading");
    const controller = new AbortController();

    fetch(`/api/reviews?placeId=${encodeURIComponent(placeId)}`, {
      signal: controller.signal
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as ReviewsResponse;
        setData(json);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });

    return () => controller.abort();
  }, [placeId]);

  const reviews = useMemo(() => data?.reviews?.slice(0, 3) || [], [data]);
  const fallbackMapsUrl =
    mapsUrl || (placeId ? `https://www.google.com/maps/search/?api=1&query=place_id:${placeId}` : undefined);
  const urlToGoogle = data?.url || fallbackMapsUrl;

  if (!placeId && !mapsUrl) {
    return null;
  }

  return (
    <AnimatedSection delay={0.05}>
      <div className="section-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-800">Avaliações</p>
            {fallbackLabel && <p className="text-sm text-gray-600">{fallbackLabel}</p>}
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

        {status === "ready" && data?.rating ? (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-full bg-secondary/80 px-3 py-2 text-ink">
                <span className="text-lg font-semibold">★ {data.rating.toFixed(1)}</span>
                {typeof data.user_ratings_total === "number" && (
                  <span className="text-sm text-gray-700">({data.user_ratings_total} avaliações)</span>
                )}
              </div>
            </div>
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
          </div>
        ) : null}
      </div>
    </AnimatedSection>
  );
}
