import { strings } from "../ui/strings";

export interface CameraInfo {
  deviceId: string;
  label: string;
}

export class CameraError extends Error {
  constructor(
    message: string,
    readonly kind: "no-camera" | "permission" | "other",
  ) {
    super(message);
  }
}

/**
 * Lists video inputs. Browsers only expose labels after permission was
 * granted once, so we briefly open the default camera if labels are empty.
 */
export async function listCameras(): Promise<CameraInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    throw new CameraError(strings.errorNoCamera, "no-camera");
  }
  let devices = await navigator.mediaDevices.enumerateDevices();
  let videos = devices.filter((d) => d.kind === "videoinput");

  if (videos.length > 0 && videos.every((d) => !d.label)) {
    const probe = await openStream();
    probe.getTracks().forEach((t) => t.stop());
    devices = await navigator.mediaDevices.enumerateDevices();
    videos = devices.filter((d) => d.kind === "videoinput");
  }

  if (videos.length === 0) {
    throw new CameraError(strings.errorNoCamera, "no-camera");
  }
  return videos.map((d, i) => ({
    deviceId: d.deviceId,
    label: d.label || strings.cameraFallbackName(i + 1),
  }));
}

/** Opens a camera stream, preferring 1280×720 for a wide view of the room. */
export async function openStream(deviceId?: string): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
    });
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
      throw new CameraError(strings.errorPermission, "permission");
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") {
      throw new CameraError(strings.errorNoCamera, "no-camera");
    }
    throw new CameraError(String(err), "other");
  }
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}
