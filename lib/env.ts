import { getRequestContext } from "@cloudflare/next-on-pages";

export function getEnv(key: string): string | undefined {
  // 1. Tentar obter do context do Cloudflare getRequestContext
  try {
    const { env } = getRequestContext();
    if (env && (env as any)[key]) {
      return String((env as any)[key]);
    }
  } catch {}

  // 2. Tentar obter do globalThis (fallback interno de next-on-pages)
  try {
    const context = (globalThis as any).__NEXT_ON_PAGES__?.__cf_env__ || {};
    if (context[key]) return String(context[key]);
  } catch {}

  // 3. Tentar obter do process.env padrão
  try {
    if (process.env[key]) return process.env[key];
  } catch {}

  return undefined;
}
