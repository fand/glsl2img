#ifdef GL_ES
precision mediump float;
#endif
#extension GL_OES_standard_derivatives : enable

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main (void) {
    vec2 position = gl_FragCoord.xy / resolution.xy;

    float d = sin(time) * 0.2;

    float dist1 = pow(max(1.0 - distance(position, vec2(0.5 + d, 0.5)) * 5.0, 0.0), 2.0);
    float dist2 = pow(max(1.0 - distance(position, vec2(0.5 - d, 0.5)) * 5.0, 0.0), 2.0);

    float c = smoothstep(0.3, 0.301, dist1 + dist2);
    gl_FragColor = vec4(c, 0, c, 1.0);
}
