class Enemy {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.velocityX = 0;
        this.velocityY = 0;
        this.maxSpeed = 2;
        this.game = game;
        this.health = 100;
        this.maxHealth = 100;
        this.gravity = 0.5;
        this.isGrounded = false;
        this.target = null;  // 目标（通常是玩家）
        this.detectionRange = 300;  // 检测范围
        this.lastDirection = 1;  // 1 for right, -1 for left
        this.isHit = false;
        this.lastHitTime = 0;
        this.isDying = false;
        this.deathStartTime = 0;
    }

    update(deltaTime) {
        // 如果没有目标，将玩家设为目标
        if (!this.target && this.game.player) {
            this.target = this.game.player;
        }

        // 应用重力
        this.velocityY += this.gravity;

        // 如果有目标，尝试追踪
        if (this.target) {
            const distanceX = this.target.x - this.x;
            const distanceY = this.target.y - this.y;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            // 如果目标在检测范围内
            if (distance < this.detectionRange) {
                // 向目标移动
                if (distanceX > 0) {
                    this.velocityX = this.maxSpeed;
                    this.lastDirection = 1;
                } else {
                    this.velocityX = -this.maxSpeed;
                    this.lastDirection = -1;
                }
            } else {
                // 如果目标不在范围内，停止移动
                this.velocityX = 0;
            }
        }

        // 更新位置
        this.x += this.velocityX;
        this.y += this.velocityY;

        // 检查与地形的碰撞
        this.checkTerrainCollision();
    }

    draw(ctx) {
        // 保存上下文状态
        ctx.save();

        // 计算动画效果
        const bobAmount = Math.sin(Date.now() * 0.008) * 3;
        const walkCycle = Math.sin(Date.now() * 0.008) * 0.3;
        
        // 受伤闪烁效果
        if (this.isHit && Date.now() - this.lastHitTime < 200) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.1) * 0.5;
        }
        
        // 死亡效果
        if (this.isDying) {
            const deathProgress = (Date.now() - this.deathStartTime) / 500; // 500ms死亡动画
            ctx.globalAlpha = 1 - deathProgress;
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(deathProgress * Math.PI);
            ctx.translate(-this.x - this.width/2, -this.y - this.height/2);
        }

        // 绘制腿部
        ctx.fillStyle = '#8B0000';  // 深红色腿部
        // 左腿
        ctx.fillRect(
            this.x + this.width/2 - 12 - (walkCycle * 5),
            this.y + this.height - 15 + Math.abs(walkCycle * 3),
            8,
            15 - Math.abs(walkCycle * 3)
        );
        // 右腿
        ctx.fillRect(
            this.x + this.width/2 + 4 + (walkCycle * 5),
            this.y + this.height - 15 + Math.abs(walkCycle * 3),
            8,
            15 - Math.abs(walkCycle * 3)
        );

        // 绘制身体
        ctx.fillStyle = '#FF0000';  // 红色身体
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y + 10);
        ctx.quadraticCurveTo(
            this.x + this.width/2 + (this.lastDirection * 5),
            this.y + this.height/2,
            this.x + this.width/2,
            this.y + this.height - 15
        );
        ctx.quadraticCurveTo(
            this.x + this.width/2 - (this.lastDirection * 5),
            this.y + this.height/2,
            this.x + this.width/2,
            this.y + 10
        );
        ctx.fill();

        // 绘制手臂
        ctx.fillStyle = '#8B0000';  // 深红色手臂
        // 左手
        ctx.save();
        ctx.translate(this.x + this.width/2 - 15, this.y + 20);
        ctx.rotate(-walkCycle * 0.5);
        ctx.fillRect(0, 0, 6, 15);
        ctx.restore();
        // 右手
        ctx.save();
        ctx.translate(this.x + this.width/2 + 9, this.y + 20);
        ctx.rotate(walkCycle * 0.5);
        ctx.fillRect(0, 0, 6, 15);
        ctx.restore();

        // 绘制头部
        ctx.fillStyle = '#FF0000';  // 红色头部
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2,
            this.y + 15 + bobAmount,
            12,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 添加角
        ctx.fillStyle = '#8B0000';  // 深红色角
        // 左角
        ctx.save();
        ctx.translate(this.x + this.width/2 - 8, this.y + 10 + bobAmount);
        ctx.rotate(-Math.PI/4);
        ctx.fillRect(0, 0, 4, 10);
        ctx.restore();
        // 右角
        ctx.save();
        ctx.translate(this.x + this.width/2 + 8, this.y + 10 + bobAmount);
        ctx.rotate(Math.PI/4);
        ctx.fillRect(0, 0, 4, 10);
        ctx.restore();

        // 绘制眼睛
        const eyeOffsetX = this.lastDirection === 1 ? 5 : -5;
        // 眼白
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2 + eyeOffsetX,
            this.y + 12 + bobAmount,
            4,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 瞳孔（红色）
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2 + eyeOffsetX + (this.lastDirection === 1 ? 1 : -1),
            this.y + 12 + bobAmount,
            2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 绘制生命值条
        if (!this.isDying) {
            this.drawHealthBar(ctx);
        }

        // 恢复上下文状态
        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barWidth = 40;
        const barHeight = 5;
        const healthPercent = this.health / this.maxHealth;
        
        // 绘制背景
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(this.x - 4, this.y - 10, barWidth, barHeight);
        
        // 绘制当前生命值
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(this.x - 4, this.y - 10, barWidth * healthPercent, barHeight);
    }

    checkTerrainCollision() {
        this.isGrounded = false;
        
        for (const tile of this.game.terrain) {
            if (!tile.solid) continue;

            // 获取重叠区域
            const overlapX = Math.min(this.x + this.width, tile.x + this.game.tileSize) - 
                           Math.max(this.x, tile.x);
            const overlapY = Math.min(this.y + this.height, tile.y + this.game.tileSize) - 
                           Math.max(this.y, tile.y);

            // 检查是否有碰撞
            if (overlapX > 0 && overlapY > 0) {
                // 确定碰撞方向
                const fromTop = this.y + this.height - tile.y;
                const fromBottom = tile.y + this.game.tileSize - this.y;
                const fromLeft = this.x + this.width - tile.x;
                const fromRight = tile.x + this.game.tileSize - this.x;

                // 找出最小重叠方向
                const minOverlap = Math.min(fromTop, fromBottom, fromLeft, fromRight);

                if (minOverlap === fromTop && this.velocityY > 0) {
                    // 从上方碰撞
                    this.y = tile.y - this.height;
                    this.velocityY = 0;
                    this.isGrounded = true;
                } else if (minOverlap === fromBottom && this.velocityY < 0) {
                    // 从下方碰撞
                    this.y = tile.y + this.game.tileSize;
                    this.velocityY = 0;
                } else if (minOverlap === fromLeft && this.velocityX > 0) {
                    // 从左侧碰撞
                    this.x = tile.x - this.width;
                } else if (minOverlap === fromRight && this.velocityX < 0) {
                    // 从右侧碰撞
                    this.x = tile.x + this.game.tileSize;
                }
            }
        }
    }

    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        
        // 添加受伤效果
        this.lastHitTime = Date.now();
        this.isHit = true;
        
        // 如果死亡，设置标志
        if (this.health <= 0) {
            this.isDying = true;
            this.deathStartTime = Date.now();
        }
    }
}
