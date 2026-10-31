#!/usr/bin/env python3
"""Secret page - validates a session cookie and guards access.

Reads HTTP_COOKIE from os.environ, finds the session token,
checks it against sessions.json. Invalid or missing token
redirects back to login.py without showing any content.

Concepts: HTTP_COOKIE env var, cookie parsing, Location redirect,
token-based session validation.
"""

import os
import sys
import json
import html
import time

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass  # Python < 3.7

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SESSIONS_FILE = os.path.join(SCRIPT_DIR, "sessions.json")
SESSION_COOKIE = "cgi_session"


def load_sessions():
    if not os.path.exists(SESSIONS_FILE):
        return {}
    try:
        with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def current_token():
    cookie_header = os.environ.get("HTTP_COOKIE", "")
    for part in cookie_header.split(";"):
        part = part.strip()
        if part.startswith(SESSION_COOKIE + "="):
            return part[len(SESSION_COOKIE) + 1:]
    return None


token = current_token()
sessions = load_sessions()
is_valid = token and sessions.get(token, 0) > time.time()

if not is_valid:
    print("Location: /test/login.py")
    print()
    sys.exit(0)

# Authenticated — show the secret page
expiry = sessions.get(token, 0)
expires_in = int(expiry - time.time())
expires_str = html.escape(f"{expires_in // 3600}h {(expires_in % 3600) // 60}m")
token_short = html.escape(token[:8] + "...")

print("Content-Type: text/html; charset=utf-8")
print()

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>secret.py — Python CGI Lab</title>
  <link rel="stylesheet" href="/lab/lab.css">
  <style>
    .nav-buttons {{ position:fixed; top:2px; left:1.5rem; display:flex; gap:12px; z-index:1000; font-family:var(--mono); font-size:13px; }}
    .nav-btn {{ background:var(--bg2); border:1px solid var(--border); color:var(--text); padding:8px 14px; border-radius:6px; text-decoration:none; transition:all 0.15s; display:flex; align-items:center; }}
    .nav-btn:hover {{ background:var(--accent); color:var(--bg); border-color:var(--accent); }}
  </style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="nav-buttons">
    <a href="/" class="nav-btn">&larr; PRESKER.AT</a>
    <a href="/lab/" class="nav-btn">&larr; Lab</a>
  </div>
  <main class="lab-page">
    <p class="lab-eyebrow">/test/secret.py</p>
    <h1>You&rsquo;re in.</h1>
    <p class="lab-sub">Session validated. This page was only reachable because the request
    carried a valid cookie, which the server matched against a stored token.</p>

    <table class="lab-table">
      <tbody>
        <tr><td>Session token</td><td style="font-family:var(--mono);">{token_short}</td></tr>
        <tr><td>Expires in</td><td style="font-family:var(--mono);">{expires_str}</td></tr>
      </tbody>
    </table>

    <pre class="lab-code">cookie_header = os.environ.get("HTTP_COOKIE", "")
# "cgi_session=abc123def456...; other_cookie=val"

for part in cookie_header.split(";"):
    if part.strip().startswith("cgi_session="):
        token = part.strip()[len("cgi_session="):]

sessions = json.load(open("sessions.json"))
if sessions.get(token, 0) &lt; time.time():
    # expired or unknown token
    print("Location: /test/login.py")
    print()
    sys.exit()</pre>

    <p style="margin-top:1.5rem;">
      <a href="/test/login.py?logout=1" class="lab-link"
         onclick="document.cookie='cgi_session=;expires=Thu,01 Jan 1970 00:00:00 GMT;path=/'; return true;">
        Log out &rarr;
      </a>
    </p>
    <p><a href="/lab/" class="lab-link">&larr; back to the lab</a></p>
  </main>
</body>
</html>""")
