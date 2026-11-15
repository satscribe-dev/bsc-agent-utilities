// Node.js HTTP server for BSC Agent Utilities (x402).
// Run:  node server.mjs   (PORT env, default 8787). No dependencies.
import http from "node:http";
import { readFileSync } from "node:fs";
import { contractCheck, gasCheck, tokenPrice, txStatus, handlePaidRequest, challenge402, INFO, ROUTES } from "./api.mjs";

const openapi = JSON.parse(readFileSync(new URL("./openapi.json", import.meta.url), "utf8"));

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const send = (r) => { res.writeHead(r.status, { ...r.headers, "Access-Control-Allow-Origin": "*" }); res.end(r.body); };
  try {
    if (url.pathname === "/") return send({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(INFO, null, 2) });
    if (url.pathname === "/health") return send({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, routes: Object.fromEntries(Object.entries(ROUTES).map(([p, r]) => [p, `$${r.usd}`])) }) });
    if (url.pathname === "/openapi.json") return send({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(openapi, null, 2) });
    if (url.pathname === "/.well-known/x402") {
      const c = challenge402(`${url.origin}/v1/gas`, ROUTES["/v1/gas"]);
      return send({ status: 200, headers: { "Content-Type": "application/json" }, body: c.body });
    }
    const route = ROUTES[url.pathname];
    if (route) {
      const full = `${url.origin}${url.pathname}${url.search}`;
      if (url.pathname === "/v1/gas") return send(await handlePaidRequest(full, route, req.headers, gasCheck));
      if (url.pathname === "/v1/token-price") {
        const address = url.searchParams.get("address");
        if (!address) return send({ status: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "missing address query param, e.g. ?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" }) });
        return send(await handlePaidRequest(full, route, req.headers, () => tokenPrice(address)));
      }
      if (url.pathname === "/v1/tx") {
        const hash = url.searchParams.get("hash");
        if (!hash) return send({ status: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "missing hash query param" }) });
        return send(await handlePaidRequest(full, route, req.headers, () => txStatus(hash)));
      }
      if (url.pathname === "/v1/contract-check") {
        const address = url.searchParams.get("address");
        if (!address) return send({ status: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "missing address query param, e.g. ?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" }) });
        return send(await handlePaidRequest(full, route, req.headers, () => contractCheck(address)));
      }
    }
    return send({ status: 404, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "not_found" }) });
  } catch (e) {
    return send({ status: e.status || 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: String(e.message || e) }) });
  }
});
const port = Number(process.env.PORT || 8787);
server.listen(port, () => console.log(`bsc-agent-utilities listening on :${port}`));
