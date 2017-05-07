#!/usr/bin/env node
const meow = require('meow');
const fs = require('fs');
const os = require('os');
const GIFEncoder = require('gifencoder');
const pngFileStream = require('png-file-stream');

const Converter = require('../src/converter');

// Utils
const pad5 = x => `00000${x}`.substr(-5);
const range = (n) => {
  let arr = [];
  for (let i = 0; i < n; i++) { arr.push(i); }
  return arr;
};

const cli = meow(`
  Usage
  $ glsl2gif <input>

  Options
    --out, -o     Output file name. Default: out.gif
    --rate, -r    Frames per second. Default: 15
    --length, -l  The length of GIF animation. Default: 1 (second)
    --size, -s    Specify image size in wxh format. Default: 600x600

  Examples
    $ glsl2gif foo.frag -s 720x540 -o image.gif
`, {
  alias: {
    o: 'out',
    r: 'rate',
    l: 'length',
    s: 'size',
  },
});

const file = cli.input[0];
if (!file) {
  cli.showHelp(1);
}

const out = cli.flags.out || 'out.gif';
const rate = cli.flags.rate || 15;
const length = cli.flags.length || 1.0;
const size = cli.flags.size || '600x600';
const [width, height] = size.match(/^\d+x\d+$/) ? size.split('x') : [600, 600]

const frames = rate * length;
const delay = 1.0 / rate;

// Create tmp directory
const tmp = require('tmp');
const rimraf = require('rimraf');
const tmpObj = tmp.dirSync();
const tmpDir = tmpObj.name;

// Render frames
let time = 0;
const files = range(frames).reduce((prev, i) => prev.then(() => {
  const c = new Converter(width, height, file, time);
  time += delay;
  return c.render(`${tmpDir}/frame${pad5(i)}.png`);
}), Promise.resolve());

// Convert PNG images to GIF
files.then(() => {
  const encoder = new GIFEncoder(width, height);
  const stream = pngFileStream(`${tmpDir}/frame*.png`)
    .pipe(encoder.createWriteStream({ repeat: 0, delay: delay * 1000, quality: 3 }))
    .pipe(fs.createWriteStream(out));

  stream.on('finish', () => {
    rimraf.sync(tmpDir);
  });
});
