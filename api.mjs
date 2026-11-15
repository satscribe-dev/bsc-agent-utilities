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
  "/v1/contract-check": { price: "2000", usd: "0.002", desc: "BSC contract safety check: code, name, symbol, supply, owner, paused, flags" },
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
    if (!verified.isValid) return { status: 402, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "payment_invalid", reason: verified.invalidReason || verified.error || "verification failed" }) };
    const { json: settled } = await facilitator("/settle", { x402Version, paymentPayload, paymentRequirements: requirements });
    if (!(settled.success ?? settled.settled)) return { status: 402, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "payment_settlement_failed", reason: settled.errorReason || settled.error || "settlement failed" }) };
    const data = await runProduct();
    const respB64 = Buffer.from(JSON.stringify(settled)).toString("base64");
    return { status: 200, headers: { "Content-Type": "application/json", "PAYMENT-RESPONSE": respB64, "X-PAYMENT-RESPONSE": respB64 }, body: JSON.stringify({ ...data, payment: { txHash: settled.transaction || settled.txHash || null, amountUsdc: route.usd, network: "Base" } }, null, 2) };
  } catch (e) {
    return { status: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "facilitator_error", detail: String(e.message || e) }) };
  }
}

export const INFO = {
  name: "BSC Agent Utilities",
  description: "Cheap BSC lookups for AI agents, pay per call in USDC on Base via x402, no API key: gas + block tip ($0.001), token price ($0.001), tx status ($0.001), contract safety check ($0.002).",
  payTo: PAY_TO, network: "Base (eip155:8453)", asset: "USDC",
  routes: Object.fromEntries(Object.entries(ROUTES).map(([p, r]) => [p, `$${r.usd} — ${r.desc}`])),
  examples: [
    "/v1/gas",
    "/v1/token-price?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    "/v1/tx?hash=0x3e1f4bd9f197743f2a5fcd4a9cd6c0dbdc5517aedb0cd1dcb9b839f57b72c717",
    "/v1/contract-check?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  ],
  freeRoutes: ["/", "/health", "/openapi.json", "/.well-known/x402"],
};
