// Defensive Structures & Tower Defense Building & Upgrade System
// Refactored for Data-Driven Extensibility + O(1) Tile Hash Map & SpatialGrid Queries

class MortarShell {
  constructor(startX = 0, startY = 0, targetX = 0, targetY = 0, damage = 55, aoeRadius = 65, level = 1, stunDuration = 0) {
    this.reset(startX, startY, targetX, targetY, damage, aoeRadius, level, stunDuration);
  }

  reset(startX, startY, targetX, targetY, damage = 55, aoeRadius = 65, level = 1, stunDuration = 0) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.damage = damage;
    this.aoeRadius = aoeRadius;
    this.level = level;
    this.stunDuration = stunDuration;

    this.progress = 0;
    this.duration = level >= 3 ? 0.85 : (level === 2 ? 0.98 : 1.1);
    this.isDead = false;
    this.x = startX;
    this.y = startY;
    this.height = 0;
    return this;
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
    this.height = Math.sin(t * Math.PI) * (this.level >= 3 ? 85 : 70);

    // Trailing smoke particles (throttled for 60fps performance)
    if (Math.random() < 0.3 && particles.length < 160) {
      const trailCol = this.level >= 3 ? '#c084fc' : (this.level === 2 ? '#fb923c' : '#64748b');
      particles.push(new Particle(this.x, this.y - this.height, 0, -10, trailCol, 3, 0.25));
    }

    return true;
  }

  explode(monsters, particles, floatingTexts) {
    this.isDead = true;
    window.audioManager.playBowRecoil();

    const ringCol1 = this.level >= 3 ? '#d946ef' : '#ef4444';
    const ringCol2 = this.level >= 3 ? '#facc15' : '#f97316';

    particles.push(new Particle(this.targetX, this.targetY, 0, 0, ringCol1, this.aoeRadius, 0.48, 'ring'));
    particles.push(new Particle(this.targetX, this.targetY, 0, 0, ringCol2, this.aoeRadius * 0.68, 0.35, 'ring'));

    const pCount = Math.min(16, 190 - particles.length);
    for (let i = 0; i < pCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 95;
      const pCol = this.level >= 3
        ? ((i % 2 === 0) ? '#facc15' : '#e879f9')
        : ((i % 2 === 0) ? '#fde047' : '#ea580c');
      particles.push(new Particle(
        this.targetX, this.targetY,
        Math.cos(a) * spd, Math.sin(a) * spd,
        pCol,
        4 + Math.random() * 3,
        0.4
      ));
    }

    const boomLabel = this.level >= 3
      ? '☢ SIÊU PHÁO HẠT NHÂN!'
      : (this.level === 2 ? '🔥 PHÁO NHIỆT HẠCH!' : '💥 BOOM! (SÚNG CỐI)');
    if (floatingTexts.length < 40) {
      floatingTexts.push(new FloatingText(this.targetX, this.targetY - 20, boomLabel, ringCol2, 13, 1.1));
    }

    // O(1) SpatialGrid query for AoE blast damage
    const game = window.gameEngine;
    const candidates = (game && game.monsterGrid)
      ? game.monsterGrid.queryRadius(this.targetX, this.targetY, this.aoeRadius)
      : monsters;

    for (let i = 0; i < candidates.length; i++) {
      const m = candidates[i];
      if (!m || m.isDead) continue;
      const dist = Math.hypot(m.x - this.targetX, m.y - this.targetY);
      if (dist <= this.aoeRadius) {
        m.takeDamage(this.damage, particles, floatingTexts);
        if (this.stunDuration > 0) {
          m.applyStun(this.stunDuration, floatingTexts);
        }
        if (this.level >= 2) {
          m.applySlow(0.5, 2.5, floatingTexts);
        }
        const angle = Math.atan2(m.y - this.targetY, m.x - this.targetX);
        const kbForce = this.level >= 3 ? 280 : 220;
        m.applyKnockback(Math.cos(angle) * kbForce, Math.sin(angle) * kbForce, 0.35);
      }
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y - this.height;
    if (sx < -40 || sx > camera.width + 40 || sy < -40 || sy > camera.height + 40) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x - camera.x, this.y - camera.y, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.level >= 3 ? '#d946ef' : (this.level === 2 ? '#f97316' : '#dc2626');
    ctx.beginPath();
    ctx.arc(sx, sy, this.level >= 2 ? 6 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(sx - 1, sy - 1, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class BuildingManager {
  constructor(game) {
    this.game = game;
    this.defenses = []; // Placed player defenses: Wall, Trap, Turret, Mortar, or custom registered defenses
    this.mortarShells = [];
    this.buildMode = null; // 'wall', 'trap', 'turret', 'mortar', 'upgrade', or null
    this.hoverTile = { col: 0, row: 0, x: 0, y: 0 };

    // High-Performance O(1) Spatial Indices
    this.tileMap = new Map(); // integer key: (row << 8) | col -> defense object
    this._indexedCount = 0;
    const mapW = (CONSTANTS.MAP_WIDTH_TILES || 110) * (CONSTANTS.TILE_SIZE || 32);
    const mapH = (CONSTANTS.MAP_HEIGHT_TILES || 110) * (CONSTANTS.TILE_SIZE || 32);
    this.defenseGrid = window.SpatialGrid ? new window.SpatialGrid(mapW, mapH, 128) : null;
  }

  _tileKey(col, row) {
    return (row << 8) | col;
  }

  // Ensures O(1) tileMap & SpatialGrid stay synchronized even if saveManager replaces this.defenses
  ensureSpatialSync() {
    if (this._indexedCount !== this.defenses.length) {
      this.rebuildSpatialIndex();
    }
  }

  rebuildSpatialIndex() {
    this.tileMap.clear();
    if (this.defenseGrid) this.defenseGrid.clear();

    const tileSize = CONSTANTS.TILE_SIZE || 32;
    for (let i = 0; i < this.defenses.length; i++) {
      const d = this.defenses[i];
      if (!d) continue;
      if (d.col === undefined || d.row === undefined) {
        d.col = Math.floor(d.x / tileSize);
        d.row = Math.floor(d.y / tileSize);
      }
      this.tileMap.set(this._tileKey(d.col, d.row), d);
      if (this.defenseGrid) {
        this.defenseGrid.insert(d);
      }
    }
    this._indexedCount = this.defenses.length;
  }

  findClosestBlockingDefense(x, y, maxDist = 250) {
    this.ensureSpatialSync();
    if (this.defenseGrid) {
      return this.defenseGrid.findClosest(x, y, maxDist, d => d && d.blocksMovement && d.hp > 0);
    }
    let bestDef = null;
    let bestDistSq = maxDist * maxDist;
    for (let i = 0; i < this.defenses.length; i++) {
      const d = this.defenses[i];
      if (!d || !d.blocksMovement || d.hp <= 0) continue;
      const dx = d.x - x;
      const dy = d.y - y;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestDef = d;
      }
    }
    return bestDef;
  }

  getTierConfig(type, level = 1) {
    const baseCfg = CONSTANTS.DEFENSE[type];
    if (!baseCfg) return null;
    if (baseCfg.tiers && baseCfg.tiers[level]) {
      return baseCfg.tiers[level];
    }
    return baseCfg;
  }

  getStructureSprite(type, level = 1) {
    if (level >= 2) {
      const key = `defense_${type}_lv${level}`;
      const spr = window.pixelArt.get(key);
      if (spr) return spr;
    }
    return window.pixelArt.get(`defense_${type}`);
  }

  enterBuildMode(structType) {
    if (this.buildMode === structType) {
      this.exitBuildMode();
      return;
    }
    this.buildMode = structType;
    if (this.game && this.game.player) {
      const p = this.game.player;
      const frontX = p.x + Math.cos(p.aimAngle || 0) * 40;
      const frontY = p.y + Math.sin(p.aimAngle || 0) * 40;
      this.updateHoverTile(frontX, frontY);
    }

    if (structType === 'upgrade') {
      if (this.game && this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(
          this.game.player.x, this.game.player.y - 30,
          '🔧 CHẾ ĐỘ NÂNG CẤP & SỬA CHỮA: Click vào Tường / Súng trên bản đồ để nâng cấp! (ESC để thoát)',
          '#38bdf8', 12, 1.8
        ));
      }
      return;
    }

    const def = CONSTANTS.ITEM_TYPES['defense_' + structType];
    if (this.game && this.game.floatingTexts && this.game.player) {
      this.game.floatingTexts.push(new FloatingText(
        this.game.player.x, this.game.player.y - 30,
        `CHẾ ĐỘ XÂY: ${def ? def.name : structType} (Click ô trống để đặt, click công trình đã có để NÂNG CẤP)`,
        '#facc15', 12, 1.5
      ));
    }
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

  // O(1) Tile Lookup
  getDefenseAtTile(col, row) {
    this.ensureSpatialSync();
    const direct = this.tileMap.get(this._tileKey(col, row));
    if (direct) return direct;

    // Check 3x3 neighbor tiles if slightly offset
    const tx = col * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;
    const ty = row * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        const d = this.tileMap.get(this._tileKey(c, r));
        if (d && Math.hypot(d.x - tx, d.y - ty) < 24) {
          return d;
        }
      }
    }
    return null;
  }

  canPlaceAt(col, row, structType) {
    if (col < 2 || col >= this.game.world.cols - 2 || row < 2 || row >= this.game.world.rows - 2) {
      return false;
    }

    const tile = this.game.world.getTile(col, row);
    if (
      tile === CONSTANTS.TILES.RIVER_WATER ||
      tile === CONSTANTS.TILES.LAKE_WATER ||
      tile === CONSTANTS.TILES.OCEAN_DEEP ||
      tile === CONSTANTS.TILES.SNOW_PEAK
    ) {
      return false;
    }

    // O(1) check against existing defenses
    if (this.getDefenseAtTile(col, row)) {
      return false;
    }

    const tx = col * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;
    const ty = row * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;

    // Check collision with central base structures
    for (let s of this.game.world.structures) {
      if (tx >= s.x && tx <= s.x + s.width && ty >= s.y && ty <= s.y + s.height) {
        return false;
      }
    }

    return true;
  }

  // Check if player has required materials for an upgrade cost array
  canAffordCost(costArray) {
    if (!costArray || !this.game || !this.game.inventory) return false;
    for (let req of costArray) {
      if (this.game.inventory.getItemCount(req.id) < req.count) {
        return false;
      }
    }
    return true;
  }

  formatCostString(costArray) {
    if (!costArray) return '';
    return costArray.map(req => {
      const has = this.game && this.game.inventory ? this.game.inventory.getItemCount(req.id) : 0;
      const def = CONSTANTS.ITEM_TYPES[req.id];
      const name = def ? def.name : req.name;
      return `${name} (${has}/${req.count})`;
    }).join(' + ');
  }

  consumeCost(costArray) {
    if (!costArray || !this.game || !this.game.inventory) return;
    for (let req of costArray) {
      let needed = req.count;
      for (let i = 0; i < this.game.inventory.slots.length; i++) {
        const slot = this.game.inventory.slots[i];
        if (slot && slot.id === req.id) {
          const take = Math.min(slot.count, needed);
          this.game.inventory.removeItem(i, take);
          needed -= take;
          if (needed <= 0) break;
        }
      }
    }
  }

  // Upgrade or Repair a placed defense structure (Lv.1 -> Lv.2 -> Lv.3)
  upgradeStructure(struct) {
    if (!struct) return false;
    const currentLevel = struct.level || 1;
    const baseCfg = CONSTANTS.DEFENSE[struct.type];
    if (!baseCfg || !baseCfg.tiers) return false;

    if (currentLevel >= 3) {
      const tier3 = baseCfg.tiers[3];
      const maxUses = tier3.maxUses || 45;
      if (struct.hp < struct.maxHp || (struct.type === 'trap' && struct.usesLeft < maxUses)) {
        if (this.game.inventory.getItemCount('stone') >= 1) {
          this.consumeCost([{ id: 'stone', count: 1 }]);
        } else if (this.game.inventory.getItemCount('wood') >= 1) {
          this.consumeCost([{ id: 'wood', count: 1 }]);
        }
        struct.hp = struct.maxHp;
        if (struct.type === 'trap') struct.usesLeft = maxUses;
        window.audioManager.playEquip();
        this.game.floatingTexts.push(new FloatingText(struct.x, struct.y - 25, `🔧 ĐÃ SỬA CHỮA 100%: ${struct.name}!`, '#22c55e', 12, 1.2));
        return true;
      }

      this.game.floatingTexts.push(new FloatingText(struct.x, struct.y - 22, `★ ${struct.name} ĐÃ ĐẠT CẤP TỐI ĐA (LV.3)!`, '#facc15', 12, 1.2));
      return false;
    }

    const nextLevel = currentLevel + 1;
    const nextTier = baseCfg.tiers[nextLevel];
    if (!nextTier) return false;

    if (!this.canAffordCost(nextTier.cost)) {
      const missingText = `THIẾU NGUYÊN LIỆU NÂNG CẤP LV.${nextLevel}: Cần ${this.formatCostString(nextTier.cost)}`;
      this.game.floatingTexts.push(new FloatingText(struct.x, struct.y - 25, missingText, '#ef4444', 11, 1.6));
      if (this.game.saveManager) {
        this.game.saveManager.showSaveToast(`⚠️ ${missingText}`);
      }
      return false;
    }

    this.consumeCost(nextTier.cost);

    struct.level = nextLevel;
    struct.name = nextTier.name;
    struct.maxHp = nextTier.maxHp;
    struct.hp = nextTier.maxHp;
    if (nextTier.maxUses) {
      struct.usesLeft = nextTier.maxUses;
      struct.maxUses = nextTier.maxUses;
    }

    window.audioManager.playEquip();
    const burstColor = nextLevel >= 3 ? '#facc15' : '#38bdf8';
    this.game.particles.push(new Particle(struct.x, struct.y, 0, 0, burstColor, 34, 0.45, 'ring'));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      this.game.particles.push(new Particle(
        struct.x, struct.y,
        Math.cos(a) * 75, Math.sin(a) * 75,
        (i % 2 === 0) ? '#facc15' : '#38bdf8',
        4, 0.35
      ));
    }

    const msg = `⬆ NÂNG CẤP THÀNH CÔNG: ${struct.name} (${struct.maxHp} HP)!`;
    this.game.floatingTexts.push(new FloatingText(struct.x, struct.y - 28, msg, burstColor, 13, 1.6));
    if (this.game.saveManager) {
      this.game.saveManager.showSaveToast(msg);
    }

    if (this.game.lab && this.game.lab.isOpen) {
      this.game.lab.switchTab(this.game.lab.currentTab);
    }

    if (window.EventBus) {
      window.EventBus.emit('building:upgraded', struct);
    }

    return true;
  }

  upgradeNearestOrHovered() {
    if (!this.game || !this.game.player) return false;
    const p = this.game.player;
    const mx = this.game.mouse ? this.game.mouse.worldX : -9999;
    const my = this.game.mouse ? this.game.mouse.worldY : -9999;

    const hovered = this.getStructureAt(mx, my, 26);
    if (hovered) {
      return this.upgradeStructure(hovered);
    }

    let bestStruct = null;
    let bestScore = Infinity;

    const nearList = this.defenseGrid ? this.defenseGrid.queryRadius(p.x, p.y, 110) : this.defenses;
    for (let i = 0; i < nearList.length; i++) {
      const d = nearList[i];
      const dist = Math.hypot(d.x - p.x, d.y - p.y);
      if (dist <= 110) {
        const priorityOffset = (d.level || 1) < 3 ? 0 : 500;
        if (dist + priorityOffset < bestScore) {
          bestScore = dist + priorityOffset;
          bestStruct = d;
        }
      }
    }

    if (bestStruct) {
      return this.upgradeStructure(bestStruct);
    }

    this.game.floatingTexts.push(new FloatingText(p.x, p.y - 25, '💡 Hãy đứng gần hoặc trỏ chuột vào Tường / Súng để nâng cấp [Phím R]!', '#38bdf8', 11, 1.2));
    return false;
  }

  upgradeOneByType(structType) {
    const candidates = this.defenses.filter(d => d.type === structType && (d.level || 1) < 3);
    if (candidates.length === 0) {
      const anyPlaced = this.defenses.some(d => d.type === structType);
      const msg = anyPlaced
        ? `★ Mọi công trình loại này trên bản đồ đều đã đạt Cấp 3 Tối Đa!`
        : `⚠️ Bạn chưa đặt công trình này trên bản đồ! Hãy đặt ra trước rồi nâng cấp.`;
      if (this.game && this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }
    const p = this.game.player;
    candidates.sort((a, b) => {
      const lvDiff = (a.level || 1) - (b.level || 1);
      if (lvDiff !== 0) return lvDiff;
      return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y);
    });
    return this.upgradeStructure(candidates[0]);
  }

  placeStructure(col, row, structType) {
    if (structType === 'upgrade') {
      const existing = this.getDefenseAtTile(col, row);
      if (existing) {
        return this.upgradeStructure(existing);
      } else {
        this.game.floatingTexts.push(new FloatingText(
          this.hoverTile.x, this.hoverTile.y - 15,
          'Click vào một Tường hoặc Súng đã đặt để nâng cấp!', '#94a3b8', 11, 0.9
        ));
        return false;
      }
    }

    const existingAtTile = this.getDefenseAtTile(col, row);
    if (existingAtTile) {
      return this.upgradeStructure(existingAtTile);
    }

    const itemId = 'defense_' + structType;
    const count = this.game.inventory.getItemCount
      ? this.game.inventory.getItemCount(itemId)
      : this.game.inventory.slots.filter(s => s && s.id === itemId).reduce((acc, s) => acc + s.count, 0);

    if (count <= 0) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'HẾT VẬT PHẨM XÂY DỰNG TRONG KHO!', '#ef4444', 12, 1.0));
      this.exitBuildMode();
      return false;
    }

    if (!this.canPlaceAt(col, row, structType)) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'VỊ TRÍ NÀY BỊ VẬT CẢN!', '#ef4444', 11, 0.8));
      return false;
    }

    const slotIdx = this.game.inventory.slots.findIndex(s => s && s.id === itemId);
    if (slotIdx !== -1) {
      this.game.inventory.removeItem(slotIdx, 1);
    }

    const cfg = CONSTANTS.DEFENSE[structType];
    const tier1 = this.getTierConfig(structType, 1);
    const x = col * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;
    const y = row * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;

    const newDef = {
      id: 'def_' + Date.now() + '_' + Math.random(),
      type: structType,
      level: 1,
      name: tier1.name || cfg.name,
      col,
      row,
      x,
      y,
      hp: tier1.maxHp || cfg.maxHp,
      maxHp: tier1.maxHp || cfg.maxHp,
      blocksMovement: cfg.blocksMovement,
      cooldown: 0,
      aimAngle: 0,
      usesLeft: tier1.maxUses || 12,
      maxUses: tier1.maxUses || 12
    };

    this.defenses.push(newDef);
    this.tileMap.set(this._tileKey(col, row), newDef);
    if (this.defenseGrid) this.defenseGrid.insert(newDef);
    this._indexedCount = this.defenses.length;

    window.audioManager.playEquip();
    for (let i = 0; i < 6; i++) {
      this.game.particles.push(new Particle(x, y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, '#38bdf8', 3, 0.25));
    }
    this.game.floatingTexts.push(new FloatingText(x, y - 20, `ĐÃ XÂY: ${newDef.name}!`, '#22c55e', 12, 1.0));

    if (window.EventBus) {
      window.EventBus.emit('building:placed', newDef);
    }

    const remainingCount = this.game.inventory.getItemCount(itemId);
    if (remainingCount <= 0) {
      this.exitBuildMode();
    }

    return true;
  }

  _removeDefense(struct) {
    if (!struct) return;
    this.tileMap.delete(this._tileKey(struct.col, struct.row));
    const idx = this.defenses.indexOf(struct);
    if (idx !== -1) {
      this.defenses.splice(idx, 1);
    }
    this.rebuildSpatialIndex();
  }

  damageStructure(struct, damage, attackerMonster = null) {
    const tierCfg = this.getTierConfig(struct.type, struct.level || 1);
    const armor = (tierCfg && tierCfg.armor) ? tierCfg.armor : 0;
    const effectiveDamage = Math.max(1, damage - armor);

    struct.hp -= effectiveDamage;
    window.audioManager.playHit();

    if (attackerMonster && !attackerMonster.isDead && tierCfg && tierCfg.thorns > 0) {
      attackerMonster.takeDamage(tierCfg.thorns, this.game.particles, this.game.floatingTexts);
      if ((struct.level || 1) >= 3) {
        attackerMonster.applySlow(0.65, 1.5, this.game.floatingTexts);
      }
    }

    if (this.game.particles.length < 160) {
      for (let i = 0; i < 3; i++) {
        this.game.particles.push(new Particle(struct.x, struct.y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, '#64748b', 3, 0.2));
      }
    }

    if (struct.hp <= 0) {
      this.game.floatingTexts.push(new FloatingText(struct.x, struct.y - 15, `${struct.name} BỊ PHÁ HỦY!`, '#ef4444', 12, 1.2));
      this._removeDefense(struct);
      return true;
    }
    return false;
  }

  // O(1) 3x3 Tile Hash Check for Player & Monster Collision (replaces O(N) full defense scan!)
  isBlocking(x, y, radius = 12) {
    this.ensureSpatialSync();
    const tileSize = CONSTANTS.TILE_SIZE || 32;
    const centerCol = Math.floor(x / tileSize);
    const centerRow = Math.floor(y / tileSize);
    const maxDist = 16 + radius;
    const maxDistSq = maxDist * maxDist;

    for (let r = centerRow - 1; r <= centerRow + 1; r++) {
      const rowBits = r << 8;
      for (let c = centerCol - 1; c <= centerCol + 1; c++) {
        const d = this.tileMap.get(rowBits | c);
        if (d && d.blocksMovement) {
          const dx = d.x - x;
          const dy = d.y - y;
          if (dx * dx + dy * dy <= maxDistSq) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // O(1) 3x3 Tile Hash Check to find defense structure near point
  getStructureAt(x, y, radius = 18) {
    this.ensureSpatialSync();
    const tileSize = CONSTANTS.TILE_SIZE || 32;
    const centerCol = Math.floor(x / tileSize);
    const centerRow = Math.floor(y / tileSize);
    const rSq = radius * radius;
    const span = Math.max(1, Math.ceil(radius / tileSize));

    for (let r = centerRow - span; r <= centerRow + span; r++) {
      const rowBits = r << 8;
      for (let c = centerCol - span; c <= centerCol + span; c++) {
        const d = this.tileMap.get(rowBits | c);
        if (d) {
          const dx = d.x - x;
          const dy = d.y - y;
          if (dx * dx + dy * dy <= rSq) {
            return d;
          }
        }
      }
    }
    return null;
  }

  update(dt, monsters, particles, floatingTexts, projectiles) {
    this.ensureSpatialSync();

    // 1. Update Mortar Shells in flight using O(N) in-place compaction
    if (window.updateAndCompact) {
      window.updateAndCompact(this.mortarShells, shell => shell.update(dt, monsters, particles, floatingTexts));
    } else {
      for (let i = this.mortarShells.length - 1; i >= 0; i--) {
        if (!this.mortarShells[i].update(dt, monsters, particles, floatingTexts)) {
          this.mortarShells.splice(i, 1);
        }
      }
    }

    const monsterGrid = this.game ? this.game.monsterGrid : null;

    // 2. Update Defensive Structures Logic
    for (let i = this.defenses.length - 1; i >= 0; i--) {
      const d = this.defenses[i];
      if (!d) continue;
      const lv = d.level || 1;
      const tierCfg = this.getTierConfig(d.type, lv);
      if (!tierCfg) continue;

      if (d.cooldown > 0) d.cooldown -= dt;

      // Passive Regeneration for Upgraded Walls (Lv.2 & Lv.3)
      if (tierCfg.regen > 0 && d.hp < d.maxHp) {
        d.hp = Math.min(d.maxHp, d.hp + tierCfg.regen * dt);
      }

      // ----------------------------------------------------
      // SPIKE TRAP (O(1) SpatialGrid cell neighborhood check)
      // ----------------------------------------------------
      if (d.type === 'trap') {
        if (d.cooldown <= 0) {
          const nearby = monsterGrid ? monsterGrid.getCellNeighborhood(d.x, d.y) : monsters;
          for (let j = 0; j < nearby.length; j++) {
            const m = nearby[j];
            if (!m || m.isDead) continue;
            const dx = m.x - d.x;
            const dy = m.y - d.y;
            if (dx * dx + dy * dy <= 400) {
              d.cooldown = lv >= 3 ? 0.65 : 0.8;
              m.takeDamage(tierCfg.damage, particles, floatingTexts);
              m.applySlow(tierCfg.slowFactor, tierCfg.slowDuration, floatingTexts);
              if (tierCfg.stunDuration > 0) {
                m.applyStun(tierCfg.stunDuration, floatingTexts);
              }

              const sparkCol = lv >= 3 ? '#facc15' : (lv === 2 ? '#38bdf8' : '#22c55e');
              for (let k = 0; k < 5; k++) {
                particles.push(new Particle(d.x, d.y, (Math.random() - 0.5) * 45, (Math.random() - 0.5) * 45, sparkCol, 3, 0.2));
              }

              d.usesLeft--;
              if (d.usesLeft <= 0) {
                floatingTexts.push(new FloatingText(d.x, d.y - 15, `${d.name} ĐÃ MÒN HỎNG!`, '#94a3b8', 11, 1.0));
                this._removeDefense(d);
              }
              break;
            }
          }
        }
      }

      // ----------------------------------------------------
      // WATCHTOWER / TURRET (O(1) SpatialGrid closest target acquisition)
      // ----------------------------------------------------
      else if (d.type === 'turret') {
        if (d.cooldown <= 0) {
          let closestM = null;
          if (monsterGrid) {
            closestM = monsterGrid.findClosest(d.x, d.y, tierCfg.range);
          } else {
            let minDistSq = tierCfg.range * tierCfg.range;
            for (let j = 0; j < monsters.length; j++) {
              const m = monsters[j];
              if (m.isDead) continue;
              const dx = m.x - d.x;
              const dy = m.y - d.y;
              const dSq = dx * dx + dy * dy;
              if (dSq <= minDistSq) {
                minDistSq = dSq;
                closestM = m;
              }
            }
          }

          if (closestM) {
            d.cooldown = tierCfg.fireCooldown;
            d.aimAngle = Math.atan2(closestM.y - d.y, closestM.x - d.x);

            const speed = lv >= 3 ? 720 : (lv === 2 ? 620 : 550);
            const vx = Math.cos(d.aimAngle) * speed;
            const vy = Math.sin(d.aimAngle) * speed;
            const isEmp = this.game && this.game.dayNight && this.game.dayNight.currentWeather === 'EMP_STORM';
            const turretDmg = isEmp ? Math.round(tierCfg.damage * 1.25) : tierCfg.damage;

            if (lv >= 3) {
              projectiles.push(new Projectile(d.x, d.y, vx, vy, tierCfg.range, turretDmg, 'turret_railgun', { chainCount: 2 }));
              particles.push(new Particle(d.x + Math.cos(d.aimAngle) * 16, d.y + Math.sin(d.aimAngle) * 16, 0, 0, '#facc15', 7, 0.14));
            } else if (lv === 2) {
              const perpX = -Math.sin(d.aimAngle) * 4;
              const perpY = Math.cos(d.aimAngle) * 4;
              const halfDmg = Math.ceil(turretDmg * 0.55);
              projectiles.push(new Projectile(d.x + perpX, d.y + perpY, vx, vy, tierCfg.range, halfDmg, 'plasma_bullet', { color: '#e879f9' }));
              projectiles.push(new Projectile(d.x - perpX, d.y - perpY, vx, vy, tierCfg.range, halfDmg, 'plasma_bullet', { color: '#38bdf8' }));
              particles.push(new Particle(d.x + Math.cos(d.aimAngle) * 16, d.y + Math.sin(d.aimAngle) * 16, 0, 0, '#e879f9', 6, 0.12));
            } else {
              projectiles.push(new Projectile(d.x, d.y, vx, vy, tierCfg.range, turretDmg, 'arrow'));
              particles.push(new Particle(d.x + Math.cos(d.aimAngle) * 16, d.y + Math.sin(d.aimAngle) * 16, 0, 0, '#38bdf8', 5, 0.12));
            }
            window.audioManager.playBowShoot();
          }
        }
      }

      // ----------------------------------------------------
      // HEAVY MORTAR (O(1) SpatialGrid target query)
      // ----------------------------------------------------
      else if (d.type === 'mortar') {
        if (d.cooldown <= 0) {
          let targetM = null;
          let maxDist = tierCfg.minRange;
          const candidates = monsterGrid ? monsterGrid.queryRadius(d.x, d.y, tierCfg.range) : monsters;

          for (let j = 0; j < candidates.length; j++) {
            const m = candidates[j];
            if (!m || m.isDead) continue;
            const dist = Math.hypot(m.x - d.x, m.y - d.y);
            if (dist >= tierCfg.minRange && dist <= tierCfg.range && dist >= maxDist) {
              maxDist = dist;
              targetM = m;
            }
          }

          if (targetM) {
            d.cooldown = tierCfg.fireCooldown;
            d.aimAngle = Math.atan2(targetM.y - d.y, targetM.x - d.x);

            this.mortarShells.push(new MortarShell(
              d.x, d.y, targetM.x, targetM.y,
              tierCfg.damage, tierCfg.aoeRadius, lv, tierCfg.stunDuration || 0
            ));
            window.audioManager.playBowRecoil();

            const puffCol = lv >= 3 ? '#d946ef' : '#f97316';
            for (let k = 0; k < 6; k++) {
              particles.push(new Particle(d.x, d.y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, puffCol, 4, 0.25));
            }
          }
        }
      }
    }
  }

  render(ctx, camera) {
    const mouseWorldX = (this.game && this.game.mouse) ? this.game.mouse.worldX : -9999;
    const mouseWorldY = (this.game && this.game.mouse) ? this.game.mouse.worldY : -9999;
    const player = (this.game && this.game.player) ? this.game.player : null;

    // 1. Render Placed Defenses (with Viewport Culling)
    for (let i = 0; i < this.defenses.length; i++) {
      const d = this.defenses[i];
      const cx = d.x - camera.x;
      const cy = d.y - camera.y;

      // Frustum Culling
      if (cx < -48 || cx > camera.width + 48 || cy < -48 || cy > camera.height + 48) continue;

      const sx = cx - 16;
      const sy = cy - 16;
      const lv = d.level || 1;

      if (d.type !== 'trap') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 15, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (lv >= 2) {
        ctx.strokeStyle = lv >= 3 ? 'rgba(250, 204, 21, 0.55)' : 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12, 16, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      const sprite = this.getStructureSprite(d.type, lv);
      if (sprite) {
        if (d.type === 'turret') {
          ctx.fillStyle = lv >= 3 ? '#422006' : '#1e293b';
          ctx.strokeStyle = lv >= 3 ? '#facc15' : (lv === 2 ? '#38bdf8' : '#0f172a');
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(d.aimAngle);
          ctx.drawImage(sprite, -16, -16);
          ctx.restore();
        } else {
          ctx.drawImage(sprite, sx, sy);
        }
      }

      if (lv >= 2) {
        ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
        ctx.fillRect(cx + 3, cy - 16, lv >= 3 ? 15 : 11, 10);
        ctx.fillStyle = lv >= 3 ? '#facc15' : '#38bdf8';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lv >= 3 ? '★★' : '★', cx + (lv >= 3 ? 10.5 : 8.5), cy - 8.5);
      }

      if (d.hp < d.maxHp && d.type !== 'trap') {
        const barW = 28;
        const barH = 4;
        const pct = Math.max(0, d.hp / d.maxHp);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(cx - barW / 2 - 1, cy - 23, barW + 2, barH + 2);
        ctx.fillStyle = (pct > 0.4) ? '#22c55e' : '#ef4444';
        ctx.fillRect(cx - barW / 2, cy - 22, barW * pct, barH);
      }

      const distMouseSq = (mouseWorldX - d.x) * (mouseWorldX - d.x) + (mouseWorldY - d.y) * (mouseWorldY - d.y);
      const distPlayerSq = player ? ((player.x - d.x) * (player.x - d.x) + (player.y - d.y) * (player.y - d.y)) : 9999999;

      if ((distMouseSq <= 576 || (this.buildMode === 'upgrade' && distPlayerSq <= 14400)) && this.game && this.game.world) {
        const baseCfg = CONSTANTS.DEFENSE[d.type];
        const nextTier = (baseCfg && baseCfg.tiers && lv < 3) ? baseCfg.tiers[lv + 1] : null;
        const maxUses = d.maxUses || 12;
        let label = (d.type === 'trap')
          ? `⚙ ${d.name} (${d.usesLeft}/${maxUses})`
          : `🛡 ${d.name} (${Math.round(d.hp)}/${d.maxHp} HP)`;

        if (nextTier && distMouseSq <= 576) {
          const canUp = this.canAffordCost(nextTier.cost);
          const costShort = nextTier.cost.map(c => `${c.count} ${c.name}`).join(', ');
          this.game.world.drawObjectBadge(
            ctx, cx, cy - 38,
            `⬆ [Phím R / Click] Nâng Lv.${lv + 1}: ${costShort}`,
            canUp ? '#22c55e' : '#f59e0b',
            canUp ? '#86efac' : '#fde047'
          );
        }
        const badgeCol = lv >= 3 ? '#facc15' : (lv === 2 ? '#38bdf8' : '#94a3b8');
        this.game.world.drawObjectBadge(ctx, cx, cy - 21, label, badgeCol, '#ffffff');
      }
    }

    // 2. Render Mortar Shells in Flight
    for (let i = 0; i < this.mortarShells.length; i++) {
      this.mortarShells[i].render(ctx, camera);
    }

    // 3. Render Build Mode / Upgrade Mode Preview Ghost
    if (this.buildMode) {
      const gx = this.hoverTile.x - 16 - camera.x;
      const gy = this.hoverTile.y - 16 - camera.y;
      const existingAtHover = this.getDefenseAtTile(this.hoverTile.col, this.hoverTile.row);

      ctx.save();

      if (this.buildMode === 'upgrade' || existingAtHover) {
        const canUp = existingAtHover && ((existingAtHover.level || 1) < 3 || existingAtHover.hp < existingAtHover.maxHp);
        ctx.strokeStyle = existingAtHover ? (canUp ? '#facc15' : '#38bdf8') : 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(gx - 1, gy - 1, 34, 34);

        if (existingAtHover) {
          const lv = existingAtHover.level || 1;
          const tierCfg = this.getTierConfig(existingAtHover.type, Math.min(3, lv + 1));
          if (tierCfg && tierCfg.range) {
            ctx.beginPath();
            ctx.arc(existingAtHover.x - camera.x, existingAtHover.y - camera.y, tierCfg.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
            ctx.stroke();
          }
        }
      } else {
        const canPlace = this.canPlaceAt(this.hoverTile.col, this.hoverTile.row, this.buildMode);
        ctx.globalAlpha = 0.72;
        const sprite = window.pixelArt.get('defense_' + this.buildMode);
        if (sprite) {
          ctx.drawImage(sprite, gx, gy);
        }

        ctx.strokeStyle = canPlace ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(gx, gy, 32, 32);

        const defCfg = CONSTANTS.DEFENSE[this.buildMode];
        if (defCfg && defCfg.range) {
          ctx.beginPath();
          ctx.arc(this.hoverTile.x - camera.x, this.hoverTile.y - camera.y, defCfg.range, 0, Math.PI * 2);
          ctx.strokeStyle = this.buildMode === 'mortar' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(56, 189, 248, 0.45)';
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }
}

// Global registry
window.BuildingManager = BuildingManager;
