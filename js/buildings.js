// Defensive Structures & Tower Defense Building System
// Handles Walls, Spike Traps, Watchtowers (Turrets), and Heavy Mortars

class MortarShell {
  constructor(startX, startY, targetX, targetY, damage = 55, aoeRadius = 65) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.damage = damage;
    this.aoeRadius = aoeRadius;

    this.progress = 0;
    this.duration = 1.1; // 1.1s flight time
    this.isDead = false;
    this.x = startX;
    this.y = startY;
    this.height = 0;
  }

  update(dt, monsters, particles, floatingTexts) {
    this.progress += dt / this.duration;
    if (this.progress >= 1.0) {
      this.explode(monsters, particles, floatingTexts);
      return false;
    }

    const t = this.progress;
    this.x = this.startX + (this.targetX - this.startX) * t;
    this.y = this.startY + (this.targetY - this.startY) * t;
    // Parabolic arc height (reaches peak 70px)
    this.height = Math.sin(t * Math.PI) * 70;

    // Trailing smoke particles
    if (Math.random() < 0.4) {
      particles.push(new Particle(this.x, this.y - this.height, 0, -10, '#64748b', 3, 0.3));
    }

    return true;
  }

  explode(monsters, particles, floatingTexts) {
    this.isDead = true;
    window.audioManager.playBowRecoil();

    // Huge explosion shockwave ring and fire particles
    particles.push(new Particle(this.targetX, this.targetY, 0, 0, '#ef4444', this.aoeRadius, 0.5, 'ring'));
    particles.push(new Particle(this.targetX, this.targetY, 0, 0, '#f97316', this.aoeRadius * 0.7, 0.35, 'ring'));

    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 90;
      particles.push(new Particle(
        this.targetX, this.targetY,
        Math.cos(a) * spd, Math.sin(a) * spd,
        (i % 2 === 0) ? '#fde047' : '#ea580c',
        4 + Math.random() * 4,
        0.45
      ));
    }

    floatingTexts.push(new FloatingText(this.targetX, this.targetY - 20, '💥 BOOM! (SÚNG CỐI)', '#f97316', 14, 1.2));

    // Deal AoE Damage & Knockback to all monsters in blast radius
    for (let m of monsters) {
      if (m.isDead) continue;
      const dist = Math.hypot(m.x - this.targetX, m.y - this.targetY);
      if (dist <= this.aoeRadius) {
        m.takeDamage(this.damage, particles, floatingTexts);
        const angle = Math.atan2(m.y - this.targetY, m.x - this.targetX);
        m.applyKnockback(Math.cos(angle) * 220, Math.sin(angle) * 220, 0.35);
      }
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y - this.height;

    // Ground shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x - camera.x, this.y - camera.y, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shell projectile
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(sx - 1, sy - 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class BuildingManager {
  constructor(game) {
    this.game = game;
    this.defenses = []; // Placed player defenses: Wall, Trap, Turret, Mortar
    this.mortarShells = [];
    this.buildMode = null; // 'wall', 'trap', 'turret', 'mortar' or null
    this.hoverTile = { col: 0, row: 0, x: 0, y: 0 };
  }

  enterBuildMode(structType) {
    this.buildMode = structType;
    const def = CONSTANTS.ITEM_TYPES['defense_' + structType];
    this.game.floatingTexts.push(new FloatingText(
      this.game.player.x, this.game.player.y - 30,
      `CHẾ ĐỘ XÂY: ${def ? def.name : structType} (Click để đặt, ESC để hủy)`,
      '#facc15', 12, 1.2
    ));
  }

  exitBuildMode() {
    this.buildMode = null;
  }

  updateHoverTile(mouseWorldX, mouseWorldY) {
    const tileSize = CONSTANTS.TILE_SIZE;
    const col = Math.floor(mouseWorldX / tileSize);
    const row = Math.floor(mouseWorldY / tileSize);
    this.hoverTile = {
      col,
      row,
      x: col * tileSize + tileSize / 2,
      y: row * tileSize + tileSize / 2
    };
  }

  canPlaceAt(col, row, structType) {
    // Check map boundaries
    if (col < 2 || col >= this.game.world.cols - 2 || row < 2 || row >= this.game.world.rows - 2) {
      return false;
    }

    // Cannot place in water or deep mountain
    const tile = this.game.world.getTile(col, row);
    if (
      tile === CONSTANTS.TILES.RIVER_WATER ||
      tile === CONSTANTS.TILES.LAKE_WATER ||
      tile === CONSTANTS.TILES.OCEAN_DEEP ||
      tile === CONSTANTS.TILES.SNOW_PEAK
    ) {
      return false;
    }

    const tx = col * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;
    const ty = row * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;

    // Check collision with existing defenses
    for (let d of this.defenses) {
      if (Math.hypot(d.x - tx, d.y - ty) < 26) {
        return false;
      }
    }

    // Check collision with central base structures
    for (let s of this.game.world.structures) {
      if (tx >= s.x && tx <= s.x + s.width && ty >= s.y && ty <= s.y + s.height) {
        return false;
      }
    }

    return true;
  }

  placeStructure(col, row, structType) {
    const itemId = 'defense_' + structType;
    const count = this.game.inventory.getItemCount ? this.game.inventory.getItemCount(itemId) : this.game.inventory.slots.filter(s => s && s.id === itemId).reduce((acc, s) => acc + s.count, 0);

    if (count <= 0) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'HẾT VẬT LIỆU XÂY DỰNG TRONG KHO!', '#ef4444', 12, 1.0));
      this.exitBuildMode();
      return false;
    }

    if (!this.canPlaceAt(col, row, structType)) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'VỊ TRÍ NÀY BỊ VẬT CẢN!', '#ef4444', 11, 0.8));
      return false;
    }

    // Deduct 1 item from inventory
    const slotIdx = this.game.inventory.slots.findIndex(s => s && s.id === itemId);
    if (slotIdx !== -1) {
      this.game.inventory.removeItem(slotIdx, 1);
    }

    const cfg = CONSTANTS.DEFENSE[structType];
    const x = col * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;
    const y = row * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;

    const newDef = {
      id: 'def_' + Date.now() + '_' + Math.random(),
      type: structType,
      name: cfg.name,
      col,
      row,
      x,
      y,
      hp: cfg.maxHp,
      maxHp: cfg.maxHp,
      blocksMovement: cfg.blocksMovement,
      cooldown: 0,
      aimAngle: 0,
      usesLeft: 12
    };

    this.defenses.push(newDef);

    // Audio & Particles
    window.audioManager.playEquip();
    for (let i = 0; i < 8; i++) {
      this.game.particles.push(new Particle(x, y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, '#38bdf8', 3, 0.25));
    }
    this.game.floatingTexts.push(new FloatingText(x, y - 20, `ĐÃ XÂY: ${cfg.name}!`, '#22c55e', 12, 1.0));

    const remainingCount = this.game.inventory.slots.filter(s => s && s.id === itemId).reduce((acc, s) => acc + s.count, 0);
    if (remainingCount <= 0) {
      this.exitBuildMode();
    }

    return true;
  }

  damageStructure(struct, damage) {
    struct.hp -= damage;
    window.audioManager.playHit();

    // Rubble particles
    for (let i = 0; i < 4; i++) {
      this.game.particles.push(new Particle(struct.x, struct.y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, '#64748b', 3, 0.2));
    }

    if (struct.hp <= 0) {
      this.game.floatingTexts.push(new FloatingText(struct.x, struct.y - 15, `${struct.name} BỊ PHÁ HỦY!`, '#ef4444', 12, 1.2));
      const idx = this.defenses.indexOf(struct);
      if (idx !== -1) this.defenses.splice(idx, 1);
      return true; // destroyed
    }
    return false;
  }

  // Check collision for Player or Monsters
  isBlocking(x, y, radius = 12) {
    for (let d of this.defenses) {
      if (d.blocksMovement) {
        if (Math.hypot(d.x - x, d.y - y) <= (16 + radius)) {
          return true;
        }
      }
    }
    return false;
  }

  // Find structure near point
  getStructureAt(x, y, radius = 18) {
    for (let d of this.defenses) {
      if (Math.hypot(d.x - x, d.y - y) <= radius) {
        return d;
      }
    }
    return null;
  }

  update(dt, monsters, particles, floatingTexts, projectiles) {
    // 1. Update Mortar Shells in flight
    for (let i = this.mortarShells.length - 1; i >= 0; i--) {
      const shell = this.mortarShells[i];
      const alive = shell.update(dt, monsters, particles, floatingTexts);
      if (!alive) this.mortarShells.splice(i, 1);
    }

    // 2. Update Defensive Structures Logic
    for (let i = this.defenses.length - 1; i >= 0; i--) {
      const d = this.defenses[i];
      const cfg = CONSTANTS.DEFENSE[d.type];

      if (d.cooldown > 0) d.cooldown -= dt;

      // ----------------------------------------------------
      // SPIKE TRAP
      // ----------------------------------------------------
      if (d.type === 'trap') {
        for (let m of monsters) {
          if (m.isDead) continue;
          if (Math.hypot(m.x - d.x, m.y - d.y) <= 18 && d.cooldown <= 0) {
            d.cooldown = 0.8; // Trigger cooldown
            m.takeDamage(cfg.damage, particles, floatingTexts);
            m.applySlow(cfg.slowFactor, cfg.slowDuration, floatingTexts);

            // Spike animation particles
            for (let k = 0; k < 6; k++) {
              particles.push(new Particle(d.x, d.y, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, '#22c55e', 3, 0.2));
            }

            d.usesLeft--;
            if (d.usesLeft <= 0) {
              floatingTexts.push(new FloatingText(d.x, d.y - 15, 'BẪY GAI ĐÃ MÒN HỎNG!', '#94a3b8', 11, 1.0));
              this.defenses.splice(i, 1);
              break;
            }
          }
        }
      }

      // ----------------------------------------------------
      // WATCHTOWER / TURRET (Rapid Single Target)
      // ----------------------------------------------------
      else if (d.type === 'turret') {
        if (d.cooldown <= 0) {
          // Find closest monster in range
          let closestM = null;
          let minDist = cfg.range;

          for (let m of monsters) {
            if (m.isDead) continue;
            const dist = Math.hypot(m.x - d.x, m.y - d.y);
            if (dist <= minDist) {
              minDist = dist;
              closestM = m;
            }
          }

          if (closestM) {
            d.cooldown = cfg.fireCooldown;
            d.aimAngle = Math.atan2(closestM.y - d.y, closestM.x - d.x);

            // Fire plasma bolt
            const speed = 550;
            const vx = Math.cos(d.aimAngle) * speed;
            const vy = Math.sin(d.aimAngle) * speed;
            projectiles.push(new Projectile(d.x, d.y, vx, vy, cfg.range, cfg.damage, 'arrow'));
            window.audioManager.playBowShoot();

            // Muzzle flash particle
            particles.push(new Particle(d.x + Math.cos(d.aimAngle) * 16, d.y + Math.sin(d.aimAngle) * 16, 0, 0, '#38bdf8', 6, 0.15));
          }
        }
      }

      // ----------------------------------------------------
      // HEAVY MORTAR (AoE Bombardment)
      // ----------------------------------------------------
      else if (d.type === 'mortar') {
        if (d.cooldown <= 0) {
          // Find cluster or farthest monster in range [minRange, maxRange]
          let targetM = null;
          let maxDist = cfg.minRange;

          for (let m of monsters) {
            if (m.isDead) continue;
            const dist = Math.hypot(m.x - d.x, m.y - d.y);
            if (dist >= cfg.minRange && dist <= cfg.range && dist >= maxDist) {
              maxDist = dist;
              targetM = m;
            }
          }

          if (targetM) {
            d.cooldown = cfg.fireCooldown;
            d.aimAngle = Math.atan2(targetM.y - d.y, targetM.x - d.x);

            // Launch Mortar Shell
            this.mortarShells.push(new MortarShell(d.x, d.y, targetM.x, targetM.y, cfg.damage, cfg.aoeRadius));
            window.audioManager.playBowRecoil();

            // Heavy muzzle smoke puff
            for (let k = 0; k < 8; k++) {
              particles.push(new Particle(d.x, d.y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, '#f97316', 4, 0.3));
            }
          }
        }
      }
    }
  }

  render(ctx, camera) {
    // 1. Render Placed Defenses
    for (let d of this.defenses) {
      const sx = d.x - 16 - camera.x;
      const sy = d.y - 16 - camera.y;

      const sprite = window.pixelArt.get('defense_' + d.type);
      if (sprite) {
        if (d.type === 'turret') {
          // Draw rotated turret
          ctx.save();
          ctx.translate(d.x - camera.x, d.y - camera.y);
          ctx.rotate(d.aimAngle);
          ctx.drawImage(sprite, -16, -16);
          ctx.restore();
        } else {
          ctx.drawImage(sprite, sx, sy);
        }
      }

      // Draw HP Bar if damaged
      if (d.hp < d.maxHp && d.type !== 'trap') {
        const barW = 24;
        const barH = 3;
        const pct = Math.max(0, d.hp / d.maxHp);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(d.x - barW / 2 - camera.x, d.y - 20 - camera.y, barW, barH);
        ctx.fillStyle = (pct > 0.4) ? '#22c55e' : '#ef4444';
        ctx.fillRect(d.x - barW / 2 - camera.x, d.y - 20 - camera.y, barW * pct, barH);
      }
    }

    // 2. Render Mortar Shells in Flight
    for (let shell of this.mortarShells) {
      shell.render(ctx, camera);
    }

    // 3. Render Build Mode Preview Ghost
    if (this.buildMode) {
      const gx = this.hoverTile.x - 16 - camera.x;
      const gy = this.hoverTile.y - 16 - camera.y;
      const canPlace = this.canPlaceAt(this.hoverTile.col, this.hoverTile.row, this.buildMode);

      ctx.save();
      ctx.globalAlpha = 0.65;
      const sprite = window.pixelArt.get('defense_' + this.buildMode);
      if (sprite) {
        ctx.drawImage(sprite, gx, gy);
      }

      // Placement border indicator (Green if valid, Red if blocked)
      ctx.strokeStyle = canPlace ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, 32, 32);

      // Draw range circle for Turret / Mortar
      if (this.buildMode === 'turret') {
        ctx.beginPath();
        ctx.arc(this.hoverTile.x - camera.x, this.hoverTile.y - camera.y, CONSTANTS.DEFENSE.turret.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.stroke();
      } else if (this.buildMode === 'mortar') {
        ctx.beginPath();
        ctx.arc(this.hoverTile.x - camera.x, this.hoverTile.y - camera.y, CONSTANTS.DEFENSE.mortar.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}

// Global registry
window.BuildingManager = BuildingManager;
