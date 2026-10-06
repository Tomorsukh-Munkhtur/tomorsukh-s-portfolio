/*
 * Shared landscape math for the hero meadow. Units are metres; the camera sits
 * near z = 9 looking toward -z, so smaller z is further away.
 */

export const CAMERA_Z = 9;

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Ground height at (x, z): a flowery foreground bank rising toward the camera,
 * a dip behind it, rolling hills in the middle distance and a misty far valley.
 */
export function terrainHeight(x: number, z: number) {
  // 0 in the foreground, 1 across the hills, back to 0 in the far valley.
  const band = smoothstep(-1, -7, z) * (1 - smoothstep(-26, -40, z));
  const hills =
    1.05 * Math.sin(x * 0.21 + 0.6) +
    0.6 * Math.sin(x * 0.43 - z * 0.17 + 2.1) +
    0.4 * Math.sin(z * 0.29 + x * 0.06 + 0.4);
  const ripples = 0.06 * Math.sin(x * 0.7 + 1.0) + 0.05 * Math.sin(z * 1.1 + x * 0.35);
  const bank = smoothstep(-1, 8, z) * 0.55;
  // Lowering everything past the bank lets the hills' slopes show above the flowers.
  const dip = smoothstep(3, -3, z) * (1 - smoothstep(-30, -40, z)) * 0.7;
  const valley = smoothstep(-34, -55, z) * 1.6;
  return ripples + bank - dip + band * (hills * 0.9 + 1.2) - valley;
}

/** Deterministic PRNG so the field looks the same on every load and resize. */
export function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
