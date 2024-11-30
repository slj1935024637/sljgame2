<template>
  <div class="snake-game">
    <div class="game-header">
      <div class="score-container">
        <div class="score">
          <span class="label">分数</span>
          <span class="value">{{ score }}</span>
        </div>
        <div class="high-score">
          <span class="label">最高分</span>
          <span class="value">{{ highScore }}</span>
        </div>
      </div>
      <div class="controls-info">
        <div class="key">↑</div>
        <div class="key-row">
          <div class="key">←</div>
          <div class="key">↓</div>
          <div class="key">→</div>
        </div>
        <div class="key-label">方向键控制</div>
      </div>
    </div>
    
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    
    <div v-if="gameOver" class="game-over">
      <div class="game-over-content">
        <h2>游戏结束</h2>
        <div class="final-score">
          <span class="label">最终得分</span>
          <span class="value">{{ score }}</span>
        </div>
        <button @click="restartGame" class="restart-btn">
          <span class="btn-text">重新开始</span>
          <span class="btn-icon">↺</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'SnakeGame',
  setup() {
    const gameCanvas = ref(null)
    const canvasWidth = 600
    const canvasHeight = 400
    const gridSize = 20
    const score = ref(0)
    const highScore = ref(localStorage.getItem('snakeHighScore') || 0)
    const gameOver = ref(false)
    const particles = ref([])
    const gameStarted = ref(false)

    let ctx
    let snake = []
    let food = {}
    let direction = 'right'
    let nextDirection = 'right'
    let gameLoop
    let particleLoop

    const initGame = () => {
      // 初始化蛇
      snake = [
        { x: 6, y: 10 },
        { x: 5, y: 10 },
        { x: 4, y: 10 }
      ]
      
      // 生成第一个食物
      generateFood()
      
      // 重置游戏状态
      score.value = 0
      gameOver.value = false
      direction = 'right'
      nextDirection = 'right'
      particles.value = []
      gameStarted.value = true
      
      // 开始游戏循环
      if (gameLoop) clearInterval(gameLoop)
      if (particleLoop) clearInterval(particleLoop)
      
      gameLoop = setInterval(updateGame, 100)
      particleLoop = setInterval(updateParticles, 16)
    }

    const generateFood = () => {
      const maxX = Math.floor(canvasWidth / gridSize) - 1
      const maxY = Math.floor(canvasHeight / gridSize) - 1
      
      let newFood
      do {
        newFood = {
          x: Math.floor(Math.random() * maxX),
          y: Math.floor(Math.random() * maxY)
        }
      } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
      
      food = newFood
      
      // 生成食物出现特效
      createFoodEffect(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2)
    }

    const createFoodEffect = (x, y) => {
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 / 10) * i
        particles.value.push({
          x,
          y,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          life: 1,
          color: '#e74c3c',
          size: 3
        })
      }
    }

    const createSnakeEffect = (x, y) => {
      for (let i = 0; i < 5; i++) {
        particles.value.push({
          x: x + Math.random() * gridSize,
          y: y + Math.random() * gridSize,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 0.8,
          color: '#4cd137',
          size: 2
        })
      }
    }

    const updateParticles = () => {
      particles.value = particles.value.filter(particle => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= 0.02
        particle.size -= 0.05
        return particle.life > 0 && particle.size > 0
      })
    }

    const updateGame = () => {
      if (gameOver.value) return

      // 更新方向
      direction = nextDirection

      // 计算新的头部位置
      const head = { ...snake[0] }
      switch (direction) {
        case 'up':
          head.y--
          break
        case 'down':
          head.y++
          break
        case 'left':
          head.x--
          break
        case 'right':
          head.x++
          break
      }

      // 检查碰撞
      if (checkCollision(head)) {
        endGame()
        return
      }

      // 移动蛇
      snake.unshift(head)
      createSnakeEffect(head.x * gridSize, head.y * gridSize)

      // 检查是否吃到食物
      if (head.x === food.x && head.y === food.y) {
        score.value += 10
        if (score.value > highScore.value) {
          highScore.value = score.value
          localStorage.setItem('snakeHighScore', highScore.value)
        }
        generateFood()
      } else {
        snake.pop()
      }

      // 绘制游戏
      drawGame()
    }

    const drawGame = () => {
      if (!ctx) return

      // 绘制背景
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // 绘制网格
      drawGrid()

      // 绘制粒子
      particles.value.forEach(particle => {
        ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // 绘制蛇
      snake.forEach((segment, index) => {
        const x = segment.x * gridSize
        const y = segment.y * gridSize
        
        ctx.fillStyle = index === 0 ? '#4cd137' : '#20bf6b'
        ctx.shadowColor = '#4cd137'
        ctx.shadowBlur = 10
        
        roundRect(ctx, x, y, gridSize - 1, gridSize - 1, 4)
        ctx.fill()
        
        ctx.shadowBlur = 0
      })

      // 绘制食物
      const foodX = food.x * gridSize + gridSize/2
      const foodY = food.y * gridSize + gridSize/2
      const pulseSize = Math.sin(Date.now() / 200) * 2

      ctx.fillStyle = '#e74c3c'
      ctx.shadowColor = '#e74c3c'
      ctx.shadowBlur = 15
      
      // 绘制主体
      ctx.beginPath()
      ctx.arc(foodX, foodY, gridSize/3, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制光晕
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.arc(foodX, foodY, gridSize/3 + pulseSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1.0
      
      ctx.shadowBlur = 0
    }

    const drawGrid = () => {
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 0.5
      
      // 绘制垂直线
      for (let x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvasHeight)
        ctx.stroke()
      }
      
      // 绘制水平线
      for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvasWidth, y)
        ctx.stroke()
      }
    }

    const roundRect = (ctx, x, y, width, height, radius) => {
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
    }

    const checkCollision = (head) => {
      // 检查墙壁碰撞
      if (head.x < 0 || head.x >= canvasWidth / gridSize ||
          head.y < 0 || head.y >= canvasHeight / gridSize) {
        return true
      }

      // 检查自身碰撞
      return snake.some(segment => segment.x === head.x && segment.y === head.y)
    }

    const handleKeydown = (e) => {
      if (!gameStarted.value) {
        initGame()
        return
      }

      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'down') nextDirection = 'up'
          break
        case 'ArrowDown':
          if (direction !== 'up') nextDirection = 'down'
          break
        case 'ArrowLeft':
          if (direction !== 'right') nextDirection = 'left'
          break
        case 'ArrowRight':
          if (direction !== 'left') nextDirection = 'right'
          break
      }
    }

    const endGame = () => {
      gameOver.value = true
      gameStarted.value = false
      clearInterval(gameLoop)
      clearInterval(particleLoop)
      
      // 生成爆炸效果
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 4 + 2
        particles.value.push({
          x: snake[0].x * gridSize + gridSize/2,
          y: snake[0].y * gridSize + gridSize/2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: '#e74c3c',
          size: Math.random() * 4 + 2
        })
      }
    }

    const restartGame = () => {
      initGame()
    }

    onMounted(() => {
      ctx = gameCanvas.value.getContext('2d')
      window.addEventListener('keydown', handleKeydown)
      drawGame() // 绘制初始状态
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
      clearInterval(gameLoop)
      clearInterval(particleLoop)
    })

    return {
      gameCanvas,
      canvasWidth,
      canvasHeight,
      score,
      highScore,
      gameOver,
      gameStarted,
      restartGame
    }
  }
}
</script>

<style scoped>
.snake-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2c3e50 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.game-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 600px;
}

.score-container {
  display: flex;
  gap: 2rem;
}

.score, .high-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.label {
  font-size: 0.9rem;
  color: #95a5a6;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.value {
  font-size: 2rem;
  font-weight: bold;
  color: #ecf0f1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.controls-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.key-row {
  display: flex;
  gap: 0.5rem;
}

.key {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ecf0f1;
  font-size: 1.2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.key-label {
  color: #95a5a6;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

canvas {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.game-over {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-over-content {
  background: rgba(255, 255, 255, 0.1);
  padding: 3rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.game-over h2 {
  font-size: 2.5rem;
  color: #ecf0f1;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.final-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.restart-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(231, 76, 60, 0.4);
}

.btn-text {
  font-weight: bold;
  letter-spacing: 1px;
}

.btn-icon {
  font-size: 1.5rem;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.score.highlight {
  animation: pulse 0.3s ease;
}
</style>
