// Supabase Edge Functions don't add CORS headers by default — every
// function the browser calls directly (via supabase.functions.invoke) needs
// to handle the OPTIONS preflight and echo these headers on every response,
// or the browser blocks the request before it ever reaches the function.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

export function json(body: unknown, init: number | { status?: number } = 200): Response {
  const status = typeof init === "number" ? init : init.status ?? 200;
  return Response.json(body, { status, headers: corsHeaders });
}
