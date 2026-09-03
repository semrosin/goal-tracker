const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { merge } = require('webpack-merge');

const createCommonConfig = require('./webpack.common.cjs');

module.exports = merge(
  createCommonConfig({ isProduction: true, sourceMap: true }),
  {
    mode: 'production',
    devtool: 'source-map',
    output: {
      clean: true,
      filename: 'static/js/[name].[contenthash:8].js',
      chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
      }),
    ],
    optimization: {
      runtimeChunk: 'single',
      splitChunks: { chunks: 'all' },
      minimizer: ['...', new CssMinimizerPlugin()],
    },
  }
);
