// Cloudflare Workers entry — same API, same x402 logic. Deploy with wrangler.
import { contractCheck, gasCheck, tokenPrice, txStatus, handlePaidRequest, challenge402, INFO, ROUTES } from "./api.mjs";
import openapi from "./openapi.json";
export default {
  async fetch(req) {
    const url = new URL(req.url);
    const send = (r) => new Response(r.body, { status: r.status, headers: { ...r.headers, "Access-Control-Allow-Origin": "*" } });
    try {
      if (url.pathname === "/") return send({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(INFO, null, 2) });
      if (url.pathname === "/health") return send({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, routes: Object.fromEntries(Object.entries(ROUTES).map(([p, r]) => [p, `$${r.usd}`])) }) });
      if (url.pathname === "/openapi.json") return send({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(openapi, null, 2) });
      if (url.pathname === "/.well-known/x402") { const c = challenge402(`${url.origin}/v1/gas`, ROUTES["/v1/gas"]); return send({ status: 200, headers: { "Content-Type": "application/json" }, body: c.body }); }
      const route = ROUTES[url.pathname];
      if (route) {
        const headers = {}; req.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
        const full = `${url.origin}${url.pathname}${url.search}`;
        if (url.pathname === "/v1/gas") return send(await handlePaidRequest(full, route, headers, gasCheck));
        if (url.pathname === "/v1/token-price") {
          const address = url.searchParams.get("address");
          if (!address) return send({ status: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "missing address query param" }) });
          return send(await handlePaidRequest(full, route, headers, () => tokenPrice(address)));
        }
        if (url.pathname === "/v1/tx") {
          const hash = url.searchParams.get("hash");
          if (!hash) return send({ status: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "missing hash query param" }) });
          return send(await handlePaidRequest(full, route, headers, () => txStatus(hash)));
        }
        if (url.pathname === "/v1/contract-check") {
          const address = url.searchParams.get("address");
          if (!address) return send({ status: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "missing address query param" }) });
          return send(await handlePaidRequest(full, route, headers, () => contractCheck(address)));
        }
      }
      return send({ status: 404, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "not_found" }) });
    } catch (e) {
      return send({ status: e.status || 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: String(e.message || e) }) });
    }
  },
};
