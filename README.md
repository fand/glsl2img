# glsl2img

[![Build Status](http://img.shields.io/travis/fand/glsl2img.svg?style=flat-square)](https://travis-ci.org/fand/glsl2img)
[![NPM Version](https://img.shields.io/npm/v/glsl2img.svg?style=flat-square)](https://www.npmjs.com/package/glsl2img)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](http://fand.mit-license.org/)
[![Coverage Status](https://img.shields.io/coveralls/fand/glsl2img.svg?style=flat-square)](https://coveralls.io/github/fand/glsl2img?branch=master)

CLI tool to render fragment shaders into PNG images.  
Thanks to https://gist.github.com/bsergean/6780d7cc0cabb1b4d6c8.

## Install

```
npm install -g glsl2img
```

## Usage

This package includes 2 CLI commands: `glsl2png` and `glsl2gif`.


### glsl2png

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

### Examples

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

### glsl2gif

`glsl2gif -h` shows the help:

```
  Usage
  $ glsl2gif <input>

  Options
    --out, -o     Output file name. Default: out.gif
    --rate, -r    Frames per second. Default: 15
    --length, -l  The length of GIF animation. Default: 1 (second)
    --size, -s    Specify image size in wxh format. Default: 600x600

  Examples
    $ glsl2gif foo.frag -s 720x540 -o image.gif
```

### Examples

`glsl2gif metaball.frag -r 30 -l 3.0` gives following image.

![out.gif](https://cloud.githubusercontent.com/assets/1403842/25780683/218b9dfa-3367-11e7-85d6-6bd78d44bcd5.gif)

## Uniforms

[GLSL Sandbox](http://glslsandbox.com/) style `uniform` variables are available in fragment shaders.

```glsl
uniform float time;            // --time or the elapsed time from the first frame. Default: 0
uniform vec2 mouse;            // Always vec2(0) because there is no mouse in CLI
uniform vec2 resolution;       // Resolution of output image. Default: vec2(600.);
uniform sampler2D backBuffer;  // Rendered output in previous frame
```

## LICENSE

MIT
