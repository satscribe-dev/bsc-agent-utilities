# FASE 1a — Direktori gratis buat PayAPI "BSC Agent Utilities" — 7 Nov 2026, ~12:30 WIB

Worker: https://bsc-agent-utilities.raninndia.workers.dev — 8 route @ $0,001 USDC (Base, x402 v2),
payTo 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617. OpenAPI: /openapi.json.
Biaya yang keluar: $0. Tidak ada wallet yang di-connect, tidak ada pembayaran apa pun.

## Ringkasan

| Direktori | Hasil |
|---|---|
| Cinderwright Discovery Hub | ✅ BERHASIL — queued, `submission_id: sub_1794028652595` (HTTP 200) |
| x402Scout | ❌ GAGAL — situs mati, 503 "Service Suspended by its owner" |
| awesome-x402 (PR GitHub) | ⏸️ MENTOK — tidak ada akun/token GitHub di mesin ini; patch siap tempel di bawah |
| gold-402 (PR GitHub) | ⏸️ MENTOK — sama; patch siap tempel di bawah |
| nohumans.directory / x402-list.com | ⛔ TIDAK disentuh (berbayar, dilarang tanpa izin) |

## 1. Cinderwright — BERHASIL ✅

- Submit: `POST https://api.ideafactorylab.org/submit` body `{"url":"https://bsc-agent-utilities.raninndia.workers.dev"}`.
- Response HTTP 200:
  `{"status":"queued","submission_id":"sub_1794028652595","message":"Submitted. Verified within 24 hours. Crawler checks /.well-known/mcp.json and x402 402 responses.","hub":"Cinderwright Discovery Hub v1.0"}`
- Readback langsung sesudah submit: `GET /discover?q=bsc-agent-utilities` → `total: 0` — WAJAR,
  crawler baru verifikasi dalam 24 jam (sesuai message). Cek ulang besok: search "bsc-agent-utilities"
  di `https://api.ideafactorylab.org/discover?q=bsc-agent-utilities`.
- Bukti worker live saat submit: `/health` 200, `/.well-known/x402` 200 (challenge x402 v2 valid,
  $0,001 USDC Base, payTo 0x3B5e…5617), `/openapi.json` 200 (8 route `/v1/*`),
  `GET /v1/gas` tanpa bayar → HTTP 402 `payment_required` (bukti 402 live).

## 2. x402Scout — GAGAL (situs mati) ❌

- `POST https://x402scout.com/register` `{"url":"https://bsc-agent-utilities.raninndia.workers.dev","category":"utility","name":"BSC Agent Utilities"}` → **HTTP 503**, body HTML: "This service has been suspended by its owner."
- Dikonfirmasi 2 cara: `GET https://x402scout.com/catalog?limit=1` → 503 juga; API backend alternatif
  `POST https://x402-discovery-api.onrender.com/register` (payload lengkap incl. wallet_address) → 503 sama.
- Cocok dengan catatan SSDF 2026-09-08: "owner-suspended on Render. Skip until it answers."
  Jadi BUKAN salah payload — layanannya memang dimatikan pemiliknya. Tidak ada jalur daftar lain yang gratis;
  jangan retry sebelum situsnya hidup lagi.

## 3. PR GitHub — MENTOK di auth, patch sudah siap ⏸️

- `gh auth status` → "You are not logged into any GitHub hosts." Tidak ada `GH_TOKEN`/`GITHUB_TOKEN`
  di environment, tidak ada `~/.git-credentials` / `~/.netrc`. Jadi PR tidak bisa dibuka dari mesin ini.
- Yang dibutuhkan parent/user: login GitHub (akun siapa pun) lalu `gh auth login`, atau buka PR manual
  di github.com dengan patch di bawah (fork → edit 1 baris → PR). Tanpa itu tidak bisa lanjut.
- KOREKSI terhadap file hunt v11: repo yang disebut di sana adalah fork basi, PR harus ke upstream yang hidup:
  - awesome-x402: `krystiangw/awesome-x402` (fork, last push 2026-05-01, 1★) → upstream **`xpaysh/awesome-x402`** (301★, last push 2026-07-28, PR #1020 merged Jul 2026).
  - gold-402: `TariffMonkee/gold-402` (fork, last push 2026-08-30, 1★) → upstream **`Haustorium12/gold-402`** (12★, 286 fork, last push 2026-11-07 hari ini; CONTRIBUTING.md-nya sendiri mengarah ke Haustorium12).
- Dicek: "BSC Agent Utilities" BELUM terdaftar di kedua upstream (grep 0 hasil).

### Patch A — gold-402 (upstream Haustorium12/gold-402)

File: `directory/apis.md`, tambahkan di AKHIR section `## Crypto & DeFi Data`
(setelah baris `[Momentum Brief]` dan sebelum `## Finance & FX`).

```markdown
- [BSC Agent Utilities](https://bsc-agent-utilities.raninndia.workers.dev) — 8 pay-per-call utility APIs for AI agents at $0.001 USDC per call on Base via x402 v2, no API key: BSC gas price, token price, tx status, contract safety check, email check, IP lookup, WHOIS, and QR code. Example: `GET /v1/gas`. ([OpenAPI](https://bsc-agent-utilities.raninndia.workers.dev/openapi.json)) ([Discovery](https://bsc-agent-utilities.raninndia.workers.dev/.well-known/x402))
```

Judul PR: `Add BSC Agent Utilities`
Badan PR:
```
Add BSC Agent Utilities — 8 pay-per-call utility APIs ($0.001 USDC/call on Base, x402 v2, no API key).

Live 402 proof: GET https://bsc-agent-utilities.raninndia.workers.dev/v1/gas returns HTTP 402 with a valid x402 v2 challenge (USDC on Base, payTo 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617).
Manifest: https://bsc-agent-utilities.raninndia.workers.dev/.well-known/x402
OpenAPI: https://bsc-agent-utilities.raninndia.workers.dev/openapi.json

Example: GET /v1/gas

Contact: raninndia@gmail.com
```

### Patch B — awesome-x402 (upstream xpaysh/awesome-x402)

File: `README.md`, tambahkan di AKHIR section `### Data & Social APIs`
(setelah baris `[modelprices.xyz]` dan sebelum `### Games & On-Chain Apps`).

```markdown
- [BSC Agent Utilities](https://bsc-agent-utilities.raninndia.workers.dev) - 8 pay-per-call utility APIs for AI agents at $0.001 USDC per call on Base via x402 v2, no API key: BSC gas price, token price, tx status, contract safety check, email check, IP lookup, WHOIS, and QR code. ([OpenAPI](https://bsc-agent-utilities.raninndia.workers.dev/openapi.json) | [Discovery](https://bsc-agent-utilities.raninndia.workers.dev/.well-known/x402))
```

Judul PR: `Add BSC Agent Utilities`
Badan PR:
```
Add BSC Agent Utilities — 8 pay-per-call utility APIs ($0.001 USDC/call on Base, x402 v2, no API key): BSC gas, token price, tx status, contract check, email check, IP lookup, WHOIS, QR.

Live 402 proof: GET https://bsc-agent-utilities.raninndia.workers.dev/v1/gas returns HTTP 402 with a valid x402 v2 challenge. Manifest: /.well-known/x402, OpenAPI: /openapi.json.
```

## Yang TIDAK dilakukan

- nohumans.directory ($0,25) dan x402-list.com ($1): tidak disentuh, sesuai larangan.
- Tidak connect wallet apa pun; alamat payout 0x3B5e…5617 hanya dipakai sebagai teks di payload
  register x402Scout (gagal karena situs mati, bukan karena wallet).
- Tidak ada platform baru lain yang dicari — sesuai tugas, ini cuma gedein aset yang sudah ada.

## Tindak lanjut

1. Besok (±24 jam): cek Cinderwright readback `GET /discover?q=bsc-agent-utilities` — harusnya muncul.
2. PR GitHub: butuh akun/token GitHub user (atau parent yang login) — patch di atas tinggal tempel.
3. x402Scout: cek lagi berkala apakah situsnya hidup; sementara tidak ada yang bisa dilakukan.

## Verifikasi ulang 12:24 WIB (subagent, tanpa browser)
- Worker masih live: /health 200, /.well-known/x402 200, GET /v1/gas tanpa bayar → 402.
- Upstream masih hidup: xpaysh/awesome-x402 (301★, last push 2026-07-28), Haustorium12/gold-402 (12★, last push 2026-11-07).
- "BSC Agent Utilities" BELUM terdaftar di kedua upstream (grep raw file = 0 hasil). Section tujuan terkonfirmasi: awesome-x402 `### Data & Social APIs` (README.md), gold-402 `## Crypto & DeFi Data` (directory/apis.md).
- PR GitHub MASIH MENTOK — butuh browser task (login GitHub tersimpan di profil browser) untuk fork → tempel patch → buka PR. Patch di §3 di atas siap pakai.

## 4. Show HN — RISET + DRAF SELESAI, BELUM DIPOSTING (7 Nov 2026 ~15:25 WIB)

- Draf lengkap: `~/workspace/payapi-20261106/show-hn-draft.md` (judul + URL submit + komentar pertama + aturan + langkah browser parent).
- Judul: `Show HN: 8 utility APIs at $0.001/call, no API key, paid in USDC via x402` (73 karakter, diverifikasi python).
- URL submit: `https://bsc-agent-utilities.raninndia.workers.dev` (link langsung ke worker).
- Verifikasi endpoint segar 15:22 WIB: `/v1/gas` → 402 (x402 v2, amount 1000, payTo 0x3B5e…5617), `/openapi.json` → 200, `/.well-known/x402` → 200, `/health` → 200 (8 route $0,001). Listing PayAPI masih Pending review.
- Akun HN `satscribe`: **BELUM terverifikasi** — fetch teks `https://news.ycombinator.com/user?id=satscribe` gagal HTTP 419 (15:22 WIB). Parent harus cek via browser; kalau belum ada, signup pakai email raninndia@gmail.com + password patokan (Secure Vault), username satscribe.
- Aturan inti (showhn.html resmi): hanya untuk karya sendiri yang bisa dicoba langsung; judul diawali "Show HN"; tanpa bahasa marketing; jangan minta upvote; pembuat harus ada di thread; jangan delete + repost kalau sepi.
- Contoh yang dipelajari: ClawRouter (judul jelas + masalah pribadi + cara kerja teknis + ajakan tanya jawab), Armalo AI (x402 $0,001/score lookup, harga jujur, follow-up seminggu kemudian), Marimo (448 poin, pain point universal, launch berulang dengan hal baru).
- Rekomendasi waktu: **Senin 9 Nov / Selasa 10 Nov, 22:00–01:00 WIB** (= 7–10 pagi Pasifik AS), saat user bisa di thread ~6 jam. Hari ini Sabtu — bukan waktu terbaik.
- Peringatan: (1) route berbayar butuh wallet Base + USDC — barrier coba; penawarnya 402 gratis via 1 curl + /openapi.json + /health + /llms.txt gratis; (2) tips resmi HN bilang jangan pakai LLM untuk menulis komentar pertama — user sebaiknya tulis ulang draf dengan kata-katanya sendiri; (3) akun baru tanpa histori = traksi mungkin rendah, jangan pakai akun lain / minta upvote.
- Draf TANPA klaim pengguna/penghasilan/traffic (penghasilan $0), tanpa label "AI agent", tanpa wallet agentic.
- Langkah browser parent ada di § "Langkah browser untuk parent" di file draf. Setelah posting, catat URL thread HN + poin ke STATUS.md.
