// Cloudflare Pages Function — proxies POST /api/anthropic/v1/messages
// to https://api.anthropic.com/v1/messages.
//
// Why this exists:
//  - Keeps the Anthropic API key on the server (set as ANTHROPIC_API_KEY
//    secret on Cloudflare Pages), so it is never shipped to user browsers.
//  - Avoids needing per-user keys in Settings — one server-side key serves
//    every clinician who hits the deployed site.
//
// Behaviour:
//  - If ANTHROPIC_API_KEY env var is set: use it (recommended).
//  - Else: forward the user's x-api-key header (legacy fallback for static
//    hosts; static SPA flow still works.)
//
// We deliberately avoid the @cloudflare/workers-types package and the
// PagesFunction<Env> type so this file compiles in Cloudflare's Functions
// build environment without extra dev dependencies. Cloudflare provides
// PagesFunction globally at runtime, but the SDK package is optional.

interface CFContext {
  request: Request;
  env: { ANTHROPIC_API_KEY?: string };
}

export async function onRequestOptions(ctx: CFContext): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': new URL(ctx.request.url).origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Cap the upstream request body to keep a hostile visitor from burning
// Anthropic credits with a giant prompt. 32 KB is plenty for our clinical
// queries (typically 1–4 KB) and rejects anything obviously abusive.
const MAX_BODY_BYTES = 32 * 1024;

export async function onRequestPost(ctx: CFContext): Promise<Response> {
  const { request, env } = ctx;

  const serverKey = env.ANTHROPIC_API_KEY;
  const clientKey = request.headers.get('x-api-key') ?? '';
  const apiKey = serverKey || clientKey;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'No Anthropic API key configured. Set ANTHROPIC_API_KEY as a Cloudflare Pages secret, or have the user supply one in Settings.',
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({
      error: `Request body exceeds ${MAX_BODY_BYTES} bytes. Clinical AI prompts should not be this large.`,
    }), { status: 413, headers: { 'Content-Type': 'application/json' } });
  }

  const upstreamHeaders = new Headers();
  upstreamHeaders.set('Content-Type', request.headers.get('Content-Type') ?? 'application/json');
  upstreamHeaders.set('x-api-key', apiKey);
  upstreamHeaders.set('anthropic-version', request.headers.get('anthropic-version') ?? '2023-06-01');

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: upstreamHeaders,
      body,
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Upstream fetch to api.anthropic.com failed: ' + (err as Error).message,
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  const respHeaders = new Headers();
  respHeaders.set('Content-Type', upstreamResponse.headers.get('Content-Type') ?? 'application/json');
  respHeaders.set('Cache-Control', 'no-store');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: respHeaders,
  });
}

// Fallback for any other HTTP method (GET, etc.) — Anthropic Messages is POST.
export async function onRequest(): Promise<Response> {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' },
  });
}
