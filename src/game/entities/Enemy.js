export default class Enemy {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.game = game;
    
    // 敌人属性
    this.width = 32;
    this.height = 32;
    this.speed = 2;
    this.health = 100;
    this.damage = 10;
    this.attackRange = 50;
    this.detectionRange = 200;
    
    // 移动相关
    this.direction = 1; // 1 for right, -1 for left
    this.movementTimer = 0;
    this.movementInterval = 2000; // Change direction every 2 seconds
    
    // 动画相关
    this.frameX = 0;
    this.frameY = 0;
    this.maxFrame = 3;
    this.frameTimer = 0;
    this.frameInterval = 100;
    
    // 状态
    this.isAttacking = false;
    this.isDead = false;
  }

  update(deltaTime) {
    if (this.isDead) return;

    // 更新动画帧
    this.frameTimer += deltaTime;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.frameX = (this.frameX + 1) % this.maxFrame;
    }

    // 检测玩家
    const player = this.game.player;
    if (player) {
      const distanceToPlayer = Math.sqrt(
        Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2)
      );

      if (distanceToPlayer <= this.detectionRange) {
        // 向玩家移动
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        
        // 设置朝向
        this.direction = dx > 0 ? 1 : -1;

        // 在攻击范围内则攻击
        if (distanceToPlayer <= this.attackRange) {
          this.attack(player);
        }
      } else {
        // 随机巡逻
        this.patrol(deltaTime);
      }
    }
  }

  patrol(deltaTime) {
    this.movementTimer += deltaTime;
    if (this.movementTimer >= this.movementInterval) {
      this.direction *= -1;
      this.movementTimer = 0;
    }
    
    this.x += this.speed * this.direction;
  }

  attack(player) {
    if (!this.isAttacking) {
      this.isAttacking = true;
      // 造成伤害
      player.takeDamage(this.damage);
      
      // 攻击冷却
      setTimeout(() => {
        this.isAttacking = false;
      }, 1000);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    // 可以在这里添加死亡动画或粒子效果
  }

  draw(ctx) {
    if (this.isDead) return;
    
    ctx.save();
    
    // 绘制敌人
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // 绘制血条
    const healthBarWidth = 32;
    const healthBarHeight = 5;
    const healthPercentage = this.health / 100;
    
    ctx.fillStyle = 'black';
    ctx.fillRect(
      this.x,
      this.y - 10,
      healthBarWidth,
      healthBarHeight
    );
    
    ctx.fillStyle = 'red';
    ctx.fillRect(
      this.x,
      this.y - 10,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );
    
    ctx.restore();
  }
}
