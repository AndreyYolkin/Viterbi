const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const babelLoader = {
  loader: 'babel-loader',
  options: {
    cacheDirectory: true,
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current',
          },
        },
      ]
    ],
    "plugins": [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-syntax-bigint"
    ]
  }
};

module.exports = [{
  name: 'client',
  mode: 'production',
  context: path.resolve(__dirname),
  entry: {
    index: './index.js',
    style: './style.js',
    reed: './src/Reed.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: "/node_modules/",
        loader: babelLoader,
      },
      {
        test: /\.pug$/,
        loader: "pug-loader",
        options: {
          pretty: true
        }
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: { sourceMap: true }
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: { sourceMap: true }
          },
          {
            loader: "postcss-loader",
            options: {
              sourceMap: true,
              config: { path: "src/js/postcss.config.js" }
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: false,
      template: "./index.pug",
      filename: "index.html",
      chunks: ["style", "index"],
      inject: "head"
    }),    
    new HtmlWebpackPlugin({
      hash: false,
      template: "./reed.pug",
      filename: "reed.html",
      chunks: ["style", "reed"],
      inject: "head"
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      "window.jQuery": "jquery",
      jQuery: "jquery"
    })
  ],
  target: 'web',
  node: {
    fs: 'empty'
  }
}]