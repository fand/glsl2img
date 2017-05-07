// Copied from https://gist.github.com/bsergean/6780d7cc0cabb1b4d6c8
const THREE = require('three');
const PNG = require('pngjs').PNG;
const gl = require("gl")();
const fs = require('fs');

class Converter {
  constructor (width = 600, height = 400) {
    this.width = width;
    this.height = height;

    this.scene = new THREE.Scene();
    this.createCamera();
    this.createTarget();
    this.createRenderer();
    this.createMaterial();

    // Create the mesh and add it to the scene
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cube = new THREE.Mesh(geometry, this.material);
    this.scene.add(cube);

    this.png = new PNG({ width: width, height: height });
  }

  createCamera () {
    const VIEW_ANGLE = 45;
    const NEAR = 0.1;
    const FAR  = 100;

    this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, this.width / this.height, NEAR, FAR);
    this.scene.add(this.camera);
    this.camera.position.set(0, 2, 2);
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
  }

  createRenderer () {
    // mock object, not used in our test case, might be problematic for some workflow
    const canvas = {
      getContext: () => gl,
    };
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      width: 0, // The width / height we set here doesn't matter
      height: 0,
      canvas: canvas,
      context: gl, // headless-gl context
    });
  }

  createMaterial () {
    const DEFAULT_VERTEX_SHADER = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `;
    const DEFAULT_FRAGMENT_SHADER = `
    uniform vec4 solidColor;
    void main() {
      gl_FragColor = solidColor;
    }
    `;
    const DEFAULT_UNIFORMS = {
      solidColor: { type: 'v4', value: new THREE.Vector4(0.0, 1.0, 1.0, 1.0) },
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader: DEFAULT_VERTEX_SHADER,
      fragmentShader: DEFAULT_FRAGMENT_SHADER,
      uniforms: DEFAULT_UNIFORMS,
    });
  }

  render (path = 'out.png') {
    this.renderer.render(this.scene, this.camera, this.rtTexture, true);

    const ctx = this.renderer.getContext();
    const pixels = new Uint8Array(4 * this.width * this.height);
    ctx.readPixels(0, 0, this.width, this.height, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);

    // lines are vertically flipped in the FBO / need to unflip them
    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width; i++) {
        const k = j * this.width + i;
        const r = pixels[4 * k + 0];
        const g = pixels[4 * k + 1];
        const b = pixels[4 * k + 2];
        const a = pixels[4 * k + 3];

        const m = (this.height - j - 1) * this.width + i;
        this.png.data[4 * m + 0] = r;
        this.png.data[4 * m + 1] = g;
        this.png.data[4 * m + 2] = b;
        this.png.data[4 * m + 3] = a;
      }
    }

    // Now write the png to disk
    const stream = fs.createWriteStream(path);
    this.png.pack().pipe(stream);

    stream.on('close', () => {
      console.log(`Image written: ${path}`);
    });
  }
}

module.exports = Converter;
