# PayAPI Market — BSC Agent Utilities — STATUS (v2)

**Status: API v2 LIVE di Cloudflare Workers (deploy via API 23:56 WIB 2026-11-06). LISTING PayAPI SUDAH DISUBMIT 00:07 WIB 2026-11-07 — Pending review (PayAPI review dalam 24 jam, update via email raninndia@gmail.com).**
- Host publik: https://bsc-agent-utilities.raninndia.workers.dev — /health 200, keempat route unpaid → 402, /openapi.json 200, /.well-known/x402 200 (semua diverifikasi segar 23:56 WIB).
- Payout BARU: 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617 (user 22:04 WIB: JANGAN pakai wallet agentic dompet 1).
- Deploy: via Cloudflare API token (custom.cloudflare, template Edit Cloudflare Workers) + helper ~/workspace/custom-connectors/custom.cloudflare/bin/deploy_worker.py — file worker-combined.mjs, main_module worker.mjs + Content-Type application/javascript+module. Browser paste GAGAL 3x (batas token sesi) — jangan pakai cara itu lagi.
- **UPDATE 00:10 WIB 2026-11-07 — 8 ROUTE LIVE:** tambah 4 route baru (email-check, ip-lookup, whois, qr), SEMUA $0,001 flat (price "1000"), payTo tetap 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617. /health 200 daftar 8 route, /openapi.json 200 (9 paths). Verifikasi live segar: SEMUA 8 route tanpa param → 402 (bukan 400) dan dengan param → 402; header 402 tiap route baru decode amount 1000 + payTo benar. Tes lokal: ~/workspace/payapi-20261106/test-new-routes.mjs (ALL 402 CHECKS PASS).
  - email-check: format + MX via dns.google DoH + daftar disposable 24 domain + catchAll "not_checked" (contoh: hello@example.com hasMx true, x@mailinator.com disposable true).
  - ip-lookup: ipwho.is primer, fallback ip-api.com (45 req/menit) — 8.8.8.8 → US, San Jose, ASN 15169, Google LLC, America/Los_Angeles.
  - whois: RDAP via bootstrap IANA (rdap.org diblokir Cloudflare 403 dari IP data center — jangan pakai langsung) — google.com: created 1997-09-15, expires 2028-09-14, MarkMonitor, umur 10.644 hari; fallback DNS NS kalau RDAP mati.
  - qr: proxy api.qrserver.com, kembalikan PNG asli (347 byte, magic PNG benar), size 50–1000, default 200x200.
  - Perbaikan canary SELESAI: 402 dicek DULU sebelum validasi param di semua 7 route berparam (token-price, tx, contract-check, email-check, ip-lookup, whois, qr) — handlePaidRequest sekarang kembalikan status error runProduct (400) bukan 502; QR didukung via hasil biner (__binary + contentType).
- CATATAN: listing PayAPI yang disubmit cuma berisi 4 route lama (submit 00:07 WIB). 4 route baru BELUM masuk listing — perlu update listing / submit listing kedua setelah review pertama kelar.
- Harga: SEMUA route $0,001 flat (contract-check diturunkan $0,002→$0,001, 00:04 WIB 2026-11-07, karena form PayAPI menolak harga beda) — diverifikasi 402 amount 1000.
- Listing: "BSC Agent Utilities", kategori Data, 4 route, harga flat $0,001, payout 0x3B5e...5617. Belum ada URL publik (marketplace search "No results found" = wajar saat pending). Risiko: canary PayAPI bayar 1x token-price (maks $0,10), URL-nya tampil tanpa query string — kalau dipanggil tanpa ?address= Worker jawab 400 sebelum 402. Perbaikan (402 dulu baru validasi param) sudah diminta ke subagent penambah route (00:07 WIB).

## KEPUTUSAN v2 — kenapa API ini (riset market 6 Nov 2026, dari data katalog PayAPI langsung)

**Jujur dulu: PayAPI TIDAK mempublikasikan volume/penjualan per listing.** Jadi "paling laku" tidak bisa dibuktikan dari angka penjualan — yang bisa diukur adalah proksi: jumlah listing per kategori, klaster harga, listing multi-route, dan skor reliability. Data diambil dari katalog lengkap 1.331 listing terverifikasi (`/agent/list`, 14 halaman).

**Temuan market (segar 6 Nov 2026):**
- Kategori: Data 498 (37%), Tools 371 (28%), Verification 230 (17%), Finance 133 (10%), Intelligence 99 (7%).
- Harga: **$0,001 adalah harga tunggal terbanyak (169 listing)**, lalu $0,002 (141); 686/1.331 (52%) ≤ $0,005. Median per kategori: Tools $0,005, Data $0,008, Finance/Intelligence $0,01.
- **Pola pemenang multi-route:** Agent Utility Network 12 route @ $0,001; Novarithm 7 route @ $0,001; Agent Extraction API ~10 route @ $0,0015–0,005 (gas, harga token, rug check, tx status, tx explain); Kurage FX Brain 4 route @ $0,05; CanonicalHash 4 route @ $0,001. Satu listing, banyak route murah, panggilan berulang.
- **Preflight/verification sebelum agen bertindak = momen niat bayar tertinggi:** MachineMint (Base tx preflight, $0,01, skor 70,3), Butterfly Delta ($0,01, 57,8), Contract Powers ($0,05, 69,8), SanctionsScreen ($0,05, 70,3) — semuanya "established".
- **BSC itu kolam kecil di PayAPI:** search "bsc" cuma 14 match (vs "gas" 38, "token price" 37, "crypto price" 27). "contract check" 19 match, "honeypot" 20, "rug" 17. Tidak ada preflight BSC sama sekali.
- **Pesaing langsung cek kontrak:** ChainVerdict $0,001 ("Pay, Hold or Unknown for any address"), Klowor Token Check $0,005, Agent Extraction rug check $0,005, Token Verdict (Base) $0,01, Base ERC-20 safety verdict $0,10. Harga token: "Currency & Crypto API" $0,001 (established), x402 Crypto Price API $0,001.
- Homepage PayAPI: "An agent does not want to buy the warehouse. It wants one can." — panggilan murah sekali pakai, bukan paket langganan.

**Vonis: cek kontrak BSC saja ($0,005, v1) BUKAN yang paling laku** — kolam BSC kecil + sudah ada pesaing $0,001. Yang paling laku menurut data adalah **bundle utilitas murah multi-route di harga $0,001–0,002, yang dipanggil berulang** (gas/block/harga/tx = polling; cek kontrak = sekali per token). Maka v1 diubah menjadi bundle di bawah — cek kontrak tetap ada sebagai salah satu route, bukan satu-satunya produk.

## Produk v2 — BSC Agent Utilities (1 listing, 4 route)
| Route | Harga | Isi |
|---|---|---|
| `GET /v1/gas` | **$0,001** | Gas price BSC + block terbaru + biaya tx (21k / 100k / 300k gas) dalam BNB + harga BNB/USD — bisa di-polling |
| `GET /v1/token-price?address=` | **$0,001** | Harga token, market cap, FDV, likuiditas, volume 24j, perubahan 24j (DexScreener, BSC-first) |
| `GET /v1/tx?hash=` | **$0,001** | Status tx (success/failed/pending), blok, konfirmasi, gasUsed, gasPrice |
| `GET /v1/contract-check?address=` | **$0,002** | Cek kontrak (v1): code, name, symbol, decimals, totalSupply, owner, paused, flags |

- **Payout wallet:** `0x93fc9d8Ae82cEe78FC224DAf8AD8aA1DeCA62124` (dompet 1, alamat EVM sama di Base; TIDAK ADA dana dikirim, TIDAK ADA private key/seed dipakai atau diminta)
- **Skema:** x402 v2, `exact`, network `eip155:8453` (Base), asset USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, `extra.name = "USD Coin"`
- **Data:** public BSC RPC + DexScreener public API saja (tanpa API key, tanpa Alchemy)
- **Rute gratis:** `/`, `/health`, `/openapi.json`, `/.well-known/x402`

## File
- `~/workspace/payapi-20261106/api.mjs` — core (tanpa dependensi; Node 18+ dan Cloudflare Workers)
- `server.mjs` — server Node (`PORT`, default 8787)
- `worker.mjs` + `wrangler.toml` (`bsc-agent-utilities`) — Cloudflare Workers (`wrangler deploy`)
- `Dockerfile` — `node:24-alpine`, untuk VPS Cloady user (build belum divalidasi — tidak ada docker di VM ini)
- `openapi.json` — ganti `REPLACE-WITH-PUBLIC-HOST` dengan host publik setelah deploy
- `test-*.mjs` — skrip uji (butuh `npm install` dulu untuk ethers, dev-only)

## Bukti uji v2 (segar, 6 Nov 2026 ~05:50 WIB, blok ~131.900.206)
1. **Keempat route unpaid → HTTP 402**, amount ter-decode benar: gas/token-price/tx = 1000 unit ($0,001), contract-check = 2000 unit ($0,002); payTo + extra.name + network benar semua.
2. **Gas:** block 131.900.206, gas 0,05 gwei, mint 100k = 0,00000500 BNB, BNB $688,58.
3. **Token price:** WBNB $688,58, mcap $1,06 miliar, likuiditas $37,5 jt (PancakeSwap); CAKE $1,90, mcap $658 jt.
4. **Tx:** hash `0x3e1f...` → success, blok 131.897.163, 3.051 konfirmasi, gasUsed 122.932.
5. **Contract check (kontrol lama):** WBNB "Wrapped BNB"/"WBNB"/18, flags [] — benar.
6. **Jalur bayar end-to-end (tanpa dana):** wallet sekali-pakai tanda tangan EIP-3009 $0,001 (route gas) → facilitator `/verify` → `insufficient_funds` (Required 1000, Available 0). Tanda tangan, jumlah, penerima, masa berlaku semua valid — kurang saldo saja. Settlement on-chain yang sesungguhnya baru terbukti saat canary PayAPI.
7. **Facilitator:** `facilitator.xpay.sh` (primer: gratis, tanpa auth, gas disponsori, x402 v2 Base), fallback `pay.neuronto.com`. `x402.org/facilitator` HANYA testnet; CDP minta API key (401); meshgateway menolak tanda tangan valid. Payload v2 wajib berisi field `accepted` — server menormalisasi bila klien tidak mengirimnya.

## Yang mentok (butuh parent / browser)
1. **Host publik durable — BELUM ADA.** Vercel TIDAK tersambung (butuh OAuth user); Cloudflare Workers butuh login akun (wrangler); Railway/Render/Fly butuh akun; tunnel (trycloudflare/ngrok) DILARANG PayAPI eksplisit. Opsi: (a) **Cloudflare Workers** — paling pas (gratis, tidak tidur, pola yang dipakai listing BSC lain yang sudah live). Butuh: login Cloudflare via browser → `wrangler deploy` → URL `https://bsc-agent-utilities.<subdomain>.workers.dev`. (b) **VPS Cloady user** (sudah jalan, Xray port 3000) — deploy container via dashboard Cloady (browser task) dengan `Dockerfile` di sini.
2. **Form listing `https://payapi.market/list` — butuh browser.** Isian: email (raninndia@gmail.com), keempat paid route (satu per baris, masing-masing dengan contoh request), nama "BSC Agent Utilities", deskripsi, kategori Data. Form memanggil tiap route tanpa bayar dulu — harus 402. Setelah submit: review manusia + canary PayAPI (mereka bayar sekali per route, maks $0,10; kalau respons asli + USDC mendarat di dompet 1, listing dapat badge settlement-verified).
3. **Tidak ada dana user yang dipakai di langkah mana pun.** Canary dibayar PayAPI, bukan user.

## Ekspektasi jujur
**$0/bulan sampai ada pembeli pertama** — tidak ada bukti penjualan untuk listing baru di market ini; yang ada hanya pola: route murah ($0,001) + panggilan berulang + multi-route adalah pola yang paling banyak dipakai provider yang bertahan. Ukur 2–4 minggu setelah live, matikan kalau tetap $0.

## Langkah berikut (untuk parent)
1. Pilih host (a) Workers atau (b) Cloady, deploy, catat URL publik.
2. Ganti `REPLACE-WITH-PUBLIC-HOST` di `openapi.json`, uji `curl -i <URL>/v1/gas` → harus 402.
3. Browser task ke payapi.market/list, isi form (4 route + contoh), submit.
4. Laporkan URL listing + hasil review/canary ke user; update rekap harian (job ini saja).

## Update 00:20 WIB 2026-11-07 — OpenAPI diperbaiki untuk x402scan + 8 route live
- Direktori (detail: directories-20261107.md): Agent402 ✅ LIVE (toolCount 8, health 1, routable); 402index.io ✅ terdaftar, pending review (service id cc577fbb-19da-47b8-b4a8-11f31886f50b, probe 402 lolos); x402scan ⏳ daftar ulang masih butuh browser task.
- x402scan menolak pertama (00:18 WIB): "0 valid resources, 9 endpoints with errors" — "Missing input schema" di 8 route berbayar + /health dikira berbayar.
- Perbaikan OpenAPI (deploy via API 00:20 WIB, 2026-11-06T17:19:57Z, sukses): semua parameter punya description + schema.description + example di dalam schema; /v1/gas parameters:[] eksplisit; /health security:[]; semua route berbayar punya operationId + x-payment-info (amount 1000, payTo 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617); info.contact.email raninndia@gmail.com; GET /favicon.ico → 200 SVG.
- Verifikasi live segar: /health 200 (8 route $0,001), /openapi.json 200 (9 paths, semua parameter + x-payment-info terisi), /favicon.ico 200, kedelapan route tanpa param → 402. Harga, payout, logika 402 TIDAK diubah.
- Sisa: daftar ulang x402scan via browser (https://www.x402scan.com/resources/register, submit https://bsc-agent-utilities.raninndia.workers.dev; kalau minta sign wallet/SIWX — STOP, jangan sign). Subagent tidak bisa launch browser task — parent perlu delegasikan.

## Update 12:20 WIB 2026-11-07 — /llms.txt LIVE + hasil review Getly (Fase 1b)

### /llms.txt — LIVE
- Route baru `/llms.txt` ditambahkan ke `worker-combined.mjs` (konstanta `LLMS_TXT` + handler di `fetch`, sebelum lookup route berbayar) dan dideploy via API (`deploy_worker.py 6ccaec511ffffe230d4d47f216f21f0f bsc-agent-utilities worker-combined.mjs`, success: true, 0 error, compat date 2026-11-06, nodejs_compat).
- **KOREKSI draf hunt v11:** draf di `~/workspace/hunt-real-v11-20261107.md` menulis path yang SALAH (`/token-price`, `/token-info`, `/wallet-balance`, `/gas-price` — route itu tidak ada). Isi yang dipasang pakai 8 route ASLI: `/v1/gas`, `/v1/token-price`, `/v1/tx`, `/v1/contract-check`, `/v1/email-check`, `/v1/ip-lookup`, `/v1/whois`, `/v1/qr` — masing-masing $0,001 USDC + cara bayar x402 v2 (USDC Base eip155:8453, payTo 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617) + `/.well-known/x402` + `/openapi.json`.
- Verifikasi live segar (12:20 WIB 7 Nov): `/llms.txt` → **200** (text/plain; charset=utf-8, isi lengkap 8 route + payTo benar), `/.well-known/x402` → **200** (tetap), `/health` → **200** (8 route $0,001), `/v1/gas` tanpa bayar → **402**, `/v1/email-check?email=hello@example.com` tanpa bayar → **402**, `/openapi.json` → **200**, `/` → **200**. Tidak ada route lama yang rusak. `/llms.txt` juga ditambahkan ke `INFO.freeRoutes`.
- URL: https://bsc-agent-utilities.raninndia.workers.dev/llms.txt

### Review listing PayAPI "BSC Agent Utilities" — MASIH PENDING (belum ada email hasil)
- Cek Gmail raninndia@gmail.com 12:17 WIB 7 Nov: dari `notifications@payapi.market` cuma ada 1 email — konfirmasi submission 00:03 WIB 7 Nov ("We have your PayAPI Market submission: BSC Agent Utilities"). **Belum ada email hasil review.** Deadline review ~00:07 WIB 8 Nov — belum lewat. Status: masih Pending.

### Review 4 listing Getly (resubmit 02:52 WIB 7 Nov) — 2 LIVE, 2 DITOLAK
- Email hasil review tiba 12:08 WIB 7 Nov (noreply@getly.store), dibaca isi lengkapnya 12:17–12:18 WIB:
  - ✅ **"Daily Planner & Habit Tracker — Free Sample" — LIVE.**
  - ✅ **"2026–2027 Budget Planner — Free Sample (1 Month)" — LIVE.**
  - ❌ **"5 Resume Outlines + Cover Letter Template" ($12) — DITOLAK, "Description is incomplete or misleading".** Detail admin: teks listing + file sudah benar menyebut "text outlines", tapi **preview PDF masih file lama berjudul 'Modern Resume Templates, 5 Designs + Cover Letter'**. Perbaiki: ganti preview dengan halaman dari PDF outlines saat ini (supaya tidak ada kata 'designs'), lalu resubmit.
  - ❌ **"5 Resume Outlines — Free Sample (Template 1)" — DITOLAK, alasan sama.** Detail admin: preview PDF lama menyebut pack berbayar sebagai '5 Designs' dan 'Templates', padahal pack sekarang plain text outlines. Perbaiki: ganti preview dengan file sample saat ini (atau hapus preview), lalu resubmit.
- Akar masalah kedua penolakan sama: preview PDF lama yang belum diganti saat resubmit. Perbaikan butuh edit listing di Getly (browser / API Getly) — bukan bagian tugas ini; parent perlu tugaskan terpisah kalau mau diperbaiki + resubmit.
- Penjelasan cara pakai ditambahkan 10:44 WIB 2026-11-10 (teguran user: halaman tidak menjelaskan cara pakai): `howToUse` di INFO (root `/` JSON) + seksi "## How to use" di `LLMS_TXT` — 4 langkah (panggil route → 402 → bayar $0,001 USDC Base → retry + header X-PAYMENT → 200) + contoh curl /v1/gas + catatan tanpa API key/akun. Deploy sukses (success: true, 0 error). Verifikasi segar: root `/` tampil howToUse, /llms.txt tampil seksi How to use, /health 200.
- Halaman HTML ditambahkan 10:45 WIB 2026-11-10 (teguran user: halaman JSON mentah bikin orang sungkan): root `/` sekarang content negotiation — browser (Accept: text/html) dapat landing page HTML (judul, cara pakai 4 langkah + contoh curl, tabel 8 route + harga, info pembayaran, footer link); client API (Accept: application/json atau ?format=json) tetap dapat JSON INFO. Deploy sukses (success: true, 0 error). Verifikasi segar: HTML 200 text/html, JSON 200 application/json, ?format=json tampil howToUse + 8 route, /health 200, /v1/gas tetap 402.
- Landing page profesional + menu + halaman detail per route (10:48-10:51 WIB 2026-11-10, permintaan user "yang profesional biar orang visit tertarik" + "bikin menu, tiap klik muncul halaman yang bener"): root `/` sekarang tema gelap + aksen kuning BSC, nav menu sticky (How to use / Routes / Payment / Health / OpenAPI / llms.txt), hero + badge, How to use 4 langkah bernomor, 8 kartu route (klik → halaman detail). Tiap route berbayar kini content negotiation: browser (Accept: text/html) dapat halaman detail HTML (judul route, deskripsi, contoh curl, How to call, Payment, link kembali); client API/curl (Accept: */* atau application/json) tetap jalur x402 normal (402 → bayar → data). Deploy sukses (success: true, 0 error). Verifikasi segar via curl: root HTML tampil nav + 8 route benar + 8 "View details"; /v1/gas detail tampil judul + All routes + Example + How to call; /v1/gas curl tetap 402; /health 200. (Catatan: laporan cek visual browser mendeskripsikan route lain yang tidak ada di worker ini — tidak dipakai, verifikasi curl yang jadi patokan.)
- BUG FIX klik kartu route tampil JSON 402 mentah (10:52 WIB 2026-11-10, screenshot user: /v1/ip-lookup?ip=8.8.8.8 tampil JSON payment_required): penyebab — kartu link ke URL contoh API mentah (dengan query), jadi klik = panggil API langsung; kalau browser sempat terima/cache 402, yang tampil JSON mentah. Perbaikan: (1) kartu sekarang link ke bare route path (/v1/ip-lookup, tanpa query) = halaman detail/docs, contoh curl tetap tampil di halaman detail; (2) semua respons 402 kini kirim header Cache-Control: no-store supaya browser tidak pernah cache JSON payment_required. Deploy sukses (success: true, 0 error). Verifikasi segar: ip-lookup browser 200 text/html (detail page), ip-lookup curl 402 + Cache-Control: no-store, kartu link bare path semua, bare /v1/ip-lookup browser 200 text/html, /health 200. Catatan buat user: kalau di HP masih tampil JSON lama, refresh sekali (cache lama dari sebelum fix).
- PINDAH KE PAGES — bscapi.pages.dev (11:17-11:2x WIB 2026-11-10, perintah user "pindah ke pages, pilih link singkat"): PayAPI sekarang di Cloudflare Pages project `bscapi` → https://bscapi.pages.dev (gratis, tanpa raninndia). Nama pendek yang dicek: agent/bsc/pay (diambil), utils (diambil, dapat suffix utils-cha), bscutils (diambil), agentapi/x402api (tersedia tapi dihapus), bscapi TERPILIH (6 karakter, bersih). Deploy via Pages API direct upload _worker.js + manifest (kunci manifest TANPA slash depan — pakai "/_worker.js" bikin uses_functions False + 404; pakai "_worker.js" baru jalan), nodejs_compat di-set di project config. Semua URL di kode diganti dari bsc-agent-utilities.raninndia.workers.dev → bscapi.pages.dev (15 kemunculan). Verifikasi segar: root browser 200 HTML (nav + kartu + domain baru, 0 domain lama), root JSON 200, /health 200 (8 route), /v1/gas browser 200 detail, /v1/gas curl 402 + no-store, /v1/ip-lookup browser 200, /openapi.json 200, /llms.txt 200. URL lama workers.dev masih jalan (fallback). Skrip deploy: pages/cf-pages.py + pages/deploy-pages.py.
- PINDAH KE SATSCRIBE — satscribe.pages.dev (11:29-11:3x WIB 2026-11-10, perintah user: nama universal, bisa buat podcast/link dll; user PILIH satscribe.pages.dev dari opsi yang ditawarkan — sesuai aturan "nanya dulu sebelum bikin"). Project Pages `satscribe` dibuat (subdomain bersih, tanpa suffix). PayAPI di-deploy ke sana sebagai _worker.js (nodejs_compat). Semua URL di kode diganti bscapi.pages.dev → satscribe.pages.dev (15 kemunculan). Verifikasi segar: root browser 200 HTML (domain baru, 0 bscapi), /health 200, /v1/gas browser 200 detail, /v1/gas curl 402, /v1/ip-lookup browser 200. Project `bscapi` DIHAPUS (sudah tidak kepake). URL lama workers.dev masih jalan (fallback). Skrip deploy: pages/deploy-pages-satscribe.py.
