export default class Projectile {
  constructor(x, y, angle, speed, damage, range) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.range = range;
    
    // 投射物属性
    this.width = 8;
    this.height = 8;
    this.distanceTraveled = 0;
    this.shouldRemove = false;
    
    // 计算速度分量
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    
    // 粒子效果
    this.particles = [];
    this.maxParticles = 10;
  }

  update(deltaTime) {
    if (this.shouldRemove) return;
    
    // 更新位置
    const moveX = this.velocityX * deltaTime / 1000;
    const moveY = this.velocityY * deltaTime / 1000;
    
    this.x += moveX;
    this.y += moveY;
    
    // 计算已移动距离
    this.distanceTraveled += Math.sqrt(moveX * moveX + moveY * moveY);
    
    // 检查是否超出射程
    if (this.distanceTraveled >= this.range) {
      this.shouldRemove = true;
    }
    
    // 更新粒子效果
    this.updateParticles(deltaTime);
  }

  updateParticles(deltaTime) {
    // 添加新粒子
    if (this.particles.length < this.maxParticles) {
      this.particles.push({
        x: this.x,
        y: this.y,
        life: 1,
        size: Math.random() * 3 + 1
      });
    }
    
    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= deltaTime / 500;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (this.shouldRemove) return;
    
    ctx.save();
    
    // 绘制粒子效果
    this.particles.forEach(particle => {
      ctx.fillStyle = `rgba(255, 200, 0, ${particle.life})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // 绘制投射物
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  checkCollision(enemy) {
    if (this.shouldRemove) return false;

    // 矩形碰撞检测
    const projectileLeft = this.x - this.width / 2;
    const projectileRight = this.x + this.width / 2;
    const projectileTop = this.y - this.height / 2;
    const projectileBottom = this.y + this.height / 2;

    const enemyLeft = enemy.x;
    const enemyRight = enemy.x + enemy.width;
    const enemyTop = enemy.y;
    const enemyBottom = enemy.y + enemy.height;

    return projectileLeft < enemyRight &&
           projectileRight > enemyLeft &&
           projectileTop < enemyBottom &&
           projectileBottom > enemyTop;
  }
}
