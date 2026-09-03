const path = require('node:path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const rootDirectory = path.resolve(__dirname, '..');

const createScssRule = ({ test, modules, isProduction, sourceMap }) => ({
  test,
  ...(modules ? {} : { exclude: /\.module\.s[ac]ss$/i }),
  sideEffects: !modules,
  use: [
    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
    {
      loader: 'css-loader',
      options: {
        sourceMap,
        importLoaders: 2,
        ...(modules
          ? {
              modules: {
                localIdentName: '[name]_[local]__[hash:base64:5]',
                namedExport: false,
              },
            }
          : {}),
      },
    },
    { loader: 'postcss-loader', options: { sourceMap } },
    { loader: 'sass-loader', options: { sourceMap } },
  ],
});

module.exports = ({ isProduction = false, sourceMap = false } = {}) => ({
  entry: path.resolve(rootDirectory, 'src/index.tsx'),
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },
  output: {
    path: path.resolve(rootDirectory, 'build'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        include: path.resolve(rootDirectory, 'src'),
        use: 'babel-loader',
      },
      createScssRule({
        test: /\.module\.s[ac]ss$/i,
        modules: true,
        isProduction,
        sourceMap,
      }),
      createScssRule({
        test: /\.s[ac]ss$/i,
        modules: false,
        isProduction,
        sourceMap,
      }),
      {
        test: /\.(bmp|gif|jpe?g|png|svg|webp|avif|ico|woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name].[contenthash:8][ext][query]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(rootDirectory, 'public/index.html'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(rootDirectory, 'public'),
          to: '.',
          globOptions: { ignore: ['**/index.html'] },
        },
      ],
    }),
    new ForkTsCheckerWebpackPlugin({ async: false }),
  ],
});
