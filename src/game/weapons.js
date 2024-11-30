class Weapon {
    constructor(type) {
        this.type = type;
        this.damage = type.damage;
        this.range = type.range;
        this.attackSpeed = type.attackSpeed;
        this.knockback = type.knockback;
        this.effects = type.effects || [];
        
        // 动画相关
        this.swingAngle = 0;
        this.trailAlpha = 0;
        this.lastAttackTime = 0;
    }

    draw(ctx, isAttacking) {
        if (isAttacking) {
            this.drawAttack(ctx);
        } else {
            this.drawIdle(ctx);
        }
    }

    drawIdle(ctx) {
        switch(this.type.name) {
            case 'SWORD':
                this.drawSwordIdle(ctx);
                break;
            case 'BOW':
                this.drawBowIdle(ctx);
                break;
            case 'STAFF':
                this.drawStaffIdle(ctx);
                break;
        }
    }

    drawAttack(ctx) {
        switch(this.type.name) {
            case 'SWORD':
                this.drawSwordAttack(ctx);
                break;
            case 'BOW':
                this.drawBowAttack(ctx);
                break;
            case 'STAFF':
                this.drawStaffAttack(ctx);
                break;
        }
    }

    drawSwordIdle(ctx) {
        // 剑柄
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, -5, 4, 10);
        
        // 剑身
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(-1, -25, 2, 20);
        
        // 剑格
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-6, -5, 12, 2);
    }

    drawSwordAttack(ctx) {
        const now = Date.now();
        const timeSinceAttack = now - this.lastAttackTime;
        const attackDuration = this.attackSpeed;
        const progress = Math.min(timeSinceAttack / attackDuration, 1);
        
        // 计算挥剑角度
        const swingAngle = Math.sin(progress * Math.PI) * Math.PI * 0.75;
        
        ctx.save();
        ctx.rotate(swingAngle);
        
        // 绘制剑的拖尾效果
        if (progress < 0.5) {
            const trailAlpha = (0.5 - progress) * 2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${trailAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 25, -Math.PI/2, swingAngle);
            ctx.stroke();
        }
        
        // 绘制剑
        this.drawSwordIdle(ctx);
        
        ctx.restore();
    }

    drawBowIdle(ctx) {
        // 弓身
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, -Math.PI/2, Math.PI/2);
        ctx.stroke();
        
        // 弓弦
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(0, 15);
        ctx.stroke();
    }

    drawBowAttack(ctx) {
        const now = Date.now();
        const timeSinceAttack = now - this.lastAttackTime;
        const attackDuration = this.attackSpeed;
        const progress = Math.min(timeSinceAttack / attackDuration, 1);
        
        // 弓身
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, -Math.PI/2, Math.PI/2);
        ctx.stroke();
        
        // 拉弓效果
        const bowDrawDistance = Math.sin(progress * Math.PI) * 10;
        
        // 弓弦
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.quadraticCurveTo(-bowDrawDistance, 0, 0, 15);
        ctx.stroke();
        
        // 箭
        if (progress < 0.9) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-bowDrawDistance, -1, 20, 2);
            
            // 箭头
            ctx.beginPath();
            ctx.moveTo(-bowDrawDistance + 20, 0);
            ctx.lineTo(-bowDrawDistance + 15, -4);
            ctx.lineTo(-bowDrawDistance + 15, 4);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawStaffIdle(ctx) {
        // 法杖杆
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, -20, 4, 40);
        
        // 法杖顶部宝石
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.arc(0, -25, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 宝石光晕
        const gradient = ctx.createRadialGradient(0, -25, 4, 0, -25, 12);
        gradient.addColorStop(0, 'rgba(65, 105, 225, 0.6)');
        gradient.addColorStop(1, 'rgba(65, 105, 225, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, -25, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStaffAttack(ctx) {
        const now = Date.now();
        const timeSinceAttack = now - this.lastAttackTime;
        const attackDuration = this.attackSpeed;
        const progress = Math.min(timeSinceAttack / attackDuration, 1);
        
        // 绘制基本法杖
        this.drawStaffIdle(ctx);
        
        // 添加魔法效果
        const magicRadius = progress * 30;
        const magicAlpha = 1 - progress;
        
        // 魔法圆环
        ctx.strokeStyle = `rgba(65, 105, 225, ${magicAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -25, magicRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 魔法粒子
        const particleCount = 8;
        const angleStep = (Math.PI * 2) / particleCount;
        
        ctx.fillStyle = `rgba(65, 105, 225, ${magicAlpha})`;
        for (let i = 0; i < particleCount; i++) {
            const angle = i * angleStep + progress * Math.PI * 2;
            const x = Math.cos(angle) * magicRadius;
            const y = Math.sin(angle) * magicRadius - 25;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    attack(x, y, targetX, targetY) {
        if (Date.now() - this.lastAttackTime < this.attackSpeed) return null;
        
        this.lastAttackTime = Date.now();
        this.swingAngle = 0;
        
        switch(this.type.name) {
            case 'BOW':
            case 'STAFF':
                // 计算方向
                const dx = targetX - x;
                const dy = targetY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 标准化方向向量并应用速度
                const speed = 10;
                const velocityX = (dx / distance) * speed;
                const velocityY = (dy / distance) * speed;
                
                // 创建投射物
                return new Projectile(
                    x, 
                    y,
                    velocityX,
                    velocityY,
                    this.type.name === 'BOW' ? 'arrow' : 'magic',
                    this.damage,
                    this.range
                );
        }
        return null;
    }
}

// 武器类型定义
const WeaponTypes = {
    SWORD: {
        name: 'SWORD',
        damage: 10,
        range: 50,
        attackSpeed: 500,
        knockback: 5,
        effects: []
    },
    BOW: {
        name: 'BOW',
        damage: 8,
        range: 400,
        attackSpeed: 800,
        knockback: 2,
        effects: []
    },
    STAFF: {
        name: 'STAFF',
        damage: 12,
        range: 300,
        attackSpeed: 1000,
        knockback: 3,
        effects: ['magic']
    }
};

// 导出武器类型
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Weapon, WeaponTypes };
}
