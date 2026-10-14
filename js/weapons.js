// Weapons System: Basic Attacks and 8 Specialized Escape/Crowd-Control Skills

class WeaponSystem {
  constructor(game) {
    this.game = game;
  }

  // Switch active weapon
  switchWeapon(weaponKey) {
    if (!CONSTANTS.WEAPONS[weaponKey]) return;
    this.game.player.activeWeapon = weaponKey;
    const w = CONSTANTS.WEAPONS[weaponKey];
    this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, `TRANG BỊ: ${w.name}`, w.color, 12, 0.8));
    window.audioManager.playEquip();
  }

  // Basic Attack (Left Mouse Click)
  performBasicAttack(player, mouseWorldX, mouseWorldY) {
    if (player.attackCooldownTimer > 0 || player.isVaulting) return;

    const weaponKey = player.activeWeapon;
    const w = CONSTANTS.WEAPONS[weaponKey];
    player.attackCooldownTimer = w.attackCooldown;

    const angle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);

    if (weaponKey === 'SPEAR') {
      window.audioManager.playSpearAttack();
      this.spearThrust(player, angle, w.baseDamage, w.range);
    } else if (weaponKey === 'STAFF') {
      window.audioManager.playStaffStun();
      this.staffSwing(player, angle, w.baseDamage, w.range);
    } else if (weaponKey === 'DAGGER') {
      window.audioManager.playHit();
      this.daggerSlash(player, angle, w.baseDamage, w.range);
    } else if (weaponKey === 'BOW') {
      window.audioManager.playBowShoot();
      this.bowShoot(player, angle, w.baseDamage, w.range);
    }

    // Also check hitting breakable world harvestables (Eggs, Ores, Herbs, Debris)
    this.checkHarvestableHit(player, mouseWorldX, mouseWorldY, w.range);
  }

  // Spear Basic Thrust
  spearThrust(player, angle, damage, range) {
    const tipX = player.x + Math.cos(angle) * range;
    const tipY = player.y + Math.sin(angle) * range;

    // Visual thrust beam particle
    this.game.particles.push(new Particle(tipX, tipY, Math.cos(angle) * 30, Math.sin(angle) * 30, '#38bdf8', 6, 0.15));

    for (let m of this.game.monsters) {
      if (m.isDead) continue;
      const dist = Math.hypot(m.x - tipX, m.y - tipY);
      if (dist <= 30) {
        m.takeDamage(damage, this.game.particles, this.game.floatingTexts);
        m.applyKnockback(Math.cos(angle) * 120, Math.sin(angle) * 120, 0.2);
      }
    }
  }

  // Staff Basic Swing
  staffSwing(player, angle, damage, range) {
    const swingX = player.x + Math.cos(angle) * (range * 0.7);
    const swingY = player.y + Math.sin(angle) * (range * 0.7);

    // Visual wave
    this.game.particles.push(new Particle(swingX, swingY, 0, 0, '#c084fc', 22, 0.18, 'ring'));

    for (let m of this.game.monsters) {
      if (m.isDead) continue;
      const dist = Math.hypot(m.x - swingX, m.y - swingY);
      if (dist <= 36) {
        m.takeDamage(damage, this.game.particles, this.game.floatingTexts);
        m.applyKnockback(Math.cos(angle) * 80, Math.sin(angle) * 80, 0.18);
      }
    }
  }

  // Dagger Basic Slash
  daggerSlash(player, angle, damage, range) {
    const slashX = player.x + Math.cos(angle) * range;
    const slashY = player.y + Math.sin(angle) * range;

    // Green slash sparks
    for (let i = 0; i < 4; i++) {
      this.game.particles.push(new Particle(slashX, slashY, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, '#4ade80', 3, 0.12));
    }

    for (let m of this.game.monsters) {
      if (m.isDead) continue;
      const dist = Math.hypot(m.x - slashX, m.y - slashY);
      if (dist <= 28) {
        m.takeDamage(damage, this.game.particles, this.game.floatingTexts);
      }
    }
  }

  // Bow Basic Shot
  bowShoot(player, angle, damage, range) {
    const speed = 480;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const proj = new Projectile(player.x, player.y, vx, vy, range, damage, 'arrow');
    this.game.projectiles.push(proj);
  }

  // Harvestable world interact (break eggs, mine ores, gather herbs, scoop water, harvest berries, click lab)
  checkHarvestableHit(player, targetX, targetY, reach) {
    // 1. Check clicking on Bio-Lab or Furnace when nearby
    const struct = this.game.world.getStructureNear(player.x, player.y, 85);
    if (struct) {
      const distToClick = Math.hypot(targetX - (struct.x + struct.width / 2), targetY - (struct.y + struct.height / 2));
      if (distToClick < 60) {
        if (struct.type === 'biolab' && window.labSystem) {
          window.labSystem.open('lab');
          return;
        } else if (struct.type === 'furnace' && window.labSystem) {
          window.labSystem.open('furnace');
          return;
        }
      }
    }

    // 2. Check Harvesting Wild Flora (Berries)
    const bush = this.game.world.getWildFloraAt(targetX, targetY, reach);
    if (bush) {
      const dropItemId = this.game.world.harvestWildFlora(bush);
      if (dropItemId) {
        this.game.inventory.addItem(dropItemId, 2);
        window.audioManager.playEquip();
        const def = CONSTANTS.ITEM_TYPES[dropItemId];
        this.game.floatingTexts.push(new FloatingText(
          bush.x, bush.y - 15,
          `+2 ${def.name}!`,
          bush.isBlighted ? '#d946ef' : '#22c55e', 12, 1.2
        ));
        return;
      }
    }

    // 3. Check Harvesting Ores, Herbs, Alien Eggs, Debris
    const h = this.game.world.getHarvestableAt(targetX, targetY, reach);
    if (h) {
      const isDestroyed = this.game.world.damageHarvestable(h, 15);
      this.game.floatingTexts.push(new FloatingText(h.x, h.y - 10, isDestroyed ? `THU HOẠCH!` : `${h.hp}/${h.maxHp}`, '#facc15', 11, 0.6));

      if (isDestroyed) {
        // Add to inventory
        this.game.inventory.addItem(h.dropItemId, h.dropCount);
        window.audioManager.playEquip();

        // If egg destroyed, splatter extra acid particles
        if (h.type === 'alien_egg') {
          for (let i = 0; i < 16; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 30 + Math.random() * 80;
            this.game.particles.push(new Particle(h.x, h.y, Math.cos(a) * spd, Math.sin(a) * spd, '#c026d3', 4, 0.4));
          }
          this.game.floatingTexts.push(new FloatingText(h.x, h.y - 25, 'ĐẬP VỠ TRỨNG QUÁI! +1 DỊCH TUYẾN', '#ec4899', 13, 1.2));
        }
      }
      return;
    }

    // 4. Check Scooping Water from River or Lake
    if (this.game.world.isNearWater(targetX, targetY, 25)) {
      if (Math.hypot(player.x - targetX, player.y - targetY) <= reach + 20) {
        this.game.inventory.addItem('dirty_water', 1);
        window.audioManager.playEquip();
        this.game.floatingTexts.push(new FloatingText(player.x, player.y - 20, '+1 NƯỚC AO SÔNG Ô NHIỄM', '#65a30d', 12, 1.0));
        return;
      }
    }
  }

  // ==========================================
  // SKILL 1 [Q]
  // ==========================================
  triggerSkill1(player, mouseWorldX, mouseWorldY) {
    if (player.skill1CooldownTimer > 0 || player.isVaulting) return;

    const weaponKey = player.activeWeapon;
    const w = CONSTANTS.WEAPONS[weaponKey];
    player.skill1CooldownTimer = w.skill1.cooldown;
    const angle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);

    if (weaponKey === 'SPEAR') {
      // 1. Giáo: Quét Ngang (Wide Cone Knockback)
      window.audioManager.playSpearSweep();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'QUÉT NGANG!', '#38bdf8', 13, 0.9));

      const sweepRadius = 115;
      const coneAngle = Math.PI * 0.65; // ~120 degrees

      // Sweep arc visual fx
      for (let a = -coneAngle / 2; a <= coneAngle / 2; a += 0.15) {
        const sweepA = angle + a;
        const px = player.x + Math.cos(sweepA) * sweepRadius;
        const py = player.y + Math.sin(sweepA) * sweepRadius;
        this.game.particles.push(new Particle(px, py, Math.cos(sweepA) * 40, Math.sin(sweepA) * 40, '#38bdf8', 5, 0.25));
      }

      for (let m of this.game.monsters) {
        if (m.isDead) continue;
        const dist = Math.hypot(m.x - player.x, m.y - player.y);
        if (dist <= sweepRadius) {
          const mAngle = Math.atan2(m.y - player.y, m.x - player.x);
          let diff = mAngle - angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          if (Math.abs(diff) <= coneAngle / 2) {
            m.takeDamage(24, this.game.particles, this.game.floatingTexts);
            m.applyKnockback(Math.cos(mAngle) * 220, Math.sin(mAngle) * 220, 0.35);
          }
        }
      }

    } else if (weaponKey === 'STAFF') {
      // 2. Gậy: Chấn Động (Ground Slam AoE Stun 1.5s)
      window.audioManager.playStaffStun();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'CHẤN ĐỘNG!', '#c084fc', 13, 0.9));

      const stunRadius = 110;
      // Shockwave ring fx
      this.game.particles.push(new Particle(player.x, player.y, 0, 0, '#c084fc', stunRadius, 0.45, 'ring'));

      for (let m of this.game.monsters) {
        if (m.isDead) continue;
        const dist = Math.hypot(m.x - player.x, m.y - player.y);
        if (dist <= stunRadius) {
          m.takeDamage(18, this.game.particles, this.game.floatingTexts);
          m.applyStun(1.5, this.game.floatingTexts);
        }
      }

    } else if (weaponKey === 'DAGGER') {
      // 3. Dao: Bom Khói Sinh Học (Smoke cloud + Stealth + No-clip 2s)
      window.audioManager.playDaggerSmoke();
      player.isStealthed = true;
      player.stealthTimer = 2.0;
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'BOM KHÓI TÀNG HÌNH!', '#4ade80', 13, 1.2));

      // Smoke particles cloud
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2;
        const dist = Math.random() * 85;
        this.game.particles.push(new Particle(
          player.x + Math.cos(a) * dist,
          player.y + Math.sin(a) * dist,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (i % 2 === 0) ? '#166534' : '#581c87',
          8 + Math.random() * 8,
          1.8
        ));
      }

    } else if (weaponKey === 'BOW') {
      // 4. Cung: Tên Lưới Năng Lượng (AoE Root 2.5s)
      window.audioManager.playBowNet();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'TÊN LƯỚI!', '#38bdf8', 13, 0.9));

      const speed = 400;
      const targetDist = Math.hypot(mouseWorldX - player.x, mouseWorldY - player.y);
      const range = Math.min(320, Math.max(100, targetDist));

      const proj = new Projectile(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, range, 12, 'net_arrow');
      this.game.projectiles.push(proj);
    }
  }

  // ==========================================
  // SKILL 2 [E]
  // ==========================================
  triggerSkill2(player, mouseWorldX, mouseWorldY) {
    if (player.skill2CooldownTimer > 0 || player.isVaulting) return;

    const weaponKey = player.activeWeapon;
    const w = CONSTANTS.WEAPONS[weaponKey];
    player.skill2CooldownTimer = w.skill2.cooldown;
    const angle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);

    if (weaponKey === 'SPEAR') {
      // 1. Giáo: Chống Sào Nhảy Vọt (Pole Vault 180px over obstacles/mobs)
      window.audioManager.playSpearVault();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'CHỐNG SÀO NHẢY VỌT!', '#38bdf8', 13, 1.0));

      const jumpDist = 180;
      player.isVaulting = true;
      player.vaultTimer = 0;
      player.vaultMaxTime = 0.45;
      player.vaultStartX = player.x;
      player.vaultStartY = player.y;
      player.vaultTargetX = player.x + Math.cos(angle) * jumpDist;
      player.vaultTargetY = player.y + Math.sin(angle) * jumpDist;

      // Dust ring at jump origin
      this.game.particles.push(new Particle(player.x, player.y, 0, 0, '#94a3b8', 25, 0.3, 'ring'));

    } else if (weaponKey === 'STAFF') {
      // 2. Gậy: Lốc Xoáy Đẩy Lùi (Radial Whirlwind Knockback + 30% Speed for 2s)
      window.audioManager.playStaffWhirlwind();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'LỐC XOÁY ĐẨY LÙI (+TỐC ĐỘ)!', '#c084fc', 13, 1.1));

      player.speedBoostMultiplier = 1.30;
      player.speedBoostTimer = 2.0;

      const whirlwindRadius = 120;
      // Swirling particles
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        const dist = 40 + Math.random() * 60;
        this.game.particles.push(new Particle(
          player.x + Math.cos(a) * dist,
          player.y + Math.sin(a) * dist,
          -Math.sin(a) * 120,
          Math.cos(a) * 120,
          '#d8b4fe',
          4,
          0.4
        ));
      }

      for (let m of this.game.monsters) {
        if (m.isDead) continue;
        const dist = Math.hypot(m.x - player.x, m.y - player.y);
        if (dist <= whirlwindRadius) {
          const mAngle = Math.atan2(m.y - player.y, m.x - player.x);
          m.takeDamage(15, this.game.particles, this.game.floatingTexts);
          m.applyKnockback(Math.cos(mAngle) * 240, Math.sin(mAngle) * 240, 0.35);
        }
      }

    } else if (weaponKey === 'DAGGER') {
      // 3. Dao: Đâm Xuyên Bóng Tối (Dash through mobs + 50% slow)
      window.audioManager.playDaggerShadow();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'ĐÂM XUYÊN BÓNG TỐI!', '#4ade80', 13, 0.9));

      const dashDist = 145;
      const startX = player.x;
      const startY = player.y;
      const endX = player.x + Math.cos(angle) * dashDist;
      const endY = player.y + Math.sin(angle) * dashDist;

      // Shadow trail particles
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const px = startX + (endX - startX) * t;
        const py = startY + (endY - startY) * t;
        this.game.particles.push(new Particle(px, py, 0, 0, '#86efac', 5, 0.25));
      }

      // Check all monsters along the line segment
      for (let m of this.game.monsters) {
        if (m.isDead) continue;
        const dist = this.distToSegment({ x: m.x, y: m.y }, { x: startX, y: startY }, { x: endX, y: endY });
        if (dist <= 30) {
          m.takeDamage(28, this.game.particles, this.game.floatingTexts);
          m.applySlow(0.5, 3.0, this.game.floatingTexts);
        }
      }

      // Move player forward
      if (!this.game.world.isColliding(endX, endY, player.radius)) {
        player.x = endX;
        player.y = endY;
      }

    } else if (weaponKey === 'BOW') {
      // 4. Cung: Bắn Giật Lùi (Recoil blast forward + slows mobs, launches player backward)
      window.audioManager.playBowRecoil();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'BẮN GIẬT LÙI!', '#f97316', 13, 0.9));

      // Propel player backward
      const recoilDist = 110;
      const targetBackX = player.x - Math.cos(angle) * recoilDist;
      const targetBackY = player.y - Math.sin(angle) * recoilDist;

      if (!this.game.world.isColliding(targetBackX, targetBackY, player.radius)) {
        player.x = targetBackX;
        player.y = targetBackY;
      }

      // Fire explosive recoil blast forward
      const speed = 400;
      const proj = new Projectile(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 160, 22, 'recoil_blast');
      this.game.projectiles.push(proj);
    }
  }

  // Distance from point to line segment helper
  distToSegment(p, v, w) {
    const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }
}

// Global registry
window.WeaponSystem = WeaponSystem;
