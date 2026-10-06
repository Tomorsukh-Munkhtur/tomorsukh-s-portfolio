import * as THREE from 'three';
import { COMMON } from './glsl';
import { CAMERA_Z, rng, terrainHeight } from './terrain';

type Uniforms = Record<string, THREE.IUniform>;

/** What part of the world the camera currently sees, for placing things in view. */
export interface View {
  /** tan(horizontal half-FOV). */
  tanHalfW: number;
}

// ---------------------------------------------------------------- ground

export function createGround(shared: Uniforms) {
  const geo = new THREE.PlaneGeometry(400, 112, 200, 112);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -36);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();

  const mat = new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        vNormal = normal;
        gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main() {
        vec3 n = normalize(vNormal);
        float v = noise2(vWorld.xz * 0.7) * 0.6 + noise2(vWorld.xz * 3.1) * 0.4;
        vec3 col = mix(vec3(0.06, 0.05, 0.13), vec3(0.08, 0.12, 0.12), v);
        col += vec3(0.55, 0.28, 0.35) * max(dot(n, uSunDir), 0.0) * 0.3; // warm sunlit slopes
        col += vec3(0.3, 0.22, 0.55) * 0.12 * n.y;                         // violet sky fill
        gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
      }`,
  });
  return new THREE.Mesh(geo, mat);
}

// ------------------------------------------------------------- mountains

const MOUNTAIN_LAYERS = [
  { z: -160, base: -3, amp: 15, seed: 3, top: [0.46, 0.38, 0.68] },
  { z: -118, base: -3, amp: 10, seed: 11, top: [0.3, 0.24, 0.52] },
  { z: -84, base: -3, amp: 7, seed: 23, top: [0.18, 0.14, 0.36] },
];

/** Three hazy ridge silhouettes, lighter with distance, misty at their feet. */
export function createMountains(shared: Uniforms) {
  const group = new THREE.Group();
  for (const layer of MOUNTAIN_LAYERS) {
    const rand = rng(layer.seed);
    const phases = Array.from({ length: 4 }, () => rand() * Math.PI * 2);
    const shape = new THREE.Shape();
    const W = 520;
    shape.moveTo(-W, layer.base - 6);
    for (let i = 0; i <= 260; i++) {
      const x = -W + (i / 260) * W * 2;
      const r =
        0.5 * Math.sin(x * 0.012 + phases[0]) +
        0.3 * Math.sin(x * 0.031 + phases[1]) +
        0.15 * Math.abs(Math.sin(x * 0.07 + phases[2])) +
        0.06 * Math.sin(x * 0.19 + phases[3]);
      shape.lineTo(x, layer.base + layer.amp * (0.55 + r * 0.6));
    }
    shape.lineTo(W, layer.base - 6);
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.ShaderMaterial({
        uniforms: {
          ...shared,
          uTop: { value: new THREE.Vector3(...layer.top) },
          uBase: { value: layer.base },
          uPeak: { value: layer.base + layer.amp },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() {
            vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          ${COMMON}
          uniform vec3 uTop;
          uniform float uBase;
          uniform float uPeak;
          varying vec3 vWorld;
          void main() {
            float t = smoothstep(uBase, uPeak, vWorld.y);
            float sun = pow(max(dot(normalize(vWorld - cameraPosition), uSunDir), 0.0), 6.0);
            vec3 mist = mix(uFogColor, uFogWarm, sun);
            vec3 col = mix(mist, uTop, pow(t, 0.5));
            col = mix(col, uFogWarm, sun * 0.35 * (1.0 - t));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    );
    mesh.position.z = layer.z;
    group.add(mesh);
  }
  return group;
}

// ------------------------------------------------ distant flower specks

// Same garden-cosmos family as the 3D flowers, slightly cooled by the twilight.
const SPECK_COLORS = [
  [0.97, 0.93, 0.95],
  [0.97, 0.74, 0.86],
  [0.95, 0.55, 0.76],
  [0.86, 0.32, 0.6],
  [0.72, 0.16, 0.36],
  [0.82, 0.72, 0.96],
];

/** Thousands of tiny blossoms dusting the hills, where full 3D flowers would be sub-pixel. */
export function createSpecks(shared: Uniforms, count: number) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(count), 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: /* glsl */ `
      uniform float uPixel;
      attribute vec3 color;
      attribute float size;
      varying vec3 vColor;
      varying vec3 vWorld;
      void main() {
        vec4 mv = viewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(size * uPixel / -mv.z, 1.0);
        vColor = color;
        vWorld = position;
      }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      varying vec3 vColor;
      varying vec3 vWorld;
      void main() {
        // A tiny eight-petalled rosette with a golden centre rather than a flat dot.
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = atan(c.y, c.x);
        if (d > 0.5 * (0.72 + 0.28 * abs(cos(a * 4.0)))) discard;
        vec3 col = mix(vColor * 0.8, vColor, smoothstep(0.1, 0.4, d));
        col = mix(vec3(1.0, 0.8, 0.25), col, smoothstep(0.08, 0.14, d));
        gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
      }`,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  const layout = (view: View) => {
    const rand = rng(41);
    const p = geo.attributes.position.array as Float32Array;
    const c = geo.attributes.color.array as Float32Array;
    const s = geo.attributes.size.array as Float32Array;
    for (let i = 0; i < count; i++) {
      // Spread evenly over the visible hills, from just behind the 3D flowers to the valley.
      const z = -6 - Math.pow(rand(), 0.8) * 28;
      const half = (CAMERA_Z - z) * view.tanHalfW * 1.25 + 2;
      const x = (rand() * 2 - 1) * half;
      p.set([x, terrainHeight(x, z) + 0.03, z], i * 3);
      c.set(SPECK_COLORS[(rand() * SPECK_COLORS.length) | 0], i * 3);
      s[i] = 0.05 + rand() * 0.06;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.size.needsUpdate = true;
  };

  return { object: points, layout };
}

// ---------------------------------------------------- glowing light ribbon

/**
 * The ribbon of light draped over the hills: parallel strands of glowing dots
 * with bright pulses travelling along them.
 */
export function createRibbon(shared: Uniforms, perStrand: number) {
  const STRANDS = 9;
  const count = STRANDS * perStrand;
  const rand = rng(5);
  const position = new Float32Array(count * 3);
  const u = new Float32Array(count);
  const strand = new Float32Array(count);
  const seed = new Float32Array(count);

  for (let s = 0; s < STRANDS; s++) {
    const k = (s / (STRANDS - 1)) * 2 - 1; // -1 … 1 across the ribbon
    for (let i = 0; i < perStrand; i++) {
      const idx = s * perStrand + i;
      const t = (i + rand() * 0.6) / perStrand;
      const x = -20 + 40 * t;
      // Over the first row of hills, floating a little above them so it stays in view.
      const zc = -7.8 - 1.4 * Math.sin(t * Math.PI * 2.2 + 0.4) - 0.6 * Math.sin(t * Math.PI * 5.3);
      const z = zc + k * 0.6 + (rand() - 0.5) * 0.05;
      const lift = 0.3 + (1 - k * k) * 0.3 + 0.18 * Math.sin(t * 30 + k * 2.5);
      position.set([x, terrainHeight(x, z) + lift, z], idx * 3);
      u[idx] = t;
      strand[idx] = k;
      seed[idx] = rand();
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('aU', new THREE.BufferAttribute(u, 1));
  geo.setAttribute('aStrand', new THREE.BufferAttribute(strand, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const material = (size: number, strength: number) =>
    new THREE.ShaderMaterial({
      uniforms: { ...shared, uSize: { value: size }, uStrength: { value: strength } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uPixel;
        uniform float uSize;
        uniform float uFogNear;
        uniform float uFogFar;
        attribute float aU;
        attribute float aStrand;
        attribute float aSeed;
        varying vec3 vColor;
        varying float vGlow;
        void main() {
          vec4 mv = viewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          // Light pulses racing along the ribbon.
          float pulse = pow(max(0.0, sin((aU * 2.6 - uTime * 0.07) * 6.2832)), 14.0);
          float twinkle = 0.6 + 0.4 * sin(uTime * (2.0 + aSeed * 3.0) + aSeed * 50.0);
          // Intro: the ribbon lights up from the centre outward.
          float reveal = smoothstep(0.0, 0.12, uTime * 0.16 - abs(aU - 0.5));
          float haze = 1.0 - 0.55 * smoothstep(uFogNear, uFogFar, length(position - cameraPosition));
          vGlow = (0.8 + 1.2 * pulse) * twinkle * reveal * haze;
          vec3 edge = mix(vec3(0.78, 0.66, 1.0), vec3(1.0, 0.6, 0.85), step(0.5, fract(aSeed * 7.0)));
          vColor = mix(edge, vec3(1.0, 0.97, 1.0), max(1.0 - abs(aStrand) * 1.3, pulse));
          gl_PointSize = uSize * uPixel / -mv.z * (1.0 + pulse * 0.4);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uStrength;
        varying vec3 vColor;
        varying float vGlow;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vColor * vGlow * uStrength, a * a);
        }`,
    });

  const group = new THREE.Group();
  const core = new THREE.Points(geo, material(0.055, 1));
  const glow = new THREE.Points(geo, material(0.34, 0.065));
  core.frustumCulled = glow.frustumCulled = false;
  core.renderOrder = glow.renderOrder = 5;
  group.add(glow, core);
  return group;
}
