#!/usr/bin/env python3
"""Redeploy _worker.js (manifest key without leading slash)."""
import sys, json, hashlib, urllib.request, urllib.error, uuid
sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

ACCOUNT_ID = "6ccaec511ffffe230d4d47f216f21f0f"
PROJECT = "satscribe"

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise RuntimeError("redirect refused")

with open("/home/hatch/workspace/payapi-20261106/worker-combined.mjs", "rb") as f:
    worker_code = f.read()

sha = hashlib.sha256(worker_code).hexdigest()
manifest = {"_worker.js": {"hash": sha, "size": len(worker_code)}}

boundary = "----cfpages" + uuid.uuid4().hex
body = b""
body += f"--{boundary}\r\n".encode()
body += b'Content-Disposition: form-data; name="manifest"\r\n'
body += b"Content-Type: application/json\r\n\r\n"
body += json.dumps(manifest).encode() + b"\r\n"
body += f"--{boundary}\r\n".encode()
body += b'Content-Disposition: form-data; name="_worker.js"; filename="_worker.js"\r\n'
body += b"Content-Type: application/javascript\r\n\r\n"
body += worker_code + b"\r\n"
body += f"--{boundary}--\r\n".encode()

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT}/deployments"
req = urllib.request.Request(url, data=body, method="POST")
req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
add_surrogate_to_request(req, "custom.cloudflare", allowed_hosts=["api.cloudflare.com"])
try:
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=120) as resp:
        out = read_json_response(resp)
        print("HTTP", resp.status, "success:", out.get("success"))
        print("deploy id:", (out.get("result") or {}).get("id"))
        print("errors:", out.get("errors"))
except urllib.error.HTTPError as e:
    print("HTTP", e.code)
    print(e.read().decode(errors="replace")[:2000])
