type WorldCleanup = () => void;

/** A deliberately small, lazy Three.js desert drive. It never captures page scroll. */
export function initExperienceGame(): WorldCleanup {
  const section = document.querySelector<HTMLElement>('#experience');
  const board = section?.querySelector<HTMLElement>('[data-experience-board]');
  const canvas = board?.querySelector<HTMLCanvasElement>('[data-experience-game-canvas]');
  const status = board?.querySelector<HTMLElement>('[data-game-status]');
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
    const velocity = new THREE.Vector3();
    const position = new THREE.Vector3(0, 0, 0);
    const cameraTarget = new THREE.Vector3();

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
    });

    const rockMaterial = new MeshStandardMaterial({ color: 0x765047, roughness: 1 });
    [[-6, -9, .9], [9, -22, .65], [-15, -2, 1.1], [14, 20, .8], [-4, 31, .7]].forEach(([x, z, scale]) => {
      const rock = new Mesh(new ConeGeometry(.7, 1.1, 6), rockMaterial);
      rock.scale.setScalar(scale);
      rock.position.set(x, .35 * scale, z);
      rock.castShadow = true;
      world.add(rock);
    });

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
    };
    resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : undefined;
    resizeObserver?.observe(board);
    window.addEventListener('resize', resize, { passive: true });

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
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    const onBlur = () => keys.clear();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    board.dataset.gameAvailable = 'true';
    board.dataset.gameActive = 'true';
    status.textContent = 'CAR / ARROWS ONLINE';

    let previous = performance.now();
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
      player.position.copy(position);
      player.position.y = Math.sin(now * .003) * .035;
      player.rotation.y = Math.atan2(velocity.x, Math.max(.1, -velocity.z));
      carBody.rotation.x += delta * (Math.abs(velocity.x) + Math.abs(velocity.z)) * .05;
      halo.rotation.z += delta * .4;
      cameraTarget.set(position.x, .3, position.z);
      const desiredCamera = new THREE.Vector3(position.x, 5.8, position.z + 8.5);
      camera.position.lerp(desiredCamera, Math.min(1, delta * 4));
      camera.lookAt(cameraTarget);
      status.textContent = `CAR / X ${Math.round(position.x).toString().padStart(3, '0')} / Z ${Math.round(position.z).toString().padStart(3, '0')}`;
      renderer.render(scene, camera);
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
          objectMaterials.forEach((material: { dispose: () => void }) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
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
