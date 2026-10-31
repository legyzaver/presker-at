#!/usr/bin/env python3
"""Guestbook - persisting user input beyond the request lifecycle.

CGI is stateless: every request is a fresh process with no memory of the last.
This script stores entries in a JSON-lines file so they survive between requests.

Concepts: file I/O, json, html.escape (XSS prevention), fcntl file locking,
server-side input length limits.
"""

import os
import sys
import json
import html
import datetime
from urllib.parse import parse_qsl

try:
    import fcntl
    HAVE_FCNTL = True
except ImportError:
    HAVE_FCNTL = False  # non-POSIX

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass  # Python < 3.7

print("Content-Type: text/html; charset=utf-8")
print()

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GUESTBOOK_FILE = os.path.join(SCRIPT_DIR, "guestbook.txt")
MAX_ENTRIES = 100
MAX_NAME = 80
MAX_MSG = 500

method = os.environ.get("REQUEST_METHOD", "GET")

name_val = ""
msg_val = ""
post_error = ""
post_ok = False

if method == "POST":
    try:
        length = int(os.environ.get("CONTENT_LENGTH", 0) or 0)
    except ValueError:
        length = 0
    body = sys.stdin.read(length) if length else ""
    fields = dict(parse_qsl(body, keep_blank_values=True))

    name_val = fields.get("name", "").strip()[:MAX_NAME]
    msg_val = fields.get("message", "").strip()[:MAX_MSG]

    if not msg_val:
        post_error = "Message cannot be empty."
    else:
        entry = {
            "name": name_val or "Anonymous",
            "message": msg_val,
            "ts": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        }
        try:
            # Read existing entries
            entries = []
            if os.path.exists(GUESTBOOK_FILE):
                with open(GUESTBOOK_FILE, "r", encoding="utf-8") as f:
                    if HAVE_FCNTL:
                        fcntl.flock(f, fcntl.LOCK_SH)
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                entries.append(json.loads(line))
                            except json.JSONDecodeError:
                                pass

            entries.insert(0, entry)
            entries = entries[:MAX_ENTRIES]

            with open(GUESTBOOK_FILE, "w", encoding="utf-8") as f:
                if HAVE_FCNTL:
                    fcntl.flock(f, fcntl.LOCK_EX)
                try:
                    for e in entries:
                        f.write(json.dumps(e, ensure_ascii=False) + "\n")
                finally:
                    if HAVE_FCNTL:
                        fcntl.flock(f, fcntl.LOCK_UN)

            post_ok = True
            name_val = ""
            msg_val = ""
        except OSError as exc:
            post_error = f"Could not save entry: {html.escape(str(exc))}"

# Read current entries for display
entries = []
if os.path.exists(GUESTBOOK_FILE):
    try:
        with open(GUESTBOOK_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
    except OSError:
        pass

# Build entries HTML
entries_html = ""
if entries:
    for e in entries:
        n = html.escape(e.get("name", "Anonymous"))
        m = html.escape(e.get("message", ""))
        t = html.escape(e.get("ts", ""))
        entries_html += (
            f'<div style="border-bottom:1px solid var(--border); padding:1rem 0;">'
            f'<div style="font-family:var(--mono); font-size:12px; color:var(--muted); margin-bottom:4px;">'
            f'{n} &mdash; {t}</div>'
            f'<div style="font-size:15px;">{m}</div>'
            f'</div>\n'
        )
else:
    entries_html = '<p style="color:var(--muted); font-size:14px;">No entries yet.</p>'

status_html = ""
if post_ok:
    status_html = '<p style="color:var(--accent); font-family:var(--mono); font-size:13px;">Entry saved.</p>'
elif post_error:
    status_html = f'<p style="color:#f57a7a; font-family:var(--mono); font-size:13px;">{post_error}</p>'

name_escaped = html.escape(name_val)
msg_escaped = html.escape(msg_val)
count = len(entries)
lock_note = "with fcntl.LOCK_EX" if HAVE_FCNTL else "without lock (fcntl unavailable)"

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>guestbook.py — Python CGI Lab</title>
  <link rel="stylesheet" href="/lab/lab.css">
  <style>
    .nav-buttons {{ position:fixed; top:2px; left:1.5rem; display:flex; gap:12px; z-index:1000; font-family:var(--mono); font-size:13px; }}
    .nav-btn {{ background:var(--bg2); border:1px solid var(--border); color:var(--text); padding:8px 14px; border-radius:6px; text-decoration:none; transition:all 0.15s; display:flex; align-items:center; }}
    .nav-btn:hover {{ background:var(--accent); color:var(--bg); border-color:var(--accent); }}
    .gb-form {{ display:flex; flex-direction:column; gap:8px; margin-bottom:1.5rem; }}
    .gb-input {{ background:var(--bg2); border:1px solid var(--border); border-radius:6px; color:var(--text); padding:10px 14px; font-family:var(--mono); font-size:13px; }}
    .gb-input:focus {{ outline:none; border-color:var(--accent); }}
    textarea.gb-input {{ resize:vertical; min-height:90px; }}
    .gb-btn {{ background:var(--accent); color:#0e0e0e; border:none; border-radius:6px; padding:10px 20px; font-weight:700; font-size:13px; font-family:var(--mono); cursor:pointer; align-self:flex-start; }}
  </style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="nav-buttons">
    <a href="/" class="nav-btn">&larr; PRESKER.AT</a>
    <a href="/lab/" class="nav-btn">&larr; Lab</a>
  </div>
  <main class="lab-page">
    <p class="lab-eyebrow">/test/guestbook.py</p>
    <h1>Guestbook.</h1>
    <p class="lab-sub">Leave a message. It survives the next request because it's written to a file
    on disk — the only state that persists through CGI&rsquo;s stateless process model.</p>

    {status_html}
    <form method="POST" action="/test/guestbook.py" class="gb-form">
      <input class="gb-input" type="text" name="name" placeholder="Name (optional)" value="{name_escaped}" maxlength="{MAX_NAME}">
      <textarea class="gb-input" name="message" placeholder="Your message&hellip;" maxlength="{MAX_MSG}">{msg_escaped}</textarea>
      <button class="gb-btn" type="submit">Post message</button>
    </form>

    <h2>{count} {"entry" if count == 1 else "entries"} (newest first)</h2>
    {entries_html}

    <pre class="lab-code" style="margin-top:2rem;">with open(GUESTBOOK_FILE, "w") as f:
    fcntl.flock(f, fcntl.LOCK_EX)  # block concurrent writes
    try:
        for entry in entries:
            f.write(json.dumps(entry) + "\\n")
    finally:
        fcntl.flock(f, fcntl.LOCK_UN)

# All output is passed through html.escape() before printing.
# Without it, a message like &lt;script&gt;alert(1)&lt;/script&gt; would execute.</pre>
    <p style="font-size:12px; color:var(--muted);">Lock mode: {lock_note}. Max {MAX_ENTRIES} entries stored.</p>
    <p style="margin-top:1rem;"><a href="/lab/" class="lab-link">&larr; back to the lab</a></p>
  </main>
</body>
</html>""")
