/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

const Dotenv = require('dotenv-webpack');

module.exports = env => ({
  entry: './src/lib/index.ts',
  devtool: 'inline-source-map',
  mode: env.NODE_ENV,
  plugins: [
    new Dotenv({
      safe: true,
      allowEmptyValues: false,
      systemvars: true
    })
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        include: /node_modules/,
        test: /\.mjs$/,
        type: 'javascript/auto'
      },
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      fs: path.resolve(__dirname, 'src/lib/fs.ts'),
      child_process: path.resolve(__dirname, 'src/lib/child_process.ts'),
      http2: path.resolve(__dirname, 'src/lib/http2.ts'),
      '@aws-sdk/client-s3': path.resolve(__dirname, 'src/lib/aws.ts'),
      'mssql/package.json': path.resolve(__dirname, 'src/lib/mssql.ts'),
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
});
