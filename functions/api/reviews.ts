// Legacy Pages Function disabled: /api/reviews is now handled by Next Route Handler at app/api/reviews/route.ts
export const onRequest = () =>
  new Response(JSON.stringify({ error: "Use Next route handler" }), {
    status: 410,
    headers: { "Content-Type": "application/json" }
  });
