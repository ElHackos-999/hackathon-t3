uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vWobble;
varying float vOffset;

void main()
{
//    float colorMix = smoothstep(- 1.0, 1.0, vWobble);
//    csm_DiffuseColor.rgb = mix(uColorA, uColorB, colorMix);

    float colorMix = smoothstep(- 1.0, 1.0, vOffset);
    csm_DiffuseColor.rgb = mix(uColorA, uColorB, colorMix);

    // // Mirror step
    // csm_Metalness = step(0.25, vWobble);
    // csm_Roughness = 1.0 - csm_Metalness;

    // Shinny tip
    csm_Roughness = 1.0 - colorMix;
}