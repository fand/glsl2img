#ifdef GL_ES
precision mediump float;
#define GLSLIFY 1
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D backBuffer;

float metaball (in vec2 position, in float t) {
    float d = pow(sin(t * 2.),  3.) * 0.5;
    float dist1 = 1.0 / distance(position, vec2(0.5 + d, 0.5));
    float dist2 = 1.0 / distance(position, vec2(0.5 - d, 0.5));
    float dist3 = 1.0 / distance(position, vec2(-0.5 + d, 0.5));
    float dist4 = 1.0 / distance(position, vec2(-0.5 - d, 0.5));
    float dist5 = 1.0 / distance(position, vec2(1.5 + d, 0.5));
    float dist6 = 1.0 / distance(position, vec2(1.5 - d, 0.5));
    return smoothstep(12.0, 12.001, dist1 + dist2 + dist3 + dist4 + dist5 + dist6);
}

void main (void) {
    vec2 position = gl_FragCoord.xy / resolution.xy;
    vec2 pos = fract(position * 4.);

    float step = floor(position.y * 4.);
    float t = time + step;

    float r = metaball(pos + vec2(cos(time * 3.), sin(time * 8.)) * 0.03, t);
    float g = metaball(pos + vec2(cos(time * 1.5), sin(time * 2.5)) * 0.03, t);
    float b = metaball(pos + vec2(sin(time * 3.), cos(time * 4.) + step * 0.03) * 0.03, t);

    vec4 rgb = vec4(r, g, b, 1.0);
    gl_FragColor = rgb + texture2D(backBuffer, position) * 0.5;
}
