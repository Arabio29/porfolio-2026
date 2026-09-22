export interface Project {
 slug: string; name: string; year: string; category: string; stack: string[]; image: string; alt: string;
 description: string; overview: string; problem: string; role: string; architecture: {name: string; detail: string}[];
 process: string[]; solution: string; challenges: string; results: string; screenshots: {src:string;alt:string;caption:string}[];
}
export const projects: Project[] = [{
 slug: 'the-living-system', name: 'The living system', year: 'In development', category: 'ENGINEERING × INTERACTION',
 stack: ['Astro', 'TypeScript', 'GSAP', 'Three.js', 'GLSL'], image: '/images/system-study.webp',
 alt: 'Original cobalt reactor study: segmented mechanical rings against a black field.',
 description: 'A portfolio that behaves like the systems it describes. You are inside the project.',
 overview: 'This portfolio is an exploration of how a static, content-first website can become an expressive interactive system without making its content depend on animation.',
 problem: 'Communicate full-stack engineering alongside creative development, without hiding the professional content behind a loading screen or turning navigation into a game.',
 role: 'Personal portfolio · engineering and creative development',
 architecture: [
 { name: 'CONTENT', detail: 'Typed data files → Astro pages → indexable HTML.' },
 { name: 'INPUT', detail: 'Pointer, scroll and viewport → one MotionManager.' },
 { name: 'EXPERIENCE', detail: 'GSAP / Lenis → DOM choreography. Three.js / GLSL → a shared WebGL renderer.' },
 { name: 'RESILIENCE', detail: 'Native navigation, reduced motion and static imagery remain independent of the graphics layer.' }
 ],
 process: ['Establish a legible editorial composition before adding movement.', 'Centralize scroll and pointer state so visual systems react consistently.', 'Introduce procedural geometry as a continuous narrative, not a downloaded ornament.', 'Exercise routes, input methods and fallbacks on the built site.'],
 solution: 'An Astro foundation renders the entire professional narrative as HTML. Animation modules progressively enhance it, while the reactor and image planes share a graphics layer. A calm case-study layout brings attention back to the decisions behind the work.',
 challenges: 'Maintaining continuity between DOM and WebGL coordinates, disposing graphics on navigation, and keeping the mobile composition independent of desktop-only interaction.',
 results: 'The implementation is the artifact. No traffic, conversion or performance results are claimed here; measured verification belongs in the repository test report.',
 screenshots: [ {src:'/images/system-study.webp',alt:'Procedural reactor visual study.',caption:'01 / Original visual study — not a client screenshot.'}, {src:'/images/system-detail.webp',alt:'Close-up of the segmented reactor structure.',caption:'02 / Structural detail — generated for this portfolio.'} ],
}];
