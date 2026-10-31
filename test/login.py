#!/usr/bin/env python3
"""Login page - demonstrates HTTP cookie-based session management.

CGI has no built-in session concept: each request is a new process.
To remember "this user logged in", you set a cookie (via the Set-Cookie
header) and validate it on the next request by reading HTTP_COOKIE.

Credentials: admin / letmein
Concepts: Set-Cookie header, Location redirect, urllib.parse, secrets module.
"""

import os
import sys
import json
import html
import secrets
import time
from urllib.parse import parse_qsl

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass  # Python < 3.7

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SESSIONS_FILE = os.path.join(SCRIPT_DIR, "sessions.json")
SESSION_COOKIE = "cgi_session"
SESSION_TTL = 86400  # 24 hours in seconds
USERNAME = "admin"
PASSWORD = "letmein"


def load_sessions():
    if not os.path.exists(SESSIONS_FILE):
        return {}
    try:
        with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def save_sessions(data):
    # Purge expired sessions while saving
    now = time.time()
    clean = {k: v for k, v in data.items() if v > now}
    try:
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(clean, f)
    except OSError:
        pass


def current_token():
    cookie_header = os.environ.get("HTTP_COOKIE", "")
    for part in cookie_header.split(";"):
        part = part.strip()
        if part.startswith(SESSION_COOKIE + "="):
            return part[len(SESSION_COOKIE) + 1:]
    return None


# Check if already logged in
token = current_token()
sessions = load_sessions()
if token and sessions.get(token, 0) > time.time():
    print("Location: /test/secret.py")
    print()
    sys.exit(0)

method = os.environ.get("REQUEST_METHOD", "GET")
error_html = ""

if method == "POST":
    try:
        length = int(os.environ.get("CONTENT_LENGTH", 0) or 0)
    except ValueError:
        length = 0
    body = sys.stdin.read(length) if length else ""
    fields = dict(parse_qsl(body, keep_blank_values=True))

    user = fields.get("username", "")
    pwd = fields.get("password", "")

    if user == USERNAME and pwd == PASSWORD:
        new_token = secrets.token_hex(16)
        sessions[new_token] = time.time() + SESSION_TTL
        save_sessions(sessions)
        print(f"Set-Cookie: {SESSION_COOKIE}={new_token}; Path=/; HttpOnly; SameSite=Lax")
        print("Location: /test/secret.py")
        print()
        sys.exit(0)
    else:
        error_html = '<p style="color:#f57a7a; font-family:var(--mono); font-size:13px;">Wrong username or password.</p>'

print("Content-Type: text/html; charset=utf-8")
print()

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>login.py — Python CGI Lab</title>
  <link rel="stylesheet" href="/lab/lab.css">
  <style>
    .nav-buttons {{ position:fixed; top:2px; left:1.5rem; display:flex; gap:12px; z-index:1000; font-family:var(--mono); font-size:13px; }}
    .nav-btn {{ background:var(--bg2); border:1px solid var(--border); color:var(--text); padding:8px 14px; border-radius:6px; text-decoration:none; transition:all 0.15s; display:flex; align-items:center; }}
    .nav-btn:hover {{ background:var(--accent); color:var(--bg); border-color:var(--accent); }}
    .login-form {{ display:flex; flex-direction:column; gap:8px; max-width:360px; margin-bottom:1.5rem; }}
    .login-input {{ background:var(--bg2); border:1px solid var(--border); border-radius:6px; color:var(--text); padding:10px 14px; font-family:var(--mono); font-size:13px; }}
    .login-input:focus {{ outline:none; border-color:var(--accent); }}
    .login-btn {{ background:var(--accent); color:#0e0e0e; border:none; border-radius:6px; padding:10px 20px; font-weight:700; font-size:13px; font-family:var(--mono); cursor:pointer; }}
  </style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="nav-buttons">
    <a href="/" class="nav-btn">&larr; PRESKER.AT</a>
    <a href="/lab/" class="nav-btn">&larr; Lab</a>
  </div>
  <main class="lab-page">
    <p class="lab-eyebrow">/test/login.py</p>
    <h1>Secret Agent Login.</h1>
    <p class="lab-sub">Log in to reach the secret page. The server sets a cookie;
    the next request reads it from <code>HTTP_COOKIE</code> to verify the session.</p>
    <p style="font-family:var(--mono); font-size:13px; color:var(--muted); margin-bottom:1.5rem;">
      Credentials: <span style="color:var(--accent);">admin</span> /
      <span style="color:var(--accent);">letmein</span>
    </p>

    {error_html}
    <form method="POST" action="/test/login.py" class="login-form">
      <input class="login-input" type="text" name="username" placeholder="Username" autocomplete="username">
      <input class="login-input" type="password" name="password" placeholder="Password" autocomplete="current-password">
      <button class="login-btn" type="submit">Log in &rarr;</button>
    </form>

    <pre class="lab-code">if user == USERNAME and pwd == PASSWORD:
    token = secrets.token_hex(16)           # random 32-char hex
    sessions[token] = time.time() + 86400  # expires in 24h
    save_sessions(sessions)

    # Headers must come BEFORE Content-Type when redirecting
    print(f"Set-Cookie: cgi_session={{token}}; Path=/; HttpOnly")
    print("Location: /test/secret.py")
    print()  # blank line = end of headers</pre>

    <p><a href="/lab/" class="lab-link">&larr; back to the lab</a></p>
  </main>
</body>
</html>""")
