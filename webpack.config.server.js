const path = require('path');
module.exports = {
  mode: 'development',
  entry: {
    server: './src/server.ts',
    mserver: './src/m/main.ts',
    mindex: './src/m/index.ts',
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
        loader: 'ts-loader',
        options: {
          configFile: "tsconfig.node.json"
        },
        exclude: [/node_modules/],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
};
