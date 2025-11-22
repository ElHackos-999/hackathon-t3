uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vWobble;
varying float vOffset;

void main()
{
    float colorMix = smoothstep(- 1.0, 1.0, vOffset + vWobble);
    csm_DiffuseColor.rgb = mix(uColorA, uColorB, colorMix);

    // Mirror
    csm_Metalness = smoothstep(0.8, 1.0, vOffset);
    csm_Roughness = 1.0 - csm_Metalness;

    // Shinny
    csm_Roughness = 1.0 - colorMix;
}