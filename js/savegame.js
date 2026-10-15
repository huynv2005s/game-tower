// Save & Load Game State Manager
// Supports LocalStorage persistence, auto-save during Day/Night transitions, and state recovery (including Wall/Gun/Weapon Upgrades)

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
        version: 5,
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
        weaponLevels: (this.game.weapons && this.game.weapons.weaponLevels)
          ? { ...this.game.weapons.weaponLevels }
          : { SPEAR: 1, STAFF: 1, DAGGER: 1, BOW: 1, GUN: 1 },
        inventory: {
          slotCount: this.game.inventory ? this.game.inventory.slotCount : 99,
          slots: this.game.inventory ? this.game.inventory.slots.map(s => s ? { id: s.id, count: s.count } : null) : [],
          armorSlots: this.game.inventory ? JSON.parse(JSON.stringify(this.game.inventory.armorSlots)) : {}
        },
        defenses: (this.game.buildingManager && this.game.buildingManager.defenses) ?
          this.game.buildingManager.defenses.map(d => ({
            id: d.id,
            type: d.type,
            level: d.level || 1,
            name: d.name,
            col: d.col,
            row: d.row,
            x: d.x,
            y: d.y,
            hp: Math.round(d.hp),
            maxHp: d.maxHp,
            blocksMovement: d.blocksMovement,
            usesLeft: d.usesLeft || 12,
            maxUses: d.maxUses || 12
          })) : [],
        harvestables: (this.game.world && this.game.world.harvestables) ?
          this.game.world.harvestables.map(h => ({
            col: h.col,
            row: h.row,
            type: h.type,
            hp: h.hp,
            isDestroyed: h.isDestroyed
          })) : [],
        labLevel: this.game.lab ? (this.game.lab.labLevel || 1) : 1,
        autoReplant: this.game.lab ? (this.game.lab.autoReplant !== false) : true,
        hydroponics: (this.game.lab && this.game.lab.hydroPods) ?
          JSON.parse(JSON.stringify(this.game.lab.hydroPods)) : [],
        pets: this.game.petSystem ? {
          activePet: this.game.petSystem.activePet ? {
            id: this.game.petSystem.activePet.id,
            speciesId: this.game.petSystem.activePet.speciesId,
            hatchedDay: this.game.petSystem.activePet.hatchedDay || 1
          } : null,
          storedPets: Array.isArray(this.game.petSystem.storedPets)
            ? this.game.petSystem.storedPets.map(p => ({
                id: p.id,
                speciesId: p.speciesId,
                hatchedDay: p.hatchedDay || 1
              }))
            : [],
          incubator: this.game.petSystem.incubator ? { ...this.game.petSystem.incubator } : null
        } : null
      };

      localStorage.setItem(this.storageKey, JSON.stringify(saveData));

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

      // 2. Restore Weapon Upgrade Levels
      if (data.weaponLevels && this.game.weapons) {
        this.game.weapons.weaponLevels = {
          SPEAR: 1, STAFF: 1, DAGGER: 1, BOW: 1, GUN: 1,
          ...data.weaponLevels
        };
      }

      // 3. Restore Player
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

      // 4. Restore Inventory & Armor
      if (data.inventory && this.game.inventory) {
        const minSlots = CONSTANTS.INVENTORY_SLOTS || 99;
        this.game.inventory.slotCount = Math.max(minSlots, data.inventory.slotCount || minSlots);
        this.game.inventory.maxStack = CONSTANTS.MAX_STACK_SIZE || 99;
        if (Array.isArray(data.inventory.slots)) {
          this.game.inventory.slots = data.inventory.slots.map(s => (s && s.id && CONSTANTS.ITEM_TYPES[s.id]) ? { id: s.id, count: s.count } : null);
        }
        this.game.inventory.normalizeSlots();

        // Migrate older saves to v3 so player receives new upgrade materials & consumables
        if (!data.version || data.version < 3) {
          if (this.game.inventory.getItemCount('titanium_alloy') === 0) {
            this.game.inventory.addItem('titanium_alloy', 6);
          }
          if (this.game.inventory.getItemCount('plasma_core') === 0) {
            this.game.inventory.addItem('plasma_core', 3);
          }
          if (this.game.inventory.getItemCount('alien_chitin') === 0) {
            this.game.inventory.addItem('alien_chitin', 6);
          }
          if (this.game.inventory.getItemCount('iron_ore') === 0) {
            this.game.inventory.addItem('iron_ore', 6);
          }
        }

        // Migrate older saves to v4 so player receives 2 starter Monster Eggs to incubate
        if (!data.version || data.version < 4) {
          if (this.game.inventory.getItemCount('monster_egg') === 0) {
            this.game.inventory.addItem('monster_egg', 2);
          }
        }

        // Migrate older saves to v5 so player receives starter seeds for Bio-Lab farming expansion
        if (!data.version || data.version < 5) {
          if (this.game.inventory.getItemCount('seed_snow_lotus') === 0) {
            this.game.inventory.addItem('seed_snow_lotus', 4);
          }
          if (this.game.inventory.getItemCount('seed_silver_moss') === 0) {
            this.game.inventory.addItem('seed_silver_moss', 4);
          }
          if (this.game.inventory.getItemCount('seed_wild_berry') === 0) {
            this.game.inventory.addItem('seed_wild_berry', 4);
          }
          if (this.game.inventory.getItemCount('seed_quartz_bloom') === 0) {
            this.game.inventory.addItem('seed_quartz_bloom', 2);
          }
        }

        if (data.inventory.armorSlots) {
          this.game.inventory.armorSlots = data.inventory.armorSlots;
        }
        if (this.game.inventory.updatePlayerStats) {
          this.game.inventory.updatePlayerStats();
        }
      }

      // 5. Restore Defenses (with Level support)
      if (Array.isArray(data.defenses) && this.game.buildingManager) {
        this.game.buildingManager.defenses = data.defenses.map(d => ({
          ...d,
          level: d.level || 1,
          maxUses: d.maxUses || 12,
          cooldown: 0,
          aimAngle: 0
        }));
      }

      // 6. Restore Harvestables (Ores, Broken Alien Eggs)
      if (Array.isArray(data.harvestables) && this.game.world && this.game.world.harvestables) {
        for (let savedH of data.harvestables) {
          const worldH = this.game.world.harvestables.find(h => h.col === savedH.col && h.row === savedH.row);
          if (worldH) {
            worldH.hp = savedH.hp;
            worldH.isDestroyed = savedH.isDestroyed;
            if (worldH.isDestroyed) {
              this.game.world.tiles[worldH.row][worldH.col] = CONSTANTS.TILES.MOUNTAIN_ROCK;
            }
          }
        }
        this.game.minimapDirty = true;
      }

      // 7. Restore Bio-Lab Upgrade Level & Hydroponics Pods
      if (this.game.lab) {
        this.game.lab.labLevel = Math.max(1, Math.min(4, data.labLevel || 1));
        this.game.lab.autoReplant = data.autoReplant !== false;
        if (Array.isArray(data.hydroponics)) {
          this.game.lab.hydroPods = data.hydroponics;
        }
        this.game.lab.syncPodsWithLevel();
      }

      // 8. Restore Companion Pet & Bio-Lab Incubator (Strictly 1 Active Pet)
      if (data.pets && this.game.petSystem) {
        if (data.pets.activePet && data.pets.activePet.speciesId) {
          const restoredActive = this.game.petSystem.createPetInstance(data.pets.activePet.speciesId);
          if (restoredActive) {
            restoredActive.id = data.pets.activePet.id || restoredActive.id;
            restoredActive.hatchedDay = data.pets.activePet.hatchedDay || 1;
            restoredActive.x = this.game.player.x - 24;
            restoredActive.y = this.game.player.y + 16;
            this.game.petSystem.activePet = restoredActive;
          }
        } else {
          this.game.petSystem.activePet = null;
        }

        if (Array.isArray(data.pets.storedPets)) {
          this.game.petSystem.storedPets = data.pets.storedPets
            .map(sp => {
              if (!sp || !sp.speciesId) return null;
              const inst = this.game.petSystem.createPetInstance(sp.speciesId);
              if (inst) {
                inst.id = sp.id || inst.id;
                inst.hatchedDay = sp.hatchedDay || 1;
              }
              return inst;
            })
            .filter(Boolean);
        }

        if (data.pets.incubator) {
          this.game.petSystem.incubator = {
            ...this.game.petSystem.incubator,
            ...data.pets.incubator
          };
        }

        if (this.game.inventory) {
          this.game.inventory.updatePlayerStats();
          this.game.inventory.renderUI();
        }
      }

      // Update UI
      this.game.updateHUD(true);

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
    toast.textContent = text;
    toast.className = 'show';
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.className = '';
    }, 2800);
  }
}

// Global registry
window.SaveManager = SaveManager;
