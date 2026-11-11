// The four player colours. Profiles (milestone 2) pick one of these each.
export const PLAYER_COLORS = [
  { id: "pink", name: "Pink", hex: "#FF3EA5" },
  { id: "cyan", name: "Cyan", hex: "#00D1FF" },
  { id: "yellow", name: "Gelb", hex: "#FFD400" },
  { id: "green", name: "Grün", hex: "#3DFF6E" },
] as const;

export type PlayerColorId = (typeof PLAYER_COLORS)[number]["id"];

/** Colour for the n-th detected person until profiles are assigned. */
export function colorForIndex(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length].hex;
}
