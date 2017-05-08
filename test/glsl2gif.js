import test from 'ava';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';
import rimraf from 'rimraf';
import gifInfo from 'gif-info';

const cd = name => path.resolve(__dirname, name);

const buf2abuf = (buffer) => {
  const ab = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return ab;
}

const gif2info = (filepath) => {
  return gifInfo(buf2abuf(fs.readFileSync(filepath)));
}

test('glsl2gif', t => {
  const testDiff = (args, filepath, width, height, length, rate) => {
    execFileSync(cd('../bin/glsl2gif.js'), args);
    const info = gif2info(filepath);
    rimraf.sync(filepath);

    t.is(info.width, width);
    t.is(info.height, height);
    t.is(Math.round(info.duration / 1000), length);
    t.is(info.duration / length / info.images[0].delay, rate);
  };

  testDiff([cd('input.frag')], cd('../out.gif'), 600, 600, 1, 15);
  testDiff([cd('input.frag'), '-o', cd('out_path.gif')], cd('out_path.gif'), 600, 600, 1, 15);
  testDiff([cd('input.frag'), '-o', cd('out_size.gif'), '-s', '123x456'], cd('out_size.gif'), 123, 456, 1, 15);
  testDiff([cd('input.frag'), '-o', cd('out_length.gif'), '-l', '2'], cd('out_length.gif'), 600, 600, 2, 15);
  testDiff([cd('input.frag'), '-o', cd('out_rate.gif'), '-r', '20'], cd('out_rate.gif'), 600, 600, 1, 20);
});
