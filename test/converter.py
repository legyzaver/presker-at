#!/usr/bin/env python3
"""Unit Converter - demonstrates self-posting CGI form handling.

A single script acts as both the form and the form processor.
GET: show empty form. POST: parse body, compute result, show form + result.

Concepts: REQUEST_METHOD, urllib.parse, input validation,
pre-filling form values on redisplay.
"""

import os
import sys
import html
from urllib.parse import parse_qsl

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass  # Python < 3.7

print("Content-Type: text/html; charset=utf-8")
print()

method = os.environ.get("REQUEST_METHOD", "GET")

if method == "POST":
    try:
        length = int(os.environ.get("CONTENT_LENGTH", 0) or 0)
    except ValueError:
        length = 0
    body = sys.stdin.read(length) if length else ""
    fields = dict(parse_qsl(body, keep_blank_values=True))
else:
    fields = {}

value_raw = fields.get("value", "")
unit = fields.get("unit", "c_to_f")

CONVERSIONS = {
    "c_to_f":  ("°C → °F",   lambda v: v * 9 / 5 + 32,    "°F"),
    "f_to_c":  ("°F → °C",   lambda v: (v - 32) * 5 / 9,  "°C"),
    "km_to_mi": ("km → miles",           lambda v: v * 0.621371,       "mi"),
    "mi_to_km": ("miles → km",           lambda v: v * 1.60934,        "km"),
    "kg_to_lb": ("kg → lb",              lambda v: v * 2.20462,        "lb"),
    "lb_to_kg": ("lb → kg",              lambda v: v / 2.20462,        "kg"),
    "m_to_ft":  ("m → ft",               lambda v: v * 3.28084,        "ft"),
    "ft_to_m":  ("ft → m",               lambda v: v / 3.28084,        "m"),
}

result_html = ""
error_html = ""

if method == "POST":
    if not value_raw.strip():
        error_html = '<p style="color:#f57a7a; font-family:var(--mono); font-size:14px;">Enter a number to convert.</p>'
    else:
        try:
            input_val = float(value_raw.strip())
            if unit in CONVERSIONS:
                label, fn, out_unit = CONVERSIONS[unit]
                output_val = fn(input_val)
                result_html = (
                    f'<div style="background:var(--bg2); border:1px solid var(--accent); '
                    f'border-radius:8px; padding:1.25rem; margin-bottom:1.5rem; font-family:var(--mono);">'
                    f'<span style="color:var(--muted); font-size:12px;">{html.escape(label)}</span><br>'
                    f'<span style="font-size:2rem; color:var(--accent);">'
                    f'{html.escape(f"{input_val:g}")} &rarr; {html.escape(f"{output_val:.6g}")} {html.escape(out_unit)}'
                    f'</span></div>'
                )
            else:
                error_html = '<p style="color:#f57a7a; font-family:var(--mono); font-size:14px;">Unknown conversion.</p>'
        except ValueError:
            safe_val = html.escape(value_raw[:80])
            error_html = f'<p style="color:#f57a7a; font-family:var(--mono); font-size:14px;">"{safe_val}" is not a number.</p>'

options_html = ""
for key, (label, _, _) in CONVERSIONS.items():
    sel = " selected" if key == unit else ""
    options_html += f'<option value="{key}"{sel}>{html.escape(label)}</option>\n'

value_escaped = html.escape(value_raw)

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>converter.py — Python CGI Lab</title>
  <link rel="stylesheet" href="/lab/lab.css">
  <style>
    .nav-buttons {{ position:fixed; top:2px; left:1.5rem; display:flex; gap:12px; z-index:1000; font-family:var(--mono); font-size:13px; }}
    .nav-btn {{ background:var(--bg2); border:1px solid var(--border); color:var(--text); padding:8px 14px; border-radius:6px; text-decoration:none; transition:all 0.15s; display:flex; align-items:center; }}
    .nav-btn:hover {{ background:var(--accent); color:var(--bg); border-color:var(--accent); }}
    .conv-form {{ display:flex; flex-direction:column; gap:12px; margin-bottom:1.5rem; }}
    .conv-row {{ display:flex; gap:8px; flex-wrap:wrap; }}
    .conv-input {{ flex:1; min-width:120px; background:var(--bg2); border:1px solid var(--border); border-radius:6px; color:var(--text); padding:10px 14px; font-family:var(--mono); font-size:15px; }}
    .conv-input:focus {{ outline:none; border-color:var(--accent); }}
    .conv-select {{ flex:2; min-width:180px; background:var(--bg2); border:1px solid var(--border); border-radius:6px; color:var(--text); padding:10px 14px; font-family:var(--mono); font-size:13px; }}
    .conv-btn {{ background:var(--accent); color:#0e0e0e; border:none; border-radius:6px; padding:10px 20px; font-weight:700; font-size:13px; font-family:var(--mono); cursor:pointer; white-space:nowrap; }}
  </style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="nav-buttons">
    <a href="/" class="nav-btn">&larr; PRESKER.AT</a>
    <a href="/lab/" class="nav-btn">&larr; Lab</a>
  </div>
  <main class="lab-page">
    <p class="lab-eyebrow">/test/converter.py</p>
    <h1>Unit Converter.</h1>
    <p class="lab-sub">One script, both form and handler.
    POST to yourself, parse the body with <code>urllib.parse</code>,
    validate the input, pre-fill the form with what was sent.</p>

    {result_html}{error_html}
    <form method="POST" action="/test/converter.py" class="conv-form">
      <div class="conv-row">
        <input class="conv-input" type="text" name="value" placeholder="Enter a number&hellip;" value="{value_escaped}">
        <select class="conv-select" name="unit">
          {options_html}
        </select>
        <button class="conv-btn" type="submit">Convert</button>
      </div>
    </form>

    <pre class="lab-code">method = os.environ.get("REQUEST_METHOD", "GET")
if method == "POST":
    length = int(os.environ.get("CONTENT_LENGTH", 0) or 0)
    body   = sys.stdin.read(length)
    fields = dict(parse_qsl(body))

value = fields.get("value", "")
try:
    num = float(value)        # ValueError if blank or non-numeric
except ValueError:
    show_error("not a number")</pre>

    <p><a href="/lab/" class="lab-link">&larr; back to the lab</a></p>
  </main>
</body>
</html>""")
