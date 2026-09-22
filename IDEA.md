Actúa simultáneamente como:

- Senior Creative Developer
- Senior Frontend Engineer
- Motion Designer
- WebGL / Three.js Developer
- UI/UX Designer
- Art Director
- Performance Engineer

Quiero que diseñes y desarrolles desde cero mi portfolio personal como Software Engineer.

NO quiero un portfolio tradicional.
NO quiero una landing page con Hero + About + Skills + Projects en tarjetas genéricas.
NO quiero un template de desarrollador.
NO quiero glassmorphism genérico, blobs flotantes, tarjetas flotantes sin propósito ni el típico modelo 3D de un laptop.

Quiero una experiencia digital memorable, experimental y extremadamente profesional.

REFERENCIAS DE CALIDAD E INTERACCIÓN:

https://www.stabondar.com/
https://www.hardikbhansali.com/

Analiza conceptualmente esas referencias, pero NO copies su diseño, layout, branding, contenido ni animaciones 1:1.

Quiero tomar de ellas los PRINCIPIOS:

- scroll como elemento narrativo
- WebGL integrado al diseño
- mouse interactions
- parallax
- kinetic typography
- shaders
- transiciones cinematográficas
- movimiento continuo
- elementos que reaccionan a la velocidad del mouse
- elementos que reaccionan a la velocidad del scroll
- profundidad
- física
- interacción 3D
- storytelling
- experiencia memorable
- transiciones fluidas entre páginas

La página en sí debe demostrar mis capacidades como desarrollador.

==================================================
01. OBJETIVO
==================================================

Crear un portfolio que cuando un recruiter, CTO, developer o cliente lo abra piense:

“Esta persona sabe construir software, pero además entiende interacción, UX, performance y experiencias web avanzadas.”

Mi perfil NO debe presentarse únicamente como Frontend Developer.

Preséntame principalmente como:

SOFTWARE ENGINEER
FULL-STACK DEVELOPER
CREATIVE DEVELOPER

Mi experiencia técnica incluye principalmente:

- C#
- .NET
- ASP.NET Core
- Blazor
- Angular
- TypeScript
- JavaScript
- REST APIs
- Swagger / OpenAPI
- SQL Server
- PostgreSQL
- Docker
- Nginx
- Git
- enterprise web applications
- frontend architecture
- backend integration
- reusable UI libraries
- code review
- performance
- application maintenance

También tengo experiencia/conocimientos con:

- React
- Next.js
- Node.js
- Python
- FastAPI
- Java
- Spring Boot

No inventes años, empresas, clientes, cifras, logros ni proyectos.

Centraliza TODO el contenido editable dentro de archivos como:

src/data/profile.ts
src/data/projects.ts
src/data/experience.ts
src/data/skills.ts
src/data/socials.ts

para poder modificar posteriormente todos mis datos fácilmente.

==================================================
02. STACK OBLIGATORIO
==================================================

Framework:
- Astro
- TypeScript
- Tailwind CSS

Motion:
- GSAP
- ScrollTrigger
- SplitText cuando tenga sentido
- GSAP Flip
- gsap.quickTo para interacciones continuas

Smooth scrolling:
- Lenis

3D:
- Three.js

Shaders:
- GLSL custom vertex/fragment shaders cuando aporten valor

Física:
- Matter.js solamente en secciones concretas

Opcional:
- MediaPipe para una experiencia experimental mediante webcam/hand tracking

No utilizar múltiples librerías haciendo lo mismo.

GSAP debe ser el sistema principal de animación del DOM.

Three.js debe utilizarse exclusivamente donde WebGL aporte profundidad o interacción real.

No utilizar React innecesariamente.

Astro debe seguir siendo la base de la aplicación.

Para transiciones entre páginas, priorizar las capacidades de navegación/View Transitions de Astro y construir encima de ellas las animaciones GSAP necesarias.

==================================================
03. CONCEPTO ARTÍSTICO
==================================================

Crear una identidad completamente original.

Concepto:

“THE SYSTEM IS ALIVE”

El portfolio debe sentirse como si el visitante estuviera entrando dentro de un sistema digital vivo.

No quiero estética hacker cliché.

No quiero Matrix.

No quiero terminal verde sobre fondo negro.

Quiero combinar:

- editorial design
- brutalismo refinado
- cinematic interfaces
- experimental typography
- engineering aesthetics
- WebGL
- high-end digital studio
- minimalismo cuando sea necesario
- momentos de caos controlado

Paleta sugerida:

background:
#080808

secondary background:
#111113

text:
#F1EFE9

secondary text:
#999999

primary accent:
electric blue / cobalt

Detalles ocasionales:
chrome / iridescent shaders

Crear variables CSS de diseño para poder modificar posteriormente el accent color.

La interfaz debe parecer diseñada por un estudio digital de alto nivel, no generada por IA.

==================================================
04. SISTEMA VISUAL GLOBAL
==================================================

Crear un sistema coherente de movimiento.

El mouse, scroll y navegación deben sentirse relacionados.

Implementar:

CUSTOM CURSOR

Desktop solamente.

Cursor minimalista que cambie contextualmente:

default:
pequeño punto

links:
círculo expandido

projects:
VIEW

drag elements:
DRAG

video:
PLAY

contact:
LET'S TALK

Debe tener interpolación suave y usar GSAP quickTo.

El cursor puede generar una leve influencia sobre shaders o elementos cercanos.

No reemplazar completamente el cursor en dispositivos táctiles.

--------------------------------------------------

MOUSE VELOCITY

Calcular:

velocityX
velocityY
normalized mouse position

Utilizar la velocidad para:

- deformar imágenes suavemente
- inclinar elementos
- desplazar partículas
- alterar shaders
- agregar skew temporal

NO exagerar.

--------------------------------------------------

SCROLL VELOCITY

Crear un pequeño Motion/ScrollManager global.

Calcular:

scroll position
scroll direction
scroll velocity
normalized progress

Las diferentes secciones pueden reaccionar a estos valores.

Ejemplo:

scroll rápido:
más distorsión

scroll lento:
interfaz estable

cuando el usuario se detiene:
los elementos regresan suavemente a reposo.

==================================================
05. PRELOADER
==================================================

Crear un preloader extremadamente corto.

NO usar simplemente:

0%
10%
20%
100%

Concepto:

“BOOTING EXPERIENCE”

Mostrar durante aproximadamente 1-2 segundos máximo cuando sea realmente necesario.

Visualizar pequeñas palabras:

INITIALIZING
RENDERER
MOTION
SYSTEM READY

Después:

un elemento visual atraviesa/corta la pantalla
y revela el Hero.

Si los assets ya están cacheados, evitar mostrar artificialmente un loader largo.

==================================================
06. HERO — PRIMER WOW MOMENT
==================================================

El Hero debe ocupar 100svh.

No utilizar un simple título centrado.

Crear gran composición tipográfica editorial.

Texto conceptual:

ELIASIB
SOFTWARE
ENGINEER

o utilizar el nombre configurado en profile.ts.

Agregar:

FULL-STACK / CREATIVE DEVELOPMENT
COLOMBIA → WORLDWIDE

La tipografía debe ocupar gran parte de la pantalla.

Crear entradas mediante:

- clip-path
- line masks
- SplitText
- slight perspective
- stagger
- scale
- opacity

Nada de simples fade-ins.

--------------------------------------------------

HERO WEBGL

Construir una escena Three.js propia.

NO utilizar un modelo aleatorio descargado.

Crear proceduralmente una representación abstracta de un:

“CODE REACTOR”

Puede estar formada por:

- puntos
- líneas
- nodos
- conexiones
- geometrías
- partículas
- anillos
- datos

Debe parecer una máquina/sistema digital abstracto.

En reposo tiene un movimiento extremadamente sutil.

El mouse debe influenciar:

camera position
rotation
particle displacement

pero utilizando interpolación.

El objeto NO debe seguir directamente el mouse.

Al hacer scroll:

la cámara comienza a acercarse al reactor.

Luego el reactor se descompone gradualmente en cientos/miles de partículas.

Esas partículas deben convertirse visualmente en la siguiente sección.

De esta manera NO hacemos:

Hero
[corte]
About

sino que conectamos las escenas.

==================================================
07. INTRO / MANIFESTO
==================================================

Crear una sección de storytelling.

Texto grande:

I BUILD SOFTWARE
THAT PEOPLE
CAN FEEL.

o equivalente.

Usar typography reveal basado en scroll.

Cada línea empieza casi invisible y gradualmente obtiene:

opacity
contrast
position

mientras atraviesa el viewport.

Crear pequeños textos complementarios describiendo:

ENGINEERING
INTERFACES
SYSTEMS
EXPERIENCES

El mouse debe generar una ligera separación/parallax entre capas.

Añadir un shader/noise muy sutil.

==================================================
08. EXPERIENCE
==================================================

NO utilizar timeline vertical típica.

Crear algo mucho más visual.

Concepto:

“DEPTH TIMELINE”

Mientras el usuario hace scroll, las experiencias profesionales aparecen como planos en profundidad.

La cámara/escena visual avanza sobre el eje Z.

Cada experiencia debe mostrar:

role
company
period
location
short description
technologies

pero mantener la información perfectamente legible como HTML.

NO renderizar todo el texto dentro de Canvas.

La escena 3D debe acompañar al HTML.

Por ejemplo:

2023
      ↓
2024
      ↓
2025
      ↓
NOW

Al avanzar:

los años anteriores quedan detrás,
el nuevo cargo toma protagonismo,
la tipografía cambia de escala,
elementos estructurales se desplazan.

La experiencia debe parecer un recorrido por mi carrera.

En MOBILE convertir esto en una excelente timeline editorial sin depender de WebGL.

==================================================
09. PROJECTS
==================================================

Esta debe ser una de las secciones más impresionantes.

NO utilizar cards normales.

Desktop:

crear una WEBGL PROJECT GALLERY.

Cada proyecto tendrá:

image
name
year
category
stack
short description

Las imágenes siguen existiendo en DOM para SEO/accesibilidad, pero pueden sincronizarse con planos WebGL.

Aplicar shaders de hover.

Por ejemplo:

idle:
slight grain / monochrome / reduced saturation

hover:
color reveal

mouse velocity:
UV displacement

click:
image expands smoothly hasta ocupar el viewport.

Utilizar GSAP Flip o una técnica equivalente para mantener continuidad visual.

Después navegar a:

/projects/[slug]

y hacer que la misma imagen continúe visualmente en el Hero del case study.

Quiero que parezca que NO ocurrió un page reload.

--------------------------------------------------

PARALLAX

Las imágenes de proyectos deben moverse ligeramente a velocidades distintas.

Utilizar valores pequeños.

NO marear al usuario.

--------------------------------------------------

HOVER

Cuando el mouse entra:

thumbnail ligeramente responde a la posición del cursor.

El título puede deformarse o desplazar caracteres.

Cursor:
VIEW PROJECT

==================================================
10. CASE STUDY
==================================================

Cada proyecto debe tener una página real:

/projects/project-name

Contenido:

Hero
overview
problem
role
technologies
architecture
process
solution
screenshots
challenges
results
next project

Crear transición Hero compartida.

Las páginas deben ser visualmente impresionantes pero MÁS calmadas que Home para permitir leer.

Incluir secciones sticky para explicar arquitectura cuando tenga sentido.

Ejemplo:

izquierda:
arquitectura / diagrama

derecha:
texto

El contenido debe venir de Astro Content Collections o data files.

==================================================
11. SKILLS — INTERACTIVE SYSTEM
==================================================

NO crear:

[JavaScript] [C#] [Angular] [React]

como simples badges.

Construir un sistema interactivo.

Concepto:

“MY DEVELOPMENT ECOSYSTEM”

Crear nodos agrupados:

BACKEND
FRONTEND
DATABASE
DEVOPS
TOOLS

Los nodos pueden estar conectados mediante líneas.

Mouse sobre C#:

expande:

C#
.NET
ASP.NET
EF Core

Mouse sobre frontend:

Angular
Blazor
React
TypeScript

El sistema debe responder al mouse con física muy leve.

Puede utilizar:

Three.js
o
Matter.js

dependiendo de cuál resulte más eficiente.

Mostrar siempre alternativa HTML accesible.

==================================================
12. PHYSICS MOMENT
==================================================

Utilizar Matter.js UNA sola vez.

Quiero un momento inesperado.

Por ejemplo texto:

TOOLS I USE
TO BUILD THINGS

Cuando el usuario cruza cierto punto:

algunas palabras del stack pierden su posición,
caen físicamente,
chocan,
rebotan.

El cursor puede empujarlas ligeramente.

Después, al continuar haciendo scroll:

las palabras regresan a sus posiciones y forman la siguiente composición.

Debe ser un momento breve.

No hacer física en todo el sitio.

==================================================
13. PLAYGROUND / LAB
==================================================

Agregar sección:

LAB

Aquí puedo añadir posteriormente experimentos personales.

Cards/experiments:

WebGL
AI
Three.js
creative coding
apps
open source

Crear una galería experimental horizontal.

El desplazamiento vertical controla temporalmente la composición horizontal.

Pero NO secuestrar el scroll.

Cada experimento puede tener pequeñas previews en tiempo real.

Pausarlas cuando estén fuera del viewport.

==================================================
14. ABOUT
==================================================

Esta sección debe sentirse más humana.

Después de tanta tecnología, reducir intensidad visual.

Gran fotografía opcional.

Texto editorial.

Usar una composición asimétrica.

Añadir pequeñas ventanas/tarjetas con:

location
interests
currently learning
favorite technologies

Las tarjetas pueden tener:

subtle drag
rotation
parallax

sin convertirlo en juguete.

==================================================
15. OPTIONAL SECRET EXPERIENCE
==================================================

Implementar como feature flag:

ENABLE_HAND_TRACKING=false

Cuando esté habilitado mostrar:

“ENTER EXPERIMENTAL MODE”

Solicitar permiso explícitamente antes de utilizar webcam.

Usar MediaPipe Hand Landmarker.

Gestos posibles:

mano abierta:
controlar orbit ligeramente

mover mano:
mover cámara

pinch:
activar elemento

NO iniciar webcam automáticamente.

Mostrar claramente cómo salir.

Este feature es experimental y no debe afectar la experiencia principal.

==================================================
16. CONTACT — FINAL WOW MOMENT
==================================================

Construir un final memorable.

Texto gigante:

LET'S
BUILD
SOMETHING.

El texto responde ligeramente al cursor.

Crear una escena WebGL final donde las partículas utilizadas desde el principio regresan y forman una figura/nombre/símbolo.

CTA:

START A CONVERSATION

Magnetic button.

Links:

Email
LinkedIn
GitHub
Resume

Al hacer click en email:

copiar email
mostrar feedback animado:

COPIED ✓

Agregar footer minimalista.

==================================================
17. PAGE TRANSITIONS
==================================================

Todas las rutas deben sentirse conectadas.

Implementar transiciones de navegación.

Home → Project:

la imagen seleccionada debe expandirse.

Project → Home:

reverse transition si es posible.

Other navigation:

usar:

clip path
mask
transform
shader

según contexto.

NO utilizar un simple fade universal.

Las transiciones deben durar aproximadamente:

600ms - 1200ms

Nunca hacer esperar al visitante innecesariamente.

==================================================
18. MICROINTERACTIONS
==================================================

Crear pequeños detalles por toda la interfaz:

magnetic buttons

underline follows cursor

hover character scramble ocasional

animated link arrows

dynamic cursor

image distortion

text masks

scroll indicators

section counters

animated coordinates

navigation progress

cursor labels

drag feedback

active navigation

Pero mantener elegancia.

No convertir cada texto en una animación.

==================================================
19. NAVIGATION
==================================================

Desktop:

minimal top navigation.

WORK
EXPERIENCE
ABOUT
CONTACT

Agregar:

CMD/CTRL + K

para abrir una command palette.

Opciones:

Go Home
Projects
Experience
About
Contact
GitHub
LinkedIn
Copy Email

Esto añade una interacción propia de desarrollador.

==================================================
20. EASTER EGGS
==================================================

Crear máximo 2.

Ejemplo:

escribir:

/dev

abre pequeño developer panel mostrando:

FPS
viewport
renderer
DPR
current section
scroll velocity

Otro posible easter egg:

Konami Code

activa temporalmente modo wireframe en la escena Three.js.

No añadir cosas infantiles.

Debe sentirse como creative coding.

==================================================
21. SOUND
==================================================

NO reproducir sonido automáticamente.

Si se implementa sonido:

mostrar control:

SOUND OFF

Puede activarse voluntariamente.

Utilizar pequeños UI sounds / ambience.

Nunca bloquear contenido por audio.

==================================================
22. MOBILE
==================================================

MOBILE NO PUEDE SER UNA VERSIÓN ROTA DEL DESKTOP.

Diseñar mobile específicamente.

En dispositivos táctiles:

- eliminar custom cursor
- reducir partículas
- reducir postprocessing
- reducir parallax
- eliminar hover-only interactions
- reemplazar physics compleja si es necesario
- desactivar gesture tracking
- controlar DPR
- mantener la composición editorial

Debe continuar viéndose premium.

==================================================
23. PERFORMANCE
==================================================

Esto es extremadamente importante.

El portfolio NO puede ser una demo bonita a 20 FPS.

Objetivo:

Desktop moderno:
~60 FPS durante animaciones.

Mobile medio:
experiencia fluida.

Implementar:

dynamic imports

lazy Three.js initialization cuando corresponda

IntersectionObserver

suspender render loops fuera de viewport

pause cuando document.hidden

single requestAnimationFrame architecture cuando sea posible

GSAP quickTo para mouse interactions

passive event listeners

DRACO/Meshopt para modelos

KTX2 cuando existan texturas grandes

AVIF/WebP para imágenes

clamp devicePixelRatio

desktop:
máximo ~2 DPR

mobile:
aproximadamente 1-1.5 según performance

no cargar texturas 4K innecesariamente

no crear múltiples WebGLRenderer simultáneos salvo necesidad real

reutilizar geometrías/materiales

dispose correctamente:

geometry
material
texture
render target

cuando corresponda.

Evitar layout thrashing.

No ejecutar getBoundingClientRect repetidamente durante cada frame.

Cachear medidas y actualizar en resize.

==================================================
24. ACCESSIBILITY
==================================================

Implementar:

semantic HTML

keyboard navigation

visible focus states

ARIA donde sea necesario

alt text

prefers-reduced-motion

prefers-reduced-transparency cuando sea razonable

reduced motion mode debe desactivar:

parallax fuerte
physics
camera travel
large transforms

manteniendo el contenido completo.

NO impedir scrolling normal.

NO depender exclusivamente del mouse.

==================================================
25. SEO
==================================================

Implementar:

title
description
canonical
OpenGraph
Twitter cards
JSON-LD Person
sitemap
robots.txt

Crear buenas metadata para cada proyecto.

Las páginas de proyectos deben ser indexables.

==================================================
26. ARQUITECTURA DEL CÓDIGO
==================================================

Utilizar aproximadamente:

src/
 ├── components/
 │   ├── common/
 │   ├── navigation/
 │   ├── sections/
 │   ├── projects/
 │   ├── motion/
 │   └── webgl/
 │
 ├── layouts/
 │
 ├── pages/
 │   ├── index.astro
 │   └── projects/
 │       └── [slug].astro
 │
 ├── data/
 │   ├── profile.ts
 │   ├── experience.ts
 │   ├── projects.ts
 │   ├── skills.ts
 │   └── socials.ts
 │
 ├── lib/
 │   ├── animation/
 │   │   ├── scroll.ts
 │   │   ├── cursor.ts
 │   │   ├── transitions.ts
 │   │   └── motion-manager.ts
 │   │
 │   ├── webgl/
 │   │   ├── renderer.ts
 │   │   ├── scene.ts
 │   │   ├── shaders/
 │   │   └── utils/
 │   │
 │   └── performance/
 │
 ├── styles/
 │
 └── content/

No crear archivos gigantes de 1000 líneas.

Separar:

rendering
animation
state
data
UI

Crear clases/utilities reutilizables donde tenga sentido.

==================================================
27. MOTION MANAGER
==================================================

Crear una arquitectura global que comparta:

mouse.x
mouse.y
mouse.velocityX
mouse.velocityY

scroll.y
scroll.velocity
scroll.direction
scroll.progress

viewport.width
viewport.height

isTouch
reducedMotion

Esto evita tener 30 event listeners independientes.

Utilizar un EventManager / MotionManager limpio.

==================================================
28. WEBGL MANAGER
==================================================

Crear un WebGLExperience central donde sea posible.

Separar:

Renderer
Camera
World
PostProcessing
Assets
Mouse
Time
Viewport

No introducir lógica Three.js directamente dentro de todos los componentes Astro.

==================================================
29. SHADERS
==================================================

Construir algunos shaders simples y originales.

Ejemplos permitidos:

UV distortion based on mouse velocity

chromatic aberration extremadamente ligera

noise displacement

image reveal

dither/grain

particle displacement

gradient/noise backgrounds

No poner glitch continuamente.

Los efectos agresivos deben aparecer durante transiciones o interacciones concretas.

==================================================
30. PRINCIPIO FUNDAMENTAL
==================================================

Cada sección debe responder a esta pregunta:

“¿Por qué se está moviendo esto?”

Si la única respuesta es:

“porque se ve cool”

simplificarlo.

El movimiento debe:

guiar atención,
explicar jerarquía,
crear profundidad,
conectar escenas,
responder al usuario,
o contar parte de la historia.

==================================================
31. NO HACER
==================================================

NO:
- copiar Stas Bondar
- copiar Hardik Bhansali
- usar templates
- usar cards genéricas para todo
- abusar glassmorphism
- abusar gradients
- usar íconos gigantes de tecnologías flotando
- usar un astronauta 3D
- usar laptop 3D
- usar robot 3D genérico
- usar partículas sin propósito por todo el sitio
- animar absolutamente todo
- hacer scroll-jacking
- esconder información importante
- sacrificar UX por animaciones
- sacrificar performance por 3D

==================================================
32. DESARROLLO POR FASES
==================================================

Trabaja en este orden.

FASE 1

Crear:

Astro
Tailwind
TypeScript
routing
data structure
SEO
responsive base

FASE 2

Construir todo el layout sin efectos.

Debe ser excelente incluso sin JavaScript.

FASE 3

Crear global motion system:

Lenis
GSAP
ScrollTrigger
cursor
mouse velocity
scroll velocity

FASE 4

Crear Hero Three.js.

FASE 5

Crear animations de cada sección.

FASE 6

Crear WebGL project gallery.

FASE 7

Crear project transitions y case studies.

FASE 8

Crear physics / experimental effects.

FASE 9

Performance optimization.

FASE 10

Accessibility + reduced motion.

FASE 11

Mobile-specific optimization.

FASE 12

Testing final.

==================================================
33. TESTING
==================================================

Después de construirlo:

ejecutar el proyecto.

Corregir:

TypeScript errors
console errors
GSAP warnings
hydration issues
broken routes
WebGL errors
mobile overflow
layout shifts

Verificar como mínimo:

Chrome desktop
Chrome mobile
Safari
Firefox

Revisar:

375px
430px
768px
1024px
1440px
1920px

Ejecutar Lighthouse.

Optimizar:

Performance
Accessibility
Best Practices
SEO

No considerar terminado el trabajo simplemente porque compile.

==================================================
34. RESULTADO ESPERADO
==================================================

Quiero que el resultado se sienta como:

50% software engineering portfolio
20% interactive experience
15% digital art
10% creative coding experiment
5% easter eggs

La información profesional sigue siendo lo más importante.

Pero el propio portfolio tiene que convertirse en uno de mis mejores proyectos.

Quiero que un visitante pueda entender en menos de 10 segundos:

QUIÉN SOY
QUÉ HAGO
QUÉ TECNOLOGÍAS MANEJO
QUÉ HE CONSTRUIDO

y después quedarse navegando porque la experiencia le parece extraordinaria.

El objetivo NO es simplemente:

“hacer una web con muchas animaciones”.

El objetivo es:

CONSTRUIR UNA EXPERIENCIA DIGITAL DE NIVEL AWWWARDS
QUE FUNCIONE COMO PORTFOLIO REAL DE UN SOFTWARE ENGINEER.

Comienza revisando la estructura actual del repositorio si existe.

Después crea un pequeño documento:

DESIGN_DIRECTION.md

explicando:

- concepto visual
- typography
- colors
- animation language
- WebGL approach
- architecture
- performance strategy

Después procede directamente con la implementación.

No te detengas únicamente en una propuesta o wireframe.

IMPLEMENTA el portfolio.
