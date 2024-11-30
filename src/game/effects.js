class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createParticle(x, y, type) {
        const particle = {
            x, y,
            life: 1.0,
            type,
            scale: 1.0,
            rotation: Math.random() * Math.PI * 2,
            velocityX: (Math.random() - 0.5) * 5,
            velocityY: (Math.random() - 0.5) * 5 - 3,
            gravity: 0.2,
            color: this.getParticleColor(type)
        };
        this.particles.push(particle);
    }

    getParticleColor(type) {
        switch(type) {
            case 'hit': return ['#ff0', '#f80', '#f00'];
            case 'magic': return ['#0ff', '#08f', '#00f'];
            case 'heal': return ['#0f0', '#0f8', '#0ff'];
            case 'jump': return ['#fff', '#ccc', '#888'];
            default: return ['#fff'];
        }
    }

    createEffect(x, y, type, count = 10) {
        for (let i = 0; i < count; i++) {
            this.createParticle(x, y, type);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= 0.02;
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += particle.gravity;
            particle.rotation += 0.1;
            particle.scale *= 0.95;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, camera) {
        for (const particle of this.particles) {
            ctx.save();
            ctx.translate(
                particle.x - camera.x,
                particle.y - camera.y
            );
            ctx.rotate(particle.rotation);
            ctx.scale(particle.scale, particle.scale);

            const colors = particle.color;
            const size = 5;

            // 绘制星形粒子
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5;
                const x = Math.cos(angle) * size;
                const y = Math.sin(angle) * size;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            // 使用渐变色
            const colorIndex = Math.floor((1 - particle.life) * colors.length);
            ctx.fillStyle = colors[Math.min(colorIndex, colors.length - 1)];
            ctx.fill();

            ctx.restore();
        }
    }
}

class PowerUpSystem {
    constructor() {
        this.powerUps = [];
        this.types = {
            'doubleJump': {
                color: '#0ff',
                duration: 10000,
                apply: (player) => {
                    player.maxJumps = 2;
                    player.jumpsLeft = 2;
                },
                remove: (player) => {
                    player.maxJumps = 1;
                    player.jumpsLeft = 1;
                }
            },
            'speedBoost': {
                color: '#ff0',
                duration: 8000,
                apply: (player) => {
                    player.baseSpeed *= 1.5;
                },
                remove: (player) => {
                    player.baseSpeed /= 1.5;
                }
            },
            'shield': {
                color: '#08f',
                duration: 15000,
                apply: (player) => {
                    player.hasShield = true;
                },
                remove: (player) => {
                    player.hasShield = false;
                }
            }
        };
    }

    spawnPowerUp(x, y) {
        const types = Object.keys(this.types);
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.powerUps.push({
            x, y,
            type,
            width: 20,
            height: 20,
            floatOffset: 0,
            collected: false
        });
    }

    update(deltaTime) {
        for (const powerUp of this.powerUps) {
            powerUp.floatOffset = Math.sin(Date.now() / 500) * 5;
        }
    }

    draw(ctx, camera) {
        for (const powerUp of this.powerUps) {
            if (powerUp.collected) continue;

            ctx.save();
            ctx.translate(
                powerUp.x - camera.x,
                powerUp.y - camera.y + powerUp.floatOffset
            );

            // 绘制光环效果
            const gradient = ctx.createRadialGradient(10, 10, 5, 10, 10, 15);
            gradient.addColorStop(0, this.types[powerUp.type].color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(-5, -5, 30, 30);

            // 绘制核心
            ctx.fillStyle = this.types[powerUp.type].color;
            ctx.fillRect(5, 5, 10, 10);

            // 绘制闪光效果
            const sparkleTime = Date.now() / 200;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(10, 20);
            ctx.moveTo(0, 10);
            ctx.lineTo(20, 10);
            ctx.globalAlpha = Math.abs(Math.sin(sparkleTime));
            ctx.stroke();

            ctx.restore();
        }
    }

    checkCollision(player) {
        for (const powerUp of this.powerUps) {
            if (powerUp.collected) continue;

            if (player.x < powerUp.x + powerUp.width &&
                player.x + player.width > powerUp.x &&
                player.y < powerUp.y + powerUp.height &&
                player.y + player.height > powerUp.y) {
                
                powerUp.collected = true;
                return powerUp.type;
            }
        }
        return null;
    }
}
