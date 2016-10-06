/**
 * Created by hackeris on 2016/10/6.
 */

require('shelljs/global');
var path = require('path');
var webpack = require('webpack');

var HtmlWebpackPlugin = require('html-webpack-plugin');

rm('./public/javascripts/room.*.*');

module.exports = {
  entry: {
    room: './front/room/main.js'
  },
  output: {
    path: path.resolve(__dirname, './public/javascripts/'),
    publicPath: '/public/javascripts/',
    filename: '[name].[hash].js',
    chunkFilename: '[id].chunk.[hash].js'
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
  module: {
    loaders: [
      {
        test: /\.vue$/,
        loader: 'vue'
      },
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        loader: 'json'
      },
      {
        test: /\.html$/,
        loader: 'vue-html'
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'url',
        query: {
          limit: 10000,
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.css$/,
        loader: 'style!css!autoprefixer'
      }
    ]
  },
  vue: {
    loaders: {
      css: 'style!css!autoprefixer'
    }
  },
  babel: {
    presets: ['es2015', 'stage-2'],
    plugins: ['transform-runtime'],
    comments: false
  },
  resolve: {
    extensions: ['', '.js', '.vue']
  },
  plugins: [
    new HtmlWebpackPlugin({ //根据模板插入css/js等生成最终HTML
      filename: path.join(__dirname, './views/room.ejs'), //生成的html存放路径，相对于path
      template: './front/room/index.html', //html模板路径
      inject: true,
      hash: true, //为静态资源生成hash值
      chunks: ['room'], //需要引入的chunk，不配置就会引入所有页面的资源
      minify: { //压缩HTML文件
        removeComments: true, //移除HTML中的注释
        collapseWhitespace: false //删除空白符与换行符
      }
    })
  ],
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  devtool: '#eval-source-map'
};

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map';
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.optimize.OccurenceOrderPlugin()
  ])
}

