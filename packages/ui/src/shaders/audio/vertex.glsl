uniform float uFrequencies[256];

varying float vOffset;

#include <skinning_pars_vertex>

void main() {
  #if defined(USE_SKINNING)
        #include <beginnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
    #endif
    #include <begin_vertex>
    #include <skinning_vertex>

  // position
  vec3 modelPosition = transformed; // model animation --> "transformed" instead of "position"

  float d = length(modelPosition);
  int i = int(mod(d * 0.5, 256.));

  float f = uFrequencies[i];
  float offset = f / 512.;
  offset += sin(f * 0.1) * 0.3;

  vOffset = offset;

  //  vec3 pos = position;
  //  pos.y += offset * 10. - 2.;

  // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);

  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(modelPosition, 1.0);
}