#!/usr/bin/env node
const meow = require('meow');
const fs = require('fs');
const GIFEncoder = require('gifencoder');
const pngFileStream = require('png-file-stream');
const execa = require('execa');

const cli = meow(`
  Usage
  $ glsl2gif <input>

  Options
    --out, -o      Output file name. Default: out.gif
    --rate, -r     Frames per second. Default: 15
    --length, -l   The length of GIF animation. Default: 1 (second)
    --size, -s     Specify image size in wxh format. Default: 600x600
    --uniform, -u  Uniform values in JSON format. Default: '{}'

  Examples
    $ glsl2gif foo.frag -s 720x540 -o image.gif
`, {
  alias: {
    o: 'out',
    r: 'rate',
    l: 'length',
    s: 'size',
    u: 'uniform',
    V: 'verbose',
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
const [width, height] = size.match(/^\d+x\d+$/) ? size.split('x') : [600, 600];
const uniform = cli.flags.uniform || '{}';

const delay = 1.0 / rate;

// Create tmp directory
const tmp = require('tmp');
const rimraf = require('rimraf');
const tmpObj = tmp.dirSync();
const tmpDir = tmpObj.name;

// Render frames
let time = 0;
execa.sync(
  `${__dirname}/wrapper.js`,
  [width, height, file, time, rate, uniform, length, tmpDir],
  { stdio: cli.flags.verbose ? 'inherit' : 'ignore' }
);

// Convert PNG images to GIF
const encoder = new GIFEncoder(width, height);
const stream = pngFileStream(`${tmpDir}/frame*.png`)
  .pipe(encoder.createWriteStream({ repeat: 0, delay: delay * 1000, quality: 3 }))
  .pipe(fs.createWriteStream(out));

stream.on('finish', () => {
  rimraf.sync(tmpDir);
});
