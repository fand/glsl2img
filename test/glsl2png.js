import test from 'ava';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import rimraf from 'rimraf';

const cd = name => path.resolve(__dirname, name);

test('glsl2png', t => {
  const testDiff = (args, filepath) => {
    const basename = path.basename(filepath)

    execFileSync(cd('../bin/glsl2png.js'), args);

    const actual = PNG.sync.read(fs.readFileSync(filepath));
    const expected = PNG.sync.read(fs.readFileSync(cd(`fixtures/${basename}`)));
    const numDiffPixels = pixelmatch(actual, expected, actual.width, actual.height, {threshold: 0.1});

    t.is(numDiffPixels, 0);

    rimraf.sync(filepath);
  }

  testDiff([cd('input.frag')], cd('../out.png'));
  testDiff([cd('input.frag'), '-o', cd('out_path.png')], cd('out_path.png'));
  testDiff([cd('input.frag'), '-o', cd('out_size.png'), '-s', '123x456'], cd('out_size.png'));
  testDiff([cd('input.frag'), '-o', cd('out_time.png'), '-t', '1'], cd('out_time.png'));
});
