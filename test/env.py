#!/usr/bin/env python3
"""Shows the environment variables the web server hands a CGI script.

This is the entire interface between Apache and the script: no sockets,
no frameworks — just process environment variables and stdin/stdout.
"""

import os
import sys
import html

try:
    sys.stdout.reconfigure(encoding="utf-8")  # don't trust the host's default locale
except AttributeError:
    pass  # Python < 3.7

print("Content-Type: text/html; charset=utf-8")
print()

INTERESTING = [
    "REQUEST_METHOD", "QUERY_STRING", "CONTENT_TYPE", "CONTENT_LENGTH",
    "REMOTE_ADDR", "HTTP_USER_AGENT", "HTTP_HOST", "SCRIPT_NAME",
    "REQUEST_URI", "SERVER_SOFTWARE", "SERVER_PROTOCOL", "GATEWAY_INTERFACE",
]

NOT_SET = '<span class="lab-dim">(not set)</span>'

rows = []
for key in INTERESTING:
    val = os.environ.get(key, "")
    cell = html.escape(val) if val else NOT_SET
    rows.append(f"<tr><td>{html.escape(key)}</td><td>{cell}</td></tr>")

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>env.py — Python CGI Lab</title>
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
    <p class="lab-eyebrow">/test/env.py</p>
    <h1>Request environment.</h1>
    <p class="lab-sub">Apache passes request metadata to a CGI script as plain OS environment variables — read with <code>os.environ</code>, nothing more exotic than that.</p>
    <table class="lab-table">
      <thead><tr><th>Variable</th><th>Value for this request</th></tr></thead>
      <tbody>{''.join(rows)}</tbody>
    </table>
    <p><a href="/lab/" class="lab-link">← back to the lab</a></p>
  </main>
</body>
</html>""")
