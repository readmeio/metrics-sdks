const path = require('path');

const webpack = require('webpack');

const { version } = require('./package.json');

const HOST = process.env.HOST;

module.exports = () => {
  if (!HOST) throw new Error('Must provide a host');

  return {
    entry: path.join(__dirname, '/src/template.js'),
    target: 'webworker',
    mode: process.env.NODE_ENV || 'production',
    optimization: {
      minimize: false,
    },
    plugins: [
      new webpack.DefinePlugin({
        VERSION: JSON.stringify(version),
      }),
      new webpack.DefinePlugin({
        HOST: JSON.stringify(HOST),
      }),
    ],
    resolve: {
      alias: {
        // Setting up an alias here allows us to keep the template
        // code tidy whilst allowing us to keep it inside of this repo
        '@readme/cloudflare-worker': path.resolve(__dirname, 'src/index.js'),
      },
    },
    output: {
      filename: 'index.js',
      path: path.join(__dirname, '/dist'),
    },
  };
};
