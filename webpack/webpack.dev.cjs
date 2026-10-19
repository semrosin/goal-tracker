const { merge } = require('webpack-merge');
const createCommonConfig = require('./webpack.common.cjs');

module.exports = merge(createCommonConfig({ sourceMap: true }), {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  output: {
    filename: 'static/js/bundle.js',
    chunkFilename: 'static/js/[name].chunk.js',
  },
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    static: false,
    historyApiFallback: { disableDotRule: true, index: '/' },
    client: {
      // Match the page origin even when the server binds to a different host.
      webSocketURL: 'auto://0.0.0.0:0/ws',
      overlay: { errors: true, warnings: false },
    },
  },
});
