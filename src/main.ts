import "./style.css";
import { CameraError, listCameras, openStream, stopStream } from "./camera/camera";
import { PoseDetector, type ModelVariant } from "./pose/detector";
import { drawSkeleton } from "./pose/skeleton";
import { FpsCounter } from "./ui/fps";
import { colorForIndex } from "./ui/palette";
import { strings } from "./ui/strings";

const MAX_PLAYERS = 4;

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <header class="topbar">
    <div class="brand"><h1>${strings.appName}</h1><span>${strings.tagline}</span></div>
    <label>${strings.cameraLabel} <select id="camera-select"></select></label>
    <label>${strings.modelLabel}
      <select id="model-select">
        <option value="full">${strings.modelFull}</option>
        <option value="lite">${strings.modelLite}</option>
      </select>
    </label>
    <button id="toggle" class="primary">${strings.start}</button>
  </header>
  <main class="stage">
    <video id="camera" playsinline muted></video>
    <canvas id="view"></canvas>
    <div id="fps" class="fps" hidden></div>
    <div id="status" class="status">${strings.statusIdle}</div>
  </main>
`;

const cameraSelect = app.querySelector<HTMLSelectElement>("#camera-select")!;
const modelSelect = app.querySelector<HTMLSelectElement>("#model-select")!;
const toggleButton = app.querySelector<HTMLButtonElement>("#toggle")!;
const video = app.querySelector<HTMLVideoElement>("#camera")!;
const canvas = app.querySelector<HTMLCanvasElement>("#view")!;
const fpsLabel = app.querySelector<HTMLDivElement>("#fps")!;
const statusLabel = app.querySelector<HTMLDivElement>("#status")!;
const ctx = canvas.getContext("2d")!;

let stream: MediaStream | null = null;
let detector: PoseDetector | null = null;
let detectorVariant: ModelVariant | null = null;
let running = false;
let rafId = 0;
let lastVideoTime = -1;
let lastPeopleCount = -1;
const fps = new FpsCounter();

function setStatus(text: string, isError = false): void {
  statusLabel.textContent = text;
  statusLabel.classList.toggle("error", isError);
}

function setControlsLocked(locked: boolean): void {
  cameraSelect.disabled = locked;
  modelSelect.disabled = locked;
}

async function populateCameras(): Promise<void> {
  try {
    const cameras = await listCameras();
    cameraSelect.innerHTML = cameras
      .map((c) => `<option value="${c.deviceId}">${escapeHtml(c.label)}</option>`)
      .join("");
  } catch (err) {
    setStatus(err instanceof CameraError ? err.message : String(err), true);
  }
}

async function ensureDetector(variant: ModelVariant): Promise<PoseDetector> {
  if (detector && detectorVariant === variant) return detector;
  detector?.close();
  setStatus(strings.statusLoadingModel);
  detector = await PoseDetector.create({ variant, numPoses: MAX_PLAYERS });
  detectorVariant = variant;
  console.info(`Pose model "${variant}" loaded (${detector.delegate})`);
  return detector;
}

async function start(): Promise<void> {
  toggleButton.disabled = true;
  setControlsLocked(true);
  try {
    const poseDetector = await ensureDetector(modelSelect.value as ModelVariant);
    setStatus(strings.statusStartingCamera);
    stream = await openStream(cameraSelect.value || undefined);
    video.srcObject = stream;
    await video.play();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    running = true;
    lastVideoTime = -1;
    lastPeopleCount = -1;
    fps.reset();
    fpsLabel.hidden = false;
    toggleButton.textContent = strings.stop;
    toggleButton.classList.remove("primary");
    loop(poseDetector);
  } catch (err) {
    stop();
    const message =
      err instanceof CameraError ? err.message : `${strings.errorModel} (${String(err)})`;
    setStatus(message, true);
  } finally {
    toggleButton.disabled = false;
  }
}

function stop(): void {
  running = false;
  cancelAnimationFrame(rafId);
  stopStream(stream);
  stream = null;
  video.srcObject = null;
  fpsLabel.hidden = true;
  toggleButton.textContent = strings.start;
  toggleButton.classList.add("primary");
  setControlsLocked(false);
  setStatus(strings.statusIdle);
}

function loop(poseDetector: PoseDetector): void {
  if (!running) return;
  rafId = requestAnimationFrame(() => loop(poseDetector));

  // Only run detection when the camera delivered a new frame.
  if (video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;

  const now = performance.now();
  const poses = poseDetector.detect(video, now);

  // Mirrored camera image, like looking into a mirror.
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  poses.forEach((pose, i) => drawSkeleton(ctx, pose, { color: colorForIndex(i), mirror: true }));

  fpsLabel.textContent = strings.fps(fps.tick(now));
  if (poses.length !== lastPeopleCount) {
    lastPeopleCount = poses.length;
    setStatus(strings.statusRunning(poses.length));
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

toggleButton.addEventListener("click", () => (running ? stop() : void start()));
navigator.mediaDevices?.addEventListener?.("devicechange", () => {
  if (!running) void populateCameras();
});

void populateCameras();
