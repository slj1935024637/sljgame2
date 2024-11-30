<template>
  <div class="app">
    <div v-if="!gameSelected" class="game-menu">
      <h1>游戏选择</h1>
      <div class="menu-buttons">
        <button @click="selectGame(1)">冒险游戏</button>
        <button @click="selectGame(2)">贪吃蛇</button>
      </div>
    </div>
    <GameCanvas v-else-if="selectedGame === 1" />
    <SnakeGame v-else-if="selectedGame === 2" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import SnakeGame from './components/SnakeGame.vue'

const gameSelected = ref(false)
const selectedGame = ref(0)

const selectGame = (gameNumber) => {
  selectedGame.value = gameNumber
  gameSelected.value = true
}

</script>

<style>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2c3e50;
}

.game-menu {
  text-align: center;
  color: white;
}

.game-menu h1 {
  font-size: 3rem;
  margin-bottom: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.menu-buttons {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.menu-buttons button {
  padding: 1rem 2rem;
  font-size: 1.5rem;
  border: none;
  border-radius: 8px;
  background-color: #3498db;
  color: white;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.menu-buttons button:hover {
  transform: scale(1.1);
  background-color: #2980b9;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
