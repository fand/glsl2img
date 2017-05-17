// Copied from https://gist.github.com/bsergean/6780d7cc0cabb1b4d6c8
const THREE = require('three');
const PNG = require('pngjs').PNG;
const gl = require('gl')();
const fs = require('fs');

// Utils
const pad5 = x => `00000${x}`.substr(-5);
const range = n => {
  let arr = [];
  for (let i = 0; i < n; i++) {
    arr.push(i);
  }
  return arr;
};

const DEFAULT_VERTEX_SHADER = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const DEFAULT_FRAGMENT_SHADER = `
uniform vec2 resolution;
uniform float time;
void main() {
  vec2 pos = gl_FragCoord.xy / resolution.xy;
  float d = distance(pos, vec2(0.5)) + sin(time) * 0.1;
  float c = 1.0 - smoothstep(0.5, 0.501, d);
  gl_FragColor = vec4(0.0, c, c, 1.0);
}
`;

class Converter {
  // eslint-disable-next-line max-params
  constructor (width = 600, height = 400, fsPath, time, rate, uniformsJson) {
    this.width = width;
    this.height = height;
    this.time = time;
    this.rate = rate;
    this.createUniforms(uniformsJson);

    this.scene = new THREE.Scene();
    this.createCamera();
    this.createTarget();
    this.fragmentShader = fs.readFileSync(fsPath, 'utf8');
    this.createRenderer();
    this.createPlane();
  }

  get aspect () {
    return this.width / this.height;
  }

  createUniforms (uniformsJson) {
    let uniforms = {};
    try {
      uniforms = JSON.parse(uniformsJson || '{}');
    } catch (e) {
      console.error('Failed to parse uniform option.');
    }

    const DEFAULT_UNIFORMS = {
      time: { type: 'f', value: +this.time || 0.0 },
      resolution: { type: 'v2', value: new THREE.Vector2(this.width, this.height) },
      mouse: { type: 'v2', value: new THREE.Vector2(this.width * 0.5, this.height * 0.5) },
      backBuffer: { type: 't', value: new THREE.Texture() },
    };

    this.uniforms = Object.assign(DEFAULT_UNIFORMS, uniforms);
  }

  createCamera () {
    this.camera = new THREE.OrthographicCamera(-this.aspect, this.aspect, 1, -1, 0.1, 10);
    this.scene.add(this.camera);
    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(this.scene.position);
  }

  createTarget () {
    // Let's create a render target object where we'll be rendering
    this.rtTexture = new THREE.WebGLRenderTarget(
      this.width,
      this.height,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
      }
    );

    // Create a target for backBuffer
    this.bufferTarget = new THREE.WebGLRenderTarget(
      this.width, this.height,
      { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat }
    );
  }

  createRenderer () {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      width: this.width, // The width / height we set here doesn't matter
      height: this.height,
      context: gl, // Mock context with headless-gl
      canvas: {
        getContext: () => gl,
      },
    });
  }

  createPlane () {
    const material = new THREE.ShaderMaterial({
      vertexShader: DEFAULT_VERTEX_SHADER,
      fragmentShader: this.fragmentShader || DEFAULT_FRAGMENT_SHADER,
      uniforms: this.uniforms,
    });

    const geometry = new THREE.PlaneGeometry(2 * this.aspect, 2);
    const plane = new THREE.Mesh(geometry, material);
    this.scene.add(plane);
  }

  getPixels () {
    const ctx = this.renderer.getContext();
    const pixels = new Uint8Array(4 * this.width * this.height);
    ctx.readPixels(0, 0, this.width, this.height, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);
    return pixels;
  }

  renderPixelsToPng (pixels, path) {
    const png = new PNG({ width: this.width, height: this.height });

    // Lines are vertically flipped in the FBO / need to unflip them
    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width; i++) {
        const k = j * this.width + i;
        const r = pixels[4 * k + 0];
        const g = pixels[4 * k + 1];
        const b = pixels[4 * k + 2];
        const a = pixels[4 * k + 3];

        const m = (this.height - j - 1) * this.width + i;
        png.data[4 * m + 0] = r;
        png.data[4 * m + 1] = g;
        png.data[4 * m + 2] = b;
        png.data[4 * m + 3] = a;
      }
    }

    // Now write the png to disk
    const stream = fs.createWriteStream(path);
    png.pack().pipe(stream);

    stream.on('close', () => {
      console.log(`Image written: ${path}`);
    });

    return new Promise((resolve, reject) => {
      stream.on('close', () => resolve(path));
      stream.on('errror', e => reject(e));
    });
  }

  render (path, length) {
    const delay = 1 / this.rate;

    // Prepare backBuffer for 0th frame.
    this.uniforms.time.value -= delay;
    this.renderer.render(this.scene, this.camera, this.bufferTarget, true);

    const frames = this.rate * length;
    const paths = length === 0 ? [path] : range(frames).map(i => `${path}/frame${pad5(i)}.png`);

    return paths.reduce((prev, p) => prev.then(() => {
      // Using DataTexture instead of passing target.texture to uniforms directly
      // because it didn't work in headless-gl...
      this.renderer.render(this.scene, this.camera, this.bufferTarget, true);
      const backBuffer = this.getPixels();
      const rampTex = new THREE.DataTexture(backBuffer, this.width, this.height, THREE.RGBAFormat);
      rampTex.needsUpdate = true;
      this.uniforms.backBuffer.value = rampTex;

      this.uniforms.time.value += delay;

      this.renderer.render(this.scene, this.camera, this.rtTexture, true);
      return this.renderPixelsToPng(this.getPixels(), p);
    }), Promise.resolve());
  }
}

module.exports = Converter;
