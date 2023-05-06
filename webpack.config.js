const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html"
    }),
  ],
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'window',
    clean: true,
  },
};