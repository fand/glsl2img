#!/usr/bin/env node
const meow = require('meow');
const execFileSync = require('child_process').execFileSync;

const cli = meow(`
  Usage
  $ glsl2png <input>

  Options
    --out, -o      Output file name. Default: out.png
    --size, -s     Specify image size in wxh format. Default: 600x600
    --time, -t     Specify time to pass the shader as uniform. Default: 0
    --uniform, -u  Uniform values in JSON format. Default: '{}'

  Examples
    $ glsl2png foo.frag -s 720x540 -o image.png
`, {
  alias: {
    o: 'out',
    s: 'size',
    t: 'time',
    u: 'uniform',
    V: 'verbose',
  },
});

const file = cli.input[0];
if (!file) {
  cli.showHelp(1);
}

const out = cli.flags.out || 'out.png';
const size = cli.flags.size || '600x600';
const [width, height] = size.match(/^\d+x\d+$/) ? size.split('x') : [600, 600];
const time = cli.flags.time || 0;
const uniform = cli.flags.uniform || '{}';

execFileSync(
  `${__dirname}/wrapper.js`,
  [width, height, file, time, uniform, out],
  { stdio: cli.flags.verbose ? 'inherit' : 'ignore' }
);
