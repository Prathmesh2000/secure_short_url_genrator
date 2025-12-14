export default {
	async fetch(req: Request, env: Env): Promise<Response> {
	  const url = new URL(req.url);
	  const shortCode = url.pathname.slice(1);
  
	  if (!shortCode) {
		return new Response("Not Found", { status: 404 });
	  }
  
	  // 1️⃣ Try KV
	  const cached = await env.SHORT_URLS_REDIRECT.get(shortCode);
	  if (cached) {
		return Response.redirect(cached, 302);
	  }
  
	  // 2️⃣ Fallback to backend (CORRECT PATH)
	  const resp = await fetch(
		`${env.API_URL}/short-url/${shortCode}`
	  );
  
	  if (!resp.ok) {
		return new Response("Not Found", { status: 404 });
	  }
  
	  const data = await resp.json() as { url: string };
  
	  if (!data.url) {
		return new Response("Invalid response", { status: 500 });
	  }
  
	  // 3️⃣ Cache + redirect
	  await env.SHORT_URLS_REDIRECT.put(shortCode, data.url, {
		expirationTtl: 3600
	  });
  
	  return Response.redirect(data.url, 302);
	}
  };
  
  interface Env {
	SHORT_URLS_REDIRECT: KVNamespace;
	API_URL: string;
  }
  