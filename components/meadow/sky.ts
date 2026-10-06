import * as THREE from 'three';
import { COMMON } from './glsl';

/**
 * Sunset sky drawn on an inside-out sphere: gradient, sun, drifting clouds and
 * twinkling stars. The sphere is centred on the camera, so only direction matters.
 */
export function createSkyMaterial(shared: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({
    uniforms: shared,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vDir = wp.xyz - cameraPosition;
        gl_Position = projectionMatrix * viewMatrix * wp;
        gl_Position.z = gl_Position.w * 0.9999; // always behind everything
      }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      varying vec3 vDir;

      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise2(p);
          p = p * 2.03 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v;
      }

      float hash13(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.zyx + 31.32);
        return fract((p.x + p.y) * p.z);
      }

      void main() {
        vec3 dir = normalize(vDir);
        float h = dir.y;
        float sun = max(dot(dir, uSunDir), 0.0);
        float sunSide = pow(sun, 2.0);

        // Horizon → zenith gradient, warmer on the sun's side.
        vec3 horizon = mix(vec3(0.86, 0.47, 0.62), vec3(1.0, 0.66, 0.45), sunSide);
        vec3 col = mix(horizon, vec3(0.66, 0.36, 0.66), smoothstep(0.0, 0.05, h));
        col = mix(col, vec3(0.34, 0.24, 0.62), smoothstep(0.04, 0.13, h));
        col = mix(col, vec3(0.13, 0.12, 0.42), smoothstep(0.11, 0.26, h));
        col = mix(col, vec3(0.04, 0.04, 0.16), smoothstep(0.24, 0.6, h));
        col = mix(col, vec3(0.16, 0.1, 0.24), smoothstep(0.0, -0.1, h)); // below the horizon

        // Sun: wide warm wash, halo, bright disc.
        col += vec3(1.0, 0.6, 0.38) * pow(sun, 5.0) * 0.38;
        col += vec3(1.0, 0.82, 0.6) * pow(sun, 60.0) * 0.55;
        col += vec3(1.0, 0.97, 0.9) * smoothstep(0.9992, 0.9997, sun) * 1.5;

        // Clouds projected onto a plane overhead: dusky violet, with dense
        // cores and the sun-facing side catching pink and orange light.
        vec2 uv = dir.xz / (h + 0.09);
        float n = fbm(uv * 0.32 + vec2(uTime * 0.008, 0.0));
        float cloud = smoothstep(0.48, 0.78, n) * smoothstep(0.012, 0.1, h) * (1.0 - smoothstep(0.4, 0.75, h));
        float lit = clamp(0.2 + pow(sun, 2.0) * 0.9 + (n - 0.6) * 1.8 - h * 0.6, 0.0, 1.0);
        vec3 cloudCol = mix(vec3(0.22, 0.15, 0.42), vec3(0.98, 0.56, 0.6), lit);
        col = mix(col, cloudCol, cloud * 0.85);

        // Stars in the upper sky.
        vec3 sp = dir * 260.0;
        vec3 cell = floor(sp);
        float hs = hash13(cell);
        float star = step(0.9965, hs) * smoothstep(0.16, 0.0, length(fract(sp) - 0.5));
        float twinkle = 0.55 + 0.45 * sin(uTime * (1.0 + hs * 3.0) + hs * 40.0);
        col += vec3(1.0, 0.95, 0.92) * star * twinkle * smoothstep(0.1, 0.3, h) * (1.0 - cloud);

        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

export function createSky(material: THREE.ShaderMaterial) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), material);
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  return sky;
}
