#!/usr/bin/env bash
# Ukenummer site verification — well-formedness + content assertions. Exit non-zero on failure.
set -u
cd "$(dirname "$0")"
fail=0
err(){ printf 'FAIL: %s\n' "$1"; fail=1; }

pages=$(find . -name '*.html' -not -path './scripts/*' -not -path './.git/*')
[ -n "$pages" ] || err "no HTML pages found"

# 1. Well-formedness. `xmllint --html` exits 0 even on parse errors, so inspect stderr;
# libxml2 flags HTML5 tags as "Tag X invalid" (benign noise, filtered out).
for p in $pages; do
  real=$(xmllint --html --noout "$p" 2>&1 | grep -iE 'parser error' | grep -viE 'Tag [A-Za-z0-9]+ invalid')
  if [ -n "$real" ]; then err "xmllint errors in $p"; printf '%s\n' "$real"; fi
done

# 2. Template placeholders left behind
grep -l '{{\|<!--ROWS-->' $pages && err "unfilled placeholder"

# 3. Every <img> has a non-empty alt, or is explicitly decorative (alt="" + aria-hidden)
for p in $pages; do
  bad=$(grep -oE '<img[^>]*>' "$p" | grep -vE 'alt="[^"]+"' | grep -vE 'aria-hidden="true"' | grep -v '^$')
  if [ -n "$bad" ]; then printf '%s\n' "$bad"; err "img without alt in $p"; fi
done

# 4. Local references resolve (src/href starting with /)
for p in $pages; do
  for ref in $(grep -oE '(src|href)="/[^"#]*' "$p" | sed -E 's/^(src|href)="//' | sort -u); do
    f=".$ref"; [ -d "$f" ] && f="$f/index.html"; [ "$ref" = "/" ] && f="./index.html"
    [ -f "$f" ] || err "$p references missing $ref"
  done
done

# 5. App Store link, legal pages, live week card, holiday table
for p in index.html en/index.html; do
  grep -q 'apps.apple.com/app/id668805988' "$p" || err "App Store link missing in $p"
  grep -q 'href="/privacy/' "$p" || err "privacy link missing in $p"
  grep -q 'data-week-number' "$p" || err "live week card missing in $p"
  [ "$(grep -c '<tr><th scope="row">' "$p")" -eq 12 ] || err "holiday table in $p doesn't have 12 rows"
done
grep -q 'ibo2001@gmail.com' support/index.html || err "contact email missing on support"
grep -q 'samler ikke inn data' privacy/index.html || err "Norwegian privacy statement missing"
grep -q 'does not collect any data' privacy/index.html || err "English privacy statement missing"

# 6. SEO artifacts
for f in robots.txt sitemap.xml assets/og.png assets/app-icon.png assets/apple-touch-icon.png assets/favicon.png 404.html; do
  [ -f "$f" ] || err "$f missing"
done
grep -q 'application/ld+json' index.html || err "JSON-LD missing on index"
for p in $pages; do grep -q 'name="theme-color"' "$p" || err "theme-color missing in $p"; done

# 7. JavaScript parses
node --check main.js 2>/dev/null || { command -v node >/dev/null && err "main.js has a syntax error"; }

[ "$fail" -eq 0 ] && echo "ALL CHECKS PASSED" || echo "CHECKS FAILED"
exit $fail
