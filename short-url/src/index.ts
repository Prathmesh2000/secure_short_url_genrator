export default {
	async fetch(req: Request, env: Env): Promise<Response> {
	  const url = new URL(req.url);
	  const shortCode = url.pathname.slice(1);
  
	  // No shortcode → 404
	  if (!shortCode) {
		return new Response("Not Found", { status: 404 });
	  }
  
	  // 1️⃣ Try KV cache
	  const cached = await env.SHORT_URLS.get(shortCode);
	  if (cached) {
		return Response.redirect(cached, 302);
	  }
  
	  // 2️⃣ Fallback to backend
	  const apiResp = await fetch(
		`${env.API_BASE_URL}/resolve/${shortCode}`,
		{ method: "GET" }
	  );
  
	  if (!apiResp.ok) {
		return new Response("Not Found", { status: 404 });
	  }
  
	  const data = await apiResp.json() as { url: string };
  
	  if (!data.url) {
		return new Response("Invalid response", { status: 500 });
	  }
  
	  // 3️⃣ Cache + redirect
	  await env.SHORT_URLS.put(shortCode, data.url, {
		expirationTtl: 3600
	  });
  
	  return Response.redirect(data.url, 302);
	}
  };
  
  interface Env {
	SHORT_URLS: KVNamespace;
	API_BASE_URL: string;
  }
  