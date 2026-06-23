#!/usr/bin/env python3
"""Reads a GET query string or a POST body and echoes it back.

Deliberately avoids the stdlib `cgi` module: it was deprecated in
Python 3.11 and removed in 3.13 (PEP 594). Parsing the query string and
POST body by hand also makes the CGI protocol itself more visible.
"""

import os
import sys
import json
import html
from urllib.parse import parse_qsl

sys.stdout.reconfigure(encoding="utf-8")  # don't trust the host's default locale

print("Content-Type: text/html; charset=utf-8")
print()

method = os.environ.get("REQUEST_METHOD", "GET")

if method == "POST":
    try:
        length = int(os.environ.get("CONTENT_LENGTH", 0) or 0)
    except ValueError:
        length = 0
    body = sys.stdin.read(length) if length else ""
else:
    body = os.environ.get("QUERY_STRING", "")

fields = dict(parse_qsl(body, keep_blank_values=True))
fields_json = html.escape(json.dumps(fields, indent=2, ensure_ascii=False))

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>echo.py — Python CGI Lab</title>
  <link rel="stylesheet" href="/lab/lab.css">
</head>
<body>
  <div class="top-bar"></div>
  <main class="lab-page">
    <p class="lab-eyebrow">/test/echo.py</p>
    <h1>Form echo.</h1>
    <p class="lab-sub">Submit the form below (GET or POST) and the script parses and echoes back whatever it received, parsed from the raw query string / POST body.</p>

    <form method="GET" action="/test/echo.py" class="lab-form">
      <input type="text" name="message" placeholder="Type something…" value="">
      <button type="submit" name="via" value="GET">Send via GET</button>
    </form>
    <form method="POST" action="/test/echo.py" class="lab-form">
      <input type="text" name="message" placeholder="Type something…" value="">
      <button type="submit" name="via" value="POST">Send via POST</button>
    </form>

    <p class="lab-eyebrow" style="margin-top:2rem;">Method received: {html.escape(method)}</p>
    <pre class="lab-code">{fields_json}</pre>
    <p><a href="/lab/" class="lab-link">← back to the lab</a></p>
  </main>
</body>
</html>""")
