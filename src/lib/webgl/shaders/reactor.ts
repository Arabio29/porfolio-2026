export const metalVertex = /* glsl */`
uniform float uDissolve;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocal;
void main() {
  vec3 p = position;
  vec3 n = normal;
  #ifdef USE_INSTANCING
    p = (instanceMatrix * vec4(p, 1.0)).xyz;
    n = mat3(instanceMatrix) * n;
  #endif
  vLocal = p;
  p += normalize(p + vec3(0.001)) * uDissolve * 0.75;
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  vNormal = normalize(normalMatrix * n);
  vView = -view.xyz;
  gl_Position = projectionMatrix * view;
}`;

export const metalFragment = /* glsl */`
uniform vec3 uColor;
uniform float uChrome;
uniform float uDissolve;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocal;
float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898,78.233,41.32))) * 43758.5453); }
void main() {
  if (hash(floor(vLocal * 32.0)) < uDissolve) discard;
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  vec3 light = normalize(vec3(-0.5, 0.85, 1.2));
  float diffuse = max(dot(n, light), 0.0);
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.8);
  float specular = pow(max(dot(n, normalize(light + v)), 0.0), 58.0);
  float band = smoothstep(0.5, 0.62, sin(n.y * 9.0 + n.x * 3.0) * 0.5 + 0.5);
  vec3 chrome = mix(vec3(0.045,0.06,0.085), vec3(0.85,0.89,0.97), band);
  vec3 color = mix(uColor * (0.28 + diffuse * 1.1), chrome * (0.35 + diffuse * 0.8), uChrome);
  color += vec3(0.30,0.44,1.0) * fresnel * 0.8 + specular * vec3(1.0);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const particleVertex = /* glsl */`
attribute vec3 aScatter;
attribute vec3 aSymbol;
attribute float aSeed;
uniform float uTime;
uniform float uDissolve;
uniform float uRegroup;
uniform float uDpr;
uniform float uVelocity;
varying float vAlpha;
varying float vSeed;
void main() {
  vec3 p = mix(position, aScatter, uDissolve);
  p = mix(p, aSymbol, uRegroup);
  float freeMotion = uDissolve * (1.0 - uRegroup);
  p.x += sin(uTime * 0.24 + aSeed * 24.0) * freeMotion * (0.12 + uVelocity * 0.08);
  p.y += cos(uTime * 0.21 + aSeed * 17.0) * freeMotion * 0.15;
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * view;
  gl_PointSize = clamp((1.5 + aSeed * 1.8) * uDpr * 7.0 / max(1.0, -view.z), 1.0, 6.0);
  vAlpha = mix(0.36, 0.85, max(uDissolve, uRegroup));
  vSeed = aSeed;
}`;

export const particleFragment = /* glsl */`
varying float vAlpha;
varying float vSeed;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float alpha = (1.0 - smoothstep(0.12, 0.5, d)) * vAlpha;
  gl_FragColor = vec4(mix(vec3(0.12,0.28,1.0),vec3(0.8,0.89,1.0),step(0.83,vSeed)), alpha);
  #include <colorspace_fragment>
}`;
