export default {
    async fetch(req: Request, env: any): Promise<Response> {
      return new Response("Worker running");
    }
  };
  