const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production'
    ? '/sljgame2/'
    : '/',
  outputDir: 'dist',
  transpileDependencies: true,
  lintOnSave: false,
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      extensions: ['.js', '.vue', '.json']
    },
    output: {
      filename: '[name].[hash].js',
      chunkFilename: '[name].[hash].js'
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            chunks: 'initial'
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: -20,
            chunks: 'initial',
            reuseExistingChunk: true
          }
        }
      }
    }
  },
  chainWebpack: config => {
    config.module
      .rule('js')
      .include
        .add(path.resolve(__dirname, 'src'))
        .end()
      .use('babel-loader')
        .loader('babel-loader')
        .end()
  }
})
