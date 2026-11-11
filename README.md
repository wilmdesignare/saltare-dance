# Saltare

**Saltare** (Latin for *to dance*) is an open-source dance game that runs entirely
in the browser. Up to four people dance in front of one camera; each is detected,
assigned to their profile and scored – similar to Just Dance, but free and with
any dance video you like.

> Status: **Milestone 1 of 7** – live multi-person pose detection.
> The full roadmap is in [`CLAUDE.md`](CLAUDE.md).

## Features (so far)

- Camera picker (works with USB webcams and iPhone Continuity Camera on macOS)
- Detection of up to 4 people at once with [MediaPipe Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
- Live skeletons in four player colours over a mirrored camera image
- Choice between a fast (`lite`) and an accurate (`full`) model
- FPS counter
- Everything runs locally in your browser – no video leaves your computer

## Getting started

Requirements: [Node.js](https://nodejs.org) 20 or newer and Chrome on desktop.

```bash
git clone https://github.com/wilmdesignare/saltare-dance.git
cd saltare-dance
npm install
npm run dev
```

Open the address shown in the terminal (usually http://localhost:5173),
pick your camera and click **Kamera starten**.

Tips for good detection: stand 2–3 m from the camera so your whole body is
visible, use even lighting and a calm background.

## Scripts

| Command             | What it does                               |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Start the dev server                       |
| `npm run build`     | Type-check and build a static site to `dist/` |
| `npm run preview`   | Serve the production build locally         |
| `npm test`          | Run unit tests (Vitest)                    |

The MediaPipe WASM runtime is copied from `node_modules` into `public/` on
`dev`/`build`, so no code is loaded from a CDN. The pose model file itself is
downloaded from Google's MediaPipe model storage on first start.

## Roadmap

1. ✅ Live multi-person pose detection
2. Profiles & lobby (name + one of four colours)
3. Calibration & stable player tracking
4. Video sources: local files and YouTube links
5. Scoring with “Perfekt / Super / Gut / OK” feedback
6. Results screen & highscores
7. Polish: countdown, effects, sounds, settings

## Legal

Saltare contains no code, graphics, choreography data or sounds from any
commercial dance game. YouTube videos are only played through the official
embedded player and are never downloaded.

## License

[MIT](LICENSE)
