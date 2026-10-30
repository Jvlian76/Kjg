#!/usr/bin/env python3
"""Baut die statische Website der KjG Rebland.

Quellen:   src/layout.html      – Grundgerüst (Header, Navigation, Footer)
           src/pages/*.html     – Inhalte der einzelnen Seiten
           src/aktuelles.json   – Neuigkeiten (Startseite + Seite "Aktuelles")
           src/icons/*.svg      – Icons, einbinden mit {{icon:name}}
           src/partials/*.svg   – größere Grafiken, einbinden mit {{partial:name}}
Ausgabe:   public/              – fertige Seite, die Cloudflare Pages ausliefert

Aufruf:    python3 build.py     (nur Python-Standardbibliothek nötig)
"""
import datetime
import hashlib
import html
import json
import re
from pathlib import Path

SITE_URL = "https://kjg-rebland.de"
ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "public"

MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
          "August", "September", "Oktober", "November", "Dezember"]
TAG_STYLES = {"Zeltlager": "chip-red", "Kinderferienwoche": "chip-sun",
              "Verein": "chip-green", "Winzertage": "chip-grape"}


def read(path):
    return Path(path).read_text(encoding="utf-8")


def format_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.day}. {MONTHS[d.month - 1]} {d.year}"


def render_links(links, small=True):
    out = []
    for link in links:
        url = link["url"]
        external = url.startswith("http")
        icon = "{{icon:external}}" if external else ("{{icon:doc}}" if url.endswith(".pdf") else "{{icon:arrow}}")
        cls = "btn btn-small " + ("btn-white" if link.get("secondary") else "btn-green")
        attrs = ' target="_blank" rel="noopener"' if external or url.endswith(".pdf") else ""
        out.append(f'<a class="{cls}" href="{html.escape(url)}"{attrs}>{html.escape(link["label"])} {icon}</a>')
    return "\n".join(out)


def render_news(items, full):
    blocks = []
    for item in items:
        tag = item.get("tag", "Verein")
        meta = (f'<div class="news-meta"><span class="chip {TAG_STYLES.get(tag, "chip-green")}">{html.escape(tag)}</span>'
                f'<time class="news-date" datetime="{item["date"]}">{format_date(item["date"])}</time></div>')
        if full:
            body = item["text"]
            heading = f'<h2 id="{item["id"]}">{html.escape(item["title"])}</h2>'
        else:
            body = f'<p>{item["teaser"]}</p>'
            heading = f'<h3>{html.escape(item["title"])}</h3>'
        links = item.get("links", []) if full else [{"label": "Weiterlesen", "url": f'/aktuelles/#{item["id"]}'}]
        blocks.append(f'<article class="news-item">{meta}{heading}{body}'
                      f'<div class="news-links">{render_links(links)}</div></article>')
    return "\n".join(blocks)


def main():
    layout = read(SRC / "layout.html")
    icons = {p.stem: read(p).strip() for p in (SRC / "icons").glob("*.svg")}
    partials = {p.stem: read(p).strip() for p in (SRC / "partials").glob("*.svg")}
    news = sorted(json.loads(read(SRC / "aktuelles.json")), key=lambda n: n["date"], reverse=True)

    assets = read(OUT / "assets/css/style.css") + read(OUT / "assets/js/main.js")
    version = hashlib.sha1(assets.encode()).hexdigest()[:8]

    sitemap = []
    for page in sorted((SRC / "pages").glob("*.html")):
        raw = read(page)
        meta_match = re.match(r"\s*<!--\s*(\{.*?\})\s*-->", raw, re.S)
        if not meta_match:
            raise SystemExit(f"{page.name}: Metadaten-Kommentar fehlt")
        meta = json.loads(meta_match.group(1))
        content = raw[meta_match.end():]

        slug = page.stem
        if slug == "index":
            out_file, path = OUT / "index.html", "/"
        elif slug == "404":
            out_file, path = OUT / "404.html", None
        else:
            out_file, path = OUT / slug / "index.html", f"/{slug}/"

        nav = meta.get("nav", slug)
        title = meta["title"]
        page_title = "KjG Rebland – " + title if slug != "index" else title

        doc = layout.replace("{{content}}", content)
        doc = re.sub(r"\{\{news:(\d+|all)\}\}",
                     lambda m: render_news(news if m.group(1) == "all" else news[:int(m.group(1))], m.group(1) == "all"),
                     doc)
        doc = re.sub(r"\{\{cur:([\w-]+)\}\}", lambda m: ' aria-current="page"' if m.group(1) == nav else "", doc)
        doc = re.sub(r"\{\{active:([\w-]+)\}\}", lambda m: " is-active" if m.group(1) == nav else "", doc)
        doc = re.sub(r"\{\{partial:([\w-]+)\}\}", lambda m: partials[m.group(1)], doc)
        doc = re.sub(r"\{\{icon:([\w-]+)\}\}", lambda m: icons[m.group(1)], doc)
        doc = (doc.replace("{{page_title}}", html.escape(page_title))
                  .replace("{{description}}", html.escape(meta["description"]))
                  .replace("{{canonical}}", SITE_URL + (path or "/404"))
                  .replace("{{site_url}}", SITE_URL)
                  .replace("{{version}}", version)
                  .replace("{{year}}", str(datetime.date.today().year)))
        leftover = re.findall(r"\{\{[^}]+\}\}", doc)
        if leftover:
            raise SystemExit(f"{page.name}: unbekannte Platzhalter {leftover}")

        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(doc, encoding="utf-8")
        if path:
            sitemap.append(SITE_URL + path)
        print("gebaut:", out_file.relative_to(ROOT))

    urls = "\n".join(f"  <url><loc>{u}</loc></url>" for u in sitemap)
    (OUT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n', encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8")


if __name__ == "__main__":
    main()
