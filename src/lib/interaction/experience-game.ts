import { practice } from '../../data/experience';

type WorldCleanup = () => void;

/** A deliberately small, lazy Three.js desert drive. It never captures page scroll. */
export function initExperienceGame(): WorldCleanup {
  const section = document.querySelector<HTMLElement>('#experience');
  const board = section?.querySelector<HTMLElement>('[data-experience-board]');
  const canvas = board?.querySelector<HTMLCanvasElement>('[data-experience-game-canvas]');
  const hudCanvas = board?.querySelector<HTMLCanvasElement>('[data-experience-game-hud]');
  const status = board?.querySelector<HTMLElement>('[data-game-status]');
  const basePanel = board?.querySelector<HTMLElement>('[data-base-panel]');
  if (!section || !board || !canvas || !status || typeof IntersectionObserver === 'undefined') return () => {};

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  if (reducedMotion || touch) {
    board.dataset.gameAvailable = 'false';
    status.textContent = reducedMotion ? 'DESERT / REDUCED MOTION' : 'DESERT / DESKTOP KEYBOARD';
    return () => {};
  }

  let disposed = false;
  let visible = false;
  let generation = 0;
  let animationFrame = 0;
  let resizeObserver: ResizeObserver | undefined;
  let cleanupWorld: WorldCleanup | undefined;

  const stop = () => {
    generation += 1;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    cleanupWorld?.();
    cleanupWorld = undefined;
    board.dataset.gameActive = 'false';
    board.dataset.gameBase = '';
    delete board.dataset.carX;
    delete board.dataset.carZ;
    delete board.dataset.gameKeys;
    delete board.dataset.gameHud;
    if (basePanel) basePanel.hidden = true;
    status.textContent = 'DESERT / PAUSED OUTSIDE SECTION';
  };

  const start = async () => {
    if (disposed || !visible || cleanupWorld) return;
    const token = ++generation;
    const THREE = await import('three');
    if (disposed || token !== generation || !visible) return;

    const {
      AmbientLight, BoxGeometry, CapsuleGeometry, Color, ConeGeometry, CylinderGeometry, DoubleSide,
      DirectionalLight, Fog, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PerspectiveCamera,
      PlaneGeometry, Scene, SRGBColorSpace, SphereGeometry, TorusGeometry, WebGLRenderer,
    } = THREE;

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0xc98752, 1);

    const scene = new Scene();
    scene.background = new Color('#d99a68');
    scene.fog = new Fog('#d99a68', 28, 86);
    const camera = new PerspectiveCamera(42, 1, .1, 100);
    const world = new Group();
    const player = new Group();
    const keys = new Set<string>();
    let hudContext: CanvasRenderingContext2D | null = null;
    const velocity = new THREE.Vector3();
    const position = new THREE.Vector3(0, 0, 0);
    const cameraTarget = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();
    // XZ colliders, inflated by carRadius at test time. Dunes keep their
    // elliptical footprint; everything else is a circle (rx === rz).
    const solids: { x: number; z: number; rx: number; rz: number; kind: 'dune' | 'cactus' | 'rock' | 'base' }[] = [];
    const carRadius = 1.05;

    scene.add(new AmbientLight(0xffc994, 1.4));
    const light = new DirectionalLight(0xffe0ab, 4.2);
    light.position.set(-14, 22, 10);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -24;
    light.shadow.camera.right = 24;
    light.shadow.camera.top = 24;
    light.shadow.camera.bottom = -24;
    light.shadow.camera.far = 80;
    scene.add(light);
    scene.add(world);

    const sun = new Mesh(new SphereGeometry(2.2, 20, 12), new MeshStandardMaterial({ color: 0xffdf8a, emissive: 0xffa83d, emissiveIntensity: 1.4, roughness: 1 }));
    sun.position.set(-15, 13, -36);
    scene.add(sun);

    const sand = new MeshStandardMaterial({ color: 0xb7683f, roughness: 1, metalness: 0, side: DoubleSide });
    const floor = new Mesh(new PlaneGeometry(100, 100, 64, 64), sand);
    const floorPositions = floor.geometry.attributes.position;
    for (let index = 0; index < floorPositions.count; index += 1) {
      const x = floorPositions.getX(index);
      const y = floorPositions.getY(index);
      floorPositions.setZ(index, Math.sin(x * .13) * .65 + Math.cos(y * .08) * .45 + Math.sin((x + y) * .035) * 1.1);
    }
    floor.geometry.computeVertexNormals();
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.1;
    floor.receiveShadow = true;
    world.add(floor);

    const duneMaterials = [
      new MeshStandardMaterial({ color: 0xd98b55, roughness: 1 }),
      new MeshStandardMaterial({ color: 0xb96742, roughness: 1 }),
    ];
    [[-9, -13, 7], [10, -21, 9], [-18, -28, 10], [21, -32, 12], [-20, 13, 8], [17, 18, 7]].forEach(([x, z, scale], index) => {
      const dune = new Mesh(new SphereGeometry(1, 20, 12), duneMaterials[index % duneMaterials.length]);
      dune.scale.set(scale * 1.45, scale * .5, scale);
      dune.position.set(x, scale * .3, z);
      dune.castShadow = true;
      dune.receiveShadow = true;
      world.add(dune);
      solids.push({ x, z, rx: scale * 1.45, rz: scale, kind: 'dune' });
    });

    const cactusMaterial = new MeshStandardMaterial({ color: 0x4d6548, roughness: .9 });
    [[-7, -9, 1], [8, -13, 1.25], [-15, -22, .8], [16, -25, 1.1], [0, 31, 1.5]].forEach(([x, z, scale]) => {
      const cactus = new Group();
      const trunk = new Mesh(new CylinderGeometry(.16, .22, 2.3, 8), cactusMaterial);
      trunk.position.y = 1.15 * scale;
      cactus.add(trunk);
      const arm = new Mesh(new CylinderGeometry(.1, .14, .85, 8), cactusMaterial);
      arm.position.set(.42, 1.18, 0);
      arm.rotation.z = -Math.PI / 2.4;
      cactus.add(arm);
      cactus.scale.setScalar(scale);
      cactus.position.set(x, 0, z);
      cactus.castShadow = true;
      world.add(cactus);
      const cactusRadius = .9 * scale + .1;
      solids.push({ x, z, rx: cactusRadius, rz: cactusRadius, kind: 'cactus' });
    });

    const rockMaterial = new MeshStandardMaterial({ color: 0x765047, roughness: 1 });
    [[-6, -9, .9], [9, -22, .65], [-15, -2, 1.1], [14, 20, .8], [-4, 31, .7]].forEach(([x, z, scale]) => {
      const rock = new Mesh(new ConeGeometry(.7, 1.1, 6), rockMaterial);
      rock.scale.setScalar(scale);
      rock.position.set(x, .35 * scale, z);
      rock.castShadow = true;
      world.add(rock);
      const rockRadius = .75 * scale;
      solids.push({ x, z, rx: rockRadius, rz: rockRadius, kind: 'rock' });
    });

    // Practice bases: one location per card, placed on open ground and read
    // through the proximity panel when the car stops next to it.
    const groundAt = (x: number, z: number) => Math.sin(x * .13) * .65 + Math.cos(z * .08) * .45 + Math.sin((x - z) * .035) * 1.1 - .1;
    const basePadMaterial = new MeshStandardMaterial({ color: 0x6b4a2f, roughness: .95 });
    const baseStoneMaterial = new MeshStandardMaterial({ color: 0x2a2119, roughness: .85 });
    const bases = practice.map((entry) => {
      const group = new Group();
      const pad = new Mesh(new CylinderGeometry(3.4, 4, .5, 6), basePadMaterial);
      pad.position.y = .25;
      pad.castShadow = true;
      pad.receiveShadow = true;
      group.add(pad);
      const monolith = new Mesh(new BoxGeometry(2.2, 3.6, .45), baseStoneMaterial);
      monolith.position.y = 2.3;
      monolith.castShadow = true;
      group.add(monolith);
      const accent = new MeshStandardMaterial({ color: 0x2957ff, emissive: 0x2957ff, emissiveIntensity: .9, roughness: .4 });
      const strip = new Mesh(new BoxGeometry(.16, 3.2, .5), accent);
      strip.position.set(-.86, 2.3, 0);
      group.add(strip);
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 128;
      labelCanvas.height = 256;
      const labelContext = labelCanvas.getContext('2d');
      if (labelContext) {
        labelContext.clearRect(0, 0, 128, 256);
        labelContext.fillStyle = '#ffd66b';
        labelContext.font = '700 150px Arial, sans-serif';
        labelContext.textAlign = 'center';
        labelContext.textBaseline = 'middle';
        labelContext.fillText(entry.number, 64, 138);
      }
      const label = new Mesh(new PlaneGeometry(1.3, 2.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(labelCanvas), transparent: true }));
      label.position.set(.35, 2.3, .24);
      group.add(label);
      const beacon = new Mesh(new TorusGeometry(1.4, .08, 8, 40), accent);
      beacon.rotation.x = Math.PI / 2;
      beacon.position.y = 4.6;
      group.add(beacon);
      group.position.set(entry.base.x, groundAt(entry.base.x, entry.base.z), entry.base.z);
      group.rotation.y = Math.atan2(-entry.base.x, -entry.base.z);
      world.add(group);
      solids.push({ x: entry.base.x, z: entry.base.z, rx: 3.5, rz: 3.5, kind: 'base' });
      return { entry, x: entry.base.x, z: entry.base.z, accent };
    });
    const baseFields = basePanel ? {
      index: basePanel.querySelector<HTMLElement>('[data-base-index]'),
      discipline: basePanel.querySelector<HTMLElement>('[data-base-discipline]'),
      name: basePanel.querySelector<HTMLElement>('[data-base-name]'),
      description: basePanel.querySelector<HTMLElement>('[data-base-description]'),
      technologies: basePanel.querySelector<HTMLElement>('[data-base-technologies]'),
    } : undefined;

    // Bounds for the top-left sector map, derived from every solid plus margin.
    const mapBounds = (() => {
      let minX = 0;
      let maxX = 0;
      let minZ = 0;
      let maxZ = 0;
      for (const solid of solids) {
        minX = Math.min(minX, solid.x - solid.rx);
        maxX = Math.max(maxX, solid.x + solid.rx);
        minZ = Math.min(minZ, solid.z - solid.rz);
        maxZ = Math.max(maxZ, solid.z + solid.rz);
      }
      return { minX: minX - 4, maxX: maxX + 4, minZ: minZ - 4, maxZ: maxZ + 4 };
    })();

    const carPaint = new MeshPhysicalMaterial({ color: 0x2957ff, emissive: 0x081337, emissiveIntensity: .3, roughness: .22, metalness: .68, clearcoat: .8, clearcoatRoughness: .18 });
    const trim = new MeshStandardMaterial({ color: 0x0b0d13, roughness: .28, metalness: .72 });
    const glass = new MeshPhysicalMaterial({ color: 0x111827, roughness: .08, metalness: .55, transmission: .08, transparent: true, opacity: .94 });
    const carBody = new Mesh(new BoxGeometry(1.55, .42, 2.8), carPaint);
    carBody.position.y = .65;
    carBody.castShadow = true;
    player.add(carBody);
    const hood = new Mesh(new BoxGeometry(1.38, .12, .72), carPaint);
    hood.position.set(0, .91, -.85);
    hood.castShadow = true;
    player.add(hood);
    const bumper = new Mesh(new BoxGeometry(1.48, .12, .12), trim);
    bumper.position.set(0, .44, -1.42);
    bumper.castShadow = true;
    player.add(bumper);
    const cabin = new Mesh(new CapsuleGeometry(.58, .84, 4, 12), glass);
    cabin.position.set(0, .98, -.15);
    cabin.scale.set(1, .65, 1);
    cabin.castShadow = true;
    player.add(cabin);
    const wheelMaterial = new MeshStandardMaterial({ color: 0x17171a, roughness: .8, metalness: .1 });
    [[-.82, .38, -.92], [.82, .38, -.92], [-.82, .38, .92], [.82, .38, .92]].forEach(([x, y, z]) => {
      const wheel = new Mesh(new CylinderGeometry(.3, .3, .18, 16), wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      player.add(wheel);
    });
    const headlightMaterial = new MeshStandardMaterial({ color: 0xfff1bb, emissive: 0xffd66b, emissiveIntensity: 2 });
    [-.48, .48].forEach((x) => {
      const headlight = new Mesh(new BoxGeometry(.22, .12, .05), headlightMaterial);
      headlight.position.set(x, .7, -1.42);
      headlight.castShadow = true;
      player.add(headlight);
    });
    const tailLightMaterial = new MeshStandardMaterial({ color: 0xff3d3d, emissive: 0x8c0909, emissiveIntensity: 1.2 });
    [-.48, .48].forEach((x) => {
      const tailLight = new Mesh(new BoxGeometry(.22, .12, .05), tailLightMaterial);
      tailLight.position.set(x, .7, 1.42);
      tailLight.castShadow = true;
      player.add(tailLight);
    });
    const halo = new Mesh(new TorusGeometry(1.05, .012, 6, 40), new MeshStandardMaterial({ color: 0xffd66b, emissive: 0xff8d38, emissiveIntensity: 1.5 }));
    halo.rotation.x = Math.PI / 2;
    halo.position.y = .04;
    player.add(halo);
    player.castShadow = true;
    scene.add(player);

    const resize = () => {
      const rect = board.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (hudCanvas) {
        const hudRatio = Math.min(window.devicePixelRatio || 1, 2);
        hudCanvas.width = Math.round(width * hudRatio);
        hudCanvas.height = Math.round(height * hudRatio);
        hudContext = hudCanvas.getContext('2d');
        hudContext?.setTransform(hudRatio, 0, 0, hudRatio, 0, 0);
        board.dataset.gameHud = hudContext ? 'ready' : 'none';
      }
    };
    resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : undefined;
    resizeObserver?.observe(board);
    window.addEventListener('resize', resize, { passive: true });
    resize();

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!visible || event.defaultPrevented || target?.closest('a,button,input,textarea,select,[contenteditable]')) return;
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'r'].includes(key)) {
        event.preventDefault();
        if (key === 'r') {
          position.set(0, 0, 0);
          velocity.set(0, 0, 0);
          return;
        }
        keys.add(key);
        board.dataset.gameKeys = [...keys].sort().join(' ');
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.key.toLowerCase());
      board.dataset.gameKeys = [...keys].sort().join(' ');
    };
    const onBlur = () => {
      keys.clear();
      board.dataset.gameKeys = '';
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    board.dataset.gameAvailable = 'true';
    board.dataset.gameActive = 'true';
    board.dataset.gameKeys = '';
    status.textContent = 'CAR / ARROWS ONLINE';

    let previous = performance.now();
    let nearBaseNumber = '';

    const traceRoundedRect = (context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      const radius = Math.min(r, w / 2, h / 2);
      context.beginPath();
      context.moveTo(x + radius, y);
      context.arcTo(x + w, y, x + w, y + h, radius);
      context.arcTo(x + w, y + h, x, y + h, radius);
      context.arcTo(x, y + h, x, y, radius);
      context.arcTo(x, y, x + w, y, radius);
      context.closePath();
    };

    // Sector map (top-left) plus an animated arrow-key cluster that mirrors
    // live input, both painted over the WebGL frame on the HUD canvas.
    const drawHud = (now: number) => {
      const context = hudContext;
      if (!context || !hudCanvas) return;
      const width = hudCanvas.clientWidth;
      const height = hudCanvas.clientHeight;
      if (width < 40 || height < 40) return;
      context.clearRect(0, 0, width, height);
      context.textBaseline = 'alphabetic';

      const mapSize = Math.round(Math.min(156, Math.max(118, Math.min(width, height) * .24)));
      const mapX = 16;
      const mapY = 14;
      const mapPad = 10;
      const headerH = 18;
      traceRoundedRect(context, mapX, mapY, mapSize, mapSize, 6);
      context.fillStyle = 'rgba(12, 16, 27, .88)';
      context.fill();
      context.strokeStyle = 'rgba(53, 64, 91, .95)';
      context.lineWidth = 1;
      context.stroke();
      context.font = '9px "IBM Plex Mono", monospace';
      context.textAlign = 'left';
      context.fillStyle = '#9eb2ff';
      context.fillText('SECTOR / MAP', mapX + mapPad, mapY + 16);

      const innerX = mapX + mapPad;
      const innerY = mapY + headerH;
      const innerW = mapSize - mapPad * 2;
      const innerH = mapSize - headerH - mapPad;
      const spanX = mapBounds.maxX - mapBounds.minX;
      const spanZ = mapBounds.maxZ - mapBounds.minZ;
      const scale = Math.min(innerW / spanX, innerH / spanZ);
      const drawnW = spanX * scale;
      const drawnH = spanZ * scale;
      const originX = innerX + (innerW - drawnW) / 2;
      const originY = innerY + (innerH - drawnH) / 2;
      const mapToX = (x: number) => originX + (x - mapBounds.minX) * scale;
      const mapToY = (z: number) => originY + (z - mapBounds.minZ) * scale;

      context.save();
      context.beginPath();
      context.rect(innerX, innerY, innerW, innerH);
      context.clip();
      context.strokeStyle = 'rgba(158, 178, 255, .12)';
      context.lineWidth = 1;
      for (let line = 1; line < 3; line += 1) {
        const gridX = originX + drawnW * (line / 3);
        const gridY = originY + drawnH * (line / 3);
        context.beginPath();
        context.moveTo(gridX, originY);
        context.lineTo(gridX, originY + drawnH);
        context.moveTo(originX, gridY);
        context.lineTo(originX + drawnW, gridY);
        context.stroke();
      }
      const spawnX = mapToX(0);
      const spawnY = mapToY(0);
      context.strokeStyle = 'rgba(158, 178, 255, .55)';
      context.beginPath();
      context.moveTo(spawnX - 4, spawnY);
      context.lineTo(spawnX + 4, spawnY);
      context.moveTo(spawnX, spawnY - 4);
      context.lineTo(spawnX, spawnY + 4);
      context.stroke();
      for (const solid of solids) {
        if (solid.kind === 'base') continue;
        const centerMapX = mapToX(solid.x);
        const centerMapY = mapToY(solid.z);
        const radiusX = Math.max(1.5, solid.rx * scale);
        const radiusZ = Math.max(1.5, solid.rz * scale);
        context.beginPath();
        if (solid.kind === 'dune') {
          context.ellipse(centerMapX, centerMapY, radiusX, radiusZ, 0, 0, Math.PI * 2);
          context.fillStyle = 'rgba(183, 104, 63, .8)';
          context.fill();
          continue;
        }
        context.arc(centerMapX, centerMapY, Math.max(radiusX, radiusZ), 0, Math.PI * 2);
        context.fillStyle = solid.kind === 'cactus' ? 'rgba(110, 150, 100, .95)' : 'rgba(140, 100, 85, .95)';
        context.fill();
      }
      for (const base of bases) {
        const baseMapX = mapToX(base.x);
        const baseMapY = mapToY(base.z);
        const active = nearBaseNumber === base.entry.number;
        const ringPulse = .5 + .5 * Math.sin(now * .005);
        context.beginPath();
        context.arc(baseMapX, baseMapY, active ? 6 : 4.5, 0, Math.PI * 2);
        context.fillStyle = 'rgba(41, 87, 255, .95)';
        context.fill();
        context.lineWidth = active ? 2 : 1;
        context.strokeStyle = active ? '#ffd66b' : `rgba(158, 178, 255, ${(.35 + .4 * ringPulse).toFixed(3)})`;
        context.stroke();
        context.font = '700 9px "IBM Plex Mono", monospace';
        context.fillStyle = active ? '#ffd66b' : 'rgba(232, 236, 255, .85)';
        context.fillText(base.entry.number, baseMapX + 7, baseMapY + 3);
      }
      const heading = player.rotation.y;
      const directionX = -Math.sin(heading);
      const directionY = -Math.cos(heading);
      const carSize = 7;
      const backX = directionX * -carSize * .6;
      const backY = directionY * -carSize * .6;
      const sideX = -directionY * carSize * .55;
      const sideY = directionX * carSize * .55;
      context.beginPath();
      context.moveTo(mapToX(position.x) + directionX * carSize, mapToY(position.z) + directionY * carSize);
      context.lineTo(mapToX(position.x) + backX + sideX, mapToY(position.z) + backY + sideY);
      context.lineTo(mapToX(position.x) + backX - sideX, mapToY(position.z) + backY - sideY);
      context.closePath();
      context.fillStyle = '#ffd66b';
      context.fill();
      context.strokeStyle = 'rgba(12, 16, 27, .9)';
      context.lineWidth = 1;
      context.stroke();
      context.restore();
      context.strokeStyle = 'rgba(158, 178, 255, .22)';
      context.strokeRect(innerX + .5, innerY + .5, innerW - 1, innerH - 1);

      const keySize = Math.round(Math.min(46, Math.max(30, Math.min(width, height) * .075)));
      const keyGap = Math.round(keySize * .2);
      const clusterWidth = keySize * 3 + keyGap * 2;
      const clusterHeight = keySize * 2 + keyGap;
      const clusterX = Math.round((width - clusterWidth) / 2);
      const clusterY = Math.round(height - clusterHeight - 44);
      const pressed = keys;
      const cluster = [
        { x: clusterX + keySize + keyGap, y: clusterY, dir: 0, active: pressed.has('arrowup') || pressed.has('w'), phase: 0 },
        { x: clusterX + (keySize + keyGap) * 2, y: clusterY + keySize + keyGap, dir: 1, active: pressed.has('arrowright') || pressed.has('d'), phase: .8 },
        { x: clusterX + keySize + keyGap, y: clusterY + keySize + keyGap, dir: 2, active: pressed.has('arrowdown') || pressed.has('s'), phase: 1.6 },
        { x: clusterX, y: clusterY + keySize + keyGap, dir: 3, active: pressed.has('arrowleft') || pressed.has('a'), phase: 2.4 },
      ];
      context.font = '9px "IBM Plex Mono", monospace';
      context.textAlign = 'center';
      context.fillStyle = `rgba(158, 178, 255, ${(.4 + .35 * (.5 + .5 * Math.sin(now * .003))).toFixed(3)})`;
      context.fillText('ARROWS / WASD', clusterX + clusterWidth / 2, clusterY - 10);
      for (const key of cluster) {
        const pulse = .5 + .5 * Math.sin(now * .004 - key.phase);
        const grow = key.active ? 3 : 0;
        const boxX = key.x - grow;
        const boxY = key.y - grow;
        const boxSize = keySize + grow * 2;
        context.save();
        if (key.active) {
          context.shadowColor = 'rgba(41, 87, 255, .9)';
          context.shadowBlur = 14;
        }
        traceRoundedRect(context, boxX, boxY, boxSize, boxSize, Math.max(5, boxSize * .18));
        context.fillStyle = key.active ? 'rgba(41, 87, 255, .95)' : 'rgba(12, 16, 27, .78)';
        context.fill();
        context.shadowBlur = 0;
        context.lineWidth = key.active ? 2 : 1;
        context.strokeStyle = key.active ? '#9eb2ff' : `rgba(158, 178, 255, ${(.28 + .5 * pulse).toFixed(3)})`;
        context.stroke();
        const glyphSize = boxSize * .42;
        context.translate(boxX + boxSize / 2, boxY + boxSize / 2);
        context.rotate(key.dir * Math.PI / 2);
        context.beginPath();
        context.moveTo(0, -glyphSize * .9);
        context.lineTo(glyphSize * .8, glyphSize * .15);
        context.lineTo(glyphSize * .32, glyphSize * .15);
        context.lineTo(glyphSize * .32, glyphSize * .9);
        context.lineTo(-glyphSize * .32, glyphSize * .9);
        context.lineTo(-glyphSize * .32, glyphSize * .15);
        context.lineTo(-glyphSize * .8, glyphSize * .15);
        context.closePath();
        context.fillStyle = key.active ? '#ffffff' : `rgba(158, 178, 255, ${(.55 + .45 * pulse).toFixed(3)})`;
        context.fill();
        context.restore();
      }
      context.textAlign = 'left';
    };

    const tick = (now: number) => {
      if (disposed || !visible) return;
      const delta = Math.min(.05, Math.max(.001, (now - previous) / 1000));
      previous = now;
      const forward = Number(keys.has('arrowup') || keys.has('w')) - Number(keys.has('arrowdown') || keys.has('s'));
      const sideways = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'));
      const length = Math.hypot(sideways, forward) || 1;
      velocity.x += (sideways / length * 7 - velocity.x) * Math.min(1, delta * 8);
      velocity.z += (forward / length * 7 - velocity.z) * Math.min(1, delta * 8);
      if (!sideways && !forward) velocity.multiplyScalar(Math.max(0, 1 - delta * 8));
      position.x += velocity.x * delta;
      position.z -= velocity.z * delta;
      // Slide along solids: project the car out of the inflated ellipse and
      // remove the velocity component pointing into the surface.
      for (const solid of solids) {
        const dx = position.x - solid.x;
        const dz = position.z - solid.z;
        const rx = solid.rx + carRadius;
        const rz = solid.rz + carRadius;
        const scaledX = dx / rx;
        const scaledZ = dz / rz;
        const inside = scaledX * scaledX + scaledZ * scaledZ;
        if (inside >= 1) continue;
        if (inside < 1e-6) {
          position.x = solid.x + rx;
          continue;
        }
        const escape = 1 / Math.sqrt(inside);
        position.x = solid.x + dx * escape;
        position.z = solid.z + dz * escape;
        let normalX = dx / (rx * rx);
        let normalZ = dz / (rz * rz);
        const normalLength = Math.hypot(normalX, normalZ) || 1;
        normalX /= normalLength;
        normalZ /= normalLength;
        const inward = velocity.x * normalX + velocity.z * normalZ;
        if (inward < 0) {
          velocity.x -= inward * normalX;
          velocity.z -= inward * normalZ;
        }
      }
      const carXText = position.x.toFixed(1);
      const carZText = position.z.toFixed(1);
      if (board.dataset.carX !== carXText) board.dataset.carX = carXText;
      if (board.dataset.carZ !== carZText) board.dataset.carZ = carZText;
      player.position.copy(position);
      // Follow the displaced floor: the eastern route climbs ~1.5 units and
      // used to swallow the car whole.
      player.position.y = groundAt(position.x, position.z) - .06 + Math.sin(now * .003) * .035;
      // Face the travel direction (front of the mesh is -z) and hold the last
      // heading once the car settles, so the minimap arrow matches the body.
      if (Math.hypot(velocity.x, velocity.z) > .15) {
        player.rotation.y = Math.atan2(-velocity.x, velocity.z);
      }
      // Keep the pitch bounded: the original accumulation spun the body
      // around during the longer drives the bases now require.
      carBody.rotation.x += delta * (Math.abs(velocity.x) + Math.abs(velocity.z)) * .05;
      carBody.rotation.x *= Math.max(0, 1 - delta * 2.5);
      halo.rotation.z += delta * .4;
      for (let index = 0; index < bases.length; index += 1) {
        bases[index].accent.emissiveIntensity = .7 + Math.sin(now * .004 + index * 2) * .35;
      }
      let nearest: (typeof bases)[number] | undefined;
      let nearestDistance = 7;
      for (const base of bases) {
        const distance = Math.hypot(position.x - base.x, position.z - base.z);
        if (distance < nearestDistance) { nearestDistance = distance; nearest = base; }
      }
      const currentBaseNumber = nearest?.entry.number ?? '';
      if (currentBaseNumber !== nearBaseNumber) {
        nearBaseNumber = currentBaseNumber;
        if (nearest && basePanel && baseFields) {
          basePanel.hidden = false;
          board.dataset.gameBase = nearest.entry.number;
          if (baseFields.index) baseFields.index.textContent = nearest.entry.number;
          if (baseFields.discipline) baseFields.discipline.textContent = nearest.entry.discipline;
          if (baseFields.name) baseFields.name.textContent = nearest.entry.name;
          if (baseFields.description) baseFields.description.textContent = nearest.entry.description;
          if (baseFields.technologies) baseFields.technologies.textContent = nearest.entry.technologies.join(' / ');
        } else if (basePanel) {
          basePanel.hidden = true;
          board.dataset.gameBase = '';
        }
      }
      // While parked at a base, aim mostly at the structure so it lands
      // center-frame instead of hiding behind the info panel at the right.
      const aim = nearest ? .65 : 0;
      lookTarget.set(
        position.x + (nearest ? (nearest.x - position.x) * aim : 0),
        // Aim at mid-monolith near a base, otherwise the tall slab clips the
        // top of the frame while the camera looks down at the car.
        nearest ? 1.6 : .3,
        position.z + (nearest ? (nearest.z - position.z) * aim : 0),
      );
      cameraTarget.lerp(lookTarget, Math.min(1, delta * 4));
      const desiredCamera = new THREE.Vector3(position.x, 5.8, position.z + 8.5);
      camera.position.lerp(desiredCamera, Math.min(1, delta * 4));
      camera.lookAt(cameraTarget);
      status.textContent = nearBaseNumber
        ? `BASE / ${nearBaseNumber} ONLINE`
        : `CAR / X ${Math.round(position.x).toString().padStart(3, '0')} / Z ${Math.round(position.z).toString().padStart(3, '0')}`;
      renderer.render(scene, camera);
      drawHud(now);
      animationFrame = window.requestAnimationFrame(tick);
    };
    animationFrame = window.requestAnimationFrame(tick);

    cleanupWorld = () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', resize);
      resizeObserver?.disconnect();
      const geometries = new Set<{ dispose: () => void }>();
      const materials = new Set<{ dispose: () => void }>();
      scene.traverse((object) => {
        const resource = object as {
          geometry?: { dispose: () => void };
          material?: { dispose: () => void } | { dispose: () => void }[];
        };
        if (resource.geometry) geometries.add(resource.geometry);
        if (resource.material) {
          const objectMaterials = Array.isArray(resource.material) ? resource.material : [resource.material];
          objectMaterials.forEach((material: { dispose: () => void }) => {
            materials.add(material);
            const map = (material as { map?: { dispose: () => void } }).map;
            map?.dispose();
          });
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      if (hudCanvas && hudContext) {
        hudContext.setTransform(1, 0, 0, 1, 0, 0);
        hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
      }
      hudContext = null;
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.style.opacity = '0';
    };
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= .2);
    if (visible) void start();
    else stop();
  }, { threshold: [0, .2] });
  observer.observe(section);
  board.dataset.gameAvailable = 'pending';

  return () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    stop();
    resizeObserver?.disconnect();
  };
}
