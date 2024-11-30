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
        '@': path.resolve(__dirname, 'src')
      },
      extensions: ['.js', '.vue', '.json'],
      fallback: {
        path: false
      }
    },
    output: {
      filename: 'js/[name].[contenthash].js',
      chunkFilename: 'js/[name].[contenthash].js',
      assetModuleFilename: 'assets/[name].[contenthash][ext]'
    },
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
          gameEntities: {
            test: /[\\/]src[\\/]game[\\/]entities[\\/]/,
            name: 'game-entities',
            chunks: 'all',
            enforce: true,
            reuseExistingChunk: true
          },
          gameCore: {
            test: /[\\/]src[\\/]game[\\/](?!entities[\\/])/,
            name: 'game-core',
            chunks: 'all',
            enforce: true,
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
        .options({
          presets: ['@babel/preset-env']
        })
        .end()

    // 确保游戏实体模块被打包
    config.module
      .rule('game-entities')
      .test(/\.(js|vue)$/)
      .include
        .add(path.resolve(__dirname, 'src/game/entities'))
        .end()
      .use('babel-loader')
        .loader('babel-loader')
        .options({
          presets: ['@babel/preset-env']
        })
        .end()

    // 使用自定义模板
    config
      .plugin('html')
      .tap(args => {
        args[0].template = path.resolve(__dirname, 'public/index.template.html')
        args[0].inject = true
        args[0].minify = {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: false
        }
        args[0].scriptLoading = 'defer'
        // 移除任何可能的额外脚本
        delete args[0].scripts
        return args
      })
  }
})
