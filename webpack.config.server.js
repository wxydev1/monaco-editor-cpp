const path = require('path');
module.exports = {
  mode: 'development',
  entry: {
    server: './src/server.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  devtool: 'source-map',
  target: 'node',
  module: {
    rules: [
      {
        test: [/\.tsx$/, /\.ts$/],
        use: 'ts-loader',
        exclude: [/node_modules/],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
};
