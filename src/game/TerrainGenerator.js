export default class TerrainGenerator {
  constructor(width, height, tileSize = 32) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    
    // 地形配置
    this.platformMinWidth = 3;
    this.platformMaxWidth = 8;
    this.platformMinGap = 2;
    this.platformMaxGap = 4;
    
    // 地形数据
    this.tiles = [];
    this.platforms = [];
    
    // 初始化地形
    this.generateTerrain();
  }

  generateTerrain() {
    // 初始化瓦片数组
    this.tiles = Array(Math.ceil(this.height / this.tileSize))
      .fill()
      .map(() => Array(Math.ceil(this.width / this.tileSize)).fill(0));
    
    // 生成地面
    const groundHeight = Math.floor(this.height * 0.8 / this.tileSize);
    for (let x = 0; x < this.tiles[0].length; x++) {
      for (let y = groundHeight; y < this.tiles.length; y++) {
        this.tiles[y][x] = 1;
      }
    }
    
    // 生成平台
    let currentX = 2;
    while (currentX < this.tiles[0].length - 2) {
      const platformWidth = Math.floor(
        Math.random() * (this.platformMaxWidth - this.platformMinWidth + 1)
      ) + this.platformMinWidth;
      
      const gap = Math.floor(
        Math.random() * (this.platformMaxGap - this.platformMinGap + 1)
      ) + this.platformMinGap;
      
      const platformY = Math.floor(groundHeight * Math.random() * 0.7) + 3;
      
      if (currentX + platformWidth < this.tiles[0].length - 2) {
        for (let x = currentX; x < currentX + platformWidth; x++) {
          this.tiles[platformY][x] = 1;
        }
        
        this.platforms.push({
          x: currentX * this.tileSize,
          y: platformY * this.tileSize,
          width: platformWidth * this.tileSize,
          height: this.tileSize
        });
      }
      
      currentX += platformWidth + gap;
    }
  }

  draw(ctx, camera = { x: 0, y: 0 }) {
    const startX = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endX = Math.min(
      this.tiles[0].length,
      Math.ceil((camera.x + ctx.canvas.width) / this.tileSize)
    );
    const startY = Math.max(0, Math.floor(camera.y / this.tileSize));
    const endY = Math.min(
      this.tiles.length,
      Math.ceil((camera.y + ctx.canvas.height) / this.tileSize)
    );
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (this.tiles[y][x] === 1) {
          const drawX = x * this.tileSize - camera.x;
          const drawY = y * this.tileSize - camera.y;
          
          // 绘制地形瓦片
          ctx.fillStyle = '#4a4a4a';
          ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
          
          // 添加简单纹理
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.fillRect(
            drawX + 2,
            drawY + 2,
            this.tileSize - 4,
            this.tileSize - 4
          );
        }
      }
    }
  }

  checkCollision(entity) {
    const left = Math.floor(entity.x / this.tileSize);
    const right = Math.ceil((entity.x + entity.width) / this.tileSize);
    const top = Math.floor(entity.y / this.tileSize);
    const bottom = Math.ceil((entity.y + entity.height) / this.tileSize);
    
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        if (y >= 0 && y < this.tiles.length && x >= 0 && x < this.tiles[0].length) {
          if (this.tiles[y][x] === 1) {
            const tileLeft = x * this.tileSize;
            const tileRight = (x + 1) * this.tileSize;
            const tileTop = y * this.tileSize;
            const tileBottom = (y + 1) * this.tileSize;
            
            const overlapLeft = entity.x + entity.width - tileLeft;
            const overlapRight = tileRight - entity.x;
            const overlapTop = entity.y + entity.height - tileTop;
            const overlapBottom = tileBottom - entity.y;
            
            const overlaps = [
              { dir: 'left', amount: overlapLeft },
              { dir: 'right', amount: overlapRight },
              { dir: 'top', amount: overlapTop },
              { dir: 'bottom', amount: overlapBottom }
            ];
            
            const minOverlap = overlaps.reduce((min, current) => 
              current.amount < min.amount ? current : min
            );
            
            return {
              collision: true,
              direction: minOverlap.dir,
              amount: minOverlap.amount
            };
          }
        }
      }
    }
    
    return { collision: false };
  }

  getTileAt(x, y) {
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);
    
    if (tileY >= 0 && tileY < this.tiles.length && tileX >= 0 && tileX < this.tiles[0].length) {
      return this.tiles[tileY][tileX];
    }
    
    return 0;
  }
}
