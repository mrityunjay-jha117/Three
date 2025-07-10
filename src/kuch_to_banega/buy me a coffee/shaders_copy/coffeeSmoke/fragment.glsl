uniform sampler2D uperlintexture;
uniform float utime;
varying vec2 vuv;
void main() {
  vec2 smokeuv = vuv;
  smokeuv.x *= 0.5;
  smokeuv.y *= 0.3;
  smokeuv.y -= utime * 0.03;

  float smoke = smoothstep(0.4, 1.0, texture(uperlintexture, smokeuv).r);
  smoke *= smoothstep(0.0, 0.1, vuv.x);
  smoke *= smoothstep(1.0, 0.9, vuv.x);
  smoke *= smoothstep(0.0, 0.1, vuv.y);
  smoke *= smoothstep(1.0, 0.4, vuv.y);

  gl_FragColor = vec4(0.6, 0.3, 0.2, smoke);
  // gl_FragColor = vec4(0.6,0.3,0.2,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
