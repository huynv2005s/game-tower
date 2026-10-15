// Entities: Player, Monsters/Dummies, Projectiles, Particles, Floating Combat Text
// Optimized for 60FPS Canvas Rendering (Frustum Culling, Zero ctx.filter, Cached Gradients)

class Particle {
  constructor(x, y, vx, vy, color, size, life, shape = 'circle', extra = null) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.shape = shape;
    this.extra = extra;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    if (sx < -120 || sx > camera.width + 120 || sy < -120 || sy > camera.height + 120) return;

    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.shape === 'circle') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(sx, sy, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(sx, sy, this.size * (0.4 + (1 - alpha) * 0.7), 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.shape === 'lightning' && this.extra) {
      const ex = this.extra.x2 - camera.x;
      const ey = this.extra.y2 - camera.y;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo((sx + ex) * 0.5 + (Math.random() - 0.5) * 12, (sy + ey) * 0.5 + (Math.random() - 0.5) * 12);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
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
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    if (sx < -150 || sx > camera.width + 150 || sy < -60 || sy > camera.height + 60) return;

    const alpha = Math.max(0, this.duration / this.maxDuration);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${this.fontSize}px 'Chakra Petch', 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#000000';
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
    this.type = type; // 'arrow', 'net_arrow', 'recoil_blast', 'acid_spit', 'plasma_bullet', 'emp_blast', 'turret_railgun'
    this.extra = extra || {};
    this.radius = (type === 'emp_blast') ? 9 : 6;
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

    if (this.type === 'acid_spit' || this.type === 'frost_spit') {
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
        const defs = world.game.buildingManager.defenses;
        for (let i = 0; i < defs.length; i++) {
          const d = defs[i];
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
      for (let i = 0; i < monsters.length; i++) {
        const m = monsters[i];
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

    if (this.type === 'arrow' || this.type === 'plasma_bullet') {
      if (hitTarget) {
        hitTarget.takeDamage(this.damage, particles, floatingTexts);
      }
      if (particles.length < 160) {
        const col = (this.extra && this.extra.color) ? this.extra.color : (this.type === 'plasma_bullet' ? '#38bdf8' : '#ffb74d');
        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 40 + Math.random() * 55;
          particles.push(new Particle(this.x, this.y, Math.cos(angle) * spd, Math.sin(angle) * spd, col, 3, 0.2));
        }
      }
    } else if (this.type === 'turret_railgun') {
      // Lv.3 Railgun Tesla Shot: High impact + Chain Lightning to nearby monsters!
      if (hitTarget) {
        hitTarget.takeDamage(this.damage, particles, floatingTexts);
        hitTarget.applySlow(0.6, 2.0, floatingTexts);
      }
      particles.push(new Particle(this.x, this.y, 0, 0, '#facc15', 24, 0.25, 'ring'));

      const maxChains = (this.extra && this.extra.chainCount) ? this.extra.chainCount : 2;
      let chained = 0;
      const chainDamage = Math.max(8, Math.round(this.damage * 0.55));

      for (let i = 0; i < monsters.length; i++) {
        const m = monsters[i];
        if (m.isDead || m === hitTarget) continue;
        const dist = Math.hypot(m.x - this.x, m.y - this.y);
        if (dist <= 95) {
          m.takeDamage(chainDamage, particles, floatingTexts);
          m.applySlow(0.6, 1.8, floatingTexts);
          particles.push(new Particle(this.x, this.y, 0, 0, '#38bdf8', 2, 0.22, 'lightning', { x2: m.x, y2: m.y }));
          chained++;
          if (chained >= maxChains) break;
        }
      }
    } else if (this.type === 'emp_blast') {
      // Plasma Gun Skill 1 [Q]: EMP Overcharge AoE Stun!
      const empRadius = 95;
      window.audioManager.playStaffStun();
      particles.push(new Particle(this.x, this.y, 0, 0, '#38bdf8', empRadius, 0.5, 'ring'));
      particles.push(new Particle(this.x, this.y, 0, 0, '#facc15', empRadius * 0.65, 0.35, 'ring'));

      if (floatingTexts.length < 40) {
        floatingTexts.push(new FloatingText(this.x, this.y - 15, '⚡ XUNG ĐIỆN EMP! ⚡', '#38bdf8', 13, 1.1));
      }

      for (let m of monsters) {
        if (m.isDead) continue;
        const dist = Math.hypot(m.x - this.x, m.y - this.y);
        if (dist <= empRadius) {
          m.takeDamage(this.damage, particles, floatingTexts);
          m.applyStun(1.8, floatingTexts);
        }
      }
    } else if (this.type === 'net_arrow') {
      const rootRadius = 90;
      floatingTexts.push(new FloatingText(this.x, this.y - 10, 'NET EXPAND!', '#38bdf8', 12, 1.2));
      window.audioManager.playBowNet();
      particles.push(new Particle(this.x, this.y, 0, 0, '#38bdf8', rootRadius, 0.6, 'ring'));

      for (let m of monsters) {
        if (m.isDead) continue;
        const dist = Math.hypot(m.x - this.x, m.y - this.y);
        if (dist <= rootRadius) {
          m.applyRoot(2.5, floatingTexts);
          m.takeDamage(this.damage, particles, floatingTexts);
        }
      }
    } else if (this.type === 'recoil_blast') {
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
      if (hitTarget) {
        if (hitTarget.takeDamage) {
          hitTarget.takeDamage(this.damage);
          if (hitTarget.applySlow) {
            const sf = (this.extra && this.extra.slowFactor) ? this.extra.slowFactor : 0.72;
            const sd = (this.extra && this.extra.slowDuration) ? this.extra.slowDuration : 1.8;
            hitTarget.applySlow(sf, sd, 'AXIT LÀM CHẬM');
          }
          if (hitTarget.addInfection) hitTarget.addInfection(10, 'AXIT ĂN MÒN');
        }
      }
      if (particles.length < 160) {
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * Math.PI * 2;
          const spd = 30 + Math.random() * 50;
          particles.push(new Particle(this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd, '#84cc16', 3, 0.25));
        }
      }
      window.audioManager.playHit();
    } else if (this.type === 'frost_spit') {
      if (hitTarget) {
        if (hitTarget.takeDamage) {
          hitTarget.takeDamage(this.damage);
          if (hitTarget.applySlow) {
            const sf = (this.extra && this.extra.slowFactor) ? this.extra.slowFactor : 0.50;
            const sd = (this.extra && this.extra.slowDuration) ? this.extra.slowDuration : 3.0;
            hitTarget.applySlow(sf, sd, 'TƠ BĂNG HÀN');
          }
          if (hitTarget.addInfection) hitTarget.addInfection(6, 'TƠ BĂNG HÀN');
        }
      }
      if (particles.length < 160) {
        particles.push(new Particle(this.x, this.y, 0, 0, '#38bdf8', 22, 0.3, 'ring'));
        for (let i = 0; i < 7; i++) {
          const a = Math.random() * Math.PI * 2;
          const spd = 35 + Math.random() * 55;
          particles.push(new Particle(this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd, (i % 2 === 0) ? '#67e8f9' : '#0284c7', 3.2, 0.28));
        }
      }
      window.audioManager.playHit();
    } else if (this.type === 'pet_arrow') {
      if (hitTarget) {
        hitTarget.takeDamage(this.damage, particles, floatingTexts);
        hitTarget.applySlow(0.7, 1.5, floatingTexts);
      }
      if (particles.length < 160) {
        const col = (this.extra && this.extra.isCritArrow) ? '#facc15' : '#ffb74d';
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * Math.PI * 2;
          const spd = 35 + Math.random() * 45;
          particles.push(new Particle(this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd, col, 3, 0.2));
        }
      }
    } else if (this.type === 'pet_bio_shot') {
      if (hitTarget) {
        hitTarget.takeDamage(this.damage, particles, floatingTexts);
      }
      const p = (world && world.game) ? world.game.player : null;
      if (p && !p.isDead && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + 2);
      }
      if (particles.length < 160) {
        particles.push(new Particle(this.x, this.y, 0, 0, '#4ade80', 14, 0.22, 'ring'));
      }
    } else if (this.type === 'pet_cleanse_shot') {
      if (hitTarget) {
        hitTarget.takeDamage(this.damage, particles, floatingTexts);
        hitTarget.applySlow(0.7, 2.0, floatingTexts);
      }
      const p = (world && world.game) ? world.game.player : null;
      if (p && !p.isDead && p.infection > 0) {
        p.infection = Math.max(0, p.infection - 1.5);
      }
      if (particles.length < 160) {
        particles.push(new Particle(this.x, this.y, 0, 0, '#c084fc', 14, 0.22, 'ring'));
      }
    } else if (this.type === 'pet_frost_bolt') {
      if (hitTarget) {
        hitTarget.takeDamage(this.damage, particles, floatingTexts);
        hitTarget.applySlow(0.45, 2.5, floatingTexts);
        if (Math.random() < 0.35) {
          hitTarget.applyStun(1.2, floatingTexts);
        }
      }
      if (particles.length < 160) {
        particles.push(new Particle(this.x, this.y, 0, 0, '#38bdf8', 18, 0.25, 'ring'));
      }
    } else if (this.type === 'pet_plasma_bolt') {
      if (hitTarget) {
        hitTarget.takeDamage(this.damage, particles, floatingTexts);
      }
      if (particles.length < 160) {
        particles.push(new Particle(this.x, this.y, 0, 0, '#facc15', 18, 0.22, 'ring'));
      }
      let chained = 0;
      const chainDmg = Math.max(6, Math.round(this.damage * 0.5));
      for (let i = 0; i < monsters.length; i++) {
        const m = monsters[i];
        if (m.isDead || m === hitTarget) continue;
        if (Math.hypot(m.x - this.x, m.y - this.y) <= 85) {
          m.takeDamage(chainDmg, particles, floatingTexts);
          particles.push(new Particle(this.x, this.y, 0, 0, '#38bdf8', 2, 0.2, 'lightning', { x2: m.x, y2: m.y }));
          chained++;
          if (chained >= 2) break;
        }
      }
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    if (sx < -40 || sx > camera.width + 40 || sy < -40 || sy > camera.height + 40) return;

    ctx.save();
    ctx.translate(sx, sy);
    const angle = Math.atan2(this.vy, this.vx);
    ctx.rotate(angle);

    if (this.type === 'arrow' || this.type === 'pet_arrow') {
      const isCrit = this.extra && this.extra.isCritArrow;
      ctx.fillStyle = isCrit ? '#facc15' : '#ffb74d';
      ctx.fillRect(-8, -1.5, 16, 3);
      ctx.fillStyle = isCrit ? '#ef4444' : '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(4, -4.5);
      ctx.lineTo(4, 4.5);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'pet_bio_shot' || this.type === 'pet_cleanse_shot') {
      const col = this.type === 'pet_bio_shot' ? '#4ade80' : '#c084fc';
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(1, 0, 2.2, 0, Math.PI * 2); ctx.fill();
    } else if (this.type === 'pet_frost_bolt') {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(8, 0); ctx.lineTo(-5, -4); ctx.lineTo(-2, 0); ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(-3, -1, 8, 2);
    } else if (this.type === 'pet_plasma_bolt') {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-9, -2.5, 18, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-6, -1.2, 13, 2.4);
    } else if (this.type === 'plasma_bullet') {
      const col = (this.extra && this.extra.color) ? this.extra.color : '#38bdf8';
      ctx.fillStyle = col;
      ctx.fillRect(-9, -2.5, 18, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -1, 14, 2);
    } else if (this.type === 'turret_railgun') {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-11, -3, 22, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-8, -1.8, 18, 3.6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-5, -1, 14, 2);
    } else if (this.type === 'emp_blast') {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    } else if (this.type === 'net_arrow') {
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-6, -4, 12, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-6, -4, 12, 8);
    } else if (this.type === 'recoil_blast') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(2, 0, 5, 0, Math.PI * 2); ctx.fill();
    } else if (this.type === 'acid_spit') {
      ctx.fillStyle = '#84cc16';
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#bef264';
      ctx.fillRect(-2, -2, 4, 4);
    } else if (this.type === 'frost_spit') {
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, -5);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(1, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class Monster {
  constructor(x, y, species = 'crawler', customName = null, customHp = null) {
    this.species = species;
    this.type = species;

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
    this.slowPlayerFactor = cfg.slowPlayerFactor || (species === 'frost_spitter' ? 0.50 : 0.72);
    this.slowPlayerDuration = cfg.slowPlayerDuration || (species === 'frost_spitter' ? 3.0 : 1.8);
    this.isDead = false;

    // Ensure monster never spawns inside water, cliffs, or walls
    if (species !== 'dummy' && window.gameEngine && window.gameEngine.world && window.gameEngine.world.findSafeSpawnPoint) {
      const safePos = window.gameEngine.world.findSafeSpawnPoint(x, y, this.radius);
      this.x = safePos.x;
      this.y = safePos.y;
    } else {
      this.x = x;
      this.y = y;
    }
    this.vx = 0;
    this.vy = 0;

    // Crowd Control & Status
    this.stunDuration = 0;
    this.rootDuration = 0;
    this.slowDuration = 0;
    this.slowFactor = 1.0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.knockbackDuration = 0;

    // Smart Corner-Free Steering & Anti-Stuck State
    this.steerDir = Math.random() < 0.5 ? 1 : -1;
    this.steerLockTimer = 0;
    this.unstuckGhostTimer = 0;
    this.escapeAngle = null;
    this.anchorX = this.x;
    this.anchorY = this.y;
    this.anchorTimer = Math.random() * 0.3;

    this.hitFlashTimer = 0;
    this.attackCooldown = 0;
    this.pulseTimer = Math.random() * 6.28;
  }

  grantLootDrops(floatingTexts) {
    if (this.species === 'dummy') return;
    const game = window.gameEngine;
    if (!game || !game.inventory) return;

    const weather = (game.dayNight && game.dayNight.currentWeather) ? game.dayNight.currentWeather : 'CLEAR';
    const isBloodMoon = (game.dayNight && game.dayNight.isBloodMoonDay && game.dayNight.isBloodMoonDay()) || weather === 'BLOOD_MOON';
    const mult = isBloodMoon ? 2 : 1;

    if (this.isBoss) {
      game.inventory.addItem('alien_chitin', 3 * mult);
      game.inventory.addItem('titanium_alloy', 2 * mult);
      game.inventory.addItem('plasma_core', 1 * mult);
      game.inventory.addItem('monster_egg', 1 * mult);
      if (floatingTexts.length < 40) {
        floatingTexts.push(new FloatingText(this.x, this.y - 38, `🎁 +${1 * mult} TRỨNG, +${3 * mult} GIÁP XÁC, +${2 * mult} TITAN, +${1 * mult} PLASMA!`, '#facc15', 12, 2.0));
      }
    } else {
      const chitinGain = (weather === 'ACID_RAIN') ? (2 * mult) : (1 * mult);
      game.inventory.addItem('alien_chitin', chitinGain);
      let bonusText = `+${chitinGain} Giáp Xác`;

      if (weather === 'ACID_RAIN' && Math.random() < 0.65) {
        game.inventory.addItem('egg_fluid', 1 * mult);
        bonusText += ` & 🧪 +${1 * mult} Dịch Trứng`;
      } else if (weather === 'EMP_STORM' && Math.random() < 0.55) {
        game.inventory.addItem('tech_scrap', 1 * mult);
        bonusText += ` & ⚡ +${1 * mult} Mảnh Công Nghệ`;
        if (Math.random() < 0.22) {
          game.inventory.addItem('plasma_core', 1);
          bonusText += ` & 🔮 +1 Lõi Plasma!`;
        }
      }

      if (Math.random() < (isBloodMoon ? 0.65 : 0.35)) {
        const extraItem = (this.species === 'exploder') ? 'sulfur_dust' : (this.species === 'frost_spitter' ? 'quartz_crystal' : 'iron_ore');
        game.inventory.addItem(extraItem, 1 * mult);
        const def = CONSTANTS.ITEM_TYPES[extraItem];
        if (def) bonusText += ` & +${1 * mult} ${def.name}`;
      }
      if (Math.random() < (isBloodMoon ? 0.50 : 0.28)) {
        game.inventory.addItem('monster_egg', 1);
        bonusText += ' & 🥚 +1 Trứng Quái Vật!';
      }
      if (floatingTexts.length < 40) {
        floatingTexts.push(new FloatingText(this.x, this.y - 26, bonusText, isBloodMoon ? '#facc15' : '#c084fc', 11, 1.2));
      }
    }
  }

  takeDamage(amount, particles, floatingTexts) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hitFlashTimer = 0.11;

    window.audioManager.playHit();
    if (floatingTexts.length < 42) {
      floatingTexts.push(new FloatingText(this.x + (Math.random() - 0.5) * 16, this.y - 15, `-${Math.round(amount)}`, '#ef4444', 13));
    }

    // Blood / Alien acid splatter (capped for performance)
    if (particles.length < 160) {
      const bloodColor = (this.species === 'spitter') ? '#84cc16' : (this.species === 'frost_spitter' ? '#38bdf8' : (this.species === 'exploder' ? '#ea580c' : '#a855f7'));
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 30 + Math.random() * 50;
        particles.push(new Particle(this.x, this.y, Math.cos(a) * s, Math.sin(a) * s, bloodColor, 3, 0.25));
      }
    }

    if (this.hp <= 0) {
      if (this.isKamikaze && !this.isDead) {
        this.grantLootDrops(floatingTexts);
        this.detonate(window.gameEngine ? window.gameEngine.player : null, window.gameEngine ? window.gameEngine.world : null, particles, floatingTexts);
      } else {
        this.isDead = true;
        this.grantLootDrops(floatingTexts);
        if (particles.length < 170) {
          for (let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 40 + Math.random() * 80;
            particles.push(new Particle(this.x, this.y, Math.cos(a) * s, Math.sin(a) * s, '#ec4899', 4, 0.4));
          }
        }
      }
    }
  }

  detonate(player, world, particles, floatingTexts) {
    if (this.isDead) return;
    this.isDead = true;
    window.audioManager.playBowRecoil();

    const blastRadius = 55;
    particles.push(new Particle(this.x, this.y, 0, 0, '#ef4444', blastRadius, 0.45, 'ring'));
    particles.push(new Particle(this.x, this.y, 0, 0, '#f97316', blastRadius * 0.7, 0.32, 'ring'));

    if (particles.length < 170) {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 80;
        particles.push(new Particle(this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd, (i % 2 === 0) ? '#fde047' : '#ea580c', 4, 0.35));
      }
    }

    if (floatingTexts.length < 40) {
      floatingTexts.push(new FloatingText(this.x, this.y - 20, '💥 CẢM TỬ NỔ TUNG! 💥', '#ef4444', 12, 1.2));
    }

    if (player && !player.isDead) {
      const distP = Math.hypot(player.x - this.x, player.y - this.y);
      if (distP <= blastRadius) {
        player.takeDamage(this.damage);
        player.addInfection(18, 'VỤ NỔ CẢM TỬ');
      }
    }

    if (world && world.game && world.game.buildingManager) {
      for (let d of world.game.buildingManager.defenses) {
        const distD = Math.hypot(d.x - this.x, d.y - this.y);
        if (distD <= blastRadius + 16) {
          world.game.buildingManager.damageStructure(d, this.damage, this);
        }
      }
    }
  }

  applyStun(duration, floatingTexts) {
    this.stunDuration = Math.max(this.stunDuration, duration);
    if (floatingTexts && floatingTexts.length < 40) {
      floatingTexts.push(new FloatingText(this.x, this.y - 30, '★ CHOÁNG! ★', '#facc15', 11, 1.0));
    }
  }

  applyRoot(duration, floatingTexts) {
    this.rootDuration = Math.max(this.rootDuration, duration);
    if (floatingTexts && floatingTexts.length < 40) {
      floatingTexts.push(new FloatingText(this.x, this.y - 30, '🕸 TRÓI CHÂN! 🕸', '#38bdf8', 11, 1.0));
    }
  }

  applySlow(factor, duration, floatingTexts) {
    this.slowFactor = Math.min(this.slowFactor, factor);
    this.slowDuration = Math.max(this.slowDuration, duration);
  }

  applyKnockback(vx, vy, duration = 0.25) {
    this.knockbackVx = vx;
    this.knockbackVy = vy;
    this.knockbackDuration = duration;
  }

  // Smart Obstacle Avoidance, Bridge Waypoint Routing, Whisker Corner-Sliding & Anti-Stuck Recovery
  moveSmart(dt, targetX, targetY, world) {
    if (!world) return;
    if (this.steerLockTimer > 0) this.steerLockTimer -= dt;
    if (this.unstuckGhostTimer > 0) this.unstuckGhostTimer -= dt;

    // 1. Rescue if monster ever gets wedged inside a solid/water tile
    const checkRadius = Math.max(8, (this.unstuckGhostTimer > 0) ? this.radius * 0.55 : this.radius * 0.78);
    if (world.isColliding(this.x, this.y, checkRadius * 0.75) && world.findSafeSpawnPoint) {
      const rescued = world.findSafeSpawnPoint(this.x, this.y, this.radius);
      this.x = rescued.x;
      this.y = rescued.y;
    }

    // 2. Route via nearest wooden bridge if separated from target by the river
    const wp = world.getSmartWaypoint ? world.getSmartWaypoint(this.x, this.y, targetX, targetY) : { x: targetX, y: targetY };
    const desiredAngle = (this.unstuckGhostTimer > 0 && this.escapeAngle !== null)
      ? this.escapeAngle
      : Math.atan2(wp.y - this.y, wp.x - this.x);

    const curSpeed = this.speed * this.slowFactor;
    const stepDist = curSpeed * dt;
    const lookDist = Math.max(stepDist, Math.min(18, this.radius + 6));

    // 3. Multi-Angle Whisker Steering to smoothly curve around wall/cliff/water corners
    let moved = false;
    const directNx = this.x + Math.cos(desiredAngle) * stepDist;
    const directNy = this.y + Math.sin(desiredAngle) * stepDist;
    const directLookX = this.x + Math.cos(desiredAngle) * lookDist;
    const directLookY = this.y + Math.sin(desiredAngle) * lookDist;

    if (!world.isColliding(directNx, directNy, checkRadius) && !world.isColliding(directLookX, directLookY, checkRadius * 0.85)) {
      this.x = directNx;
      this.y = directNy;
      moved = true;
    } else {
      // Test steering whisker angles biased by locked steerDir so monster walks around corners without jittering
      const offsets = [0.42, 0.82, 1.22, 1.58, 2.02, 2.45];
      const dirs = [this.steerDir, -this.steerDir];

      for (let dIdx = 0; dIdx < dirs.length && !moved; dIdx++) {
        const dir = dirs[dIdx];
        for (let i = 0; i < offsets.length; i++) {
          const testAngle = desiredAngle + offsets[i] * dir;
          const nx = this.x + Math.cos(testAngle) * stepDist;
          const ny = this.y + Math.sin(testAngle) * stepDist;
          const lx = this.x + Math.cos(testAngle) * lookDist;
          const ly = this.y + Math.sin(testAngle) * lookDist;

          if (!world.isColliding(nx, ny, checkRadius) && !world.isColliding(lx, ly, checkRadius * 0.8)) {
            this.x = nx;
            this.y = ny;
            if (dIdx === 1 && this.steerLockTimer <= 0) {
              this.steerDir = dir;
            }
            this.steerLockTimer = 0.45;
            moved = true;
            break;
          }
        }
      }
    }

    // 4. Fallback Axis Slide + Corner Chamfer Nudge if tight against a wall
    if (!moved) {
      const moveX = Math.cos(desiredAngle) * stepDist;
      const moveY = Math.sin(desiredAngle) * stepDist;
      const canX = !world.isColliding(this.x + moveX, this.y, checkRadius);
      const canY = !world.isColliding(this.x, this.y + moveY, checkRadius);

      if (canX) {
        this.x += moveX;
        moved = true;
      } else {
        // Blocked in X: apply strong perpendicular slide in Y so it doesn't stall at 90-degree wall faces
        const slideY = (Math.abs(moveY) > stepDist * 0.45) ? moveY : (stepDist * 0.85 * this.steerDir);
        if (!world.isColliding(this.x, this.y + slideY, checkRadius)) {
          this.y += slideY;
          moved = true;
        }
      }

      if (canY && !canX) {
        // Already slid in Y above if needed, or apply normal moveY
      } else if (canY) {
        this.y += moveY;
        moved = true;
      } else if (!moved) {
        // Blocked in Y: apply strong perpendicular slide in X
        const slideX = (Math.abs(moveX) > stepDist * 0.45) ? moveX : (stepDist * 0.85 * this.steerDir);
        if (!world.isColliding(this.x + slideX, this.y, checkRadius)) {
          this.x += slideX;
          moved = true;
        }
      }

      // Bosses crush through player defenses blocking their path
      if (this.isBoss && world.game && world.game.buildingManager) {
        const blkStruct = world.game.buildingManager.getStructureAt(this.x + moveX, this.y + moveY, 28);
        if (blkStruct) world.game.buildingManager.damageStructure(blkStruct, 22 * dt, this);
      }
    }

    // 5. Anti-Stuck Watchdog: Detect if wedged in a concave corner and auto-escape
    this.anchorTimer += dt;
    if (this.anchorTimer >= 0.45) {
      const progressDist = Math.hypot(this.x - this.anchorX, this.y - this.anchorY);
      this.anchorX = this.x;
      this.anchorY = this.y;
      this.anchorTimer = 0;

      if (progressDist < 7) {
        // If blocked by an adjacent player defense structure, attack it immediately
        if (world.game && world.game.buildingManager) {
          const adjDef = world.game.buildingManager.getStructureAt(this.x, this.y, this.radius + 26);
          if (adjDef && adjDef.blocksMovement) {
            world.game.buildingManager.damageStructure(adjDef, this.damage * 0.65, this);
          }
        }

        // Flip steering direction and scan 8 compass directions for an open escape lane
        this.steerDir *= -1;
        this.steerLockTimer = 0.75;
        let bestEscape = desiredAngle + Math.PI * 0.6 * this.steerDir;
        for (let k = 0; k < 8; k++) {
          const candAngle = desiredAngle + ((k % 2 === 0 ? 1 : -1) * Math.ceil((k + 1) / 2) * (Math.PI / 4));
          const testX = this.x + Math.cos(candAngle) * 34;
          const testY = this.y + Math.sin(candAngle) * 34;
          if (!world.isColliding(testX, testY, this.radius * 0.6)) {
            bestEscape = candAngle;
            break;
          }
        }
        this.escapeAngle = bestEscape;
        this.unstuckGhostTimer = 0.6;
        this.x += Math.cos(bestEscape) * 8;
        this.y += Math.sin(bestEscape) * 8;
      }
    }

    // 6. Lightweight Soft Separation so monsters don't stack into a single clump at corners
    if (world.game && world.game.monsters) {
      const list = world.game.monsters;
      const len = list.length;
      const step = Math.max(1, Math.floor(len / 14));
      const startIdx = Math.floor(this.pulseTimer * 3) % step;
      for (let i = startIdx; i < len; i += step) {
        const other = list[i];
        if (!other || other === this || other.isDead || other.species === 'dummy') continue;
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const minDist = (this.radius + other.radius) * 0.78;
        const dSq = dx * dx + dy * dy;
        if (dSq > 0.01 && dSq < minDist * minDist) {
          const d = Math.sqrt(dSq);
          const push = ((minDist - d) / minDist) * 28 * dt;
          const px = this.x + (dx / d) * push;
          const py = this.y + (dy / d) * push;
          if (!world.isColliding(px, py, checkRadius * 0.8)) {
            this.x = px;
            this.y = py;
          }
        }
      }
    }
  }

  update(dt, player, world) {
    if (this.isDead) return;

    this.pulseTimer += dt * 4;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    if (this.stunDuration > 0) this.stunDuration -= dt;
    if (this.rootDuration > 0) this.rootDuration -= dt;
    if (this.slowDuration > 0) {
      this.slowDuration -= dt;
      if (this.slowDuration <= 0) this.slowFactor = 1.0;
    }

    // Knockback physics
    if (this.knockbackDuration > 0) {
      this.knockbackDuration -= dt;
      const nextX = this.x + this.knockbackVx * dt;
      const nextY = this.y + this.knockbackVy * dt;
      if (!world.isColliding(nextX, this.y, this.radius * 0.8)) this.x = nextX;
      if (!world.isColliding(this.x, nextY, this.radius * 0.8)) this.y = nextY;
      this.knockbackVx *= 0.88;
      this.knockbackVy *= 0.88;
      return;
    }

    if (this.stunDuration > 0 || this.rootDuration > 0) return;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.species === 'dummy') return;

    // Target Selection: Player or Nearest Blocking Defensive Structure
    let target = null;
    let targetDist = Infinity;
    let isStructureTarget = false;

    if (player && !player.isStealthed && !player.isDead) {
      target = player;
      targetDist = Math.hypot(player.x - this.x, player.y - this.y);
    }

    // Find the CLOSEST blocking defense structure that intercepts the monster
    if (world && world.game && world.game.buildingManager) {
      const defs = world.game.buildingManager.defenses;
      let bestDef = null;
      let bestDefDist = Infinity;
      for (let i = 0; i < defs.length; i++) {
        const d = defs[i];
        if (!d.blocksMovement) continue;
        const distD = Math.hypot(d.x - this.x, d.y - this.y);
        if (distD < bestDefDist && (distD < 52 || distD < targetDist * 0.65)) {
          bestDef = d;
          bestDefDist = distD;
        }
      }
      if (bestDef) {
        target = bestDef;
        targetDist = bestDefDist;
        isStructureTarget = true;
      }
    }

    if (!target) return;

    // 1. KAMIKAZE EXPLODER AI
    if (this.isKamikaze) {
      if (targetDist <= 30) {
        this.detonate(player, world, world.game ? world.game.particles : [], world.game ? world.game.floatingTexts : []);
        return;
      }
      this.moveSmart(dt, target.x, target.y, world);
      return;
    }

    // 2. RANGED ATTACKERS AI (Acid Spitter & Frost-Web Slowing Spitter)
    if (this.isRanged) {
      if (targetDist <= this.attackRange && this.attackCooldown <= 0) {
        this.attackCooldown = (this.species === 'frost_spitter') ? 1.55 : 1.8;
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const spitSpeed = (this.species === 'frost_spitter') ? 295 : 260;
        const vx = Math.cos(angle) * spitSpeed;
        const vy = Math.sin(angle) * spitSpeed;
        const projType = (this.species === 'frost_spitter') ? 'frost_spit' : 'acid_spit';
        if (world.game && world.game.projectiles) {
          world.game.projectiles.push(new Projectile(
            this.x, this.y, vx, vy,
            this.attackRange + 45,
            this.damage,
            projType,
            { slowFactor: this.slowPlayerFactor, slowDuration: this.slowPlayerDuration }
          ));
          window.audioManager.playBowShoot();
        }
      } else if (targetDist > this.attackRange * 0.78) {
        this.moveSmart(dt, target.x, target.y, world);
      }
      return;
    }

    // 3. MELEE ATTACKERS (Crawler & Titan Behemoth)
    if (targetDist <= (this.radius + (isStructureTarget ? 18 : 15)) && this.attackCooldown <= 0) {
      this.attackCooldown = this.isBoss ? 1.4 : 1.1;

      if (isStructureTarget) {
        world.game.buildingManager.damageStructure(target, this.damage, this);
        if (world.game.floatingTexts && world.game.floatingTexts.length < 40) {
          world.game.floatingTexts.push(new FloatingText(target.x, target.y - 15, `-${this.damage}`, '#ef4444', 12, 0.8));
        }
      } else {
        if (!player.isVaulting && !player.isDashing) {
          player.takeDamage(this.damage);
          player.addInfection(this.isBoss ? 20 : 12, this.name);
          window.audioManager.playHit();
        }
      }
    } else if (targetDist > 16) {
      this.moveSmart(dt, target.x, target.y, world);
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    if (sx < -70 || sx > camera.width + 70 || sy < -70 || sy > camera.height + 70) return;

    ctx.save();

    // 1. Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + (this.isBoss ? 26 : 17), this.isBoss ? 25 : 15, this.isBoss ? 9 : 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boss Juggernaut Ground Ring
    if (this.isBoss) {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 24, 29, 11, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Kamikaze Exploder Pulsing Blast Warning Ring (Uses cached sprite instead of per-frame createRadialGradient!)
    if (this.isKamikaze) {
      const kamGlow = window.pixelArt.get('fx_kamikaze_glow');
      if (kamGlow) {
        ctx.save();
        ctx.globalAlpha = 0.65 + Math.sin(this.pulseTimer * 1.8) * 0.25;
        ctx.drawImage(kamGlow, sx - 32, sy - 32);
        ctx.restore();
      }
    }

    // Slow frost aura
    if (this.slowDuration > 0) {
      ctx.fillStyle = 'rgba(103, 232, 249, 0.35)';
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Realistic Creature Sprite with Organic Scuttle / Breathing Animation
    let spriteName = 'monster_crawler';
    let sprSize = 48;
    if (this.species === 'dummy') spriteName = 'monster_dummy';
    else if (this.species === 'exploder') spriteName = 'monster_exploder';
    else if (this.species === 'spitter') spriteName = 'monster_spitter';
    else if (this.species === 'frost_spitter') spriteName = 'monster_frost_spitter';
    else if (this.species === 'behemoth') {
      spriteName = 'monster_behemoth';
      sprSize = 68;
    }

    const sprite = window.pixelArt.get(spriteName);
    if (sprite) {
      ctx.save();
      ctx.translate(sx, sy);

      if (this.species !== 'dummy' && this.stunDuration <= 0 && this.rootDuration <= 0) {
        const tilt = Math.sin(this.pulseTimer * 2.2) * (this.isBoss ? 0.04 : 0.07);
        const breatheX = 1 + Math.sin(this.pulseTimer * 1.6) * (this.isKamikaze ? 0.08 : 0.03);
        const breatheY = 1 - Math.sin(this.pulseTimer * 1.6) * (this.isKamikaze ? 0.06 : 0.03);
        ctx.rotate(tilt);
        ctx.scale(breatheX, breatheY);
      }

      ctx.drawImage(sprite, -sprSize / 2, -sprSize / 2, sprSize, sprSize);

      // Fast GPU-friendly Hit Flash Overlay (Replaces slow ctx.filter = 'brightness(2.4)')
      if (this.hitFlashTimer > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();

    // 3. Draw Root Energy Net
    if (this.rootDuration > 0) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 18, sy - 12, 36, 28);
      ctx.beginPath();
      ctx.moveTo(sx - 18, sy - 12); ctx.lineTo(sx + 18, sy + 16);
      ctx.moveTo(sx + 18, sy - 12); ctx.lineTo(sx - 18, sy + 16);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Stun Stars
    if (this.stunDuration > 0) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      const time = this.pulseTimer * 1.5;
      for (let i = 0; i < 3; i++) {
        const starAngle = time + (i * Math.PI * 2 / 3);
        const starX = sx + Math.cos(starAngle) * 16;
        const starY = sy - 26 + Math.sin(starAngle) * 5;
        ctx.beginPath();
        ctx.arc(starX, starY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. High-Contrast Framed Health Bar & Species Label
    const barWidth = this.isBoss ? 56 : 36;
    const barHeight = this.isBoss ? 6 : 5;
    const barY = sy - (this.isBoss ? 40 : 28);
    const hpPercent = Math.max(0, this.hp / this.maxHp);

    ctx.fillStyle = 'rgba(9, 13, 22, 0.9)';
    ctx.fillRect(sx - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

    let hpColor = '#ef4444';
    let speciesTag = '🕷 Xenomorph';
    if (this.species === 'dummy') { hpColor = '#f59e0b'; speciesTag = '🎯 Bù Nhìn Tập Luyện'; }
    else if (this.species === 'behemoth') { hpColor = '#c084fc'; speciesTag = '👑 TITAN BEHEMOTH'; }
    else if (this.species === 'exploder') { hpColor = '#f97316'; speciesTag = '💥 Cảm Tử Nổ'; }
    else if (this.species === 'spitter') { hpColor = '#84cc16'; speciesTag = '🧪 Phun Axit'; }
    else if (this.species === 'frost_spitter') { hpColor = '#38bdf8'; speciesTag = '❄️ Xạ Thủ Băng Hàn (Làm Chậm)'; }

    ctx.fillStyle = hpColor;
    ctx.fillRect(sx - barWidth / 2, barY, barWidth * hpPercent, barHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fillRect(sx - barWidth / 2, barY, barWidth * hpPercent, 1.5);

    const game = window.gameEngine;
    const distMouse = (game && game.mouse) ? Math.hypot(game.mouse.worldX - this.x, game.mouse.worldY - this.y) : 9999;
    if (this.isBoss || this.species === 'dummy' || this.hp < this.maxHp || distMouse <= 38) {
      ctx.save();
      ctx.font = 'bold 10px "Segoe UI", Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
      const tw = ctx.measureText(speciesTag).width + 10;
      ctx.fillRect(sx - tw / 2, barY - 16, tw, 13);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(speciesTag, sx, barY - 6.5);
      ctx.restore();
    }
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

    // Active weapon key: 'SPEAR', 'STAFF', 'DAGGER', 'BOW', 'GUN'
    this.activeWeapon = 'SPEAR';
    this.attackCooldownTimer = 0;
    this.skill1CooldownTimer = 0;
    this.skill2CooldownTimer = 0;

    // Phase 2: Infection Immunity & Life State
    this.immunityTimer = 0;
    this.invulnerableTimer = 0;
    this.infectionCooldownTimer = 0;
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

    // Ranged Monster Slow Debuff State
    this.slowTimer = 0;
    this.slowMultiplier = 1.0;
    this.slowTextCooldown = 0;

    // Dash trail ghosts
    this.ghosts = [];
  }

  getEffectiveSpeed() {
    let speed = (this.baseSpeed + this.speedBonus) * this.speedBoostMultiplier;
    if (this.slowTimer > 0) {
      speed *= this.slowMultiplier;
    }
    return speed;
  }

  applySlow(factor = 0.5, duration = 3.0, sourceText = 'ĐẠN LÀM CHẬM') {
    if (this.isDead || this.isVaulting || this.isDashing) return;
    this.slowMultiplier = Math.min(this.slowMultiplier, factor);
    this.slowTimer = Math.max(this.slowTimer, duration);

    if (this.slowTextCooldown <= 0 && window.gameEngine && window.gameEngine.floatingTexts) {
      this.slowTextCooldown = 1.1;
      const pct = Math.round((1 - this.slowMultiplier) * 100);
      window.gameEngine.floatingTexts.push(
        new FloatingText(this.x, this.y - 34, `❄️ CHẬM -${pct}% TỐC CHẠY (${sourceText})!`, '#38bdf8', 12, 1.2)
      );
    }
  }

  triggerDash(keys, mouseWorldX, mouseWorldY, particles, floatingTexts) {
    if (this.dashTimer > 0 || this.isDashing || this.isVaulting) return false;

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

    for (let i = 0; i < 6; i++) {
      particles.push(new Particle(this.x, this.y, -dx * 80 + (Math.random() - 0.5) * 40, -dy * 80 + (Math.random() - 0.5) * 40, '#0284c7', 4, 0.25));
    }

    return true;
  }

  update(dt, keys, mouseWorldX, mouseWorldY, world, particles, floatingTexts) {
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;
    if (this.skill1CooldownTimer > 0) this.skill1CooldownTimer -= dt;
    if (this.skill2CooldownTimer > 0) this.skill2CooldownTimer -= dt;

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.infectionCooldownTimer > 0) this.infectionCooldownTimer -= dt;
    if (this.slowTextCooldown > 0) this.slowTextCooldown -= dt;

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

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (Math.random() < 0.22 && particles && particles.length < 160) {
        particles.push(new Particle(this.x + (Math.random() - 0.5) * 18, this.y + 8, 0, -14, '#67e8f9', 2.5, 0.25));
      }
      if (this.slowTimer <= 0) {
        this.slowTimer = 0;
        this.slowMultiplier = 1.0;
        if (floatingTexts && floatingTexts.length < 40) {
          floatingTexts.push(new FloatingText(this.x, this.y - 22, '⚡ ĐÃ THOÁT LÀM CHẬM!', '#4ade80', 11, 0.8));
        }
      }
    }

    if (this.infection >= 100 && !this.isDead) {
      this.isDead = true;
      if (window.gameEngine) {
        window.gameEngine.triggerGameOver('infection');
      }
    }

    const mc = (world && world.game) ? world.game.mobileController : null;
    if (mc && mc.isUsingTouchAim) {
      if (mc.moveVector && (mc.moveVector.x !== 0 || mc.moveVector.y !== 0)) {
        this.aimAngle = Math.atan2(mc.moveVector.y, mc.moveVector.x);
        mc.lastAimAngle = this.aimAngle;
      } else {
        this.aimAngle = mc.lastAimAngle;
      }
    } else {
      this.aimAngle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);
    }

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

      this.vaultHeight = Math.sin(progress * Math.PI) * 45;
      this.x = this.vaultStartX + (this.vaultTargetX - this.vaultStartX) * progress;
      this.y = this.vaultStartY + (this.vaultTargetY - this.vaultStartY) * progress;

      if (Math.random() < 0.3) {
        particles.push(new Particle(this.x, this.y + 12, 0, -10, '#cbd5e1', 3, 0.2));
      }

      if (progress >= 1.0) {
        this.isVaulting = false;
        this.vaultHeight = 0;
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

      if (this.isStealthed || !world.isColliding(nextX, this.y, this.radius)) this.x = nextX;
      if (this.isStealthed || !world.isColliding(this.x, nextY, this.radius)) this.y = nextY;

      if (this.ghosts.length < 4) {
        this.ghosts.push({
          x: this.x,
          y: this.y,
          dir: this.facing,
          frame: this.walkFrame,
          alpha: 0.55
        });
      }

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

      if (this.isStealthed || !world.isColliding(this.x + moveX, this.y, this.radius)) {
        this.x += moveX;
      }
      if (this.isStealthed || !world.isColliding(this.x, this.y + moveY, this.radius)) {
        this.y += moveY;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = 'side';
      } else if (dy < 0) {
        this.facing = 'up';
      } else {
        this.facing = 'down';
      }

      this.walkAnimTimer += dt * 10;
      if (this.walkAnimTimer >= 1.0) {
        this.walkAnimTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 3;
      }
    } else {
      this.walkFrame = 0;
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
        ctx.drawImage(spr, gx - 20, gy - 24, 40, 44);
        ctx.restore();
      }
    }

    ctx.save();

    const groundX = this.x - camera.x;
    const groundY = this.y - camera.y + 13;
    const shadowScale = Math.max(0.5, 1 - (this.vaultHeight / 60));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(groundX, groundY, 13 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = (this.slowTimer > 0) ? 'rgba(6, 182, 212, 0.85)' : 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = (this.slowTimer > 0) ? 2.4 : 1.5;
    ctx.beginPath();
    ctx.ellipse(groundX, groundY, 15 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Frost-Web Slow Aura around Player when slowed
    if (this.slowTimer > 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(sx, sy, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    const aimTipX = groundX + Math.cos(this.aimAngle) * 22;
    const aimTipY = groundY + Math.sin(this.aimAngle) * 10;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.beginPath();
    ctx.arc(aimTipX, aimTipY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (this.isStealthed) {
      ctx.globalAlpha = 0.38;
    }

    const facingLeft = Math.cos(this.aimAngle) < 0;

    ctx.save();
    ctx.translate(sx, sy);
    if (facingLeft && this.facing === 'side') {
      ctx.scale(-1, 1);
    }

    const playerSprite = window.pixelArt.get(`player_${this.facing}_${this.walkFrame}`);
    if (playerSprite) {
      ctx.drawImage(playerSprite, -20, -24, 40, 44);
    }
    ctx.restore();

    // Draw Held Weapon aimed at cursor
    this.renderHeldWeapon(ctx, sx, sy, facingLeft);

    if (this.immunityTimer > 0 || this.invulnerableTimer > 0) {
      ctx.save();
      const shieldColor = this.invulnerableTimer > 0 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(16, 185, 129, 0.32)';
      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy - 2, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.slowTimer > 0) {
      ctx.save();
      ctx.font = 'bold 10px "Segoe UI", Tahoma, sans-serif';
      ctx.textAlign = 'center';
      const slowPct = Math.round((1 - this.slowMultiplier) * 100);
      const badgeTxt = `❄️ CHẬM -${slowPct}% (${this.slowTimer.toFixed(1)}s)`;
      const tw = ctx.measureText(badgeTxt).width + 10;
      ctx.fillStyle = 'rgba(8, 47, 73, 0.88)';
      ctx.fillRect(sx - tw / 2, sy - 39, tw, 14);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - tw / 2, sy - 39, tw, 14);
      ctx.fillStyle = '#67e8f9';
      ctx.fillText(badgeTxt, sx, sy - 29);
      ctx.restore();
    }

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
      ctx.drawImage(sprite, 8, -16);
    } else if (weaponConfig.id === 'staff') {
      ctx.drawImage(sprite, 6, -16);
    } else if (weaponConfig.id === 'dagger') {
      ctx.drawImage(sprite, 4, -14);
    } else if (weaponConfig.id === 'bow') {
      ctx.drawImage(sprite, 6, -16);
    } else if (weaponConfig.id === 'gun') {
      ctx.drawImage(sprite, 4, -15);
    }
    ctx.restore();
  }

  takeDamage(amount) {
    if (this.isDead || this.isVaulting || this.isDashing || this.invulnerableTimer > 0) return;
    const mitigated = Math.max(1, amount - this.armor);
    this.hp -= mitigated;
    this.invulnerableTimer = 0.45;

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

    if (sourceText && this.infectionCooldownTimer > 0) return;
    if (sourceText) this.infectionCooldownTimer = 0.8;

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
    this.infection = 0;
    this.isDead = false;
    this.immunityTimer = 15;
    this.invulnerableTimer = 3;
    this.slowTimer = 0;
    this.slowMultiplier = 1.0;
  }
}

// Global entities registry
window.Particle = Particle;
window.FloatingText = FloatingText;
window.Projectile = Projectile;
window.Monster = Monster;
window.Player = Player;
