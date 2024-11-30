<template>
  <canvas id="gameCanvas" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import GameEngine from '@/game/GameEngine'

const width = ref(800)
const height = ref(600)
const store = useStore()
let gameEngine = null

onMounted(() => {
  const canvas = document.getElementById('gameCanvas')
  const ctx = canvas.getContext('2d')
  gameEngine = new GameEngine(canvas, ctx, store)
  gameEngine.init()
  gameEngine.start()
})

onUnmounted(() => {
  if (gameEngine) {
    gameEngine.stop()
  }
})
</script>

<style scoped>
canvas {
  border: 1px solid #333;
  background: #111;
}
</style>
