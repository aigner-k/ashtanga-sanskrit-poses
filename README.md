# Ashtanga Sanskrit Poses — Lernspiel

Ein kleines Browser-Lernspiel, um die Sanskrit-Namen der Ashtanga-Yoga Primary Series (Yoga Chikitsa) spielerisch zu lernen.

Zu jeder der 53 Posen gibt es:
- den **Sanskrit-Namen**
- eine **Ausspracheführung** (phonetisch, plus 🔊-Button zum Anhören per Sprachsynthese des Browsers)
- den **englischen** und **deutschen** Titel
- ein **visuelles Piktogramm** der Körperhaltung (vereinfachte Strichfigur)

## Modi

- **Explore-Modus**: Alle Posen in Ruhe durchblättern, gefiltert nach Serienabschnitt (Vinyasa, Stehend, Sitzend, Rückbeuge, Abschluss).
- **Shuffle-Modus**: Gemischte Lernkärtchen im Tinder-Stil (Hochformat, ein Kärtchen nach dem anderen). Jede Karte zeigt schon alle Infos; nach rechts wischen (oder ✓ tippen) markiert „kenn ich schon“, nach links (oder ✗) „muss ich noch üben“. Funktioniert per Touch-Swipe, Maus-Drag, den ✗/✓-Buttons oder den Pfeiltasten.
- **Erraten-Modus**: Zeigt Bild + englische/deutsche Übersetzung, der Sanskrit-Name ist verdeckt. Erst im Kopf raten, dann auf die Karte tippen (oder Leertaste) zum Aufdecken — danach genauso nach links/rechts bewerten wie im Shuffle-Modus.
- **Prüfungsmodus**: Multiple-Choice-Quiz mit vier Fragetypen (Bild→Name, Name→Bild, Name→Übersetzung, Übersetzung→Name), konfigurierbarer Fragenanzahl und Themenfilter.

Shuffle-, Erraten- und Prüfungsmodus lassen sich zusätzlich nach Serienabschnitt filtern. Alle drei speisen denselben Lernfortschritt (`localStorage`): Posen, die noch nicht sicher sitzen, kommen in jedem Modus häufiger dran.

## Starten

Kein Build-Schritt nötig — einfach eine der Dateien lokal per HTTP-Server ausliefern, z. B.:

```bash
python3 -m http.server 8080
```

und dann `http://localhost:8080` im Browser öffnen. (Direktes Öffnen der `index.html` per `file://` funktioniert in den meisten Browsern ebenfalls.)

## Als App installieren (PWA)

Die Seite ist eine installierbare Progressive Web App: Läuft auf dem Handy im Browser, funktioniert nach dem ersten Laden auch offline (Service Worker cached alle Dateien) und lässt sich wie eine native App auf den Homescreen legen — dann startet sie im Vollbild ohne Browser-Leiste.

- **Android/Chrome**: Es erscheint automatisch ein Banner „Installieren“ (basiert auf dem `beforeinstallprompt`-Event). Alternativ über das Browsermenü → „App installieren“.
- **iOS/Safari**: Safari unterstützt kein automatisches Installations-Popup — die Seite zeigt daher einen Hinweis-Banner mit Anleitung („Teilen-Symbol → Zum Home-Bildschirm“).

**Wichtig für einen eigenen Deploy**: Die PWA-Funktionen (Installierbarkeit, Offline-Cache) brauchen HTTPS oder `localhost` — bei `file://` funktionieren Service Worker nicht. Am einfachsten über kostenlose statische Hosts wie GitHub Pages, Netlify oder Vercel deployen.

## Eigene Fotos statt Piktogramme

Die Piktogramme in `js/figures.js` sind bewusst einfache, generische Strichfiguren. Wer echte Fotos oder Illustrationen ergänzen möchte, kann in `js/data.js` pro Pose ein Feld `image: 'pfad/zum/bild.jpg'` hinzufügen und in `js/app.js` (Funktion `renderExplore`/`renderExamRun`) `<img src="${pose.image}">` anstelle des SVG rendern, falls `pose.image` gesetzt ist.

## Dateien

- `index.html` — Grundgerüst
- `css/style.css` — Styling (hell/dunkel automatisch je nach Systemeinstellung)
- `js/data.js` — Posen-Datenbank
- `js/figures.js` — SVG-Piktogramme
- `js/app.js` — App-Logik (Routing, Explore-Modus, Prüfungsmodus, Fortschritt via `localStorage`, PWA-Installationsbanner)
- `manifest.json` — PWA-Manifest (Name, Icons, Standalone-Modus)
- `service-worker.js` — Offline-Cache des App-Shells
- `icons/` — App-Icons für Homescreen/Manifest
