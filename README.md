# presker.at

Portfolio site for code projects, art, and vibe-coded tools.

## Structure

```
index.html          — homepage
style.css           — all styles
feedback/
  submit.py         — CGI feedback handler (logs + emails)
  feedback_log.json — auto-created on first submission
.github/
  workflows/
    deploy.yml      — auto-deploys to World4You on every push to main
```

## Auto-deploy setup

Add three secrets to your GitHub repo (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `FTP_HOST` | your World4You FTP host (e.g. `ftp.presker.at`) |
| `FTP_USER` | your FTP username |
| `FTP_PASS` | your FTP password |

Every push to `main` automatically deploys to `presker.at`.

## Feedback form

Edit `feedback/submit.py` and set `TO_EMAIL` to your email address.
Submissions are saved to `feedback/feedback_log.json` and optionally emailed.

## Managed by Claude

This site is managed via Claude (claude.ai). Ask Claude to add projects,
update content, or change the design — changes are committed and deployed automatically.
