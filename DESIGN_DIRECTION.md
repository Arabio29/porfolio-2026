# THE SYSTEM IS ALIVE

## Concept
The portfolio is an editorial instrument for explaining software engineering. A visitor enters a live system: the name is the interface, the reactor is the underlying architecture, and the page progressively exposes the decisions between them. The site is intentionally not a dashboard, a startup landing page or a gallery of decorative cards.

The visual rhythm alternates between a deep graphite field and a warm paper chapter. Dark sections create focus and depth; the paper section makes technical practice feel tangible and readable. Every large motion has a narrative job: assemble identity, reveal intent, move through engineering layers, or return the system's energy to the closing invitation.

## Reference principles
Stas Bondar and Hardik Bhansali are treated as quality references, not visual sources. The work borrows the principles of scene-based scrolling, image continuity, typographic scale, controlled pointer response and cinematic pacing. It does not copy their composition, content, identity, assets or timing. The original language here is built around engineering diagrams, registration marks, cobalt signals and a procedural code reactor.

## Typography
- **Barlow Condensed** is the display voice: compressed, physical and architectural for identity lines, chapter titles and large statements.
- **Space Grotesk** is the reading voice: calm enough for case studies, navigation and professional context.
- **IBM Plex Mono** is the instrumentation layer: coordinates, stack labels, system status and technical annotations.

The type system uses extreme contrast deliberately. A 12vw display line can coexist with a 10px annotation because the latter behaves like a measurement, not competing content.

## Color and surface
The base palette is controlled by CSS variables so the accent can be changed without touching component code:

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#080808` | Main field |
| `--surface` | `#111113` | Work and navigation panels |
| `--paper` | `#E9E7E1` | Engineering practice chapter |
| `--ink` | `#F1EFE9` | Primary text |
| `--muted` | `#A6A6A6` | Secondary text |
| `--accent` | `#2957FF` | Cobalt interaction signal |
| `--accent-text` | `#9EB2FF` | Accessible accent text |

Grain, rules and cobalt are used as registration devices, not as a permanent glitch effect. Iridescence is reserved for the shader-generated reactor and project studies.

## Animation language
The motion vocabulary is **assemble / drift / resolve**:

- line masks and slight perspective assemble the identity;
- ScrollTrigger gives manifesto lines and depth planes a measured drift;
- `gsap.quickTo` makes pointer and magnetic responses continuous rather than event-based;
- Lenis smooths desktop wheel input without blocking native scrolling;
- Astro View Transitions preserve the feeling of one system across routes;
- reduced motion removes travel, physics and distortion while keeping the full hierarchy and content.

Mouse and scroll velocity are shared signals. The cursor, reactor particles and image displacement respond to the same input state, so the page feels coherent rather than like separate effects stacked together.

## WebGL approach
There is one lazy-loaded Three.js renderer. It contains a procedural code reactor made from instanced rings, structural struts and a deterministic particle field. The reactor subtly tracks the pointer, dissolves as the visitor leaves the hero and regroups near the contact scene. Project images remain authoritative DOM content for SEO and accessibility; a synchronized shader layer adds hover color, grain and velocity displacement when the browser can support it.

There are no downloaded models, no generic laptop, no permanent post-processing stack and no WebGL text. If the renderer fails, the editorial HTML still tells the entire story.

## Architecture
Astro owns static HTML, routing, metadata and View Transitions. Typed files in `src/data` own all editable portfolio content. Components own semantic structure; `src/lib/animation` owns GSAP, Lenis, cursor and physics; `src/lib/webgl` owns the renderer and shaders. `MotionManager` is the only global input scheduler and exposes mouse, scroll, viewport, touch and preference state.

The public profile now supplies verified identity, location, email, LinkedIn, website, YouTube and GitHub references. Employment history, dates, clients and metrics remain absent until supplied directly. Public repository work is described as personal/public work, never as client work or employment.

## Performance and resilience
- Dynamic-import WebGL and Matter.js only when enhancement is useful.
- Use one GSAP ticker and one renderer instead of independent animation loops.
- Cache layout rectangles and update them only on resize, font readiness or ScrollTrigger refresh.
- Clamp DPR and particle counts by device class; stop rendering when targets are outside the viewport or the document is hidden.
- Keep images local, vector or optimized and never make graphics a prerequisite for reading.
- Use native HTML interactions, keyboard focus, semantic headings, visible focus states, `aria-live` feedback and a full reduced-motion mode.
- Mobile uses native scrolling, no custom cursor, smaller particle budgets and an editorial timeline/list instead of desktop depth choreography.

## Release checklist
Run Astro build/check, unit tests, Playwright with its managed dev server, browser console/network QA, axe, six viewport widths and a production Lighthouse pass. Set `PUBLIC_SITE_URL` to the final owned domain before deployment. Résumé and employment history still require direct confirmation before publication. Hand tracking and sound remain explicit opt-in features and are disabled by default.
