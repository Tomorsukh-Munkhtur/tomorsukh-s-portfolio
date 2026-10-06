import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildAvatar, poseAvatar, walkSpeed } from './buildAvatar';

const ACCENT = '#f97316';
const PLATFORM_R = 0.72;
/** Default yaw: three-quarter view, walking toward the hero text on the left. */
export const BASE_YAW = -0.6;

/** Renderer, lights, platform and avatar. The caller drives time and yaw. */
export function createAvatarScene(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  scene.environment = envMap;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 30);
  camera.position.set(0, 1.3, 5.3);
  camera.lookAt(0, 0.86, 0);

  // Warm key light with soft shadows, orange rim light to match the site accent.
  const key = new THREE.DirectionalLight('#fff1e2', 2.4);
  key.position.set(2.2, 3.6, 3);
  key.target.position.set(0, 0.8, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -1.1;
  key.shadow.camera.right = key.shadow.camera.top = 1.1;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 9;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.015;
  key.shadow.radius = 4;
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight(ACCENT, 3.2);
  rim.position.set(-2.6, 2.4, -2.8);
  scene.add(rim);

  const fill = new THREE.HemisphereLight('#ffffff', '#3a2416', 0.7);
  scene.add(fill);

  const stage = new THREE.Group();
  scene.add(stage);

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(PLATFORM_R, PLATFORM_R * 1.02, 0.06, 96),
    new THREE.MeshStandardMaterial({ color: '#0e0e10', roughness: 0.6, metalness: 0.1 }),
  );
  platform.position.y = -0.03;
  platform.receiveShadow = true;
  stage.add(platform);

  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(PLATFORM_R, 0.006, 8, 160),
    new THREE.MeshBasicMaterial({ color: ACCENT }),
  );
  edge.rotation.x = Math.PI / 2;
  stage.add(edge);

  // Lines that scroll under the feet so the walk reads as forward motion.
  const lines = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uOffset: { value: 0 }, uColor: { value: new THREE.Color(ACCENT) } },
    vertexShader: /* glsl */ `
      varying vec2 vPos;
      void main() {
        vPos = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOffset;
      uniform vec3 uColor;
      varying vec2 vPos;
      void main() {
        float fade = smoothstep(0.7, 0.2, length(vPos));
        float z = -vPos.y + uOffset;
        float d = abs(fract(z / 0.2) - 0.5) * 0.2;
        float line = 1.0 - smoothstep(0.0025, 0.006, d);
        gl_FragColor = vec4(uColor, line * fade * 0.45);
        #include <colorspace_fragment>
      }`,
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(PLATFORM_R - 0.02, 96), lines);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.001;
  stage.add(floor);

  const rig = buildAvatar();
  stage.add(rig.root);
  const speed = walkSpeed();

  return {
    canvas: renderer.domElement,

    /** Poses the avatar at time t (s) and turns the stage to `yaw` (rad). */
    update(t: number, yaw: number) {
      poseAvatar(rig, t);
      lines.uniforms.uOffset.value = (t * speed) % 100;
      stage.rotation.y = yaw;
    },

    render() {
      renderer.render(scene, camera);
    },

    resize(width: number, height: number) {
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = `${width}px`;
      renderer.domElement.style.height = `${height}px`;
      camera.aspect = width / height;
      // Keep the whole figure in frame on narrow containers.
      camera.zoom = Math.min(1, camera.aspect / 0.78);
      camera.updateProjectionMatrix();
    },

    dispose() {
      rig.dispose();
      [platform, edge, floor].forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export type AvatarScene = ReturnType<typeof createAvatarScene>;
