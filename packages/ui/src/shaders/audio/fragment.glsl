varying float vOffset;

void main() {

  vec3 color = mix(vec3(0., .0, 1), vec3(1, 0., 0.), vOffset);
  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}