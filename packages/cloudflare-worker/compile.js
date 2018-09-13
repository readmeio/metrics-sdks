const MemoryFS = require('memory-fs');
const webpack = require('webpack');

const path = require('path');

const config = require('./webpack.config');

const input = path.join(__dirname, '/template.js');
const output = path.join(__dirname, '/dist/main.js');

module.exports = async function compile(template) {
  const memoryFs = new MemoryFS();
  memoryFs.mkdirpSync(path.join(__dirname, 'dist'));

  memoryFs.mkdirpSync(__dirname);
  memoryFs.writeFileSync(input, template);

  const compiler = webpack(config);
  compiler.inputFileSystem = memoryFs;
  compiler.outputFileSystem = memoryFs;

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err);

      const compiled = memoryFs.readFileSync(output, 'utf8');

      memoryFs.unlinkSync(output, 'utf8')

      return resolve(compiled)
    });
  })
}
