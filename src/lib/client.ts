import gsap from 'gsap';
import { initMotion } from './animation';
import { initExperienceGame } from './interaction/experience-game';

let cleanupPage: (() => void) | undefined;
let generation = 0;
let initializedRoot: HTMLElement | null = null;

async function initialize() {
  cleanupPage?.();
  const current = ++generation;
  const controller = new AbortController();
  const { signal } = controller;
  const preloader = document.querySelector<HTMLElement>('[data-preloader]');
  try {
    if (preloader && sessionStorage.getItem('portfolio-booted') === '1') preloader.classList.add('preloader-skip');
    sessionStorage.setItem('portfolio-booted', '1');
  } catch {
    // Storage can be unavailable in privacy-restricted contexts; CSS remains the fallback.
  }
  const dialog = document.querySelector<HTMLDialogElement>('#command-palette');
  const search = document.querySelector<HTMLInputElement>('#command-search');
  const commands = Array.from(document.querySelectorAll<HTMLElement>('[data-command]'));
  let previouslyFocused: HTMLElement | null = null;
  let motionCleanup: (() => void) | undefined;
  let experienceGameCleanup: (() => void) | undefined;
  const close = () => { dialog?.close(); previouslyFocused?.focus({ preventScroll: true }); };
  const open = () => {
    if (!dialog || !search) return;
    previouslyFocused = document.activeElement as HTMLElement;
    dialog.showModal(); search.value = ''; filter(); search.focus();
  };
  const filter = () => {
    const term = search?.value.toLowerCase().trim() || '';
    for (const item of commands) item.hidden = !(item.dataset.command || '').toLowerCase().includes(term);
    const empty = dialog?.querySelector<HTMLElement>('.palette-empty');
    if (empty) empty.hidden = commands.some(item => !item.hidden);
  };
  document.querySelectorAll('[data-open-palette]').forEach(el => el.addEventListener('click', open, {signal}));
  document.querySelector('[data-close-palette]')?.addEventListener('click', close, {signal});
  search?.addEventListener('input', filter, {signal});
  dialog?.addEventListener('click', e => { if(e.target === dialog) close(); }, {signal});
  dialog?.addEventListener('cancel', () => previouslyFocused?.focus({preventScroll:true}), {signal});
  for(const item of commands) item.addEventListener('click', () => dialog?.close(), {signal});
  let sequence = '';
  const dev = document.querySelector<HTMLElement>('#dev-panel');
  document.querySelector('[data-close-dev]')?.addEventListener('click', () => { if(dev) dev.hidden = true; }, {signal});
  document.addEventListener('keydown', e => {
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dialog?.open ? close() : open(); return; }
    if(dialog?.open && ['ArrowDown','ArrowUp','Enter'].includes(e.key)) {
      const visible = commands.filter(item => !item.hidden);
      if(!visible.length) return;
      const i = visible.indexOf(document.activeElement as HTMLElement);
      if(e.key === 'Enter' && document.activeElement === search) { e.preventDefault(); visible[0].click(); }
      else if(e.key !== 'Enter') { e.preventDefault(); visible[(i + (e.key==='ArrowDown'?1:-1) + visible.length)%visible.length].focus(); }
      return;
    }
    if((e.target as HTMLElement).matches('input,textarea,[contenteditable]')) return;
    if(e.key.length === 1) sequence = (sequence + e.key).slice(-4);
    if(sequence === '/dev' && dev) { dev.hidden = !dev.hidden; sequence = ''; }
  }, {signal});
  const toast = document.querySelector<HTMLElement>('#toast');
  document.querySelectorAll<HTMLElement>('[data-copy-email]').forEach(el => el.addEventListener('click', async() => {
    try { await navigator.clipboard.writeText(el.dataset.copyEmail || ''); if(toast) {toast.textContent = 'COPIED ✓'; gsap.killTweensOf(toast); gsap.timeline().to(toast,{opacity:1,y:0,duration:.2}).to(toast,{opacity:0,y:15,delay:1.8,duration:.2});} }
    catch { if(toast){toast.textContent = 'Copy unavailable — use the email link.'; gsap.to(toast,{opacity:1,duration:.2});} }
  }, {signal}));
  const observers: IntersectionObserver[] = [];
  const nav = new IntersectionObserver(entries => {
    for(const entry of entries) if(entry.isIntersecting) {
      document.documentElement.dataset.section = entry.target.id;
      document.querySelectorAll<HTMLElement>('[data-nav]').forEach(a => {
        if(a.dataset.nav === entry.target.id) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current');
      });
    }
  }, {rootMargin:'-20% 0px -45% 0px'});
  document.querySelectorAll('section[id]').forEach(el => nav.observe(el)); observers.push(nav);
  const tweens: gsap.core.Tween[] = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const loops = new Map<Element,gsap.core.Tween>();
  const labObserver = new IntersectionObserver(entries => {
    for(const entry of entries) {const loop=loops.get(entry.target); if(entry.isIntersecting && !document.hidden && !reduced.matches) loop?.play(); else loop?.pause();}
  }); observers.push(labObserver);
  for(const button of document.querySelectorAll<HTMLElement>('[data-experiment]')) {
    const art = button.querySelector<HTMLElement>('.experiment-art')!;
    const target = art.firstElementChild as HTMLElement;
    let variation = 0;
    if(!reduced.matches) {
      const tween = gsap.to(target, {rotation:'+=12',duration:6,yoyo:true,repeat:-1,ease:'sine.inOut',paused:true});
      loops.set(button,tween); tweens.push(tween);labObserver.observe(button);
    }
    button.addEventListener('click', () => {
      variation++;
      if(button.dataset.experiment==='reactor') gsap.to(target,{rotation:variation*55,scaleX:variation%2?1.15:1,scaleY:variation%2?1.15:1,duration:reduced.matches?0:.6});
      if(button.dataset.experiment==='type') gsap.to(target,{skewX:variation%2?-16:0,letterSpacing:variation%2?'.02em':'-.07em',duration:reduced.matches?0:.5});
      if(button.dataset.experiment==='signal') target.querySelectorAll('i').forEach((bar,i)=>gsap.to(bar,{height:30+((i*37+variation*53)%140),opacity:.35+((i+variation)%5)*.13,duration:reduced.matches?0:.4}));
      button.dataset.variation=String(variation);
    }, {signal});
  }
  const syncLoops = () => {for(const [el,loop] of loops){const r=el.getBoundingClientRect();if(!document.hidden && !reduced.matches && r.bottom>0 && r.top<innerHeight)loop.play();else loop.pause();}};
  document.addEventListener('visibilitychange',syncLoops,{signal});reduced.addEventListener('change',syncLoops,{signal});
  const diagnostic = window.setInterval(() => {
    if(!dev || dev.hidden) return;
    const pre = dev.querySelector('pre');
    if(pre) pre.textContent = `SYSTEM INSPECTOR\nViewport  ${innerWidth} × ${innerHeight}\nDPR       ${devicePixelRatio.toFixed(2)}\nRenderer  ${document.documentElement.dataset.webgl || 'static'}\nSection   ${document.documentElement.dataset.section || 'hero'}\nScroll    ${Math.round(scrollY)}px\nMotion    ${reduced.matches?'reduced':'full'}`;
  }, 500);
  experienceGameCleanup = initExperienceGame();
  cleanupPage = () => { controller.abort(); observers.forEach(o=>o.disconnect()); tweens.forEach(t=>t.kill());clearInterval(diagnostic);motionCleanup?.();experienceGameCleanup?.();gsap.killTweensOf(toast); };
  try { const cleanup = await initMotion(); if(current !== generation) cleanup(); else motionCleanup = cleanup; }
  catch(error) { console.warn('Enhanced motion unavailable; static content remains accessible.',error); }
}
function boot() {
  const root = document.querySelector<HTMLElement>('#main');
  if (!root || root === initializedRoot) return;
  initializedRoot = root;
  void initialize();
}

document.addEventListener('astro:page-load', boot);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
document.addEventListener('astro:before-swap', () => { generation++; initializedRoot = null; cleanupPage?.(); cleanupPage = undefined; });
