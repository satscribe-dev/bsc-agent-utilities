# Pendaftaran Direktori x402 — BSC Agent Utilities

Tanggal: 2026-11-07 ~00:16 WIB (17:16 UTC 2026-11-06)
API: https://bsc-agent-utilities.raninndia.workers.dev — 8 route, semua $0,001 USDC Base, payTo 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617
Kontak: raninndia@gmail.com | Kategori: Data

## Ringkasan
| Direktori | Hasil | Status |
|---|---|---|
| Agent402 | ✅ TERDAFTAR | Live di index, routable, health 1 |
| 402index.io | ✅ TERDAFTAR | Pending review (service id ada, probe 402 lolos) |
| x402scan | ⏳ BELUM | Butuh browser task (form web) — subagent tidak bisa launch browser; parent perlu delegasikan |

Tidak ada dana dikirim, tidak ada pembayaran, tidak ada signature, tidak ada akun/KYC/kartu. Worker Cloudflare tidak diubah, listing PayAPI (pending review) tidak disentuh.

## 1. Agent402 — ✅ LIVE
- Registrasi: `POST https://agent402.tools/api/index/register` dengan `{"origin":"https://bsc-agent-utilities.raninndia.workers.dev"}` (sesuai CONTRIBUTING.md resmi).
- Respons: `{"listed":true,"origin":"https://bsc-agent-utilities.raninndia.workers.dev","seller":{"displayName":"bsc-agent-utilities.raninndia.workers.dev","toolCount":8,"toolsTotal":8,"toolsCapped":false,"networks":["eip155:8453"],"routable":true,"health":1}}`
- Verifikasi segar: `GET https://agent402.tools/api/index?seller=bsc-agent-utilities.raninndia.workers.dev` → toolCount 8, health 1, routable true, paywall ok (402 di /v1/gas), payToByNetwork eip155:8453 = 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617.
- URL listing: https://agent402.tools/api/index?seller=bsc-agent-utilities.raninndia.workers.dev (juga tampil di https://agent402.tools/marketplace)

## 2. 402index.io — ✅ TERDAFTAR, pending review
- Registrasi: `POST https://402index.io/api/v1/register` — field wajib: url, name, protocol (diketahui dari pesan error API).
- Percobaan 1 gagal (wajar): url = base URL `/` → probe jawab 200, error "x402 verification failed — endpoint returned HTTP 200 instead of 402".
- Percobaan 2 sukses: url = `https://bsc-agent-utilities.raninndia.workers.dev/v1/gas`, name "BSC Agent Utilities", protocol "x402", category "Data", email raninndia@gmail.com, deskripsi 8 route.
- Respons: `{"message":"Service registered and pending review. Verify your domain for instant approval.","service":{"id":"cc577fbb-19da-47b8-b4a8-11f31886f50b","name":"BSC Agent Utilities","status":"pending","health_status":"healthy","hostname":"bsc-agent-utilities.raninndia.workers.dev",...},"verification":{"protocol":"x402","httpStatus":402,"accepts":[{"scheme":"exact","network":"eip155:8453","amount":"1000","asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","payTo":"0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617","maxTimeoutSeconds":300}],"assetKnown":true}}`
- Verifikasi: pencarian publik /api/v1/services belum menampilkan service ini (status pending, belum masuk index publik; endpoint search ?q= tidak memfilter dengan benar). Bukti terkuat = respons registrasi di atas (service id + probe 402 lolos + amount/payTo benar).
- Opsional (tidak dikerjakan): verifikasi domain via `POST /api/v1/claim` — butuh pasang file/DNS di domain; host kita subdomain workers.dev, tidak feasible. Bukan blocker; review manual tetap jalan.

## 3. x402scan — ⏳ PERBAIKAN OPENAPI SELESAI, DAFTAR ULANG BUTUH BROWSER TASK
- Form: https://www.x402scan.com/resources/register — submit base URL, tanpa akun, tanpa approval (menurut docs).
- Penolakan pertama (00:18 WIB): "0 valid resources, 9 endpoints with errors" — kedelapan route berbayar: "Missing input schema", /health dikira route berbayar.
- Perbaikan OpenAPI (00:20 WIB, sudah deploy + terverifikasi live):
  - Semua 8 parameter (address, hash, email, ip, domain, text, size) kini punya `description` + `schema.description` + `example` di dalam schema (sebelumnya example cuma di level parameter, tanpa description).
  - /v1/gas: `parameters: []` eksplisit + deskripsi "no input parameters".
  - /health: `"security": []` + deskripsi "no payment required".
  - Semua 8 route berbayar: `operationId` + `x-payment-info` (scheme exact, network eip155:8453, asset USDC Base, amount 1000, payTo 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617).
  - `info.contact.email: raninndia@gmail.com`.
  - `GET /favicon.ico` → 200 (SVG, image/svg+xml).
  - Deploy via API sukses 2026-11-06T17:19:57Z. Verifikasi live segar: /health 200 (8 route $0,001), /openapi.json 200 (9 paths, semua parameter + x-payment-info terisi), /favicon.ico 200, kedelapan route tanpa param → 402.
  - Harga + payout + logika 402 TIDAK diubah.
- DAFTAR ULANG BELUM DIKERJAKAN: subagent generik tidak bisa launch browser task. Parent perlu delegasikan lewat browser.browse (task_id "new", tugas pendek: buka https://www.x402scan.com/resources/register, submit https://bsc-agent-utilities.raninndia.workers.dev; kalau minta sign wallet/SIWX/signature — STOP, jangan sign, laporkan).
- Catatan: riset sebelumnya menyebut x402scan bisa minta Sign-In-With-X (SIWX) untuk listing terverifikasi — kalau form minta sign wallet, STOP, jangan sign apa pun, laporkan ke parent.

## Follow-up
- x402scan: OpenAPI SUDAH diperbaiki + deploy 00:20 WIB (verifikasi live lengkap). Tinggal daftar ulang via browser task — parent perlu delegasikan.
- 402index: cek lagi dalam 1-2 hari apakah status sudah approved / muncul di pencarian publik.
- Agent402: sudah live, tidak ada follow-up (index re-crawl otomatis tiap siklus).
- Catatan: PayAPI listing (pending review) masih hanya berisi 4 route lama — 4 route baru (email-check, ip-lookup, whois, qr) belum masuk listing mana pun secara eksplisit, tapi Agent402 sudah mengindeks ke-8 route lewat manifest.
