import Player from '@/game/entities/Player.js'
import Enemy from '@/game/entities/Enemy.js'
import Projectile from '@/game/entities/Projectile.js'
import TerrainGenerator from '@/game/TerrainGenerator.js'

export default class GameEngine {
  constructor(canvas, store) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.store = store;
    
    this.width = canvas.width;
    this.height = canvas.height;
    this.running = false;
    this.lastTime = 0;

    // 游戏状态
    this.gameState = {
      score: 0,
      level: 1,
      gameOver: false,
      paused: false
    };

    this.init();
  }

  init() {
    // 初始化玩家
    this.player = new Player(this.width / 2, this.height - 100, this);
    
    // 初始化敌人系统
    this.enemies = [];
    this.projectiles = [];
    this.maxEnemies = 5;
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 5000;
    this.lastEnemySpawnTime = 0;

    // 设置事件监听
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (this.player) {
        this.player.handleKeyDown(e);
      }
      // 处理游戏状态按键
      if (e.key === 'p') {
        this.gameState.paused = !this.gameState.paused;
      }
      if (e.key === 'r' && this.gameState.gameOver) {
        this.restart();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.player) {
        this.player.handleKeyUp(e);
      }
    });
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.gameLoop();
    }
  }

  stop() {
    this.running = false;
    this.cleanup();
  }

  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  restart() {
    this.gameState = {
      score: 0,
      level: 1,
      gameOver: false,
      paused: false
    };
    this.init();
  }

  gameLoop(currentTime = performance.now()) {
    if (!this.running) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!this.gameState.paused && !this.gameState.gameOver) {
      this.update(deltaTime);
      this.draw();
    }

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(deltaTime) {
    // 更新玩家
    if (this.player) {
      this.player.update(deltaTime);
    }

    // 更新敌人
    this.enemies.forEach((enemy, index) => {
      enemy.update(deltaTime);
      if (enemy.health <= 0) {
        this.enemies.splice(index, 1);
        this.gameState.score += 100;
      }
    });

    // 生成新敌人
    this.spawnEnemies(deltaTime);

    // 更新投射物
    this.projectiles.forEach((projectile, index) => {
      projectile.update(deltaTime);
      if (projectile.shouldRemove) {
        this.projectiles.splice(index, 1);
      }
    });

    // 检测碰撞
    this.checkCollisions();
  }

  draw() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 绘制玩家
    if (this.player) {
      this.player.draw(this.ctx);
    }

    // 绘制敌人
    this.enemies.forEach(enemy => enemy.draw(this.ctx));

    // 绘制投射物
    this.projectiles.forEach(projectile => projectile.draw(this.ctx));

    // 绘制UI
    this.drawUI();
  }

  drawUI() {
    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 10, 30);
    this.ctx.fillText(`Level: ${this.gameState.level}`, 10, 60);

    if (this.gameState.paused) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = 'white';
      this.ctx.font = '48px Arial';
      this.ctx.fillText('PAUSED', this.width / 2 - 80, this.height / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Press P to Resume', this.width / 2 - 80, this.height / 2 + 40);
    }

    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = 'white';
      this.ctx.font = '48px Arial';
      this.ctx.fillText('Game Over', this.width / 2 - 100, this.height / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.width / 2 - 80, this.height / 2 + 40);
      this.ctx.fillText('Press R to Restart', this.width / 2 - 80, this.height / 2 + 80);
    }
  }

  spawnEnemies(deltaTime) {
    this.enemySpawnTimer += deltaTime;
    if (this.enemySpawnTimer >= this.enemySpawnInterval && this.enemies.length < this.maxEnemies) {
      const spawnX = Math.random() * (this.width - 64) + 32;
      const spawnY = Math.random() * (this.height - 64) + 32;
      this.enemies.push(new Enemy(spawnX, spawnY, this));
      this.enemySpawnTimer = 0;
    }
  }

  checkCollisions() {
    // 检查玩家与敌人的碰撞
    this.enemies.forEach(enemy => {
      if (this.player && this.checkCollision(this.player, enemy)) {
        this.player.takeDamage(10);
        if (this.player.health <= 0) {
          this.gameState.gameOver = true;
        }
      }
    });

    // 检查投射物与敌人的碰撞
    this.projectiles.forEach(projectile => {
      this.enemies.forEach(enemy => {
        if (this.checkCollision(projectile, enemy)) {
          enemy.takeDamage(projectile.damage);
          projectile.shouldRemove = true;
        }
      });
    });
  }

  checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }
}
