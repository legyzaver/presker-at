#!/usr/bin/env python3
"""Server Status Dashboard - no user input, just dynamic output.

Concepts: HTTP response headers, os.environ, datetime, embedding
Python values into HTML. The simplest proof that CGI is working.
"""

import os
import sys
import datetime
import html

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass  # Python < 3.7

print("Content-Type: text/html; charset=utf-8")
print()

now = datetime.datetime.now()
py_ver = sys.version.split()[0]

NOT_SET = '<span class="lab-dim">(not set)</span>'

VARS = [
    "REQUEST_METHOD",
    "SERVER_SOFTWARE",
    "SERVER_NAME",
    "REMOTE_ADDR",
    "HTTP_HOST",
    "HTTP_USER_AGENT",
    "GATEWAY_INTERFACE",
    "SERVER_PROTOCOL",
]

rows = []
for k in VARS:
    v = os.environ.get(k, "")
    cell = html.escape(v) if v else NOT_SET
    rows.append(f"<tr><td>{html.escape(k)}</td><td>{cell}</td></tr>")

rows_html = "\n        ".join(rows)

server_time = html.escape(now.strftime("%Y-%m-%d %H:%M:%S"))
py_ver_escaped = html.escape(py_ver)

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>status.py — Python CGI Lab</title>
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
    <p class="lab-eyebrow">/test/status.py</p>
    <h1>Server Status Dashboard.</h1>
    <p class="lab-sub">No form, no user input. The script reads what the web server handed it
    and outputs a page. This is the first thing to verify: can Python output dynamic HTML at all?</p>

    <h2>Runtime snapshot</h2>
    <table class="lab-table">
      <tbody>
        <tr><td>Server time</td><td>{server_time}</td></tr>
        <tr><td>Python version</td><td>{py_ver_escaped}</td></tr>
      </tbody>
    </table>

    <h2>Request environment</h2>
    <table class="lab-table">
      <thead><tr><th>Variable</th><th>Value this request</th></tr></thead>
      <tbody>
        {rows_html}
      </tbody>
    </table>

    <p style="font-size:13px; color:var(--muted);">
      Reload the page — the time changes. The request shape stays the same.
      See <a href="/test/env.py" class="lab-link">env.py</a> for the full environment dump.
    </p>
    <p style="margin-top:1.5rem;"><a href="/lab/" class="lab-link">&larr; back to the lab</a></p>
  </main>
</body>
</html>""")
