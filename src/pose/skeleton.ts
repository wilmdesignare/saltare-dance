import { PoseLandmarker } from "@mediapipe/tasks-vision";
import type { Pose } from "./detector";

const CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS;
/** Face landmarks (0–10) are skipped: they add clutter, not dance info. */
const FIRST_BODY_LANDMARK = 11;
const MIN_VISIBILITY = 0.5;

export interface DrawOptions {
  color: string;
  mirror: boolean;
  lineWidth?: number;
}

/** Draws one pose onto a canvas whose size matches the video frame. */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  { color, mirror, lineWidth = 6 }: DrawOptions,
): void {
  const { width, height } = ctx.canvas;
  const px = (i: number) => (mirror ? 1 - pose[i].x : pose[i].x) * width;
  const py = (i: number) => pose[i].y * height;
  const visible = (i: number) =>
    i >= FIRST_BODY_LANDMARK && (pose[i]?.visibility ?? 0) >= MIN_VISIBILITY;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;

  ctx.beginPath();
  for (const { start, end } of CONNECTIONS) {
    if (!visible(start) || !visible(end)) continue;
    ctx.moveTo(px(start), py(start));
    ctx.lineTo(px(end), py(end));
  }
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  for (let i = FIRST_BODY_LANDMARK; i < pose.length; i++) {
    if (!visible(i)) continue;
    ctx.beginPath();
    ctx.arc(px(i), py(i), lineWidth * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head marker: a circle around the nose, sized by shoulder width.
  const nose = pose[0];
  if (nose && (nose.visibility ?? 0) >= MIN_VISIBILITY && visible(11) && visible(12)) {
    const shoulder = Math.hypot(px(11) - px(12), py(11) - py(12));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * 0.75;
    ctx.beginPath();
    ctx.arc(px(0), py(0), Math.max(shoulder * 0.35, 10), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
