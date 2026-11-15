# BSC Agent Utilities

**8 pay-per-call utility APIs for AI agents on BNB Smart Chain — $0.001 USDC per call, no API key, no account, no signup.**

Live: **https://bsc-agent-utilities.raninndia.workers.dev**
Mirror: https://satscribe.pages.dev · Health: [/health](https://bsc-agent-utilities.raninndia.workers.dev/health) · Spec: [/openapi.json](https://bsc-agent-utilities.raninndia.workers.dev/openapi.json) · Machine-readable: [/llms.txt](https://bsc-agent-utilities.raninndia.workers.dev/llms.txt)

## What this is — and what it is not

**This is an API utility service that agents call, not an autonomous agent.**
It does not decide anything, hold funds, sign transactions, or act on its own. An agent
calls it to check facts *before* it acts — gas price, token price, transaction status,
whether a contract looks odd — and then the agent decides for itself.

If you are looking for an autonomous agent, this is not it. What it is: the cheap,
boring plumbing that makes an agent's preflight checks verifiable and repeatable.

## Routes — $0.001 each, flat

All paid routes are `GET`, all cost **$0.001 USDC on Base (eip155:8453)** per call,
paid via [x402 v2](https://www.x402.org/) (`exact` scheme, amount `1000` = $0.001 in
USDC's 6 decimals).

| Route | Price | What it returns |
|---|---|---|
| `GET /v1/gas` | $0.001 | BSC gas price (gwei), latest block, tx cost in BNB for 21k / 100k / 300k gas, BNB/USD |
| `GET /v1/token-price?address=0x…` | $0.001 | Token price, market cap, FDV, liquidity, 24h volume & change (DexScreener, BSC-first) |
| `GET /v1/tx?hash=0x…` | $0.001 | Tx status (success / failed / pending), block, confirmations, gas used, gas price |
| `GET /v1/contract-check?address=0x…` | $0.001 | On-chain facts: has code, name, symbol, decimals, totalSupply, owner, paused, flags |
| `GET /v1/email-check?email=a@b.com` | $0.001 | Format + MX record + disposable-domain check (catch-all is *not* checked) |
| `GET /v1/ip-lookup?ip=8.8.8.8` | $0.001 | IP geolocation: country, city, ASN, ISP, timezone |
| `GET /v1/whois?domain=example.com` | $0.001 | Domain age, registrar, expiry, nameservers (via RDAP) |
| `GET /v1/qr?text=hello&size=200x200` | $0.001 | QR code as a PNG image (`image/png`, 50–1000 px per side, default 200×200) |

Free routes: `/` (landing page / JSON info), `/health`, `/openapi.json`,
`/.well-known/x402`, `/llms.txt`, `/favicon.ico`.

## How to use

```bash
# 1. Free health check — no payment, always 200 when up:
curl https://bsc-agent-utilities.raninndia.workers.dev/health
# {"ok":true,"routes":{"/v1/gas":"$0.001", ... }}

# 2. Any paid route without payment returns HTTP 402 with the payment terms:
curl https://bsc-agent-utilities.raninndia.workers.dev/v1/gas
# HTTP 402 Payment Required
# {"error":"payment_required","x402Version":2,
#  "accepts":[{"scheme":"exact","network":"eip155:8453","amount":"1000",
#  "asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
#  "payTo":"0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617",
#  "maxTimeoutSeconds":300,"extra":{"name":"USD Coin","version":"2"}}], ...}
```

1. Call any `/v1/*` route. You get **HTTP 402** with the payment details
   ($0.001 USDC on Base, payTo address, 300s timeout).
2. Pay $0.001 USDC on Base to the payTo address — easiest with an x402 client
   library (`x402-fetch` / `x402-axios`), which handles the signing for you.
   Or sign the payment yourself (EIP-3009 authorization) and send it in the
   `X-PAYMENT` header as a base64 JSON payload.
3. Retry the same request with header `X-PAYMENT: <base64 payment payload>` —
   you get **HTTP 200** with the data, plus a `X-PAYMENT-RESPONSE` header
   containing the settlement receipt (tx hash on Base).

No API key, no account, no signup. Zero calls = $0.

See [`examples/curl-examples.md`](examples/curl-examples.md) for a per-route example
(free endpoints shown with real output; paid endpoints shown as the 402 they return
unpaid — no payment is made in the examples).

## How it works

- **Payment:** x402 v2, `exact` scheme. The server never holds or moves funds —
  the buyer's signed USDC authorization is verified and settled on Base by a
  facilitator (primary: `facilitator.xpay.sh`, free, gas-sponsored; fallback:
  `pay.neuronto.com`). Payment is checked **before** parameter validation, so a
  call without payment always gets 402, never 400.
- **Data sources:** public BSC RPC endpoints + DexScreener public API only.
  No API keys anywhere in the stack. Email MX via Google DNS-over-HTTPS;
  IP geolocation via ipwho.is with an ip-api.com fallback; WHOIS via IANA RDAP
  bootstrap; QR via api.qrserver.com.
- **Runtime:** dependency-free JavaScript (Node 18+ / Cloudflare Workers).
  The deployed code is [`worker-combined.mjs`](worker-combined.mjs) — a single
  self-contained module (routes + HTML landing pages + embedded OpenAPI + `/llms.txt`).
- **Deployment:** Cloudflare Workers (live since 6 Nov 2026) + a Cloudflare Pages
  mirror (`satscribe.pages.dev`, same code as `_worker.js`, see `pages/`).

## Honest limitations

- **Not an autonomous agent.** It answers lookup questions; it does not plan,
  decide, or execute. Any "agent" behaviour lives in the caller.
- **No zkVerify integration (yet).** Nothing here is proven on zkVerify today.
  A verifiable-proof layer for the facts returned is future work, not a shipped feature.
- **Answers are best-effort lookups, not guarantees.** `contract-check` reports
  on-chain facts only — a contract can pass every check and still be worthless.
  `email-check` does not verify catch-all mailboxes. The IP fallback is rate-limited
  (45 req/min). Upstream APIs (DexScreener, BSC RPC, RDAP) can be slow or down;
  the worker returns 502 in that case.
- **No revenue claims.** Pay-per-call means $0 until a first paying caller.
  PayAPI does not publish per-listing sales, so there is no sales figure to quote.
  The listing "BSC Agent Utilities" was submitted to PayAPI Market on 7 Nov 2026
  (4 original routes) and was pending review at last check; the 4 newer routes are
  live on the endpoint but were not in that listing submission.
- **Price history:** `contract-check` was $0.002 in v1; all 8 routes are $0.001
  flat since v2 (7 Nov 2026).
- **Repo notes:** `server.mjs` / `worker.mjs` + `api.mjs` are the older v1 core
  (4 routes, `contract-check` $0.002) kept for reference — they are *not* the
  deployed code. `wrangler.toml` still points at `worker.mjs`; do not redeploy via
  `wrangler deploy` until its `main` is updated to `worker-combined.mjs`.
  Deploy the live code with the scripts in `pages/` (Cloudflare API / Pages)
  or by uploading `worker-combined.mjs` as a Worker.

## Run it yourself

```bash
# Local Node server (older 4-route core, see note above — for reference only)
node server.mjs          # listens on :8787 (PORT env)

# Tests (dev-only; needs npm install for ethers)
npm install
node test-new-routes.mjs # checks all 8 routes return 402 without payment
```

Deploy the live 8-route worker: upload `worker-combined.mjs` as a Cloudflare
Worker, or use `pages/deploy-pages-satscribe.py` for the Pages mirror. No secrets
are needed in this repo — there are no API keys, tokens, or private keys here.
The only address in the code is the public USDC payout address above.

## Repo map

| File | What it is |
|---|---|
| `worker-combined.mjs` | **Deployed code** — all 8 routes, x402 flow, HTML pages, embedded OpenAPI |
| `openapi.json` | OpenAPI 3.1 spec — byte-identical to the live `/openapi.json` (verified 15 Nov 2026) |
| `api.mjs` | Older v1 core (4 routes) used by `server.mjs` / `worker.mjs` |
| `server.mjs` | Node HTTP server (v1 core) |
| `worker.mjs` / `wrangler.toml` | Cloudflare Workers entry (v1 core) + config |
| `worker-sw.mjs` | Earlier service-worker-style entry (superseded) |
| `Dockerfile` | `node:24-alpine` image (build not validated in this VM) |
| `examples/curl-examples.md` | Per-route curl examples |
| `test-*.mjs` | Test scripts (402 checks, facilitator checks, paid-path checks) |
| `STATUS.md` | Build log: market research, deploy history, verification notes |
| `directories-*.md` | x402 directory listings (Agent402, 402index.io, x402scan) |
| `show-hn-draft.md` | Draft launch post |

## Contact

BSC Agent Utilities — contact: raninndia@gmail.com · OpenAPI: `/openapi.json` ·
Discovery: `/.well-known/x402`
