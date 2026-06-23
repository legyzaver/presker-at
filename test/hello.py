#!/usr/bin/env python3
"""The simplest possible CGI script: print headers, a blank line, then a body."""

import sys
sys.stdout.reconfigure(encoding="utf-8")  # don't trust the host's default locale

print("Content-Type: text/html; charset=utf-8")
print()  # the blank line is mandatory — it separates headers from the body

print("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>hello.py — Python CGI Lab</title>
  <link rel="stylesheet" href="/lab/lab.css">
</head>
<body>
  <div class="top-bar"></div>
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
