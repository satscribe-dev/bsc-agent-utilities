# Show HN — DRAF (belum diposting) — PayAPI "BSC Agent Utilities"

**Status: RISET + DRAF SAJA, 7 Nov 2026 ~15:25 WIB. JANGAN posting tanpa eksekusi parent via browser.**
**Akun HN: `satscribe` — status BELUM terverifikasi (cek `https://news.ycombinator.com/user?id=satscribe` via fetch teks gagal HTTP 419, 7 Nov 15:22 WIB; parent harus cek via browser).**

## Verifikasi endpoint (curl segar, 7 Nov 2026 15:22 WIB / 08:22 UTC)

| Endpoint | Hasil |
|---|---|
| `GET /v1/gas` (tanpa bayar) | **402** `payment_required`, x402 v2, `amount: "1000"`, `asset: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC), `network: eip155:8453` (Base), `payTo: 0x3B5eC5a983576FCD98275Ff1604a1182ec5B5617`, `maxTimeoutSeconds: 300` |
| `GET /openapi.json` | **200**, 11.255 byte, OpenAPI 3.1.0, 9 paths |
| `GET /.well-known/x402` | **200**, challenge x402 v2 valid (sama seperti /v1/gas) |
| `GET /health` | **200**, `{"ok":true,"routes":{...8 route, semua "$0.001"}}` |

Semua masih hidup. Listing PayAPI masih **Pending review** (deadline review ~00:07 WIB 8 Nov 2026).

## Judul (73 karakter, diawali "Show HN:")

```
Show HN: 8 utility APIs at $0.001/call, no API key, paid in USDC via x402
```

Alternatif (kalau mau lebih pendek / beda sudut):
- `Show HN: Pay-per-call APIs for $0.001, no signup, paid with HTTP 402` (68 karakter)
- `Show HN: I built pay-per-call utility APIs that charge $0.001 in USDC` (69 karakter)

## URL yang di-submit

```
https://bsc-agent-utilities.raninndia.workers.dev
```

Link langsung ke worker (bukan landing page — HN minta link ke bendanya langsung).
Yang gratis dilihat tanpa bayar: `/openapi.json`, `/health`, `/.well-known/x402`, `/llms.txt`.
Yang berbayar: 8 route `/v1/*` @ $0,001 USDC/call (Base, x402 v2).

## Komentar pertama (tempel sebagai comment segera setelah submit)

> Hey HN, I built this because I kept needing tiny one-off lookups — BSC gas price, a token price, whether a tx confirmed, a quick WHOIS — and every API I found wanted an account, an API key, and a monthly plan for what is really a single lookup.
>
> So: 8 small endpoints, $0.001 USDC per call, no account, no API key. You call an endpoint, you get HTTP 402 with the payment terms (x402 v2, USDC on Base), you sign a USDC authorization, you retry with the signature header, you get the answer. The x402-fetch client does the 402 → sign → retry loop for you.
>
> The 8 endpoints: BSC gas price (+ latest block, tx cost in BNB), token price (DexScreener), tx status, contract safety check (code, owner, paused, flags), email check (format + MX + disposable), IP lookup, WHOIS (RDAP), QR code PNG.
>
> You can see the 402 for free — one curl, no wallet needed:
>
> ```
> curl -i https://bsc-agent-utilities.raninndia.workers.dev/v1/gas
> ```
>
> → 402, amount 1000 ($0.001 USDC), network eip155:8453 (Base). The spec is at /openapi.json, discovery at /.well-known/x402, health at /health, and there's an /llms.txt describing all routes.
>
> Honest state: this is brand new, no users and no revenue yet. The PayAPI listing is still pending review. It's a Cloudflare Worker, data comes from public BSC RPC + DexScreener + public RDAP/DNS sources, no API keys on my side either.
>
> Feedback I actually want: is $0.001/call the right granularity for this, or is per-call billing just annoying compared to a cheap API key? And is there a lookup missing that you'd actually pay a tenth of a cent for?
>
> Happy to answer questions about the x402 v2 flow or the Worker setup.

## Aturan Show HN yang berlaku (dari https://news.ycombinator.com/showhn.html, dibaca 7 Nov 2026)

- Show HN hanya untuk sesuatu yang **kamu buat sendiri dan orang lain bisa coba langsung**. Blog post, sign-up page, newsletter, list, landing page, fundraiser = BUKAN Show HN.
- Proyek harus **non-trivial** — jangan one-off yang digenerate cepat. Harus ada yang bisa didiskusikan.
- **Buat gampang dicoba, idealnya tanpa barrier** (signup/email). Kalau belum siap dicoba, jangan post dulu.
- Judul harus diawali **"Show HN"**. Pola yang diterima: `Show HN: Nama – apa yang dilakukan, dengan kata biasa`. Tanpa huruf besar berlebihan, tanpa tanda seru, tanpa bahasa marketing, tanpa nama situs di judul.
- **Jangan minta teman upvote/comment** — dilarang, bisa kena penalti/ban untuk submission, akun, dan situs.
- Setiap Show HN muncul di `/shownew`; pindah ke `/show` (top bar) setelah melewati ambang poin kecil.
- Upgrade/fitur baru minor ("Foo 1.3.1 is out") umumnya tidak cukup substansial untuk Show HN.
- Pembuat **harus ada di thread** menjawab pertanyaan. Komentar pertama (konteks/backstory) sebaiknya diposting dalam 1–2 menit setelah submit.
- Jangan delete + repost setelah hasil lemah; repost kecil-kecilan OK hanya kalau post lama sudah tidak ada perhatian signifikan selama ~1 tahun.
- Jangan pakai HN terutama untuk promosi. Link di post baru berpoin rendah diberi `rel="nofollow"`; baru jadi follow setelah ~12 poin (cek Okt 2026).

## Pola dari 3 contoh Show HN dev-tool / x402 yang sukses

1. **ClawRouter** — `Show HN: ClawRouter – Open-source LLM router that saves 78% on inference costs` (item 46899642). Pola: buka dengan masalah pribadi ("I was spending $200+/month..."), lalu cara kerja teknis berpoin (14-dimension scoring, 4 tier, routing <1ms lokal), sebut pembayaran x402 USDC di Base sebagai satu baris saja, tutup dengan ajakan tanya jawab spesifik ("Happy to answer questions about the routing algorithm or the x402 payment approach"). Tanpa klaim pengguna.
2. **Armalo AI** — `Show HN: Armalo AI – The Infrastructure for Agent Networks` (item 47244042). Pola: "Hey HN — I'm Ryan, founder...", tiga layer yang dibangun, harga jujur (free tier, Pro $99, Enterprise $2.999, atau pay-per-call x402 $0.001/score lookup tanpa API key). Follow-up seminggu kemudian ("we did a Show HN last week... feedback was genuinely useful") — mereka kembali dengan hasil, bukan repost.
3. **Marimo** — `Marimo — an open-source reactive notebook for Python`, 448 poin / 106 komentar. Pola: judul kristal-jelas, memecahkan pain point yang dikenal semua orang (hidden state Jupyter, format JSON yang merusak git). Launch berulang 5+ kali (WASM, VS Code, cloud) — tiap post membawa sesuatu yang baru, bukan repost yang sama.
4. Bonus pola dari draf **AgentAegis** (MCP + x402, belum tentu ter-posting): judul menyebut HTTP 402 + ERC-3009 secara spesifik (teknis = menarik), demo 30 detik berupa curl yang kena 402 lalu bayar lalu dapat hasil, dan catatan jujur soal facilitator (x402.org facilitator drop Base mainnet → pakai CDP).

**Yang dikomentari/dipermasalahkan di thread sejenis:** apakah per-call billing lebih mengganggu daripada API key murah; apakah $0.001/call itu granularity yang masuk akal; detail teknis x402 v2 (header `PAYMENT-SIGNATURE` vs `X-PAYMENT` v1, facilitator mana, settlement berapa detik); dan apakah produknya benar-benar bisa dicoba tanpa signup. Draf di atas sudah menjawab keempatnya di depan.

## Risiko jujur untuk PayAPI di Show HN (baca sebelum posting)

1. **Barrier coba:** route berbayar butuh wallet Base berisi USDC + tanda tangan EIP-3009. Itu barrier nyata — HN minta "mudah dicoba tanpa signup". Penawarnya: 402-nya sendiri bisa dilihat gratis lewat 1 curl (itu demonya), plus `/openapi.json` + `/health` + `/llms.txt` gratis. Draf di atas jujur soal ini; jangan klaim "coba gratis" untuk route berbayar.
2. **Akun baru:** kalau akun `satscribe` baru dibuat tanpa histori, post bisa kurang traksi dan rawan rate-limit. Tidak ada jalan pintas yang legal — jangan pakai akun lain / minta upvote.
3. **Waktu posting:** hari ini Sabtu 7 Nov — akhir pekan bukan waktu terbaik. Rekomendasi: **Senin 9 Nov atau Selasa 10 Nov, 22:00–01:00 WIB** (= 7–10 pagi waktu Pasifik AS), saat user bisa duduk di thread ~6 jam membalas komentar. Jangan posting kalau tidak bisa membalas cepat di jam-jam pertama.
4. **Jangan pakai LLM untuk menulis komentar pertama** — tips resmi HN bilang jangan pakai LLM untuk menulis/mengedit komentar Show HN. Draf di atas adalah kerangka; **user sebaiknya tulis ulang dengan kata-katanya sendiri** sebelum posting.
5. **Satu post per hari, jangan spam.** Kalau hasilnya lemah, jangan delete + repost. Satu Show HN untuk produk ini; post berikutnya hanya kalau ada overhaul besar.

## Yang TIDAK ada di draf (sengaja)

- Tanpa klaim pengguna, penghasilan, traffic, atau "paling laku" — tidak ada datanya (penghasilan $0, 0 pembeli).
- Tanpa label "AI agent" (aturan tugas).
- Tanpa ajakan upvote / share / follow.
- Tanpa wallet agentic — tidak ada wallet yang dipakai di langkah mana pun.

## Langkah browser untuk parent (eksekusi)

1. **Cek akun HN `satscribe`:** buka `https://news.ycombinator.com/user?id=satscribe` di browser (fetch teks gagal HTTP 419, belum terverifikasi — kemungkinan belum ada, kemungkinan juga HN memblokir fetch non-browser).
   - Kalau belum ada → signup: buka `https://news.ycombinator.com/login`, klik `create account`, isi username `satscribe` + password patokan (user isi lewat Secure Vault, jangan ditulis di mana pun). Email `raninndia@gmail.com` sebaiknya ditambahkan di profil (menu `profile` → `email`) supaya moderator bisa menghubungi + untuk reset password.
   - Kalau sudah ada → login dengan akun itu, lanjut ke langkah 2.
2. **Submit (di waktu yang dipilih, Senin/Selasa 22:00–01:00 WIB):** buka `https://news.ycombinator.com/submit`, login sebagai `satscribe`, isi:
   - `title`: `Show HN: 8 utility APIs at $0.001/call, no API key, paid in USDC via x402`
   - `url`: `https://bsc-agent-utilities.raninndia.workers.dev`
   - `text`: kosongkan (Show HN link post tidak pakai text).
   - Klik `submit`.
3. **Komentar pertama (1–2 menit setelah submit):** buka thread post yang baru dibuat, tempel komentar pertama dari draf di atas (sebaiknya sudah ditulis ulang user dengan kata-kata sendiri — lihat risiko #4).
4. **Di thread ~6 jam:** balas pertanyaan teknis cepat; jangan minta upvote; jangan delete/repost kalau sepi.
5. Setelah posting, catat URL thread HN (`https://news.ycombinator.com/item?id=...`) + poin/komentar ke STATUS.md.
