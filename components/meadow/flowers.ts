import * as THREE from 'three';
import { COMMON, SWAY } from './glsl';
import type { View } from './landscape';
import { CAMERA_Z, rng, terrainHeight } from './terrain';

type Uniforms = Record<string, THREE.IUniform>;

// Cosmos petal outline, obovate (narrow at the base, broad near the tip):
// [distance from centre, half-width], both relative to petal length.
const PETAL_ROWS: [number, number][] = [
  [0, 0.025],
  [0.12, 0.09],
  [0.3, 0.18],
  [0.5, 0.25],
  [0.7, 0.3],
  [0.86, 0.31],
  [1, 0.27],
];
// Across each row: edge, half-way, midrib, half-way, edge.
const PETAL_COLUMNS = [-1, -0.5, 0, 0.5, 1];
// The tip row is pulled in at the half-way columns, leaving three shallow teeth.
const TIP_R = [0.96, 0.91, 1, 0.91, 0.96];

// Garden cosmos colours: [weight, tip colour, base colour, chance of a dark "eye" ring].
const PETAL_COLORS: [number, number[], number[], number][] = [
  [0.28, [0.98, 0.95, 0.96], [0.93, 0.9, 0.74], 0.15], // white, warm near the centre
  [0.26, [0.99, 0.79, 0.88], [0.93, 0.5, 0.7], 0.3], // light pink
  [0.2, [0.97, 0.6, 0.78], [0.86, 0.3, 0.58], 0.25], // pink
  [0.14, [0.9, 0.32, 0.6], [0.72, 0.12, 0.42], 0], // magenta
  [0.06, [0.78, 0.14, 0.34], [0.52, 0.05, 0.2], 0], // crimson
  [0.06, [0.88, 0.79, 0.98], [0.72, 0.56, 0.9], 0], // pale lilac
];

function pickColor(r: number) {
  for (const entry of PETAL_COLORS) {
    if (r < entry[0]) return entry;
    r -= entry[0];
  }
  return PETAL_COLORS[0];
}

// Part ids shared by the geometry and the shaders.
const STEM = 0;
const PETAL = 1;
const DISC = 2;
const CALYX = 3;
const LEAF = 4;

/**
 * One cosmos plant in a single geometry: stem, two leaves, green calyx, eight
 * petals and the golden disc. Stem, leaf and petal vertices carry parameters
 * rather than final positions; the vertex shader builds the shape so every
 * instance can grow, bloom, flutter and bend on its own.
 *
 * `detailed` = false builds a light version (~1/4 of the triangles, no leaves
 * or calyx) for distant flowers that are only a few pixels across.
 */
function flowerGeometry(petals: number, detailed: boolean) {
  const pos: number[] = [];
  const part: number[] = [];
  const param: number[] = [];
  const index: number[] = [];
  const vert = (x: number, y: number, z: number, p: number, a = 0, b = 0, c = 0) => {
    pos.push(x, y, z);
    part.push(p);
    param.push(a, b, c);
    return pos.length / 3 - 1;
  };
  const grid = (rows: number[][]) => {
    for (let i = 0; i < rows.length - 1; i++) {
      for (let j = 0; j < rows[i].length - 1; j++) {
        const a = rows[i][j];
        const b = rows[i][j + 1];
        const c = rows[i + 1][j];
        const d = rows[i + 1][j + 1];
        index.push(a, c, b, b, c, d);
      }
    }
  };

  // Stem: a triangular prism in rings, from the ground (y = 0) to the head (y = 1).
  const SIDES = 3;
  const RINGS = detailed ? 6 : 4;
  for (let r = 0; r < RINGS; r++) {
    for (let k = 0; k < SIDES; k++) {
      const a = (k / SIDES) * Math.PI * 2;
      vert(Math.cos(a), r / (RINGS - 1), Math.sin(a), STEM);
    }
  }
  for (let r = 0; r < RINGS - 1; r++) {
    for (let k = 0; k < SIDES; k++) {
      const a = r * SIDES + k;
      const b = r * SIDES + ((k + 1) % SIDES);
      index.push(a, a + SIDES, b, b, a + SIDES, b + SIDES);
    }
  }

  // Leaves: slender blades on opposite sides of the stem. position.y = where on
  // the stem it attaches; params = (t along the leaf, signed half-width, direction).
  const leaves = detailed
    ? [
        [0.32, 0.6],
        [0.58, 0.6 + Math.PI + 0.5],
      ]
    : [];
  for (const [attach, angle] of leaves) {
    const rows: number[][] = [];
    for (let s = 0; s <= 5; s++) {
      const t = s / 5;
      const hw = 0.016 * Math.sin(Math.min(t * 1.15, 1) * Math.PI) + 0.002;
      rows.push([vert(0, attach, 0, LEAF, t, -hw, angle), vert(0, attach, 0, LEAF, t, hw, angle)]);
    }
    grid(rows);
  }

  // Calyx: a star of green bracts cupping the underside of the head.
  if (detailed) {
    const calyxBase = vert(0, -0.08, 0, CALYX);
    const calyxFirst = pos.length / 3;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const r = k % 2 ? 0.07 : 0.17;
      vert(Math.cos(a) * r, k % 2 ? -0.03 : -0.01, Math.sin(a) * r, CALYX);
    }
    for (let k = 0; k < 16; k++) index.push(calyxBase, calyxFirst + k, calyxFirst + ((k + 1) % 16));
  }

  // Petals: rows × columns each; params = (r, w, angle around the head).
  const petalRows = detailed ? PETAL_ROWS : [0, 2, 4, 6].map((i) => PETAL_ROWS[i]);
  const columns = detailed ? PETAL_COLUMNS : [-1, 0, 1];
  const tipR = detailed ? TIP_R : [0.97, 1, 0.97];
  for (let p = 0; p < petals; p++) {
    const th = (p / petals) * Math.PI * 2;
    const rows = petalRows.map(([r, hw], i) =>
      columns.map((c, j) => vert(0, 0, 0, PETAL, i === petalRows.length - 1 ? tipR[j] : r, c * hw, th)),
    );
    grid(rows);
  }

  // Disc: a low golden dome.
  const top = vert(0, 0.075, 0, DISC);
  const rings = detailed
    ? [
        [0.11, 0.055],
        [0.2, 0.015],
      ]
    : [[0.2, 0.015]];
  const SEG = detailed ? 14 : 8;
  const ringStart = pos.length / 3;
  for (const [r, y] of rings) {
    for (let k = 0; k < SEG; k++) {
      const a = (k / SEG) * Math.PI * 2;
      vert(Math.cos(a) * r, y, Math.sin(a) * r, DISC);
    }
  }
  for (let k = 0; k < SEG; k++) {
    const k1 = (k + 1) % SEG;
    index.push(top, ringStart + k1, ringStart + k);
    // Join each ring to the next one out.
    for (let ring = 0; ring < rings.length - 1; ring++) {
      const a = ringStart + ring * SEG + k;
      const b = ringStart + ring * SEG + k1;
      index.push(a, b, a + SEG, b, b + SEG, a + SEG);
    }
  }

  const geo = new THREE.InstancedBufferGeometry();
  geo.setIndex(index);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  geo.setAttribute('aParam', new THREE.Float32BufferAttribute(param, 3));
  return geo;
}

function instanced(geo: THREE.InstancedBufferGeometry, name: string, count: number, size: number) {
  const attr = new THREE.InstancedBufferAttribute(new Float32Array(count * size), size);
  geo.setAttribute(name, attr);
  return attr;
}

/** Which slice of the field a flower mesh fills, as distances from the camera. */
export interface FlowerBand {
  near: number;
  far: number;
  /** Full geometry for close flowers, the light version for distant ones. */
  detailed: boolean;
  seed: number;
}

export function createFlowers(shared: Uniforms, count: number, band: FlowerBand) {
  const geo = flowerGeometry(8, band.detailed);
  geo.instanceCount = count;
  const iPos = instanced(geo, 'iPos', count, 3);
  const iShape = instanced(geo, 'iShape', count, 4); // stem height, head size, sway phase, bloom delay
  const iPose = instanced(geo, 'iPose', count, 4); // face tilt, petal yaw, lean x, lean z
  const iExtra = instanced(geo, 'iExtra', count, 4); // face yaw, bud (0/1), eye ring (0/1), seed
  const iColor = instanced(geo, 'iColor', count, 3); // petal tip colour
  const iBase = instanced(geo, 'iBase', count, 3); // petal base colour

  const mat = new THREE.ShaderMaterial({
    uniforms: shared,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      ${SWAY}
      attribute float aPart;
      attribute vec3 aParam;
      attribute vec3 iPos;
      attribute vec4 iShape;
      attribute vec4 iPose;
      attribute vec4 iExtra;
      attribute vec3 iColor;
      attribute vec3 iBase;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying vec3 vAlbedo;
      varying vec4 vInfo; // part, r / height, vein coordinate, eye ring
      varying vec2 vDisc;

      float hash11(float p) {
        p = fract(p * 0.1031);
        p *= p + 33.33;
        p *= p + p;
        return fract(p);
      }

      // Point on a petal in head space (head faces +y). r runs base → tip,
      // w across the petal; the petal arches up, its edges roll down, a groove
      // runs along the midrib and the blade ripples slightly.
      vec3 petalPoint(float r, float w, float th, float phi, float curl, float len) {
        float el = phi + curl * r;
        float rr = r * len;
        float up = rr * sin(el) - w * w * 0.6 - 0.012 * exp(-abs(w) * 40.0) * r + 0.012 * sin(r * 8.0 + th * 3.0) * r;
        float rad = rr * cos(el);
        vec2 d = vec2(cos(th), sin(th));
        return vec3(d.x * rad - d.y * w, up, d.y * rad + d.x * w);
      }

      void main() {
        float H = iShape.x, S = iShape.y, phase = iShape.z, delay = iShape.w;
        float grow = easeOutCubic((uTime - delay * 0.5) / 1.3);
        // Buds stay almost closed.
        float bloom = easeOutBack((uTime - 0.7 - delay) / 1.4) * mix(1.0, 0.1, iExtra.y);
        float open = clamp(bloom, 0.0, 1.0);

        vec2 wind = windAt(iPos.xz, phase);
        vec2 bend = wind + mousePush(iPos.xz) + iPose.zw;
        float h = H * grow;
        float sag = 1.0 - 0.3 * dot(bend, bend); // bending shortens the stem a little
        vec3 stemTop = vec3(bend.x * h, h * sag, bend.y * h);
        // Head: tilted toward the viewer, turned by its own yaw, then following the stem's bend.
        mat3 head = rotZ(-bend.x * 1.3) * rotX(bend.y * 1.3) * rotY(iExtra.x) * rotX(iPose.x);
        float headScale = S * grow;

        vec3 p;
        vec3 n;
        vInfo = vec4(aPart, 0.0, 0.0, 0.0);
        vDisc = vec2(0.0);

        if (aPart < 0.5) {
          // Stem
          float y = position.y;
          float thick = 0.006 + 0.004 * (1.0 - y);
          p = vec3(position.x * thick, y * h * sag, position.z * thick) + vec3(bend.x, 0.0, bend.y) * h * y * y;
          n = normalize(vec3(position.x, 0.2, position.z));
          vAlbedo = mix(vec3(0.12, 0.22, 0.1), vec3(0.3, 0.46, 0.22), y);
          vInfo.y = y;
        } else if (aPart > 3.5) {
          // Leaf, hanging off the stem
          float ya = position.y;
          vec3 attach = vec3(0.0, ya * h * sag, 0.0) + vec3(bend.x, 0.0, bend.y) * h * ya * ya;
          float t = aParam.x, A = aParam.z;
          float L = (0.1 + 0.12 * H) * grow;
          vec3 dir = vec3(cos(A), 0.0, sin(A));
          vec3 side = vec3(-sin(A), 0.0, cos(A));
          float slope = 0.45 - 1.1 * t;
          p = attach + dir * L * t + vec3(0.0, L * (0.45 * t - 0.55 * t * t), 0.0) + side * aParam.y * grow
            + vec3(wind.x, 0.0, wind.y) * L * t * t * 0.6;
          n = normalize(vec3(-dir.x * slope, 1.0, -dir.z * slope));
          vAlbedo = mix(vec3(0.14, 0.26, 0.12), vec3(0.28, 0.44, 0.2), t);
        } else {
          vec3 hp;
          if (aPart < 1.5) {
            // Petal
            float r = aParam.x, w = aParam.y;
            float pid = hash11(aParam.z * 13.7 + iExtra.w * 91.0); // each petal a little different
            float th = aParam.z + iPose.y + (pid - 0.5) * 0.09;
            float len = 0.9 + pid * 0.2;
            float flutter = sin(uTime * 5.0 + th * 3.0 + phase) * 0.05 * (0.4 + length(wind) * 2.0);
            float phi = mix(1.35, 0.06 + (pid - 0.5) * 0.2, bloom) + flutter * open;
            float curl = 0.3 * open;
            vec3 c = petalPoint(r, w, th, phi, curl, len);
            vec3 dr = petalPoint(r + 0.01, w, th, phi, curl, len) - c;
            vec3 dw = petalPoint(r, w + 0.01, th, phi, curl, len) - c;
            n = normalize(cross(dw, dr));
            hp = c * mix(0.3, 1.0, open);
            vAlbedo = mix(iBase, iColor, smoothstep(0.0, 0.85, r));
            vInfo = vec4(1.0, r, w / (r + 0.05), iExtra.z);
          } else if (aPart < 2.5) {
            // Disc
            hp = position * mix(0.6, 1.0, open);
            n = normalize(position * vec3(1.0, 3.0, 1.0) + vec3(0.0, 0.05, 0.0));
            vAlbedo = vec3(1.0, 0.78, 0.18);
            vDisc = position.xz / 0.2;
          } else {
            // Calyx
            hp = position * mix(0.8, 1.0, open);
            n = normalize(vec3(position.x, -0.5, position.z));
            vAlbedo = vec3(0.18, 0.32, 0.13);
          }
          p = stemTop + head * (hp * headScale);
          n = head * n;
        }

        vWorld = iPos + p;
        vNormal = n;
        gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying vec3 vAlbedo;
      varying vec4 vInfo;
      varying vec2 vDisc;

      void main() {
        vec3 v = normalize(cameraPosition - vWorld);
        vec3 n = normalize(vNormal);
        float facing = dot(n, v);
        if (facing < 0.0) n = -n; // thin surfaces: light the side we are looking at

        vec3 albedo = vAlbedo;
        float thin = 0.25; // how much sunlight passes through
        float part = vInfo.x;

        if (part > 0.5 && part < 1.5) {
          float r = vInfo.y;
          // Fine veins fanning out from the base.
          float vein = abs(sin(vInfo.z * 24.0));
          albedo *= 1.0 - 0.08 * smoothstep(0.7, 1.0, vein) * smoothstep(0.05, 0.3, r);
          // Optional dark crimson eye around the disc.
          albedo = mix(albedo, vec3(0.5, 0.05, 0.2), vInfo.w * (1.0 - smoothstep(0.1, 0.24, r)));
          // The base sits in the disc's shadow.
          albedo *= mix(0.75, 1.0, smoothstep(0.0, 0.22, r));
          thin = 0.85 * (0.5 + 0.5 * r);
        } else if (part > 1.5 && part < 2.5) {
          // Tightly packed florets, brighter pollen-laden ring at the rim.
          vec2 f = fract(vDisc * 9.0) - 0.5;
          float floret = smoothstep(0.5, 0.12, length(f));
          float ring = smoothstep(0.5, 0.85, length(vDisc));
          albedo = mix(vec3(0.86, 0.56, 0.1), vec3(1.0, 0.86, 0.25), ring);
          albedo *= 0.75 + 0.35 * floret;
          thin = 0.0;
        } else if (part > 2.5) {
          thin = 0.5; // calyx and leaves
        }

        vec3 L = uSunDir;
        float ndl = dot(n, L);
        vec3 sun = vec3(1.0, 0.72, 0.52);
        vec3 sky = vec3(0.68, 0.6, 0.92);

        vec3 light = sky * (0.45 + 0.25 * n.y)         // soft violet sky fill
                   + vec3(0.3, 0.18, 0.26) * 0.18      // bounce from the dusky ground
                   + sun * max(ndl, 0.0) * 0.8;        // low direct sun
        vec3 col = albedo * light;
        col += albedo * sun * (max(-ndl, 0.0) * 1.2 + 0.12) * thin; // sunset glowing through the petals
        if (part > 1.5 && part < 2.5) col += albedo * vec3(1.0, 0.8, 0.5) * 0.45; // sunlit golden disc
        float rim = pow(1.0 - abs(facing), 3.0);
        col += albedo * (sky * 0.25 + sun * 0.25 * thin) * rim;
        col += sun * pow(max(dot(n, normalize(L + v)), 0.0), 24.0) * 0.12; // satin sheen
        col *= 1.1;

        gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
      }`,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;

  const layout = (view: View) => {
    const rand = rng(band.seed);
    for (let i = 0; i < count; i++) {
      // Log-spaced depth: denser up close, where each flower covers more of the frame.
      const d = band.near * Math.pow(band.far / band.near, rand());
      const z = CAMERA_Z - d;
      const x = (rand() * 2 - 1) * (d * view.tanHalfW * 1.2 + 0.6);
      iPos.setXYZ(i, x, terrainHeight(x, z) - 0.02, z);
      const near = 1 - Math.min(d / 9.5, 1);
      const bud = rand() < 0.1;
      iShape.setXYZW(
        i,
        0.25 + rand() * 0.35,
        (0.07 + rand() * 0.045 + near * 0.02) * (bud ? 0.75 : 1),
        rand() * 6.283,
        rand() * 1.6 + (d / 19) * 0.6,
      );
      iPose.setXYZW(i, 0.4 + rand() * 0.75, rand() * 6.283, (rand() - 0.5) * 0.25, (rand() - 0.5) * 0.25);
      const [, tip, base, eyeChance] = pickColor(rand());
      iExtra.setXYZW(i, (rand() - 0.5) * 1.8, bud ? 1 : 0, rand() < eyeChance ? 1 : 0, rand());
      iColor.setXYZ(i, tip[0], tip[1], tip[2]);
      iBase.setXYZ(i, base[0], base[1], base[2]);
    }
    for (const a of [iPos, iShape, iPose, iExtra, iColor, iBase]) a.needsUpdate = true;
  };

  return { object: mesh, layout };
}

// ------------------------------------------------------------------ grass

function bladeGeometry() {
  // Tapering blade: rows at y = 0, 0.35, 0.7 with a single tip vertex.
  const rows: [number, number][] = [
    [0, 1],
    [0.35, 0.78],
    [0.7, 0.45],
  ];
  const pos: number[] = [];
  for (const [y, w] of rows) pos.push(-w, y, 0, w, y, 0);
  pos.push(0, 1, 0);
  const index = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6];
  const geo = new THREE.InstancedBufferGeometry();
  geo.setIndex(index);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}

export function createGrass(shared: Uniforms, count: number) {
  const geo = bladeGeometry();
  geo.instanceCount = count;
  const iPos = instanced(geo, 'iPos', count, 3);
  const iShape = instanced(geo, 'iShape', count, 4); // height, width, phase, yaw

  const mat = new THREE.ShaderMaterial({
    uniforms: shared,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      ${SWAY}
      attribute vec3 iPos;
      attribute vec4 iShape;
      varying vec3 vColor;
      varying vec3 vWorld;
      void main() {
        float H = iShape.x, W = iShape.y, yaw = iShape.w;
        float y = position.y;
        vec2 bend = windAt(iPos.xz, iShape.z) * 1.3 + mousePush(iPos.xz);
        vec3 lp = rotY(yaw) * vec3(position.x * W, y * H * (1.0 - 0.3 * dot(bend, bend)), 0.0);
        vec2 lean = vec2(cos(yaw + 1.57), sin(yaw + 1.57)) * 0.18;
        lp += vec3(bend.x + lean.x, 0.0, bend.y + lean.y) * H * y * y;
        vWorld = iPos + lp;
        vColor = mix(vec3(0.04, 0.08, 0.08), vec3(0.3, 0.42, 0.3), y) + vec3(0.25, 0.12, 0.1) * y * y;
        gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      varying vec3 vColor;
      varying vec3 vWorld;
      void main() {
        gl_FragColor = vec4(applyFog(vColor, vWorld), 1.0);
      }`,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;

  const layout = (view: View) => {
    const rand = rng(29);
    for (let i = 0; i < count; i++) {
      const d = 1.8 * Math.pow(19 / 1.8, rand());
      const z = CAMERA_Z - d;
      const x = (rand() * 2 - 1) * (d * view.tanHalfW * 1.2 + 0.6);
      iPos.setXYZ(i, x, terrainHeight(x, z) - 0.02, z);
      iShape.setXYZW(i, 0.18 + rand() * 0.34, 0.012 + rand() * 0.01, rand() * 6.283, rand() * 6.283);
    }
    iPos.needsUpdate = iShape.needsUpdate = true;
  };

  return { object: mesh, layout };
}

// ------------------------------------------------------------ drifting petals

/** Loose petals carried off by the wind, tumbling as they go. */
export function createPetals(shared: Uniforms, count: number) {
  const pos: number[] = [];
  for (const [r, w] of PETAL_ROWS) pos.push(r - 0.5, 0, -w, r - 0.5, 0.06 * Math.sin(r * 3), 0, r - 0.5, 0, w);
  const index: number[] = [];
  for (let i = 0; i < PETAL_ROWS.length - 1; i++) {
    const a = i * 3;
    const b = a + 3;
    index.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setIndex(index);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.instanceCount = count;
  const iSeed = instanced(geo, 'iSeed', count, 4);
  const rand = rng(53);
  for (let i = 0; i < count; i++) iSeed.setXYZW(i, rand(), rand(), rand(), rand());

  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uSpawn: { value: new THREE.Vector4(-8, 3, -6, 6) } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      ${SWAY}
      uniform vec4 uSpawn; // x range (min, max), z range (min, max)
      attribute vec4 iSeed;
      varying vec3 vColor;
      varying vec3 vWorld;
      void main() {
        float life = 6.0 + iSeed.x * 6.0;
        float t = uTime + iSeed.y * 40.0;
        float age = fract(t / life);
        float cycle = floor(t / life);
        // A fresh starting point every cycle.
        vec3 r = fract(vec3(iSeed.z * 13.1, iSeed.x * 7.7, iSeed.w * 5.3) + cycle * vec3(0.618, 0.414, 0.732));
        vec3 start = vec3(mix(uSpawn.x, uSpawn.y, r.x), 0.25 + r.y * 0.9, mix(uSpawn.z, uSpawn.w, r.z));
        float s = age * life;
        vec3 p = start + vec3(s * 0.85, s * 0.26 + sin(s * 1.3 + iSeed.x * 6.0) * 0.25, sin(s * 0.9 + iSeed.z * 6.0) * 0.5);
        float spin = s * (1.5 + iSeed.z * 2.5);
        float scale = 0.075 * smoothstep(0.0, 0.08, age) * (1.0 - smoothstep(0.85, 1.0, age)) * smoothstep(2.5, 4.5, uTime);
        vWorld = p + rotY(spin * 0.7) * rotX(spin) * (position * scale);
        vColor = mix(vec3(0.97, 0.56, 0.75), vec3(1.0, 0.9, 0.95), iSeed.w) * (0.75 + 0.25 * sin(spin));
        gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      varying vec3 vColor;
      varying vec3 vWorld;
      void main() {
        gl_FragColor = vec4(applyFog(vColor, vWorld), 1.0);
      }`,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;

  const layout = (view: View) => {
    // Spawn left of centre so the wind carries petals across the frame.
    const half = CAMERA_Z * view.tanHalfW;
    (mat.uniforms.uSpawn.value as THREE.Vector4).set(-half * 1.7, half * 0.5, -5, 5.5);
  };

  return { object: mesh, layout };
}
