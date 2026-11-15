# curl examples — BSC Agent Utilities

Base URL: `https://bsc-agent-utilities.raninndia.workers.dev`
(mirror: `https://satscribe.pages.dev` — same code.)

**Verified fresh 15 Nov 2026 ~02:23 WIB:** all 8 paid routes return **402**
without payment; `/health`, `/openapi.json`, `/.well-known/x402`, `/llms.txt`,
`/` return **200**. No payment was made for these examples — paid endpoints are
shown as the `402 Payment Required` they return unpaid.

## Free — no payment

### Health check

```bash
curl https://bsc-agent-utilities.raninndia.workers.dev/health
```

```json
{"ok":true,"routes":{"/v1/gas":"$0.001","/v1/token-price":"$0.001","/v1/tx":"$0.001","/v1/contract-check":"$0.001","/v1/email-check":"$0.001","/v1/ip-lookup":"$0.001","/v1/whois":"$0.001","/v1/qr":"$0.001"}}
```

### OpenAPI spec / discovery / docs

```bash
curl https://bsc-agent-utilities.raninndia.workers.dev/openapi.json   # 200, 9 paths (8 paid + /health)
curl https://bsc-agent-utilities.raninndia.workers.dev/.well-known/x402
curl https://bsc-agent-utilities.raninndia.workers.dev/llms.txt
curl https://bsc-agent-utilities.raninndia.workers.dev/               # HTML landing page in a browser, JSON with Accept: application/json
```

## Paid — $0.001 USDC on Base per call (x402 v2)

Every paid call works the same way:

1. Call the route → **402** with the payment terms in the body and in the
   `PAYMENT-REQUIRED` / `X-PAYMENT-REQUIRED` headers (base64).
2. Pay **$0.001 USDC on Base** (`eip155:8453`, asset
   `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) to
   `0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617`, timeout 300s.
   Easiest via an x402 client library (`x402-fetch` / `x402-axios`).
3. Retry with header `X-PAYMENT: <base64 payment payload>` → **200** + data.

### What the 402 looks like (real response, `/v1/gas`, 15 Nov 2026)

```bash
curl -i https://bsc-agent-utilities.raninndia.workers.dev/v1/gas
# HTTP/1.1 402 Payment Required
# Cache-Control: no-store
# PAYMENT-REQUIRED: eyJ4NDAyVmVyc2lvbiI6Mi... (base64, decodes to the JSON below)
# X-PAYMENT-REQUIRED: eyJzY2hlbWUiOiJleGFjdCIs... (base64)
#
# {
#   "error": "payment_required",
#   "x402Version": 2,
#   "accepts": [{
#     "scheme": "exact", "network": "eip155:8453", "amount": "1000",
#     "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
#     "payTo": "0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617",
#     "maxTimeoutSeconds": 300,
#     "extra": { "name": "USD Coin", "version": "2" }
#   }],
#   "resource": {
#     "url": "https://bsc-agent-utilities.raninndia.workers.dev/v1/gas",
#     "description": "BSC gas price + latest block + tx cost in BNB (pollable). $0.001 USDC on Base per call."
#   }
# }
```

The `accepts[0]` block is identical on all 8 routes (same amount, asset, payTo,
network) — only the `resource.url` / `resource.description` change.

### Per-route requests (all return 402 unpaid — verified 15 Nov 2026)

```bash
# Gas price + latest block (no params — pollable)
curl https://bsc-agent-utilities.raninndia.workers.dev/v1/gas

# Token price — WBNB as example
curl "https://bsc-agent-utilities.raninndia.workers.dev/v1/token-price?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"

# Transaction status by hash
curl "https://bsc-agent-utilities.raninndia.workers.dev/v1/tx?hash=0x3e1f4bd9f197743f2a5fcd4a9cd6c0dbdc5517aedb0cd1dcb9b839f57b72c717"

# Contract safety check — WBNB as example
curl "https://bsc-agent-utilities.raninndia.workers.dev/v1/contract-check?address=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"

# Email validation
curl "https://bsc-agent-utilities.raninndia.workers.dev/v1/email-check?email=hello@example.com"

# IP geolocation
curl "https://bsc-agent-utilities.raninndia.workers.dev/v1/ip-lookup?ip=8.8.8.8"

# Domain WHOIS
curl "https://bsc-agent-utilities.raninndia.workers.dev/v1/whois?domain=example.com"

# QR code PNG (paid response is image/png, not JSON)
curl "https://bsc-agent-utilities.raninndia.workers.dev/v1/qr?text=hello&size=200x200" --output qr.png
```

### After paying — retry with the payment header

```bash
# <PAYMENT> is the base64 payment payload your x402 client (or your own
# EIP-3009 signature) produces from the 402 response above.
curl -H "X-PAYMENT: <PAYMENT>" \
  https://bsc-agent-utilities.raninndia.workers.dev/v1/gas
# HTTP 200 — data + X-PAYMENT-RESPONSE header with the settlement receipt (Base tx hash)
```

## Notes

- **402 is checked before parameter validation.** A paid route called without
  payment returns 402 even with missing/invalid params. A paid call with
  invalid params (e.g. a malformed address) returns **400 after** payment
  verification — so validate inputs client-side first.
- **No payment = no charge, ever.** All examples above cost $0. A real paid call
  costs exactly $0.001 USDC on Base; there is no subscription and no API key.
- **QR route:** on success the body is a PNG, not JSON. Unpaid it still
  returns the same JSON 402 as the other routes.
- Browser calls: opening a paid route URL in a browser shows the route's HTML
  detail page (with the same curl example), because the worker content-negotiates
  on `Accept: text/html`. API clients (`curl` etc.) get the 402 flow.
