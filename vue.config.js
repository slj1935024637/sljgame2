const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production'
    ? '/game_2/'
    : '/',
  outputDir: 'dist',
  transpileDependencies: true,
  lintOnSave: false
})
