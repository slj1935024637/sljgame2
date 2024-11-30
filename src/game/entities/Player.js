export default class Player {
  constructor(x, y, game) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 5;
    this.jumpForce = 15;
    this.gravity = 0.5;
    this.health = 100;
    
    // Movement states
    this.isJumping = false;
    this.isGrounded = false;
    this.keys = {
      left: false,
      right: false,
      up: false,
      space: false,
      a: false
    };
    
    // Combat properties
    this.attackDamage = 25;
    this.attackRange = 60;
    this.attackDuration = 300;
    this.attackCooldown = 500;
    this.lastAttackTime = 0;
    this.isAttacking = false;
    
    // Ranged attack properties
    this.projectileDamage = 15;
    this.projectileSpeed = 15;
    this.shootCooldown = 800;
    this.lastShootTime = 0;
    
    // Animation properties
    this.lastDirection = 1; // 1 for right, -1 for left
    this.color = '#4CAF50'; // Player color
  }

  handleKeyDown(e) {
    switch(e.key.toLowerCase()) {
      case 'arrowleft':
      case 'a':
        this.keys.left = true;
        break;
      case 'arrowright':
      case 'd':
        this.keys.right = true;
        break;
      case 'arrowup':
      case 'w':
      case ' ':
        if (!this.keys.up && this.isGrounded) {
          this.keys.up = true;
          this.jump();
        }
        break;
      case 'j':
        this.meleeAttack();
        break;
      case 'k':
        this.rangedAttack();
        break;
    }
  }

  handleKeyUp(e) {
    switch(e.key.toLowerCase()) {
      case 'arrowleft':
      case 'a':
        this.keys.left = false;
        break;
      case 'arrowright':
      case 'd':
        this.keys.right = false;
        break;
      case 'arrowup':
      case 'w':
      case ' ':
        this.keys.up = false;
        break;
    }
  }

  update(deltaTime) {
    // 水平移动
    this.velocityX = 0;
    if (this.keys.left) {
      this.velocityX = -this.speed;
      this.lastDirection = -1;
    }
    if (this.keys.right) {
      this.velocityX = this.speed;
      this.lastDirection = 1;
    }

    // 应用重力
    if (!this.isGrounded) {
      this.velocityY += this.gravity;
    }

    // 更新位置
    this.x += this.velocityX;
    this.y += this.velocityY;

    // 边界检查
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
    if (this.y < 0) {
      this.y = 0;
      this.velocityY = 0;
    }
    if (this.y + this.height > this.game.height) {
      this.y = this.game.height - this.height;
      this.velocityY = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // 更新攻击状态
    if (this.isAttacking && Date.now() - this.lastAttackTime > this.attackDuration) {
      this.isAttacking = false;
    }
  }

  jump() {
    if (this.isGrounded) {
      this.velocityY = -this.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;
    }
  }

  meleeAttack() {
    const now = Date.now();
    if (now - this.lastAttackTime > this.attackCooldown) {
      this.isAttacking = true;
      this.lastAttackTime = now;
      
      // 检查攻击范围内的敌人
      this.game.enemies.forEach(enemy => {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.attackRange) {
          enemy.takeDamage(this.attackDamage);
        }
      });
    }
  }

  rangedAttack() {
    const now = Date.now();
    if (now - this.lastShootTime > this.shootCooldown) {
      this.lastShootTime = now;
      
      // 创建投射物
      const projectile = {
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        velocityX: this.projectileSpeed * this.lastDirection,
        damage: this.projectileDamage
      };
      
      this.game.projectiles.push(projectile);
    }
  }

  draw(ctx) {
    // 绘制玩家
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 绘制攻击范围（如果正在攻击）
    if (this.isAttacking) {
      ctx.strokeStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.attackRange,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // 绘制生命值条
    const healthBarWidth = 40;
    const healthBarHeight = 5;
    const healthPercentage = this.health / 100;
    
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(
      this.x - (healthBarWidth - this.width) / 2,
      this.y - 10,
      healthBarWidth,
      healthBarHeight
    );
    
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(
      this.x - (healthBarWidth - this.width) / 2,
      this.y - 10,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.game.gameState.gameOver = true;
    }
  }
}
