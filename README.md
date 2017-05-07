# glsl2img

CLI tool to render fragment shaders into PNG images.  
Thanks to https://gist.github.com/bsergean/6780d7cc0cabb1b4d6c8.

## Features

- [x] `glsl2png` command
- [ ] `glsl2gif` command
- [ ] Set uniforms via options

## Install

```
npm install -g glsl2img
```

## Usage

`glsl2png -h` shows the help:

```
  Usage
  $ glsl2png <input>

  Options
    --out, -o   Output file name. Default: out.png
    --size, -s  Specify image size in wxh format. Default: 600x600
    --time, -t  Specify time to pass the shader as uniform. Default: 0

  Examples
    $ glsl2png foo.frag -s 720x540 -o image.png
```

## Examples

Assume we have `metaball.frag` like this:

```
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main (void) {
    vec2 position = gl_FragCoord.xy / resolution.xy;

    float d = sin(time) * 0.2;

    float dist1 = pow(max(1.0 - distance(position, vec2(0.5 + d, 0.5)) * 5.0, 0.0), 2.0);
    float dist2 = pow(max(1.0 - distance(position, vec2(0.5 - d, 0.5)) * 5.0, 0.0), 2.0);

    float c = smoothstep(0.3, 0.301, dist1 + dist2);
    gl_FragColor = vec4(c, 0, c, 1.0);
}
```

then `glsl2png metaball.frag -o out.png` gives following image.

![out](https://cloud.githubusercontent.com/assets/1403842/25777407/30317b7c-3317-11e7-8dd1-b293f6a6091f.png)

We can also specify `time` value via `-t` option.  
Here is the result of `glsl2png metaball.frag -o out2.png -t 10`.

![out2](https://cloud.githubusercontent.com/assets/1403842/25777406/30301ef8-3317-11e7-8f76-af0f90154951.png)

## LICENSE

MIT
