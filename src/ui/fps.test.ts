import { describe, expect, it } from "vitest";
import { FpsCounter } from "./fps";

describe("FpsCounter", () => {
  it("returns 0 until two frames are known", () => {
    const fps = new FpsCounter();
    expect(fps.tick(0)).toBe(0);
  });

  it("measures a steady 30 fps", () => {
    const fps = new FpsCounter();
    let value = 0;
    for (let i = 0; i <= 30; i++) value = fps.tick(i * (1000 / 30));
    expect(value).toBeCloseTo(30, 0);
  });

  it("forgets frames outside the window", () => {
    const fps = new FpsCounter(1000);
    for (let i = 0; i < 10; i++) fps.tick(i * 10); // burst at t≈0
    const value = fps.tick(5000);
    expect(value).toBe(0); // only one frame left in the window
  });
});
