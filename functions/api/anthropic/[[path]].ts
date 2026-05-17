// Cloudflare Pages Function — proxies /api/anthropic/* to api.anthropic.com.
//
// Why:
//  - Keeps the Anthropic API key on the server (set as ANTHROPIC_API_KEY secret
//    on Cloudflare Pages), never shipped to the browser.
//  - Removes the need for every clinician to paste their own key into Settings.
//  - Handles CORS automatically by being same-origin with the SPA.
//
// Behaviour:
//  - If ANTHROPIC_API_KEY secret is set: use it.
//  - Else: forward the incoming x-api-key header (lets the optional Settings
//    key still work as a fallback when no server-side key is configured).
//  - 405 for anything other than POST/OPTIONS — Anthropic Messages API is POST.

interface Env {
  ANTHROPIC_API_KEY?: string;
  // Optional override for the model used when the SPA does not specify one;
  // most clients send the model in the body, so this is rarely needed.
  ANTHROPIC_MODEL?: string;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env, params } = ctx;

  // Preflight — same-origin so this is mostly belt-and-braces.
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': new URL(request.url).origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Reconstruct the upstream URL from the catch-all path parameter.
  const pathParts = (params.path as string[] | undefined) ?? [];
  const upstreamPath = pathParts.length ? '/' + pathParts.join('/') : '';
  const upstreamUrl = `https://api.anthropic.com${upstreamPath}`;

  // Pick which key to forward.
  const serverKey = env.ANTHROPIC_API_KEY;
  const clientKey = request.headers.get('x-api-key') ?? '';
  const apiKey = serverKey || clientKey;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'No Anthropic API key configured. Either set ANTHROPIC_API_KEY as a Cloudflare Pages secret, or have the user supply one in Settings.',
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  // Build upstream headers — copy through anthropic-version and content-type,
  // strip any other auth headers, inject our chosen key.
  const upstreamHeaders = new Headers();
  upstreamHeaders.set('Content-Type', request.headers.get('Content-Type') ?? 'application/json');
  upstreamHeaders.set('x-api-key', apiKey);
  upstreamHeaders.set('anthropic-version', request.headers.get('anthropic-version') ?? '2023-06-01');

  // Read body once (Cloudflare Workers streams aren't re-readable).
  const body = await request.text();

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: upstreamHeaders,
      body,
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: `Upstream fetch to api.anthropic.com failed: ${(err as Error).message}`,
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  // Stream upstream body back, preserving status. Replace upstream headers
  // entirely so we don't leak Anthropic-internal headers and we set our own
  // cache-control (never cache AI responses).
  const respHeaders = new Headers();
  respHeaders.set('Content-Type', upstreamResponse.headers.get('Content-Type') ?? 'application/json');
  respHeaders.set('Cache-Control', 'no-store');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: respHeaders,
  });
};
