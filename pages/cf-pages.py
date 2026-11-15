#!/usr/bin/env python3
"""Cloudflare Pages: create project + deploy _worker.js via API (surrogate auth)."""
import json, sys, urllib.request, urllib.error, uuid
sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

ACCOUNT_ID = "6ccaec511ffffe230d4d47f216f21f0f"
BASE = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages"

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise RuntimeError("redirect refused")

def api(method, path, body=None, headers=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    add_surrogate_to_request(req, "custom.cloudflare", allowed_hosts=["api.cloudflare.com"])
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=60) as resp:
            return resp.status, read_json_response(resp)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode(errors="replace") or "{}")

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "create":
        name = sys.argv[2]
        status, out = api("POST", "/projects", {"name": name, "production_branch": "main"})
        print("HTTP", status)
        print(json.dumps(out, indent=2)[:1500])
    elif cmd == "list":
        status, out = api("GET", "/projects?per_page=20")
        print("HTTP", status)
        print(json.dumps(out, indent=2)[:2000])
    elif cmd == "get":
        name = sys.argv[2]
        status, out = api("GET", f"/projects/{name}")
        print("HTTP", status)
        print(json.dumps(out, indent=2)[:1500])
