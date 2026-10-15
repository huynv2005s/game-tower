// Inventory & Equipment Management System
// 99 Inventory Slots (Max Stack = 99) + 5 Armor Slots + 1 Companion Pet Slot
// Features: Item Deletion (1, Stack, All of Type, Junk Cleanup, Quick Trash Mode), Auto-Sort & Stack, Category Filters

class InventorySystem {
  constructor(game) {
    this.game = game;
    this.slotCount = CONSTANTS.INVENTORY_SLOTS || 99;
    this.maxStack = CONSTANTS.MAX_STACK_SIZE || 99;

    // Inventory slots
    this.slots = new Array(this.slotCount).fill(null);

    // 5 armor slots
    this.armorSlots = {
      helmet: null,
      chestplate: null,
      leggings: null,
      boots: null,
      gloves: null
    };

    this.isOpen = false;
    this.uiDirty = true;
    this.selectedSlotIndex = null;
    this.trashMode = false;
    this.activeFilter = 'all'; // 'all', 'usable', 'combat', 'defense', 'resource'
    this.lastFeedbackText = '💡 Mẹo: Chạm vào vật phẩm để chọn (Dùng / Xóa), hoặc bấm nút [✕] đỏ góc phải ô để xóa ngay!';
    this.lastFeedbackColor = '#38bdf8';
    this.initDefaultItems();
  }

  initDefaultItems() {
    // Pre-equip 5 Survival Armors directly on character
    this.armorSlots.helmet = { id: 'mask_gas', count: 1 };
    this.armorSlots.chestplate = { id: 'vest_survival', count: 1 };
    this.armorSlots.leggings = { id: 'pants_hazard', count: 1 };
    this.armorSlots.boots = { id: 'boots_scout', count: 1 };
    this.armorSlots.gloves = { id: 'gloves_miner', count: 1 };

    // Initial Survival Supplies, Defenses & Upgrade Materials
    this.addItem('pure_water', 3);
    this.addItem('antidote_lesser', 2);
    this.addItem('defense_wall', 6);
    this.addItem('defense_trap', 3);
    this.addItem('defense_turret', 2);
    this.addItem('defense_mortar', 1);
    this.addItem('titanium_alloy', 6);
    this.addItem('plasma_core', 3);
    this.addItem('alien_chitin', 6);
    this.addItem('iron_ore', 6);
    this.addItem('snow_lotus', 6);
    this.addItem('silver_moss', 6);
    this.addItem('egg_fluid', 3);
    this.addItem('wood', 15);
    this.addItem('stone', 15);
    this.addItem('tech_scrap', 8);
    this.addItem('sulfur_dust', 8);
    this.addItem('quartz_crystal', 5);
    this.addItem('monster_egg', 2);
    this.addItem('wild_berry', 4);
    this.addItem('seed_snow_lotus', 4);
    this.addItem('seed_silver_moss', 4);
    this.addItem('seed_wild_berry', 4);
    this.addItem('seed_quartz_bloom', 2);
  }

  getItemCount(itemId) {
    let total = 0;
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] && this.slots[i].id === itemId) {
        total += this.slots[i].count;
      }
    }
    return total;
  }

  showFeedback(message, color = '#22c55e') {
    this.lastFeedbackText = message;
    this.lastFeedbackColor = color;
    const feedbackEl = document.getElementById('inv-action-feedback');
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.style.color = color;
      feedbackEl.style.borderColor = color;
      feedbackEl.classList.remove('inv-feedback-pop');
      void feedbackEl.offsetWidth;
      feedbackEl.classList.add('inv-feedback-pop');
    }
    if (this.game && this.game.saveManager && this.game.saveManager.showSaveToast) {
      this.game.saveManager.showSaveToast(message);
    }
  }

  normalizeSlots() {
    while (this.slots.length < this.slotCount) {
      this.slots.push(null);
    }
  }

  // Add item with stack logic (max 99)
  addItem(itemId, count = 1) {
    const itemDef = CONSTANTS.ITEM_TYPES[itemId];
    if (!itemDef) return false;
    this.normalizeSlots();

    const maxSlots = CONSTANTS.MAX_INVENTORY_SLOTS || 99;
    let remaining = count;

    // 1. First, try to fill existing stacks if stackable
    if (itemDef.maxStack > 1) {
      for (let i = 0; i < this.slotCount; i++) {
        if (this.slots[i] && this.slots[i].id === itemId) {
          const space = Math.min(itemDef.maxStack, this.maxStack) - this.slots[i].count;
          if (space > 0) {
            const addAmount = Math.min(space, remaining);
            this.slots[i].count += addAmount;
            remaining -= addAmount;
            if (remaining <= 0) break;
          }
        }
      }
    }

    // 2. Put remainder into first empty slot
    while (remaining > 0) {
      let emptyIdx = this.slots.findIndex(s => s === null);
      if (emptyIdx === -1) {
        if (this.slotCount < maxSlots) {
          this.slotCount = Math.min(maxSlots, this.slotCount + 4);
          this.normalizeSlots();
          emptyIdx = this.slots.findIndex(s => s === null);
        }
      }
      if (emptyIdx === -1) {
        if (this.game && this.game.floatingTexts && this.game.player) {
          this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, 'KHO ĐỒ ĐÃ ĐẦY!', '#ef4444', 12, 1.0));
        }
        this.showFeedback('⚠️ Kho đồ đã đầy (99 ô)! Hãy xóa hoặc sử dụng bớt vật phẩm trong Balo.', '#ef4444');
        return false;
      }

      const addAmount = Math.min(Math.min(itemDef.maxStack, this.maxStack), remaining);
      this.slots[emptyIdx] = {
        id: itemId,
        count: addAmount
      };
      remaining -= addAmount;
    }

    this.uiDirty = true;
    if (this.isOpen) {
      this.renderUI();
    }
    return true;
  }

  removeItem(slotIndex, count = 1) {
    if (slotIndex < 0 || slotIndex >= this.slots.length || !this.slots[slotIndex]) return false;
    this.slots[slotIndex].count -= count;
    if (this.slots[slotIndex].count <= 0) {
      this.slots[slotIndex] = null;
      if (this.selectedSlotIndex === slotIndex) {
        this.selectedSlotIndex = null;
      }
    }
    this.uiDirty = true;
    if (this.isOpen) {
      this.renderUI();
    }
    if (this.game && this.game.updateHUD) {
      this.game.updateHUD(true);
    }
    return true;
  }

  // Delete item(s) from a specific slot with user feedback
  deleteSlotItem(slotIndex, count = null) {
    this.normalizeSlots();
    const item = this.slots[slotIndex];
    if (!item) return false;

    const def = CONSTANTS.ITEM_TYPES[item.id];
    const itemName = def ? def.name : item.id;
    const removeAmount = (count === null || count >= item.count) ? item.count : Math.max(1, count);

    this.removeItem(slotIndex, removeAmount);

    if (window.audioManager) window.audioManager.playEquip();
    const msg = `🗑 ĐÃ XÓA: ${removeAmount}x ${itemName.toUpperCase()} KHỎI BALO!`;
    this.showFeedback(msg, '#f87171');
    if (this.game && this.game.floatingTexts && this.game.player) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 24, `🗑 -${removeAmount} ${itemName}`, '#f87171', 12, 1.1));
    }
    return true;
  }

  deleteSelectedOne() {
    if (this.selectedSlotIndex === null || !this.slots[this.selectedSlotIndex]) {
      this.showFeedback('⚠️ Hãy chọn một vật phẩm trong Balo trước khi xóa!', '#facc15');
      return false;
    }
    return this.deleteSlotItem(this.selectedSlotIndex, 1);
  }

  deleteSelectedStack() {
    if (this.selectedSlotIndex === null || !this.slots[this.selectedSlotIndex]) {
      this.showFeedback('⚠️ Hãy chọn một vật phẩm trong Balo trước khi xóa!', '#facc15');
      return false;
    }
    const count = this.slots[this.selectedSlotIndex].count;
    return this.deleteSlotItem(this.selectedSlotIndex, count);
  }

  deleteSelectedAllOfType() {
    if (this.selectedSlotIndex === null || !this.slots[this.selectedSlotIndex]) {
      this.showFeedback('⚠️ Hãy chọn một vật phẩm trong Balo trước khi xóa!', '#facc15');
      return false;
    }
    const targetId = this.slots[this.selectedSlotIndex].id;
    const def = CONSTANTS.ITEM_TYPES[targetId];
    const itemName = def ? def.name : targetId;
    let totalRemoved = 0;

    for (let i = 0; i < this.slotCount; i++) {
      if (this.slots[i] && this.slots[i].id === targetId) {
        totalRemoved += this.slots[i].count;
        this.slots[i] = null;
      }
    }

    this.selectedSlotIndex = null;
    if (window.audioManager) window.audioManager.playEquip();
    const msg = `🔥 ĐÃ XÓA TOÀN BỘ ${totalRemoved}x ${itemName.toUpperCase()} TRONG BALO!`;
    this.showFeedback(msg, '#ef4444');
    if (this.game && this.game.floatingTexts && this.game.player) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 26, msg, '#ef4444', 12, 1.3));
    }
    this.renderUI();
    if (this.game && this.game.updateHUD) this.game.updateHUD(true);
    return true;
  }

  // One-click cleanup of corrupted/toxic items (blighted_herb, blighted_berry, dirty_water)
  deleteJunkItems() {
    this.normalizeSlots();
    const junkIds = new Set(['blighted_herb', 'blighted_berry', 'dirty_water']);
    let removedCount = 0;

    for (let i = 0; i < this.slotCount; i++) {
      const s = this.slots[i];
      if (s && junkIds.has(s.id)) {
        removedCount += s.count;
        this.slots[i] = null;
        if (this.selectedSlotIndex === i) this.selectedSlotIndex = null;
      }
    }

    if (removedCount === 0) {
      this.showFeedback('✨ Balo không có đồ độc/rác (Thảo dược thối, Quả đột biến, Nước bẩn)!', '#38bdf8');
      return false;
    }

    if (window.audioManager) window.audioManager.playEquip();
    const msg = `🧹 ĐÃ DỌN SẠCH ${removedCount} VẬT PHẨM NHIỄM ĐỘC / RÁC KHỎI BALO!`;
    this.showFeedback(msg, '#22c55e');
    this.renderUI();
    return true;
  }

  // Merge partial stacks and sort items neatly by category
  sortAndStack() {
    this.normalizeSlots();
    const countsById = new Map();
    const nonStackableItems = [];

    for (let i = 0; i < this.slotCount; i++) {
      const s = this.slots[i];
      if (!s) continue;
      const def = CONSTANTS.ITEM_TYPES[s.id];
      if (!def) continue;
      const maxS = Math.min(def.maxStack || 99, this.maxStack);
      if (maxS <= 1) {
        nonStackableItems.push({ id: s.id, count: 1 });
      } else {
        countsById.set(s.id, (countsById.get(s.id) || 0) + s.count);
      }
    }

    const combined = [...nonStackableItems];
    for (const [id, total] of countsById.entries()) {
      const def = CONSTANTS.ITEM_TYPES[id];
      const maxS = Math.min((def && def.maxStack) ? def.maxStack : 99, this.maxStack);
      let rem = total;
      while (rem > 0) {
        const take = Math.min(maxS, rem);
        combined.push({ id, count: take });
        rem -= take;
      }
    }

    const categoryPriority = {
      consumable: 1,
      seed: 2,
      egg: 3,
      weapon: 4,
      armor: 5,
      defense: 6,
      upgrade: 7,
      resource: 8
    };

    combined.sort((a, b) => {
      const defA = CONSTANTS.ITEM_TYPES[a.id] || {};
      const defB = CONSTANTS.ITEM_TYPES[b.id] || {};
      const pA = categoryPriority[defA.category] || 99;
      const pB = categoryPriority[defB.category] || 99;
      if (pA !== pB) return pA - pB;
      return (defA.name || a.id).localeCompare(defB.name || b.id, 'vi');
    });

    this.slots = new Array(this.slotCount).fill(null);
    for (let i = 0; i < Math.min(this.slotCount, combined.length); i++) {
      this.slots[i] = combined[i];
    }
    this.selectedSlotIndex = null;

    if (window.audioManager) window.audioManager.playEquip();
    this.showFeedback('📦 ĐÃ GỘP Ô & SẮP XẾP GỌN GÀNG TOÀN BỘ BALO!', '#22c55e');
    this.renderUI();
    return true;
  }

  toggleTrashMode(forceState = null) {
    this.trashMode = (forceState !== null) ? !!forceState : !this.trashMode;
    const btn = document.getElementById('btn-inv-trash-mode');
    const grid = document.getElementById('inventory-grid');
    if (btn) {
      btn.classList.toggle('active', this.trashMode);
      btn.textContent = this.trashMode ? '🗑 Xóa Nhanh: BẬT' : '🗑 Xóa Nhanh: TẮT';
    }
    if (grid) {
      grid.classList.toggle('trash-mode-active', this.trashMode);
    }
    if (this.trashMode) {
      this.showFeedback('⚠️ CHẾ ĐỘ XÓA NHANH ĐANG BẬT: Chạm vào bất kỳ ô nào trong Balo để xóa ngay lập tức!', '#ef4444');
    } else {
      this.showFeedback('💡 Đã tắt Chế Độ Xóa Nhanh. Chạm vào vật phẩm để xem chi tiết, Sử dụng hoặc Xóa.', '#38bdf8');
    }
  }

  setFilter(filterKey) {
    this.activeFilter = filterKey || 'all';
    const btns = document.querySelectorAll('.inv-filter-btn');
    btns.forEach(b => {
      b.classList.toggle('active', b.dataset.filter === this.activeFilter);
    });
    this.renderUI();
  }

  matchesFilter(itemId, def) {
    if (!def || this.activeFilter === 'all') return true;
    if (this.activeFilter === 'usable') {
      return def.category === 'consumable' || def.category === 'seed' ||
             itemId === 'snow_lotus' || itemId === 'silver_moss' || itemId === 'egg_fluid';
    }
    if (this.activeFilter === 'combat') {
      return def.category === 'armor' || def.category === 'weapon' || def.category === 'egg' || def.category === 'upgrade';
    }
    if (this.activeFilter === 'defense') {
      return def.category === 'defense';
    }
    if (this.activeFilter === 'resource') {
      return def.category === 'resource';
    }
    return true;
  }

  expandCapacity(extraSlots = 4) {
    const maxSlots = CONSTANTS.MAX_INVENTORY_SLOTS || 99;
    if (this.slotCount >= maxSlots) {
      this.showFeedback(`🎒 Balo đã đạt sức chứa tối đa (${maxSlots} ô | Max Stack: ${this.maxStack})!`, '#facc15');
      if (this.game && this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, `BALO ĐÃ ĐẠT SỨC CHỨA TỐI ĐA (${maxSlots} Ô)!`, '#facc15', 12, 1.2));
      }
      return false;
    }
    this.slotCount = Math.min(maxSlots, this.slotCount + extraSlots);
    this.normalizeSlots();
    if (window.audioManager) window.audioManager.playEquip();
    const msg = `🎒 NÂNG CẤP BALO: ĐÃ MỞ RỘNG THÀNH ${this.slotCount} Ô CHỨA!`;
    this.showFeedback(msg, '#22c55e');
    if (this.game && this.game.floatingTexts && this.game.player) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, msg, '#22c55e', 14, 2.0));
    }
    this.renderUI();
    return true;
  }

  equipArmorFromSlot(slotIndex) {
    const itemData = this.slots[slotIndex];
    if (!itemData) return;
    const itemDef = CONSTANTS.ITEM_TYPES[itemData.id];
    if (!itemDef || itemDef.category !== 'armor') return;

    const targetSlot = itemDef.slot;
    const currentEquipped = this.armorSlots[targetSlot];

    this.armorSlots[targetSlot] = itemData;
    this.slots[slotIndex] = currentEquipped;

    if (window.audioManager) window.audioManager.playEquip();
    this.updatePlayerStats();
    this.showFeedback(`🛡 ĐÃ TRANG BỊ: ${itemDef.name}!`, '#22c55e');
    this.renderUI();
    if (this.game && this.game.updateHUD) this.game.updateHUD(true);
  }

  unequipArmor(slotKey) {
    const equipped = this.armorSlots[slotKey];
    if (!equipped) return;
    const itemDef = CONSTANTS.ITEM_TYPES[equipped.id];

    const maxSlots = CONSTANTS.MAX_INVENTORY_SLOTS || 99;
    this.normalizeSlots();
    let emptyIdx = this.slots.findIndex(s => s === null);
    if (emptyIdx === -1 && this.slotCount < maxSlots) {
      this.slotCount = Math.min(maxSlots, this.slotCount + 4);
      this.normalizeSlots();
      emptyIdx = this.slots.findIndex(s => s === null);
    }

    if (emptyIdx === -1) {
      this.showFeedback('⚠️ Không đủ ô trống trong Balo để tháo giáp! Hãy xóa bớt đồ không cần thiết.', '#ef4444');
      return;
    }

    this.slots[emptyIdx] = equipped;
    this.armorSlots[slotKey] = null;

    if (window.audioManager) window.audioManager.playEquip();
    this.updatePlayerStats();
    this.showFeedback(`🎒 ĐÃ THÁO TRANG BỊ: ${itemDef ? itemDef.name : slotKey} cất vào Balo!`, '#38bdf8');
    this.renderUI();
    if (this.game && this.game.updateHUD) this.game.updateHUD(true);
  }

  updatePlayerStats() {
    if (!this.game || !this.game.player) return;
    const p = this.game.player;

    let totalBonusHp = 0;
    let totalArmor = CONSTANTS.PLAYER_BASE.BASE_ARMOR;
    let totalToxinResist = CONSTANTS.PLAYER_BASE.BASE_TOXIN_RESIST;
    let totalSpeedBonus = 0;

    for (let slotKey in this.armorSlots) {
      const item = this.armorSlots[slotKey];
      if (item) {
        const def = CONSTANTS.ITEM_TYPES[item.id];
        if (def && def.stats) {
          if (def.stats.hp) totalBonusHp += def.stats.hp;
          if (def.stats.armor) totalArmor += def.stats.armor;
          if (def.stats.toxinResist) totalToxinResist += def.stats.toxinResist;
          if (def.stats.speedBonus) totalSpeedBonus += def.stats.speedBonus;
        }
      }
    }

    // Include Passive Stat Bonuses from the 1 Active Companion Pet & Support Drones
    if (this.game.petSystem) {
      const petSpec = this.game.petSystem.getActiveSpecies();
      if (petSpec && petSpec.statsBonus) {
        if (petSpec.statsBonus.hp) totalBonusHp += petSpec.statsBonus.hp;
        if (petSpec.statsBonus.armor) totalArmor += petSpec.statsBonus.armor;
        if (petSpec.statsBonus.toxinResist) totalToxinResist += petSpec.statsBonus.toxinResist;
        if (petSpec.statsBonus.speedBonus) totalSpeedBonus += petSpec.statsBonus.speedBonus;
      }
      const droneCfg = this.game.petSystem.getDroneTierConfig ? this.game.petSystem.getDroneTierConfig() : null;
      if (droneCfg && droneCfg.armorBonus) {
        totalArmor += droneCfg.armorBonus;
      }
    }

    p.maxHp = CONSTANTS.PLAYER_BASE.MAX_HP + totalBonusHp;
    p.hp = Math.min(p.hp, p.maxHp);
    p.armor = totalArmor;
    p.toxinResist = Math.min(90, totalToxinResist);
    p.speedBonus = totalSpeedBonus;
  }

  recalculatePlayerStats() {
    this.updatePlayerStats();
  }

  toggleUI() {
    this.isOpen = !this.isOpen;
    const modal = document.getElementById('inventory-modal');
    if (modal) {
      modal.style.display = this.isOpen ? 'flex' : 'none';
      if (this.isOpen) {
        if (this.trashMode) this.toggleTrashMode(false);
        this.renderUI();
        if (window.audioManager) window.audioManager.playEquip();
      }
    }
  }

  getSlotActionLabel(itemId, def) {
    if (!def) return 'DÙNG';
    if (def.category === 'egg' || itemId === 'monster_egg') return 'ẤP LAB';
    if (def.category === 'armor') return 'MẶC';
    if (def.category === 'weapon') return 'CẦM';
    if (def.category === 'defense') return 'XÂY';
    if (def.category === 'seed') return 'CẤY';
    if (def.category === 'upgrade') return 'NÂNG';
    if (def.category === 'consumable') return 'DÙNG';
    if (itemId === 'titanium_alloy' || itemId === 'plasma_core') return 'NÂNG';
    if (itemId === 'snow_lotus' || itemId === 'silver_moss' || itemId === 'egg_fluid') return 'DÙNG';
    if (itemId === 'blighted_herb') return 'HỦY';
    return 'CHẾ';
  }

  selectSlot(slotIndex) {
    this.normalizeSlots();
    if (slotIndex < 0 || slotIndex >= this.slotCount || !this.slots[slotIndex]) {
      this.selectedSlotIndex = null;
    } else {
      this.selectedSlotIndex = slotIndex;
    }
    this.renderSelectedPanel();
    const grid = document.getElementById('inventory-grid');
    if (grid) {
      const slotEls = grid.querySelectorAll('.inv-slot');
      slotEls.forEach(el => {
        el.classList.toggle('selected-slot', Number(el.dataset.slotIndex) === this.selectedSlotIndex);
      });
    }
  }

  triggerSelectedAction() {
    if (this.selectedSlotIndex === null || !this.slots[this.selectedSlotIndex]) return;
    this.useSlotItem(this.selectedSlotIndex);
  }

  onSlotClick(slotIndex) {
    this.normalizeSlots();
    const item = this.slots[slotIndex];
    if (!item) {
      this.selectSlot(null);
      return;
    }

    // 1. If Quick Trash Mode is ON -> Delete entire stack immediately!
    if (this.trashMode) {
      this.deleteSlotItem(slotIndex, item.count);
      return;
    }

    const def = CONSTANTS.ITEM_TYPES[item.id];
    const isAlreadySelected = (this.selectedSlotIndex === slotIndex);
    this.selectSlot(slotIndex);

    // 2. If user taps the already-selected slot again, or if it's a direct-use item on second tap, execute action!
    // For consumables/armor/weapons/defense/seeds/eggs: if already selected, trigger immediately;
    // on first tap, select it and show the big Use & Delete buttons so the player can safely delete or use!
    if (isAlreadySelected) {
      this.useSlotItem(slotIndex);
    } else if (def) {
      const actionVerb = this.getSlotActionLabel(item.id, def);
      this.showFeedback(`📌 Đã chọn: ${def.name} (x${item.count}) — Bấm [⚡ ${actionVerb}] hoặc chạm lần nữa để dùng, hoặc bấm [🗑 Xóa]!`, '#38bdf8');
    }
  }

  useSlotItem(slotIndex) {
    this.normalizeSlots();
    const item = this.slots[slotIndex];
    if (!item) return;

    const itemId = item.id;
    const def = CONSTANTS.ITEM_TYPES[itemId];
    if (!def || !this.game || !this.game.player) return;

    const p = this.game.player;
    this.selectedSlotIndex = slotIndex;

    // 1. Armor -> Equip
    if (def.category === 'armor') {
      this.equipArmorFromSlot(slotIndex);
      return;
    }

    // 2. Weapon -> Switch active weapon
    if (def.category === 'weapon') {
      this.game.weapons.switchWeapon(def.weaponKey);
      this.showFeedback(`🗡 ĐÃ TRANG BỊ VŨ KHÍ: ${def.name}!`, '#38bdf8');
      this.renderUI();
      if (this.game.updateHUD) this.game.updateHUD(true);
      return;
    }

    // 3. Consumables & Usable Herbs
    if (itemId === 'antidote_lesser') {
      p.infection = Math.max(0, p.infection - 25);
      p.hp = Math.min(p.maxHp, p.hp + 10);
      if (window.audioManager) window.audioManager.playEquip();
      const msg = '💉 ĐÃ DÙNG HUYẾT THANH SƠ CẤP: -25% ĐỘC TỐ & +10 HP!';
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 25, msg, '#22c55e', 13, 1.2));
      this.showFeedback(msg, '#22c55e');
      this.removeItem(slotIndex, 1);
      return;
    }

    if (itemId === 'antidote_pure') {
      p.infection = Math.max(0, p.infection - 60);
      p.hp = Math.min(p.maxHp, p.hp + 25);
      p.immunityTimer = CONSTANTS.DAY_DURATION_SEC;
      if (window.audioManager) window.audioManager.playEquip();
      const msg = '★ ĐÃ DÙNG KHÁNG THỂ TINH KHIẾT: -60% ĐỘC, +25 HP & MIỄN NHIỄM 1 NGÀY! ★';
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 30, msg, '#38bdf8', 13, 2.0));
      this.showFeedback(msg, '#38bdf8');
      this.removeItem(slotIndex, 1);
      return;
    }

    if (itemId === 'pure_water') {
      p.infection = Math.max(0, p.infection - 15);
      p.hp = Math.min(p.maxHp, p.hp + 15);
      if (window.audioManager) window.audioManager.playEquip();
      const msg = '💧 ĐÃ UỐNG NƯỚC TINH KHIẾT: +15 HP & -15% ĐỘC TỐ!';
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 20, msg, '#38bdf8', 12, 1.0));
      this.showFeedback(msg, '#38bdf8');
      this.removeItem(slotIndex, 1);
      return;
    }

    if (itemId === 'dirty_water') {
      p.hp = Math.min(p.maxHp, p.hp + 5);
      p.addInfection(20, 'NƯỚC Ô NHIỄM');
      if (window.audioManager) window.audioManager.playEquip();
      const msg = '☣ ĐÃ UỐNG NƯỚC Ô NHIỄM: +5 HP NHƯNG TĂNG +20% ĐỘC TỐ!';
      this.showFeedback(msg, '#facc15');
      this.removeItem(slotIndex, 1);
      return;
    }

    if (itemId === 'wild_berry') {
      p.hp = Math.min(p.maxHp, p.hp + 18);
      if (window.audioManager) window.audioManager.playEquip();
      const msg = '🍓 ĐÃ ĂN QUẢ MỌNG SẠCH: +18 HP!';
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 20, msg, '#22c55e', 12, 1.0));
      this.showFeedback(msg, '#22c55e');
      this.removeItem(slotIndex, 1);
      return;
    }

    if (itemId === 'blighted_berry') {
      p.hp = Math.min(p.maxHp, p.hp + 5);
      p.addInfection(35, 'QUẢ ĐỘT BIẾN NHIỄM ĐỘC');
      if (window.audioManager) window.audioManager.playHit();
      const msg = '☣ ĐÃ ĂN QUẢ ĐỘT BIẾN: +5 HP NHƯNG NHIỄM +35% ĐỘC TỐ!';
      this.showFeedback(msg, '#ef4444');
      this.removeItem(slotIndex, 1);
      return;
    }

    if (itemId === 'snow_lotus') {
      p.hp = Math.min(p.maxHp, p.hp + 12);
      p.infection = Math.max(0, p.infection - 12);
      if (window.audioManager) window.audioManager.playEquip();
      const msg = '🪷 ĐÃ DÙNG TUYẾT LIÊN TƯƠI: +12 HP & -12% ĐỘC TỐ!';
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 22, msg, '#e879f9', 12, 1.1));
      this.showFeedback(msg, '#e879f9');
      this.removeItem(slotIndex, 1);
      return;
    }

    if (itemId === 'silver_moss') {
      p.hp = Math.min(p.maxHp, p.hp + 15);
      p.infection = Math.max(0, p.infection - 8);
      if (window.audioManager) window.audioManager.playEquip();
      const msg = '🌿 ĐÃ DÙNG RÊU BẠC ĐỈNH NÚI: +15 HP & -8% ĐỘC TỐ!';
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 22, msg, '#4ade80', 12, 1.1));
      this.showFeedback(msg, '#4ade80');
      this.removeItem(slotIndex, 1);
      return;
    }

    if (itemId === 'egg_fluid') {
      p.hp = Math.min(p.maxHp, p.hp + 20);
      p.speedBoostMultiplier = 1.3;
      p.speedBoostTimer = Math.max(p.speedBoostTimer || 0, 8.0);
      p.addInfection(15, 'DỊCH TRỨNG NGOẠI LAI');
      if (window.audioManager) window.audioManager.playEquip();
      const msg = '🧪 ĐÃ HẤP THỤ DỊCH TUYẾN TRỨNG: +20 HP, +30% TỐC CHẠY (8s), +15% ĐỘC TỐ!';
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 25, msg, '#c084fc', 12, 1.4));
      this.showFeedback(msg, '#c084fc');
      this.removeItem(slotIndex, 1);
      return;
    }

    if (itemId === 'blighted_herb') {
      this.deleteSlotItem(slotIndex, 1);
      return;
    }

    // 4. Backpack Upgrade
    if (def.category === 'upgrade' || itemId === 'backpack_upgraded') {
      if (this.expandCapacity(4)) {
        this.removeItem(slotIndex, 1);
      }
      return;
    }

    // 5. Seeds -> Open Bio-Lab Hydroponics Tab
    if (def.category === 'seed') {
      if (window.labSystem) {
        this.toggleUI();
        window.labSystem.open('hydroponics');
        this.showFeedback(`🌱 ĐÃ MỞ LỒNG CẤY CÁCH LY: Chọn lồng để cấy ${def.name}!`, '#22c55e');
      }
      return;
    }

    // 6. Defense Structures -> Enter Build Mode
    if (def.category === 'defense') {
      if (this.game && this.game.buildingManager) {
        this.toggleUI();
        this.game.buildingManager.enterBuildMode(def.structType);
        this.showFeedback(`🏗 CHẾ ĐỘ XÂY [${def.name.toUpperCase()}]: Click ô trống để đặt hoặc click công trình đã có để NÂNG CẤP!`, '#facc15');
      }
      return;
    }

    // 6.5 Monster Egg -> Can ONLY be incubated inside the Bio-Lab!
    if (def.category === 'egg' || itemId === 'monster_egg') {
      if (this.game && this.game.petSystem) {
        if (!this.game.petSystem.isPlayerInBioLab()) {
          if (window.audioManager) window.audioManager.playHit();
          const warn = '⚠️ CHỈ ẤP ĐƯỢC TRONG PHÒNG LAB! Hãy mang Trứng Quái Vật về Khu Cách Ly Phòng Lab [F] để ấp!';
          this.showFeedback(warn, '#ef4444');
          this.game.floatingTexts.push(new FloatingText(p.x, p.y - 32, warn, '#ef4444', 12, 1.8));
          return;
        }
        this.toggleUI();
        if (window.labSystem) {
          window.labSystem.open('incubator');
          if (!this.game.petSystem.incubator.hasEgg) {
            this.game.petSystem.startIncubation();
          }
        }
      }
      return;
    }

    // 7. Upgrade & Crafting Materials -> Open corresponding Station Tab
    if (def.category === 'resource') {
      if (window.labSystem) {
        this.toggleUI();
        if (itemId === 'iron_ore') {
          window.labSystem.open('furnace');
          this.showFeedback(`🔥 ĐÃ MỞ LÒ NUNG ĐỂ LUYỆN HỢP KIM TITAN TỪ ${def.name.toUpperCase()}!`, '#f97316');
        } else if (itemId === 'titanium_alloy' || itemId === 'plasma_core' || itemId === 'tech_scrap') {
          window.labSystem.open('workshop');
          this.showFeedback(`⚙ ĐÃ MỞ XƯỞNG THỦ THÀNH & SÚNG ĐỂ NÂNG CẤP BẰNG ${def.name.toUpperCase()}!`, '#38bdf8');
        } else if (itemId === 'wood' || itemId === 'stone' || itemId === 'alien_chitin') {
          window.labSystem.open('workbench');
          this.showFeedback(`🔨 ĐÃ MỞ BÀN CHẾ TẠO ĐỂ SỬ DỤNG ${def.name.toUpperCase()}!`, '#38bdf8');
        } else {
          window.labSystem.open('lab');
          this.showFeedback(`🧬 ĐÃ MỞ PHÒNG LAB ĐỂ BÀO CHẾ BẰNG ${def.name.toUpperCase()}!`, '#22c55e');
        }
      }
    }
  }

  renderSelectedPanel() {
    const infoEl = document.getElementById('inv-selected-info');
    const actionsEl = document.getElementById('inv-selected-actions');
    const useBtn = document.getElementById('btn-inv-use');
    const delOneBtn = document.getElementById('btn-inv-del-one');
    const delStackBtn = document.getElementById('btn-inv-del-stack');
    const delAllBtn = document.getElementById('btn-inv-del-all-type');

    if (!infoEl || !actionsEl) return;

    const item = (this.selectedSlotIndex !== null && this.slots[this.selectedSlotIndex])
      ? this.slots[this.selectedSlotIndex]
      : null;

    if (!item) {
      infoEl.innerHTML = `<span class="inv-selected-placeholder">👆 Chạm vào vật phẩm để xem chi tiết, Sử dụng hoặc Xóa bỏ (hoặc bấm nút <strong>✕</strong> trên góc ô để xóa nhanh).</span>`;
      actionsEl.style.display = 'none';
      return;
    }

    const def = CONSTANTS.ITEM_TYPES[item.id];
    if (!def) {
      actionsEl.style.display = 'none';
      return;
    }

    const iconUrl = window.pixelArt.getDataURL(`icon_${def.icon}`);
    const totalSameType = this.getItemCount(item.id);
    const actionLabel = this.getSlotActionLabel(item.id, def);

    infoEl.innerHTML = `
      <div class="inv-sel-header">
        ${iconUrl ? `<img src="${iconUrl}" class="inv-sel-icon" alt="">` : ''}
        <div class="inv-sel-text">
          <div class="inv-sel-title">${def.name} <span class="inv-sel-qty">x${item.count}</span> <span class="inv-sel-total">(Tổng trong Balo: ${totalSameType})</span></div>
          <div class="inv-sel-desc">${def.desc}</div>
        </div>
      </div>
    `;

    actionsEl.style.display = 'flex';
    if (useBtn) {
      useBtn.textContent = `⚡ ${actionLabel}`;
    }
    if (delOneBtn) {
      delOneBtn.style.display = item.count > 1 ? 'inline-flex' : 'none';
    }
    if (delStackBtn) {
      delStackBtn.textContent = item.count > 1 ? `🗑 Xóa Ô (${item.count})` : '🗑 Xóa Bỏ';
    }
    if (delAllBtn) {
      delAllBtn.style.display = totalSameType > item.count ? 'inline-flex' : 'none';
      delAllBtn.textContent = `🔥 Xóa Hết (${totalSameType})`;
    }
  }

  renderUI() {
    this.normalizeSlots();
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.classList.toggle('trash-mode-active', this.trashMode);

    if (this.selectedSlotIndex !== null && !this.slots[this.selectedSlotIndex]) {
      this.selectedSlotIndex = null;
    }

    const titleEl = document.getElementById('inventory-slot-title');
    if (titleEl) {
      const usedSlots = this.slots.filter(s => s !== null).length;
      titleEl.textContent = `BALO: ${usedSlots}/${this.slotCount} Ô (STACK TỐI ĐA: ${this.maxStack})`;
    }

    const feedbackEl = document.getElementById('inv-action-feedback');
    if (feedbackEl && this.lastFeedbackText) {
      feedbackEl.textContent = this.lastFeedbackText;
      feedbackEl.style.color = this.lastFeedbackColor || '#38bdf8';
    }

    const frag = document.createDocumentFragment();

    for (let i = 0; i < this.slotCount; i++) {
      const item = this.slots[i];
      const def = item ? CONSTANTS.ITEM_TYPES[item.id] : null;

      // If category filter is active, hide non-matching slots (keep empty slots hidden during filtering so matching items are grouped cleanly!)
      if (this.activeFilter !== 'all') {
        if (!item || !this.matchesFilter(item.id, def)) {
          continue;
        }
      }

      const slotEl = document.createElement('div');
      slotEl.className = 'inv-slot';
      slotEl.dataset.slotIndex = i;
      if (this.selectedSlotIndex === i) {
        slotEl.classList.add('selected-slot');
      }

      if (item && def) {
        slotEl.classList.add('occupied');
        const iconUrl = window.pixelArt.getDataURL(`icon_${def.icon}`);

        if (iconUrl) {
          const img = document.createElement('img');
          img.src = iconUrl;
          img.className = 'slot-icon';
          img.draggable = false;
          slotEl.appendChild(img);
        }

        // Top-Left Quick Use Badge (1-tap action)
        const actionTag = document.createElement('span');
        actionTag.className = `slot-action-tag tag-${def.category}`;
        actionTag.textContent = this.getSlotActionLabel(item.id, def);
        actionTag.title = `Bấm để ${this.getSlotActionLabel(item.id, def)} ngay`;
        actionTag.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.trashMode) {
            this.deleteSlotItem(i, item.count);
          } else {
            this.useSlotItem(i);
          }
        });
        slotEl.appendChild(actionTag);

        // Top-Right Quick Delete Button [✕] (1-tap delete slot)
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'slot-delete-btn';
        delBtn.textContent = '✕';
        delBtn.title = `Xóa ${def.name} (x${item.count}) khỏi Balo`;
        delBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.deleteSlotItem(i, item.count);
        });
        slotEl.appendChild(delBtn);

        if (item.count > 1) {
          const badge = document.createElement('span');
          badge.className = 'slot-badge';
          badge.textContent = item.count;
          slotEl.appendChild(badge);
        }

        slotEl.title = `${def.name} (x${item.count})\n${def.desc}\n• Chạm để chọn / chạm 2 lần để ${this.getSlotActionLabel(item.id, def)}\n• Bấm nút [✕] góc phải để Xóa bỏ`;

        slotEl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.onSlotClick(i);
        });

        // Right-click on desktop deletes 1 item (or stack if Shift held)
        slotEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.deleteSlotItem(i, e.shiftKey ? item.count : 1);
        });
      } else {
        slotEl.addEventListener('click', () => {
          this.selectSlot(null);
        });
      }

      frag.appendChild(slotEl);
    }

    grid.appendChild(frag);
    this.renderSelectedPanel();

    // Render 5 Armor Slots
    const armorNames = {
      helmet: 'Mũ',
      chestplate: 'Áo Giáp',
      leggings: 'Quần',
      boots: 'Giày',
      gloves: 'Găng Tay'
    };

    for (let slotKey in this.armorSlots) {
      const el = document.getElementById(`armor-slot-${slotKey}`);
      if (!el) continue;
      el.innerHTML = '';

      const item = this.armorSlots[slotKey];
      if (item) {
        const def = CONSTANTS.ITEM_TYPES[item.id];
        const iconUrl = window.pixelArt.getDataURL(`icon_${def.icon}`);
        if (iconUrl) {
          const img = document.createElement('img');
          img.src = iconUrl;
          img.className = 'slot-icon';
          img.draggable = false;
          el.appendChild(img);
        }
        el.title = `[ĐÃ TRANG BỊ] ${def.name}\n${def.desc}\n(Click để tháo ra cất vào Balo)`;
        el.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.unequipArmor(slotKey);
        };
      } else {
        el.innerHTML = `<span class="empty-armor-label">${armorNames[slotKey]}</span>`;
        el.title = `Ô trang bị: ${armorNames[slotKey]} (Trống)`;
        el.onclick = null;
      }
    }

    // Render 1 Active Pet Companion Slot (Max 1 Pet)
    const petSlotEl = document.getElementById('armor-slot-pet');
    const petTitleEl = document.getElementById('equip-pet-slot-title');
    if (petSlotEl && this.game && this.game.petSystem) {
      petSlotEl.innerHTML = '';
      const activeSpec = this.game.petSystem.getActiveSpecies();
      if (activeSpec) {
        const curLv = activeSpec.level || 1;
        const iconUrl = window.pixelArt.getDataURL(`icon_${activeSpec.icon}`);
        if (iconUrl) {
          const img = document.createElement('img');
          img.src = iconUrl;
          img.className = 'slot-icon';
          img.draggable = false;
          petSlotEl.appendChild(img);
        }
        const lvBadge = document.createElement('span');
        lvBadge.className = 'slot-count';
        lvBadge.style.color = '#facc15';
        lvBadge.textContent = `Lv.${curLv}`;
        petSlotEl.appendChild(lvBadge);

        petSlotEl.style.borderColor = activeSpec.color;
        if (petTitleEl) {
          petTitleEl.innerHTML = `<span style="color:${activeSpec.color};font-weight:800;">${activeSpec.badgeIcon} ${activeSpec.name} (Lv.${curLv})</span><br><span style="font-size:9px;color:#94a3b8;">${activeSpec.role} (1/1 Pet)</span>`;
        }
        petSlotEl.title = `[PET ĐANG MANG (1/1) — Lv.${curLv}/3] ${activeSpec.name}\n${activeSpec.desc}\n👉 Click để mở Quản Lý & Nâng Cấp Pet trong Phòng Lab!`;
        petSlotEl.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleUI();
          if (window.labSystem) window.labSystem.open('incubator');
        };
      } else {
        petSlotEl.style.borderColor = '#374151';
        petSlotEl.innerHTML = `<span class="empty-armor-label">0/1 Pet</span>`;
        if (petTitleEl) {
          petTitleEl.innerHTML = `Thú Cưng (0/1)<br><span style="font-size:9px;color:#64748b;">Ấp trứng tại Lab</span>`;
        }
        petSlotEl.title = `Ô Thú Cưng Đồng Hành (Tối đa 1 Pet)\nClick để mở Lồng Ấp Trứng tại Phòng Lab!`;
        petSlotEl.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleUI();
          if (window.labSystem) window.labSystem.open('incubator');
        };
      }
    }

    this.updateStatsDisplay();
    this.uiDirty = false;
  }

  updateStatsDisplay() {
    if (!this.game || !this.game.player) return;
    const p = this.game.player;

    const hpEl = document.getElementById('stat-display-hp');
    const infEl = document.getElementById('stat-display-infection');
    const armorEl = document.getElementById('stat-display-armor');
    const toxinEl = document.getElementById('stat-display-toxin');
    const speedEl = document.getElementById('stat-display-speed');

    if (hpEl) hpEl.textContent = `${Math.round(p.hp)} / ${p.maxHp}`;
    if (infEl) infEl.textContent = `${Math.round(p.infection)}%`;
    if (armorEl) armorEl.textContent = `${p.armor}`;
    if (toxinEl) toxinEl.textContent = `${p.toxinResist}%`;
    if (speedEl) speedEl.textContent = `${Math.round(p.getEffectiveSpeed())} px/s`;
  }
}

// Global registry
window.InventorySystem = InventorySystem;
