import * as THREE from 'three';
import { createFlowers, createGrass, createPetals } from './flowers';
import { createGround, createMountains, createRibbon, createSpecks, type View } from './landscape';
import { createSky, createSkyMaterial } from './sky';
import { CAMERA_Z } from './terrain';

export interface MeadowInput {
  /** Smoothed pointer in [-1, 1] (window space) for camera parallax. */
  look: { x: number; y: number };
  /** Raw pointer in canvas NDC; `active` while a mouse is over the hero. */
  mouse: { x: number; y: number; active: boolean };
  /** How far the hero has been scrolled away, 0 … 1. */
  scroll: number;
}

const CAMERA_Y = 1.75;
const TARGET = new THREE.Vector3(0, 1.35, 0);

/**
 * The hero's 3D twilight meadow: sky, mountains, hills with a glowing ribbon,
 * flowers, grass and drifting petals. `quality` (0–1) scales how many plants
 * and particles are drawn.
 */
export function createMeadowScene(container: HTMLElement, quality: number) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor('#2a1a46');
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 700);
  camera.position.set(0, CAMERA_Y, CAMERA_Z);

  // Uniforms shared (by reference) across every custom shader.
  const shared: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.5, 0.06, -1).normalize() },
    uFogColor: { value: new THREE.Vector3(0.44, 0.3, 0.6) },
    uFogWarm: { value: new THREE.Vector3(0.96, 0.58, 0.55) },
    uFogNear: { value: 7 },
    uFogFar: { value: 62 },
    uMouse: { value: new THREE.Vector3(0, 0, 100) },
    uMouseStrength: { value: 0 },
    uPixel: { value: 500 },
  };

  const sky = createSky(createSkyMaterial(shared));
  scene.add(sky);
  scene.add(createMountains(shared));
  scene.add(createGround(shared));

  const q = Math.min(Math.max(quality, 0.3), 1);
  const specks = createSpecks(shared, Math.round(14000 * q));
  // Detailed flowers on the foreground bank; lighter ones fill the field out to the hills.
  const nearFlowers = createFlowers(shared, Math.round(1300 * q), { near: 2.2, far: 9.5, detailed: true, seed: 17 });
  const farFlowers = createFlowers(shared, Math.round(1600 * q), { near: 8.5, far: 19, detailed: false, seed: 23 });
  const grass = createGrass(shared, Math.round(20000 * q));
  const petals = createPetals(shared, Math.round(110 * q));
  scene.add(specks.object, nearFlowers.object, farFlowers.object, grass.object, petals.object);
  scene.add(createRibbon(shared, Math.round(650 * Math.max(q, 0.6))));

  const raycaster = new THREE.Raycaster();
  const headPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.75); // roughly foreground flower-head height
  const hit = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  const lookAt = new THREE.Vector3();

  return {
    canvas: renderer.domElement,

    update(t: number, input: MeadowInput) {
      shared.uTime.value = t;

      // Camera: parallax with the pointer, rises and glides forward as the hero scrolls away.
      const s = input.scroll;
      camera.position.set(input.look.x * 0.35, CAMERA_Y - input.look.y * 0.15 + s * 1.1, CAMERA_Z - s * 2.4);
      lookAt.set(TARGET.x + input.look.x * 0.15, TARGET.y + s * 0.4, TARGET.z);
      camera.lookAt(lookAt);
      sky.position.copy(camera.position);

      // Where the cursor meets the flower heads; plants there bend away.
      let target = 0;
      if (input.mouse.active) {
        raycaster.setFromCamera(ndc.set(input.mouse.x, input.mouse.y), camera);
        if (raycaster.ray.intersectPlane(headPlane, hit) && hit.z < CAMERA_Z) {
          (shared.uMouse.value as THREE.Vector3).copy(hit);
          target = 1;
        }
      }
      shared.uMouseStrength.value += (target - shared.uMouseStrength.value) * 0.08;
    },

    render() {
      renderer.render(scene, camera);
    },

    resize(w: number, h: number) {
      const width = Math.max(w, 1);
      const height = Math.max(h, 1);
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = `${width}px`;
      renderer.domElement.style.height = `${height}px`;
      const aspect = width / height;
      camera.aspect = aspect;
      // Portrait screens get a taller view so the meadow is not cropped to a sliver.
      camera.fov = aspect < 0.8 ? 60 : aspect < 1.2 ? 50 : 42;
      camera.updateProjectionMatrix();

      const tanHalfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const view: View = { tanHalfW: tanHalfH * aspect };
      shared.uPixel.value = (height * renderer.getPixelRatio()) / (2 * tanHalfH);

      // Keep the sun about 80% across the frame on any aspect ratio.
      (shared.uSunDir.value as THREE.Vector3).set(view.tanHalfW * 0.62, 0.06, -1).normalize();

      specks.layout(view);
      nearFlowers.layout(view);
      farFlowers.layout(view);
      grass.layout(view);
      petals.layout(view);
    },

    dispose() {
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

export type MeadowScene = ReturnType<typeof createMeadowScene>;
