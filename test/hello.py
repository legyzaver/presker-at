#!/usr/bin/env python3
"""The simplest possible CGI script: print headers, a blank line, then a body."""

import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")  # don't trust the host's default locale
except AttributeError:
    pass  # Python < 3.7

print("Content-Type: text/html; charset=utf-8")
print()  # the blank line is mandatory — it separates headers from the body

print("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>hello.py — Python CGI Lab</title>
  <link rel="stylesheet" href="/lab/lab.css">
  <style>
    .nav-buttons { position:fixed; top:2px; left:1.5rem; display:flex; gap:12px; z-index:1000; font-family:var(--mono); font-size:13px; }
    .nav-btn { background:var(--bg2); border:1px solid var(--border); color:var(--text); padding:8px 14px; border-radius:6px; text-decoration:none; transition:all 0.15s; display:flex; align-items:center; }
    .nav-btn:hover { background:var(--accent); color:var(--bg); border-color:var(--accent); }
  </style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="nav-buttons">
    <a href="/" class="nav-btn">&larr; PRESKER.AT</a>
    <a href="/lab/" class="nav-btn">&larr; Lab</a>
  </div>
  <main class="lab-page">
    <p class="lab-eyebrow">/test/hello.py</p>
    <h1>Hello from Python CGI.</h1>
    <p class="lab-sub">This page was not pre-built. A fresh Python process started, ran, printed this HTML, and exited — entirely on this request.</p>
    <pre class="lab-code">print("Content-Type: text/html; charset=utf-8")
print()
print("&lt;h1&gt;Hello from Python CGI.&lt;/h1&gt;")</pre>
    <p><a href="/lab/" class="lab-link">← back to the lab</a></p>
  </main>
</body>
</html>""")
