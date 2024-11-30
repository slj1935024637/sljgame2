class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.setupCanvas();
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.tileSize = 32;

        // 游戏状态
        this.gameState = {
            score: 0,
            level: 1,
            gameOver: false,
            paused: false
        };

        // 初始化玩家
        this.player = new Player(100, 100, this);
        
        // 初始化敌人系统
        this.enemies = [];
        this.projectiles = [];
        this.maxEnemies = 5;  // 减少最大敌人数量
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 5000;  // 增加敌人生成间隔到5秒
        this.lastEnemySpawnTime = 0;  // 记录上次生成敌人的时间
        
        // 初始化地形
        this.terrain = [];
        
        // 相机系统
        this.camera = {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        };

        // 输入处理
        this.keys = {};
        this.setupInputHandlers();
        
        // 调试模式
        this.debug = false;
        
        // 生成初始地形
        this.generateInitialTerrain();
        
        // 开始游戏循环
        this.lastTime = 0;
        this.lastFrameTime = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
        
        // 新增：跟踪已生成的地形范围
        this.generatedTerrainStart = 0;
        this.generatedTerrainEnd = this.canvas.width * 3;
    }

    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            // 防止空格键滚动页面
            if (e.key === ' ') {
                e.preventDefault();
            }
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // 禁用右键菜单
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    spawnEnemy() {
        const currentTime = performance.now();
        if (currentTime - this.lastEnemySpawnTime < this.enemySpawnInterval) {
            return;
        }

        if (this.enemies.length >= this.maxEnemies) {
            return;
        }

        // 在玩家视野范围外，但不要太远的地方生成敌人
        const spawnDistance = this.canvas.width + 100; // 比屏幕宽度多一点
        const spawnX = this.player.x + (Math.random() > 0.5 ? spawnDistance : -spawnDistance);

        // 找到生成点的地面高度
        let groundY = this.canvas.height;
        for (const tile of this.terrain) {
            if (!tile.solid) continue;

            if (tile.x <= spawnX && 
                tile.x + this.tileSize > spawnX && 
                tile.y < groundY) {
                groundY = tile.y;
            }
        }

        // 在地面上方生成敌人
        if (groundY < this.canvas.height) {
            const enemy = new Enemy(spawnX, groundY - this.tileSize, this);
            this.enemies.push(enemy);
            this.lastEnemySpawnTime = currentTime;
        }
    }

    gameLoop(timestamp) {
        // 计算时间增量
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // 更新游戏状态
        this.update(deltaTime);
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 保存当前上下文状态
        this.ctx.save();
        
        // 应用摄像机变换
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制地形
        this.terrain.forEach(tile => {
            if (tile.x >= this.camera.x - this.tileSize && 
                tile.x <= this.camera.x + this.canvas.width + this.tileSize) {
                this.drawTile(tile);
            }
        });

        // 绘制玩家
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        // 绘制敌人
        this.enemies.forEach(enemy => {
            if (enemy.x >= this.camera.x - this.tileSize && 
                enemy.x <= this.camera.x + this.canvas.width + this.tileSize) {
                enemy.draw(this.ctx);
            }
        });
        
        // 绘制投射物
        this.projectiles.forEach(projectile => {
            if (projectile.x >= this.camera.x - this.tileSize && 
                projectile.x <= this.camera.x + this.canvas.width + this.tileSize) {
                projectile.draw(this.ctx);
            }
        });
        
        // 恢复上下文状态
        this.ctx.restore();

        // 继续游戏循环
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        if (this.gameOver) return;

        // 更新玩家
        this.player.handleInput(this.keys);
        this.player.update(deltaTime);

        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            
            // 如果敌人死亡且死亡动画播放完毕，移除敌人
            if (enemy.isDying && Date.now() - enemy.deathStartTime > 500) {
                this.enemies.splice(i, 1);
                continue;
            }
        }

        // 更新投射物
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);

            // 检查投射物碰撞
            for (const enemy of this.enemies) {
                if (projectile.checkCollision(enemy)) {
                    enemy.takeDamage(projectile.damage);
                    projectile.active = false;
                    break;
                }
            }

            // 移除非活动的投射物
            if (!projectile.active) {
                this.projectiles.splice(i, 1);
            }
        }

        // 移除死亡的敌人
        this.enemies = this.enemies.filter(enemy => enemy.health > 0);

        // 更新相机位置
        this.updateCamera();

        // 生成新敌人
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
    }

    drawBackground() {
        // 创建渐变背景
        const gradient = this.ctx.createLinearGradient(
            this.camera.x, 
            0, 
            this.camera.x, 
            this.canvas.height
        );
        gradient.addColorStop(0, '#87CEEB');  // 天空蓝
        gradient.addColorStop(1, '#B0E0E6');  // 粉蓝色

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.camera.x, 
            0, 
            this.canvas.width, 
            this.canvas.height
        );
    }

    drawTile(tile) {
        this.ctx.fillStyle = tile.type === 'ground' ? '#8B4513' : 
                            tile.type === 'platform' ? '#A0522D' : 
                            '#6B8E23';
        this.ctx.fillRect(tile.x, tile.y, this.tileSize, this.tileSize);
        
        // 添加简单的阴影效果
        if (tile.solid) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(tile.x, tile.y, this.tileSize, 2);
        }
    }

    updateCamera() {
        // 目标是将玩家保持在屏幕中心
        const targetX = this.player.x - this.canvas.width / 2;
        
        // 平滑过渡到目标位置
        this.camera.x += (targetX - this.camera.x) * 0.1;
        
        // 确保摄像机不会出现在负坐标
        this.camera.x = Math.max(0, this.camera.x);
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    updateTerrain() {
        // 根据玩家位置生成或移除地形
        const screenLeft = this.camera.x - this.tileSize;
        const screenRight = this.camera.x + this.canvas.width + this.tileSize;

        // 移除屏幕外的地形
        this.terrain = this.terrain.filter(tile => 
            tile.x >= screenLeft - this.canvas.width &&
            tile.x <= screenRight + this.canvas.width
        );
    }

    drawTerrain() {
        const screenLeft = this.camera.x;
        const screenRight = this.camera.x + this.canvas.width;

        // 添加简单的背景渐变
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');  // 天空蓝
        gradient.addColorStop(1, '#4A90E2');  // 深蓝色
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制远景云层
        this.drawClouds();

        for (const tile of this.terrain) {
            if (tile.x + this.tileSize >= screenLeft && tile.x <= screenRight) {
                // 根据地形类型设置样式和绘制方法
                switch(tile.type) {
                    case 'ground':
                        this.drawGroundTile(tile);
                        break;
                    case 'moving_platform':
                        this.drawMovingPlatform(tile);
                        break;
                    case 'destructible':
                        this.drawDestructibleBlock(tile);
                        break;
                    default:
                        if (tile.type.startsWith('decoration_')) {
                            this.drawDecoration(tile);
                        } else if (tile.type.startsWith('hazard_')) {
                            this.drawHazard(tile);
                        }
                }
            }
        }
    }

    drawGroundTile(tile) {
        this.ctx.fillStyle = '#3D3D3D';
        this.ctx.fillRect(
            tile.x - this.camera.x,
            tile.y - this.camera.y,
            this.tileSize,
            this.tileSize
        );

        // 添加简单的纹理
        this.ctx.strokeStyle = '#2D2D2D';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            tile.x - this.camera.x,
            tile.y - this.camera.y,
            this.tileSize,
            this.tileSize
        );
    }

    drawMovingPlatform(platform) {
        // 绘制平台本体
        this.ctx.fillStyle = '#4A90E2';
        this.ctx.fillRect(
            platform.x - this.camera.x,
            platform.y - this.camera.y,
            platform.width * this.tileSize,
            this.tileSize
        );

        // 添加平台光效
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            platform.x - this.camera.x,
            platform.y - this.camera.y,
            platform.width * this.tileSize,
            2
        );
    }

    drawDestructibleBlock(block) {
        // 根据血量改变颜色
        const healthPercent = block.health / 100;
        const red = Math.floor(255 * (1 - healthPercent));
        const green = Math.floor(255 * healthPercent);
        this.ctx.fillStyle = `rgb(${red}, ${green}, 0)`;

        this.ctx.fillRect(
            block.x - this.camera.x,
            block.y - this.camera.y,
            this.tileSize,
            this.tileSize
        );

        // 添加裂纹效果
        if (healthPercent < 0.5) {
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            const crackCount = Math.floor((1 - healthPercent) * 5);
            for (let i = 0; i < crackCount; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(
                    block.x - this.camera.x + Math.random() * this.tileSize,
                    block.y - this.camera.y
                );
                this.ctx.lineTo(
                    block.x - this.camera.x + Math.random() * this.tileSize,
                    block.y - this.camera.y + this.tileSize
                );
                this.ctx.stroke();
            }
        }
    }

    drawDecoration(decoration) {
        this.ctx.fillStyle = decoration.color;
        this.ctx.fillRect(
            decoration.x - this.camera.x,
            decoration.y - this.camera.y,
            decoration.width * this.tileSize,
            decoration.height * this.tileSize
        );
    }

    drawHazard(hazard) {
        this.ctx.fillStyle = hazard.color;
        
        if (hazard.type === 'hazard_spike') {
            // 绘制尖刺
            this.ctx.beginPath();
            this.ctx.moveTo(
                hazard.x - this.camera.x,
                hazard.y - this.camera.y + this.tileSize
            );
            this.ctx.lineTo(
                hazard.x - this.camera.x + this.tileSize / 2,
                hazard.y - this.camera.y
            );
            this.ctx.lineTo(
                hazard.x - this.camera.x + this.tileSize,
                hazard.y - this.camera.y + this.tileSize
            );
            this.ctx.fill();
        } else {
            this.ctx.fillRect(
                hazard.x - this.camera.x,
                hazard.y - this.camera.y,
                this.tileSize,
                this.tileSize
            );
        }
    }

    drawClouds() {
        const cloudCount = 5;
        const time = performance.now() * 0.0001;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < cloudCount; i++) {
            const x = ((this.camera.x * 0.5 + i * 200 + time * 50) % (this.canvas.width * 2)) - 100;
            const y = 50 + Math.sin(time + i) * 20;
            
            // 绘制云朵
            this.ctx.beginPath();
            this.ctx.arc(x, y, 30, 0, Math.PI * 2);
            this.ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
            this.ctx.arc(x + 25, y + 10, 25, 0, Math.PI * 2);
            this.ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this.player, this.checkCollision.bind(this));
            
            // 移除死亡的敌人
            if (enemy.isDead) {
                this.enemies.splice(i, 1);
            }
        }
    }

    drawEnemies() {
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx, this.camera);
        }
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (!projectile.update(deltaTime)) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    drawProjectiles() {
        for (const projectile of this.projectiles) {
            projectile.draw(this.ctx, this.camera);
        }
    }

    checkCollisions() {
        // 检查敌人与玩家的碰撞
        for (const enemy of this.enemies) {
            if (this.checkCollision(enemy).horizontal || this.checkCollision(enemy).vertical) {
                this.player.takeDamage(enemy.damage);
            }
        }

        // 检查投射物与敌人的碰撞
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.checkCollision(projectile).horizontal || this.checkCollision(projectile).vertical) {
                    enemy.takeDamage(projectile.damage);
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }
    }

    checkCollision(entity) {
        const result = {
            horizontal: false,
            vertical: false
        };

        // 检查与地形的碰撞
        for (const terrain of this.terrain) {
            if (!terrain.solid) continue;

            const terrainBox = {
                x: terrain.x,
                y: terrain.y,
                width: this.tileSize,
                height: this.tileSize
            };

            // 检查水平碰撞
            const nextHorizontalPos = {
                x: entity.x + entity.velocityX,
                y: entity.y,
                width: entity.width,
                height: entity.height
            };

            if (this.checkBoxCollision(nextHorizontalPos, terrainBox)) {
                result.horizontal = true;
            }

            // 检查垂直碰撞
            const nextVerticalPos = {
                x: entity.x,
                y: entity.y + entity.velocityY,
                width: entity.width,
                height: entity.height
            };

            if (this.checkBoxCollision(nextVerticalPos, terrainBox)) {
                result.vertical = true;
            }
        }

        return result;
    }

    checkBoxCollision(rect1, rect2) {
        return !(rect1.x + rect1.width <= rect2.x ||
                rect1.x >= rect2.x + rect2.width ||
                rect1.y + rect1.height <= rect2.y ||
                rect1.y >= rect2.y + rect2.height);
    }

    isCollision(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // 检查是否与任何地形块碰撞
        for (const tile of this.terrain) {
            if (!tile.solid) continue;

            const tilePosX = Math.floor(tile.x / this.tileSize);
            const tilePosY = Math.floor(tile.y / this.tileSize);
            
            if (tilePosX === tileX && tilePosY === tileY) {
                return true;
            }
        }
        
        return false;
    }

    updateGameState() {
        // 检查游戏结束条件
        if (this.player.health <= 0) {
            this.gameState.gameOver = true;
        }
    }

    drawDebugInfo() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`FPS: ${Math.round(1000/this.lastFrameTime)}`, 20, 20);
        this.ctx.fillText(`Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, 20, 40);
        this.ctx.fillText(`Health: ${this.player.health}`, 20, 60);
        this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 80);
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 20, 100);
        this.ctx.fillText(`Projectiles: ${this.projectiles.length}`, 20, 120);
        this.ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 20, 140);
    }

    drawGameOver() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
    }

    drawPauseScreen() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Paused', this.canvas.width / 2, this.canvas.height / 2);
    }

    generateInitialTerrain() {
        const groundLevel = this.canvas.height - 100;
        const worldWidth = this.canvas.width * 3;
        const segmentSize = 10; // 地形分段大小

        // 生成地形高度数组
        const heightMap = [];
        for (let x = 0; x <= worldWidth / this.tileSize; x++) {
            // 使用多个正弦波叠加生成自然的地形
            const height = 
                Math.sin(x * 0.1) * 30 +      // 主要地形起伏
                Math.sin(x * 0.05) * 50 +     // 大型地形特征
                Math.sin(x * 0.02) * 20 +     // 微小变化
                Math.sin(x * 0.2) * 10;       // 细节纹理
            
            heightMap[x] = groundLevel + height;
        }

        // 平滑地形高度
        for (let i = 1; i < heightMap.length - 1; i++) {
            heightMap[i] = (heightMap[i-1] + heightMap[i] * 2 + heightMap[i+1]) / 4;
        }

        // 生成地形块
        for (let x = 0; x < worldWidth / this.tileSize; x++) {
            const terrainHeight = Math.floor(heightMap[x] / this.tileSize) * this.tileSize;

            // 从地形表面一直填充到画布底部
            for (let y = terrainHeight; y < this.canvas.height + this.tileSize; y += this.tileSize) {
                this.terrain.push({
                    x: x * this.tileSize,
                    y: y,
                    type: 'ground',
                    solid: true
                });
            }

            // 在适当的位置添加平台
            if (x % segmentSize === 0 && Math.random() < 0.3) {
                const platformWidth = Math.floor(Math.random() * 3) + 2;
                const platformHeight = terrainHeight - (Math.floor(Math.random() * 3) + 2) * this.tileSize;

                // 确保平台不会太高或太低
                if (platformHeight > groundLevel - 200 && platformHeight < terrainHeight - this.tileSize) {
                    for (let px = 0; px < platformWidth; px++) {
                        if (x + px < worldWidth / this.tileSize) {
                            this.terrain.push({
                                x: (x + px) * this.tileSize,
                                y: platformHeight,
                                type: 'platform',
                                solid: true
                            });
                        }
                    }
                }
            }

            // 添加装饰物
            if (Math.random() < 0.1) {
                const decorHeight = terrainHeight - this.tileSize;
                if (decorHeight > groundLevel - 150) {
                    this.terrain.push({
                        x: x * this.tileSize,
                        y: decorHeight,
                        type: 'decoration',
                        solid: false
                    });
                }
            }
        }

        // 确保起始区域是平坦的
        const startX = Math.floor(this.player.x / this.tileSize);
        const safeZoneWidth = 5;
        for (let x = startX - safeZoneWidth; x <= startX + safeZoneWidth; x++) {
            if (x >= 0 && x < worldWidth / this.tileSize) {
                // 移除这个区域的所有地形
                this.terrain = this.terrain.filter(tile => 
                    tile.x < x * this.tileSize || 
                    tile.x >= (x + 1) * this.tileSize
                );

                // 添加平坦的地形
                for (let y = groundLevel; y < this.canvas.height + this.tileSize; y += this.tileSize) {
                    this.terrain.push({
                        x: x * this.tileSize,
                        y: y,
                        type: 'ground',
                        solid: true
                    });
                }
            }
        }
    }

    generateNewTerrain(startX, endX) {
        const groundLevel = this.canvas.height - 100;
        const segmentSize = 10;

        // 生成新的高度图
        const heightMap = [];
        for (let x = startX; x <= endX; x += this.tileSize) {
            const xCoord = x / this.tileSize;
            const height = 
                Math.sin(xCoord * 0.1) * 30 +
                Math.sin(xCoord * 0.05) * 50 +
                Math.sin(xCoord * 0.02) * 20 +
                Math.sin(xCoord * 0.2) * 10;
            
            heightMap[xCoord] = groundLevel + height;
        }

        // 生成地形
        for (let x = startX; x < endX; x += this.tileSize) {
            const xCoord = x / this.tileSize;
            const terrainHeight = Math.floor(heightMap[xCoord] / this.tileSize) * this.tileSize;

            // 生成地面
            for (let y = terrainHeight; y < this.canvas.height + this.tileSize; y += this.tileSize) {
                this.terrain.push({
                    x: x,
                    y: y,
                    type: 'ground',
                    solid: true
                });
            }

            // 生成平台
            if (xCoord % segmentSize === 0 && Math.random() < 0.3) {
                const platformWidth = Math.floor(Math.random() * 3) + 2;
                const platformHeight = terrainHeight - (Math.floor(Math.random() * 3) + 2) * this.tileSize;

                if (platformHeight > groundLevel - 200 && platformHeight < terrainHeight - this.tileSize) {
                    for (let px = 0; px < platformWidth; px++) {
                        const platformX = x + px * this.tileSize;
                        if (platformX < endX) {
                            this.terrain.push({
                                x: platformX,
                                y: platformHeight,
                                type: 'platform',
                                solid: true
                            });
                        }
                    }
                }
            }

            // 生成装饰物
            if (Math.random() < 0.1) {
                const decorHeight = terrainHeight - this.tileSize;
                if (decorHeight > groundLevel - 150) {
                    this.terrain.push({
                        x: x,
                        y: decorHeight,
                        type: 'decoration',
                        solid: false
                    });
                }
            }
        }

        // 在新生成的区域添加敌人
        this.spawnEnemiesInRange(startX, endX);
    }

    spawnEnemiesInRange(startX, endX) {
        const enemyCount = Math.floor((endX - startX) / (this.canvas.width / 3));
        for (let i = 0; i < enemyCount; i++) {
            const x = startX + Math.random() * (endX - startX);
            const y = this.canvas.height / 2;
            
            // 创建基础敌人
            const enemy = new Enemy(x, y, this);
            enemy.velocityX = Math.random() * 2 - 1; // 随机速度
            this.enemies.push(enemy);
        }
    }

    cleanupOffscreenEntities() {
        const bufferZone = this.canvas.width * 2;
        
        // 清理地形
        this.terrain = this.terrain.filter(tile => {
            return tile.x >= this.camera.x - bufferZone && 
                   tile.x <= this.camera.x + this.canvas.width + bufferZone;
        });
        
        // 清理敌人
        this.enemies = this.enemies.filter(enemy => {
            return enemy.x >= this.camera.x - bufferZone && 
                   enemy.x <= this.camera.x + this.canvas.width + bufferZone;
        });
    }
}

// 当页面加载完成后启动游戏
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
});
