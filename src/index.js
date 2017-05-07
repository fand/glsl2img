const Converter = require('./converter');

module.exports = {
  Converter: Converter,
  convert: function (shader, width, height, output) {
    const c = new Converter(width, height);
    c.render(output);
  },
};
