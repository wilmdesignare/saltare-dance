# Saltare – Projektleitfaden für Claude Code

> **Saltare** (lat. „tanzen“) – ein kleiner, komplett quelloffener Just-Dance-Klon,
> der vollständig im Webbrowser läuft. Lizenz: MIT.
>
> - Anzeigename im Spiel und Logo: **Saltare**
> - Repository- und Paketname: **`saltare-dance`** (GitHub, `package.json`)
> - Kein Code, keine Grafiken, Choreografie-Daten oder Sounds aus Ubisoft- oder
>   Konami-Spielen übernehmen; keine Ubisoft-Dateiformate nachbauen.

## Ziel

1–4 Personen tanzen gleichzeitig vor **einer** Kamera zu einem Video (lokale Datei
oder YouTube-URL). Das Spiel erkennt alle Personen, ordnet jede einem zuvor
angelegten Profil zu und vergibt Punkte, die am Ende dem jeweiligen Profil
gutgeschrieben werden – wie bei Just Dance.

## Kernfunktionen

1. **Profile**: Name + eine von vier Farben (Pink `#FF3EA5`, Cyan `#00D1FF`,
   Gelb `#FFD400`, Grün `#3DFF6E`). Jede Farbe kann pro Runde nur einmal vergeben
   werden. Gespeichert in `localStorage` (kein Backend).
2. **Mehrpersonen-Erkennung**: MediaPipe Pose Landmarker mit `numPoses: 4`.
3. **Zuordnung Person → Profil**: Kalibrierung vor jedem Song, danach stabiles
   Tracking über die Frames (siehe Abschnitt „Tracking").
4. **Videoquellen**:
   - Lokale Videodatei (`<video>`), einfachster und genauester Weg.
   - YouTube-URL über die YouTube IFrame Player API (siehe Abschnitt „YouTube").
5. **Bewertung** pro Takt-Fenster mit Feedback „Perfekt / Super / Gut / OK / X"
   in der Profilfarbe, laufender Punktestand pro Spieler.
6. **Ergebnis-Screen** mit Rangliste; Highscores pro Video und Profil.

## Tech-Stack

- **Vite + TypeScript**, kein UI-Framework (Vanilla TS + DOM + Canvas 2D).
- **@mediapipe/tasks-vision** (`PoseLandmarker`, `runningMode: "VIDEO"`,
  `delegate: "GPU"`), Modell `pose_landmarker_lite` oder `full`.
- Kein Server, kein Login, keine externen Tracker/Analytics.
- Zielbrowser: **Chrome Desktop auf macOS** (Mac Mini M4). Kamera z. B. iPhone
  per Continuity Camera oder USB-Webcam.

## Architektur (Ordnerstruktur)

```
src/
  main.ts              # App-Start, Screen-Router
  screens/             # profiles, lobby, calibration, game, results
  pose/
    detector.ts        # Wrapper um PoseLandmarker (Kamera + Referenz)
    normalize.ts       # Pose normalisieren (Hüftmitte, Torsolänge)
    tracker.ts         # Personen über Frames stabil Profilen zuordnen
  scoring/
    compare.ts         # Ähnlichkeit zweier Posen (Winkel + Gliedmaßen-Vektoren)
    judge.ts           # Zeitfenster, Toleranz, Rating, Punkte
  source/
    localVideo.ts
    youtube.ts         # IFrame API + Tab-Capture der Videofläche
  store/
    profiles.ts        # localStorage: Profile, Highscores
  ui/                  # HUD, Feedback-Animationen, Farben
```

Logik (Pose, Tracking, Scoring) bleibt **frei von DOM-Code**, damit sie testbar ist.
Tests mit **Vitest** für `normalize`, `compare`, `judge`, `tracker`.

## Tracking (mehrere Personen)

MediaPipe liefert **keine** festen Personen-IDs. Deshalb:

1. **Kalibrierung**: Jede Person stellt sich nacheinander in ihre Zone
   (Bildschirm in N senkrechte Bahnen geteilt, Bahn in Profilfarbe umrandet) und hebt
   beide Arme → Zuordnung wird gespeichert.
2. **Laufendes Tracking**: Pro Frame Zuordnung über den kleinsten Abstand der
   Hüftmittelpunkte zum letzten bekannten Punkt (Greedy- oder Hungarian-Matching),
   mit Bahn als Plausibilitätsprüfung. Kurze Aussetzer (< 1 s) überbrücken.
3. Verlorene Person → Status „nicht erkannt" im HUD, keine Punkte für diesen Takt.

## Bewertung

- Posen normalisieren: Ursprung = Hüftmitte, Skalierung = Torsolänge.
- Vergleich über **Gelenkwinkel** (Ellbogen, Schultern, Hüften, Knie) und
  **Richtungsvektoren** der Gliedmaßen (Kosinus-Ähnlichkeit); Arme stärker gewichten.
- Landmarks mit niedriger `visibility` ignorieren.
- **Spiegeln** der Referenz einstellbar (Standard: an, wie beim Coach bei Just Dance).
- **Zeittoleranz**: Spielerpose mit Referenzposen der letzten ±300 ms vergleichen,
  bestes Ergebnis zählt (gleicht Reaktions- und Systemlatenz aus).
- Bewertung alle ~1 s → Rating + Punkte; Endpunktzahl max. 13 333 wie bei Just Dance
  (optional).
- Einstellbar: Schwierigkeit (Schwellwerte), Latenz-Offset.

## YouTube

- Wiedergabe **nur** über die offizielle YouTube IFrame Player API (Embed).
  Videos werden **nicht** heruntergeladen oder gespeichert (keine yt-dlp o. Ä.).
- Pixel aus dem YouTube-iframe sind wegen Cross-Origin nicht lesbar. Deshalb wird
  die Videofläche per **Tab-Capture** erfasst:
  `getDisplayMedia({ preferCurrentTab: true })` + **Region Capture**
  (`CropTarget.fromElement(container)` → `track.cropTo(...)`) in Chrome.
  Fallback: ganzen Tab aufnehmen und per Canvas auf die iframe-Fläche zuschneiden.
- Referenz-Erkennung mit `numPoses: 1` (der Coach); bei mehreren Tänzern im Video
  die größte/zentralste Person nehmen.
- Lokale Videos dürfen vorab komplett analysiert und als Pose-Zeitreihe
  zwischengespeichert werden (genauer als Live-Analyse).

## Konventionen

- Code, Bezeichner und Kommentare auf **Englisch**; UI-Texte auf **Deutsch**,
  gesammelt in `src/ui/strings.ts` (später übersetzbar).
- Kleine, fokussierte Commits pro Meilenstein-Schritt.
- `npm run dev` startet lokal, `npm run build` erzeugt eine statische Seite
  (z. B. für GitHub Pages).
- Keine neuen Abhängigkeiten ohne Rückfrage.

## Meilensteine

1. **Grundgerüst**: Vite + TS, Kamera-Auswahl, PoseLandmarker mit 4 Personen,
   Skelette live auf Canvas zeichnen, FPS-Anzeige.
2. **Profile & Lobby**: Profile anlegen/bearbeiten/löschen, 1–4 Spieler für die
   Runde wählen, Farben eindeutig.
3. **Kalibrierung & Tracking**: Bahnen, Arme-hoch-Zuordnung, stabiles Tracking,
   Skelett in Profilfarbe.
4. **Videoquellen**: lokale Datei + YouTube-URL (IFrame API, Tab-/Region-Capture),
   Referenzpose live erkennen und anzeigen.
5. **Bewertung**: compare + judge, Feedback-Einblendungen, Punkte-HUD pro Spieler.
6. **Ergebnis & Highscores**: Rangliste, Speichern pro Video und Profil.
7. **Feinschliff**: Countdown, Effekte, Sounds, Einstellungen (Spiegeln,
   Schwierigkeit, Latenz), README mit Anleitung und Screenshots.

Nach jedem Meilenstein: kurz zusammenfassen, was fertig ist, wie man es testet, und
auf Freigabe warten, bevor der nächste beginnt.

## Status

- ✅ **Meilenstein 1 – Grundgerüst** (fertig): Vite + TS, Kamera-Auswahl,
  `PoseDetector` (`src/pose/detector.ts`, GPU mit CPU-Fallback, Modell lite/full),
  Skelette in Spielerfarben auf gespiegeltem Kamerabild (`src/pose/skeleton.ts`),
  FPS-Anzeige (`src/ui/fps.ts` + Test). WASM wird per `scripts/copy-wasm.mjs`
  nach `public/mediapipe/wasm` kopiert; das Modell lädt von Googles MediaPipe-Storage.
- ⏭️ **Als Nächstes: Meilenstein 2 – Profile & Lobby.**

## Startprompt für die nächste Sitzung

```
Lies die CLAUDE.md. Wir arbeiten an Saltare (Repo saltare-dance).
Meilenstein 1 ist fertig – prüfe kurz mit npm install && npm run dev, ob alles läuft.
Starte dann Meilenstein 2 – Profile & Lobby:
- Profile anlegen, bearbeiten, löschen: Name + eine der vier Farben aus src/ui/palette.ts
- Speicherung in localStorage über src/store/profiles.ts (mit Vitest-Tests)
- Lobby: 1–4 Profile für die Runde wählen, jede Farbe nur einmal pro Runde
- Einfacher Screen-Router in src/main.ts (Lobby → Kamera-Ansicht aus Meilenstein 1)
Zeig mir zuerst kurz deinen Plan, bevor du Dateien anlegst.
Am Ende: Tests grün, Commit + Push, sag mir wie ich es teste, und warte auf Freigabe für Meilenstein 3.
```
