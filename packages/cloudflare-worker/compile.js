const MemoryFS = require('memory-fs');
const webpack = require('webpack');

const path = require('path');
const fs = require('fs');

const index = fs.readFileSync(path.join(__dirname, './index.js'), 'utf8');
const template = fs.readFileSync(path.join(__dirname, './template.js'), 'utf8');

const config = require('./webpack.config');

const input = path.join(__dirname, '/template.js');
const output = path.join(__dirname, '/dist/main.js');

module.exports = async function compile(host, apiKey) {
  const memoryFs = new MemoryFS();
  memoryFs.mkdirpSync(path.join(__dirname, 'dist'));

  memoryFs.mkdirpSync(__dirname);
  memoryFs.writeFileSync(input, template);
  memoryFs.writeFileSync(path.resolve(__dirname, 'index.js'), index);

  const compiler = webpack(config(null, { host, apiKey }));
  compiler.inputFileSystem = memoryFs;
  compiler.outputFileSystem = memoryFs;

  return new Promise((resolve, reject) => {
    compiler.run(err => {
      /* istanbul ignore if */
      if (err) return reject(err);

      const compiled = memoryFs.readFileSync(output, 'utf8');
      return resolve(compiled);
    });
  });
};
