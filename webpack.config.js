const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  mode: 'development',
  entry: {
    app: './src/index',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  devtool: 'inline-source-map',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.css$/i,
        exclude: [/node_modules/],
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[path][local]--[hash:base64:5]',
                localIdentContext: path.resolve(__dirname, 'src'),
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        include: [/node_modules/],
        use: ['style-loader', 'css-loader'],
      },
      {
        test: [/\.tsx$/, /\.ts$/],
        use: 'ts-loader',
        exclude: [/node_modules/],
      },
      {
        test: /\.ttf$/,
        use: ['file-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
    }),
    new webpack.DefinePlugin({
      URL1: JSON.stringify(path.join(process.cwd(), 'c-test/hello.c')),
      URL2: JSON.stringify(path.join(process.cwd(), 'c-test/hello.h')),
    }),
  ],
};
