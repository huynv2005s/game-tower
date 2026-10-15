// Companion Pet & Bio-Lab Egg Incubation System (Phase 6)
// Rules:
// 1. Players can pick up intact Monster Eggs (monster_egg) from Alien Egg nests or monster drops.
// 2. Eggs can ONLY be incubated and hatched when the player is inside the Bio-Lab Quarantine Zone.
// 3. Hatching opens a random Pet with specialized abilities (Ranged Bow-like Attack, HP Regen, Toxin Resist/Cleanse, Frost Control, Plasma).
// 4. Strictly ONLY 1 Pet can accompany the player at a time (extra hatched Pets are stored in the Bio-Lab).

class PetSystem {
  constructor(game) {
    this.game = game;

    // Strictly 1 active pet allowed on player at any time
    this.activePet = null; // { uid, speciesId, hatchedDay }
    this.storedPets = [];  // Array of { uid, speciesId, hatchedDay } kept in Bio-Lab

    // Bio-Lab Egg Incubator State
    this.incubator = {
      hasEgg: false,
      progress: 0,
      duration: CONSTANTS.PET_INCUBATION_TIME || 10,
      ready: false
    };

    // Runtime physical & combat state for the active accompanying Pet
    this.petX = 0;
    this.petY = 0;
    this.bobTimer = 0;
    this.orbitAngle = -0.8;
    this.attackCooldownTimer = 0;
    this.passiveTickTimer = 0;
    this.burstHealTimer = 0;
    this.shotCounter = 0;
    this.lastHatchedPet = null;
    this._lastIncubatorPercent = -1;
    this._lastInLabState = null;
  }

  getActiveSpecies() {
    if (!this.activePet || !CONSTANTS.PET_SPECIES) return null;
    return CONSTANTS.PET_SPECIES[this.activePet.speciesId] || null;
  }

  // Check if player is currently inside the Bio-Lab Quarantine Zone
  isPlayerInBioLab() {
    if (!this.game || !this.game.player || !this.game.world) return false;
    const p = this.game.player;
    if (this.game.world.isInsideIsolation(p.x, p.y)) return true;

    // Also check proximity to Bio-Lab structure (radius 180px from center)
    for (let s of this.game.world.structures) {
      if (s.type === 'biolab') {
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;
        if (Math.hypot(p.x - cx, p.y - cy) <= 180) {
          return true;
        }
      }
    }
    return false;
  }

  // Place 1 monster_egg into the Bio-Lab Incubator (Strictly requires being inside Bio-Lab)
  startIncubation() {
    if (!this.game || !this.game.player || !this.game.inventory) return false;
    const p = this.game.player;

    if (!this.isPlayerInBioLab()) {
      const warnMsg = '⚠️ CHỈ ẤP ĐƯỢC TRONG PHÒNG LAB! Hãy mang Trứng Quái Vật về Khu Cách Ly Phòng Lab [F] để ấp!';
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 35, warnMsg, '#ef4444', 12, 2.0));
      if (this.game.saveManager) this.game.saveManager.showSaveToast(warnMsg);
      return false;
    }

    if (this.incubator.hasEgg) {
      const msg = this.incubator.ready
        ? '🐣 Trứng trong Lồng Ấp đã chín! Hãy bấm "MỞ TRỨNG NỞ PET NGẪU NHIÊN"!'
        : '⏳ Lồng Ấp đang ấp 1 quả trứng! Hãy chờ hoặc bấm Kích Nở Nhanh.';
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    const eggCount = this.game.inventory.getItemCount('monster_egg');
    if (eggCount < 1) {
      const msg = '⚠️ Bạn chưa có Trứng Quái Vật Nguyên Vẹn! Hãy lên Vùng Núi nhặt Ổ Trứng [Phím F / Đánh] hoặc hạ quái vật!';
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 30, msg, '#facc15', 12, 1.8));
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    // Consume 1 monster_egg from inventory
    const slotIdx = this.game.inventory.slots.findIndex(s => s && s.id === 'monster_egg');
    if (slotIdx === -1) return false;
    this.game.inventory.removeItem(slotIdx, 1);

    this.incubator.hasEgg = true;
    this.incubator.progress = 0;
    this.incubator.duration = CONSTANTS.PET_INCUBATION_TIME || 10;
    this.incubator.ready = false;
    this._lastIncubatorPercent = -1;

    if (window.audioManager) window.audioManager.playEquip();
    const startMsg = '🥚 ĐÃ ĐẶT TRỨNG QUÁI VẬT VÀO LỒNG ẤP PHÒNG LAB!';
    this.game.floatingTexts.push(new FloatingText(p.x, p.y - 32, startMsg, '#38bdf8', 13, 1.5));
    if (this.game.saveManager) this.game.saveManager.showSaveToast(startMsg);

    if (this.game.lab && this.game.lab.isOpen && this.game.lab.currentTab === 'incubator') {
      this.game.lab.renderIncubatorTab();
    }
    return true;
  }

  // Instant bio-pulse boost in Bio-Lab so player can finish incubation immediately
  boostIncubation() {
    if (!this.incubator.hasEgg || this.incubator.ready) return false;
    if (!this.isPlayerInBioLab()) {
      if (this.game.saveManager) {
        this.game.saveManager.showSaveToast('⚠️ Bạn phải đứng bên trong Phòng Lab Cách Ly để kích hoạt Lồng Ấp!');
      }
      return false;
    }

    this.incubator.progress = this.incubator.duration;
    this.incubator.ready = true;
    this._lastIncubatorPercent = 100;

    if (window.audioManager) window.audioManager.playDayGong();
    if (this.game.lab && this.game.lab.isOpen && this.game.lab.currentTab === 'incubator') {
      this.game.lab.renderIncubatorTab();
    }
    return true;
  }

  // Hatch the incubated egg into a random Companion Pet (Strictly inside Bio-Lab)
  hatchEgg() {
    if (!this.game || !this.game.player) return false;
    const p = this.game.player;

    if (!this.isPlayerInBioLab()) {
      const warnMsg = '⚠️ CHỈ MỞ TRỨNG NỞ ĐƯỢC TRONG PHÒNG LAB! Hãy đứng trong Khu Cách Ly Phòng Lab!';
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 35, warnMsg, '#ef4444', 12, 2.0));
      if (this.game.saveManager) this.game.saveManager.showSaveToast(warnMsg);
      return false;
    }

    if (!this.incubator.hasEgg || !this.incubator.ready) return false;

    const speciesKeys = Object.keys(CONSTANTS.PET_SPECIES);
    // Weighted random selection: slightly favor unowned species while keeping all 5 random
    const ownedSet = new Set();
    if (this.activePet) ownedSet.add(this.activePet.speciesId);
    for (let sp of this.storedPets) ownedSet.add(sp.speciesId);

    const pool = [];
    for (let key of speciesKeys) {
      const weight = ownedSet.has(key) ? 2 : 5;
      for (let w = 0; w < weight; w++) pool.push(key);
    }
    const chosenKey = pool[Math.floor(Math.random() * pool.length)] || speciesKeys[0];
    const spec = CONSTANTS.PET_SPECIES[chosenKey];

    const newPet = {
      uid: 'pet_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      speciesId: chosenKey,
      hatchedDay: (this.game.dayNight && this.game.dayNight.dayCount) ? this.game.dayNight.dayCount : 1
    };

    // Reset incubator
    this.incubator.hasEgg = false;
    this.incubator.progress = 0;
    this.incubator.ready = false;
    this.lastHatchedPet = newPet;
    this._lastIncubatorPercent = -1;

    // Celebration Audio & Particles
    if (window.audioManager) window.audioManager.playDayGong();
    if (this.game.particles) {
      this.game.particles.push(new Particle(p.x, p.y, 0, 0, spec.color, 48, 0.55, 'ring'));
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        this.game.particles.push(new Particle(p.x, p.y, Math.cos(a) * 90, Math.sin(a) * 90, spec.color, 4, 0.45));
      }
    }

    // Enforce Rule: ONLY 1 Pet can be carried with the player!
    if (!this.activePet) {
      this.activePet = newPet;
      this.petX = p.x - 28;
      this.petY = p.y - 20;
      const msg = `🐣 ẤP NỞ THÀNH CÔNG: ${spec.badgeIcon} ${spec.name} (${spec.role}) — ĐÃ MANG BÊN NGƯỜI (1/1)!`;
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 42, msg, spec.color, 13, 2.5));
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
    } else {
      this.storedPets.unshift(newPet);
      const curSpec = this.getActiveSpecies();
      const msg = `🐣 NỞ RA: ${spec.badgeIcon} ${spec.name}! (Đang mang ${curSpec ? curSpec.name : '1 Pet'} nên Pet mới được lưu vào Chuồng Lab — Bấm "Đổi Mang Theo" nếu muốn thay thế!)`;
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 42, `🐣 NỞ PET MỚI: ${spec.name}! (Đã lưu vào Phòng Lab - Tối đa mang 1 Pet)`, spec.color, 13, 2.4));
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
    }

    if (this.game.inventory) {
      this.game.inventory.updatePlayerStats();
      if (this.game.inventory.isOpen) this.game.inventory.renderUI();
    }
    if (this.game.updateHUD) this.game.updateHUD(true);
    if (this.game.lab && this.game.lab.isOpen && this.game.lab.currentTab === 'incubator') {
      this.game.lab.renderIncubatorTab();
    }

    return true;
  }

  // Equip a Pet from storedPets (swapping out current activePet so player NEVER has more than 1 Pet)
  equipPet(uid) {
    const idx = this.storedPets.findIndex(pt => pt.uid === uid);
    if (idx === -1) return false;

    const targetPet = this.storedPets.splice(idx, 1)[0];
    if (this.activePet) {
      this.storedPets.unshift(this.activePet);
    }
    this.activePet = targetPet;

    if (this.game && this.game.player) {
      this.petX = this.game.player.x - 28;
      this.petY = this.game.player.y - 20;
    }

    const spec = this.getActiveSpecies();
    if (window.audioManager) window.audioManager.playEquip();

    if (spec && this.game && this.game.player) {
      const msg = `🐾 ĐÃ MANG BÊN NGƯỜI (1/1): ${spec.badgeIcon} ${spec.name} (${spec.role})!`;
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 32, msg, spec.color, 13, 1.6));
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
    }

    if (this.game.inventory) {
      this.game.inventory.updatePlayerStats();
      if (this.game.inventory.isOpen) this.game.inventory.renderUI();
    }
    if (this.game.updateHUD) this.game.updateHUD(true);
    if (this.game.lab && this.game.lab.isOpen && this.game.lab.currentTab === 'incubator') {
      this.game.lab.renderIncubatorTab();
    }
    return true;
  }

  // Unequip the current activePet back to Bio-Lab storage
  unequipActivePet() {
    if (!this.activePet) return false;
    const oldSpec = this.getActiveSpecies();
    this.storedPets.unshift(this.activePet);
    this.activePet = null;

    if (window.audioManager) window.audioManager.playEquip();
    const msg = `🏠 Đã cất ${oldSpec ? oldSpec.name : 'Pet'} vào Chuồng Phòng Lab!`;
    if (this.game && this.game.saveManager) this.game.saveManager.showSaveToast(msg);

    if (this.game.inventory) {
      this.game.inventory.updatePlayerStats();
      if (this.game.inventory.isOpen) this.game.inventory.renderUI();
    }
    if (this.game.updateHUD) this.game.updateHUD(true);
    if (this.game.lab && this.game.lab.isOpen && this.game.lab.currentTab === 'incubator') {
      this.game.lab.renderIncubatorTab();
    }
    return true;
  }

  // Release a stored pet back to nature in exchange for +1 egg_fluid
  releaseStoredPet(uid) {
    const idx = this.storedPets.findIndex(pt => pt.uid === uid);
    if (idx === -1) return false;
    const removed = this.storedPets.splice(idx, 1)[0];
    const spec = CONSTANTS.PET_SPECIES[removed.speciesId];

    if (this.game && this.game.inventory) {
      this.game.inventory.addItem('egg_fluid', 1);
    }
    if (window.audioManager) window.audioManager.playEquip();
    const msg = `🧬 Đã phóng thích ${spec ? spec.name : 'Pet'} và thu hồi +1 Dịch Tuyến Trứng!`;
    if (this.game && this.game.saveManager) this.game.saveManager.showSaveToast(msg);

    if (this.game.lab && this.game.lab.isOpen && this.game.lab.currentTab === 'incubator') {
      this.game.lab.renderIncubatorTab();
    }
    return true;
  }

  update(dt) {
    // 1. Update Bio-Lab Egg Incubator timer (only progresses while inside Bio-Lab or once placed in Bio-Lab incubator)
    if (this.incubator.hasEgg && !this.incubator.ready) {
      this.incubator.progress += dt;
      if (this.incubator.progress >= this.incubator.duration) {
        this.incubator.progress = this.incubator.duration;
        this.incubator.ready = true;
        if (this.game && this.game.saveManager) {
          this.game.saveManager.showSaveToast('🐣 TRỨNG TRONG PHÒNG LAB ĐÃ CHÍN (100%)! Hãy vào Phòng Lab mở trứng nhận Pet!');
        }
      }
    }

    // Re-render Incubator tab lazily only when percentage integer or lab-proximity changes
    if (this.game && this.game.lab && this.game.lab.isOpen && this.game.lab.currentTab === 'incubator') {
      const pct = this.incubator.hasEgg ? Math.floor((this.incubator.progress / this.incubator.duration) * 100) : -1;
      const inLab = this.isPlayerInBioLab();
      if (pct !== this._lastIncubatorPercent || inLab !== this._lastInLabState) {
        this._lastIncubatorPercent = pct;
        this._lastInLabState = inLab;
        this.game.lab.renderIncubatorTab();
      }
    }

    // 2. Update Active Accompanying Pet (Strictly 1 Pet)
    if (!this.activePet || !this.game || !this.game.player || this.game.player.isDead) return;
    const p = this.game.player;
    const spec = this.getActiveSpecies();
    if (!spec) return;

    this.bobTimer += dt * 4.2;
    this.orbitAngle += dt * 0.65;

    // Initialize position if needed or snap if too far
    if (this.petX === 0 && this.petY === 0) {
      this.petX = p.x - 28;
      this.petY = p.y - 20;
    }
    const distToPlayer = Math.hypot(p.x - this.petX, p.y - this.petY);
    if (distToPlayer > 360) {
      this.petX = p.x - 28;
      this.petY = p.y - 20;
    } else {
      // Smoothly hover beside the player
      const targetX = p.x + Math.cos(this.orbitAngle) * 32;
      const targetY = p.y + Math.sin(this.orbitAngle) * 24 - 10;
      this.petX += (targetX - this.petX) * Math.min(1, dt * 6.5);
      this.petY += (targetY - this.petY) * Math.min(1, dt * 6.5);
    }

    // 3. Passive Support Skills: HP Regen & Toxin Cleanse
    this.passiveTickTimer += dt;
    if (this.passiveTickTimer >= 1.0) {
      this.passiveTickTimer -= 1.0;

      // HP Regeneration
      if (spec.hpRegenPerSec > 0 && p.hp < p.maxHp) {
        const beforeHp = p.hp;
        p.hp = Math.min(p.maxHp, p.hp + spec.hpRegenPerSec);
        const healed = p.hp - beforeHp;
        if (healed >= 0.5 && this.game.particles && this.game.particles.length < 150) {
          this.game.particles.push(new Particle(p.x + (Math.random() - 0.5) * 16, p.y - 8, 0, -22, '#4ade80', 3, 0.35));
        }
      }

      // Toxin Cleansing
      if (spec.toxinCleansePerSec > 0 && p.infection > 0) {
        p.infection = Math.max(0, p.infection - spec.toxinCleansePerSec);
        if (this.game.particles && this.game.particles.length < 150) {
          this.game.particles.push(new Particle(p.x + (Math.random() - 0.5) * 16, p.y - 6, 0, -20, '#c084fc', 3, 0.35));
        }
      }
    }

    // 4. Periodic Burst Heal Wave (e.g., Healer Pet)
    if (spec.burstHealAmount && spec.burstHealInterval) {
      this.burstHealTimer += dt;
      if (this.burstHealTimer >= spec.burstHealInterval) {
        this.burstHealTimer = 0;
        if (p.hp < p.maxHp) {
          const healAmt = Math.min(spec.burstHealAmount, p.maxHp - p.hp);
          p.hp = Math.min(p.maxHp, p.hp + spec.burstHealAmount);
          if (this.game.particles) {
            this.game.particles.push(new Particle(p.x, p.y, 0, 0, '#4ade80', 32, 0.4, 'ring'));
          }
          if (this.game.floatingTexts && this.game.floatingTexts.length < 40) {
            this.game.floatingTexts.push(new FloatingText(p.x, p.y - 28, `💚 +${Math.round(healAmt)} HP (${spec.name})`, '#4ade80', 12, 1.0));
          }
        }
      }
    }

    // 5. Ranged Auto-Attack on Nearby Monsters (Bow-like ranged shooting, frost bolts, plasma, etc.)
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt;
    }

    if (this.attackCooldownTimer <= 0 && this.game.monsters && this.game.monsters.length > 0) {
      let bestTarget = null;
      let bestDist = spec.attackRange || 260;

      for (let i = 0; i < this.game.monsters.length; i++) {
        const m = this.game.monsters[i];
        if (m.isDead) continue;
        // Only shoot training dummy if player is right next to it and attacking
        if (m.species === 'dummy' && Math.hypot(p.x - m.x, p.y - m.y) > 150) continue;

        const d = Math.hypot(m.x - this.petX, m.y - this.petY);
        if (d <= bestDist) {
          bestDist = d;
          bestTarget = m;
        }
      }

      if (bestTarget) {
        this.attackCooldownTimer = spec.attackCooldown || 0.85;
        this.shotCounter++;
        this.firePetProjectile(spec, bestTarget);
      }
    }
  }

  firePetProjectile(spec, target) {
    if (!this.game || !this.game.projectiles) return;
    const angle = Math.atan2(target.y - this.petY, target.x - this.petX);
    const speed = 480;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const range = (spec.attackRange || 260) + 40;

    let dmg = spec.damage || 15;
    let projType = spec.projectileType || 'pet_arrow';
    let extra = { color: spec.color, petId: spec.id };

    // Archer Pet every 3rd shot fires a Piercing Critical Arrow!
    if (spec.id === 'pet_archer' && this.shotCounter % 3 === 0) {
      dmg = Math.round(dmg * 1.75);
      extra.isCritArrow = true;
      if (this.game.floatingTexts && this.game.floatingTexts.length < 38) {
        this.game.floatingTexts.push(new FloatingText(this.petX, this.petY - 18, '🏹 TÊN XUYÊN PHÁ!', '#ffb74d', 10, 0.65));
      }
    }

    this.game.projectiles.push(new Projectile(this.petX, this.petY, vx, vy, range, dmg, projType, extra));

    if (this.game.particles && this.game.particles.length < 150) {
      this.game.particles.push(new Particle(this.petX + Math.cos(angle) * 10, this.petY + Math.sin(angle) * 10, 0, 0, spec.color, 4, 0.12));
    }
  }

  render(ctx, camera) {
    if (!this.activePet || !this.game || !this.game.player || this.game.player.isDead) return;
    const spec = this.getActiveSpecies();
    if (!spec) return;

    const sx = this.petX - camera.x;
    const sy = this.petY - camera.y + Math.sin(this.bobTimer) * 3.5;
    if (sx < -60 || sx > camera.width + 60 || sy < -60 || sy > camera.height + 60) return;

    ctx.save();

    // 1. Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, this.petY - camera.y + 12, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Elemental companion aura ring
    ctx.strokeStyle = spec.color;
    ctx.lineWidth = 1.3;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(sx, sy, 14 + Math.sin(this.bobTimer * 1.5) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // 3. Draw Pet Sprite
    const sprite = window.pixelArt.get(spec.sprite);
    if (sprite) {
      ctx.drawImage(sprite, sx - 16, sy - 16, 32, 32);
    }

    // 4. Overhead Pet Name Tag
    ctx.font = 'bold 9px "Segoe UI", Tahoma, sans-serif';
    ctx.textAlign = 'center';
    const label = `${spec.badgeIcon} ${spec.name}`;
    const tw = ctx.measureText(label).width + 8;
    ctx.fillStyle = 'rgba(9, 13, 22, 0.82)';
    ctx.strokeStyle = spec.color;
    ctx.lineWidth = 1;
    ctx.fillRect(sx - tw / 2, sy - 28, tw, 12);
    ctx.strokeRect(sx - tw / 2, sy - 28, tw, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, sx, sy - 19);

    ctx.restore();
  }
}

window.PetSystem = PetSystem;
