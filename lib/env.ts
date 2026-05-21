export function getEnv(key: string): string | undefined {
  // 1. Tentar obter do globalThis (bindings do Cloudflare Workers / Pages)
  try {
    const globalObj = globalThis as unknown as Record<string, unknown>;
    if (globalObj[key]) {
      return String(globalObj[key]);
    }
  } catch {}

  // 2. Tentar obter do globalThis.__NEXT_ON_PAGES__ (contexto injetado pelo next-on-pages)
  try {
    const globalObj = globalThis as unknown as Record<string, unknown>;
    const nextOnPages = globalObj.__NEXT_ON_PAGES__ as Record<string, Record<string, unknown>> | undefined;
    const context = nextOnPages?.__cf_env__ || {};
    if (context[key]) {
      return String(context[key]);
    }
  } catch {}

  // 3. Tentar obter do process.env padrão
  try {
    if (process.env[key]) {
      return process.env[key];
    }
  } catch {}

  return undefined;
}
