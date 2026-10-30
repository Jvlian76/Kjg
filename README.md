# Website der KjG Rebland

Statische Website der Katholischen jungen Gemeinde Rebland (Steinbach · Neuweier · Eisental).
Kein CMS, keine Datenbank, keine Cookies – nur HTML, CSS und ein bisschen JavaScript.

## Aufbau

| Ordner / Datei        | Inhalt                                                        |
| --------------------- | ------------------------------------------------------------- |
| `src/pages/*.html`    | Inhalt jeder Seite (eine Datei pro Seite)                     |
| `src/aktuelles.json`  | Neuigkeiten – erscheinen auf der Startseite und unter „Aktuelles“ |
| `src/layout.html`     | Kopf, Navigation und Fußzeile für alle Seiten                 |
| `src/icons/`          | Icons, im Text einbinden mit `{{icon:name}}`                  |
| `public/`             | Fertige Website (wird von Cloudflare ausgeliefert)            |
| `public/assets/`      | Bilder, Schriften, CSS, JS und PDFs                           |
| `build.py`            | Erzeugt aus `src/` die HTML-Dateien in `public/`              |

## Neuigkeit hinzufügen

1. In `src/aktuelles.json` oben einen neuen Eintrag ergänzen (Vorlage: ein vorhandener Eintrag).
   `tag` ist `Zeltlager`, `Kinderferienwoche`, `Winzertage` oder `Verein`.
2. PDFs (z. B. Einladungen) nach `public/assets/docs/` legen und in `links` verlinken.
3. `npm run deploy` ausführen (baut und veröffentlicht), danach committen und pushen.

## Lokal ansehen

```bash
python3 build.py
python3 -m http.server 8000 -d public
# dann http://localhost:8000 öffnen
```

## Veröffentlichen (Cloudflare Workers)

Die Seite läuft als Cloudflare Worker mit statischen Assets (`cloudflare.config.ts`, `wrangler.config.ts`).

```bash
npm install          # einmalig: installiert cf und wrangler
npx cf auth login    # einmalig: mit dem Cloudflare-Konto anmelden
npm run deploy       # baut die Seite und veröffentlicht sie
```
