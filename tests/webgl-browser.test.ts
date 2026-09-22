import { expect, it } from 'vitest';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

/** Opt-in real GLSL smoke test: WEBGL_BROWSER=1 npx vitest run tests/webgl-browser.test.ts */
it.runIf(process.env.WEBGL_BROWSER === '1')('renders real reactor and image shaders, then preserves DOM on context loss', async () => {
  const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#2957ff"/><circle cx="400" cy="250" r="150" fill="#f1efe9"/></svg>');
  const html = `<!doctype html><html><head><link rel="icon" href="data:,"><title>WebGL isolated verification</title></head>
    <body style="margin:0;background:#080808"><canvas id="webgl-canvas"></canvas>
    <section id="hero" style="height:900px"></section><section id="manifesto" style="height:900px"></section>
    <section style="height:900px;padding:40px"><a href="#contact"><img data-webgl-image alt="Shader verification artwork" src="${image}" style="width:600px;height:375px"></a></section>
    <section id="contact" style="height:900px"></section>
    <script type="module">
      import { initWebGL } from '/src/lib/webgl/experience.ts';
      const state = {reducedMotion:false,isTouch:false,viewport:{width:innerWidth,height:innerHeight},
        scroll:{y:0,velocity:0,direction:0,progress:0},mouse:{x:0,y:0,velocityX:0,velocityY:0}};
      let frame = () => {};
      window.motion = state;
      window.renderFrame = (time=1) => frame(time,1/60);
      window.cleanup = await initWebGL({state,onFrame:cb=>{frame=cb;return()=>{frame=()=>{}}}});
      window.initialized = true;
    </script></body></html>`;
  const server = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 0 },
    plugins: [{ name: 'webgl-verification', configureServer(vite) {
      vite.middlewares.use('/__webgl-verification', (_req, res) => {
        res.setHeader('Content-Type', 'text/html'); res.end(html);
      });
    } }],
  });
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === 'string') throw new Error('No verification port');
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`http://127.0.0.1:${address.port}/__webgl-verification`);
    await page.waitForFunction(() => (window as any).initialized);
    const sample = () => page.evaluate(() => {
      (window as any).renderFrame();
      const canvas = document.querySelector('canvas')!;
      const gl = canvas.getContext('webgl2')!;
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let painted = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) painted++;
      return { painted, status: document.documentElement.dataset.webgl };
    });
    const hero = await sample();
    expect(hero.status).toBe('ready');
    expect(hero.painted).toBeGreaterThan(1000);
    await page.evaluate(() => {
      scrollTo(0, 1850); (window as any).motion.scroll.y = 1850;
      document.dispatchEvent(new Event('webgl:refresh'));
    });
    await page.waitForFunction(() => document.querySelector('img')!.complete);
    const gallery = await sample();
    expect(gallery.painted).toBeGreaterThan(10000);
    expect(errors).toEqual([]);
    await page.evaluate(() => document.querySelector('canvas')!.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
    await page.waitForFunction(() => document.documentElement.dataset.webgl === 'unavailable');
    expect(await page.locator('img').isVisible()).toBe(true);
    expect(await page.locator('img').getAttribute('alt')).toBe('Shader verification artwork');
    await page.evaluate(() => { (window as any).cleanup(); (window as any).cleanup(); });
    console.log(JSON.stringify({ heroPixels: hero.painted, galleryPixels: gallery.painted, shaderErrors: errors.length, contextLossFallback: true }));
  } finally {
    await browser.close();
    await server.close();
  }
}, 60000);
