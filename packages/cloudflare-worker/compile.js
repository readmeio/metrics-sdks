const MemoryFS = require('memory-fs');
const webpack = require('webpack');

const path = require('path');

const config = require('./webpack.config');

const input = path.join(__dirname, '/template.js');
const output = path.join(__dirname, '/dist/main.js');

console.log(__dirname);

module.exports = async function compile(template) {
  const compiler = webpack(config);
  const memoryFs = new MemoryFS();
  // memoryFs.mkdirpSync(path.join(__dirname, 'dist'));

  compiler.inputFileSystem = memoryFs;
  compiler.outputFileSystem = memoryFs;

  memoryFs.mkdirpSync(__dirname);
  console.log(require('util').inspect(memoryFs, { depth: null }))
  memoryFs.writeFileSync(input, template);
  console.log(require('util').inspect(memoryFs, { depth: null }))

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err);
      // console.log(require('util').inspect(memoryFs, { depth: null }))

      const compiled = memoryFs.readFileSync(output, 'utf8');

      memoryFs.unlinkSync(output, 'utf8')

      return resolve(compiled)
    });
  })
}
