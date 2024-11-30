class AssetManager {
    constructor() {
        this.images = {};
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.onComplete = null;
    }

    loadImage(name, src) {
        this.totalAssets++;
        const img = new Image();
        img.src = src;
        img.onload = () => {
            this.loadedAssets++;
            this.images[name] = img;
            if (this.loadedAssets === this.totalAssets && this.onComplete) {
                this.onComplete();
            }
        };
    }

    getImage(name) {
        return this.images[name];
    }

    setOnComplete(callback) {
        this.onComplete = callback;
    }
}

// 创建精灵表动画类
class SpriteAnimation {
    constructor(image, frameWidth, frameHeight, frameCount, frameDuration) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.frameDuration = frameDuration;
        this.currentFrame = 0;
        this.elapsedTime = 0;
        this.isLoop = true;
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= this.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.elapsedTime = 0;
        }
    }

    draw(ctx, x, y, direction = 1) {
        ctx.save();
        if (direction === -1) {
            ctx.scale(-1, 1);
            x = -x - this.frameWidth;
        }
        ctx.drawImage(
            this.image,
            this.currentFrame * this.frameWidth, 0,
            this.frameWidth, this.frameHeight,
            x, y,
            this.frameWidth, this.frameHeight
        );
        ctx.restore();
    }
}
