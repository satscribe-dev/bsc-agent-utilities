// Test the paid path WITHOUT moving funds: throwaway wallet (never saved, never funded)
// signs an EIP-3009 USDC authorization for $0.001 (gas route) to payTo.
// Facilitator /verify must say insufficient_funds (signature/amount/recipient/timing
// valid, only balance missing). Real settlement is proven by PayAPI's canary.
import { Wallet } from "ethers";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PAY_TO = "0x93fc9d8Ae82cEe78FC224DAf8AD8aA1DeCA62124";
const wallet = Wallet.createRandom();
const now = Math.floor(Date.now() / 1000);
const auth = { from: wallet.address, to: PAY_TO, value: "1000", validAfter: "0", validBefore: String(now + 300), nonce: "0x" + [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("") };
const domain = { name: "USD Coin", version: "2", chainId: 8453, verifyingContract: USDC };
const types = { TransferWithAuthorization: [
  { name: "from", type: "address" }, { name: "to", type: "address" }, { name: "value", type: "uint256" },
  { name: "validAfter", type: "uint256" }, { name: "validBefore", type: "uint256" }, { name: "nonce", type: "bytes32" } ] };
const signature = await wallet.signTypedData(domain, types, auth);
const req = { scheme: "exact", network: "eip155:8453", amount: "1000", asset: USDC, payTo: PAY_TO, maxTimeoutSeconds: 300, extra: { name: "USD Coin", version: "2" } };
const payload = { x402Version: 2, scheme: "exact", network: "eip155:8453", payload: { signature, authorization: auth }, accepted: req };
const b64 = Buffer.from(JSON.stringify(payload)).toString("base64");
const res = await fetch("http://127.0.0.1:8787/v1/gas", { headers: { "PAYMENT-SIGNATURE": b64 } });
console.log("paid-path status:", res.status);
console.log("body:", (await res.text()).slice(0, 300));
console.log("throwaway signer (unfunded, discarded):", wallet.address);
