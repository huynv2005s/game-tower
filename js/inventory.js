// Inventory & Equipment Management System (Optimized with Cached DataURLs & Lazy DOM Rendering)
// 20 Inventory Slots (Max Stack = 25, expandable up to 28) + 5 Armor Slots

class InventorySystem {
  constructor(game) {
    this.game = game;
    this.slotCount = CONSTANTS.INVENTORY_SLOTS || 20;
    this.maxStack = CONSTANTS.MAX_STACK_SIZE || 25;

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
    this.lastFeedbackText = '💡 Click trực tiếp vào vật phẩm trong Balo để Sử dụng, Trang bị, Đặt công trình hoặc Nâng cấp!';
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

  // Add item with stack logic (max 25)
  addItem(itemId, count = 1) {
    const itemDef = CONSTANTS.ITEM_TYPES[itemId];
    if (!itemDef) return false;
    this.normalizeSlots();

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
        if (this.slotCount < 28) {
          this.slotCount += 4;
          this.normalizeSlots();
          emptyIdx = this.slots.findIndex(s => s === null);
        }
      }
      if (emptyIdx === -1) {
        if (this.game && this.game.floatingTexts && this.game.player) {
          this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, 'KHO ĐỒ ĐÃ ĐẦY!', '#ef4444', 12, 1.0));
        }
        this.showFeedback('⚠️ Kho đồ đã đầy! Hãy sử dụng bớt vật phẩm trong Balo.', '#ef4444');
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
    }
    this.uiDirty = true;
    if (this.isOpen) {
      this.renderUI();
    }
    return true;
  }

  expandCapacity(extraSlots = 4) {
    if (this.slotCount >= 28) {
      this.showFeedback('🎒 Balo đã đạt sức chứa tối đa (28 ô)!', '#facc15');
      if (this.game && this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'BALO ĐÃ ĐẠT SỨC CHỨA TỐI ĐA (28 Ô)!', '#ef4444', 12, 1.2));
      }
      return false;
    }
    this.slotCount = Math.min(28, this.slotCount + extraSlots);
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

    this.normalizeSlots();
    let emptyIdx = this.slots.findIndex(s => s === null);
    if (emptyIdx === -1 && this.slotCount < 28) {
      this.slotCount += 4;
      this.normalizeSlots();
      emptyIdx = this.slots.findIndex(s => s === null);
    }

    if (emptyIdx === -1) {
      this.showFeedback('⚠️ Không đủ ô trống trong Balo để tháo giáp!', '#ef4444');
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

    p.maxHp = CONSTANTS.PLAYER_BASE.MAX_HP + totalBonusHp;
    p.hp = Math.min(p.hp, p.maxHp);
    p.armor = totalArmor;
    p.toxinResist = totalToxinResist;
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
        this.renderUI();
        if (window.audioManager) window.audioManager.playEquip();
      }
    }
  }

  getSlotActionLabel(itemId, def) {
    if (!def) return 'DÙNG';
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
      if (window.audioManager) window.audioManager.playEquip();
      this.showFeedback('🗑 ĐÃ TIÊU HỦY 1 THẢO DƯỢC THỐI RỮA!', '#94a3b8');
      this.removeItem(slotIndex, 1);
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

  renderUI() {
    this.normalizeSlots();
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const titleEl = document.getElementById('inventory-slot-title');
    if (titleEl) {
      const usedSlots = this.slots.filter(s => s !== null).length;
      titleEl.textContent = `KHO ĐỒ ${this.slotCount} Ô (ĐANG DÙNG: ${usedSlots}/${this.slotCount} | MAX STACK: ${this.maxStack})`;
    }

    const feedbackEl = document.getElementById('inv-action-feedback');
    if (feedbackEl && this.lastFeedbackText) {
      feedbackEl.textContent = this.lastFeedbackText;
      feedbackEl.style.color = this.lastFeedbackColor || '#38bdf8';
    }

    const frag = document.createDocumentFragment();

    for (let i = 0; i < this.slotCount; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'inv-slot';
      slotEl.dataset.slotIndex = i;

      const item = this.slots[i];
      if (item) {
        const def = CONSTANTS.ITEM_TYPES[item.id];
        if (def) {
          slotEl.classList.add('occupied');
          const iconUrl = window.pixelArt.getDataURL(`icon_${def.icon}`);

          if (iconUrl) {
            const img = document.createElement('img');
            img.src = iconUrl;
            img.className = 'slot-icon';
            img.draggable = false;
            slotEl.appendChild(img);
          }

          const actionTag = document.createElement('span');
          actionTag.className = `slot-action-tag tag-${def.category}`;
          actionTag.textContent = this.getSlotActionLabel(item.id, def);
          slotEl.appendChild(actionTag);

          if (item.count > 1) {
            const badge = document.createElement('span');
            badge.className = 'slot-badge';
            badge.textContent = item.count;
            slotEl.appendChild(badge);
          }

          slotEl.title = `${def.name} (x${item.count})\n${def.desc}\n👉 Click để ${this.getSlotActionLabel(item.id, def)} ngay!`;

          slotEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.useSlotItem(i);
          });
        }
      }

      frag.appendChild(slotEl);
    }

    grid.appendChild(frag);

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
