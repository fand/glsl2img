#!/usr/bin/env node
// Wrap Converter to disable Three.js's log messages.
const Converter = require('../src/converter');
const [width, height, file, time, rate, uniform, length, out] = process.argv.slice(2);
const c = new Converter(+width, +height, file, +time, +rate, uniform);
c.render(out, +length);
