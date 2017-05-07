// Copied from https://gist.github.com/bsergean/6780d7cc0cabb1b4d6c8
const THREE = require('three');
const PNG = require('pngjs').PNG;
const gl = require("gl")();
const fs = require('fs');

// Parameters (the missing one is the camera position, see below)
const width  = 600;
const height = 400;
const path = 'out.png';
const png = new PNG({ width: width, height: height });

// THREE.js business starts here
const scene = new THREE.Scene();

// camera attributes
const VIEW_ANGLE = 45;
const ASPECT = width / height;
const NEAR = 0.1;
const FAR  = 100;

// set up camera
const camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
scene.add(camera);
camera.position.set(0, 2, 2);
camera.lookAt(scene.position);

// mock object, not used in our test case, might be problematic for some workflow
const canvas = {
  getContext: () => gl,
};
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  width: 0, // The width / height we set here doesn't matter
  height: 0,
  canvas: canvas, // This parameter is usually not specified11
  context: gl, // Use the headless-gl context for drawing offscreen
});

const geometry = new THREE.BoxGeometry(1, 1, 1);

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
  solidColor: { type: "v4", value: new THREE.Vector4(0.0, 1.0, 1.0, 1.0) },
};

const material = new THREE.ShaderMaterial({
  vertexShader: DEFAULT_VERTEX_SHADER,
  fragmentShader: DEFAULT_FRAGMENT_SHADER,
  uniforms: DEFAULT_UNIFORMS,
});


// Create the mesh and add it to the scene
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Let's create a render target object where we'll be rendering
rtTexture = new THREE.WebGLRenderTarget(
  width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
  }
);

// render
renderer.render(scene, camera, rtTexture, true);

// read render texture into buffer
const ctx = renderer.getContext();

// create a pixel buffer of the correct size
const pixels = new Uint8Array(4 * width * height);

// read back in the pixel buffer
ctx.readPixels(0, 0, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);

// lines are vertically flipped in the FBO / need to unflip them
for (let j = 0; j < height; j++) {
  for (let i = 0; i < width; i++) {
    const k = j * width + i;
    const r = pixels[4 * k + 0];
    const g = pixels[4 * k + 1];
    const b = pixels[4 * k + 2];
    const a = pixels[4 * k + 3];

    const m = (height - j + 1) * width + i;
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
  // We're done !!
  console.log(`Image written: ${path}`);
});
