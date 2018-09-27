const webpack = require('webpack');
const { join, resolve } = require('path');
const { version } = require('./package.json');

module.exports = (env, { host }) => {
  if (!host) throw new Error('Must provide a host');

  return {
    entry: join(__dirname, '/template.js'),
    target: 'webworker',
    // Allow overriding env via `--env development`
    // or just default it to production
    mode: env || 'production',
    plugins: [
      new webpack.DefinePlugin({
        VERSION: JSON.stringify(version),
      }),
      new webpack.DefinePlugin({
        HOST: JSON.stringify(host),
      }),
    ],
    resolve: {
      alias: {
        // Setting up an alias here allows us to keep the template
        // code tidy whilst allowing us to keep it inside of this repo
        '@readme/cloudflare-worker': resolve(__dirname, 'index.js'),
      },
    },
    output: {
      filename: 'main.js',
      path: join(__dirname, '/dist'),
    },
  };
};
