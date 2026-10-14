// Inventory & Equipment Management System
// 12 Inventory Slots (Max Stack = 20) + 5 Armor Slots (Helmet, Chestplate, Leggings, Boots, Gloves)

class InventorySystem {
  constructor(game) {
    this.game = game;
    this.slotCount = CONSTANTS.INVENTORY_SLOTS; // 12
    this.maxStack = CONSTANTS.MAX_STACK_SIZE;   // 20

    // 12 inventory slots
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
    this.selectedSlotIndex = null;
    this.initDefaultItems();
  }

  initDefaultItems() {
    // Pre-equip 5 Survival Armors directly on character
    this.armorSlots.helmet = { id: 'mask_gas', count: 1 };
    this.armorSlots.chestplate = { id: 'vest_survival', count: 1 };
    this.armorSlots.leggings = { id: 'pants_hazard', count: 1 };
    this.armorSlots.boots = { id: 'boots_scout', count: 1 };
    this.armorSlots.gloves = { id: 'gloves_miner', count: 1 };

    // 12 Items for initial 12 inventory slots
    this.addItem('defense_wall', 4);
    this.addItem('defense_trap', 3);
    this.addItem('defense_turret', 1);
    this.addItem('defense_mortar', 1);
    this.addItem('wood', 15);
    this.addItem('stone', 15);
    this.addItem('tech_scrap', 8);
    this.addItem('snow_lotus', 6);
    this.addItem('sulfur_dust', 8);
    this.addItem('quartz_crystal', 4);
    this.addItem('silver_moss', 6);
    this.addItem('egg_fluid', 3);
  }

  // Add item with stack logic (max 20)
  addItem(itemId, count = 1) {
    const itemDef = CONSTANTS.ITEM_TYPES[itemId];
    if (!itemDef) return false;

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
      const emptyIdx = this.slots.findIndex(s => s === null);
      if (emptyIdx === -1) {
        // Inventory full
        if (this.game && this.game.floatingTexts && this.game.player) {
          this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, 'KHO ĐỒ ĐÃ ĐẦY!', '#ef4444', 12, 1.0));
        }
        return false;
      }

      const addAmount = Math.min(Math.min(itemDef.maxStack, this.maxStack), remaining);
      this.slots[emptyIdx] = {
        id: itemId,
        count: addAmount
      };
      remaining -= addAmount;
    }

    this.renderUI();
    return true;
  }

  removeItem(slotIndex, count = 1) {
    if (slotIndex < 0 || slotIndex >= this.slotCount || !this.slots[slotIndex]) return false;
    this.slots[slotIndex].count -= count;
    if (this.slots[slotIndex].count <= 0) {
      this.slots[slotIndex] = null;
    }
    this.renderUI();
    return true;
  }

  // Phase 3: Expand Inventory Slots via Backpack Upgrade (up to 18 slots)
  expandCapacity(extraSlots = 6) {
    if (this.slotCount >= 18) {
      if (this.game && this.game.floatingTexts) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'BALO ĐÃ ĐẠT SỨC CHỨA TỐI ĐA (18 Ô)!', '#ef4444', 12, 1.2));
      }
      return false;
    }
    this.slotCount += extraSlots;
    while (this.slots.length < this.slotCount) {
      this.slots.push(null);
    }
    window.audioManager.playEquip();
    if (this.game && this.game.floatingTexts) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, `🎒 NÂNG CẤP BALO: MỞ RỘNG THÀNH ${this.slotCount} Ô CHỨA!`, '#22c55e', 14, 2.0));
    }
    this.renderUI();
    return true;
  }

  // Equip armor from inventory slot
  equipArmorFromSlot(slotIndex) {
    const itemData = this.slots[slotIndex];
    if (!itemData) return;
    const itemDef = CONSTANTS.ITEM_TYPES[itemData.id];
    if (!itemDef || itemDef.category !== 'armor') return;

    const targetSlot = itemDef.slot; // 'helmet', 'chestplate', etc.
    const currentEquipped = this.armorSlots[targetSlot];

    // Swap
    this.armorSlots[targetSlot] = itemData;
    this.slots[slotIndex] = currentEquipped;

    window.audioManager.playEquip();
    this.updatePlayerStats();
    this.renderUI();
  }

  // Unequip armor back to inventory
  unequipArmor(slotKey) {
    const equipped = this.armorSlots[slotKey];
    if (!equipped) return;

    // Find empty slot
    const emptyIdx = this.slots.findIndex(s => s === null);
    if (emptyIdx === -1) {
      if (this.game && this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, 'KHÔNG ĐỦ CHỖ TRỐNG!', '#ef4444', 12, 1.0));
      }
      return;
    }

    this.slots[emptyIdx] = equipped;
    this.armorSlots[slotKey] = null;

    window.audioManager.playEquip();
    this.updatePlayerStats();
    this.renderUI();
  }

  // Calculate and apply all armor bonuses to Player
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
        window.audioManager.playEquip();
      }
    }
  }

  renderUI() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Render 12 inventory slots
    for (let i = 0; i < this.slotCount; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'inv-slot';
      slotEl.dataset.slotIndex = i;

      const item = this.slots[i];
      if (item) {
        const def = CONSTANTS.ITEM_TYPES[item.id];
        const iconCanvas = window.pixelArt.get(`icon_${def.icon}`);

        if (iconCanvas) {
          const img = document.createElement('img');
          img.src = iconCanvas.toDataURL();
          img.className = 'slot-icon';
          slotEl.appendChild(img);
        }

        if (item.count > 1) {
          const badge = document.createElement('span');
          badge.className = 'slot-badge';
          badge.innerText = item.count;
          slotEl.appendChild(badge);
        }

        // Tooltip
        slotEl.title = `${def.name}\n${def.desc}\n(Click để trang bị / sử dụng)`;

        slotEl.onclick = () => {
          if (def.category === 'armor') {
            this.equipArmorFromSlot(i);
          } else if (def.category === 'weapon') {
            this.game.weapons.switchWeapon(def.weaponKey);
          } else if (def.id === 'antidote_lesser') {
            // Lesser Antidote Serum: -25% Toxin
            this.game.player.infection = Math.max(0, this.game.player.infection - 25);
            window.audioManager.playEquip();
            this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'GIẢM 25% ĐỘC TỐ (HUYẾT THANH)!', '#22c55e', 13, 1.2));
            this.removeItem(i, 1);
          } else if (def.id === 'antidote_pure') {
            // Pure Antibody Elixir: -60% Toxin + 1 Day Immunity
            this.game.player.infection = Math.max(0, this.game.player.infection - 60);
            this.game.player.immunityTimer = CONSTANTS.DAY_DURATION_SEC; // 120s = 1 full day
            window.audioManager.playEquip();
            this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, '★ KHÁNG THỂ TINH KHIẾT: -60% ĐỘC + MIỄN NHIỄM 1 NGÀY! ★', '#38bdf8', 13, 2.0));
            this.removeItem(i, 1);
          } else if (def.id === 'pure_water') {
            // Drink pure water (-15% infection, +15 HP)
            this.game.player.infection = Math.max(0, this.game.player.infection - 15);
            this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + 15);
            window.audioManager.playEquip();
            this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 20, '-15% ĐỘC TỐ & +15 HP!', '#38bdf8', 12, 1.0));
            this.removeItem(i, 1);
          } else if (def.id === 'dirty_water') {
            // Drink dirty water (+20% infection, +5 HP)
            this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + 5);
            this.game.player.addInfection(20, 'NƯỚC Ô NHIỄM');
            window.audioManager.playEquip();
            this.removeItem(i, 1);
          } else if (def.id === 'wild_berry') {
            // Clean wild berry (+18 HP, 0% toxin)
            this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + 18);
            window.audioManager.playEquip();
            this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 20, '+18 HP (QUẢ RỪNG SẠCH)!', '#22c55e', 12, 1.0));
            this.removeItem(i, 1);
          } else if (def.id === 'blighted_berry') {
            // Blighted mutant berry (+5 HP, +35% toxin)
            this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + 5);
            this.game.player.addInfection(35, 'QUẢ ĐỘT BIẾN NHIỄM ĐỘC');
            window.audioManager.playHit();
            this.removeItem(i, 1);
          } else if (def.category === 'seed') {
            // Seed -> Prompt to use in Bio-Lab
            if (window.labSystem) {
              window.labSystem.open('hydroponics');
              this.toggleUI(); // close inv
            }
          } else if (def.category === 'defense') {
            // Click to build defense structure!
            if (this.game && this.game.buildingManager) {
              this.game.buildingManager.enterBuildMode(def.structType);
              this.toggleUI(); // close inv so player can place
            }
          } else if (def.category === 'upgrade' && def.id === 'backpack_upgraded') {
            if (this.expandCapacity(6)) {
              this.removeItem(i, 1);
            }
          }
        };
      }

      grid.appendChild(slotEl);
    }

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
        const iconCanvas = window.pixelArt.get(`icon_${def.icon}`);
        if (iconCanvas) {
          const img = document.createElement('img');
          img.src = iconCanvas.toDataURL();
          img.className = 'slot-icon';
          el.appendChild(img);
        }
        el.title = `[ĐÃ TRANG BỊ] ${def.name}\n${def.desc}\n(Click để tháo ra)`;
        el.onclick = () => this.unequipArmor(slotKey);
      } else {
        el.innerHTML = `<span class="empty-armor-label">${armorNames[slotKey]}</span>`;
        el.title = `Ô trang bị: ${armorNames[slotKey]} (Trống)`;
        el.onclick = null;
      }
    }

    // Update Player Stats Panel in Inventory Modal
    this.updateStatsDisplay();
  }

  updateStatsDisplay() {
    if (!this.game || !this.game.player) return;
    const p = this.game.player;

    const hpEl = document.getElementById('stat-display-hp');
    const armorEl = document.getElementById('stat-display-armor');
    const toxinEl = document.getElementById('stat-display-toxin');
    const speedEl = document.getElementById('stat-display-speed');

    if (hpEl) hpEl.innerText = `${Math.round(p.hp)} / ${p.maxHp}`;
    if (armorEl) armorEl.innerText = `${p.armor}`;
    if (toxinEl) toxinEl.innerText = `${p.toxinResist}%`;
    if (speedEl) speedEl.innerText = `${Math.round(p.getEffectiveSpeed())} px/s`;
  }
}

// Global registry
window.InventorySystem = InventorySystem;
