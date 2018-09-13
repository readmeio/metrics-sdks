const webpack = require('webpack');
const { join } = require('path');
const config = require('../config');
const { version } = require('./package.json');

module.exports = {
  entry: join(__dirname, '/template.js'),
  target: 'webworker',
  // Always either production|development
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(version),
    }),
    new webpack.DefinePlugin({
      HOST: JSON.stringify(config.host),
    }),
  ],
  output: {
    filename: 'main.js',
    path: join(__dirname, '/dist'),
  },
  // optimization: {
  //   // We no not want to minimize our code.
  //   minimize: false
  // },
};
