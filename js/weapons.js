// Weapons System: 5 Weapons (Spear, Staff, Dagger, Bow, Plasma Gun), 10 Skills & Weapon Upgrade System (Lv.1 -> Lv.3)

class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.weaponLevels = {};
    if (CONSTANTS && CONSTANTS.WEAPONS) {
      for (const k of Object.keys(CONSTANTS.WEAPONS)) {
        this.weaponLevels[k] = 1;
      }
    } else {
      this.weaponLevels = { SPEAR: 1, STAFF: 1, DAGGER: 1, BOW: 1, GUN: 1 };
    }
  }

  _queryMonstersNear(x, y, radius) {
    if (this.game && this.game.monsterGrid) {
      return this.game.monsterGrid.queryRadius(x, y, radius);
    }
    return (this.game && this.game.monsters) ? this.game.monsters : [];
  }

  getWeaponLevel(weaponKey) {
    return (this.weaponLevels && this.weaponLevels[weaponKey]) ? this.weaponLevels[weaponKey] : 1;
  }

  getWeaponStats(weaponKey) {
    const base = CONSTANTS.WEAPONS[weaponKey];
    if (!base) return null;
    const lv = this.getWeaponLevel(weaponKey);
    const tier = (CONSTANTS.WEAPON_TIERS && CONSTANTS.WEAPON_TIERS[lv]) ? CONSTANTS.WEAPON_TIERS[lv] : { dmgMult: 1, cdMult: 1, rangeMult: 1 };
    return {
      ...base,
      level: lv,
      damage: Math.round(base.baseDamage * tier.dmgMult),
      attackCooldown: Math.max(0.10, base.attackCooldown * tier.cdMult),
      range: Math.round(base.range * tier.rangeMult),
      dmgMult: tier.dmgMult
    };
  }

  // Upgrade a specific weapon from Lv.1 -> Lv.2 -> Lv.3
  upgradeWeapon(weaponKey) {
    if (!CONSTANTS.WEAPONS[weaponKey]) return false;
    const curLv = this.getWeaponLevel(weaponKey);
    const w = CONSTANTS.WEAPONS[weaponKey];

    if (curLv >= 3) {
      const msg = `★ ${w.name} đã đạt Cấp Tối Đa (Lv.3 MAX)!`;
      if (this.game && this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    const nextLv = curLv + 1;
    const tierCfg = CONSTANTS.WEAPON_TIERS[nextLv];
    if (!tierCfg || !this.game || !this.game.buildingManager) return false;

    if (!this.game.buildingManager.canAffordCost(tierCfg.cost)) {
      const missing = `THIẾU NGUYÊN LIỆU NÂNG CẤP ${w.name.toUpperCase()} LV.${nextLv}: Cần ${this.game.buildingManager.formatCostString(tierCfg.cost)}`;
      if (this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, missing, '#ef4444', 11, 1.5));
      }
      if (this.game.saveManager) this.game.saveManager.showSaveToast(`⚠️ ${missing}`);
      return false;
    }

    this.game.buildingManager.consumeCost(tierCfg.cost);
    this.weaponLevels[weaponKey] = nextLv;

    window.audioManager.playEquip();
    const p = this.game.player;
    const col = nextLv >= 3 ? '#facc15' : '#38bdf8';
    if (p && this.game.particles) {
      this.game.particles.push(new Particle(p.x, p.y, 0, 0, col, 38, 0.45, 'ring'));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        this.game.particles.push(new Particle(p.x, p.y, Math.cos(a) * 80, Math.sin(a) * 80, col, 4, 0.35));
      }
    }

    const stats = this.getWeaponStats(weaponKey);
    const msg = `⬆ ĐÃ NÂNG CẤP ${w.name} LÊN LV.${nextLv} (${stats.damage} DMG)!`;
    if (p && this.game.floatingTexts) {
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 32, msg, col, 13, 1.8));
    }
    if (this.game.saveManager) {
      this.game.saveManager.showSaveToast(msg);
    }

    this.switchWeapon(weaponKey);
    if (this.game.lab && this.game.lab.isOpen) {
      this.game.lab.switchTab(this.game.lab.currentTab);
    }
    if (this.game.updateHUD) this.game.updateHUD(true);
    return true;
  }

  switchWeapon(weaponKey) {
    if (!CONSTANTS.WEAPONS[weaponKey]) return;
    this.game.player.activeWeapon = weaponKey;
    const w = this.getWeaponStats(weaponKey);
    this.game.floatingTexts.push(new FloatingText(
      this.game.player.x, this.game.player.y - 25,
      `TRANG BỊ: ${w.name} [Lv.${w.level}]`,
      w.color, 12, 0.8
    ));
    window.audioManager.playEquip();
    if (this.game.updateHUD) this.game.updateHUD(true);
  }

  performBasicAttack(player, mouseWorldX, mouseWorldY) {
    if (player.attackCooldownTimer > 0 || player.isVaulting) return;

    const weaponKey = player.activeWeapon;
    const w = this.getWeaponStats(weaponKey);
    if (!w) return;
    player.attackCooldownTimer = w.attackCooldown;

    const angle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);

    if (typeof w.onAttack === 'function') {
      w.onAttack(player, angle, w, this.game);
    } else if (weaponKey === 'SPEAR') {
      window.audioManager.playSpearAttack();
      this.spearThrust(player, angle, w.damage, w.range, w.level);
    } else if (weaponKey === 'STAFF') {
      window.audioManager.playStaffStun();
      this.staffSwing(player, angle, w.damage, w.range, w.level);
    } else if (weaponKey === 'DAGGER') {
      window.audioManager.playHit();
      this.daggerSlash(player, angle, w.damage, w.range, w.level);
    } else if (weaponKey === 'BOW') {
      window.audioManager.playBowShoot();
      this.bowShoot(player, angle, w.damage, w.range, w.level);
    } else if (weaponKey === 'GUN') {
      window.audioManager.playBowShoot();
      this.gunShoot(player, angle, w.damage, w.range, w.level);
    } else if (w.projectileType) {
      window.audioManager.playBowShoot();
      const speed = w.projectileSpeed || 520;
      this.game.projectiles.push(new Projectile(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, w.range, w.damage, w.projectileType, { color: w.color }));
    } else {
      window.audioManager.playHit();
      this.spearThrust(player, angle, w.damage, w.range, w.level);
    }

    this.checkHarvestableHit(player, mouseWorldX, mouseWorldY, w.range, w.level);
  }

  spearThrust(player, angle, damage, range, level = 1) {
    const tipX = player.x + Math.cos(angle) * range;
    const tipY = player.y + Math.sin(angle) * range;
    const hitR = 30 + level * 3;

    const col = level >= 3 ? '#facc15' : '#38bdf8';
    this.game.particles.push(new Particle(tipX, tipY, Math.cos(angle) * 35, Math.sin(angle) * 35, col, 6 + level, 0.15));

    const candidates = this._queryMonstersNear(tipX, tipY, hitR);
    for (let i = 0; i < candidates.length; i++) {
      const m = candidates[i];
      if (!m || m.isDead) continue;
      const dist = Math.hypot(m.x - tipX, m.y - tipY);
      if (dist <= hitR) {
        m.takeDamage(damage, this.game.particles, this.game.floatingTexts);
        m.applyKnockback(Math.cos(angle) * 125, Math.sin(angle) * 125, 0.2);
      }
    }
  }

  staffSwing(player, angle, damage, range, level = 1) {
    const swingX = player.x + Math.cos(angle) * (range * 0.7);
    const swingY = player.y + Math.sin(angle) * (range * 0.7);
    const hitR = 36 + level * 4;

    const col = level >= 3 ? '#facc15' : '#c084fc';
    this.game.particles.push(new Particle(swingX, swingY, 0, 0, col, 22 + level * 3, 0.18, 'ring'));

    const candidates = this._queryMonstersNear(swingX, swingY, hitR);
    for (let i = 0; i < candidates.length; i++) {
      const m = candidates[i];
      if (!m || m.isDead) continue;
      const dist = Math.hypot(m.x - swingX, m.y - swingY);
      if (dist <= hitR) {
        m.takeDamage(damage, this.game.particles, this.game.floatingTexts);
        m.applyKnockback(Math.cos(angle) * 85, Math.sin(angle) * 85, 0.18);
      }
    }
  }

  daggerSlash(player, angle, damage, range, level = 1) {
    const slashX = player.x + Math.cos(angle) * range;
    const slashY = player.y + Math.sin(angle) * range;
    const hitR = 28 + level * 3;

    const col = level >= 3 ? '#facc15' : '#4ade80';
    for (let i = 0; i < 4; i++) {
      this.game.particles.push(new Particle(slashX, slashY, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, col, 3, 0.12));
    }

    const candidates = this._queryMonstersNear(slashX, slashY, hitR);
    for (let i = 0; i < candidates.length; i++) {
      const m = candidates[i];
      if (!m || m.isDead) continue;
      const dist = Math.hypot(m.x - slashX, m.y - slashY);
      if (dist <= hitR) {
        m.takeDamage(damage, this.game.particles, this.game.floatingTexts);
      }
    }
  }

  bowShoot(player, angle, damage, range, level = 1) {
    const speed = 490 + level * 30;
    if (level >= 3) {
      for (let offset of [-0.05, 0.05]) {
        const a = angle + offset;
        this.game.projectiles.push(new Projectile(player.x, player.y, Math.cos(a) * speed, Math.sin(a) * speed, range, Math.round(damage * 0.65), 'arrow'));
      }
    } else {
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.game.projectiles.push(new Projectile(player.x, player.y, vx, vy, range, damage, 'arrow'));
    }
  }

  gunShoot(player, angle, damage, range, level = 1) {
    if (this.game && this.game.dayNight && this.game.dayNight.currentWeather === 'EMP_STORM') {
      damage = Math.round(damage * 1.25);
    }
    const speed = 660 + level * 40;
    const muzzleX = player.x + Math.cos(angle) * 18;
    const muzzleY = player.y + Math.sin(angle) * 18;

    const flashCol = level >= 3 ? '#facc15' : (level === 2 ? '#e879f9' : '#38bdf8');
    this.game.particles.push(new Particle(muzzleX, muzzleY, 0, 0, flashCol, 6, 0.10));

    if (level >= 3) {
      this.game.projectiles.push(new Projectile(
        muzzleX, muzzleY,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        range, Math.round(damage * 0.75), 'turret_railgun', { chainCount: 1 }
      ));
      for (let off of [-0.07, 0.07]) {
        const a = angle + off;
        this.game.projectiles.push(new Projectile(
          muzzleX, muzzleY,
          Math.cos(a) * speed, Math.sin(a) * speed,
          range, Math.round(damage * 0.35), 'plasma_bullet', { color: '#facc15' }
        ));
      }
    } else if (level === 2) {
      const perpX = -Math.sin(angle) * 4;
      const perpY = Math.cos(angle) * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const halfDmg = Math.ceil(damage * 0.58);
      this.game.projectiles.push(new Projectile(muzzleX + perpX, muzzleY + perpY, vx, vy, range, halfDmg, 'plasma_bullet', { color: '#38bdf8' }));
      this.game.projectiles.push(new Projectile(muzzleX - perpX, muzzleY - perpY, vx, vy, range, halfDmg, 'plasma_bullet', { color: '#e879f9' }));
    } else {
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.game.projectiles.push(new Projectile(muzzleX, muzzleY, vx, vy, range, damage, 'plasma_bullet', { color: '#38bdf8' }));
    }
  }

  checkHarvestableHit(player, targetX, targetY, reach, weaponLevel = 1) {
    const struct = this.game.world.getStructureNear(player.x, player.y, 90);
    if (struct) {
      const distToClick = Math.hypot(targetX - (struct.x + struct.width / 2), targetY - (struct.y + struct.height / 2));
      if (distToClick < 65 && window.labSystem) {
        if (struct.type === 'biolab') {
          window.labSystem.open('lab');
          return;
        } else if (struct.type === 'furnace') {
          window.labSystem.open('furnace');
          return;
        } else if (struct.type === 'workbench') {
          window.labSystem.open('workbench');
          return;
        } else if (struct.type === 'workshop') {
          window.labSystem.open('workshop');
          return;
        }
      }
    }

    const nearRadius = Math.min(reach + 16, 68);

    const bush = this.game.world.getWildFloraAt(targetX, targetY, reach) ||
                 this.game.world.getWildFloraAt(player.x, player.y, nearRadius);
    if (bush && Math.hypot(bush.x - player.x, bush.y - player.y) <= reach + 28) {
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

    const h = this.game.world.getHarvestableAt(targetX, targetY, reach) ||
              this.game.world.getHarvestableAt(player.x, player.y, nearRadius);
    if (h && Math.hypot(h.x - player.x, h.y - player.y) <= reach + 28) {
      const harvestDmg = 15 + (weaponLevel - 1) * 8;
      const isDestroyed = this.game.world.damageHarvestable(h, harvestDmg);
      this.game.floatingTexts.push(new FloatingText(h.x, h.y - 10, isDestroyed ? `THU HOẠCH!` : `${Math.max(0, h.hp)}/${h.maxHp}`, '#facc15', 11, 0.6));

      if (isDestroyed) {
        this.game.inventory.addItem(h.dropItemId, h.dropCount);
        window.audioManager.playEquip();

        const itemDef = CONSTANTS.ITEM_TYPES[h.dropItemId];
        if (itemDef) {
          this.game.floatingTexts.push(new FloatingText(h.x, h.y - 24, `+${h.dropCount} ${itemDef.name}`, '#38bdf8', 12, 1.1));
        }

        if (h.type === 'alien_egg') {
          this.game.inventory.addItem('alien_chitin', 1);
          this.game.inventory.addItem('monster_egg', 1);
          for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 30 + Math.random() * 80;
            this.game.particles.push(new Particle(h.x, h.y, Math.cos(a) * spd, Math.sin(a) * spd, '#c026d3', 4, 0.4));
          }
          const eggMsg = '🥚 NHẶT +1 TRỨNG QUÁI VẬT (ĐEM VỀ LAB ẤP PET!), +1 DỊCH TUYẾN & +1 GIÁP XÁC!';
          this.game.floatingTexts.push(new FloatingText(h.x, h.y - 38, eggMsg, '#facc15', 12, 1.6));
          if (this.game.saveManager) this.game.saveManager.showSaveToast(eggMsg);
        }
      }
      return;
    }

    if (this.game.world.isNearWater(targetX, targetY, 25)) {
      if (Math.hypot(player.x - targetX, player.y - targetY) <= reach + 25) {
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
    const w = this.getWeaponStats(weaponKey);
    if (!w) return;
    player.skill1CooldownTimer = w.skill1.cooldown * (w.level >= 3 ? 0.85 : 1.0);
    const angle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);
    const dmgMult = w.dmgMult || 1.0;

    if (w.skill1 && typeof w.skill1.onTrigger === 'function') {
      w.skill1.onTrigger(player, angle, w, this.game, mouseWorldX, mouseWorldY);
      return;
    }

    if (weaponKey === 'SPEAR') {
      window.audioManager.playSpearSweep();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'QUÉT NGANG!', '#38bdf8', 13, 0.9));

      const sweepRadius = 115 + (w.level - 1) * 12;
      const coneAngle = Math.PI * 0.65;

      for (let a = -coneAngle / 2; a <= coneAngle / 2; a += 0.18) {
        const sweepA = angle + a;
        const px = player.x + Math.cos(sweepA) * sweepRadius;
        const py = player.y + Math.sin(sweepA) * sweepRadius;
        this.game.particles.push(new Particle(px, py, Math.cos(sweepA) * 40, Math.sin(sweepA) * 40, '#38bdf8', 5, 0.25));
      }

      const candidates = this._queryMonstersNear(player.x, player.y, sweepRadius);
      for (let i = 0; i < candidates.length; i++) {
        const m = candidates[i];
        if (!m || m.isDead) continue;
        const dist = Math.hypot(m.x - player.x, m.y - player.y);
        if (dist <= sweepRadius) {
          const mAngle = Math.atan2(m.y - player.y, m.x - player.x);
          let diff = mAngle - angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          if (Math.abs(diff) <= coneAngle / 2) {
            m.takeDamage(Math.round(24 * dmgMult), this.game.particles, this.game.floatingTexts);
            m.applyKnockback(Math.cos(mAngle) * 220, Math.sin(mAngle) * 220, 0.35);
          }
        }
      }

    } else if (weaponKey === 'STAFF') {
      window.audioManager.playStaffStun();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'CHẤN ĐỘNG!', '#c084fc', 13, 0.9));

      const stunRadius = 110 + (w.level - 1) * 15;
      this.game.particles.push(new Particle(player.x, player.y, 0, 0, '#c084fc', stunRadius, 0.45, 'ring'));

      const candidates = this._queryMonstersNear(player.x, player.y, stunRadius);
      for (let i = 0; i < candidates.length; i++) {
        const m = candidates[i];
        if (!m || m.isDead) continue;
        const dist = Math.hypot(m.x - player.x, m.y - player.y);
        if (dist <= stunRadius) {
          m.takeDamage(Math.round(18 * dmgMult), this.game.particles, this.game.floatingTexts);
          m.applyStun(1.5 + (w.level - 1) * 0.3, this.game.floatingTexts);
        }
      }

    } else if (weaponKey === 'DAGGER') {
      window.audioManager.playDaggerSmoke();
      player.isStealthed = true;
      player.stealthTimer = 2.0 + (w.level - 1) * 0.5;
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'BOM KHÓI TÀNG HÌNH!', '#4ade80', 13, 1.2));

      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        const dist = Math.random() * 85;
        this.game.particles.push(new Particle(
          player.x + Math.cos(a) * dist,
          player.y + Math.sin(a) * dist,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (i % 2 === 0) ? '#166534' : '#581c87',
          8 + Math.random() * 6,
          1.5
        ));
      }

    } else if (weaponKey === 'BOW') {
      window.audioManager.playBowNet();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'TÊN LƯỚI!', '#38bdf8', 13, 0.9));

      const speed = 420;
      const targetDist = Math.hypot(mouseWorldX - player.x, mouseWorldY - player.y);
      const range = Math.min(340, Math.max(100, targetDist));

      const proj = new Projectile(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, range, Math.round(14 * dmgMult), 'net_arrow');
      this.game.projectiles.push(proj);

    } else if (weaponKey === 'GUN') {
      window.audioManager.playBowRecoil();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, '⚡ PHÁO ĐIỆN TỪ EMP!', '#38bdf8', 13, 1.0));

      const speed = 460;
      const targetDist = Math.hypot(mouseWorldX - player.x, mouseWorldY - player.y);
      const range = Math.min(350, Math.max(90, targetDist));

      const proj = new Projectile(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, range, Math.round(42 * dmgMult), 'emp_blast');
      this.game.projectiles.push(proj);
    }
  }

  // ==========================================
  // SKILL 2 [E]
  // ==========================================
  triggerSkill2(player, mouseWorldX, mouseWorldY) {
    if (player.skill2CooldownTimer > 0 || player.isVaulting) return;

    const weaponKey = player.activeWeapon;
    const w = this.getWeaponStats(weaponKey);
    if (!w) return;
    player.skill2CooldownTimer = w.skill2.cooldown * (w.level >= 3 ? 0.85 : 1.0);
    const angle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);
    const dmgMult = w.dmgMult || 1.0;

    if (w.skill2 && typeof w.skill2.onTrigger === 'function') {
      w.skill2.onTrigger(player, angle, w, this.game, mouseWorldX, mouseWorldY);
      return;
    }

    if (weaponKey === 'SPEAR') {
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

      this.game.particles.push(new Particle(player.x, player.y, 0, 0, '#94a3b8', 25, 0.3, 'ring'));

    } else if (weaponKey === 'STAFF') {
      window.audioManager.playStaffWhirlwind();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'LỐC XOÁY ĐẨY LÙI (+TỐC ĐỘ)!', '#c084fc', 13, 1.1));

      player.speedBoostMultiplier = 1.35;
      player.speedBoostTimer = 2.2;

      const whirlwindRadius = 125;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const dist = 40 + Math.random() * 60;
        this.game.particles.push(new Particle(
          player.x + Math.cos(a) * dist,
          player.y + Math.sin(a) * dist,
          -Math.sin(a) * 120,
          Math.cos(a) * 120,
          '#d8b4fe',
          4,
          0.35
        ));
      }

      const candidates = this._queryMonstersNear(player.x, player.y, whirlwindRadius);
      for (let i = 0; i < candidates.length; i++) {
        const m = candidates[i];
        if (!m || m.isDead) continue;
        const dist = Math.hypot(m.x - player.x, m.y - player.y);
        if (dist <= whirlwindRadius) {
          const mAngle = Math.atan2(m.y - player.y, m.x - player.x);
          m.takeDamage(Math.round(16 * dmgMult), this.game.particles, this.game.floatingTexts);
          m.applyKnockback(Math.cos(mAngle) * 240, Math.sin(mAngle) * 240, 0.35);
        }
      }

    } else if (weaponKey === 'DAGGER') {
      window.audioManager.playDaggerShadow();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'ĐÂM XUYÊN BÓNG TỐI!', '#4ade80', 13, 0.9));

      const dashDist = 145;
      const startX = player.x;
      const startY = player.y;
      const endX = player.x + Math.cos(angle) * dashDist;
      const endY = player.y + Math.sin(angle) * dashDist;

      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const px = startX + (endX - startX) * t;
        const py = startY + (endY - startY) * t;
        this.game.particles.push(new Particle(px, py, 0, 0, '#86efac', 5, 0.22));
      }

      const midX = (startX + endX) * 0.5;
      const midY = (startY + endY) * 0.5;
      const candidates = this._queryMonstersNear(midX, midY, dashDist * 0.65 + 40);
      for (let i = 0; i < candidates.length; i++) {
        const m = candidates[i];
        if (!m || m.isDead) continue;
        const dist = this.distToSegment({ x: m.x, y: m.y }, { x: startX, y: startY }, { x: endX, y: endY });
        if (dist <= 32) {
          m.takeDamage(Math.round(28 * dmgMult), this.game.particles, this.game.floatingTexts);
          m.applySlow(0.5, 3.0, this.game.floatingTexts);
        }
      }

      if (!this.game.world.isColliding(endX, endY, player.radius)) {
        player.x = endX;
        player.y = endY;
      }

    } else if (weaponKey === 'BOW') {
      window.audioManager.playBowRecoil();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, 'BẮN GIẬT LÙI!', '#f97316', 13, 0.9));

      const recoilDist = 110;
      const targetBackX = player.x - Math.cos(angle) * recoilDist;
      const targetBackY = player.y - Math.sin(angle) * recoilDist;

      if (!this.game.world.isColliding(targetBackX, targetBackY, player.radius)) {
        player.x = targetBackX;
        player.y = targetBackY;
      }

      const speed = 420;
      const proj = new Projectile(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 170, Math.round(24 * dmgMult), 'recoil_blast');
      this.game.projectiles.push(proj);

    } else if (weaponKey === 'GUN') {
      window.audioManager.playBowRecoil();
      this.game.floatingTexts.push(new FloatingText(player.x, player.y - 25, '🔥 XẢ ĐẠN PLASMA LIÊN THANH!', '#38bdf8', 13, 1.0));

      const recoilDist = 85;
      const targetBackX = player.x - Math.cos(angle) * recoilDist;
      const targetBackY = player.y - Math.sin(angle) * recoilDist;
      if (!this.game.world.isColliding(targetBackX, targetBackY, player.radius)) {
        player.x = targetBackX;
        player.y = targetBackY;
      }

      const speed = 640;
      const spreadAngles = [-0.24, -0.12, 0, 0.12, 0.24];
      const shotDmg = Math.round(22 * dmgMult);
      for (let sa of spreadAngles) {
        const a = angle + sa;
        this.game.projectiles.push(new Projectile(
          player.x, player.y,
          Math.cos(a) * speed, Math.sin(a) * speed,
          290, shotDmg, 'plasma_bullet', { color: '#facc15' }
        ));
      }
    }
  }

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
