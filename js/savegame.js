// Save & Load Game State Manager
// Supports LocalStorage persistence, auto-save during Day/Night transitions, and state recovery

class SaveManager {
  constructor(game) {
    this.game = game;
    this.storageKey = 'alien_apocalypse_save_v1';
    this.lastAutoSaveDay = 0;
  }

  hasSave() {
    try {
      return localStorage.getItem(this.storageKey) !== null;
    } catch (e) {
      console.warn('localStorage access failed:', e);
      return false;
    }
  }

  saveGame(isAuto = false) {
    try {
      if (!this.game || !this.game.player || !this.game.dayNight) return false;

      const saveData = {
        version: 2,
        saveTime: Date.now(),
        dayNight: {
          dayCount: this.game.dayNight.dayCount,
          time: this.game.dayNight.time,
          isNight: this.game.dayNight.isNight,
          lightLevel: this.game.dayNight.lightLevel
        },
        player: {
          x: Math.round(this.game.player.x),
          y: Math.round(this.game.player.y),
          hp: Math.round(this.game.player.hp),
          maxHp: this.game.player.maxHp,
          infection: Math.round(this.game.player.infection * 10) / 10,
          immunityTimer: Math.round(this.game.player.immunityTimer),
          activeWeapon: this.game.player.activeWeapon || 'SPEAR'
        },
        inventory: {
          slotCount: this.game.inventory ? this.game.inventory.slotCount : 16,
          slots: this.game.inventory ? this.game.inventory.slots.map(s => s ? { id: s.id, count: s.count } : null) : [],
          armorSlots: this.game.inventory ? JSON.parse(JSON.stringify(this.game.inventory.armorSlots)) : {}
        },
        defenses: (this.game.buildingManager && this.game.buildingManager.defenses) ?
          this.game.buildingManager.defenses.map(d => ({
            id: d.id,
            type: d.type,
            name: d.name,
            col: d.col,
            row: d.row,
            x: d.x,
            y: d.y,
            hp: Math.round(d.hp),
            maxHp: d.maxHp,
            blocksMovement: d.blocksMovement,
            usesLeft: d.usesLeft || 12
          })) : [],
        harvestables: (this.game.world && this.game.world.harvestables) ?
          this.game.world.harvestables.map(h => ({
            id: h.id,
            col: h.col,
            row: h.row,
            type: h.type,
            hp: h.hp,
            isDestroyed: h.isDestroyed
          })) : [],
        hydroponics: (this.game.lab && this.game.lab.hydroPods) ?
          JSON.parse(JSON.stringify(this.game.lab.hydroPods)) : []
      };

      localStorage.setItem(this.storageKey, JSON.stringify(saveData));

      // Visual & Audio notification
      const label = isAuto
        ? `💾 TỰ ĐỘNG LƯU: ${this.game.dayNight.isNight ? 'BẮT ĐẦU ĐÊM' : 'BÌNH MINH'} (NGÀY ${this.game.dayNight.dayCount})`
        : `💾 ĐÃ LƯU TIẾN TRÌNH VÀO BỘ NHỚ!`;

      if (this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 35, label, '#38bdf8', 12, 1.5));
      }

      this.showSaveToast(label);
      if (window.audioManager) window.audioManager.playEquip();

      return true;
    } catch (err) {
      console.error('Lỗi khi lưu game:', err);
      return false;
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data || !data.player) return false;

      // 1. Restore Day/Night
      if (data.dayNight && this.game.dayNight) {
        this.game.dayNight.dayCount = data.dayNight.dayCount || 1;
        this.game.dayNight.time = data.dayNight.time || 0;
        this.game.dayNight.isNight = !!data.dayNight.isNight;
        this.game.dayNight.lightLevel = data.dayNight.lightLevel || 1.0;
        this.game.dayNight.lastStateWasNight = this.game.dayNight.isNight;
      }

      // 2. Restore Player
      if (data.player && this.game.player) {
        this.game.player.x = data.player.x || this.game.player.x;
        this.game.player.y = data.player.y || this.game.player.y;
        this.game.player.hp = Math.min(data.player.maxHp || 100, data.player.hp || 100);
        this.game.player.maxHp = data.player.maxHp || 100;
        this.game.player.infection = data.player.infection || 0;
        this.game.player.immunityTimer = data.player.immunityTimer || 0;
        this.game.player.isDead = false;

        if (data.player.activeWeapon && this.game.weapons) {
          this.game.weapons.switchWeapon(data.player.activeWeapon);
        }
      }

      // 3. Restore Inventory & Armor
      if (data.inventory && this.game.inventory) {
        const minSlots = CONSTANTS.INVENTORY_SLOTS || 16;
        this.game.inventory.slotCount = Math.max(minSlots, data.inventory.slotCount || minSlots);
        if (Array.isArray(data.inventory.slots)) {
          this.game.inventory.slots = data.inventory.slots.map(s => (s && s.id && CONSTANTS.ITEM_TYPES[s.id]) ? { id: s.id, count: s.count } : null);
        }
        this.game.inventory.normalizeSlots();

        // Migrate v1 saves to include starter consumables if missing
        if (!data.version || data.version < 2) {
          if (this.game.inventory.getItemCount('pure_water') === 0) {
            this.game.inventory.addItem('pure_water', 3);
          }
          if (this.game.inventory.getItemCount('antidote_lesser') === 0) {
            this.game.inventory.addItem('antidote_lesser', 2);
          }
        }

        if (data.inventory.armorSlots) {
          this.game.inventory.armorSlots = data.inventory.armorSlots;
        }
        if (this.game.inventory.updatePlayerStats) {
          this.game.inventory.updatePlayerStats();
        }
        this.game.inventory.renderUI();
      }

      // 4. Restore Defenses
      if (Array.isArray(data.defenses) && this.game.buildingManager) {
        this.game.buildingManager.defenses = data.defenses.map(d => ({
          ...d,
          cooldown: 0,
          aimAngle: 0
        }));
      }

      // 5. Restore Harvestables (Ores, Broken Alien Eggs)
      if (Array.isArray(data.harvestables) && this.game.world && this.game.world.harvestables) {
        for (let savedH of data.harvestables) {
          const worldH = this.game.world.harvestables.find(h => h.col === savedH.col && h.row === savedH.row);
          if (worldH) {
            worldH.hp = savedH.hp;
            worldH.isDestroyed = savedH.isDestroyed;
            if (worldH.isDestroyed) {
              // Clear tile visually
              this.game.world.tiles[worldH.row][worldH.col] = CONSTANTS.TILES.MOUNTAIN_ROCK;
            }
          }
        }
      }

      // 6. Restore Hydroponics
      if (Array.isArray(data.hydroponics) && this.game.lab) {
        this.game.lab.hydroPods = data.hydroponics;
      }

      // Update UI
      this.game.updateHUD();

      const label = `💾 ĐÃ KHÔI PHỤC TIẾN TRÌNH: NGÀY ${this.game.dayNight.dayCount}`;
      if (this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 40, label, '#22c55e', 14, 2.0));
      }
      this.showSaveToast(label);

      return true;
    } catch (err) {
      console.error('Lỗi khi tải bản lưu:', err);
      return false;
    }
  }

  clearSave() {
    try {
      localStorage.removeItem(this.storageKey);
      this.showSaveToast('🗑 ĐÃ XÓA DỮ LIỆU LƯU GAME THÀNH CÔNG!');
      return true;
    } catch (e) {
      return false;
    }
  }

  showSaveToast(text) {
    let toast = document.getElementById('save-toast-banner');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'save-toast-banner';
      document.body.appendChild(toast);
    }
    toast.innerText = text;
    toast.className = 'show';
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.className = '';
    }, 2800);
  }
}

// Global registry
window.SaveManager = SaveManager;
