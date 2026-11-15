// BSC Agent Utilities — x402 pay-per-call bundle (USDC on Base)
// One listing, several cheap routes — the pattern the catalogue's multi-route
// winners use (Agent Utility Network 12 routes @ $0.001, Agent Extraction API).
// Dependency-free core: Node 18+ and Cloudflare Workers.
// Data: public BSC RPC + DexScreener public API only (no API keys).
// No funds are ever sent by this server; the facilitator settles the buyer's
// signed USDC authorization on Base.
export const PAY_TO = "0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617";
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const NETWORK = "eip155:8453";
export const FACILITATOR = "https://facilitator.xpay.sh"; // primary: free, no auth, gas-sponsored, x402 v2 Base
export const FACILITATOR_FALLBACK = "https://pay.neuronto.com"; // fallback (works, but charges $0.00196/settle after launch)
export const BSC_RPC = [
  "https://bsc-dataseed.binance.org/",
  "https://bsc.publicnode.com",
  "https://bsc-dataseed1.defibit.io/",
];
export const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

// price in USDC smallest units (6 decimals): $0.001 = 1000, $0.002 = 2000
export const ROUTES = {
  "/v1/gas": { price: "1000", usd: "0.001", desc: "BSC gas price + latest block + tx cost in BNB (pollable)" },
  "/v1/token-price": { price: "1000", usd: "0.001", desc: "Token price, market cap, liquidity, 24h volume via DexScreener (BSC-first)" },
  "/v1/tx": { price: "1000", usd: "0.001", desc: "BSC transaction status + receipt summary by hash" },
  "/v1/contract-check": { price: "1000", usd: "0.001", desc: "BSC contract safety check: code, name, symbol, supply, owner, paused, flags" },
  "/v1/email-check": { price: "1000", usd: "0.001", desc: "Email format + MX record + disposable-domain check (catch-all not checked)" },
  "/v1/ip-lookup": { price: "1000", usd: "0.001", desc: "IP geolocation: country, city, ASN, ISP, timezone" },
  "/v1/whois": { price: "1000", usd: "0.001", desc: "Domain age, registrar, expiry, nameservers via RDAP" },
  "/v1/qr": { price: "1000", usd: "0.001", desc: "QR code PNG generator (returns image/png)" },
};

const SEL = {
  name: "0x06fdde03", symbol: "0x95d89b41", decimals: "0x313ce567",
  totalSupply: "0x18160ddd", owner: "0x8da5cb5b", paused: "0x5c975abb",
};

export async function rpc(method, params = []) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params });
  let lastErr;
  for (const url of BSC_RPC) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(8000) });
      const j = await res.json();
      if (j.error) throw new Error(j.error.message || "rpc error");
      return j.result;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("all BSC RPC endpoints failed");
}

function decodeString(hex) {
  try {
    if (!hex || hex === "0x") return null;
    const b = Buffer.from(hex.slice(2), "hex");
    if (b.length < 64) return null;
    const len = Number(BigInt("0x" + b.subarray(32, 64).toString("hex")));
    if (len < 0 || len > 10000 || 64 + len > b.length) return null;
    return b.subarray(64, 64 + len).toString("utf8");
  } catch { return null; }
}
function decodeUint(hex) {
  try { return (!hex || hex === "0x") ? null : BigInt(hex).toString(10); } catch { return null; }
}
function decodeAddress(hex) {
  try { return (!hex || hex === "0x" || hex.length < 42) ? null : "0x" + hex.slice(-40); } catch { return null; }
}
function decodeBool(hex) {
  try { return (!hex || hex === "0x") ? null : BigInt(hex) !== 0n; } catch { return null; }
}
async function ethCall(to, data) {
  try { return await rpc("eth_call", [{ to, data }, "latest"]); } catch { return null; }
}
function isAddress(a) { return /^0x[0-9a-fA-F]{40}$/.test(a || ""); }
function isHash(h) { return /^0x[0-9a-fA-F]{64}$/.test(h || ""); }

async function bnbUsd() {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${WBNB}`, { signal: AbortSignal.timeout(8000) });
    const j = await res.json();
    const pairs = (j.pairs || []).filter((p) => p.chainId === "bsc" && p.priceUsd);
    if (!pairs.length) return null;
    pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    return Number(pairs[0].priceUsd);
  } catch { return null; }
}

export async function gasCheck() {
  const [blockHex, gasHex, usd] = await Promise.all([rpc("eth_blockNumber", []), rpc("eth_gasPrice", []), bnbUsd()]);
  const gasWei = BigInt(gasHex);
  const gwei = Number(gasWei) / 1e9;
  const cost = (gasLimit) => (Number(gasWei * BigInt(gasLimit)) / 1e18).toFixed(8);
  return {
    product: "BSC gas + block tip", chain: "BNB Smart Chain", chainId: 56,
    blockNumber: Number(BigInt(blockHex)), gasPriceGwei: Math.round(gwei * 10000) / 10000,
    costBnb: { simpleTransfer21000: cost(21000), typicalMint100k: cost(100000), heavyTx300k: cost(300000) },
    bnbUsd: usd, checkedAt: new Date().toISOString(),
  };
}

export async function tokenPrice(address) {
  if (!isAddress(address)) throw Object.assign(new Error("address must be a 0x-prefixed 40-hex-char token address"), { status: 400 });
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, { signal: AbortSignal.timeout(10000) });
  const j = await res.json();
  const pairs = (j.pairs || []).filter((p) => p.priceUsd);
  if (!pairs.length) return { product: "BSC token price", chain: "BNB Smart Chain", address: address.toLowerCase(), found: false, note: "No DexScreener pair with a price for this address (unlisted / no liquidity yet).", checkedAt: new Date().toISOString() };
  const bsc = pairs.filter((p) => p.chainId === "bsc");
  const pool = bsc.length ? bsc : pairs;
  pool.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
  const p = pool[0];
  return {
    product: "BSC token price", chain: "BNB Smart Chain", address: address.toLowerCase(), found: true,
    name: p.baseToken?.name || null, symbol: p.baseToken?.symbol || null,
    chainId: p.chainId, dex: p.dexId, pair: p.pairAddress, pairUrl: p.url,
    priceUsd: p.priceUsd ? Number(p.priceUsd) : null, priceNative: p.priceNative || null,
    marketCap: p.marketCap ?? null, fdv: p.fdv ?? null,
    liquidityUsd: p.liquidity?.usd ?? null, volume24h: p.volume?.h24 ?? null,
    priceChange24hPct: p.priceChange?.h24 ?? null,
    txns24h: p.txns?.h24 ?? null, checkedAt: new Date().toISOString(),
  };
}

export async function txStatus(hash) {
  if (!isHash(hash)) throw Object.assign(new Error("hash must be a 0x-prefixed 64-hex-char transaction hash"), { status: 400 });
  const [tx, rcpt, blockHex] = await Promise.all([
    rpc("eth_getTransactionByHash", [hash]),
    rpc("eth_getTransactionReceipt", [hash]).catch(() => null),
    rpc("eth_blockNumber", []),
  ]);
  if (!tx) return { product: "BSC transaction status", chain: "BNB Smart Chain", hash: hash.toLowerCase(), found: false, note: "No transaction with this hash on BSC (yet).", checkedAt: new Date().toISOString() };
  return {
    product: "BSC transaction status", chain: "BNB Smart Chain", hash: hash.toLowerCase(), found: true,
    status: rcpt ? (rcpt.status === "0x1" ? "success" : "failed") : "pending",
    blockNumber: tx.blockNumber ? Number(BigInt(tx.blockNumber)) : null,
    confirmations: tx.blockNumber ? Number(BigInt(blockHex)) - Number(BigInt(tx.blockNumber)) : 0,
    from: tx.from, to: tx.to || null, valueBnb: (Number(BigInt(tx.value || "0x0")) / 1e18).toString(),
    gasLimit: tx.gas ? Number(BigInt(tx.gas)) : null,
    gasUsed: rcpt?.gasUsed ? Number(BigInt(rcpt.gasUsed)) : null,
    gasPriceGwei: tx.gasPrice ? Math.round((Number(BigInt(tx.gasPrice)) / 1e9) * 1000) / 1000 : null,
    checkedAt: new Date().toISOString(),
  };
}

export async function contractCheck(address) {
  if (!isAddress(address)) throw Object.assign(new Error("address must be a 0x-prefixed 40-hex-char BSC address"), { status: 400 });
  const [code, blockHex, gasHex] = await Promise.all([
    rpc("eth_getCode", [address, "latest"]),
    rpc("eth_blockNumber", []),
    rpc("eth_gasPrice", []),
  ]);
  const hasCode = code && code !== "0x";
  const codeBytes = hasCode ? (code.length - 2) / 2 : 0;
  const [name, symbol, decimals, totalSupply, owner, paused] = await Promise.all([
    ethCall(address, SEL.name).then(decodeString),
    ethCall(address, SEL.symbol).then(decodeString),
    ethCall(address, SEL.decimals).then((h) => { const u = decodeUint(h); return u === null ? null : Number(u); }),
    ethCall(address, SEL.totalSupply).then(decodeUint),
    ethCall(address, SEL.owner).then(decodeAddress),
    ethCall(address, SEL.paused).then(decodeBool),
  ]);
  const flags = [];
  if (!hasCode) flags.push("NOT_A_CONTRACT");
  else {
    if (name === null && symbol === null) flags.push("UNREADABLE_METADATA");
    if (totalSupply === "0") flags.push("ZERO_SUPPLY");
    if (paused === true) flags.push("PAUSED");
  }
  const gasGwei = Number(BigInt(gasHex)) / 1e9;
  return {
    product: "BSC contract safety check",
    chain: "BNB Smart Chain",
    chainId: 56,
    address: address.toLowerCase(),
    blockNumber: Number(BigInt(blockHex)),
    gasPriceGwei: Math.round(gasGwei * 1000) / 1000,
    hasCode, codeBytes,
    name, symbol, decimals, totalSupply, owner, paused,
    flags,
    note: "On-chain facts only. Not financial advice and not a safety guarantee — a contract can pass every check here and still be worthless.",
    checkedAt: new Date().toISOString(),
  };
}


const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "temp-mail.org", "10minutemail.com", "mailinator.com",
  "guerrillamail.com", "guerrillamailblock.com", "yopmail.com", "sharklasers.com",
  "getnada.com", "maildrop.cc", "trashmail.com", "throwawaymail.com",
  "fakeinbox.com", "mintemail.com", "mytemp.email", "tempail.com",
  "dispostable.com", "emailondeck.com", "harakirimail.com", "mailcatch.com",
  "spamgourmet.com", "tempmailaddress.com", "mailnesia.com", "anonymbox.com",
]);

export async function emailCheck(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw Object.assign(new Error("email must be a valid email address"), { status: 400 });
  const domain = email.split("@")[1].toLowerCase();
  let hasMx = null, mxHosts = [];
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, { signal: AbortSignal.timeout(8000) });
    const j = await res.json();
    if (j.Status === 0 && Array.isArray(j.Answer) && j.Answer.length) {
      hasMx = true;
      mxHosts = j.Answer.map((a) => String(a.data).split(/\s+/).pop().replace(/\.$/, "")).filter((h) => h && h !== ".").slice(0, 3);
    } else if (j.Status === 3) { hasMx = false; }
    else if (j.Status === 0) { hasMx = false; }
  } catch { hasMx = null; }
  return {
    product: "Email validation", email: email.toLowerCase(), validFormat: true, domain,
    hasMx, mxHosts, disposable: DISPOSABLE_DOMAINS.has(domain),
    catchAll: "not_checked",
    note: "Format + MX + disposable-domain list only. Catch-all is not checked; a deliverable-looking result is not a guarantee the mailbox exists.",
    checkedAt: new Date().toISOString(),
  };
}

function isIp(ip) {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip || "")) return ip.split(".").every((o) => Number(o) <= 255);
  return /^[0-9a-fA-F:]{2,45}$/.test(ip || "") && (ip || "").includes(":");
}

export async function ipLookup(ip) {
  if (!isIp(ip)) throw Object.assign(new Error("ip must be a valid IPv4 or IPv6 address"), { status: 400 });
  let lastErr;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(8000) });
    const j = await res.json();
    if (j.success) {
      return {
        product: "IP geolocation", ip, country: j.country || null, countryCode: j.country_code || null,
        region: j.region || null, city: j.city || null, latitude: j.latitude ?? null, longitude: j.longitude ?? null,
        asn: j.connection?.asn ?? null, isp: j.connection?.isp ?? null, org: j.connection?.org ?? null,
        timezone: j.timezone?.id || null, timezoneAbbr: j.timezone?.abbr || null, utcOffset: j.timezone?.utc || null,
        source: "ipwho.is", checkedAt: new Date().toISOString(),
      };
    }
    lastErr = new Error(j.message || "ipwho.is lookup failed");
  } catch (e) { lastErr = e; }
  // Fallback: ip-api.com free tier (45 req/min, HTTP only, no key)
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,lat,lon,as,isp,org,timezone,query`, { signal: AbortSignal.timeout(8000) });
    const j = await res.json();
    if (j.status === "success") {
      return {
        product: "IP geolocation", ip: j.query || ip, country: j.country || null, countryCode: j.countryCode || null,
        region: j.regionName || null, city: j.city || null, latitude: j.lat ?? null, longitude: j.lon ?? null,
        asn: j.as || null, isp: j.isp || null, org: j.org || null,
        timezone: j.timezone || null, timezoneAbbr: null, utcOffset: null,
        source: "ip-api.com (fallback)", checkedAt: new Date().toISOString(),
      };
    }
    return { product: "IP geolocation", ip, found: false, note: String(j.message || "lookup failed") + (String(j.message || "").includes("rate") ? " (ip-api.com free tier: 45 req/min)" : ""), source: "ip-api.com (fallback)", checkedAt: new Date().toISOString() };
  } catch (e) {
    throw Object.assign(new Error("both IP lookup upstreams failed: " + String(lastErr?.message || lastErr || e.message || e)), { status: 502 });
  }
}

export async function whoisLookup(domain) {
  if (!domain || !/^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/.test(domain)) throw Object.assign(new Error("domain must be a valid domain name, e.g. example.com"), { status: 400 });
  const d = domain.toLowerCase();
  const tld = d.split(".").pop();
  let rdap = null, rdapBase = null;
  // Authoritative RDAP server via the IANA bootstrap (rdap.org itself is
  // Cloudflare-bot-walled from many datacenter IPs, so it cannot be relied on).
  try {
    const boot = await fetch("https://data.iana.org/rdap/dns.json", { signal: AbortSignal.timeout(8000) });
    const bj = await boot.json();
    const svc = (bj.services || []).find((sv) => (sv[0] || []).includes(tld));
    if (svc?.[1]?.[0]) rdapBase = svc[1][0];
  } catch { rdapBase = null; }
  const tryRdap = async (url) => {
    try { const res = await fetch(url, { signal: AbortSignal.timeout(10000) }); if (res.ok) return await res.json(); } catch { /* fall through */ }
    return null;
  };
  if (rdapBase) rdap = await tryRdap(`${rdapBase}domain/${encodeURIComponent(d)}`);
  if (!rdap) rdap = await tryRdap(`https://rdap.org/domain/${encodeURIComponent(d)}`);
  const ev = (action) => (rdap?.events || []).find((e) => e.eventAction === action)?.eventDate || null;
  const created = ev("registration"), expires = ev("expiration"), lastChanged = ev("last changed");
  const registrarEnt = (rdap?.entities || []).find((e) => (e.roles || []).includes("registrar"));
  const registrar = registrarEnt?.vcardArray?.[1]?.find((x) => x[0] === "fn")?.[3] || null;
  let nameservers = (rdap?.nameservers || []).map((n) => n.ldhName).filter(Boolean);
  let source = rdapBase ? "IANA RDAP (" + rdapBase.replace("https://", "").split("/")[0] + ")" : "rdap.org";
  if (!rdap) {
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(d)}&type=NS`, { signal: AbortSignal.timeout(8000) });
      const j = await res.json();
      nameservers = (j.Answer || []).map((a) => String(a.data).replace(/\.$/, ""));
      source = "dns.google (RDAP unavailable — nameservers only)";
    } catch { source = "rdap.org (unavailable)"; }
  }
  const ageDays = created ? Math.floor((Date.now() - new Date(created).getTime()) / 86400000) : null;
  return {
    product: "Domain WHOIS (RDAP)", domain: d, created, expires, lastChanged,
    domainAgeDays: ageDays, registrar, nameservers,
    note: created || expires ? undefined : "RDAP returned no registration data for this domain (may be unregistered or RDAP-uncovered TLD).",
    source, checkedAt: new Date().toISOString(),
  };
}

export async function qrCode(text, size) {
  if (!text) throw Object.assign(new Error("text query param is required"), { status: 400 });
  let w = 200, h = 200;
  if (size) {
    const m = /^(\d{1,4})x(\d{1,4})$/.exec(size);
    if (!m) throw Object.assign(new Error("size must look like 200x200 (50-1000 each side)"), { status: 400 });
    w = Math.min(1000, Math.max(50, Number(m[1]))); h = Math.min(1000, Math.max(50, Number(m[2])));
  }
  const res = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=${w}x${h}&data=${encodeURIComponent(text)}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw Object.assign(new Error("QR upstream failed with HTTP " + res.status), { status: 502 });
  return { __binary: new Uint8Array(await res.arrayBuffer()), contentType: "image/png" };
}

export function paymentRequirements(url, route) {
  return {
    scheme: "exact", network: NETWORK, amount: route.price, asset: USDC_BASE,
    payTo: PAY_TO, maxTimeoutSeconds: 300,
    extra: { name: "USD Coin", version: "2" },
  };
}
export function challenge402(url, route) {
  const req = paymentRequirements(url, route);
  const v2 = { x402Version: 2, resource: { url, description: `${route.desc}. $${route.usd} USDC on Base per call.` }, accepts: [req] };
  return {
    status: 402,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(v2)).toString("base64"),
      "X-PAYMENT-REQUIRED": Buffer.from(JSON.stringify(req)).toString("base64"),
    },
    body: JSON.stringify({ error: "payment_required", x402Version: 2, accepts: [req], resource: v2.resource }, null, 2),
  };
}

async function facilitator(path, payload) {
  // Try primary, fall back only on network error/timeout (a definitive
  // isValid:false / success:false answer is never retried elsewhere).
  let lastErr;
  for (const base of [FACILITATOR, FACILITATOR_FALLBACK]) {
    try {
      const res = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(25000) });
      return { base, json: await res.json() };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("all facilitators unreachable");
}

export async function handlePaidRequest(url, route, headers, runProduct) {
  const sigHeader = headers["payment-signature"] || headers["x-payment"];
  if (!sigHeader) return challenge402(url, route);
  let paymentPayload;
  try { paymentPayload = JSON.parse(Buffer.from(sigHeader, "base64").toString("utf8")); }
  catch { return challenge402(url, route); }
  const x402Version = paymentPayload.x402Version || 2;
  const requirements = paymentRequirements(url, route);
  // x402 v2 facilitators read the accepted requirements off the payload;
  // normalise it in when a client omits it.
  if (x402Version === 2 && !paymentPayload.accepted) paymentPayload.accepted = requirements;
  try {
    const { json: verified } = await facilitator("/verify", { x402Version, paymentPayload, paymentRequirements: requirements });
    if (!verified.isValid) return { status: 402, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify({ error: "payment_invalid", reason: verified.invalidReason || verified.error || "verification failed" }) };
    const { json: settled } = await facilitator("/settle", { x402Version, paymentPayload, paymentRequirements: requirements });
    if (!(settled.success ?? settled.settled)) return { status: 402, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify({ error: "payment_settlement_failed", reason: settled.errorReason || settled.error || "settlement failed" }) };
    let data;
    try { data = await runProduct(); }
    catch (e) { return { status: e.status || 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: String(e.message || e) }) }; }
    const respB64 = Buffer.from(JSON.stringify(settled)).toString("base64");
    if (data && data.__binary) return { status: 200, headers: { "Content-Type": data.contentType || "application/octet-stream", "PAYMENT-RESPONSE": respB64, "X-PAYMENT-RESPONSE": respB64 }, body: data.__binary };
    return { status: 200, headers: { "Content-Type": "application/json", "PAYMENT-RESPONSE": respB64, "X-PAYMENT-RESPONSE": respB64 }, body: JSON.stringify({ ...data, payment: { txHash: settled.transaction || settled.txHash || null, amountUsdc: route.usd, network: "Base" } }, null, 2) };
  } catch (e) {
    return { status: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "facilitator_error", detail: String(e.message || e) }) };
  }
}

export const INFO = {
  name: "BSC Agent Utilities",
  description: "Cheap lookups for AI agents, pay per call in USDC on Base via x402, no API key: BSC gas + block tip ($0.001), token price ($0.001), tx status ($0.001), contract safety check ($0.001), email check ($0.001), IP lookup ($0.001), domain WHOIS ($0.001), QR code PNG ($0.001).",
  payTo: PAY_TO, network: "Base (eip155:8453)", asset: "USDC",
  routes: Object.fromEntries(Object.entries(ROUTES).map(([p, r]) => [p, `$${r.usd} — ${r.desc}`])),
  examples: [
    "/v1/gas",
    "/v1/token-price?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    "/v1/tx?hash=0x3e1f4bd9f197743f2a5fcd4a9cd6c0dbdc5517aedb0cd1dcb9b839f57b72c717",
    "/v1/contract-check?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    "/v1/email-check?email=hello@example.com",
    "/v1/ip-lookup?ip=8.8.8.8",
    "/v1/whois?domain=example.com",
    "/v1/qr?text=hello&size=200x200",
  ],
  howToUse: {
    steps: [
      "1. Call any /v1/* route, e.g. curl https://satscribe.pages.dev/v1/gas",
      "2. You get HTTP 402 Payment Required with the payment details ($0.001 USDC on Base, payTo address, 300s timeout).",
      "3. Pay $0.001 USDC on Base to the payTo address (use an x402 client library like x402-fetch / x402-axios, or sign the payment yourself).",
      "4. Retry the same request with header X-PAYMENT: <base64 payment payload> — you get HTTP 200 with the data."
    ],
    note: "No API key, no account, no signup. Each call costs $0.001 USDC on Base. Zero calls = $0. x402 client libraries handle steps 2-4 automatically.",
    example: "curl https://satscribe.pages.dev/v1/gas"
  },
  freeRoutes: ["/", "/health", "/openapi.json", "/.well-known/x402", "/llms.txt"],
};

export const LLMS_TXT = `# BSC Agent Utilities

> 8 pay-per-call utility APIs on BSC/Base data, $0.001 USDC per call via x402 (no API key, no account).

## How to use

1. Call any /v1/* route, e.g. \`curl https://satscribe.pages.dev/v1/gas\`
2. You get HTTP 402 Payment Required with the payment details ($0.001 USDC on Base, payTo address, 300s timeout).
3. Pay $0.001 USDC on Base to the payTo address (use an x402 client library like x402-fetch / x402-axios, or sign the payment yourself).
4. Retry the same request with header \`X-PAYMENT: <base64 payment payload>\` — you get HTTP 200 with the data.

No API key, no account, no signup. Each call costs $0.001 USDC on Base. Zero calls = $0. x402 client libraries handle steps 2-4 automatically.

## APIs

- [Gas Price](https://satscribe.pages.dev/v1/gas): BSC gas price + latest block + tx cost in BNB. $0.001 USDC.
- [Token Price](https://satscribe.pages.dev/v1/token-price?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c): Live token price, market cap, liquidity, 24h volume (BSC-first, DexScreener). $0.001 USDC.
- [Transaction Status](https://satscribe.pages.dev/v1/tx): BSC transaction status + receipt summary by hash. $0.001 USDC.
- [Contract Check](https://satscribe.pages.dev/v1/contract-check?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c): BSC contract safety check: code, name, symbol, supply, owner, paused, flags. $0.001 USDC.
- [Email Check](https://satscribe.pages.dev/v1/email-check?email=hello@example.com): Email format + MX record + disposable-domain check. $0.001 USDC.
- [IP Lookup](https://satscribe.pages.dev/v1/ip-lookup?ip=8.8.8.8): IP geolocation: country, city, ASN, ISP, timezone. $0.001 USDC.
- [WHOIS](https://satscribe.pages.dev/v1/whois?domain=example.com): Domain registration data via RDAP: age, registrar, expiry, nameservers. $0.001 USDC.
- [QR Code](https://satscribe.pages.dev/v1/qr?text=hello&size=200x200): QR code PNG generator. $0.001 USDC.

## Payment

- All endpoints use x402 v2, exact scheme, USDC on Base (eip155:8453), $0.001 per call.
- Pay to: 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617
- Discovery: /.well-known/x402
- OpenAPI: /openapi.json
- Listing: https://payapi.market (search "BSC Agent Utilities"), https://agent402.tools
`;

const openapi = {"openapi":"3.1.0","info":{"title":"BSC Agent Utilities","version":"2.0.0","contact":{"name":"BSC Agent Utilities","email":"raninndia@gmail.com"},"description":"Cheap lookups for AI agents, pay per call in USDC on Base via x402, no API key: BSC gas + block tip $0.001, token price $0.001, tx status $0.001, contract safety check $0.001, email check $0.001, IP lookup $0.001, domain WHOIS $0.001, QR code PNG $0.001."},"servers":[{"url":"https://satscribe.pages.dev"}],"paths":{"/health":{"get":{"operationId":"healthCheck","summary":"Free health check","description":"Free health check, no payment required. Lists all paid routes and their prices.","security":[],"responses":{"200":{"description":"OK"}}}},"/v1/gas":{"get":{"operationId":"getGasPrice","summary":"BSC gas price + latest block","description":"Returns the current BSC gas price, latest block number and estimated transaction costs in BNB. No input parameters.","parameters":[],"x-payment-info":{"scheme":"exact","network":"eip155:8453","asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","amount":"1000","payTo":"0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617","description":"$0.001 USDC on Base per call"},"responses":{"200":{"description":"Gas price, block tip, tx costs in BNB (paid)"},"402":{"description":"Payment required - $0.001 USDC on Base"}}}},"/v1/token-price":{"get":{"operationId":"getTokenPrice","summary":"Token price via DexScreener (BSC-first)","x-payment-info":{"scheme":"exact","network":"eip155:8453","asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","amount":"1000","payTo":"0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617","description":"$0.001 USDC on Base per call"},"parameters":[{"name":"address","in":"query","required":true,"description":"BSC contract or token address (0x-prefixed, 42 chars)","schema":{"type":"string","description":"BSC contract or token address (0x-prefixed, 42 chars)","example":"0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"},"example":"0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"}],"responses":{"200":{"description":"Token price, market cap, liquidity (paid)"},"402":{"description":"Payment required - $0.001 USDC on Base"}}}},"/v1/tx":{"get":{"operationId":"getTxStatus","summary":"BSC transaction status by hash","x-payment-info":{"scheme":"exact","network":"eip155:8453","asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","amount":"1000","payTo":"0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617","description":"$0.001 USDC on Base per call"},"parameters":[{"name":"hash","in":"query","required":true,"description":"BSC transaction hash (0x-prefixed, 66 chars)","schema":{"type":"string","description":"BSC transaction hash (0x-prefixed, 66 chars)","example":"0x3e1f4bd9f197743f2a5fcd4a9cd6c0dbdc5517aedb0cd1dcb9b839f57b72c717"},"example":"0x3e1f4bd9f197743f2a5fcd4a9cd6c0dbdc5517aedb0cd1dcb9b839f57b72c717"}],"responses":{"200":{"description":"Transaction status + receipt (paid)"},"402":{"description":"Payment required - $0.001 USDC on Base"}}}},"/v1/contract-check":{"get":{"operationId":"checkContract","summary":"Check one BSC contract address","x-payment-info":{"scheme":"exact","network":"eip155:8453","asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","amount":"1000","payTo":"0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617","description":"$0.001 USDC on Base per call"},"parameters":[{"name":"address","in":"query","required":true,"description":"BSC contract or token address (0x-prefixed, 42 chars)","schema":{"type":"string","description":"BSC contract or token address (0x-prefixed, 42 chars)","example":"0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"},"example":"0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"}],"responses":{"200":{"description":"On-chain facts for the address (paid)"},"400":{"description":"Invalid address"},"402":{"description":"Payment required - $0.001 USDC on Base, x402 exact scheme, payTo 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617"}}}},"/v1/email-check":{"get":{"operationId":"checkEmail","summary":"Email format + MX + disposable check","x-payment-info":{"scheme":"exact","network":"eip155:8453","asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","amount":"1000","payTo":"0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617","description":"$0.001 USDC on Base per call"},"parameters":[{"name":"email","in":"query","required":true,"description":"Email address to validate (format, MX records, disposable-domain check)","schema":{"type":"string","description":"Email address to validate (format, MX records, disposable-domain check)","example":"hello@example.com"},"example":"hello@example.com"}],"responses":{"200":{"description":"Email validation result (paid)"},"400":{"description":"Invalid email"},"402":{"description":"Payment required - $0.001 USDC on Base"}}}},"/v1/ip-lookup":{"get":{"operationId":"lookupIp","summary":"IP geolocation: country, city, ASN, ISP, timezone","x-payment-info":{"scheme":"exact","network":"eip155:8453","asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","amount":"1000","payTo":"0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617","description":"$0.001 USDC on Base per call"},"parameters":[{"name":"ip","in":"query","required":true,"description":"IPv4 or IPv6 address to look up (country, city, ASN, ISP, timezone)","schema":{"type":"string","description":"IPv4 or IPv6 address to look up (country, city, ASN, ISP, timezone)","example":"8.8.8.8"},"example":"8.8.8.8"}],"responses":{"200":{"description":"IP geolocation result (paid)"},"400":{"description":"Invalid IP"},"402":{"description":"Payment required - $0.001 USDC on Base"}}}},"/v1/whois":{"get":{"operationId":"lookupWhois","summary":"Domain WHOIS via RDAP: age, registrar, expiry, nameservers","x-payment-info":{"scheme":"exact","network":"eip155:8453","asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","amount":"1000","payTo":"0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617","description":"$0.001 USDC on Base per call"},"parameters":[{"name":"domain","in":"query","required":true,"description":"Domain name to look up via RDAP (age, registrar, expiry, nameservers)","schema":{"type":"string","description":"Domain name to look up via RDAP (age, registrar, expiry, nameservers)","example":"example.com"},"example":"example.com"}],"responses":{"200":{"description":"Domain WHOIS result (paid)"},"400":{"description":"Invalid domain"},"402":{"description":"Payment required - $0.001 USDC on Base"}}}},"/v1/qr":{"get":{"operationId":"generateQr","summary":"QR code PNG generator","x-payment-info":{"scheme":"exact","network":"eip155:8453","asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","amount":"1000","payTo":"0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617","description":"$0.001 USDC on Base per call"},"parameters":[{"name":"text","in":"query","required":true,"description":"Text to encode into the QR code PNG","schema":{"type":"string","description":"Text to encode into the QR code PNG","example":"hello"},"example":"hello"},{"name":"size","in":"query","required":false,"description":"QR image size in pixels, e.g. 200x200 (default 200x200, max 1000)","schema":{"type":"string","description":"QR image size in pixels, e.g. 200x200 (default 200x200, max 1000)","example":"200x200"},"example":"200x200"}],"responses":{"200":{"description":"QR code PNG image (paid)","content":{"image/png":{"schema":{"type":"string","format":"binary"}}}},"400":{"description":"Missing text param"},"402":{"description":"Payment required - $0.001 USDC on Base"}}}}}};

// Shared CSS for the HTML pages (landing + route detail).
const PAGE_CSS = `*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#0f1115;color:#e8eaf0;line-height:1.6}
a{color:#f0b90b;text-decoration:none}
a:hover{text-decoration:underline}
nav{position:sticky;top:0;background:#12141c;border-bottom:1px solid #262a38;z-index:10}
nav .nav-in{max-width:860px;margin:0 auto;padding:12px 20px;display:flex;gap:22px;align-items:center;flex-wrap:wrap}
nav .brand{font-weight:800;color:#fff;font-size:16px}
nav .brand span{color:#f0b90b}
nav a{font-size:14px;color:#b8bcc9}
nav a:hover{color:#f0b90b}
.wrap{max-width:860px;margin:0 auto;padding:0 20px 60px}
.hero{background:linear-gradient(135deg,#1a1d27 0%,#12141c 100%);border-bottom:3px solid #f0b90b;padding:56px 20px 44px;text-align:center}
.hero h1{font-size:38px;font-weight:800;letter-spacing:-.5px;color:#fff}
.hero h1 span{color:#f0b90b}
.hero p{font-size:18px;color:#b8bcc9;max-width:560px;margin:14px auto 0}
.badges{margin-top:22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.badge{background:#1e2230;border:1px solid #2e3347;color:#e8eaf0;padding:6px 14px;border-radius:999px;font-size:14px;font-weight:600}
.badge.gold{background:#f0b90b;border-color:#f0b90b;color:#111}
h1.page{font-size:30px;color:#fff;margin:32px 0 8px}
h2{font-size:22px;color:#fff;margin:44px 0 16px;padding-bottom:8px;border-bottom:1px solid #2e3347}
.steps{list-style:none;counter-reset:step;display:grid;gap:12px}
.steps li{counter-increment:step;background:#171a22;border:1px solid #262a38;border-radius:12px;padding:16px 18px 16px 56px;position:relative}
.steps li::before{content:counter(step);position:absolute;left:16px;top:16px;width:28px;height:28px;border-radius:50%;background:#f0b90b;color:#111;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center}
.steps code,code.inline{background:#232736;padding:2px 6px;border-radius:5px;font-size:13px;color:#ffd75e}
pre{background:#0a0c10;border:1px solid #262a38;border-radius:12px;padding:16px 18px;overflow-x:auto;margin-top:14px}
pre code{background:none;color:#9be3a8;font-size:14px;padding:0}
.note{color:#9aa0b4;font-size:14px;margin-top:12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:640px){.grid{grid-template-columns:1fr}.hero h1{font-size:30px}}
.card{display:block;background:#171a22;border:1px solid #262a38;border-radius:12px;padding:16px 18px;transition:border-color .15s,transform .15s}
.card:hover{border-color:#f0b90b;transform:translateY(-2px);text-decoration:none}
.card-route{display:flex;justify-content:space-between;align-items:center;gap:10px}
.card-route code{background:#232736;color:#ffd75e;padding:3px 8px;border-radius:6px;font-size:14px}
.price{background:#f0b90b;color:#111;font-weight:800;font-size:13px;padding:3px 10px;border-radius:999px;white-space:nowrap}
.card-desc{color:#b8bcc9;font-size:14px;margin-top:10px}
.card-try{color:#f0b90b;font-size:13px;font-weight:700;margin-top:10px}
.pay{background:#171a22;border:1px solid #262a38;border-radius:12px;padding:18px 20px}
.pay code{background:#232736;color:#ffd75e;padding:2px 6px;border-radius:5px;font-size:13px;word-break:break-all}
footer{margin-top:48px;text-align:center;color:#6b7080;font-size:14px}
footer a{color:#9aa0b4;margin:0 8px}
.back{margin-top:28px;display:inline-block}`;

function navBar() {
  return `<nav><div class="nav-in"><a class="brand" href="/">BSC Agent <span>Utilities</span></a><a href="/#how">How to use</a><a href="/#routes">Routes</a><a href="/#payment">Payment</a><a href="/health">Health</a><a href="/openapi.json">OpenAPI</a><a href="/llms.txt">llms.txt</a></div></nav>`;
}

function pageFoot() {
  return `<footer><a href="/health">Health</a> &middot; <a href="/openapi.json">OpenAPI</a> &middot; <a href="/.well-known/x402">x402 discovery</a> &middot; <a href="/llms.txt">llms.txt</a> &middot; <a href="/?format=json">JSON version</a></footer>`;
}

// HTML landing page for humans (browsers). API clients asking for JSON still get INFO.
function landingPage() {
  const cards = Object.entries(ROUTES).map(([p, r]) => {
    return `<a class="card" href="${p}"><div class="card-route"><code>${p}</code><span class="price">$${r.usd}</span></div><div class="card-desc">${r.desc}</div><div class="card-try">View details &rarr;</div></a>`;
  }).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BSC Agent Utilities — $0.001/call APIs, no API key</title>
<style>${PAGE_CSS}</style>
</head>
<body>
${navBar()}
<header class="hero">
<h1>BSC Agent <span>Utilities</span></h1>
<p>8 pay-per-call utility APIs for AI agents. Cheap lookups, no signup, no API key — just call, pay $0.001, get the data.</p>
<div class="badges">
<span class="badge gold">$0.001 / call</span>
<span class="badge">USDC on Base</span>
<span class="badge">x402 v2</span>
<span class="badge">No API key</span>
</div>
</header>
<main class="wrap">

<h2 id="how">How to use</h2>
<ol class="steps">
<li>Call any <code class="inline">/v1/*</code> route, e.g. <code class="inline">curl https://satscribe.pages.dev/v1/gas</code></li>
<li>You get <b>HTTP 402 Payment Required</b> with the payment details ($0.001 USDC on Base, payTo address, 300s timeout).</li>
<li>Pay $0.001 USDC on Base to the payTo address — use an x402 client library like <code class="inline">x402-fetch</code> / <code class="inline">x402-axios</code>, or sign the payment yourself.</li>
<li>Retry the same request with header <code class="inline">X-PAYMENT: &lt;base64 payment payload&gt;</code> — you get HTTP 200 with the data.</li>
</ol>
<pre><code>curl https://satscribe.pages.dev/v1/gas</code></pre>
<p class="note">Zero calls = $0. x402 client libraries handle steps 2–4 automatically.</p>

<h2 id="routes">Routes — $0.001 each</h2>
<div class="grid">
${cards}
</div>

<h2 id="payment">Payment</h2>
<div class="pay">
<p>x402 v2, exact scheme, USDC on Base (<code class="inline">eip155:8453</code>).</p>
<p style="margin-top:8px">Pay to: <code class="inline">${PAY_TO}</code></p>
</div>

${pageFoot()}
</main>
</body>
</html>`;
}

// HTML detail page for one route (browsers). API clients still get the 402/data flow.
function routePage(path) {
  const r = ROUTES[path];
  if (!r) return null;
  const ex = INFO.examples.find((e) => e === path || e.startsWith(path + "?")) || path;
  const full = `https://satscribe.pages.dev${ex}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${path} — BSC Agent Utilities</title>
<style>${PAGE_CSS}</style>
</head>
<body>
${navBar()}
<main class="wrap">
<a class="back" href="/">&larr; All routes</a>
<h1 class="page"><code class="inline">${path}</code></h1>
<p style="color:#b8bcc9;font-size:17px">${r.desc}</p>
<div class="badges" style="justify-content:flex-start;margin-top:16px">
<span class="badge gold">$${r.usd} / call</span>
<span class="badge">USDC on Base</span>
<span class="badge">x402 v2</span>
</div>

<h2>Example</h2>
<pre><code>curl ${full}</code></pre>
<p class="note">Clicking this link in a browser shows this page. Calling it from code returns HTTP 402 first — pay, then retry with the X-PAYMENT header to get the data.</p>

<h2>How to call</h2>
<ol class="steps">
<li>Call <code class="inline">${path}</code> — you get <b>HTTP 402 Payment Required</b> with the payment details ($0.001 USDC on Base, payTo address, 300s timeout).</li>
<li>Pay $0.001 USDC on Base to the payTo address — use an x402 client library like <code class="inline">x402-fetch</code> / <code class="inline">x402-axios</code>, or sign the payment yourself.</li>
<li>Retry the same request with header <code class="inline">X-PAYMENT: &lt;base64 payment payload&gt;</code> — you get HTTP 200 with the data.</li>
</ol>

<h2>Payment</h2>
<div class="pay">
<p>x402 v2, exact scheme, USDC on Base (<code class="inline">eip155:8453</code>).</p>
<p style="margin-top:8px">Pay to: <code class="inline">${PAY_TO}</code></p>
</div>

${pageFoot()}
</main>
</body>
</html>`;
}
// Cloudflare Workers entry — same API, same x402 logic. Deploy with wrangler.
export default {
  async fetch(req) {
    const url = new URL(req.url);
    const send = (r) => new Response(r.body, { status: r.status, headers: { ...r.headers, "Access-Control-Allow-Origin": "*" } });
    try {
      if (url.pathname === "/") {
        const accept = req.headers.get("accept") || "";
        if (accept.includes("application/json") || url.searchParams.get("format") === "json") return send({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(INFO, null, 2) });
        return send({ status: 200, headers: { "Content-Type": "text/html; charset=utf-8" }, body: landingPage() });
      }
      if (url.pathname === "/health") return send({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, routes: Object.fromEntries(Object.entries(ROUTES).map(([p, r]) => [p, `$${r.usd}`])) }) });
      if (url.pathname === "/openapi.json") return send({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(openapi, null, 2) });
      if (url.pathname === "/.well-known/x402") { const c = challenge402(`${url.origin}/v1/gas`, ROUTES["/v1/gas"]); return send({ status: 200, headers: { "Content-Type": "application/json" }, body: c.body }); }
      if (url.pathname === "/favicon.ico") return send({ status: 200, headers: { "Content-Type": "image/svg+xml" }, body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#f0b90b"/><text x="32" y="45" font-size="36" text-anchor="middle" font-family="sans-serif" font-weight="bold" fill="#111">B</text></svg>' });
      if (url.pathname === "/llms.txt") return send({ status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" }, body: LLMS_TXT });
      const route = ROUTES[url.pathname];
      if (route) {
        const accept = req.headers.get("accept") || "";
        if (accept.includes("text/html")) {
          const html = routePage(url.pathname);
          if (html) return send({ status: 200, headers: { "Content-Type": "text/html; charset=utf-8" }, body: html });
        }
        const headers = {}; req.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
        const full = `${url.origin}${url.pathname}${url.search}`;
        if (url.pathname === "/v1/gas") return send(await handlePaidRequest(full, route, headers, gasCheck));
        if (url.pathname === "/v1/token-price") {
          const address = url.searchParams.get("address");
          return send(await handlePaidRequest(full, route, headers, () => tokenPrice(address)));
        }
        if (url.pathname === "/v1/tx") {
          const hash = url.searchParams.get("hash");
          return send(await handlePaidRequest(full, route, headers, () => txStatus(hash)));
        }
        if (url.pathname === "/v1/contract-check") {
          const address = url.searchParams.get("address");
          return send(await handlePaidRequest(full, route, headers, () => contractCheck(address)));
        }
        if (url.pathname === "/v1/email-check") {
          const email = url.searchParams.get("email");
          return send(await handlePaidRequest(full, route, headers, () => emailCheck(email)));
        }
        if (url.pathname === "/v1/ip-lookup") {
          const ip = url.searchParams.get("ip");
          return send(await handlePaidRequest(full, route, headers, () => ipLookup(ip)));
        }
        if (url.pathname === "/v1/whois") {
          const domain = url.searchParams.get("domain");
          return send(await handlePaidRequest(full, route, headers, () => whoisLookup(domain)));
        }
        if (url.pathname === "/v1/qr") {
          const text = url.searchParams.get("text");
          const size = url.searchParams.get("size");
          return send(await handlePaidRequest(full, route, headers, () => qrCode(text, size)));
        }
      }
      return send({ status: 404, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "not_found" }) });
    } catch (e) {
      return send({ status: e.status || 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: String(e.message || e) }) });
    }
  },
};
