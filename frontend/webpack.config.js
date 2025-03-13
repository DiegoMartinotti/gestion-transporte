const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      }
    ]
  },
  
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "url": false,
      "util": false,
      "stream": false,
      "http": false,
      "https": false,
      "zlib": false,
      "path": false,
      "fs": false,
      "net": false,
      "tls": false,
      "crypto": false,
      "process": false,
      "buffer": false,
    }
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'public', 'index.html'),
      filename: 'index.html',
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_API_URL': JSON.stringify('http://localhost:3001'),
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ],

  // Configuración del servidor de desarrollo
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/',
    },
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true,
    open: false,
    client: {
      overlay: true,
    },
    devMiddleware: {
      index: true,
      mimeTypes: { 'text/html': ['html'] },
      publicPath: '/',
      serverSideRender: true,
      writeToDisk: true,
    },
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3001',
        secure: false,
        changeOrigin: true,
        logLevel: 'debug',
      }
    ]
  },
}; 