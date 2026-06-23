#!/usr/bin/env python3
"""A persistent visit counter — demonstrating CGI's core limitation: statelessness.

Every request starts a brand-new Python process with no memory of the last
one. Anything that should survive between requests — a counter, a session,
a log — has to be written somewhere outside the process: a file, a
database, etc. This script uses a plain text file, with an OS-level file
lock (fcntl, POSIX-only) so concurrent requests don't corrupt the count.
"""

import os
import sys
import html

try:
    import fcntl
    HAVE_FCNTL = True
except ImportError:
    HAVE_FCNTL = False  # not on POSIX — counter still works, just unlocked

sys.stdout.reconfigure(encoding="utf-8")  # don't trust the host's default locale

print("Content-Type: text/html; charset=utf-8")
print()

COUNTER_FILE = os.path.join(os.path.dirname(__file__), "counter.txt")

def bump_counter():
    if not os.path.exists(COUNTER_FILE):
        with open(COUNTER_FILE, "w") as f:
            f.write("0")

    with open(COUNTER_FILE, "r+") as f:
        if HAVE_FCNTL:
            fcntl.flock(f, fcntl.LOCK_EX)  # block other requests until we're done
        try:
            current = int(f.read().strip() or 0)
            current += 1
            f.seek(0)
            f.truncate()
            f.write(str(current))
        finally:
            if HAVE_FCNTL:
                fcntl.flock(f, fcntl.LOCK_UN)
    return current

count = bump_counter()

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>counter.py — Python CGI Lab</title>
  <link rel="stylesheet" href="/lab/lab.css">
</head>
<body>
  <div class="top-bar"></div>
  <main class="lab-page">
    <p class="lab-eyebrow">/test/counter.py</p>
    <h1>Visit #{html.escape(str(count))}</h1>
    <p class="lab-sub">Reload this page — the process restarts every time, but the count survives in <code>test/counter.txt</code> on disk, read-locked with <code>fcntl</code> so simultaneous requests can't race each other into a wrong number.</p>
    <p><a href="/lab/" class="lab-link">← back to the lab</a></p>
  </main>
</body>
</html>""")
