// Bio-Lab, Furnace, Workbench & Workshop Interactive Management System
// Includes Multi-Tier Wall & Defense Gun Upgrades (Lv.1 -> Lv.3) and Player Gun / Weapon Upgrades (Lv.1 -> Lv.3)

class LabSystem {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.currentTab = 'lab'; // 'lab', 'furnace', 'workbench', 'workshop', 'hydroponics'
    this._lastHydroPercentSum = -1;

    // 3 Isolated Hydroponic Growth Pods inside Bio-Lab
    this.hydroPods = [
      { id: 0, seedId: null, progress: 0, growthTime: 40, ready: false },
      { id: 1, seedId: null, progress: 0, growthTime: 40, ready: false },
      { id: 2, seedId: null, progress: 0, growthTime: 40, ready: false }
    ];
  }

  update(dt) {
    let percentSum = 0;
    for (let pod of this.hydroPods) {
      if (pod.seedId && !pod.ready) {
        pod.progress += dt;
        if (pod.progress >= pod.growthTime) {
          pod.progress = pod.growthTime;
          pod.ready = true;
        }
      }
      percentSum += pod.seedId ? Math.floor((pod.progress / pod.growthTime) * 100) : -1;
    }

    // Only re-render Hydroponics DOM when percentage integer changes (prevents 60fps DOM thrashing!)
    if (this.isOpen && this.currentTab === 'hydroponics' && percentSum !== this._lastHydroPercentSum) {
      this._lastHydroPercentSum = percentSum;
      this.renderHydroponicsTab();
    }
  }

  open(tab = 'lab') {
    this.isOpen = true;
    this.currentTab = tab;
    const modal = document.getElementById('lab-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.switchTab(tab);
      window.audioManager.playEquip();
    }
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('lab-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.lab-tab-btn').forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (tab === 'lab') {
      this.renderRecipesTab('LAB', 'lab-recipe-list', 'BÀO CHẾ');
    } else if (tab === 'furnace') {
      this.renderRecipesTab('FURNACE', 'furnace-recipe-list', 'NUNG NGUYÊN LIỆU');
    } else if (tab === 'workbench') {
      this.renderRecipesTab('WORKBENCH', 'workbench-recipe-list', 'CHẾ TẠO');
      this.appendDefenseUpgradeCards('workbench-recipe-list', ['wall', 'trap']);
    } else if (tab === 'workshop') {
      this.renderRecipesTab('WORKSHOP', 'workshop-recipe-list', 'LẮP RÁP');
      this.appendDefenseUpgradeCards('workshop-recipe-list', ['wall', 'turret', 'mortar', 'trap']);
      this.appendWeaponUpgradeCards('workshop-recipe-list');
    } else if (tab === 'hydroponics') {
      this._lastHydroPercentSum = -999;
      this.renderHydroponicsTab();
    }

    const labPanel = document.getElementById('tab-content-lab');
    const furnacePanel = document.getElementById('tab-content-furnace');
    const workbenchPanel = document.getElementById('tab-content-workbench');
    const workshopPanel = document.getElementById('tab-content-workshop');
    const hydroPanel = document.getElementById('tab-content-hydro');

    if (labPanel) labPanel.style.display = (tab === 'lab') ? 'block' : 'none';
    if (furnacePanel) furnacePanel.style.display = (tab === 'furnace') ? 'block' : 'none';
    if (workbenchPanel) workbenchPanel.style.display = (tab === 'workbench') ? 'block' : 'none';
    if (workshopPanel) workshopPanel.style.display = (tab === 'workshop') ? 'block' : 'none';
    if (hydroPanel) hydroPanel.style.display = (tab === 'hydroponics') ? 'block' : 'none';
  }

  // Render Defense Structure Upgrade Cards (Wall, Turret, Mortar, Trap)
  appendDefenseUpgradeCards(containerId, structTypes) {
    const container = document.getElementById(containerId);
    if (!container || !this.game || !this.game.buildingManager) return;

    const bm = this.game.buildingManager;

    const header = document.createElement('div');
    header.style.cssText = 'margin: 12px 0 6px 0; padding: 6px 10px; background: rgba(56, 189, 248, 0.14); border-left: 3px solid #38bdf8; color: #38bdf8; font-weight: 800; font-size: 12px; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;';
    header.innerHTML = `
      <span>🏰 NÂNG CẤP TƯỜNG & SÚNG THỦ THÀNH ĐÃ ĐẶT (LV.1 ➔ LV.3)</span>
      <button class="craft-btn can-craft" style="padding: 4px 10px; font-size: 10px;" onclick="window.labSystem.close(); window.buildingManager.enterBuildMode('upgrade');">
        🔧 CHỌN TRÊN BẢN ĐỒ [PHÍM 9 / R]
      </button>
    `;
    container.appendChild(header);

    const icons = { wall: '🧱', turret: '🗼', mortar: '💣', trap: '⚙' };

    structTypes.forEach(type => {
      const baseCfg = CONSTANTS.DEFENSE[type];
      if (!baseCfg || !baseCfg.tiers) return;

      const placedList = bm.defenses.filter(d => d.type === type);
      const upgradeableList = placedList.filter(d => (d.level || 1) < 3);

      // Determine target level to display (lowest level among placed, or Lv.2 if none placed yet)
      let targetNextLv = 2;
      if (upgradeableList.length > 0) {
        const minLv = Math.min(...upgradeableList.map(d => d.level || 1));
        targetNextLv = minLv + 1;
      } else if (placedList.length > 0) {
        targetNextLv = 4; // All placed are max level 3!
      }

      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.style.borderColor = targetNextLv === 3 ? 'rgba(250, 204, 21, 0.45)' : 'rgba(56, 189, 248, 0.35)';

      if (targetNextLv > 3) {
        const tier3 = baseCfg.tiers[3];
        card.innerHTML = `
          <div class="recipe-info">
            <div class="recipe-name" style="color: #facc15;">${icons[type]} ${tier3.name} (Đã Đặt: ${placedList.length} cái)</div>
            <div class="recipe-desc">${tier3.desc}</div>
          </div>
          <div class="recipe-action">
            <button class="craft-btn disabled" disabled>★ ĐÃ MAX LV.3</button>
          </div>
        `;
      } else {
        const nextTier = baseCfg.tiers[targetNextLv];
        let canAfford = true;
        const reqHtml = nextTier.cost.map(req => {
          const has = this.getItemCountInInventory(req.id);
          const enough = has >= req.count;
          if (!enough) canAfford = false;
          const def = CONSTANTS.ITEM_TYPES[req.id];
          return `
            <div class="recipe-req ${enough ? 'req-met' : 'req-missing'}">
              <span>${def ? def.name : req.name}:</span>
              <span>${has} / ${req.count}</span>
            </div>
          `;
        }).join('');

        const canUpgradeNow = canAfford && upgradeableList.length > 0;
        const statusText = placedList.length === 0
          ? `<span style="color:#f59e0b;">(Chưa đặt trên bản đồ - Hãy đặt công trình ra trước!)</span>`
          : `<span style="color:#38bdf8;">(Đang đặt: ${placedList.length} cái | Cần nâng: ${upgradeableList.length} cái)</span>`;

        card.innerHTML = `
          <div class="recipe-info">
            <div class="recipe-name" style="color: ${targetNextLv === 3 ? '#facc15' : '#38bdf8'};">
              ${icons[type]} Nâng Cấp: ${nextTier.name} ${statusText}
            </div>
            <div class="recipe-desc">${nextTier.desc}</div>
            <div class="recipe-ingredients">${reqHtml}</div>
          </div>
          <div class="recipe-action">
            <button class="craft-btn ${canUpgradeNow ? 'can-craft' : 'disabled'}" ${canUpgradeNow ? '' : 'disabled'}>
              ${placedList.length === 0 ? 'CHƯA ĐẶT' : `⬆ NÂNG LV.${targetNextLv}`}
            </button>
          </div>
        `;

        if (canUpgradeNow) {
          card.querySelector('.craft-btn').onclick = () => {
            bm.upgradeOneByType(type);
            this.switchTab(this.currentTab);
          };
        }
      }

      container.appendChild(card);
    });
  }

  // Render Player Gun & Weapon Upgrade Cards (Lv.1 -> Lv.3)
  appendWeaponUpgradeCards(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !this.game || !this.game.weapons) return;

    const ws = this.game.weapons;
    const header = document.createElement('div');
    header.style.cssText = 'margin: 14px 0 6px 0; padding: 6px 10px; background: rgba(250, 204, 21, 0.14); border-left: 3px solid #facc15; color: #facc15; font-weight: 800; font-size: 12px; letter-spacing: 0.5px;';
    header.innerHTML = `🔫 NÂNG CẤP SÚNG TRƯỜNG PLASMA & VŨ KHÍ CHIẾN ĐẤU (LV.1 ➔ LV.3)`;
    container.appendChild(header);

    const weaponKeys = ['GUN', 'BOW', 'SPEAR', 'STAFF', 'DAGGER'];
    const emojis = { GUN: '🔫', BOW: '🏹', SPEAR: '🗡', STAFF: '🪄', DAGGER: '🔪' };

    weaponKeys.forEach(wKey => {
      const wStats = ws.getWeaponStats(wKey);
      if (!wStats) return;
      const curLv = wStats.level;

      const card = document.createElement('div');
      card.className = 'recipe-card';

      if (curLv >= 3) {
        card.innerHTML = `
          <div class="recipe-info">
            <div class="recipe-name" style="color: #facc15;">${emojis[wKey]} ${wStats.name} [Lv.3 MAX]</div>
            <div class="recipe-desc">Sát thương: ${wStats.damage} DMG | Tốc đánh: ${wStats.attackCooldown.toFixed(2)}s | Tầm: ${wStats.range}px (Đã đạt cấp tối đa!)</div>
          </div>
          <div class="recipe-action">
            <button class="craft-btn disabled" disabled>★ ĐÃ MAX LV.3</button>
          </div>
        `;
      } else {
        const nextLv = curLv + 1;
        const tierCfg = CONSTANTS.WEAPON_TIERS[nextLv];
        const nextDmg = Math.round(wStats.baseDamage * tierCfg.dmgMult);
        const nextRange = Math.round(CONSTANTS.WEAPONS[wKey].range * tierCfg.rangeMult);

        let canAfford = true;
        const reqHtml = tierCfg.cost.map(req => {
          const has = this.getItemCountInInventory(req.id);
          const enough = has >= req.count;
          if (!enough) canAfford = false;
          const def = CONSTANTS.ITEM_TYPES[req.id];
          return `
            <div class="recipe-req ${enough ? 'req-met' : 'req-missing'}">
              <span>${def ? def.name : req.name}:</span>
              <span>${has} / ${req.count}</span>
            </div>
          `;
        }).join('');

        card.innerHTML = `
          <div class="recipe-info">
            <div class="recipe-name" style="color: ${nextLv === 3 ? '#facc15' : '#38bdf8'};">
              ${emojis[wKey]} ${wStats.name} (Lv.${curLv} ➔ Lv.${nextLv})
            </div>
            <div class="recipe-desc">
              Nâng sát thương: <strong>${wStats.damage} ➔ ${nextDmg} DMG</strong> | Tầm: <strong>${wStats.range} ➔ ${nextRange}px</strong> | Tăng tốc bắn & hiệu ứng đạn cấp cao!
            </div>
            <div class="recipe-ingredients">${reqHtml}</div>
          </div>
          <div class="recipe-action">
            <button class="craft-btn ${canAfford ? 'can-craft' : 'disabled'}" ${canAfford ? '' : 'disabled'}>
              ⬆ NÂNG LV.${nextLv}
            </button>
          </div>
        `;

        if (canAfford) {
          card.querySelector('.craft-btn').onclick = () => {
            ws.upgradeWeapon(wKey);
          };
        }
      }

      container.appendChild(card);
    });
  }

  // Render recipes for Lab, Furnace, Workbench, Workshop
  renderRecipesTab(recipeGroup, containerId, actionBtnText) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const recipes = CONSTANTS.RECIPES[recipeGroup] || [];

    recipes.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'recipe-card';

      let canCraft = true;
      const ingredientsHtml = recipe.inputs.map(input => {
        const hasCount = this.getItemCountInInventory(input.id);
        const isEnough = hasCount >= input.count;
        if (!isEnough) canCraft = false;

        const def = CONSTANTS.ITEM_TYPES[input.id];
        return `
          <div class="recipe-req ${isEnough ? 'req-met' : 'req-missing'}">
            <span>${def ? def.name : input.name}:</span>
            <span>${hasCount} / ${input.count}</span>
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <div class="recipe-info">
          <div class="recipe-name">${recipe.name}</div>
          <div class="recipe-desc">${recipe.desc}</div>
          <div class="recipe-ingredients">
            ${ingredientsHtml}
          </div>
        </div>
        <div class="recipe-action">
          <button class="craft-btn ${canCraft ? 'can-craft' : 'disabled'}" ${canCraft ? '' : 'disabled'}>
            ${actionBtnText}
          </button>
        </div>
      `;

      const craftBtn = card.querySelector('.craft-btn');
      if (canCraft) {
        craftBtn.onclick = () => this.craftRecipe(recipe);
      }

      container.appendChild(card);
    });
  }

  getItemCountInInventory(itemId) {
    if (this.game && this.game.inventory && this.game.inventory.getItemCount) {
      return this.game.inventory.getItemCount(itemId);
    }
    let total = 0;
    for (let slot of this.game.inventory.slots) {
      if (slot && slot.id === itemId) {
        total += slot.count;
      }
    }
    return total;
  }

  craftRecipe(recipe) {
    for (let input of recipe.inputs) {
      if (this.getItemCountInInventory(input.id) < input.count) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'THIẾU NGUYÊN LIỆU!', '#ef4444', 12, 0.8));
        return;
      }
    }

    for (let input of recipe.inputs) {
      let needed = input.count;
      for (let i = 0; i < this.game.inventory.slotCount; i++) {
        const slot = this.game.inventory.slots[i];
        if (slot && slot.id === input.id) {
          const take = Math.min(slot.count, needed);
          slot.count -= take;
          needed -= take;
          if (slot.count <= 0) {
            this.game.inventory.slots[i] = null;
          }
          if (needed <= 0) break;
        }
      }
    }

    if (recipe.output.id === 'backpack_upgraded') {
      this.game.inventory.expandCapacity(4);
    } else {
      this.game.inventory.addItem(recipe.output.id, recipe.output.count);
    }

    window.audioManager.playEquip();
    const outDef = CONSTANTS.ITEM_TYPES[recipe.output.id];
    this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, `ĐÃ HOÀN TẤT: +${recipe.output.count} ${outDef.name}!`, '#38bdf8', 13, 1.2));

    if (this.game.inventory.isOpen) {
      this.game.inventory.renderUI();
    }
    this.switchTab(this.currentTab);
  }

  renderHydroponicsTab() {
    const container = document.getElementById('hydroponics-pods');
    if (!container) return;
    container.innerHTML = '';

    this.hydroPods.forEach((pod, idx) => {
      const podEl = document.createElement('div');
      podEl.className = 'hydro-pod';

      if (!pod.seedId) {
        podEl.innerHTML = `
          <div class="pod-title">🌱 LỒNG CẤY SỐ ${idx + 1}: TRỐNG</div>
          <div class="pod-status">Môi trường vô trùng 100%, sẵn sàng gieo giống.</div>
          <div class="pod-actions">
            <button class="seed-btn" onclick="window.labSystem.plantSeed(${idx}, 'seed_snow_lotus')">Cấy Tuyết Liên</button>
            <button class="seed-btn" onclick="window.labSystem.plantSeed(${idx}, 'seed_silver_moss')">Cấy Rêu Bạc</button>
          </div>
        `;
      } else {
        const seedDef = CONSTANTS.ITEM_TYPES[pod.seedId];
        const percent = Math.min(100, Math.floor((pod.progress / pod.growthTime) * 100));

        podEl.innerHTML = `
          <div class="pod-title">🧪 LỒNG CẤY SỐ ${idx + 1}: ${seedDef ? seedDef.name : ''}</div>
          <div class="pod-progress-bar">
            <div class="pod-progress-fill" style="width: ${percent}%;"></div>
          </div>
          <div class="pod-status">
            ${pod.ready ? '✨ ĐÃ TRƯỞNG THÀNH! THẢO DƯỢC TINH KHIẾT 100%' : `Đang nuôi dưỡng nhân tạo (${percent}%)...`}
          </div>
          <div class="pod-actions">
            ${pod.ready ? 
              `<button class="harvest-btn" onclick="window.labSystem.harvestPod(${idx})">🎉 THU HOẠCH SẠCH (x2)</button>` : 
              `<button class="seed-btn disabled" disabled>Đang sinh trưởng...</button>`
            }
          </div>
        `;
      }

      container.appendChild(podEl);
    });
  }

  plantSeed(podIndex, seedId) {
    if (this.getItemCountInInventory(seedId) < 1) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'BẠN KHÔNG CÓ MẦM GIỐNG NÀY!', '#ef4444', 12, 0.9));
      return;
    }

    this.game.inventory.removeItem(this.game.inventory.slots.findIndex(s => s && s.id === seedId), 1);

    const pod = this.hydroPods[podIndex];
    pod.seedId = seedId;
    pod.progress = 0;
    pod.ready = false;

    window.audioManager.playEquip();
    this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'ĐÃ CẤY MẦM VÀO LỒNG VÔ TRÙNG!', '#22c55e', 12, 1.0));
    this._lastHydroPercentSum = -999;
    this.renderHydroponicsTab();
  }

  harvestPod(podIndex) {
    const pod = this.hydroPods[podIndex];
    if (!pod || !pod.ready) return;

    const seedDef = CONSTANTS.ITEM_TYPES[pod.seedId];
    const cropId = seedDef.targetCrop;

    this.game.inventory.addItem(cropId, 2);

    window.audioManager.playEquip();
    this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, `THU HOẠCH THÀNH CÔNG: +2 ${CONSTANTS.ITEM_TYPES[cropId].name}!`, '#38bdf8', 13, 1.2));

    pod.seedId = null;
    pod.progress = 0;
    pod.ready = false;

    this._lastHydroPercentSum = -999;
    this.renderHydroponicsTab();
  }
}

// Global registry
window.LabSystem = LabSystem;
