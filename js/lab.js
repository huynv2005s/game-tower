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
    } else if (tab === 'incubator') {
      this.renderIncubatorTab();
    }

    const labPanel = document.getElementById('tab-content-lab');
    const furnacePanel = document.getElementById('tab-content-furnace');
    const workbenchPanel = document.getElementById('tab-content-workbench');
    const workshopPanel = document.getElementById('tab-content-workshop');
    const hydroPanel = document.getElementById('tab-content-hydro');
    const incubatorPanel = document.getElementById('tab-content-incubator');

    if (labPanel) labPanel.style.display = (tab === 'lab') ? 'block' : 'none';
    if (furnacePanel) furnacePanel.style.display = (tab === 'furnace') ? 'block' : 'none';
    if (workbenchPanel) workbenchPanel.style.display = (tab === 'workbench') ? 'block' : 'none';
    if (workshopPanel) workshopPanel.style.display = (tab === 'workshop') ? 'block' : 'none';
    if (hydroPanel) hydroPanel.style.display = (tab === 'hydroponics') ? 'block' : 'none';
    if (incubatorPanel) incubatorPanel.style.display = (tab === 'incubator') ? 'block' : 'none';
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

  // Render Bio-Lab Egg Incubator & Companion Pet Management Tab
  renderIncubatorTab() {
    const container = document.getElementById('incubator-content');
    if (!container || !this.game || !this.game.petSystem) return;
    container.innerHTML = '';

    const ps = this.game.petSystem;
    const inLab = ps.isPlayerInBioLab();
    const eggCount = this.getItemCountInInventory('monster_egg');
    const inc = ps.incubator;
    const eggIconUrl = window.pixelArt ? window.pixelArt.getDataURL('icon_monster_egg') : '';

    // 1. Bio-Lab Quarantine Zone Validation Banner
    const zoneBanner = document.createElement('div');
    zoneBanner.style.cssText = inLab
      ? 'padding: 8px 12px; margin-bottom: 10px; border-radius: 6px; background: rgba(16, 185, 129, 0.16); border: 1px solid #10b981; color: #a7f3d0; font-size: 11px; font-weight: 700;'
      : 'padding: 8px 12px; margin-bottom: 10px; border-radius: 6px; background: rgba(239, 68, 68, 0.20); border: 1px solid #ef4444; color: #fca5a5; font-size: 11px; font-weight: 700;';
    zoneBanner.innerHTML = inLab
      ? `✅ <strong>MÔI TRƯỜNG PHÒNG LAB HỢP LỆ:</strong> Bạn đang đứng trong Phòng Lab Cách Ly — Có thể Đặt Trứng Ấp và Mở Trứng Nở Pet ngẫu nhiên!`
      : `🚫 <strong>CHỈ ẤP ĐƯỢC TRONG PHÒNG LAB!</strong> Hiện bạn đang đứng ngoài tự nhiên. Hãy di chuyển nhân vật về <strong>Phòng Lab Cách Ly (Bio-Lab)</strong> để Ấp Trứng hoặc Mở Trứng!`;
    container.appendChild(zoneBanner);

    // 2. Egg Incubator Pod Card
    const incCard = document.createElement('div');
    incCard.className = 'hydro-pod';
    incCard.style.borderColor = inc.ready ? '#facc15' : (inc.hasEgg ? '#38bdf8' : '#10b981');

    if (!inc.hasEgg) {
      const canStart = inLab && eggCount > 0;
      incCard.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:12px; flex:1;">
            ${eggIconUrl ? `<img src="${eggIconUrl}" style="width:44px;height:44px;image-rendering:pixelated;border:1px solid #f0abfc;border-radius:6px;background:#1e1b4b;padding:3px;">` : ''}
            <div>
              <div class="pod-title" style="color:#f0abfc; font-size:13px;">🥚 LỒNG ẤP TRỨNG QUÁI VẬT SINH HỌC: ĐANG TRỐNG</div>
              <div class="pod-status" style="margin-top:2px;">
                Trứng Quái Vật trong Balo: <strong style="color:${eggCount > 0 ? '#facc15' : '#ef4444'};">${eggCount} quả</strong>
                <span style="color:#94a3b8;">(Nhặt tại Ổ Trứng trên Vùng Núi [Phím F / Đánh] hoặc hạ Quái Vật)</span>
              </div>
            </div>
          </div>
          <div class="pod-actions">
            <button class="craft-btn ${canStart ? 'can-craft' : 'disabled'}" ${canStart ? '' : 'disabled'} id="btn-start-incubate">
              ${!inLab ? '🚫 CẦN Ở TRONG LAB' : (eggCount > 0 ? '🥚 ĐẶT 1 TRỨNG VÀO ẤP (10s)' : 'CHƯA CÓ TRỨNG')}
            </button>
          </div>
        </div>
      `;
      if (canStart) {
        incCard.querySelector('#btn-start-incubate').onclick = () => ps.startIncubation();
      }
    } else {
      const pct = Math.min(100, Math.floor((inc.progress / inc.duration) * 100));
      const secLeft = Math.max(0, Math.ceil(inc.duration - inc.progress));
      incCard.innerHTML = `
        <div class="pod-title" style="color:${inc.ready ? '#facc15' : '#38bdf8'}; font-size:13px;">
          ${inc.ready ? '🐣 TRỨNG QUÁI VẬT ĐÃ CHÍN 100% — SẴN SÀNG NỞ PET NGẪU NHIÊN!' : `🧬 ĐANG ẤP TRỨNG TRONG PHÒNG LAB (${pct}% — Còn ${secLeft}s)...`}
        </div>
        <div class="pod-progress-bar" style="margin:8px 0;">
          <div class="pod-progress-fill" style="width:${pct}%; background:${inc.ready ? 'linear-gradient(90deg, #facc15, #22c55e)' : 'linear-gradient(90deg, #ec4899, #38bdf8)'};"></div>
        </div>
        <div class="pod-status">
          ${inc.ready
            ? '✨ Phôi sinh vật đột biến đã hoàn thiện! Bấm nút bên dưới để mở ra 1 trong 5 loài Pet ngẫu nhiên!'
            : '💡 Lồng ấp đang chiếu tia sinh học kích thích phôi trứng phát triển...'}
        </div>
        <div class="pod-actions" style="margin-top:8px; display:flex; gap:10px; flex-wrap:wrap;">
          ${inc.ready
            ? `<button class="harvest-btn" id="btn-hatch-egg" ${inLab ? '' : 'disabled'} style="background:#eab308; color:#000; font-weight:900; padding:8px 16px;">
                 ${inLab ? '🐣 MỞ TRỨNG — NHẬN PET NGẪU NHIÊN!' : '🚫 HÃY ĐỨNG TRONG PHÒNG LAB ĐỂ MỞ TRỨNG'}
               </button>`
            : `<button class="seed-btn" id="btn-boost-egg" ${inLab ? '' : 'disabled'} style="border-color:#38bdf8; color:#38bdf8; font-weight:800;">
                 ⚡ KÍCH NỞ TỨC THÌ (TRONG LAB)
               </button>`
          }
        </div>
      `;
      const hatchBtn = incCard.querySelector('#btn-hatch-egg');
      if (hatchBtn && inLab) {
        hatchBtn.onclick = () => ps.hatchEgg();
      }
      const boostBtn = incCard.querySelector('#btn-boost-egg');
      if (boostBtn && inLab) {
        boostBtn.onclick = () => ps.boostIncubation();
      }
    }
    container.appendChild(incCard);

    // 3. Currently Equipped Active Pet Section (Strictly 1 Pet Max)
    const activeHeader = document.createElement('div');
    activeHeader.style.cssText = 'margin: 12px 0 6px 0; padding: 6px 10px; background: rgba(16, 185, 129, 0.16); border-left: 3px solid #10b981; color: #4ade80; font-weight: 800; font-size: 12px; display:flex; justify-content:space-between; align-items:center;';
    activeHeader.innerHTML = `
      <span>🐾 THÚ CƯNG ĐANG MANG BÊN NGƯỜI (GIỚI HẠN: ${ps.activePet ? '1 / 1' : '0 / 1'} PET)</span>
      <span style="font-size:10px; color:#fde047;">★ Chỉ được mang theo tối đa 1 Pet bên người</span>
    `;
    container.appendChild(activeHeader);

    const activeCard = document.createElement('div');
    activeCard.className = 'recipe-card';
    const activeSpec = ps.getActiveSpecies();

    if (activeSpec) {
      const iconUrl = window.pixelArt ? window.pixelArt.getDataURL(`icon_${activeSpec.icon}`) : '';
      activeCard.style.borderColor = activeSpec.color;
      activeCard.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; flex:1;">
          ${iconUrl ? `<img src="${iconUrl}" style="width:46px;height:46px;image-rendering:pixelated;border:2px solid ${activeSpec.color};border-radius:8px;background:#0f172a;padding:3px;">` : ''}
          <div class="recipe-info">
            <div class="recipe-name" style="color:${activeSpec.color}; font-size:14px;">
              ${activeSpec.badgeIcon} ${activeSpec.name} <span style="font-size:11px; color:#86efac;">[ĐANG ĐI THEO BẠN — 1/1]</span>
            </div>
            <div style="font-size:11px; font-weight:700; color:#e2e8f0;">Vai trò: ${activeSpec.role}</div>
            <div class="recipe-desc">${activeSpec.desc}</div>
            <div class="recipe-ingredients">
              <span class="recipe-req req-met">❤️ +${activeSpec.statsBonus.hp || 0} Max HP</span>
              <span class="recipe-req req-met">🛡 +${activeSpec.statsBonus.armor || 0} Giáp</span>
              <span class="recipe-req req-met">☣ +${activeSpec.statsBonus.toxinResist || 0}% Kháng Độc</span>
              <span class="recipe-req req-met">👟 +${activeSpec.statsBonus.speedBonus || 0} Tốc Chạy</span>
            </div>
          </div>
        </div>
        <div class="recipe-action">
          <button class="craft-btn can-craft" id="btn-unequip-pet" style="background:#334155; color:#f8fafc;">
            🏠 CẤT VÀO LAB
          </button>
        </div>
      `;
      activeCard.querySelector('#btn-unequip-pet').onclick = () => ps.unequipActivePet();
    } else {
      activeCard.innerHTML = `
        <div class="recipe-info">
          <div class="recipe-name" style="color:#94a3b8;">🐾 Chưa mang theo Thú Cưng nào (0 / 1 Pet)</div>
          <div class="recipe-desc">Hãy ấp Trứng Quái Vật ở trên hoặc chọn 1 Pet trong Chuồng Lưu Trữ bên dưới để mang theo hỗ trợ chiến đấu!</div>
        </div>
      `;
    }
    container.appendChild(activeCard);

    // 4. Stored Pets in Bio-Lab Sanctuary (Swap with 1-Pet Limit)
    if (ps.storedPets && ps.storedPets.length > 0) {
      const storedHeader = document.createElement('div');
      storedHeader.style.cssText = 'margin: 12px 0 6px 0; padding: 6px 10px; background: rgba(56, 189, 248, 0.14); border-left: 3px solid #38bdf8; color: #38bdf8; font-weight: 800; font-size: 12px;';
      storedHeader.innerHTML = `🏠 CHUỒNG LƯU TRỮ PET TẠI PHÒNG LAB (${ps.storedPets.length} PET DỰ PHÒNG — BẤM ĐỂ ĐỔI MANG THEO)`;
      container.appendChild(storedHeader);

      ps.storedPets.forEach(petObj => {
        const sp = CONSTANTS.PET_SPECIES[petObj.speciesId];
        if (!sp) return;
        const iconUrl = window.pixelArt ? window.pixelArt.getDataURL(`icon_${sp.icon}`) : '';

        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.style.marginBottom = '6px';
        card.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            ${iconUrl ? `<img src="${iconUrl}" style="width:38px;height:38px;image-rendering:pixelated;border:1px solid ${sp.color};border-radius:6px;background:#0f172a;padding:2px;">` : ''}
            <div class="recipe-info">
              <div class="recipe-name" style="color:${sp.color};">${sp.badgeIcon} ${sp.name} <span style="font-size:10px;color:#94a3b8;">(${sp.role})</span></div>
              <div class="recipe-desc">${sp.desc}</div>
            </div>
          </div>
          <div class="recipe-action" style="display:flex; gap:6px;">
            <button class="craft-btn can-craft btn-equip-stored">
              ${ps.activePet ? '🔄 ĐỔI MANG THEO' : '✅ MANG BÊN NGƯỜI'}
            </button>
            <button class="craft-btn btn-release-stored" style="background:#450a0a; color:#fca5a5; border:1px solid #ef4444; padding:6px 8px;" title="Phóng thích Pet nhận lại 1 Dịch Tuyến Trứng">
              ✖
            </button>
          </div>
        `;
        card.querySelector('.btn-equip-stored').onclick = () => ps.equipPet(petObj.uid);
        card.querySelector('.btn-release-stored').onclick = () => ps.releaseStoredPet(petObj.uid);
        container.appendChild(card);
      });
    }

    // 5. Pet Species Encyclopedia (5 Possible Random Outcomes)
    const guideHeader = document.createElement('div');
    guideHeader.style.cssText = 'margin: 14px 0 6px 0; padding: 6px 10px; background: rgba(250, 204, 21, 0.12); border-left: 3px solid #facc15; color: #facc15; font-weight: 800; font-size: 11px;';
    guideHeader.innerHTML = `📖 DANH SÁCH 5 LOÀI PET ĐỘT BIẾN MỞ NGẪU NHIÊN TỪ TRỨNG QUÁI VẬT (TỶ LỆ NGẪU NHIÊN):`;
    container.appendChild(guideHeader);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:8px;';
    Object.values(CONSTANTS.PET_SPECIES).forEach(sp => {
      const item = document.createElement('div');
      item.style.cssText = `background:#090e1a; border:1px solid ${sp.color}55; border-radius:6px; padding:8px; font-size:10px; line-height:1.4;`;
      item.innerHTML = `
        <div style="color:${sp.color}; font-weight:800; font-size:11px;">${sp.badgeIcon} ${sp.name}</div>
        <div style="color:#cbd5e1; font-weight:700; margin:2px 0;">• Hệ: ${sp.role}</div>
        <div style="color:#94a3b8;">${sp.desc}</div>
      `;
      grid.appendChild(item);
    });
    container.appendChild(grid);
  }
}

// Global registry
window.LabSystem = LabSystem;
