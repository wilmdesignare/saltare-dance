// All user-facing texts live here (German for now, translatable later).
export const strings = {
  appName: "Saltare",
  tagline: "Tanzen im Browser – mit bis zu 4 Personen",
  cameraLabel: "Kamera",
  modelLabel: "Modell",
  modelLite: "Schnell (lite)",
  modelFull: "Genau (full)",
  start: "Kamera starten",
  stop: "Stoppen",
  statusIdle: "Wähle eine Kamera und starte.",
  statusLoadingModel: "Lade Posen-Modell …",
  statusStartingCamera: "Starte Kamera …",
  statusRunning: (people: number) =>
    people === 1 ? "1 Person erkannt" : `${people} Personen erkannt`,
  errorNoCamera: "Keine Kamera gefunden. Schließe eine Webcam an oder nutze dein iPhone (Continuity Camera).",
  errorPermission: "Kamerazugriff verweigert. Erlaube die Kamera in den Browser-Einstellungen.",
  errorModel: "Das Posen-Modell konnte nicht geladen werden. Prüfe deine Internetverbindung.",
  cameraFallbackName: (n: number) => `Kamera ${n}`,
  fps: (fps: number) => `${fps.toFixed(0)} FPS`,
} as const;
