import * as THREE from 'three';

export interface FilmReelHandle {
  setProgress(progress: number): void;
  setHover(index: number | null): void;
  pick(clientX: number, clientY: number): number | null;
  resize(): void;
  setVisible(visible: boolean): void;
  dispose(): void;
}

interface FilmReelOptions {
  canvas: HTMLCanvasElement;
  viewport: HTMLElement;
  images: string[];
  captions: HTMLElement[];
}

const PANEL_W = 1;
const GAP = 0.012;
const PITCH = PANEL_W + GAP;
const IMAGE_H = PANEL_W * (9 / 16);
const RAIL_H = 0.035;
const BAND_H = IMAGE_H + RAIL_H * 2;
const LEAD = 1;
const WAVE_PERIOD = 3.4;
const WAVE = (Math.PI * 2) / WAVE_PERIOD;
const DEPTH = 0.28;
const LIFT = 0.05;
const CAMERA_Z = 2.8;
const HOLE_SPACING = 0.055;
const BASE_COLUMNS = 260;
const IMAGE_COLUMNS = 20;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const curveAt = (x: number) => {
  const phase = (x / PITCH) * WAVE;
  return {
    z: DEPTH * Math.cos(phase),
    y: LIFT * (1 - Math.cos(phase))
  };
};

const createRailTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);

  const gradient = context.createLinearGradient(0, 0, 0, 64);
  gradient.addColorStop(0, '#14171c');
  gradient.addColorStop(0.5, '#0d0f13');
  gradient.addColorStop(1, '#14171c');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);

  context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, 1.5);
  context.lineTo(64, 1.5);
  context.moveTo(0, 62.5);
  context.lineTo(64, 62.5);
  context.stroke();

  context.fillStyle = 'rgba(226, 231, 237, 0.46)';
  context.beginPath();
  context.roundRect(21, 23, 22, 18, 3);
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

interface RibbonMesh {
  mesh: THREE.Mesh;
  positions: Float32Array;
  baseX: Float32Array;
  yOffset: Float32Array;
  zOffset: number;
}

const buildRibbonMesh = (
  columns: number,
  localStart: number,
  localEnd: number,
  yTop: number,
  yBottom: number,
  zOffset: number,
  material: THREE.Material,
  uRepeat: boolean
) => {
  const vertexCount = (columns + 1) * 2;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const baseX = new Float32Array(vertexCount);
  const yOffset = new Float32Array(vertexCount);
  const indices: number[] = [];
  const stripLength = localEnd - localStart;

  for (let column = 0; column <= columns; column += 1) {
    const t = column / columns;
    const x = localStart + stripLength * t;
    const topIndex = column * 2;
    const bottomIndex = topIndex + 1;

    baseX[topIndex] = x;
    baseX[bottomIndex] = x;
    yOffset[topIndex] = yTop;
    yOffset[bottomIndex] = yBottom;
    positions[topIndex * 3] = x;
    positions[bottomIndex * 3] = x;

    const u = uRepeat ? (x - localStart) / HOLE_SPACING : t;
    uvs[topIndex * 2] = u;
    uvs[topIndex * 2 + 1] = 1;
    uvs[bottomIndex * 2] = u;
    uvs[bottomIndex * 2 + 1] = 0;

    if (column < columns) {
      const nextTop = topIndex + 2;
      const nextBottom = bottomIndex + 2;
      indices.push(topIndex, bottomIndex, nextTop, bottomIndex, nextBottom, nextTop);
    }
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  positionAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  return {
    mesh,
    positions,
    baseX,
    yOffset,
    zOffset
  };
};

export async function initFilmReel(options: FilmReelOptions): Promise<FilmReelHandle> {
  const { canvas, viewport, images, captions } = options;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 20);
  camera.position.set(0, 0, CAMERA_Z);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  const projectCount = images.length;
  const stripStart = -LEAD;
  const stripEnd = Math.max(0, (projectCount - 1) * PITCH) + LEAD;

  const baseMaterial = new THREE.MeshBasicMaterial({
    color: 0x07080a,
    side: THREE.DoubleSide
  });
  const railMaterial = new THREE.MeshBasicMaterial({
    map: createRailTexture(),
    side: THREE.DoubleSide,
    color: 0xcfd3d8
  });

  const updatable: RibbonMesh[] = [];

  const base = buildRibbonMesh(
    BASE_COLUMNS,
    stripStart,
    stripEnd,
    BAND_H / 2,
    -BAND_H / 2,
    0,
    baseMaterial,
    false
  );
  group.add(base.mesh);
  updatable.push(base);

  const topRail = buildRibbonMesh(
    BASE_COLUMNS,
    stripStart,
    stripEnd,
    BAND_H / 2,
    IMAGE_H / 2,
    0.002,
    railMaterial,
    true
  );
  group.add(topRail.mesh);
  updatable.push(topRail);

  const bottomRail = buildRibbonMesh(
    BASE_COLUMNS,
    stripStart,
    stripEnd,
    -IMAGE_H / 2,
    -BAND_H / 2,
    0.002,
    railMaterial,
    true
  );
  group.add(bottomRail.mesh);
  updatable.push(bottomRail);

  const loader = new THREE.TextureLoader();
  const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

  const textures = await Promise.all(
    images.map(async (src) => {
      try {
        const texture = await loader.loadAsync(src);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = anisotropy;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
      } catch {
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 1;
        fallbackCanvas.height = 1;
        const context = fallbackCanvas.getContext('2d');
        if (context) {
          context.fillStyle = '#0d0f13';
          context.fillRect(0, 0, 1, 1);
        }
        const texture = new THREE.CanvasTexture(fallbackCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      }
    })
  );

  const imageMaterials: THREE.MeshBasicMaterial[] = [];
  const imageMeshes: THREE.Mesh[] = [];

  for (let index = 0; index < projectCount; index += 1) {
    const center = index * PITCH;
    const localStart = center - PANEL_W / 2;
    const localEnd = center + PANEL_W / 2;
    const material = new THREE.MeshBasicMaterial({
      map: textures[index],
      side: THREE.DoubleSide,
      toneMapped: false
    });
    imageMaterials.push(material);

    const panel = buildRibbonMesh(
      IMAGE_COLUMNS,
      localStart,
      localEnd,
      IMAGE_H / 2,
      -IMAGE_H / 2,
      0.004,
      material,
      false
    );
    panel.mesh.userData.index = index;
    group.add(panel.mesh);
    updatable.push(panel);
    imageMeshes.push(panel.mesh);
  }

  let hovered: number | null = null;
  let activeWorld = 0;
  let visible = false;
  let width = 1;
  let height = 1;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const projected = new THREE.Vector3();

  const updateRibbon = () => {
    const groupX = group.position.x;
    updatable.forEach((entry) => {
      const { positions, baseX, yOffset, zOffset } = entry;
      for (let vertex = 0; vertex < baseX.length; vertex += 1) {
        const x = baseX[vertex] + groupX;
        const curve = curveAt(x);
        positions[vertex * 3 + 1] = curve.y + yOffset[vertex];
        positions[vertex * 3 + 2] = curve.z + zOffset;
      }
      entry.mesh.geometry.attributes.position.needsUpdate = true;
    });
  };

  const updateCaptions = () => {
    const groupX = group.position.x;
    captions.forEach((caption, index) => {
      const center = index * PITCH;
      const leftX = center - PANEL_W / 2 + groupX;
      const rightX = center + PANEL_W / 2 + groupX;
      const leftCurve = curveAt(leftX);
      const rightCurve = curveAt(rightX);

      projected.set(leftX, leftCurve.y - BAND_H / 2 + group.position.y, leftCurve.z);
      projected.project(camera);
      const leftScreen = {
        x: (projected.x * 0.5 + 0.5) * width,
        y: (-projected.y * 0.5 + 0.5) * height
      };

      projected.set(rightX, rightCurve.y - BAND_H / 2 + group.position.y, rightCurve.z);
      projected.project(camera);
      const rightScreen = {
        x: (projected.x * 0.5 + 0.5) * width,
        y: (-projected.y * 0.5 + 0.5) * height
      };

      const left = Math.min(leftScreen.x, rightScreen.x);
      const captionWidth = Math.abs(rightScreen.x - leftScreen.x);
      const top = Math.max(leftScreen.y, rightScreen.y) + 14;

      caption.style.left = `${left.toFixed(1)}px`;
      caption.style.top = `${top.toFixed(1)}px`;
      caption.style.width = `${captionWidth.toFixed(1)}px`;
    });
  };

  const updateMaterials = () => {
    const groupX = group.position.x;
    imageMaterials.forEach((material, index) => {
      const x = index * PITCH + groupX;
      const u = x / PITCH;
      const focus = Math.exp(-(u * u) / 0.8);
      let shade = 0.44 + 0.56 * focus;
      if (hovered === index) shade = Math.min(1, shade + 0.18);
      material.color.setScalar(shade);
    });
  };

  const render = () => {
    if (!visible) return;
    updateRibbon();
    updateMaterials();
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
    updateCaptions();
  };

  const resize = () => {
    const nextWidth = Math.max(1, viewport.clientWidth);
    const nextHeight = Math.max(1, viewport.clientHeight);
    width = nextWidth;
    height = nextHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(nextWidth, nextHeight, false);

    const aspect = nextWidth / nextHeight;
    camera.aspect = aspect;
    const scale = CAMERA_Z / (CAMERA_Z - DEPTH);
    const maxFraction = aspect < 1.2
      ? 0.84
      : clamp(0.56, 0.84 - (aspect - 1.2) * 0.35, 0.84);
    const targetBandFraction = Math.min(0.8, (nextHeight - 120) / nextHeight);
    const fraction = Math.min(
      maxFraction,
      targetBandFraction / (aspect * BAND_H)
    );
    const visibleWidth = scale / fraction;
    const visibleHeight = visibleWidth / aspect;
    camera.fov = 2 * Math.atan(visibleHeight / (2 * CAMERA_Z)) * (180 / Math.PI);
    camera.updateProjectionMatrix();

    const bandScreenPx = fraction * nextWidth * BAND_H;
    const desiredShift = Math.max(0, (bandScreenPx - nextHeight) / 2 + 100);
    const maxShift = Math.max(0, (nextHeight - bandScreenPx) / 2 - 10);
    const shiftPx = Math.min(desiredShift, maxShift);
    group.position.y = bandScreenPx > 0
      ? (shiftPx * BAND_H) / bandScreenPx
      : 0;

    render();
  };

  const setProgress = (progress: number) => {
    activeWorld = clamp(progress, 0, 1) * Math.max(0, projectCount - 1) * PITCH;
    group.position.x = -activeWorld;
    render();
  };

  const pick = (clientX: number, clientY: number) => {
    if (!visible) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    pointer.set(x, y);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(imageMeshes, false)[0];
    if (!hit) return null;
    const index = hit.object.userData.index;
    return typeof index === 'number' ? index : null;
  };

  const setHover = (index: number | null) => {
    if (hovered === index) return;
    hovered = index;
    canvas.style.cursor = index === null ? 'grab' : 'pointer';
    updateMaterials();
    renderer.render(scene, camera);
  };

  resize();
  render();

  return {
    setProgress,
    setHover,
    pick,
    resize,
    setVisible(nextVisible: boolean) {
      visible = nextVisible;
      if (visible) resize();
    },
    dispose() {
      textures.forEach((texture) => texture.dispose());
      baseMaterial.dispose();
      railMaterial.map?.dispose();
      railMaterial.dispose();
      imageMaterials.forEach((material) => material.dispose());
      updatable.forEach((entry) => entry.mesh.geometry.dispose());
      renderer.dispose();
    }
  };
}
