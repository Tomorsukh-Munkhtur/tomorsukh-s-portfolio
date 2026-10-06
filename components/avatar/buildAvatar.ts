import * as THREE from 'three';

/*
 * Procedural 3D avatar (171 cm) with a walk cycle.
 * Outfit: white crewneck sweatshirt, black cargo joggers, black canvas
 * high-top sneakers, yellow-lens square aviators, long hair in a half-up bun
 * and a full beard.
 *
 * Units are metres. The avatar faces +Z and its lowest foot touches y = 0.
 */

// ---------------------------------------------------------------- proportions
const THIGH = 0.42;
const SHIN = 0.4;
const ANKLE_H = 0.085; // ankle joint → bottom of the shoe sole
const HIP_X = 0.082;
const UPPER_ARM = 0.29;
const FOREARM = 0.25;
const SHOULDER_X = 0.158;
const SHOULDER_Y = 0.405; // above the spine pivot
const SPINE_Y = 0.095; // above the hip joints
const NECK_Y = 0.45; // above the spine pivot
const HEAD_Y = 0.064; // above the neck pivot
const HEEL_Z = -0.07;
const TOE_Z = 0.205;
const SOLE_H = 0.034;

/** Seconds per full stride (two steps). */
export const WALK_CYCLE = 1.1;

// ------------------------------------------------------------------- palette
const COLORS = {
  skin: '#c98d68',
  lips: '#a8665a',
  hair: '#1e1713',
  sweatshirt: '#f1f0eb',
  pants: '#19191b',
  pocket: '#1f1f22',
  canvas: '#141416',
  rubber: '#eee7d6',
  lace: '#f4f0e6',
  frame: '#0d0d0e',
  lens: '#f5a300',
  metal: '#c9c4bb',
};

// ------------------------------------------------------------------ textures
function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, repeat = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  return tex;
}

/** Deterministic PRNG so the avatar looks identical on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function makeTextures() {
  const rand = rng(7);

  // Fine strands running along the texture's V axis.
  const hair = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#231b16';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const x = rand() * s;
      const light = rand() < 0.15;
      ctx.strokeStyle = light ? `rgba(92,70,56,${0.2 + rand() * 0.3})` : `rgba(6,4,3,${0.3 + rand() * 0.5})`;
      ctx.lineWidth = 0.6 + rand() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.bezierCurveTo(x + rand() * 6 - 3, s * 0.3, x + rand() * 6 - 3, s * 0.7, x + rand() * 4 - 2, s + 10);
      ctx.stroke();
    }
  });
  hair.colorSpace = THREE.SRGBColorSpace;

  // Short, dense curls for the beard.
  const beard = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#2b221c';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2200; i++) {
      const x = rand() * s;
      const y = rand() * s;
      const a = Math.PI / 2 + (rand() - 0.5) * 0.9;
      const l = 3 + rand() * 6;
      ctx.strokeStyle = rand() < 0.3 ? `rgba(110,84,66,0.5)` : `rgba(6,5,4,0.6)`;
      ctx.lineWidth = 0.8 + rand();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
  }, 2);
  beard.colorSpace = THREE.SRGBColorSpace;

  // Grey noise used as a bump map for fleece and canvas.
  const noise = canvasTexture(128, (ctx, s) => {
    const img = ctx.createImageData(s, s);
    for (let i = 0; i < s * s; i++) {
      const v = 110 + rand() * 90;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, 6);

  // Canvas weave for the sneakers.
  const weave = canvasTexture(64, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 4) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(i, 0, 2, s);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, i, s, 2);
    }
  }, 8);

  // Vertical ribbing for cuffs, hem and collar.
  const rib = canvasTexture(64, (ctx, s) => {
    for (let x = 0; x < s; x++) {
      const v = 128 + Math.sin((x / s) * Math.PI * 2 * 8) * 110;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, 0, 1, s);
    }
  });
  rib.repeat.set(10, 1);

  // Round ankle patch with a star.
  const patch = canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = '#f4f0e6';
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b1b1d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2 - 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#1b1b1d';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s * 0.26 : s * 0.105;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  });
  patch.colorSpace = THREE.SRGBColorSpace;
  patch.wrapS = patch.wrapT = THREE.ClampToEdgeWrapping;

  return { hair, beard, noise, weave, rib, patch };
}

function makeMaterials(tex: ReturnType<typeof makeTextures>) {
  const fabric = (color: string, roughness: number, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
    new THREE.MeshPhysicalMaterial({ color, roughness, sheen: 0.4, sheenRoughness: 0.8, sheenColor: '#ffffff', ...extra });

  return {
    skin: new THREE.MeshPhysicalMaterial({
      color: COLORS.skin,
      roughness: 0.55,
      sheen: 0.25,
      sheenColor: '#ffc9a8',
      clearcoat: 0.05,
    }),
    lips: new THREE.MeshStandardMaterial({ color: COLORS.lips, roughness: 0.5 }),
    eye: new THREE.MeshStandardMaterial({ color: '#120d0a', roughness: 0.15 }),
    hair: new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      map: tex.hair,
      bumpMap: tex.hair,
      bumpScale: 2,
      roughness: 0.58,
      envMapIntensity: 0.6,
      sheen: 0.2,
      sheenColor: '#5a4232',
      sheenRoughness: 0.4,
      side: THREE.DoubleSide,
    }),
    beard: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: tex.beard,
      bumpMap: tex.beard,
      bumpScale: 3,
      roughness: 0.85,
      side: THREE.DoubleSide,
    }),
    sweatshirt: fabric(COLORS.sweatshirt, 0.92, { bumpMap: tex.noise, bumpScale: 0.6, sheenColor: '#ffffff' }),
    rib: fabric(COLORS.sweatshirt, 0.95, { bumpMap: tex.rib, bumpScale: 3 }),
    pants: fabric(COLORS.pants, 0.82, { sheen: 0.35, sheenColor: '#3a3a42', bumpMap: tex.noise, bumpScale: 0.5 }),
    pocket: fabric(COLORS.pocket, 0.8, { sheen: 0.35, sheenColor: '#45454e' }),
    pantsRib: fabric(COLORS.pants, 0.7, { bumpMap: tex.rib, bumpScale: 3, sheenColor: '#4a4a52' }),
    cord: new THREE.MeshStandardMaterial({ color: '#2c2c30', roughness: 0.7 }),
    aglet: new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.3, metalness: 0.9 }),
    canvas: new THREE.MeshStandardMaterial({ color: COLORS.canvas, roughness: 0.9, bumpMap: tex.weave, bumpScale: 1.5 }),
    rubber: new THREE.MeshStandardMaterial({ color: COLORS.rubber, roughness: 0.55 }),
    stripe: new THREE.MeshStandardMaterial({ color: '#1a1a1c', roughness: 0.5 }),
    lace: new THREE.MeshStandardMaterial({ color: COLORS.lace, roughness: 0.8 }),
    eyelet: new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.3, metalness: 0.8 }),
    patch: new THREE.MeshStandardMaterial({ map: tex.patch, roughness: 0.6 }),
    frame: new THREE.MeshPhysicalMaterial({ color: COLORS.frame, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }),
    lens: new THREE.MeshPhysicalMaterial({
      color: COLORS.lens,
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.86,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      emissive: '#7a3d00',
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide,
    }),
  };
}

type Materials = ReturnType<typeof makeMaterials>;

// ------------------------------------------------------------ geometry utils
function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent?: THREE.Object3D) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  m.receiveShadow = true;
  parent?.add(m);
  return m;
}

/** Tapered capsule hanging from y = 0 down to y = -len. */
function limb(rTop: number, rBottom: number, len: number, radial = 28) {
  const pts: THREE.Vector2[] = [];
  const steps = 8;
  for (let i = steps; i >= 0; i--) {
    const a = Math.PI / 2 + (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.sin(a) * rBottom, -len + Math.cos(a) * rBottom));
  }
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI / 2 - (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.sin(a) * rTop, Math.cos(a) * rTop));
  }
  return new THREE.LatheGeometry(pts, radial);
}

/** Thin cylinder spanning two points. */
function rod(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material, parent: THREE.Object3D) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const g = new THREE.CylinderGeometry(radius, radius, dir.length(), 8);
  const m = mesh(g, material, parent);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

/** Ellipsoid of the given radii. */
function ellipsoid(rx: number, ry: number, rz: number, material: THREE.Material, parent: THREE.Object3D, seg = 32) {
  const m = mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)), material, parent);
  m.scale.set(rx, ry, rz);
  return m;
}

/** Re-shapes every vertex of a unit sphere and drops triangles that fail `keep`. */
function sculpt(
  geometry: THREE.BufferGeometry,
  shape: (dir: THREE.Vector3) => THREE.Vector3,
  keep?: (dir: THREE.Vector3) => boolean,
) {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const dir = new THREE.Vector3();
  const kept: boolean[] = [];
  for (let i = 0; i < pos.count; i++) {
    dir.fromBufferAttribute(pos, i).normalize();
    kept.push(keep ? keep(dir) : true);
    const p = shape(dir);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  if (keep && geometry.index) {
    const src = geometry.index.array;
    const out: number[] = [];
    for (let i = 0; i < src.length; i += 3) {
      if (kept[src[i]] && kept[src[i + 1]] && kept[src[i + 2]]) out.push(src[i], src[i + 1], src[i + 2]);
    }
    geometry.setIndex(out);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Closed, smooth outline in the XZ plane (top view of the shoe sole). */
function soleOutline(n = 64) {
  const pts: THREE.Vector2[] = [];
  const mid = (HEEL_Z + TOE_Z) / 2;
  const half = (TOE_Z - HEEL_Z) / 2;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const s = Math.sin(t);
    const c = Math.cos(t);
    const z = mid + half * Math.sign(s) * Math.abs(s) ** 0.8;
    // Wider at the ball of the foot, narrower at the heel.
    const ball = Math.exp(-(((z - 0.125) / 0.09) ** 2));
    const hw = 0.036 + 0.017 * ball + (z > 0.15 ? -0.004 : 0);
    pts.push(new THREE.Vector2(hw * Math.sign(c) * Math.abs(c) ** 0.75, z));
  }
  return pts;
}

// ---------------------------------------------------------------------- head
const HEAD_CENTER = new THREE.Vector3(0, 0.1, -0.008);
const HEAD_R = new THREE.Vector3(0.08, 0.108, 0.098);

/** Maps a unit direction to a point on the head surface, optionally inflated. */
function headPoint(d: THREE.Vector3, inflate = 0) {
  let x = d.x * (HEAD_R.x + inflate);
  const y = d.y * (HEAD_R.y + inflate);
  let z = d.z * (HEAD_R.z + inflate);
  if (d.y < 0) {
    const t = -d.y;
    x *= 1 - 0.2 * t * t; // narrower jaw
    if (d.z < 0) z *= 1 - 0.5 * t; // nape tucks into the neck
    z += 0.03 * t * t; // chin forward
  }
  if (d.z > 0) z *= 1 - 0.18 * d.x * d.x; // flatter face plane
  return new THREE.Vector3(x, y, z).add(HEAD_CENTER);
}

/** Point on the face at azimuth `az` (0 = front) and elevation `el` (unit y). */
function facePoint(az: number, el: number, inflate = 0) {
  const r = Math.sqrt(1 - el * el);
  return headPoint(new THREE.Vector3(Math.sin(az) * r, el, Math.cos(az) * r), inflate);
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Unit-y height of the hairline for a direction (high on the forehead, low at the nape). */
function hairline(d: THREE.Vector3) {
  const back = Math.abs(Math.atan2(d.x, d.z)) / Math.PI; // 0 front → 1 back
  if (back < 0.14) return 0.42 + 0.1 * smoothstep(0, 0.14, back);
  if (back < 0.5) return 0.52 - 0.44 * smoothstep(0.14, 0.5, back);
  return 0.08 - 0.62 * smoothstep(0.5, 0.85, back);
}

/** Unit-y height of the beard line: low under the nose, rising to sideburns. */
function beardline(d: THREE.Vector3) {
  const az = Math.abs(Math.atan2(d.x, d.z));
  return -0.3 + 0.36 * smoothstep(0.1 * Math.PI, 0.46 * Math.PI, az);
}

function buildHead(head: THREE.Group, mat: Materials) {
  // Skull + face.
  sculpt(mesh(new THREE.SphereGeometry(1, 64, 48), mat.skin, head).geometry, (d) => headPoint(d));

  // Nose.
  const nose = ellipsoid(0.014, 0.027, 0.02, mat.skin, head, 20);
  nose.position.copy(facePoint(0, -0.22)).add(new THREE.Vector3(0, 0, 0.004));
  nose.rotation.x = -0.25;
  const tip = ellipsoid(0.013, 0.012, 0.013, mat.skin, head, 16);
  tip.position.copy(facePoint(0, -0.4)).add(new THREE.Vector3(0, 0.002, 0.016));

  // Ears.
  for (const side of [-1, 1]) {
    const ear = ellipsoid(0.011, 0.03, 0.019, mat.skin, head, 16);
    ear.position.copy(facePoint((side * Math.PI) / 2 + side * 0.08, -0.08)).add(new THREE.Vector3(side * 0.004, 0, 0));
    ear.rotation.y = side * -0.35;
  }

  // Eyes (visible through the tinted lenses).
  for (const side of [-1, 1]) {
    const eye = ellipsoid(0.011, 0.008, 0.006, mat.eye, head, 12);
    eye.position.copy(facePoint(side * 0.36, -0.03, -0.004));
  }

  // Eyebrows.
  for (const side of [-1, 1]) {
    const brow = mesh(new THREE.CapsuleGeometry(0.004, 0.028, 4, 8), mat.beard, head);
    brow.position.copy(facePoint(side * 0.36, 0.2, 0.002));
    brow.rotation.set(0, side * 0.35, Math.PI / 2 + side * 0.12);
  }

  // Hair: a slicked-back cap whose UV poles sit on the bun, so strands radiate from it.
  const tilt = -0.75;
  const capGeo = new THREE.SphereGeometry(1, 160, 120);
  capGeo.rotateX(tilt);
  sculpt(
    capGeo,
    // Volume grows away from the hairline so the hair blends into the skin.
    (d) => headPoint(d, 0.0015 + (0.007 + 0.006 * Math.max(0, d.y)) * smoothstep(0, 0.22, d.y - hairline(d))),
    (d) => d.y > hairline(d),
  );
  mesh(capGeo, mat.hair, head);

  // Long hair falling behind the ears onto the upper back.
  head.add(hairSheet(mat.hair));

  // Bun on the crown with a tie and loose ends.
  const pole = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
  const base = headPoint(pole, 0.006);
  const normal = new THREE.Vector3(pole.x / HEAD_R.x ** 2, pole.y / HEAD_R.y ** 2, pole.z / HEAD_R.z ** 2).normalize();
  const bunQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

  const bun = mesh(new THREE.SphereGeometry(0.036, 32, 24), mat.hair, head);
  bun.position.copy(base).addScaledVector(normal, 0.03);
  bun.quaternion.copy(bunQ);
  bun.scale.set(1.15, 0.85, 1);

  const tie = mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 24), mat.frame, head);
  tie.position.copy(base).addScaledVector(normal, 0.008);
  tie.quaternion.copy(bunQ).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));

  const rand = rng(3);
  for (let i = 0; i < 12; i++) {
    const tuft = mesh(new THREE.ConeGeometry(0.0055, 0.03 + rand() * 0.03, 6), mat.hair, head);
    const a = (i / 12) * Math.PI * 2;
    const out = new THREE.Vector3(Math.cos(a), 0.4 + rand() * 0.5, Math.sin(a)).normalize().applyQuaternion(bunQ);
    // Loose ends spray mostly backwards and down.
    out.add(new THREE.Vector3(0, -0.3, -0.6)).normalize();
    tuft.position.copy(bun.position).addScaledVector(out, 0.04);
    tuft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out);
  }

  // Beard: an inflated copy of the lower face, trimmed to a beard line.
  const beardGeo = sculpt(
    new THREE.SphereGeometry(1, 160, 120),
    (d) => {
      const chin = Math.max(0, -d.y) ** 2 * Math.max(0, d.z + 0.2);
      const fullness = smoothstep(0, 0.25, beardline(d) - d.y);
      return headPoint(d, 0.0015 + (0.009 + 0.018 * chin) * fullness);
    },
    (d) => Math.abs(Math.atan2(d.x, d.z)) < 0.56 * Math.PI && d.y < beardline(d),
  );
  mesh(beardGeo, mat.beard, head);

  // Moustache + lower lip peeking through.
  const stache = mesh(new THREE.TorusGeometry(0.026, 0.008, 8, 24, Math.PI * 0.75), mat.beard, head);
  stache.position.copy(facePoint(0, -0.5, 0.004));
  stache.position.y += 0.022;
  stache.rotation.set(-0.2, 0, Math.PI + Math.PI * 0.125);
  const lip = mesh(new THREE.CapsuleGeometry(0.0055, 0.022, 4, 8), mat.lips, head);
  lip.position.copy(facePoint(0, -0.62, 0.006));
  lip.rotation.z = Math.PI / 2;

  // Square aviators with yellow lenses.
  buildSunglasses(head, mat);
}

/** Curved sheet of long hair from the back of the skull down to the shoulders. */
function hairSheet(material: THREE.Material) {
  const cols = 40;
  const rows = 16;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    const y = HEAD_CENTER.y + 0.03 - v * 0.24;
    const zc = HEAD_CENTER.z - 0.045 * v;
    const ax = 0.08 + 0.045 * v;
    const az = 0.1 + 0.002 * v;
    const span = 1.62 + 0.5 * v; // half-angle measured from the front
    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      const theta = span + u * (Math.PI * 2 - span * 2);
      // Slightly longer down the middle of the back, softly uneven ends.
      const tip = v * v * (0.03 * Math.sin(u * Math.PI) + 0.006 * Math.sin(c * 0.9));
      const bulge = 1 + 0.08 * Math.sin(v * Math.PI);
      positions.push(Math.sin(theta) * ax * bulge, y - tip, zc + Math.cos(theta) * az * bulge);
      uvs.push(u * 3, v);
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c;
      const b = a + cols + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function roundedLensShape(w: number, h: number, rTop: number, rBottom: number) {
  const s = new THREE.Shape();
  const x0 = -w / 2;
  const x1 = w / 2;
  const y0 = -h / 2;
  const y1 = h / 2;
  s.moveTo(x0 + rTop, y1);
  s.lineTo(x1 - rTop, y1);
  s.quadraticCurveTo(x1, y1, x1, y1 - rTop);
  s.lineTo(x1, y0 + rBottom);
  s.quadraticCurveTo(x1, y0, x1 - rBottom, y0);
  s.lineTo(x0 + rBottom, y0);
  s.quadraticCurveTo(x0, y0, x0, y0 + rBottom);
  s.lineTo(x0, y1 - rTop);
  s.quadraticCurveTo(x0, y1, x0 + rTop, y1);
  return s;
}

function buildSunglasses(head: THREE.Group, mat: Materials) {
  const glasses = new THREE.Group();
  const eye = facePoint(0, -0.03);
  glasses.position.set(0, eye.y, eye.z + 0.014);
  head.add(glasses);

  const w = 0.05;
  const h = 0.044;
  const rim = 0.0045;
  for (const side of [-1, 1]) {
    const lensGroup = new THREE.Group();
    lensGroup.position.set(side * 0.034, 0, -0.002);
    lensGroup.rotation.y = side * 0.16;
    glasses.add(lensGroup);

    const outer = roundedLensShape(w + rim * 2, h + rim * 2, 0.008, 0.016);
    outer.holes.push(roundedLensShape(w, h, 0.005, 0.013));
    const frameGeo = new THREE.ExtrudeGeometry(outer, {
      depth: 0.004,
      bevelEnabled: true,
      bevelThickness: 0.0012,
      bevelSize: 0.0008,
      bevelSegments: 2,
      curveSegments: 10,
    });
    frameGeo.translate(0, 0, -0.002);
    mesh(frameGeo, mat.frame, lensGroup);

    const lens = mesh(new THREE.ShapeGeometry(roundedLensShape(w, h, 0.005, 0.013), 10), mat.lens, lensGroup);
    lens.castShadow = false;

    // Temple arm from the hinge back over the ear.
    const hinge = new THREE.Vector3(side * 0.064, 0.012, -0.012);
    const ear = facePoint((side * Math.PI) / 2 + side * 0.08, 0.02, 0.006).sub(glasses.position);
    ear.x += side * 0.004;
    rod(hinge, ear, 0.0022, mat.frame, glasses);
    rod(ear, ear.clone().add(new THREE.Vector3(0, -0.022, -0.016)), 0.0022, mat.frame, glasses);
  }

  // Double bridge: straight top bar and a low arch.
  const top = mesh(new THREE.BoxGeometry(0.072, 0.0035, 0.0035), mat.frame, glasses);
  top.position.set(0, h / 2 + rim * 0.5, -0.001);
  const bridge = mesh(new THREE.TorusGeometry(0.008, 0.0018, 6, 16, Math.PI), mat.frame, glasses);
  bridge.position.set(0, 0.004, -0.002);
}

// ---------------------------------------------------------------------- body
function buildTorso(spine: THREE.Group, mat: Materials) {
  // Sweatshirt body: a lathe squashed front-to-back.
  const profile = [
    [0.174, -0.075],
    [0.18, -0.04],
    [0.181, 0.06],
    [0.184, 0.18],
    [0.19, 0.29],
    [0.188, 0.35],
    [0.18, 0.395],
    [0.158, 0.428],
    [0.115, 0.452],
    [0.07, 0.464],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bodyGeo = new THREE.LatheGeometry(profile, 48);
  const pos = bodyGeo.attributes.position as THREE.BufferAttribute;
  const nrm = bodyGeo.attributes.normal as THREE.BufferAttribute;
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const squash = 0.64 + 0.1 * smoothstep(0.1, -0.075, pos.getY(i));
    pos.setZ(i, pos.getZ(i) * squash);
    // Inverse-scale the lathe's own normals (keeps the seam invisible).
    n.fromBufferAttribute(nrm, i).setZ(nrm.getZ(i) / squash).normalize();
    nrm.setXYZ(i, n.x, n.y, n.z);
  }
  mesh(bodyGeo, mat.sweatshirt, spine);

  // Ribbed hem.
  const hem = mesh(new THREE.CylinderGeometry(0.176, 0.172, 0.05, 48, 1, true), mat.rib, spine);
  hem.position.y = -0.095;
  hem.scale.z = 0.75;

  // Ribbed crew collar.
  const collar = mesh(new THREE.TorusGeometry(0.066, 0.012, 12, 40), mat.rib, spine);
  collar.position.y = 0.466;
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1, 0.84, 1.2);
}

function buildArm(shoulder: THREE.Group, side: number, mat: Materials) {
  // Drop-shoulder sleeve.
  const cap = ellipsoid(0.058, 0.05, 0.058, mat.sweatshirt, shoulder);
  cap.position.set(side * -0.012, 0, 0);
  mesh(limb(0.056, 0.049, UPPER_ARM), mat.sweatshirt, shoulder);

  const elbow = new THREE.Group();
  elbow.position.y = -UPPER_ARM;
  shoulder.add(elbow);
  mesh(limb(0.049, 0.043, FOREARM - 0.055), mat.sweatshirt, elbow);

  const cuff = mesh(new THREE.CylinderGeometry(0.041, 0.038, 0.055, 24, 1, true), mat.rib, elbow);
  cuff.position.y = -FOREARM + 0.03;

  const wrist = new THREE.Group();
  wrist.position.y = -FOREARM;
  elbow.add(wrist);

  // Relaxed hand, palm facing the thigh.
  const palm = ellipsoid(0.016, 0.042, 0.037, mat.skin, wrist, 20);
  palm.position.set(0, -0.036, 0.004);
  const fingers = ellipsoid(0.015, 0.034, 0.033, mat.skin, wrist, 20);
  fingers.position.set(side * -0.005, -0.078, 0.012);
  fingers.rotation.x = -0.4;
  const thumb = mesh(new THREE.CapsuleGeometry(0.0095, 0.028, 4, 10), mat.skin, wrist);
  thumb.position.set(side * -0.012, -0.045, 0.034);
  thumb.rotation.set(0.5, 0, side * 0.3);

  return { shoulder, elbow, wrist };
}

function buildPelvis(pelvis: THREE.Group, mat: Materials) {
  const hips = ellipsoid(0.158, 0.105, 0.098, mat.pants, pelvis);
  hips.position.y = 0.0;
  for (const side of [-1, 1]) {
    const seat = ellipsoid(0.076, 0.066, 0.064, mat.pants, pelvis, 24);
    seat.position.set(side * 0.046, -0.05, -0.024);
  }

  // Drawstrings hanging below the sweatshirt hem.
  for (const side of [-1, 1]) {
    const top = new THREE.Vector3(side * 0.014, -0.01, 0.1);
    const bottom = new THREE.Vector3(side * 0.02, -0.075, 0.104);
    rod(top, bottom, 0.0025, mat.cord, pelvis);
    const tip = mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.018, 8), mat.aglet, pelvis);
    tip.position.copy(bottom).add(new THREE.Vector3(0, -0.008, 0));
  }
}

function buildLeg(hip: THREE.Group, side: number, mat: Materials) {
  // Relaxed-fit thigh with a cargo pocket on the outside.
  mesh(limb(0.087, 0.064, THIGH), mat.pants, hip);
  const pocket = mesh(new THREE.BoxGeometry(0.014, 0.13, 0.1), mat.pocket, hip);
  pocket.position.set(side * 0.077, -0.23, 0.002);
  pocket.rotation.z = side * 0.06;
  const flap = mesh(new THREE.BoxGeometry(0.018, 0.032, 0.106), mat.pocket, hip);
  flap.position.set(side * 0.08, -0.16, 0.002);
  flap.rotation.z = side * 0.06;

  const knee = new THREE.Group();
  knee.position.y = -THIGH;
  hip.add(knee);

  // Tapered jogger leg, a little gathered above the elastic cuff.
  mesh(limb(0.064, 0.054, SHIN - 0.11), mat.pants, knee);
  const cuff = mesh(new THREE.CylinderGeometry(0.05, 0.048, 0.06, 24), mat.pantsRib, knee);
  cuff.position.y = -SHIN + 0.09;

  const ankle = new THREE.Group();
  ankle.position.y = -SHIN;
  knee.add(ankle);
  buildShoe(ankle, side, mat);

  return { hip, knee, ankle };
}

/** Black canvas high-top with a cream rubber sole and toe cap. */
function buildShoe(ankle: THREE.Group, side: number, mat: Materials) {
  const soleBottom = -ANKLE_H;
  const soleTop = soleBottom + SOLE_H;
  const outline = soleOutline();

  // Rubber sole.
  const soleShape = new THREE.Shape(outline);
  const soleGeo = new THREE.ExtrudeGeometry(soleShape, {
    depth: SOLE_H - 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 4,
  });
  soleGeo.rotateX(Math.PI / 2);
  soleGeo.translate(0, soleTop - 0.004, 0);
  mesh(soleGeo, mat.rubber, ankle);

  // Thin black stripe around the foxing.
  const stripePts = outline.map((p) => new THREE.Vector3(p.x * 1.1, 0, p.y));
  const stripeCurve = new THREE.CatmullRomCurve3(stripePts, true);
  const stripe = mesh(new THREE.TubeGeometry(stripeCurve, 96, 0.0018, 4, true), mat.stripe, ankle);
  stripe.position.y = soleTop - 0.011;
  stripe.scale.set(1, 1, 1.02);
  stripe.position.z = -0.0015;

  // Canvas upper over the foot.
  const upper = mesh(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), mat.canvas, ankle);
  upper.scale.set(0.047, 0.074, 0.128);
  upper.position.set(0, soleTop - 0.002, 0.07);

  // High-top shaft around the ankle, with a padded collar.
  const shaftTop = 0.065;
  const shaft = mesh(new THREE.CylinderGeometry(0.043, 0.045, shaftTop - soleTop, 28), mat.canvas, ankle);
  shaft.scale.z = 1.25;
  shaft.position.set(0, (shaftTop + soleTop) / 2, -0.012);
  const collar = mesh(new THREE.TorusGeometry(0.043, 0.006, 8, 28), mat.canvas, ankle);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1, 1.25, 1);
  collar.position.set(0, shaftTop, -0.012);

  // Rubber toe cap.
  const toe = mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat.rubber, ankle);
  toe.scale.set(0.05, 0.036, 0.058);
  toe.position.set(0, soleTop - 0.002, 0.152);

  // Laces criss-crossing from the forefoot up the tongue, with eyelets.
  const lacePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, soleTop + 0.06, 0.128),
    new THREE.Vector3(0, soleTop + 0.072, 0.08),
    new THREE.Vector3(0, soleTop + 0.088, 0.052),
    new THREE.Vector3(0, shaftTop - 0.008, 0.046),
  ]);
  const rows = 7;
  const lacePts: [THREE.Vector3, THREE.Vector3][] = [];
  for (let i = 0; i < rows; i++) {
    const c = lacePath.getPointAt(i / (rows - 1));
    lacePts.push([c.clone().setX(-0.021), c.clone().setX(0.021)]);
    for (const p of lacePts[i]) {
      const eyelet = mesh(new THREE.TorusGeometry(0.0036, 0.0013, 6, 12), mat.eyelet, ankle);
      eyelet.position.copy(p);
      eyelet.rotation.x = -0.9 + (i / (rows - 1)) * 0.8;
    }
  }
  for (let i = 0; i < rows - 1; i++) {
    rod(lacePts[i][0], lacePts[i + 1][1], 0.0023, mat.lace, ankle);
    rod(lacePts[i][1], lacePts[i + 1][0], 0.0023, mat.lace, ankle);
  }
  rod(lacePts[0][0], lacePts[0][1], 0.0023, mat.lace, ankle);

  // A loose lace end dangling down the outside.
  const top = lacePts[rows - 1][side > 0 ? 1 : 0];
  const dangle = new THREE.CatmullRomCurve3([
    top,
    top.clone().add(new THREE.Vector3(side * 0.02, -0.02, 0.01)),
    top.clone().add(new THREE.Vector3(side * 0.05, -0.09, 0.02)),
    new THREE.Vector3(side * 0.06, soleTop + 0.01, 0.06),
  ]);
  mesh(new THREE.TubeGeometry(dangle, 24, 0.0022, 5), mat.lace, ankle);

  // Ankle patch on the inner side.
  const patch = mesh(new THREE.CircleGeometry(0.021, 32), mat.patch, ankle);
  patch.position.set(-side * 0.0445, 0.008, -0.012);
  patch.rotation.y = -side * Math.PI / 2;
}

// ----------------------------------------------------------------- the rig
export interface AvatarRig {
  root: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  legs: { hip: THREE.Group; knee: THREE.Group; ankle: THREE.Group }[];
  arms: { shoulder: THREE.Group; elbow: THREE.Group; wrist: THREE.Group }[];
  dispose: () => void;
}

export function buildAvatar(): AvatarRig {
  const tex = makeTextures();
  const mat = makeMaterials(tex);

  const root = new THREE.Group();
  const pelvis = new THREE.Group();
  root.add(pelvis);
  buildPelvis(pelvis, mat);

  const spine = new THREE.Group();
  spine.position.y = SPINE_Y;
  pelvis.add(spine);
  buildTorso(spine, mat);

  const neck = new THREE.Group();
  neck.position.y = NECK_Y;
  spine.add(neck);
  const neckMesh = mesh(new THREE.CylinderGeometry(0.056, 0.062, 0.12, 24), mat.skin, neck);
  neckMesh.position.set(0, 0.035, 0.004);

  const head = new THREE.Group();
  head.position.set(0, HEAD_Y, 0.012);
  neck.add(head);
  buildHead(head, mat);

  // Index 0 = left (+X), 1 = right (-X).
  const legs = [1, -1].map((side) => {
    const hip = new THREE.Group();
    hip.position.x = side * HIP_X;
    pelvis.add(hip);
    return buildLeg(hip, side, mat);
  });
  const arms = [1, -1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * SHOULDER_X, SHOULDER_Y, -0.005);
    spine.add(shoulder);
    return buildArm(shoulder, side, mat);
  });

  const dispose = () => {
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    Object.values(mat).forEach((m) => m.dispose());
    Object.values(tex).forEach((t) => t.dispose());
  };

  return { root, pelvis, spine, neck, head, legs, arms, dispose };
}

// ------------------------------------------------------------- walk cycle
const TAU = Math.PI * 2;

function wrap(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function bump(p: number, center: number, width: number) {
  const d = wrap(p - center) / width;
  return Math.exp(-d * d);
}

/** Joint angles for one leg at phase p (0 = heel strike). Positive = flexion. */
function legAngles(p: number) {
  const thigh = 0.03 + 0.38 * Math.cos(p + 0.2);
  const knee = 0.08 + 0.22 * bump(p, 0.15 * TAU, 0.5) + 0.95 * bump(p, 0.72 * TAU, 0.85);
  const footPitch = -0.25 * bump(p, 0, 0.45) + 0.6 * bump(p, 0.6 * TAU, 0.45);
  return { thigh, knee, footPitch };
}

/** Vertical distance from hip joint to the lowest point of the shoe. */
function legReach({ thigh, knee, footPitch }: ReturnType<typeof legAngles>) {
  const heel = ANKLE_H * Math.cos(footPitch) + HEEL_Z * Math.sin(footPitch);
  const toe = ANKLE_H * Math.cos(footPitch) + TOE_Z * Math.sin(footPitch);
  return THIGH * Math.cos(thigh) + SHIN * Math.cos(knee - thigh) + Math.max(heel, toe);
}

/** Forward offset of the ankle from the hip joint. */
function ankleZ({ thigh, knee }: ReturnType<typeof legAngles>) {
  return THIGH * Math.sin(thigh) + SHIN * Math.sin(thigh - knee);
}

/** Ground speed (m/s) that keeps the planted foot roughly still on a scrolling floor. */
export function walkSpeed() {
  const contact = ankleZ(legAngles(0.02 * TAU));
  const pushOff = ankleZ(legAngles(0.55 * TAU));
  return (contact - pushOff) / (0.53 * WALK_CYCLE);
}

/** Poses the rig at time t (seconds). */
export function poseAvatar(rig: AvatarRig, t: number) {
  const phase = (t / WALK_CYCLE) * TAU;
  const sides = [phase, phase + Math.PI]; // left, right

  let reach = 0;
  sides.forEach((p, i) => {
    const a = legAngles(p);
    const leg = rig.legs[i];
    leg.hip.rotation.x = -a.thigh;
    leg.hip.rotation.z = (i === 0 ? 1 : -1) * 0.02;
    leg.knee.rotation.x = a.knee;
    leg.ankle.rotation.x = a.footPitch + a.thigh - a.knee;
    reach = Math.max(reach, legReach(a));
  });

  const swing = Math.cos(phase + 0.2); // +1 when the left leg is forward
  rig.pelvis.position.set(0.012 * Math.sin(phase - 0.33), reach, 0);
  rig.pelvis.rotation.set(0, -0.09 * swing, 0.035 * Math.sin(phase + 0.4));

  rig.spine.rotation.set(0.06, 0.12 * swing, -0.03 * Math.sin(phase + 0.4));
  rig.neck.rotation.set(-0.04, -0.015 * swing, 0.01 * Math.sin(phase));
  rig.head.rotation.set(-0.02 + 0.015 * Math.cos(phase * 2), -0.015 * swing, 0);

  sides.forEach((p, i) => {
    const forward = -0.34 * Math.cos(p + 0.35) + 0.04; // opposite to the same-side leg
    const arm = rig.arms[i];
    const side = i === 0 ? 1 : -1;
    arm.shoulder.rotation.set(-forward, 0, side * 0.1);
    arm.elbow.rotation.set(-(0.22 + 0.35 * Math.max(0, forward + 0.1)), 0, 0);
    arm.wrist.rotation.set(-0.08, 0, -side * 0.04);
  });
}
