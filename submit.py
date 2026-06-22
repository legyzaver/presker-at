#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cgi
import cgitb
import smtplib
import json
import os
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

cgitb.enable()

print("Content-Type: text/html; charset=utf-8")
print()

# ── Config — edit these ──────────────────────────────────────────────
TO_EMAIL    = "your@email.com"      # <-- your email here
FROM_EMAIL  = "noreply@presker.at"
SMTP_HOST   = "localhost"
SMTP_PORT   = 25
LOG_FILE    = os.path.join(os.path.dirname(__file__), "feedback_log.json")
# ────────────────────────────────────────────────────────────────────

def save_to_log(data):
    log = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r") as f:
                log = json.load(f)
        except Exception:
            log = []
    log.append(data)
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)

def send_email(data):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[presker.at feedback] {data['project']} — {data['type']}"
    msg["From"]    = FROM_EMAIL
    msg["To"]      = TO_EMAIL

    body = f"""New feedback on presker.at

Project : {data['project']}
Type    : {data['type']}
Time    : {data['timestamp']}

Message:
{data['message']}
"""
    msg.attach(MIMEText(body, "plain"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.sendmail(FROM_EMAIL, TO_EMAIL, msg.as_string())
    except Exception:
        pass  # email optional — log is the reliable store

def success_page():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thanks — PRESKER.AT</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav>
    <span class="logo">PRESKER.AT</span>
  </nav>
  <header class="hero" style="text-align:center; padding: 6rem 1.5rem;">
    <p class="eyebrow">Feedback received</p>
    <h1 style="font-size:2rem;">Thanks!</h1>
    <p class="sub" style="margin: 1rem auto 2rem;">I got your note and will take a look.</p>
    <a href="/" class="card-link" style="font-size:14px;">← back to presker.at</a>
  </header>
</body>
</html>"""

def error_page(msg="Something went wrong."):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error — PRESKER.AT</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav><span class="logo">PRESKER.AT</span></nav>
  <header class="hero" style="text-align:center; padding: 6rem 1.5rem;">
    <p class="eyebrow">Oops</p>
    <h1 style="font-size:2rem;">Something went wrong</h1>
    <p class="sub" style="margin: 1rem auto 2rem;">{msg}</p>
    <a href="/#feedback" class="card-link" style="font-size:14px;">← try again</a>
  </header>
</body>
</html>"""

# ── Main ─────────────────────────────────────────────────────────────
form = cgi.FieldStorage()

project = form.getvalue("project", "").strip()
ftype   = form.getvalue("type", "").strip()
message = form.getvalue("message", "").strip()

if not message:
    print(error_page("Please write a message before sending."))
else:
    data = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "project":   project or "unspecified",
        "type":      ftype   or "unspecified",
        "message":   message,
    }
    save_to_log(data)
    send_email(data)
    print(success_page())
