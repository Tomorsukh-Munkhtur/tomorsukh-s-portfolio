/*
 * GLSL shared by the meadow's custom shaders. Colours in these shaders are
 * written directly in display (sRGB) space; they skip three's colour management.
 */

/** Time, sun, fog and noise helpers. */
export const COMMON = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uFogColor;
uniform vec3 uFogWarm;
uniform float uFogNear;
uniform float uFogFar;

// Distance haze that turns warmer toward the sun.
vec3 applyFog(vec3 col, vec3 wp) {
  vec3 d = wp - cameraPosition;
  float f = smoothstep(uFogNear, uFogFar, length(d));
  float warm = pow(max(dot(normalize(d), uSunDir), 0.0), 3.0);
  return mix(col, mix(uFogColor, uFogWarm, warm), f);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}
`;

/** Wind, cursor push and rotation helpers for anything that sways. */
export const SWAY = /* glsl */ `
uniform float uTime;
uniform vec3 uMouse;
uniform float uMouseStrength;

// Sideways displacement of a stem's tip, as a fraction of its height.
// Gusts roll across the field toward +x; each plant adds its own flutter.
vec2 windAt(vec2 xz, float phase) {
  float gust = 0.5 + 0.5 * sin(uTime * 0.85 - xz.x * 0.32 + xz.y * 0.21);
  float flutter = sin(uTime * 1.6 + phase) * 0.6 + sin(uTime * 2.7 + phase * 1.7) * 0.4;
  return vec2(0.06 + 0.2 * gust + 0.07 * flutter, 0.05 * flutter);
}

// Bend away from the cursor's spot on the ground.
vec2 mousePush(vec2 xz) {
  vec2 d = xz - uMouse.xz;
  float l = max(length(d), 1e-4);
  return d / l * uMouseStrength * (1.0 - smoothstep(0.0, 1.5, l)) * 0.85;
}

mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

float easeOutCubic(float x) { x = clamp(x, 0.0, 1.0); return 1.0 - pow(1.0 - x, 3.0); }
float easeOutBack(float x) {
  x = clamp(x, 0.0, 1.0);
  float c = 1.6;
  return 1.0 + (c + 1.0) * pow(x - 1.0, 3.0) + c * pow(x - 1.0, 2.0);
}
`;
