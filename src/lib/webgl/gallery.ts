import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader, Vector2 } from 'three';
import { clamp, damp, imageRect, type CachedRect } from './core';
import { imageVertex, imageFragment } from './shaders/image';

interface GalleryState {
  viewport: { width: number; height: number };
  scroll: { y: number; velocity: number };
  mouse: { velocityX: number; velocityY: number };
}
interface ImagePlane {
  image: HTMLImageElement;
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  bounds: CachedRect;
  hovered: boolean;
  ready: boolean;
}

/** DOM images remain visible and accessible underneath this progressive layer. */
export class ImageGallery {
  readonly scene = new Scene();
  readonly camera = new OrthographicCamera(-1, 1, 1, -1, .1, 10);
  readonly ready: Promise<void>;
  private planes: ImagePlane[] = [];
  private geometry = new PlaneGeometry(1, 1);
  private textures = new Map<string, Promise<Texture>>();
  private loaded = new Set<Texture>();
  private removers: (() => void)[] = [];
  private disposed = false;

  constructor(images: HTMLImageElement[], loadTexture: (src: string) => Promise<Texture> = (src: string) => new TextureLoader().loadAsync(src)) {
    this.camera.position.z = 2;
    const tasks = images.map(image => {
      const material = new ShaderMaterial({ vertexShader: imageVertex, fragmentShader: imageFragment,
        depthTest: false, depthWrite: false, transparent: true,
        uniforms: { uTexture: { value: null }, uHover: { value: 0 }, uTime: { value: 0 },
          uVelocity: { value: new Vector2() }, uCover: { value: new Vector2(1, 1) } },
      });
      const mesh = new Mesh(this.geometry, material);
      mesh.visible = false;
      this.scene.add(mesh);
      const plane: ImagePlane = { image, mesh, bounds: { left: 0, top: 0, width: 0, height: 0 }, hovered: false, ready: false };
      this.planes.push(plane);
      const target = image.closest('a') ?? image;
      const enter = () => { plane.hovered = true; };
      const leave = () => { plane.hovered = false; };
      const events = [['pointerenter', enter], ['pointerleave', leave], ['focusin', enter], ['focusout', leave]] as const;
      events.forEach(([event, handler]) => {
        target.addEventListener(event, handler);
        this.removers.push(() => target.removeEventListener(event, handler));
      });
      const src = image.currentSrc || image.src;
      if (!src) return Promise.resolve();
      if (!this.textures.has(src)) {
        this.textures.set(src, loadTexture(src).then(texture => {
          texture.colorSpace = SRGBColorSpace;
          if (this.disposed) texture.dispose();
          else this.loaded.add(texture);
          return texture;
        }));
      }
      return this.textures.get(src)!.then(texture => {
        if (this.disposed) return;
        material.uniforms.uTexture.value = texture;
        plane.ready = true;
      }).catch(() => { /* A failed enhancement must never remove the DOM image. */ });
    });
    this.ready = Promise.all(tasks).then(() => undefined);
  }

  measure(scrollY: number) {
    for (const plane of this.planes) {
      const rect = plane.image.getBoundingClientRect();
      plane.bounds = { left: rect.left, top: rect.top + scrollY, width: rect.width, height: rect.height };
      const imageAspect = plane.image.naturalWidth / Math.max(1, plane.image.naturalHeight);
      const planeAspect = rect.width / Math.max(1, rect.height);
      plane.mesh.material.uniforms.uCover.value.set(Math.min(1, planeAspect / (imageAspect || 1)), Math.min(1, (imageAspect || 1) / planeAspect));
    }
  }

  update(state: GalleryState, delta: number, time: number) {
    const { width, height } = state.viewport;
    if (this.camera.right !== width / 2 || this.camera.top !== height / 2) {
      this.camera.left = -width / 2; this.camera.right = width / 2;
      this.camera.top = height / 2; this.camera.bottom = -height / 2;
      this.camera.updateProjectionMatrix();
    }
    let visible = 0;
    for (const plane of this.planes) {
      const rect = imageRect(plane.bounds, state.scroll.y, width, height);
      plane.mesh.visible = plane.ready && rect.visible;
      if (!plane.mesh.visible) continue;
      visible++;
      plane.mesh.position.set(rect.x, rect.y, 0);
      plane.mesh.scale.set(rect.width, rect.height, 1);
      const uniforms = plane.mesh.material.uniforms;
      uniforms.uHover.value = damp(uniforms.uHover.value, plane.hovered ? 1 : 0, 6, delta);
      uniforms.uTime.value = time;
      uniforms.uVelocity.value.set(clamp(state.mouse.velocityX * width * .5 / 1000, -1, 1),
        clamp((state.mouse.velocityY * height * .5 + state.scroll.velocity * .3) / 1000, -1, 1));
    }
    return visible;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.removers.forEach(remove => remove());
    this.loaded.forEach(texture => texture.dispose());
    this.loaded.clear();
    this.textures.clear();
    this.planes.forEach(plane => plane.mesh.material.dispose());
    this.geometry.dispose();
    this.scene.clear();
    this.planes = [];
  }
}
