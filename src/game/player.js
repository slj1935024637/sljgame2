class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpForce = 15;
        this.gravity = 0.5;
        this.health = 100;
        this.maxHealth = 100;
        this.game = game;
        this.isJumping = false;
        this.isGrounded = false;
        this.lastDirection = 1; // 1 for right, -1 for left
        this.weapon = true;
        
        // 攻击相关属性
        this.isAttacking = false;
        this.attackDuration = 300; // 近战攻击持续时间（毫秒）
        this.attackCooldown = 500; // 近战攻击冷却时间（毫秒）
        this.lastAttackTime = 0;
        this.attackDamage = 25;
        this.attackRange = 60; // 近战攻击范围
        
        // 远程攻击属性
        this.shootCooldown = 800; // 远程攻击冷却时间（毫秒）
        this.lastShootTime = 0;
        this.projectileSpeed = 10;
        this.projectileDamage = 15;
    }

    update(deltaTime) {
        // 更新位置
        this.x += this.velocityX;
        this.y += this.velocityY;

        // 应用重力
        this.velocityY += this.gravity;

        // 检查与地形的碰撞
        this.checkTerrainCollision();

        // 更新攻击状态
        if (this.isAttacking && Date.now() - this.lastAttackTime > this.attackDuration) {
            this.isAttacking = false;
        }
    }

    handleInput(keys) {
        // 左右移动（只使用方向键）
        if (keys['ArrowLeft']) {
            this.velocityX = -this.speed;
            this.lastDirection = -1;
        } else if (keys['ArrowRight']) {
            this.velocityX = this.speed;
            this.lastDirection = 1;
        } else {
            this.velocityX = 0;
        }

        // 跳跃（只用上方向键）
        if (keys['ArrowUp'] && this.isGrounded) {
            this.jump();
        }

        // 近战攻击（空格键）
        if (keys[' ']) {
            this.meleeAttack();
        }

        // 远程攻击（A键）
        if (keys['a']) {
            this.rangedAttack();
        }
    }

    meleeAttack() {
        const currentTime = Date.now();
        if (!this.isAttacking && currentTime - this.lastAttackTime > this.attackCooldown) {
            this.isAttacking = true;
            this.lastAttackTime = currentTime;

            // 检测攻击范围内的敌人
            if (this.game && this.game.enemies) {
                for (const enemy of this.game.enemies) {
                    const dx = (enemy.x + enemy.width/2) - (this.x + this.width/2);
                    const dy = (enemy.y + enemy.height/2) - (this.y + this.height/2);
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // 检查敌人是否在攻击范围内且在正确的方向
                    if (distance < this.attackRange && 
                        ((this.lastDirection === 1 && dx > 0) || 
                         (this.lastDirection === -1 && dx < 0))) {
                        enemy.takeDamage(this.attackDamage);
                        
                        // 添加击退效果
                        const knockbackForce = 8;
                        enemy.velocityX = this.lastDirection * knockbackForce;
                        enemy.velocityY = -4;
                    }
                }
            }
        }
    }

    rangedAttack() {
        const currentTime = Date.now();
        if (currentTime - this.lastShootTime > this.shootCooldown) {
            this.lastShootTime = currentTime;

            // 创建新的投射物
            if (this.game) {
                const projectile = new Projectile(
                    this.x + this.width/2,
                    this.y + this.height/2,
                    this.lastDirection * this.projectileSpeed,
                    -2, // 略微向上的初始速度
                    this.projectileDamage,
                    this.lastDirection === 1 ? 0 : Math.PI
                );

                // 添加到游戏中
                this.game.projectiles.push(projectile);
            }
        }
    }

    draw(ctx) {
        // 保存当前上下文状态
        ctx.save();

        // 计算动画和移动相关的值
        const bobAmount = Math.sin(Date.now() * 0.01) * 2;
        const walkCycle = Math.sin(Date.now() * 0.01) * 0.3;
        const direction = this.lastDirection;

        // 计算攻击动画
        let meleeAngle = 0;
        if (this.isAttacking) {
            const attackProgress = (Date.now() - this.lastAttackTime) / this.attackDuration;
            meleeAngle = Math.sin(attackProgress * Math.PI) * (direction === 1 ? -1 : 1);
        }

        // 绘制武器（在身体后面）
        if (this.weapon) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            // 根据攻击状态调整武器角度
            const weaponAngle = (direction === 1 ? -0.3 : -2.8) + 
                              Math.sin(Date.now() * 0.005) * 0.1 +
                              (this.isAttacking ? meleeAngle * 2 : 0);
            ctx.rotate(weaponAngle);
            
            // 如果正在攻击，添加武器轨迹效果
            if (this.isAttacking) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 30, -Math.PI/4, Math.PI/4, false);
                ctx.stroke();
            }
            
            ctx.fillStyle = '#8B4513';  // 武器颜色
            ctx.fillRect(-5, 0, 10, 30);  // 武器柄
            ctx.fillStyle = '#C0C0C0';  // 剑身颜色
            ctx.fillRect(-8, -20, 16, 25);  // 剑身
            ctx.restore();
        }

        // 绘制腿部
        const legSpread = Math.abs(walkCycle);
        ctx.fillStyle = '#4A90E2';  // 腿部颜色
        // 左腿
        ctx.fillRect(
            this.x + this.width/2 - 12 - (walkCycle * 5),
            this.y + this.height - 20 + Math.abs(walkCycle * 3),
            8,
            20 - Math.abs(walkCycle * 3)
        );
        // 右腿
        ctx.fillRect(
            this.x + this.width/2 + 4 + (walkCycle * 5),
            this.y + this.height - 20 + Math.abs(walkCycle * 3),
            8,
            20 - Math.abs(walkCycle * 3)
        );

        // 绘制身体
        ctx.fillStyle = '#3498DB';  // 身体颜色
        ctx.fillRect(this.x + this.width/2 - 15, this.y + 15, 30, 25);

        // 绘制手臂
        ctx.fillStyle = '#4A90E2';  // 手臂颜色
        // 左手
        ctx.save();
        ctx.translate(this.x + this.width/2 - 18, this.y + 20);
        ctx.rotate(-walkCycle * 0.5 + (this.isAttacking ? meleeAngle : 0));
        ctx.fillRect(0, 0, 8, 20);
        ctx.restore();
        // 右手
        ctx.save();
        ctx.translate(this.x + this.width/2 + 10, this.y + 20);
        ctx.rotate(walkCycle * 0.5 + (this.isAttacking ? meleeAngle : 0));
        ctx.fillRect(0, 0, 8, 20);
        ctx.restore();

        // 绘制头部
        ctx.fillStyle = '#FFD700';  // 头部颜色
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2,
            this.y + 15 + bobAmount,
            15,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 绘制眼睛
        const eyeOffsetX = direction === 1 ? 5 : -5;
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

        // 绘制瞳孔
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2 + eyeOffsetX + (direction === 1 ? 1 : -1),
            this.y + 12 + bobAmount,
            2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 如果正在攻击，绘制攻击范围指示器
        if (this.isAttacking) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#FF0000';
            const attackX = this.x + (direction === 1 ? this.width : -this.attackRange);
            ctx.fillRect(attackX, this.y, this.attackRange, this.height);
            ctx.restore();
        }

        // 绘制生命值条
        this.drawHealthBar(ctx);

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

    jump() {
        if (this.isGrounded) {
            this.velocityY = -this.jumpForce;
            this.isGrounded = false;
            this.isJumping = true;
        }
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
                    this.isJumping = false;
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

    shoot(targetX, targetY) {
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        const projectileSpeed = 10;
        const velocityX = Math.cos(angle) * projectileSpeed;
        const velocityY = Math.sin(angle) * projectileSpeed;
        
        this.game.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            width: 8,
            height: 8,
            velocityX: velocityX,
            velocityY: velocityY,
            damage: 20,
            update: function(deltaTime) {
                this.x += this.velocityX;
                this.y += this.velocityY;
            },
            draw: function(ctx) {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
    }
}
