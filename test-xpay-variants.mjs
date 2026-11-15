import { Wallet } from "ethers";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PAY_TO = "0x93fc9d8Ae82cEe78FC224DAf8AD8aA1DeCA62124";
const wallet = Wallet.createRandom();
const now = Math.floor(Date.now() / 1000);
const auth = { from: wallet.address, to: PAY_TO, value: "5000", validAfter: "0", validBefore: String(now + 300), nonce: "0x" + [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("") };
const domain = { name: "USD Coin", version: "2", chainId: 8453, verifyingContract: USDC };
const types = { TransferWithAuthorization: [
  { name: "from", type: "address" }, { name: "to", type: "address" }, { name: "value", type: "uint256" },
  { name: "validAfter", type: "uint256" }, { name: "validBefore", type: "uint256" }, { name: "nonce", type: "bytes32" } ] };
const signature = await wallet.signTypedData(domain, types, auth);
const reqV2 = { scheme: "exact", network: "eip155:8453", amount: "5000", asset: USDC, payTo: PAY_TO, maxTimeoutSeconds: 300, extra: { name: "USD Coin", version: "2" } };
const reqV1 = { scheme: "exact", network: "base", amount: "5000", asset: USDC, payTo: PAY_TO, maxTimeoutSeconds: 300, extra: { name: "USD Coin", version: "2" } };
const payV2 = { x402Version: 2, scheme: "exact", network: "eip155:8453", payload: { signature, authorization: auth } };
const payV1 = { x402Version: 1, scheme: "exact", network: "base", payload: { signature, authorization: auth } };
const variants = [
  ["xpay v2 std", "https://facilitator.xpay.sh/verify", { x402Version: 2, paymentPayload: payV2, paymentRequirements: reqV2 }],
  ["xpay v2 no-version-top", "https://facilitator.xpay.sh/verify", { paymentPayload: payV2, paymentRequirements: reqV2 }],
  ["xpay v1 base", "https://facilitator.xpay.sh/verify", { x402Version: 1, paymentPayload: payV1, paymentRequirements: reqV1 }],
  ["xpay v2 payload-only", "https://facilitator.xpay.sh/verify", payV2],
  ["neuronto v2 std", "https://pay.neuronto.com/verify", { x402Version: 2, paymentPayload: payV2, paymentRequirements: reqV2 }],
  ["mesh v2 std", "https://facilitator.meshgateway.co/verify", { x402Version: 2, paymentPayload: payV2, paymentRequirements: reqV2 }],
];
for (const [label, url, body] of variants) {
  try {
    const t0 = Date.now();
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    console.log(label, res.status, Date.now() - t0 + "ms", (await res.text()).slice(0, 250));
  } catch (e) { console.log(label, "ERROR:", String(e.message || e).slice(0, 140)); }
}
