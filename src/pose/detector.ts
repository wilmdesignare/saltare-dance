import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type ModelVariant = "lite" | "full";

export type Pose = NormalizedLandmark[];

const MODEL_URLS: Record<ModelVariant, string> = {
  lite: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
  full: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
};

/** WASM runtime is copied into public/ by scripts/copy-wasm.mjs. */
const WASM_PATH = `${import.meta.env.BASE_URL}mediapipe/wasm`;

export interface DetectorOptions {
  variant: ModelVariant;
  numPoses: number;
}

/**
 * Thin wrapper around MediaPipe's PoseLandmarker in VIDEO mode.
 * Tries the GPU delegate first and falls back to CPU.
 */
export class PoseDetector {
  private lastTimestamp = -1;

  private constructor(
    private readonly landmarker: PoseLandmarker,
    readonly delegate: "GPU" | "CPU",
  ) {}

  static async create(options: DetectorOptions): Promise<PoseDetector> {
    const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
    for (const delegate of ["GPU", "CPU"] as const) {
      try {
        const landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URLS[options.variant], delegate },
          runningMode: "VIDEO",
          numPoses: options.numPoses,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        return new PoseDetector(landmarker, delegate);
      } catch (err) {
        if (delegate === "CPU") throw err;
        console.warn("GPU delegate failed, falling back to CPU", err);
      }
    }
    throw new Error("unreachable");
  }

  /** Detects all poses in the current video frame. */
  detect(video: HTMLVideoElement, now: number): Pose[] {
    // MediaPipe requires strictly increasing timestamps.
    const timestamp = Math.max(now, this.lastTimestamp + 1);
    this.lastTimestamp = timestamp;
    return this.landmarker.detectForVideo(video, timestamp).landmarks;
  }

  close(): void {
    this.landmarker.close();
  }
}
