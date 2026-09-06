# Ashtanga Sanskrit Poses — Lernspiel

Ein kleines Browser-Lernspiel, um die Sanskrit-Namen der Ashtanga-Yoga Primary Series (Yoga Chikitsa) spielerisch zu lernen.

Zu jeder der 53 Posen gibt es:
- den **Sanskrit-Namen**
- eine **Ausspracheführung** (phonetisch, plus 🔊-Button zum Anhören per Sprachsynthese des Browsers)
- den **englischen** und **deutschen** Titel
- ein **visuelles Piktogramm** der Körperhaltung (vereinfachte Strichfigur)

## Modi

- **Explore-Modus**: Alle Posen in Ruhe durchblättern, gefiltert nach Serienabschnitt (Vinyasa, Stehend, Sitzend, Rückbeuge, Abschluss).
- **Prüfungsmodus**: Multiple-Choice-Quiz mit vier Fragetypen (Bild→Name, Name→Bild, Name→Übersetzung, Übersetzung→Name), konfigurierbarer Fragenanzahl und Themenfilter. Posen, die noch nicht sicher sitzen, kommen häufiger dran (Fortschritt wird lokal im Browser gespeichert).

## Starten

Kein Build-Schritt nötig — einfach eine der Dateien lokal per HTTP-Server ausliefern, z. B.:

```bash
python3 -m http.server 8080
```

und dann `http://localhost:8080` im Browser öffnen. (Direktes Öffnen der `index.html` per `file://` funktioniert in den meisten Browsern ebenfalls.)

## Eigene Fotos statt Piktogramme

Die Piktogramme in `js/figures.js` sind bewusst einfache, generische Strichfiguren. Wer echte Fotos oder Illustrationen ergänzen möchte, kann in `js/data.js` pro Pose ein Feld `image: 'pfad/zum/bild.jpg'` hinzufügen und in `js/app.js` (Funktion `renderExplore`/`renderExamRun`) `<img src="${pose.image}">` anstelle des SVG rendern, falls `pose.image` gesetzt ist.

## Dateien

- `index.html` — Grundgerüst
- `css/style.css` — Styling (hell/dunkel automatisch je nach Systemeinstellung)
- `js/data.js` — Posen-Datenbank
- `js/figures.js` — SVG-Piktogramme
- `js/app.js` — App-Logik (Routing, Explore-Modus, Prüfungsmodus, Fortschritt via `localStorage`)
