// Entities: Player, Monsters/Dummies, Projectiles, Particles, Floating Combat Text

class Particle {
  constructor(x, y, vx, vy, color, size, life, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.shape = shape;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }

  render(ctx, camera) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(sx, sy, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, this.size * (1 + (1 - alpha) * 2), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillRect(sx - this.size / 2, sy - this.size / 2, this.size, this.size);
    }
    ctx.restore();
  }
}

class FloatingText {
  constructor(x, y, text, color = '#ffffff', fontSize = 13, duration = 0.9) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.duration = duration;
    this.maxDuration = duration;
    this.vy = -35;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.duration -= dt;
    return this.duration > 0;
  }

  render(ctx, camera) {
    const alpha = Math.max(0, this.duration / this.maxDuration);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${this.fontSize}px 'Press Start 2P', monospace, sans-serif`;
    ctx.fillStyle = '#000000';
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    // Outline
    ctx.fillText(this.text, sx + 1, sy + 1);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, sx, sy);
    ctx.restore();
  }
}

class Projectile {
  constructor(x, y, vx, vy, range, damage, type, extra = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.startX = x;
    this.startY = y;
    this.maxRange = range;
    this.damage = damage;
    this.type = type; // 'arrow', 'net_arrow', 'recoil_blast'
    this.extra = extra;
    this.radius = 6;
    this.isDead = false;
  }

  update(dt, world, monsters, particles, floatingTexts) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const dx = this.x - this.startX;
    const dy = this.y - this.startY;
    if (dx * dx + dy * dy >= this.maxRange * this.maxRange) {
      this.onImpact(world, monsters, particles, floatingTexts);
      return false;
    }

    if (this.type === 'acid_spit') {
      // Check hit player
      const p = world && world.game ? world.game.player : null;
      if (p && !p.isDead && !p.isVaulting && !p.isDashing) {
        const distSq = (this.x - p.x) * (this.x - p.x) + (this.y - p.y) * (this.y - p.y);
        if (distSq <= (this.radius + p.radius) * (this.radius + p.radius)) {
          this.onImpact(world, monsters, particles, floatingTexts, p);
          return false;
        }
      }

      // Check hit defenses
      if (world && world.game && world.game.buildingManager) {
        for (let d of world.game.buildingManager.defenses) {
          const distSq = (this.x - d.x) * (this.x - d.x) + (this.y - d.y) * (this.y - d.y);
          if (distSq <= (this.radius + 16) * (this.radius + 16)) {
            world.game.buildingManager.damageStructure(d, this.damage);
            this.onImpact(world, monsters, particles, floatingTexts, d);
            return false;
          }
        }
      }
    } else {
      // Check hit monsters
      for (let m of monsters) {
        if (m.isDead) continue;
        const distSq = (this.x - m.x) * (this.x - m.x) + (this.y - m.y) * (this.y - m.y);
        if (distSq <= (this.radius + m.radius) * (this.radius + m.radius)) {
          this.onImpact(world, monsters, particles, floatingTexts, m);
          return false;
        }
      }
    }

    return true;
  }

  onImpact(world, monsters, particles, floatingTexts, hitTarget = null) {
    if (this.isDead) return;
    this.isDead = true;

    if (this.type === 'arrow') {
      if (hitTarget) {
        hitTarget.takeDamage(this.damage, particles, floatingTexts);
      }
      // Spark particles
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 60;
        particles.push(new Particle(this.x, this.y, Math.cos(angle) * spd, Math.sin(angle) * spd, '#ffb74d', 3, 0.25));
      }
    } else if (this.type === 'net_arrow') {
      // Net Arrow: AoE Root!
      const rootRadius = 90;
      floatingTexts.push(new FloatingText(this.x, this.y - 10, 'NET EXPAND!', '#38bdf8', 12, 1.2));
      window.audioManager.playBowNet();

      // Net ring particle
      particles.push(new Particle(this.x, this.y, 0, 0, '#38bdf8', rootRadius, 0.6, 'ring'));

      // Root all monsters in radius
      for (let m of monsters) {
        if (m.isDead) continue;
        const dist = Math.hypot(m.x - this.x, m.y - this.y);
        if (dist <= rootRadius) {
          m.applyRoot(2.5, floatingTexts);
          m.takeDamage(this.damage, particles, floatingTexts);
        }
      }
    } else if (this.type === 'recoil_blast') {
      // Recoil Blast: AoE knockback + slow
      const blastRadius = 80;
      particles.push(new Particle(this.x, this.y, 0, 0, '#f97316', blastRadius, 0.4, 'ring'));

      for (let m of monsters) {
        if (m.isDead) continue;
        const dist = Math.hypot(m.x - this.x, m.y - this.y);
        if (dist <= blastRadius) {
          m.applySlow(0.4, 3.0, floatingTexts);
          m.takeDamage(this.damage, particles, floatingTexts);
          const angle = Math.atan2(m.y - this.y, m.x - this.x);
          m.applyKnockback(Math.cos(angle) * 160, Math.sin(angle) * 160, 0.25);
        }
      }
    } else if (this.type === 'acid_spit') {
      // Acid Spit Impact
      if (hitTarget) {
        if (hitTarget.takeDamage) {
          hitTarget.takeDamage(this.damage);
          if (hitTarget.addInfection) hitTarget.addInfection(10, 'AXIT ĂN MÒN');
        }
      }
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 30 + Math.random() * 50;
        particles.push(new Particle(this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd, '#84cc16', 3, 0.3));
      }
      window.audioManager.playHit();
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx, sy);
    const angle = Math.atan2(this.vy, this.vx);
    ctx.rotate(angle);

    if (this.type === 'arrow') {
      ctx.fillStyle = '#ffb74d';
      ctx.fillRect(-8, -1.5, 16, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(4, -4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'net_arrow') {
      // Net canister glowing cyan
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-6, -4, 12, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-6, -4, 12, 8);
    } else if (this.type === 'recoil_blast') {
      // Fiery plasma slug
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(2, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'acid_spit') {
      // Venom acid glob
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bef264';
      ctx.fillRect(-2, -2, 4, 4);
    }
    ctx.restore();
  }
}

class Monster {
  constructor(x, y, species = 'crawler', customName = null, customHp = null) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.species = species;
    this.type = species; // for backward compatibility

    const cfg = (CONSTANTS.MONSTER_SPECIES && CONSTANTS.MONSTER_SPECIES[species]) ? CONSTANTS.MONSTER_SPECIES[species] : {
      name: 'Xenomorph Crawler', maxHp: 50, speed: 75, damage: 10, radius: 16
    };

    this.name = customName || cfg.name || 'Quái Vật';
    this.maxHp = customHp || cfg.maxHp || 50;
    this.hp = this.maxHp;
    this.radius = cfg.radius || 16;
    this.speed = (species === 'dummy') ? 0 : (cfg.speed || 75);
    this.damage = cfg.damage || 10;
    this.isKamikaze = !!cfg.isKamikaze;
    this.isRanged = !!cfg.isRanged;
    this.isBoss = !!cfg.isBoss;
    this.attackRange = cfg.range || (this.isRanged ? 190 : 26);
    this.isDead = false;

    // Crowd Control & Status
    this.stunDuration = 0;
    this.rootDuration = 0;
    this.slowDuration = 0;
    this.slowFactor = 1.0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.knockbackDuration = 0;

    this.hitFlashTimer = 0;
    this.attackCooldown = 0;
    this.pulseTimer = 0;
  }

  takeDamage(amount, particles, floatingTexts) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    window.audioManager.playHit();
    floatingTexts.push(new FloatingText(this.x + (Math.random() - 0.5) * 16, this.y - 15, `-${amount}`, '#ef4444', 14));

    // Blood / Alien acid splatter
    const bloodColor = (this.species === 'spitter') ? '#84cc16' : (this.species === 'exploder' ? '#ea580c' : '#a855f7');
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 30 + Math.random() * 50;
      particles.push(new Particle(this.x, this.y, Math.cos(a) * s, Math.sin(a) * s, bloodColor, 3, 0.3));
    }

    if (this.hp <= 0) {
      if (this.isKamikaze && !this.isDead) {
        // Trigger Kamikaze Detonation on death
        this.detonate(window.gameEngine ? window.gameEngine.player : null, window.gameEngine ? window.gameEngine.world : null, particles, floatingTexts);
      } else {
        this.isDead = true;
        floatingTexts.push(new FloatingText(this.x, this.y - 25, `${this.name} TIÊU DIỆT!`, '#fbbf24', 12, 1.2));
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = 40 + Math.random() * 90;
          particles.push(new Particle(this.x, this.y, Math.cos(a) * s, Math.sin(a) * s, '#ec4899', 4, 0.5));
        }
      }
    }
  }

  detonate(player, world, particles, floatingTexts) {
    if (this.isDead) return;
    this.isDead = true;
    window.audioManager.playBowRecoil();

    const blastRadius = 55;
    particles.push(new Particle(this.x, this.y, 0, 0, '#ef4444', blastRadius, 0.5, 'ring'));
    particles.push(new Particle(this.x, this.y, 0, 0, '#f97316', blastRadius * 0.7, 0.35, 'ring'));

    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 80;
      particles.push(new Particle(this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd, (i % 2 === 0) ? '#fde047' : '#ea580c', 4, 0.4));
    }

    floatingTexts.push(new FloatingText(this.x, this.y - 20, '💥 CẢM TỬ NỔ TUNG! 💥', '#ef4444', 13, 1.4));

    // Damage player if in range
    if (player && !player.isDead) {
      const distP = Math.hypot(player.x - this.x, player.y - this.y);
      if (distP <= blastRadius) {
        player.takeDamage(this.damage);
        player.addInfection(18, 'VỤ NỔ CẢM TỬ');
      }
    }

    // Damage nearby defense structures
    if (world && world.game && world.game.buildingManager) {
      for (let d of world.game.buildingManager.defenses) {
        const distD = Math.hypot(d.x - this.x, d.y - this.y);
        if (distD <= blastRadius + 16) {
          world.game.buildingManager.damageStructure(d, this.damage);
        }
      }
    }
  }

  applyStun(duration, floatingTexts) {
    this.stunDuration = Math.max(this.stunDuration, duration);
    floatingTexts.push(new FloatingText(this.x, this.y - 30, '★ STUNNED! ★', '#facc15', 12, 1.2));
  }

  applyRoot(duration, floatingTexts) {
    this.rootDuration = Math.max(this.rootDuration, duration);
    floatingTexts.push(new FloatingText(this.x, this.y - 30, '🕸 ROOTED! 🕸', '#38bdf8', 12, 1.2));
  }

  applySlow(factor, duration, floatingTexts) {
    this.slowFactor = factor;
    this.slowDuration = Math.max(this.slowDuration, duration);
    floatingTexts.push(new FloatingText(this.x, this.y - 30, '❄ SLOWED! ❄', '#a5f3fc', 11, 1.0));
  }

  applyKnockback(vx, vy, duration = 0.25) {
    this.knockbackVx = vx;
    this.knockbackVy = vy;
    this.knockbackDuration = duration;
  }

  update(dt, player, world) {
    if (this.isDead) return;

    this.pulseTimer += dt * 4;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Update status durations
    if (this.stunDuration > 0) this.stunDuration -= dt;
    if (this.rootDuration > 0) this.rootDuration -= dt;
    if (this.slowDuration > 0) {
      this.slowDuration -= dt;
      if (this.slowDuration <= 0) this.slowFactor = 1.0;
    }

    // Handle Knockback physics
    if (this.knockbackDuration > 0) {
      this.knockbackDuration -= dt;
      const nextX = this.x + this.knockbackVx * dt;
      const nextY = this.y + this.knockbackVy * dt;
      if (!world.isColliding(nextX, this.y, this.radius)) this.x = nextX;
      if (!world.isColliding(this.x, nextY, this.radius)) this.y = nextY;
      this.knockbackVx *= 0.88;
      this.knockbackVy *= 0.88;
      return;
    }

    // If stunned or rooted, cannot move
    if (this.stunDuration > 0 || this.rootDuration > 0) return;

    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (this.species === 'dummy') return;

    // Target Selection: Player or Nearest Defensive Structure
    let target = null;
    let targetDist = Infinity;
    let isStructureTarget = false;

    // 1. Check Player as target
    if (player && !player.isStealthed && !player.isDead) {
      target = player;
      targetDist = Math.hypot(player.x - this.x, player.y - this.y);
    }

    // 2. Check if a defensive wall / turret is closer or blocking
    if (world && world.game && world.game.buildingManager) {
      for (let d of world.game.buildingManager.defenses) {
        if (!d.blocksMovement) continue;
        const distD = Math.hypot(d.x - this.x, d.y - this.y);
        // If structure is very close (< 45px) or significantly closer than player
        if (distD < 45 || distD < targetDist * 0.7) {
          target = d;
          targetDist = distD;
          isStructureTarget = true;
          break;
        }
      }
    }

    if (!target) return;

    // ----------------------------------------------------
    // KAMIKAZE EXPLODER AI
    // ----------------------------------------------------
    if (this.isKamikaze) {
      if (targetDist <= 28) {
        this.detonate(player, world, world.game ? world.game.particles : [], world.game ? world.game.floatingTexts : []);
        return;
      }
      // Rush towards target at high speed
      const angle = Math.atan2(target.y - this.y, target.x - this.x);
      const curSpeed = this.speed * this.slowFactor;
      this.x += Math.cos(angle) * curSpeed * dt;
      this.y += Math.sin(angle) * curSpeed * dt;
      return;
    }

    // ----------------------------------------------------
    // ACID SPITTER AI (Ranged Kiter)
    // ----------------------------------------------------
    if (this.isRanged) {
      if (targetDist <= this.attackRange && this.attackCooldown <= 0) {
        this.attackCooldown = 1.8;
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const spitSpeed = 260;
        const vx = Math.cos(angle) * spitSpeed;
        const vy = Math.sin(angle) * spitSpeed;
        if (world.game && world.game.projectiles) {
          world.game.projectiles.push(new Projectile(this.x, this.y, vx, vy, this.attackRange + 40, this.damage, 'acid_spit'));
          window.audioManager.playBowShoot();
        }
      } else if (targetDist > this.attackRange * 0.8) {
        // Move into spit range
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const curSpeed = this.speed * this.slowFactor;
        const moveX = Math.cos(angle) * curSpeed * dt;
        const moveY = Math.sin(angle) * curSpeed * dt;
        if (!world.isColliding(this.x + moveX, this.y, this.radius)) this.x += moveX;
        if (!world.isColliding(this.x, this.y + moveY, this.radius)) this.y += moveY;
      }
      return;
    }

    // ----------------------------------------------------
    // MELEE ATTACKERS (Crawler & Titan Behemoth)
    // ----------------------------------------------------
    if (targetDist <= (this.radius + (isStructureTarget ? 16 : 14)) && this.attackCooldown <= 0) {
      this.attackCooldown = this.isBoss ? 1.4 : 1.1;

      if (isStructureTarget) {
        // Attack Defensive Wall / Structure!
        world.game.buildingManager.damageStructure(target, this.damage);
        if (world.game.floatingTexts) {
          world.game.floatingTexts.push(new FloatingText(target.x, target.y - 15, `-${this.damage}`, '#ef4444', 12, 0.8));
        }
      } else {
        // Attack Player
        if (!player.isVaulting && !player.isDashing) {
          player.takeDamage(this.damage);
          player.addInfection(this.isBoss ? 20 : 12, this.name);
          window.audioManager.playHit();
        }
      }
    } else if (targetDist > 16) {
      const angle = Math.atan2(target.y - this.y, target.x - this.x);
      const curSpeed = this.speed * this.slowFactor;
      const moveX = Math.cos(angle) * curSpeed * dt;
      const moveY = Math.sin(angle) * curSpeed * dt;

      // Titan Behemoths can slowly crush blocking walls directly in path
      if (!world.isColliding(this.x + moveX, this.y, this.radius)) {
        this.x += moveX;
      } else if (this.isBoss && world.game && world.game.buildingManager) {
        const blkStruct = world.game.buildingManager.getStructureAt(this.x + moveX, this.y, 24);
        if (blkStruct) world.game.buildingManager.damageStructure(blkStruct, 15 * dt);
      }

      if (!world.isColliding(this.x, this.y + moveY, this.radius)) {
        this.y += moveY;
      } else if (this.isBoss && world.game && world.game.buildingManager) {
        const blkStruct = world.game.buildingManager.getStructureAt(this.x, this.y + moveY, 24);
        if (blkStruct) world.game.buildingManager.damageStructure(blkStruct, 15 * dt);
      }
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + (this.isBoss ? 24 : 14), this.isBoss ? 22 : 12, this.isBoss ? 9 : 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flash white on hit
    if (this.hitFlashTimer > 0) {
      ctx.filter = 'brightness(2.5)';
    }

    // Slow frost tint
    if (this.slowDuration > 0) {
      ctx.fillStyle = 'rgba(165, 243, 252, 0.4)';
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Exploder Pulsing Glow
    if (this.isKamikaze) {
      const pulse = Math.sin(this.pulseTimer) * 0.2 + 0.3;
      ctx.fillStyle = `rgba(234, 88, 12, ${pulse})`;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Proper Pixel Sprite
    let spriteName = 'monster_crawler';
    if (this.species === 'dummy') spriteName = 'monster_dummy';
    else if (this.species === 'exploder') spriteName = 'monster_exploder';
    else if (this.species === 'spitter') spriteName = 'monster_spitter';
    else if (this.species === 'behemoth') spriteName = 'monster_behemoth';

    const sprite = window.pixelArt.get(spriteName);
    if (sprite) {
      const offset = (this.species === 'behemoth') ? 26 : 18;
      ctx.drawImage(sprite, sx - offset, sy - offset);
    }

    ctx.restore();

    // Draw Root Net
    if (this.rootDuration > 0) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 16, sy - 8, 32, 24);
      ctx.beginPath();
      ctx.moveTo(sx - 16, sy - 8); ctx.lineTo(sx + 16, sy + 16);
      ctx.moveTo(sx + 16, sy - 8); ctx.lineTo(sx - 16, sy + 16);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Stun Stars
    if (this.stunDuration > 0) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      const time = Date.now() * 0.006;
      for (let i = 0; i < 3; i++) {
        const starAngle = time + (i * Math.PI * 2 / 3);
        const starX = sx + Math.cos(starAngle) * 14;
        const starY = sy - 22 + Math.sin(starAngle) * 5;
        ctx.fillRect(starX - 2, starY - 2, 4, 4);
      }
      ctx.restore();
    }

    // HP Bar
    const barWidth = this.isBoss ? 44 : 28;
    const barHeight = this.isBoss ? 5 : 4;
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx - barWidth / 2, sy - (this.isBoss ? 34 : 26), barWidth, barHeight);
    
    let hpColor = '#ef4444';
    if (this.species === 'dummy') hpColor = '#f59e0b';
    else if (this.species === 'behemoth') hpColor = '#a855f7';
    else if (this.species === 'exploder') hpColor = '#f97316';
    else if (this.species === 'spitter') hpColor = '#84cc16';

    ctx.fillStyle = hpColor;
    ctx.fillRect(sx - barWidth / 2, sy - (this.isBoss ? 34 : 26), barWidth * hpPercent, barHeight);
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;

    // Movement
    this.baseSpeed = CONSTANTS.PLAYER_BASE.MOVE_SPEED; // 180
    this.speedBonus = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'down';
    this.aimAngle = 0;
    this.walkFrame = 0;
    this.walkAnimTimer = 0;

    // Survival Stats
    this.maxHp = CONSTANTS.PLAYER_BASE.MAX_HP;
    this.hp = this.maxHp;
    this.infection = 0; // 0% - 100%
    this.armor = CONSTANTS.PLAYER_BASE.BASE_ARMOR;
    this.toxinResist = CONSTANTS.PLAYER_BASE.BASE_TOXIN_RESIST;

    // Skills & Cooldowns
    this.dashCooldown = CONSTANTS.PLAYER_BASE.DASH_COOLDOWN; // 3.0s
    this.dashTimer = 0;
    this.isDashing = false;
    this.dashDuration = 0;
    this.dashVx = 0;
    this.dashVy = 0;

    // Active weapon key: 'SPEAR', 'STAFF', 'DAGGER', 'BOW'
    this.activeWeapon = 'SPEAR';
    this.attackCooldownTimer = 0;
    this.skill1CooldownTimer = 0;
    this.skill2CooldownTimer = 0;

    // Phase 2: Infection Immunity & Life State
    this.immunityTimer = 0; // Granted by Pure Antibody Elixir
    this.invulnerableTimer = 0; // Hit grace invulnerability
    this.infectionCooldownTimer = 0; // Prevent infection spike
    this.isDead = false;

    // Escape Skill States
    this.isStealthed = false;
    this.stealthTimer = 0;

    this.isVaulting = false;
    this.vaultTimer = 0;
    this.vaultMaxTime = 0.45;
    this.vaultStartX = 0;
    this.vaultStartY = 0;
    this.vaultTargetX = 0;
    this.vaultTargetY = 0;
    this.vaultHeight = 0;

    this.speedBoostTimer = 0;
    this.speedBoostMultiplier = 1.0;

    // Dash trail ghosts
    this.ghosts = [];
  }

  getEffectiveSpeed() {
    let speed = (this.baseSpeed + this.speedBonus) * this.speedBoostMultiplier;
    return speed;
  }

  triggerDash(keys, mouseWorldX, mouseWorldY, particles, floatingTexts) {
    if (this.dashTimer > 0 || this.isDashing || this.isVaulting) return false;

    // Determine dash direction from movement keys, joystick, or towards mouse
    let dx = 0;
    let dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    if (window.gameEngine && window.gameEngine.mobileController) {
      const jv = window.gameEngine.mobileController.moveVector;
      if (jv && (jv.x !== 0 || jv.y !== 0)) {
        dx = jv.x;
        dy = jv.y;
      }
    }

    if (dx === 0 && dy === 0) {
      // Dash towards mouse
      const angle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);
      dx = Math.cos(angle);
      dy = Math.sin(angle);
    } else {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    this.isDashing = true;
    this.dashDuration = CONSTANTS.PLAYER_BASE.DASH_DURATION;
    this.dashTimer = CONSTANTS.PLAYER_BASE.DASH_COOLDOWN;
    this.dashVx = dx * CONSTANTS.PLAYER_BASE.DASH_SPEED;
    this.dashVy = dy * CONSTANTS.PLAYER_BASE.DASH_SPEED;

    window.audioManager.playDash();
    floatingTexts.push(new FloatingText(this.x, this.y - 20, 'DASH!', '#38bdf8', 12, 0.6));

    // Particle burst
    for (let i = 0; i < 8; i++) {
      particles.push(new Particle(this.x, this.y, -dx * 80 + (Math.random() - 0.5) * 40, -dy * 80 + (Math.random() - 0.5) * 40, '#0284c7', 4, 0.25));
    }

    return true;
  }

  update(dt, keys, mouseWorldX, mouseWorldY, world, particles, floatingTexts) {
    // Cooldown timers
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;
    if (this.skill1CooldownTimer > 0) this.skill1CooldownTimer -= dt;
    if (this.skill2CooldownTimer > 0) this.skill2CooldownTimer -= dt;

    // Status effect timers
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.infectionCooldownTimer > 0) this.infectionCooldownTimer -= dt;

    if (this.immunityTimer > 0) {
      this.immunityTimer -= dt;
      if (this.immunityTimer <= 0) {
        floatingTexts.push(new FloatingText(this.x, this.y - 25, 'HẾT HIỆU LỰC KHÁNG ĐỘC', '#94a3b8', 11, 1.0));
      }
    }

    if (this.stealthTimer > 0) {
      this.stealthTimer -= dt;
      if (this.stealthTimer <= 0) {
        this.isStealthed = false;
        floatingTexts.push(new FloatingText(this.x, this.y - 20, 'STEALTH END', '#94a3b8', 11, 0.8));
      }
    }

    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) {
        this.speedBoostMultiplier = 1.0;
      }
    }

    // Check full 100% infection fatality
    if (this.infection >= 100 && !this.isDead) {
      this.isDead = true;
      if (window.gameEngine) {
        window.gameEngine.triggerGameOver('infection');
      }
    }

    // Aim angle towards mouse
    this.aimAngle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);

    // Update ghost afterimages
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      this.ghosts[i].alpha -= dt * 3.5;
      if (this.ghosts[i].alpha <= 0) {
        this.ghosts.splice(i, 1);
      }
    }

    // 1. Pole Vault Leap Handling
    if (this.isVaulting) {
      this.vaultTimer += dt;
      const progress = Math.min(1.0, this.vaultTimer / this.vaultMaxTime);

      // Arc height
      this.vaultHeight = Math.sin(progress * Math.PI) * 45;

      this.x = this.vaultStartX + (this.vaultTargetX - this.vaultStartX) * progress;
      this.y = this.vaultStartY + (this.vaultTargetY - this.vaultStartY) * progress;

      // Spawn dust particle during flight
      if (Math.random() < 0.35) {
        particles.push(new Particle(this.x, this.y + 12, 0, -10, '#cbd5e1', 3, 0.2));
      }

      if (progress >= 1.0) {
        this.isVaulting = false;
        this.vaultHeight = 0;
        // Landing dust impact
        particles.push(new Particle(this.x, this.y + 8, 0, 0, '#94a3b8', 35, 0.35, 'ring'));
        floatingTexts.push(new FloatingText(this.x, this.y - 20, 'LANDING!', '#38bdf8', 12, 0.8));
      }
      return;
    }

    // 2. Dash Handling
    if (this.isDashing) {
      this.dashDuration -= dt;
      const nextX = this.x + this.dashVx * dt;
      const nextY = this.y + this.dashVy * dt;

      // During stealth or dash, allow lenient collision
      if (this.isStealthed || !world.isColliding(nextX, this.y, this.radius)) this.x = nextX;
      if (this.isStealthed || !world.isColliding(this.x, nextY, this.radius)) this.y = nextY;

      // Leave ghost afterimage
      this.ghosts.push({
        x: this.x,
        y: this.y,
        dir: this.facing,
        frame: this.walkFrame,
        alpha: 0.6
      });

      if (this.dashDuration <= 0) {
        this.isDashing = false;
      }
      return;
    }

    // 3. Normal Movement
    let dx = 0;
    let dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    // Check Mobile Virtual Joystick input
    if (world && world.game && world.game.mobileController) {
      const jv = world.game.mobileController.moveVector;
      if (jv && (jv.x !== 0 || jv.y !== 0)) {
        dx = jv.x;
        dy = jv.y;
      }
    }

    const isMoving = (dx !== 0 || dy !== 0);

    if (isMoving) {
      const len = Math.hypot(dx, dy);
      const speed = this.getEffectiveSpeed();
      const moveX = (dx / len) * speed * dt;
      const moveY = (dy / len) * speed * dt;

      // Collision checks (ignore if stealthed)
      if (this.isStealthed || !world.isColliding(this.x + moveX, this.y, this.radius)) {
        this.x += moveX;
      }
      if (this.isStealthed || !world.isColliding(this.x, this.y + moveY, this.radius)) {
        this.y += moveY;
      }

      // Determine facing
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = 'side';
      } else if (dy < 0) {
        this.facing = 'up';
      } else {
        this.facing = 'down';
      }

      // Walk animation
      this.walkAnimTimer += dt * 10;
      if (this.walkAnimTimer >= 1.0) {
        this.walkAnimTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 3;
      }
    } else {
      this.walkFrame = 0;
      // Facing follows mouse when idle
      const deg = (this.aimAngle * 180 / Math.PI + 360) % 360;
      if (deg > 45 && deg <= 135) this.facing = 'down';
      else if (deg > 135 && deg <= 225) this.facing = 'side';
      else if (deg > 225 && deg <= 315) this.facing = 'up';
      else this.facing = 'side';
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y - this.vaultHeight;

    // Render Ghost trails
    for (let g of this.ghosts) {
      const gx = g.x - camera.x;
      const gy = g.y - camera.y;
      const spr = window.pixelArt.get(`player_${g.dir}_${g.frame}`);
      if (spr) {
        ctx.save();
        ctx.globalAlpha = g.alpha * 0.45;
        ctx.drawImage(spr, gx - 16, gy - 16);
        ctx.restore();
      }
    }

    ctx.save();

    // Shadow under player (stays on ground during vault)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    const shadowScale = Math.max(0.5, 1 - (this.vaultHeight / 60));
    ctx.ellipse(this.x - camera.x, this.y - camera.y + 12, 10 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stealth transparency
    if (this.isStealthed) {
      ctx.globalAlpha = 0.35;
    }

    // Direction flip for left vs right
    const facingLeft = Math.cos(this.aimAngle) < 0;

    ctx.save();
    ctx.translate(sx, sy);
    if (facingLeft && this.facing === 'side') {
      ctx.scale(-1, 1);
    }

    // Draw Player Sprite
    const playerSprite = window.pixelArt.get(`player_${this.facing}_${this.walkFrame}`);
    if (playerSprite) {
      ctx.drawImage(playerSprite, -16, -16);
    }
    ctx.restore();

    // Draw Held Weapon aimed at cursor
    this.renderHeldWeapon(ctx, sx, sy, facingLeft);

    ctx.restore();
  }

  renderHeldWeapon(ctx, sx, sy, facingLeft) {
    const weaponConfig = CONSTANTS.WEAPONS[this.activeWeapon];
    if (!weaponConfig) return;

    const sprite = window.pixelArt.get(`weapon_${weaponConfig.id}`);
    if (!sprite) return;

    ctx.save();
    ctx.translate(sx, sy + 3);
    ctx.rotate(this.aimAngle);

    if (weaponConfig.id === 'spear') {
      // Long spear extending forward
      ctx.drawImage(sprite, 8, -16);
    } else if (weaponConfig.id === 'staff') {
      ctx.drawImage(sprite, 6, -16);
    } else if (weaponConfig.id === 'dagger') {
      ctx.drawImage(sprite, 4, -14);
    } else if (weaponConfig.id === 'bow') {
      ctx.drawImage(sprite, 6, -16);
    }
    ctx.restore();
  }

  takeDamage(amount) {
    if (this.isDead || this.isVaulting || this.isDashing || this.invulnerableTimer > 0) return;
    const mitigated = Math.max(1, amount - this.armor);
    this.hp -= mitigated;
    this.invulnerableTimer = 0.45; // brief hit invulnerability

    if (window.gameEngine && window.gameEngine.floatingTexts) {
      window.gameEngine.floatingTexts.push(new FloatingText(this.x, this.y - 20, `-${mitigated} HP`, '#ef4444', 13, 0.8));
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      if (window.gameEngine) {
        window.gameEngine.triggerGameOver('damage');
      }
    }
  }

  addInfection(amount, sourceText = '', showFloat = true) {
    if (this.isDead) return;

    if (this.immunityTimer > 0) {
      if (showFloat && sourceText && window.gameEngine && window.gameEngine.floatingTexts) {
        window.gameEngine.floatingTexts.push(new FloatingText(this.x, this.y - 25, 'MIỄN NHIỄM ĐỘC TỐ!', '#38bdf8', 11, 0.7));
      }
      return;
    }

    // Cooldown on monster attack infection spikes
    if (sourceText && this.infectionCooldownTimer > 0) return;
    if (sourceText) this.infectionCooldownTimer = 0.8;

    // Toxin resistance reduces incoming infection
    const effective = amount * Math.max(0.1, 1 - (this.toxinResist / 100));
    this.infection = Math.min(100, this.infection + effective);

    if (showFloat && sourceText && window.gameEngine && window.gameEngine.floatingTexts) {
      const text = `+${Math.round(effective)}% ĐỘC TỐ (${sourceText})`;
      window.gameEngine.floatingTexts.push(new FloatingText(this.x, this.y - 25, text, '#d946ef', 12, 1.0));
    }

    if (this.infection >= 100) {
      this.infection = 100;
      this.isDead = true;
      if (window.gameEngine) {
        window.gameEngine.triggerGameOver('infection');
      }
    }
  }

  respawn(spawnX, spawnY) {
    this.x = spawnX;
    this.y = spawnY;
    this.hp = this.maxHp;
    this.infection = 0; // Completely cleansed inside sterile Bio-Lab!
    this.isDead = false;
    this.immunityTimer = 15; // 15s grace immunity after respawn
    this.invulnerableTimer = 3; // 3s grace invulnerability
  }
}

// Global entities registry
window.Particle = Particle;
window.FloatingText = FloatingText;
window.Projectile = Projectile;
window.Monster = Monster;
window.Player = Player;
