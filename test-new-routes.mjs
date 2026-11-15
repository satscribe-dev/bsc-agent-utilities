import worker, { emailCheck, ipLookup, whoisLookup, qrCode, ROUTES, PAY_TO } from "/home/hatch/workspace/payapi-20261106/worker-combined.mjs";
const base = "https://bsc-agent-utilities.raninndia.workers.dev";
const results = [];
async function check(label, url, expectStatus) {
  const res = await worker.fetch(new Request(url));
  const ok = res.status === expectStatus;
  let extra = "";
  if (res.status === 402) {
    const b64 = res.headers.get("X-PAYMENT-REQUIRED");
    const req = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    extra = ` amount=${req.amount} payTo=${req.payTo} match=${req.amount === "1000" && req.payTo === PAY_TO}`;
  }
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${res.status} (want ${expectStatus})${extra}`);
  results.push(ok);
}
// Unpaid -> 402 for all 8 routes, with and without params
for (const [path, expect] of [
  ["/v1/gas", 402], ["/v1/token-price", 402], ["/v1/token-price?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", 402],
  ["/v1/tx", 402], ["/v1/contract-check", 402],
  ["/v1/email-check", 402], ["/v1/email-check?email=hello@example.com", 402],
  ["/v1/ip-lookup", 402], ["/v1/ip-lookup?ip=8.8.8.8", 402],
  ["/v1/whois", 402], ["/v1/whois?domain=example.com", 402],
  ["/v1/qr", 402], ["/v1/qr?text=hello&size=200x200", 402],
]) await check(`unpaid ${path}`, base + path, expect);
// health + openapi + root
const h = await worker.fetch(new Request(base + "/health"));
const hj = await h.json();
console.log(`health: ${h.status} routes=${Object.keys(hj.routes).length} all001=${Object.values(hj.routes).every(v => v === "$0.001")}`);
const o = await worker.fetch(new Request(base + "/openapi.json"));
const oj = await o.json();
console.log(`openapi: ${o.status} paths=${Object.keys(oj.paths).length} hasNew=${["/v1/email-check","/v1/ip-lookup","/v1/whois","/v1/qr"].every(p => p in oj.paths)}`);
// Direct product functions (post-payment behaviour, no facilitator)
console.log("emailCheck:", JSON.stringify(await emailCheck("hello@example.com")));
console.log("emailCheck disposable:", JSON.stringify((await emailCheck("x@mailinator.com")).disposable));
try { await emailCheck("bukan-email"); console.log("emailCheck invalid: NO THROW (bad)"); } catch (e) { console.log("emailCheck invalid: throws", e.status, e.message); }
console.log("ipLookup:", JSON.stringify(await ipLookup("8.8.8.8")));
try { await ipLookup("999.1.1.1"); console.log("ipLookup invalid: NO THROW (bad)"); } catch (e) { console.log("ipLookup invalid: throws", e.status, e.message); }
console.log("whois:", JSON.stringify(await whoisLookup("example.com")));
try { await whoisLookup("bukan domain"); console.log("whois invalid: NO THROW (bad)"); } catch (e) { console.log("whois invalid: throws", e.status, e.message); }
const qr = await qrCode("hello", "200x200");
console.log("qr:", qr.contentType, "bytes:", qr.__binary.length, "PNG magic:", Buffer.from(qr.__binary.slice(0, 8)).toString("hex") === "89504e470d0a1a0a");
try { await qrCode("", null); console.log("qr missing text: NO THROW (bad)"); } catch (e) { console.log("qr missing text: throws", e.status, e.message); }
console.log("ROUTES count:", Object.keys(ROUTES).length, "| all 1000:", Object.values(ROUTES).every(r => r.price === "1000"));
console.log(results.every(Boolean) ? "ALL 402 CHECKS PASS" : "SOME 402 CHECKS FAILED");
