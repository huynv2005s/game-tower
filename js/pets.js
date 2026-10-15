// Companion Pet & Bio-Lab Egg Incubation System (Phase 6 & Evolution Expansion)
// Rules:
// 1. Players can pick up intact Monster Eggs (monster_egg) from Alien Egg nests or monster drops.
// 2. Eggs can be incubated and hatched inside the Bio-Lab Quarantine Zone, OR directly extracted into rare materials, OR used to Upgrade/Evolve the active Pet (Lv.1 -> Lv.3 MAX)!
// 3. Hatching opens a random Pet with specialized abilities (Ranged Bow-like Attack, HP Regen, Toxin Resist/Cleanse, Frost Control, Plasma).
// 4. Strictly ONLY 1 Pet can accompany the player at a time (extra hatched Pets are stored in the Bio-Lab and can be swapped, fused to upgrade the active Pet, or released).

class PetSystem {
  constructor(game) {
    this.game = game;

    // Strictly 1 active pet allowed on player at any time
    this.activePet = null; // { uid, id, speciesId, level, hatchedDay }
    this.storedPets = [];  // Array of { uid, id, speciesId, level, hatchedDay } kept in Bio-Lab

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

  createPetInstance(speciesId, level = 1) {
    if (!CONSTANTS.PET_SPECIES || !CONSTANTS.PET_SPECIES[speciesId]) return null;
    const uid = 'pet_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    return {
      uid,
      id: uid,
      speciesId,
      level: Math.max(1, Math.min(3, level || 1)),
      hatchedDay: (this.game && this.game.dayNight && this.game.dayNight.dayCount) ? this.game.dayNight.dayCount : 1
    };
  }

  // Compute effective stats for a Pet object at its current evolution level (Lv.1 -> Lv.3)
  getPetEffectiveStats(petObj) {
    if (!petObj || !CONSTANTS.PET_SPECIES) return null;
    const base = CONSTANTS.PET_SPECIES[petObj.speciesId];
    if (!base) return null;

    const lv = Math.max(1, Math.min(3, petObj.level || 1));
    const dmgMult = lv === 1 ? 1.0 : (lv === 2 ? 1.45 : 2.0);
    const supportMult = lv === 1 ? 1.0 : (lv === 2 ? 1.5 : 2.2);
    const statMult = lv === 1 ? 1.0 : (lv === 2 ? 1.5 : 2.2);
    const cdMult = lv === 1 ? 1.0 : (lv === 2 ? 0.85 : 0.72);
    const rangeBonus = lv === 1 ? 0 : (lv === 2 ? 35 : 70);
    const stars = '⭐'.repeat(lv);
    const tierTitle = lv === 1 ? 'Lv.1 Cơ Bản' : (lv === 2 ? 'Lv.2 Tinh Anh' : 'Lv.3 Thần Thú MAX');

    return {
      ...base,
      level: lv,
      stars,
      tierTitle,
      displayName: `${base.name} (Lv.${lv})`,
      attackRange: (base.attackRange || 260) + rangeBonus,
      attackCooldown: Math.max(0.28, Number(((base.attackCooldown || 0.85) * cdMult).toFixed(2))),
      damage: Math.round((base.damage || 15) * dmgMult),
      hpRegenPerSec: Number(((base.hpRegenPerSec || 0) * supportMult).toFixed(1)),
      toxinCleansePerSec: Number(((base.toxinCleansePerSec || 0) * supportMult).toFixed(1)),
      burstHealAmount: base.burstHealAmount ? Math.round(base.burstHealAmount * supportMult) : 0,
      projectileCount: lv >= 3 ? 2 : 1,
      statsBonus: {
        hp: Math.round(((base.statsBonus && base.statsBonus.hp) || 0) * statMult),
        armor: Math.round(((base.statsBonus && base.statsBonus.armor) || 0) * statMult),
        toxinResist: Math.round(((base.statsBonus && base.statsBonus.toxinResist) || 0) * statMult),
        speedBonus: Math.round(((base.statsBonus && base.statsBonus.speedBonus) || 0) * statMult)
      }
    };
  }

  getActiveSpecies() {
    if (!this.activePet) return null;
    return this.getPetEffectiveStats(this.activePet);
  }

  getEggUpgradeCost(currentLevel) {
    if (currentLevel === 1) return 1; // Lv.1 -> Lv.2 costs 1 monster_egg
    if (currentLevel === 2) return 2; // Lv.2 -> Lv.3 MAX costs 2 monster_egg
    return 0;
  }

  // Upgrade Active Pet using surplus Monster Eggs in Inventory (Lv.1 -> Lv.2 -> Lv.3 MAX)
  upgradeActivePetWithEgg() {
    if (!this.game || !this.game.player || !this.game.inventory) return false;
    const p = this.game.player;

    if (!this.activePet) {
      const msg = '⚠️ Bạn chưa mang Pet bên người! Hãy ấp hoặc trang bị 1 Pet trước khi nâng cấp.';
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    const curLv = this.activePet.level || 1;
    if (curLv >= 3) {
      const msg = '★ Pet đang mang đã đạt cấp tiến hóa tối đa (⭐⭐⭐ Lv.3 MAX)!';
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    const costEggs = this.getEggUpgradeCost(curLv);
    const haveEggs = this.game.inventory.getItemCount('monster_egg');
    if (haveEggs < costEggs) {
      const msg = `⚠️ Cần ${costEggs} Trứng Quái Vật dư để tiến hóa Pet lên Lv.${curLv + 1} (Hiện có: ${haveEggs} quả)!`;
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 30, msg, '#ef4444', 12, 1.6));
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    // Consume required monster_egg from inventory
    let rem = costEggs;
    for (let i = 0; i < this.game.inventory.slotCount; i++) {
      const s = this.game.inventory.slots[i];
      if (s && s.id === 'monster_egg') {
        const take = Math.min(s.count, rem);
        this.game.inventory.removeItem(i, take);
        rem -= take;
        if (rem <= 0) break;
      }
    }

    this.activePet.level = curLv + 1;
    const newSpec = this.getActiveSpecies();

    if (window.audioManager) window.audioManager.playDayGong();
    if (this.game.particles) {
      this.game.particles.push(new Particle(p.x, p.y, 0, 0, '#facc15', 56, 0.65, 'ring'));
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        this.game.particles.push(new Particle(p.x, p.y, Math.cos(a) * 110, Math.sin(a) * 110, newSpec ? newSpec.color : '#facc15', 4.5, 0.5));
      }
    }

    const msg = `⭐ TIẾN HÓA THÀNH CÔNG: ${newSpec ? newSpec.badgeIcon + ' ' + newSpec.name : 'Pet'} LÊN CẤP ${this.activePet.level} (${newSpec ? newSpec.stars : ''})!`;
    this.game.floatingTexts.push(new FloatingText(p.x, p.y - 42, msg, '#facc15', 14, 2.4));
    if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);

    this.game.inventory.updatePlayerStats();
    if (this.game.inventory.isOpen) this.game.inventory.renderUI();
    if (this.game.updateHUD) this.game.updateHUD(true);
    if (this.game.lab && this.game.lab.isOpen && this.game.lab.currentTab === 'incubator') {
      this.game.lab.renderIncubatorTab();
    }
    return true;
  }

  // Upgrade Active Pet by fusing a Stored/Duplicate Pet in Bio-Lab
  upgradeActivePetWithStored(storedUid = null) {
    if (!this.game || !this.game.player) return false;
    const p = this.game.player;

    if (!this.activePet) {
      const msg = '⚠️ Hãy trang bị 1 Pet bên người trước khi dung hợp nâng cấp!';
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    const curLv = this.activePet.level || 1;
    if (curLv >= 3) {
      const msg = '★ Pet đang mang đã đạt cấp tiến hóa tối đa (⭐⭐⭐ Lv.3 MAX)!';
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    if (!this.storedPets || this.storedPets.length === 0) {
      const msg = '⚠️ Không có Pet dự phòng nào trong Chuồng Lab để dung hợp!';
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    let idx = -1;
    if (storedUid) {
      idx = this.storedPets.findIndex(pt => pt.uid === storedUid || pt.id === storedUid);
    } else {
      // Prefer duplicate species first, otherwise first stored pet
      idx = this.storedPets.findIndex(pt => pt.speciesId === this.activePet.speciesId);
      if (idx === -1) idx = 0;
    }
    if (idx === -1) return false;

    const sacrificed = this.storedPets.splice(idx, 1)[0];
    const sacBase = CONSTANTS.PET_SPECIES[sacrificed.speciesId];
    this.activePet.level = Math.min(3, curLv + 1);
    const newSpec = this.getActiveSpecies();

    // Grant +1 egg_fluid byproduct from bio-fusion
    if (this.game.inventory) {
      this.game.inventory.addItem('egg_fluid', 1);
    }

    if (window.audioManager) window.audioManager.playDayGong();
    if (this.game.particles) {
      this.game.particles.push(new Particle(p.x, p.y, 0, 0, '#c084fc', 56, 0.65, 'ring'));
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        this.game.particles.push(new Particle(p.x, p.y, Math.cos(a) * 105, Math.sin(a) * 105, newSpec ? newSpec.color : '#c084fc', 4, 0.5));
      }
    }

    const msg = `🧬 DUNG HỢP [${sacBase ? sacBase.name : 'Pet'}] ➔ ${newSpec ? newSpec.name : 'Pet'} LÊN LV.${this.activePet.level} (${newSpec ? newSpec.stars : ''}) & +1 Dịch Trứng!`;
    this.game.floatingTexts.push(new FloatingText(p.x, p.y - 42, msg, '#facc15', 13, 2.4));
    if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);

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

  // Directly extract 1 or all surplus Monster Eggs in Bio-Lab into Egg Fluid + Alien Chitin + Plasma Core
  extractEggInLab(count = 1) {
    if (!this.game || !this.game.player || !this.game.inventory) return false;
    const p = this.game.player;
    const haveEggs = this.game.inventory.getItemCount('monster_egg');

    if (haveEggs < 1) {
      const msg = '⚠️ Không có Trứng Quái Vật nào trong Balo để chiết xuất!';
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    const extractCount = Math.max(1, Math.min(haveEggs, count));
    let rem = extractCount;
    for (let i = 0; i < this.game.inventory.slotCount; i++) {
      const s = this.game.inventory.slots[i];
      if (s && s.id === 'monster_egg') {
        const take = Math.min(s.count, rem);
        this.game.inventory.removeItem(i, take);
        rem -= take;
        if (rem <= 0) break;
      }
    }

    const fluidGain = extractCount * 2;
    const chitinGain = extractCount * 2;
    const plasmaGain = extractCount * 1;

    this.game.inventory.addItem('egg_fluid', fluidGain);
    this.game.inventory.addItem('alien_chitin', chitinGain);
    this.game.inventory.addItem('plasma_core', plasmaGain);

    if (window.audioManager) window.audioManager.playEquip();
    if (this.game.particles) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        this.game.particles.push(new Particle(p.x, p.y, Math.cos(a) * 65, Math.sin(a) * 65, '#38bdf8', 3.5, 0.4));
      }
    }

    const msg = `🧪 ĐÃ CHIẾT XUẤT ${extractCount} TRỨNG: +${fluidGain} Dịch Trứng, +${chitinGain} Giáp Xác, +${plasmaGain} Lõi Plasma!`;
    this.game.floatingTexts.push(new FloatingText(p.x, p.y - 34, msg, '#38bdf8', 13, 2.0));
    if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);

    if (this.game.inventory.isOpen) this.game.inventory.renderUI();
    if (this.game.updateHUD) this.game.updateHUD(true);
    if (this.game.lab && this.game.lab.isOpen) {
      if (this.game.lab.currentTab === 'incubator') {
        this.game.lab.renderIncubatorTab();
      } else if (this.game.lab.currentTab === 'lab') {
        this.game.lab.switchTab('lab');
      }
    }
    return true;
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

    const newPet = this.createPetInstance(chosenKey, 1);

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
      const msg = `🐣 ẤP NỞ THÀNH CÔNG: ${spec.badgeIcon} ${spec.name} (⭐ Lv.1) — ĐÃ MANG BÊN NGƯỜI (1/1)!`;
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 42, msg, spec.color, 13, 2.5));
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
    } else {
      this.storedPets.unshift(newPet);
      const curSpec = this.getActiveSpecies();
      const msg = `🐣 NỞ RA: ${spec.badgeIcon} ${spec.name}! (Đã lưu vào Chuồng Lab — Có thể Đổi Mang Theo hoặc Dung Hợp Tăng Sao cho ${curSpec ? curSpec.name : 'Pet đang mang'}!)`;
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 42, `🐣 NỞ PET MỚI: ${spec.name}! (Đã lưu vào Phòng Lab)`, spec.color, 13, 2.4));
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
    const idx = this.storedPets.findIndex(pt => pt.uid === uid || pt.id === uid);
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
      const msg = `🐾 ĐÃ MANG BÊN NGƯỜI (1/1): ${spec.badgeIcon} ${spec.name} (${spec.stars} Lv.${spec.level})!`;
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

  // Release a stored pet back to nature in exchange for Egg Fluid + Alien Chitin
  releaseStoredPet(uid) {
    const idx = this.storedPets.findIndex(pt => pt.uid === uid || pt.id === uid);
    if (idx === -1) return false;
    const removed = this.storedPets.splice(idx, 1)[0];
    const spec = CONSTANTS.PET_SPECIES[removed.speciesId];
    const lv = removed.level || 1;
    const fluidReward = lv * 2;
    const chitinReward = lv;

    if (this.game && this.game.inventory) {
      this.game.inventory.addItem('egg_fluid', fluidReward);
      this.game.inventory.addItem('alien_chitin', chitinReward);
    }
    if (window.audioManager) window.audioManager.playEquip();
    const msg = `🧬 Đã phóng thích ${spec ? spec.name : 'Pet'} (Lv.${lv}) thu hồi +${fluidReward} Dịch Trứng & +${chitinReward} Giáp Xác!`;
    if (this.game && this.game.saveManager) this.game.saveManager.showSaveToast(msg);

    if (this.game.lab && this.game.lab.isOpen && this.game.lab.currentTab === 'incubator') {
      this.game.lab.renderIncubatorTab();
    }
    return true;
  }

  update(dt) {
    // 1. Update Bio-Lab Egg Incubator timer
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
            this.game.floatingTexts.push(new FloatingText(p.x, p.y - 28, `💚 +${Math.round(healAmt)} HP (${spec.name} Lv.${spec.level})`, '#4ade80', 12, 1.0));
          }
        }
      }
    }

    // 5. Ranged Auto-Attack on Nearby Monsters
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
    const baseAngle = Math.atan2(target.y - this.petY, target.x - this.petX);
    const speed = 490;
    const range = (spec.attackRange || 260) + 40;

    let dmg = spec.damage || 15;
    let projType = spec.projectileType || 'pet_arrow';
    let extra = { color: spec.color, petId: spec.id, petLevel: spec.level || 1 };

    // Archer Pet every 3rd shot fires a Piercing Critical Arrow!
    if (spec.id === 'pet_archer' && this.shotCounter % 3 === 0) {
      dmg = Math.round(dmg * 1.75);
      extra.isCritArrow = true;
      if (this.game.floatingTexts && this.game.floatingTexts.length < 38) {
        this.game.floatingTexts.push(new FloatingText(this.petX, this.petY - 18, '🏹 TÊN XUYÊN PHÁ!', '#ffb74d', 10, 0.65));
      }
    }

    // Lv.3 MAX Pet fires Twin Projectiles!
    const count = spec.projectileCount || 1;
    if (count >= 2) {
      const spread = 0.11;
      for (let s = -1; s <= 1; s += 2) {
        const a = baseAngle + s * (spread / 2);
        this.game.projectiles.push(
          new Projectile(this.petX, this.petY, Math.cos(a) * speed, Math.sin(a) * speed, range, dmg, projType, { ...extra })
        );
      }
    } else {
      this.game.projectiles.push(
        new Projectile(this.petX, this.petY, Math.cos(baseAngle) * speed, Math.sin(baseAngle) * speed, range, dmg, projType, extra)
      );
    }

    if (this.game.particles && this.game.particles.length < 150) {
      this.game.particles.push(new Particle(this.petX + Math.cos(baseAngle) * 10, this.petY + Math.sin(baseAngle) * 10, 0, 0, spec.color, 4, 0.12));
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

    // 2. Elemental companion aura ring (enhanced for Lv.2 and Lv.3)
    ctx.strokeStyle = spec.color;
    ctx.lineWidth = spec.level >= 2 ? 1.8 : 1.3;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(sx, sy, 14 + Math.sin(this.bobTimer * 1.5) * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    if (spec.level >= 3) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(sx, sy, 18 + Math.cos(this.bobTimer * 2.0) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // 3. Draw Pet Sprite
    const sprite = window.pixelArt.get(spec.sprite);
    if (sprite) {
      ctx.drawImage(sprite, sx - 16, sy - 16, 32, 32);
    }

    // 4. Overhead Pet Name Tag with Star Level
    ctx.font = 'bold 9px "Segoe UI", Tahoma, sans-serif';
    ctx.textAlign = 'center';
    const label = `${spec.badgeIcon} ${spec.name} [Lv.${spec.level}]`;
    const tw = ctx.measureText(label).width + 8;
    ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
    ctx.strokeStyle = spec.level >= 3 ? '#facc15' : spec.color;
    ctx.lineWidth = 1;
    ctx.fillRect(sx - tw / 2, sy - 28, tw, 12);
    ctx.strokeRect(sx - tw / 2, sy - 28, tw, 12);
    ctx.fillStyle = spec.level >= 3 ? '#fde047' : '#ffffff';
    ctx.fillText(label, sx, sy - 19);

    ctx.restore();
  }
}

window.PetSystem = PetSystem;
