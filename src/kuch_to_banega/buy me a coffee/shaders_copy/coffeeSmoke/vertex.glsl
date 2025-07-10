uniform sampler2D uperlintexture;
uniform float utime;

varying vec2 vuv;
vec2 rotate2D(vec2 value, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  mat2 m = mat2(c, s, -s, c);
  return m * value;
}
void main() {
  vec3 newpos = position;
  float twistperlin = texture(
    uperlintexture,
    vec2(0.5, uv.y * 0.2 - utime * 0.005)
  ).r;
  float angle = twistperlin * 10.0;
  newpos.xz = rotate2D(newpos.xz, angle);
  vec2 wind = vec2(
    texture(uperlintexture, vec2(0.25, utime * 0.01)).r - 0.5,
    texture(uperlintexture, vec2(0.75, utime * 0.01)).r - 0.5
  );
  newpos.xz += wind * pow(uv.y, 2.0) * 10.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newpos, 1.0);
  vuv = uv;
}
