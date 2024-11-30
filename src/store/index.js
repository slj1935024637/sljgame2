import { createStore } from 'vuex'

export default createStore({
  state: {
    gameState: {
      player: {
        health: 100,
        position: { x: 0, y: 0 },
        inventory: []
      },
      enemies: [],
      projectiles: [],
      score: 0
    }
  },
  getters: {
    playerHealth: state => state.gameState.player.health,
    playerPosition: state => state.gameState.player.position,
    enemies: state => state.gameState.enemies,
    projectiles: state => state.gameState.projectiles,
    score: state => state.gameState.score
  },
  mutations: {
    UPDATE_PLAYER_HEALTH(state, health) {
      state.gameState.player.health = health
    },
    UPDATE_PLAYER_POSITION(state, position) {
      state.gameState.player.position = position
    },
    UPDATE_ENEMIES(state, enemies) {
      state.gameState.enemies = enemies
    },
    UPDATE_PROJECTILES(state, projectiles) {
      state.gameState.projectiles = projectiles
    },
    UPDATE_SCORE(state, score) {
      state.gameState.score = score
    }
  },
  actions: {
    updateGameState({ commit }, gameState) {
      commit('UPDATE_PLAYER_HEALTH', gameState.player.health)
      commit('UPDATE_PLAYER_POSITION', gameState.player.position)
      commit('UPDATE_ENEMIES', gameState.enemies)
      commit('UPDATE_PROJECTILES', gameState.projectiles)
      commit('UPDATE_SCORE', gameState.score)
    }
  }
})
