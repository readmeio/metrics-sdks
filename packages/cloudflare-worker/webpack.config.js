const webpack = require('webpack');
const { version } = require('./package.json');

module.exports = {
  entry: './template.js',
  target: 'webworker',
  // Always either production|development
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(version),
    }),
  ],
  output: {
    filename: 'main.js',
    path: __dirname + '/dist',
  },
  // optimization: {
  //   // We no not want to minimize our code.
  //   minimize: false
  // },
};
