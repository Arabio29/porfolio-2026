export const imageVertex = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const imageFragment = /* glsl */`
uniform sampler2D uTexture;
uniform float uHover;
uniform float uTime;
uniform vec2 uVelocity;
uniform vec2 uCover;
varying vec2 vUv;
void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5;
  float envelope = sin(vUv.x * 3.14159265) * sin(vUv.y * 3.14159265);
  uv += sin(vUv.yx * 9.0 + uTime * 0.7) * uVelocity * 0.012 * envelope;
  vec4 image = texture2D(uTexture, clamp(uv, 0.002, 0.998));
  float gray = dot(image.rgb, vec3(0.2126,0.7152,0.0722));
  vec3 color = mix(vec3(gray), image.rgb, 0.22 + uHover * 0.78);
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453) - 0.5;
  gl_FragColor = vec4(color + grain * 0.012, image.a);
  #include <colorspace_fragment>
}`;
