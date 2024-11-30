class TerrainGenerator {
    constructor(tileSize) {
        this.tileSize = tileSize;
        this.perlinNoise = new PerlinNoise();
        this.generatedChunks = new Set(); // 记录已生成的区块
        this.chunkSize = 16; // 每个区块的大小
        this.terrain = new Map(); // 使用Map存储地形，键为"x,y"格式
        this.minHeight = 15; // 最小高度
        this.maxHeight = 25; // 最大高度
        this.biomes = ['forest', 'cave', 'mountain', 'desert'];
        this.currentBiome = 'forest';
        this.lastBiomeChange = 0;
        this.biomeLength = 100; // 每个生物群落的长度（块）
    }

    generateTerrain(playerX) {
        // 计算玩家所在的区块
        const chunkX = Math.floor(playerX / (this.tileSize * this.chunkSize));
        
        // 生成玩家周围的区块
        for (let x = chunkX - 2; x <= chunkX + 2; x++) {
            this.generateChunk(x);
        }

        // 清理远离玩家的区块
        const chunksToRemove = [];
        for (const chunk of this.generatedChunks) {
            if (Math.abs(chunk - chunkX) > 3) {
                chunksToRemove.push(chunk);
                // 删除该区块的所有地形块
                const startX = chunk * this.chunkSize;
                const endX = startX + this.chunkSize;
                for (const key of this.terrain.keys()) {
                    const [x, y] = key.split(',').map(Number);
                    if (x >= startX && x < endX) {
                        this.terrain.delete(key);
                    }
                }
            }
        }
        chunksToRemove.forEach(chunk => this.generatedChunks.delete(chunk));

        return Array.from(this.terrain.values());
    }

    generateChunk(chunkX) {
        if (this.generatedChunks.has(chunkX)) {
            return; // 如果区块已经生成过，直接返回
        }

        const startX = chunkX * this.chunkSize;
        const height = 30; // 地图总高度

        // 获取前一个区块的最后一个高度（如果存在）
        let prevHeight = null;
        if (this.generatedChunks.has(chunkX - 1)) {
            const prevX = startX - 1;
            for (let y = 0; y < height; y++) {
                if (this.terrain.has(`${prevX},${y}`)) {
                    prevHeight = y;
                    break;
                }
            }
        }

        // 使用柏林噪声生成地形高度
        let lastHeight = prevHeight || this.minHeight;
        for (let x = 0; x <= this.chunkSize; x++) {  // 包含结束点以确保连续性
            const worldX = startX + x;
            
            // 使用柏林噪声，但限制高度变化
            const noiseValue = this.perlinNoise.noise(worldX * 0.1);
            const heightChange = noiseValue * 2; // 限制每步的高度变化
            lastHeight = Math.max(this.minHeight, 
                                Math.min(this.maxHeight, 
                                        lastHeight + heightChange));
            
            const baseHeight = Math.floor(lastHeight);

            // 生成从地表到底部的方块
            for (let y = baseHeight; y < height; y++) {
                const type = this.getTileType(y - baseHeight);
                const tile = new Tile(
                    worldX * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize,
                    type
                );
                this.terrain.set(`${worldX},${y}`, tile);
            }

            // 生成特定生物群落的地形
            const terrainData = this.generateBiomeTerrain(worldX, baseHeight, this.currentBiome);
            if (terrainData.decoration) {
                const decoration = this.generateDecoration(worldX, baseHeight, terrainData.decoration);
                this.terrain.set(`${worldX},${baseHeight}`, decoration);
            }
            if (terrainData.hazard) {
                const hazard = this.generateHazard(worldX, baseHeight, terrainData.hazard);
                this.terrain.set(`${worldX},${baseHeight}`, hazard);
            }

            // 生成移动平台
            if (Math.random() < 0.05) {
                const platform = this.generateMovingPlatform(worldX, baseHeight, 5);
                this.terrain.set(`${worldX},${baseHeight}`, platform);
            }

            // 生成可破坏的方块
            if (Math.random() < 0.1) {
                const destructibleBlock = this.generateDestructibleBlock(worldX, baseHeight);
                this.terrain.set(`${worldX},${baseHeight}`, destructibleBlock);
            }
        }

        this.generatedChunks.add(chunkX);
    }

    generateBiomeTerrain(x, baseHeight, biome) {
        const terrainData = {
            height: baseHeight,
            type: 'ground',
            decoration: null,
            hazard: null
        };

        switch(biome) {
            case 'forest':
                if (Math.random() < 0.1) {
                    terrainData.decoration = 'tree';
                } else if (Math.random() < 0.05) {
                    terrainData.decoration = 'bush';
                }
                break;
            case 'cave':
                terrainData.height += Math.sin(x * 0.1) * 30;
                if (Math.random() < 0.05) {
                    terrainData.hazard = 'stalactite';
                }
                break;
            case 'mountain':
                terrainData.height -= Math.abs(Math.sin(x * 0.05)) * 100;
                if (Math.random() < 0.08) {
                    terrainData.hazard = 'spike';
                }
                break;
            case 'desert':
                terrainData.height += Math.sin(x * 0.03) * 50;
                if (Math.random() < 0.05) {
                    terrainData.decoration = 'cactus';
                }
                break;
        }

        return terrainData;
    }

    generateMovingPlatform(x, y, width) {
        return {
            x: x,
            y: y,
            width: width,
            type: 'moving_platform',
            movement: {
                range: 100,
                speed: 1,
                direction: 1,
                originalY: y
            }
        };
    }

    generateDestructibleBlock(x, y) {
        return {
            x: x,
            y: y,
            type: 'destructible',
            health: 100,
            drops: Math.random() < 0.3 ? 'health' : 'coin'
        };
    }

    generateDecoration(x, y, type) {
        const decorations = {
            tree: { width: 2, height: 4, color: '#2E7D32' },
            bush: { width: 1, height: 1, color: '#388E3C' },
            cactus: { width: 1, height: 2, color: '#66BB6A' },
            crystal: { width: 1, height: 2, color: '#B39DDB' }
        };

        return {
            x: x,
            y: y,
            ...decorations[type],
            type: 'decoration_' + type
        };
    }

    generateHazard(x, y, type) {
        const hazards = {
            spike: { damage: 20, width: 1, height: 1, color: '#B71C1C' },
            stalactite: { damage: 30, width: 1, height: 2, color: '#795548' },
            lava: { damage: 50, width: 1, height: 1, color: '#FF5722' }
        };

        return {
            x: x,
            y: y,
            ...hazards[type],
            type: 'hazard_' + type
        };
    }

    updateMovingPlatforms(platforms, deltaTime) {
        for (const platform of platforms) {
            if (platform.type === 'moving_platform') {
                // 更新平台位置
                platform.y = platform.movement.originalY + 
                    Math.sin(performance.now() * 0.001 * platform.movement.speed) * 
                    platform.movement.range;
            }
        }
    }

    handleTerrainDestruction(terrain, damage, x, y, radius) {
        const affectedBlocks = terrain.filter(block => {
            if (block.type.startsWith('destructible')) {
                const distance = Math.sqrt(
                    Math.pow(block.x - x, 2) + 
                    Math.pow(block.y - y, 2)
                );
                return distance <= radius;
            }
            return false;
        });

        for (const block of affectedBlocks) {
            block.health -= damage;
            if (block.health <= 0) {
                // 返回掉落物信息
                return {
                    type: block.drops,
                    x: block.x,
                    y: block.y
                };
            }
        }

        return null;
    }

    isGround(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        const tile = this.terrain.get(`${tileX},${tileY}`);
        return tile && tile.solid;
    }

    getTileType(depth) {
        if (depth === 0) return 'grass';
        if (depth < 3) return 'dirt';
        if (depth < 8) return 'stone';
        if (Math.random() < 0.1) return 'ore';
        if (Math.random() < 0.05) return 'crystal';
        return 'stone';
    }
}

class Tile {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.solid = ['grass', 'dirt', 'stone', 'ore', 'crystal'].includes(type);
        this.color = this.getTypeColor(type);
    }

    draw(ctx, camera) {
        // 只渲染在视野范围内的方块
        if (this.x + this.width < camera.x || 
            this.x > camera.x + camera.width ||
            this.y + this.height < camera.y || 
            this.y > camera.y + camera.height) {
            return;
        }

        ctx.fillStyle = this.color;
        
        // 根据类型绘制不同的形状
        switch(this.type) {
            case 'tallGrass':
                this.drawGrass(ctx, camera);
                break;
            case 'flower':
                this.drawFlower(ctx, camera);
                break;
            default:
                ctx.fillRect(
                    Math.floor(this.x - camera.x),
                    Math.floor(this.y - camera.y),
                    this.width,
                    this.height
                );
        }
    }

    drawGrass(ctx, camera) {
        const x = Math.floor(this.x - camera.x);
        const y = Math.floor(this.y - camera.y);
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y + this.height);
        ctx.lineTo(x + this.width/2, y);
        ctx.strokeStyle = '#2d5a27';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 添加一些随机的草叶
        for (let i = 0; i < 3; i++) {
            const angle = (Math.random() - 0.5) * Math.PI/3;
            const length = this.height * 0.7;
            ctx.beginPath();
            ctx.moveTo(x + this.width/2, y + this.height * 0.3);
            ctx.lineTo(
                x + this.width/2 + Math.cos(angle) * length,
                y + this.height * 0.3 - Math.sin(angle) * length
            );
            ctx.stroke();
        }
    }

    drawFlower(ctx, camera) {
        const x = Math.floor(this.x - camera.x);
        const y = Math.floor(this.y - camera.y);
        
        // 茎
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y + this.height);
        ctx.lineTo(x + this.width/2, y + this.height * 0.3);
        ctx.strokeStyle = '#2d5a27';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 花朵
        ctx.beginPath();
        ctx.arc(
            x + this.width/2,
            y + this.height * 0.3,
            this.width/4,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = ['#ff69b4', '#ffff00', '#ff6347'][Math.floor(Math.random() * 3)];
        ctx.fill();
    }

    getTypeColor(type) {
        switch (type) {
            case 'grass':
                return '#3a3';
            case 'dirt':
                return '#964B00';
            case 'stone':
                return '#808080';
            case 'ore':
                return '#FFD700';
            case 'crystal':
                return '#4169E1';
            case 'tallGrass':
                return '#2d5a27';
            case 'flower':
                return '#ff69b4';
            default:
                return '#000';
        }
    }
}

// 柏林噪声实现
class PerlinNoise {
    constructor() {
        this.permutation = new Array(256);
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.permutation[i], this.permutation[j]] = 
            [this.permutation[j], this.permutation[i]];
        }
        this.permutation = [...this.permutation, ...this.permutation];
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 15;
        const grad2 = 1 + (h & 7);
        if (h & 8) return -grad2 * x;
        return grad2 * x;
    }

    noise(x, y = 0) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this.fade(x);
        const v = this.fade(y);
        const A = this.permutation[X] + Y;
        const B = this.permutation[X + 1] + Y;
        return this.lerp(v,
            this.lerp(u,
                this.grad(this.permutation[A], x, y),
                this.grad(this.permutation[B], x - 1, y)
            ),
            this.lerp(u,
                this.grad(this.permutation[A + 1], x, y - 1),
                this.grad(this.permutation[B + 1], x - 1, y - 1)
            )
        ) * 0.5 + 0.5;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerrainGenerator;
}
