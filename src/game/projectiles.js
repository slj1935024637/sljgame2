class Projectile {
    constructor(x, y, velocityX, velocityY, damage, angle = 0) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.damage = damage;
        this.angle = angle;
        this.width = 20;
        this.height = 6;
        this.gravity = 0.2;
        this.lifetime = 3000; // 3秒生命周期
        this.spawnTime = Date.now();
        this.active = true;
    }

    update(deltaTime) {
        if (!this.active) return;

        // 更新位置
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // 应用重力
        this.velocityY += this.gravity;

        // 更新角度以跟随运动方向
        this.angle = Math.atan2(this.velocityY, this.velocityX);

        // 检查生命周期
        if (Date.now() - this.spawnTime > this.lifetime) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        
        // 移动到箭的位置并旋转
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 绘制发光效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFD700';
        
        // 绘制箭身（金色）
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-this.width/2, 0);
        ctx.lineTo(-this.width/4, -this.height/2);
        ctx.lineTo(this.width/2, 0);
        ctx.lineTo(-this.width/4, this.height/2);
        ctx.closePath();
        ctx.fill();

        // 绘制箭尾
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(-this.width/2, 0);
        ctx.lineTo(-this.width/2 - 5, -this.height/2);
        ctx.lineTo(-this.width/2 - 2, 0);
        ctx.lineTo(-this.width/2 - 5, this.height/2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    checkCollision(enemy) {
        if (!this.active) return false;

        // 简单的矩形碰撞检测
        const projectileLeft = this.x - this.width/2;
        const projectileRight = this.x + this.width/2;
        const projectileTop = this.y - this.height/2;
        const projectileBottom = this.y + this.height/2;

        const enemyLeft = enemy.x;
        const enemyRight = enemy.x + enemy.width;
        const enemyTop = enemy.y;
        const enemyBottom = enemy.y + enemy.height;

        return projectileRight >= enemyLeft &&
               projectileLeft <= enemyRight &&
               projectileBottom >= enemyTop &&
               projectileTop <= enemyBottom;
    }
}
