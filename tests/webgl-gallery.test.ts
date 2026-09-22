import { describe, expect, it, vi } from 'vitest';
import { Texture } from 'three';
import { ImageGallery } from '../src/lib/webgl/gallery';

function image(src = '/image.webp') {
  return Object.assign(new EventTarget(), {
    currentSrc: src, src, naturalWidth: 800, naturalHeight: 500,
    getBoundingClientRect: vi.fn(() => ({ left: 100, top: 200, width: 400, height: 250 })),
    closest: () => null,
  }) as unknown as HTMLImageElement;
}

describe('DOM synchronized gallery', () => {
  it('converts normalized pointer velocity to bounded pixel-space UV response', async () => {
    const img = image();
    const gallery = new ImageGallery([img], async () => new Texture());
    await gallery.ready;
    gallery.measure(0);
    img.dispatchEvent(new Event('focusin'));
    gallery.update({ viewport: { width: 1000, height: 800 }, scroll: { y: 0, velocity: 0 }, mouse: { velocityX: 1, velocityY: -1 } }, 1 / 60, 1);
    const uniforms = (gallery.scene.children[0] as any).material.uniforms;
    expect(uniforms.uVelocity.value.x).toBe(.5);
    expect(uniforms.uVelocity.value.y).toBe(-.4);
    expect(uniforms.uHover.value).toBeGreaterThan(0);
    gallery.dispose();
  });
  it('disposes a late shared texture exactly once after navigation', async () => {
    let resolve!: (texture: Texture) => void;
    const gallery = new ImageGallery([image(), image()], () => new Promise<Texture>(done => { resolve = done; }));
    gallery.dispose();
    const texture = new Texture();
    const dispose = vi.spyOn(texture, 'dispose');
    resolve(texture);
    await gallery.ready;
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(gallery.scene.children).toHaveLength(0);
  });
  it('keeps failed texture loading nonfatal', async () => {
    const gallery = new ImageGallery([image()], async () => { throw new Error('network'); });
    await expect(gallery.ready).resolves.toBeUndefined();
    gallery.measure(0);
    expect(gallery.update({ viewport: { width: 1000, height: 800 }, scroll: { y: 0, velocity: 0 }, mouse: { velocityX: 0, velocityY: 0 } }, .016, 1)).toBe(0);
    gallery.dispose();
  });
  it('shares one texture per URL, caches bounds and leaves accessible DOM imagery intact', async () => {
    const texture = new Texture();
    const load = vi.fn(async () => texture);
    const images = [image(), image()];
    const gallery = new ImageGallery(images, load);
    await gallery.ready;
    gallery.measure(100);
    const state = { viewport: { width: 1000, height: 800 }, scroll: { y: 100, velocity: 0 }, mouse: { velocityX: 0, velocityY: 0 } };
    expect(gallery.update(state, 1 / 60, 1)).toBe(2);
    expect(gallery.update(state, 1 / 60, 2)).toBe(2);
    expect(load).toHaveBeenCalledTimes(1);
    images.forEach(img => expect(img.getBoundingClientRect).toHaveBeenCalledTimes(1));
    expect(gallery.scene.children[0].position.x).toBe(-200);
    const dispose = vi.spyOn(texture, 'dispose');
    gallery.dispose(); gallery.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(gallery.scene.children).toHaveLength(0);
  });
});
