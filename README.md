# Ukenummer marketing site

The public site for **Ukenummer**, the week-number app for iPhone, iPad and Apple Watch
([App Store](https://apps.apple.com/app/id668805988)). App source: `~/Swift/ukenummer`.

Live at **https://ukenummer.qraiqe.no**

Pure static HTML + CSS + vanilla JS. No build step, no framework, no external requests.

## Structure

```
index.html            Norwegian landing page (primary)
en/index.html         English landing page
privacy/index.html    Privacy policy, Norwegian + English (#nb, #en) — the App Store privacy URL
support/index.html    Support / FAQ + contact, Norwegian + English — the App Store support URL
404.html              Not-found page (wired in .htaccess)
styles.css            Design system: brand red from the app icon, light/dark via prefers-color-scheme
main.js               Nav, smooth scroll, scroll reveal, the live week card and the holiday table
assets/               Icons, og.png share image, shots/ (iPhone), widgets/, watch/ (WebP)
scripts/og.html       Source for assets/og.png
check.sh              Pre-deploy checks (HTML well-formedness, alt text, links, SEO files)
deploy.sh             Runs check.sh, then rsyncs to Simply.com
```

## Live content

`main.js` computes the current ISO 8601 week (Monday start, week 1 contains the first Thursday)
and Norway's 12 public holidays (Easter by the Meeus/Jones/Butcher algorithm), the same logic as the
app's `UkeKit`. The HTML ships static 2026 holiday rows for crawlers and no-JS visitors; the script
replaces them and lets visitors step between years. Update the static rows each January.

## Content rules

- Only shipped features are described. The app collects no data: keep the privacy page in sync with
  the app's "Data Not Collected" label and with what the app actually requests (Wikimedia only).
- Every change to one landing page should be made in both `index.html` and `en/index.html`.

## Images

- `assets/shots/` — iPhone App Store screenshots (6.9", 600 px wide), `nb-*` and `en-*`.
- `assets/watch/` — Apple Watch App Store screenshots (416 × 496).
- `assets/widgets/` — widget renders from the app repo:
  `UKE_MARKETING_LANG=nb swift test --package-path ~/Swift/ukenummer/Packages/UkeKit --filter MarketingRenders`
  (and `en`), written to `~/Swift/ukenummer/build/marketing/<lang>/`, exported at 2× as WebP.

## Share image

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --hide-scrollbars --allow-file-access-from-files --window-size=1200,630 \
  --screenshot="$PWD/assets/og.png" "file://$PWD/scripts/og.html"
```

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Use a local server, not `file://` (paths are root-absolute).

## Deploy

```bash
./deploy.sh
```

Uploads to `qraiqe.no@ssh.simply.com:/var/www/qraiqe.no/ukenummer/` (subdomain `ukenummer.qraiqe.no`
in the Simply.com control panel → Subdomæner, with Let's Encrypt and forced HTTPS) using the SSH key
`~/.ssh/id_rsa`. Simply's firewall answers bare `curl` with HTTP 455; check pages in a browser.
