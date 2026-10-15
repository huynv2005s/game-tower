// Bio-Lab, Furnace, Workbench & Workshop Interactive Management System
// Includes Bio-Lab & Hydroponics Expansion Upgrades (Lv.1 -> Lv.4 MAX: 3 -> 12 Pods),
// Multi-Tier Wall & Defense Gun Upgrades (Lv.1 -> Lv.3), and Player Gun / Weapon Upgrades (Lv.1 -> Lv.3)

class LabSystem {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.currentTab = 'lab'; // 'lab', 'furnace', 'workbench', 'workshop', 'hydroponics', 'incubator'
    this._lastHydroPercentSum = -1;

    // Bio-Lab Expansion Level (Lv.1: 3 pods -> Lv.2: 6 pods -> Lv.3: 9 pods -> Lv.4: 12 pods)
    this.labLevel = 1;
    this.autoReplant = true;
    this.regenTickTimer = 0;

    // Isolated Hydroponic Growth Pods inside Bio-Lab & Expanded Greenhouse
    this.hydroPods = [
      { id: 0, seedId: null, progress: 0, growthTime: 35, ready: false },
      { id: 1, seedId: null, progress: 0, growthTime: 35, ready: false },
      { id: 2, seedId: null, progress: 0, growthTime: 35, ready: false }
    ];
  }

  getTierConfig(level = this.labLevel) {
    const tiers = CONSTANTS.BIOLAB_TIERS || {};
    return tiers[level] || tiers[1] || {
      level: 1,
      name: 'Phòng Lab Cách Ly Cơ Bản (Lv.1)',
      shortTitle: 'Lab Cấp 1 (3 Lồng Cấy)',
      podCount: 3,
      growthTime: 35,
      harvestYield: 2,
      seedRefundChance: 0.25,
      isolationRadius: 150,
      hpRegenInZone: 0,
      toxinCleanseInZone: 0,
      color: '#10b981'
    };
  }

  syncPodsWithLevel() {
    const tier = this.getTierConfig(this.labLevel);
    const targetPods = tier.podCount || 3;
    const targetGrowth = tier.growthTime || 35;

    while (this.hydroPods.length < targetPods) {
      this.hydroPods.push({
        id: this.hydroPods.length,
        seedId: null,
        progress: 0,
        growthTime: targetGrowth,
        ready: false
      });
    }

    for (let i = 0; i < this.hydroPods.length; i++) {
      const pod = this.hydroPods[i];
      pod.id = i;
      pod.growthTime = targetGrowth;
      if (pod.seedId && pod.progress >= pod.growthTime) {
        pod.progress = pod.growthTime;
        pod.ready = true;
      }
    }

    // Update Bio-Lab structure isolationRadius on World Map
    if (this.game && this.game.world && this.game.world.structures) {
      for (let s of this.game.world.structures) {
        if (s.type === 'biolab') {
          s.isolationRadius = tier.isolationRadius || 150;
          s.level = this.labLevel;
        }
      }
    }
  }

  upgradeBioLab() {
    if (this.labLevel >= 4) {
      if (this.game && this.game.saveManager) {
        this.game.saveManager.showSaveToast('★ Phòng Lab & Nhà Kính đã đạt Cấp 4 Tối Đa (12 Lồng Cấy)! ★');
      }
      return false;
    }

    const nextLv = this.labLevel + 1;
    const nextTier = this.getTierConfig(nextLv);
    if (!nextTier || !nextTier.cost) return false;

    for (let req of nextTier.cost) {
      if (this.getItemCountInInventory(req.id) < req.count) {
        const msg = '⚠️ THIẾU NGUYÊN LIỆU NÂNG CẤP PHÒNG LAB!';
        if (this.game && this.game.floatingTexts && this.game.player) {
          this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, msg, '#ef4444', 12, 1.2));
        }
        if (this.game && this.game.saveManager) {
          this.game.saveManager.showSaveToast(msg);
        }
        return false;
      }
    }

    // Deduct upgrade materials
    for (let req of nextTier.cost) {
      let needed = req.count;
      for (let i = 0; i < this.game.inventory.slotCount; i++) {
        const slot = this.game.inventory.slots[i];
        if (slot && slot.id === req.id) {
          const take = Math.min(slot.count, needed);
          slot.count -= take;
          needed -= take;
          if (slot.count <= 0) this.game.inventory.slots[i] = null;
          if (needed <= 0) break;
        }
      }
    }

    this.labLevel = nextLv;
    this.syncPodsWithLevel();

    // Grant starter bonus seeds for newly expanded greenhouse pods!
    if (Array.isArray(nextTier.bonusSeeds) && this.game && this.game.inventory) {
      for (let b of nextTier.bonusSeeds) {
        this.game.inventory.addItem(b.id, b.count);
      }
    }

    if (window.audioManager) window.audioManager.playEquip();

    if (this.game && this.game.player) {
      const p = this.game.player;
      const msg = `🌱 ĐÃ NÂNG CẤP: ${nextTier.name.toUpperCase()} (${nextTier.podCount} LỒNG CẤY | THU HOẠCH X${nextTier.harvestYield})!`;
      if (this.game.floatingTexts) {
        this.game.floatingTexts.push(new FloatingText(p.x, p.y - 38, msg, nextTier.color || '#22c55e', 14, 2.5));
      }
      if (this.game.saveManager) {
        this.game.saveManager.showSaveToast(msg);
      }
      if (this.game.particles) {
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          const spd = 45 + Math.random() * 75;
          this.game.particles.push(new Particle(p.x, p.y, Math.cos(a) * spd, Math.sin(a) * spd, nextTier.color || '#4ade80', 4, 0.5));
        }
      }
    }

    if (this.game && this.game.buildMinimapCache) {
      this.game.buildMinimapCache();
    }
    if (this.game && this.game.inventory && this.game.inventory.isOpen) {
      this.game.inventory.renderUI();
    }
    if (this.game && this.game.updateHUD) {
      this.game.updateHUD(true);
    }

    this._lastHydroPercentSum = -999;
    this.switchTab(this.currentTab);
    return true;
  }

  update(dt) {
    const tier = this.getTierConfig(this.labLevel);
    if (this.hydroPods.length < (tier.podCount || 3)) {
      this.syncPodsWithLevel();
    }

    const isAcidRain = this.game && this.game.dayNight && this.game.dayNight.currentWeather === 'ACID_RAIN';
    const growthDt = isAcidRain ? (dt * 1.4) : dt;

    let percentSum = 0;
    for (let pod of this.hydroPods) {
      if (pod.seedId && !pod.ready) {
        pod.progress += growthDt;
        if (pod.progress >= pod.growthTime) {
          pod.progress = pod.growthTime;
          pod.ready = true;
        }
      }
      percentSum += pod.seedId ? Math.floor((pod.progress / pod.growthTime) * 100) : -1;
    }

    // Passive Bio-Lab Sanctuary Aura (Lv.2+ heals HP & cleanses Toxin when standing inside Bio-Lab Zone)
    if ((tier.hpRegenInZone > 0 || tier.toxinCleanseInZone > 0) && this.game && this.game.player && !this.game.player.isDead && this.game.world) {
      this.regenTickTimer += dt;
      if (this.regenTickTimer >= 1.0) {
        this.regenTickTimer -= 1.0;
        const p = this.game.player;
        if (this.game.world.isInsideIsolation(p.x, p.y)) {
          if (tier.hpRegenInZone > 0 && p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + tier.hpRegenInZone);
          }
          if (tier.toxinCleanseInZone > 0 && p.infection > 0) {
            p.infection = Math.max(0, p.infection - tier.toxinCleanseInZone);
          }
        }
      }
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
      this.prependBioLabUpgradeCard('lab-recipe-list');
    } else if (tab === 'furnace') {
      this.renderRecipesTab('FURNACE', 'furnace-recipe-list', 'NUNG NGUYÊN LIỆU');
    } else if (tab === 'workbench') {
      this.renderRecipesTab('WORKBENCH', 'workbench-recipe-list', 'CHẾ TẠO');
      this.appendDefenseUpgradeCards('workbench-recipe-list', ['wall', 'trap']);
    } else if (tab === 'workshop') {
      this.renderRecipesTab('WORKSHOP', 'workshop-recipe-list', 'LẮP RÁP');
      this.appendDroneUpgradeCard('workshop-recipe-list', true);
      this.appendDefenseUpgradeCards('workshop-recipe-list', ['wall', 'turret', 'mortar', 'trap']);
      this.appendWeaponUpgradeCards('workshop-recipe-list');
    } else if (tab === 'hydroponics') {
      this._lastHydroPercentSum = -999;
      this.renderHydroponicsTab();
    } else if (tab === 'incubator') {
      this.renderIncubatorTab();
      this.appendDroneUpgradeCard('incubator-content', false);
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

  // Render Autonomous Support Drone Craft & Upgrade Card (Lv.1 -> Lv.3 MAX)
  appendDroneUpgradeCard(containerId, prepend = false) {
    const container = document.getElementById(containerId);
    if (!container || !this.game || !this.game.petSystem || !CONSTANTS.DRONE_TIERS) return;

    const ps = this.game.petSystem;
    const curLv = ps.droneLevel || 0;
    const curCfg = ps.getDroneTierConfig(curLv);
    const isMax = curLv >= 3;
    const nextLv = isMax ? 3 : (curLv + 1);
    const nextCfg = CONSTANTS.DRONE_TIERS[nextLv];

    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '10px';

    const header = document.createElement('div');
    header.style.cssText = 'margin: 6px 0; padding: 6px 10px; background: rgba(56, 189, 248, 0.16); border-left: 3px solid #38bdf8; color: #38bdf8; font-weight: 800; font-size: 12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;';
    header.innerHTML = `
      <span>🤖 HỆ THỐNG DRONE AI TỰ ĐỘNG NHẶT ĐỒ & SỬA TƯỜNG (${curLv > 0 ? `LV.${curLv}/3 — ${curCfg.droneCount} DRONE` : 'CHƯA CHẾ TẠO'})</span>
      ${curLv > 0 ? `
        <button class="craft-btn can-craft btn-toggle-drone-mode" style="padding:3px 10px; font-size:10px; background:#0284c7; color:#fff;">
          ${ps.droneMode === 'follow' ? '🔄 Chế độ: BAY THEO NGƯỜI (Bấm đổi sang Tuần Tra Căn Cứ)' : '🏰 Chế độ: TUẦN TRA CĂN CỨ (Bấm đổi sang Bay Theo Người)'}
        </button>
      ` : `<span style="font-size:10px; color:#fde047;">★ Tự động khai thác tài nguyên & hàn sửa Tường/Tháp ban đêm</span>`}
    `;
    const modeBtn = header.querySelector('.btn-toggle-drone-mode');
    if (modeBtn) {
      modeBtn.onclick = () => ps.toggleDroneMode();
    }
    wrapper.appendChild(header);

    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.style.borderColor = isMax ? '#facc15' : (nextCfg ? nextCfg.color : '#38bdf8');

    if (isMax && curCfg) {
      card.innerHTML = `
        <div class="recipe-info">
          <div class="recipe-name" style="color:#facc15;">🤖🤖⚡ ${curCfg.name} [ĐÃ ĐẠT CẤP TỐI ĐA]</div>
          <div class="recipe-desc">${curCfg.desc}</div>
          <div class="recipe-ingredients">
            <span class="recipe-req req-met">🛸 Số lượng: ${curCfg.droneCount} Drone</span>
            <span class="recipe-req req-met">📡 Bán kính quét: ${curCfg.scanRadius}px</span>
            <span class="recipe-req req-met">🔧 Sửa công trình: +${curCfg.repairPerSec} HP/s</span>
            <span class="recipe-req req-met">🔫 Laser: ${curCfg.laserDamage} DMG</span>
            <span class="recipe-req req-met">🛡 +${curCfg.armorBonus} Giáp</span>
          </div>
        </div>
        <div class="recipe-action">
          <button class="craft-btn disabled" disabled>★ MAX LV.3</button>
        </div>
      `;
    } else if (nextCfg) {
      let canAfford = true;
      const reqHtml = nextCfg.cost.map(req => {
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
          <div class="recipe-name" style="color:${nextCfg.color};">
            🤖 ${curLv === 0 ? `Chế Tạo Mới: ${nextCfg.name}` : `Nâng Cấp Drone (Lv.${curLv} ➔ Lv.${nextLv}): ${nextCfg.name}`}
          </div>
          <div class="recipe-desc">${nextCfg.desc}</div>
          <div class="recipe-ingredients">${reqHtml}</div>
        </div>
        <div class="recipe-action">
          <button class="craft-btn ${canAfford ? 'can-craft' : 'disabled'}" ${canAfford ? '' : 'disabled'} id="btn-craft-upgrade-drone">
            ${curLv === 0 ? '🤖 LẮP RÁP DRONE' : `⬆ NÂNG DRONE LV.${nextLv}`}
          </button>
        </div>
      `;
      const actBtn = card.querySelector('#btn-craft-upgrade-drone');
      if (actBtn && canAfford) {
        actBtn.onclick = () => ps.craftOrUpgradeDrone();
      }
    }

    wrapper.appendChild(card);
    if (prepend && container.firstChild) {
      container.insertBefore(wrapper, container.firstChild);
    } else {
      container.appendChild(wrapper);
    }
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
    } else if (Array.isArray(recipe.outputs) && recipe.outputs.length > 0) {
      for (const outItem of recipe.outputs) {
        this.game.inventory.addItem(outItem.id, outItem.count);
      }
    } else {
      this.game.inventory.addItem(recipe.output.id, recipe.output.count);
    }

    window.audioManager.playEquip();
    if (Array.isArray(recipe.outputs) && recipe.outputs.length > 0) {
      const summary = recipe.outputs
        .map(o => `+${o.count} ${(CONSTANTS.ITEM_TYPES[o.id] && CONSTANTS.ITEM_TYPES[o.id].name) || o.id}`)
        .join(', ');
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, `🧪 CHIẾT XUẤT: ${summary}!`, '#38bdf8', 12, 1.3));
    } else {
      const outDef = CONSTANTS.ITEM_TYPES[recipe.output.id];
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, `ĐÃ HOÀN TẤT: +${recipe.output.count} ${outDef.name}!`, '#38bdf8', 13, 1.2));
    }

    if (this.game.inventory.isOpen) {
      this.game.inventory.renderUI();
    }
    this.switchTab(this.currentTab);
  }

  buildBioLabUpgradeCardElement(includeHydroShortcut = false) {
    const curTier = this.getTierConfig(this.labLevel);
    const isMax = this.labLevel >= 4;
    const nextTier = !isMax ? this.getTierConfig(this.labLevel + 1) : null;

    const wrapper = document.createElement('div');
    wrapper.className = 'biolab-upgrade-banner';
    wrapper.style.cssText = `
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.38) 0%, rgba(15, 23, 42, 0.95) 100%);
      border: 2px solid ${curTier.color || '#10b981'};
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 12px;
      box-shadow: 0 0 18px rgba(16, 185, 129, 0.22);
    `;

    let actionAreaHtml = '';
    let reqListHtml = '';
    let canUpgrade = false;

    if (isMax) {
      actionAreaHtml = `
        <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
          <button class="craft-btn disabled" disabled style="background:#713f12; color:#fde047; border:1px solid #facc15; opacity:1;">
            ★ ĐÃ ĐẠT CẤP TỐI ĐA (LV.4 MAX)
          </button>
          ${includeHydroShortcut ? `<button class="craft-btn can-craft" style="font-size:11px; padding:6px 12px; background:#0284c7;" onclick="window.labSystem.switchTab('hydroponics')">🌱 MỞ NÔNG TRẠI 12 LỒNG CẤY</button>` : ''}
        </div>
      `;
    } else if (nextTier) {
      canUpgrade = true;
      reqListHtml = nextTier.cost.map(req => {
        const has = this.getItemCountInInventory(req.id);
        const enough = has >= req.count;
        if (!enough) canUpgrade = false;
        const def = CONSTANTS.ITEM_TYPES[req.id];
        return `
          <div class="recipe-req ${enough ? 'req-met' : 'req-missing'}">
            <span>${def ? def.name : req.name}:</span>
            <span>${has} / ${req.count}</span>
          </div>
        `;
      }).join('');

      actionAreaHtml = `
        <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end; min-width:185px;">
          <button class="craft-btn ${canUpgrade ? 'can-craft' : 'disabled'} btn-do-upgrade-lab" ${canUpgrade ? '' : 'disabled'} style="width:100%; font-size:11px; padding:9px 14px; ${canUpgrade ? 'background:linear-gradient(90deg, #059669, #0284c7); border:1px solid #38bdf8;' : ''}">
            ⬆ NÂNG CẤP LAB LV.${nextTier.level} (${nextTier.podCount} LỒNG)
          </button>
          ${includeHydroShortcut ? `<button class="seed-btn" style="width:100%; font-size:10px; border-color:#10b981; color:#a7f3d0;" onclick="window.labSystem.switchTab('hydroponics')">🌱 Vào Khu Trồng Cây (${curTier.podCount} Lồng)</button>` : ''}
        </div>
      `;
    }

    wrapper.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap;">
        <div style="flex:1; min-width:260px;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="background:${curTier.color}; color:#090d16; font-weight:900; font-size:10px; padding:2px 7px; border-radius:4px;">
              CẤP ${this.labLevel} / 4
            </span>
            <span style="font-weight:800; font-size:13px; color:${curTier.color}; letter-spacing:0.4px;">
              🏡 ${curTier.name}
            </span>
          </div>
          <div style="font-size:11px; color:#cbd5e1; margin-top:5px; line-height:1.45;">
            • <strong>Quy mô hiện tại:</strong> <span style="color:#4ade80; font-weight:800;">${curTier.podCount} Lồng Cấy</span> &nbsp;|&nbsp;
            <strong>Tốc độ lớn:</strong> <span style="color:#38bdf8; font-weight:800;">${curTier.growthTime}s/vụ</span> &nbsp;|&nbsp;
            <strong>Sản lượng:</strong> <span style="color:#facc15; font-weight:800;">x${curTier.harvestYield} cây/lồng</span> &nbsp;|&nbsp;
            <strong>Hoàn hạt:</strong> <span style="color:#e879f9; font-weight:800;">${Math.round(curTier.seedRefundChance * 100)}%</span>
          </div>
          ${!isMax && nextTier ? `
            <div style="margin-top:6px; padding:6px 9px; background:rgba(56, 189, 248, 0.12); border-left:3px solid ${nextTier.color}; border-radius:4px; font-size:11px; color:#e2e8f0;">
              🚀 <strong>Mở rộng lên Cấp ${nextTier.level} (${nextTier.name}):</strong>
              Tăng quy mô lên <strong style="color:#4ade80;">${nextTier.podCount} Lồng Cấy</strong>, chín nhanh <strong style="color:#38bdf8;">${nextTier.growthTime}s</strong>, thu hoạch <strong style="color:#facc15;">x${nextTier.harvestYield} cây/lồng</strong>, bán kính cách ly <strong style="color:#a7f3d0;">${nextTier.isolationRadius}px</strong> (Hồi +${nextTier.hpRegenInZone} HP/s) + 🎁 <em>Tặng kèm gói hạt giống mới!</em>
            </div>
            <div class="recipe-ingredients" style="margin-top:6px;">${reqListHtml}</div>
          ` : `
            <div style="margin-top:5px; font-size:11px; color:#fde047;">
              ✨ Phòng Lab đã mở rộng quy mô tối đa: 12 Lồng Cấy Sinh Quyển, thu hoạch x6 cây/lồng, hoàn trả 100% hạt giống và hồi +5 HP/s trong vùng cách ly!
            </div>
          `}
        </div>
        ${actionAreaHtml}
      </div>
    `;

    const upgBtn = wrapper.querySelector('.btn-do-upgrade-lab');
    if (upgBtn && canUpgrade) {
      upgBtn.onclick = () => this.upgradeBioLab();
    }
    return wrapper;
  }

  prependBioLabUpgradeCard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const card = this.buildBioLabUpgradeCardElement(true);
    container.insertBefore(card, container.firstChild);
  }

  renderHydroponicsTab() {
    const container = document.getElementById('hydroponics-pods');
    if (!container) return;
    this.syncPodsWithLevel();
    container.innerHTML = '';

    const curTier = this.getTierConfig(this.labLevel);

    // 1. Bio-Lab Expansion & Upgrade Card at Top
    container.appendChild(this.buildBioLabUpgradeCardElement(false));

    // 2. Seed Bank, Quick Extractor & Mass Farming Toolbar
    const seedTypes = [
      { seedId: 'seed_snow_lotus', cropId: 'snow_lotus', shortName: 'Tuyết Liên', icon: '🪷', color: '#e879f9' },
      { seedId: 'seed_silver_moss', cropId: 'silver_moss', shortName: 'Rêu Bạc', icon: '🌿', color: '#4ade80' },
      { seedId: 'seed_wild_berry', cropId: 'wild_berry', shortName: 'Quả Mọng', icon: '🍓', color: '#fb7185' },
      { seedId: 'seed_quartz_bloom', cropId: 'quartz_crystal', shortName: 'Thạch Anh', icon: '💎', color: '#38bdf8' }
    ];

    const emptyCount = this.hydroPods.filter(p => !p.seedId).length;
    const readyCount = this.hydroPods.filter(p => p.seedId && p.ready).length;
    const growingCount = this.hydroPods.filter(p => p.seedId && !p.ready).length;
    const waterCount = this.getItemCountInInventory('pure_water');

    const toolbar = document.createElement('div');
    toolbar.className = 'hydro-mass-toolbar';
    toolbar.style.cssText = 'background:#090e1a; border:1px solid #1e293b; border-radius:8px; padding:10px 12px; margin-bottom:12px; display:flex; flex-direction:column; gap:8px;';

    const seedBankHtml = seedTypes.map(st => {
      const sCount = this.getItemCountInInventory(st.seedId);
      const cCount = this.getItemCountInInventory(st.cropId);
      const canPlantAll = emptyCount > 0 && (sCount > 0 || cCount > 0);
      return `
        <div style="background:#111827; border:1px solid ${st.color}55; border-radius:6px; padding:6px 8px; display:flex; align-items:center; justify-content:space-between; gap:6px; flex:1; min-width:155px;">
          <div style="font-size:11px; line-height:1.3;">
            <div style="color:${st.color}; font-weight:800;">${st.icon} ${st.shortName}</div>
            <div style="font-size:10px; color:#94a3b8;">Giống: <strong style="color:#f8fafc;">${sCount}</strong> | Cây: <strong style="color:#cbd5e1;">${cCount}</strong></div>
          </div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <button class="seed-btn" style="padding:3px 7px; font-size:9px; border-color:${st.color}; color:${st.color};"
              ${canPlantAll ? '' : 'disabled'}
              onclick="window.labSystem.plantAllPods('${st.seedId}')"
              title="Gieo đồng loạt ${st.shortName} vào tất cả lồng trống">
              🌾 Gieo Hết
            </button>
            <button class="seed-btn" style="padding:2px 6px; font-size:9px; color:#cbd5e1;"
              ${cCount > 0 ? '' : 'disabled'}
              onclick="window.labSystem.quickExtractSeed('${st.seedId}')"
              title="Tách 1 ${st.shortName} thành +2 Hạt Giống ngay tại Lab">
              🧬 +2 Giống
            </button>
          </div>
        </div>
      `;
    }).join('');

    toolbar.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="font-size:11px; font-weight:800; color:#a7f3d0;">
          🌱 ĐIỀU KHIỂN NÔNG TRẠI QUY MÔ LỚN (${this.hydroPods.length} LỒNG: ${readyCount} Chín | ${growingCount} Đang lớn | ${emptyCount} Trống)
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="harvest-btn" style="padding:5px 12px; font-size:11px; ${readyCount > 0 ? 'background:#10b981;' : 'background:#1f2937; color:#64748b; box-shadow:none; animation:none; cursor:default;'}"
            ${readyCount > 0 ? '' : 'disabled'}
            onclick="window.labSystem.harvestAllPods()">
            🎉 THU HOẠCH TẤT CẢ (${readyCount} LỒNG ➔ +${readyCount * curTier.harvestYield} CÂY)
          </button>
          <button class="seed-btn" style="padding:5px 10px; font-size:10px; border-color:#38bdf8; color:#38bdf8;"
            ${growingCount > 0 && waterCount > 0 ? '' : 'disabled'}
            onclick="window.labSystem.irrigateAllPods()"
            title="Dùng 1 Nước Tinh Khiết tưới phun sương thúc đẩy +50% tiến độ toàn bộ lồng đang trồng">
            💧 TƯỚI TĂNG TỐC +50% (Nước: ${waterCount})
          </button>
          <button class="seed-btn" style="padding:5px 10px; font-size:10px; border-color:${this.autoReplant ? '#4ade80' : '#64748b'}; color:${this.autoReplant ? '#4ade80' : '#94a3b8'};"
            onclick="window.labSystem.toggleAutoReplant()">
            🔄 Tự Gieo Lại: ${this.autoReplant ? 'BẬT' : 'TẮT'}
          </button>
        </div>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${seedBankHtml}
      </div>
    `;
    container.appendChild(toolbar);

    // 3. Multi-Column Grid of Hydroponic Growth Pods (3 -> 6 -> 9 -> 12 Pods)
    const gridEl = document.createElement('div');
    gridEl.className = 'hydro-pods-grid';

    this.hydroPods.forEach((pod, idx) => {
      const podEl = document.createElement('div');
      podEl.className = 'hydro-pod';
      if (pod.ready) {
        podEl.style.borderColor = '#10b981';
        podEl.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.25)';
      }

      const zoneTag = idx < 3
        ? 'Lồng Nội Khu'
        : (idx < 6 ? 'Nhà Kính Cánh Tây' : (idx < 9 ? 'Nhà Kính Cánh Đông' : 'Khu Sinh Quyển Nam'));

      if (!pod.seedId) {
        const plantBtns = seedTypes.map(st => {
          const sCnt = this.getItemCountInInventory(st.seedId);
          const cCnt = this.getItemCountInInventory(st.cropId);
          const avail = sCnt > 0 || cCnt > 0;
          return `
            <button class="seed-btn" style="padding:4px 7px; font-size:10px; border-color:${avail ? st.color + '88' : '#334155'}; color:${avail ? '#f8fafc' : '#64748b'};"
              onclick="window.labSystem.plantSeed(${idx}, '${st.seedId}')"
              title="${sCnt > 0 ? `Cấy 1 ${st.shortName} (Còn ${sCnt} hạt)` : (cCnt > 0 ? `Tự động tách 1 ${st.shortName} để cấy ngay` : 'Chưa có giống hoặc cây mẫu')}">
              ${st.icon} ${st.shortName} (${sCnt > 0 ? sCnt : (cCnt > 0 ? 'Tách' : 0)})
            </button>
          `;
        }).join('');

        podEl.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="pod-title">🌱 LỒNG #${idx + 1}: TRỐNG</div>
            <span style="font-size:9px; color:#64748b; background:#111827; padding:1px 6px; border-radius:4px;">${zoneTag}</span>
          </div>
          <div class="pod-status" style="font-size:10px;">Vô trùng 100% — Thu hoạch <strong>x${curTier.harvestYield} cây</strong> sau <strong>${curTier.growthTime}s</strong>:</div>
          <div class="pod-actions" style="flex-wrap:wrap; gap:5px;">
            ${plantBtns}
          </div>
        `;
      } else {
        const seedDef = CONSTANTS.ITEM_TYPES[pod.seedId];
        const cropDef = seedDef && seedDef.targetCrop ? CONSTANTS.ITEM_TYPES[seedDef.targetCrop] : null;
        const percent = Math.min(100, Math.floor((pod.progress / pod.growthTime) * 100));
        const secLeft = Math.max(0, Math.ceil(pod.growthTime - pod.progress));
        const iconUrl = (window.pixelArt && cropDef) ? window.pixelArt.getDataURL(`icon_${cropDef.icon}`) : '';

        podEl.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              ${iconUrl ? `<img src="${iconUrl}" style="width:28px;height:28px;image-rendering:pixelated;border-radius:4px;background:#111827;padding:2px;border:1px solid #334155;">` : ''}
              <div>
                <div class="pod-title" style="color:${pod.ready ? '#fde047' : '#38bdf8'};">
                  ${pod.ready ? '✨' : '🧪'} LỒNG #${idx + 1}: ${cropDef ? cropDef.name : (seedDef ? seedDef.name : '')}
                </div>
                <div style="font-size:9px; color:#94a3b8;">${zoneTag} • Sản lượng: <strong style="color:#4ade80;">x${curTier.harvestYield}</strong></div>
              </div>
            </div>
            <span style="font-family:monospace; font-size:11px; font-weight:800; color:${pod.ready ? '#4ade80' : '#7dd3fc'};">
              ${pod.ready ? 'CHÍN 100%' : `${secLeft}s`}
            </span>
          </div>
          <div class="pod-progress-bar">
            <div class="pod-progress-fill" style="width: ${percent}%; background:${pod.ready ? 'linear-gradient(90deg, #facc15, #10b981)' : 'linear-gradient(90deg, #0284c7, #34d399)'};"></div>
          </div>
          <div class="pod-actions" style="justify-content:space-between; align-items:center;">
            <span style="font-size:10px; color:${pod.ready ? '#86efac' : '#94a3b8'};">
              ${pod.ready ? `Sẵn sàng thu hoạch +${curTier.harvestYield} cây sạch!` : `Đang quang hợp sinh học (${percent}%)...`}
            </span>
            ${pod.ready ? 
              `<button class="harvest-btn" style="padding:5px 12px; font-size:10px;" onclick="window.labSystem.harvestPod(${idx})">🎉 THU HOẠCH (x${curTier.harvestYield})</button>` : 
              `<button class="seed-btn disabled" style="padding:4px 8px; font-size:10px;" disabled>Đang lớn...</button>`
            }
          </div>
        `;
      }

      gridEl.appendChild(podEl);
    });

    container.appendChild(gridEl);
  }

  // Ensure player has at least 1 seed of seedId (or automatically extracts 2 seeds from 1 raw crop!)
  ensureSeedAvailable(seedId, silent = false) {
    if (this.getItemCountInInventory(seedId) >= 1) return true;

    const seedDef = CONSTANTS.ITEM_TYPES[seedId];
    if (!seedDef || !seedDef.targetCrop) return false;
    const cropId = seedDef.targetCrop;

    // Auto-extract 1 raw crop into 2 seeds if player has the raw crop in inventory!
    if (this.getItemCountInInventory(cropId) >= 1) {
      const cropSlot = this.game.inventory.slots.findIndex(s => s && s.id === cropId);
      if (cropSlot !== -1) {
        this.game.inventory.removeItem(cropSlot, 1);
        this.game.inventory.addItem(seedId, 2);
        if (!silent && this.game && this.game.floatingTexts && this.game.player) {
          const cropDef = CONSTANTS.ITEM_TYPES[cropId];
          this.game.floatingTexts.push(new FloatingText(
            this.game.player.x, this.game.player.y - 36,
            `🧬 TỰ ĐỘNG TÁCH 1 ${cropDef ? cropDef.name : cropId} ➔ +2 HẠT GIỐNG!`,
            '#a855f7', 11, 1.1
          ));
        }
        return true;
      }
    }
    return false;
  }

  quickExtractSeed(seedId) {
    const seedDef = CONSTANTS.ITEM_TYPES[seedId];
    if (!seedDef || !seedDef.targetCrop) return false;
    const cropId = seedDef.targetCrop;
    const cropDef = CONSTANTS.ITEM_TYPES[cropId];

    if (this.getItemCountInInventory(cropId) < 1) {
      const msg = `⚠️ Cần ít nhất 1 ${cropDef ? cropDef.name : cropId} trong kho để tách hạt giống!`;
      if (this.game && this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    const slotIdx = this.game.inventory.slots.findIndex(s => s && s.id === cropId);
    if (slotIdx === -1) return false;
    this.game.inventory.removeItem(slotIdx, 1);
    this.game.inventory.addItem(seedId, 2);

    if (window.audioManager) window.audioManager.playEquip();
    const msg = `🧬 ĐÃ TÁCH CHIẾT: +2 ${seedDef.name}!`;
    if (this.game && this.game.floatingTexts && this.game.player) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 28, msg, '#22c55e', 12, 1.1));
    }
    this._lastHydroPercentSum = -999;
    this.renderHydroponicsTab();
    return true;
  }

  plantSeed(podIndex, seedId, silent = false) {
    this.syncPodsWithLevel();
    const pod = this.hydroPods[podIndex];
    if (!pod || pod.seedId) return false;

    if (!this.ensureSeedAvailable(seedId, silent)) {
      if (!silent && this.game && this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'BẠN CHƯA CÓ HẠT GIỐNG HOẶC CÂY MẪU NÀY!', '#ef4444', 12, 1.0));
      }
      return false;
    }

    const slotIdx = this.game.inventory.slots.findIndex(s => s && s.id === seedId);
    if (slotIdx === -1) return false;
    this.game.inventory.removeItem(slotIdx, 1);

    const tier = this.getTierConfig(this.labLevel);
    pod.seedId = seedId;
    pod.progress = 0;
    pod.growthTime = tier.growthTime || 35;
    pod.ready = false;

    if (!silent) {
      if (window.audioManager) window.audioManager.playEquip();
      if (this.game && this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, `🌱 ĐÃ GIEO GIỐNG VÀO LỒNG #${podIndex + 1}!`, '#22c55e', 12, 1.0));
      }
      this._lastHydroPercentSum = -999;
      this.renderHydroponicsTab();
    }
    return true;
  }

  plantAllPods(seedId) {
    this.syncPodsWithLevel();
    let plantedCount = 0;
    for (let i = 0; i < this.hydroPods.length; i++) {
      if (!this.hydroPods[i].seedId) {
        if (this.plantSeed(i, seedId, true)) {
          plantedCount++;
        } else {
          break;
        }
      }
    }

    if (plantedCount > 0) {
      if (window.audioManager) window.audioManager.playEquip();
      const seedDef = CONSTANTS.ITEM_TYPES[seedId];
      const msg = `🌾 ĐÃ GIEO ĐỒNG LOẠT ${plantedCount} LỒNG: ${seedDef ? seedDef.name : seedId}!`;
      if (this.game && this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, msg, '#4ade80', 13, 1.4));
      }
      if (this.game && this.game.saveManager) {
        this.game.saveManager.showSaveToast(msg);
      }
      this._lastHydroPercentSum = -999;
      this.renderHydroponicsTab();
    } else {
      const msg = '⚠️ Không còn lồng trống hoặc đã hết hạt giống/cây mẫu!';
      if (this.game && this.game.saveManager) this.game.saveManager.showSaveToast(msg);
    }
    return plantedCount;
  }

  harvestPod(podIndex, silent = false) {
    const pod = this.hydroPods[podIndex];
    if (!pod || !pod.ready) return false;

    const prevSeedId = pod.seedId;
    const seedDef = CONSTANTS.ITEM_TYPES[prevSeedId];
    if (!seedDef) return false;
    const cropId = seedDef.targetCrop;
    const cropDef = CONSTANTS.ITEM_TYPES[cropId];

    const tier = this.getTierConfig(this.labLevel);
    const yieldCount = tier.harvestYield || 2;
    this.game.inventory.addItem(cropId, yieldCount);

    // Roll for bonus seed refund from upgraded Bio-Lab
    let refundedSeed = false;
    if (Math.random() < (tier.seedRefundChance || 0.25)) {
      this.game.inventory.addItem(prevSeedId, 1);
      refundedSeed = true;
    }

    pod.seedId = null;
    pod.progress = 0;
    pod.ready = false;

    // Auto-replant if enabled and seed is available
    let replanted = false;
    if (this.autoReplant && this.getItemCountInInventory(prevSeedId) >= 1) {
      replanted = this.plantSeed(podIndex, prevSeedId, true);
    }

    if (!silent) {
      if (window.audioManager) window.audioManager.playEquip();
      const extraTxt = refundedSeed ? ' (+1 Hạt Giống)' : '';
      const replantTxt = replanted ? ' [Đã tự gieo lại]' : '';
      const msg = `🎉 THU HOẠCH: +${yieldCount} ${cropDef ? cropDef.name : cropId}${extraTxt}${replantTxt}!`;
      if (this.game && this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, msg, '#38bdf8', 13, 1.4));
      }
      this._lastHydroPercentSum = -999;
      this.renderHydroponicsTab();
    }
    return { cropId, yieldCount, refundedSeed, replanted };
  }

  harvestAllPods() {
    this.syncPodsWithLevel();
    let harvestedPods = 0;
    let totalItems = 0;
    for (let i = 0; i < this.hydroPods.length; i++) {
      if (this.hydroPods[i].seedId && this.hydroPods[i].ready) {
        const res = this.harvestPod(i, true);
        if (res) {
          harvestedPods++;
          totalItems += res.yieldCount;
        }
      }
    }

    if (harvestedPods > 0) {
      if (window.audioManager) window.audioManager.playEquip();
      const msg = `🎉 ĐÃ THU HOẠCH TẤT CẢ ${harvestedPods} LỒNG CẤY: TỔNG CỘNG +${totalItems} SẢN PHẨM SẠCH!`;
      if (this.game && this.game.floatingTexts && this.game.player) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 34, msg, '#facc15', 14, 1.8));
      }
      if (this.game && this.game.saveManager) {
        this.game.saveManager.showSaveToast(msg);
      }
      this._lastHydroPercentSum = -999;
      if (this.isOpen && this.currentTab === 'hydroponics') {
        this.renderHydroponicsTab();
      }
    }
    return harvestedPods;
  }

  irrigateAllPods() {
    const growingPods = this.hydroPods.filter(p => p.seedId && !p.ready);
    if (growingPods.length === 0) return false;

    const waterSlot = this.game.inventory.slots.findIndex(s => s && s.id === 'pure_water');
    if (waterSlot === -1) {
      const msg = '⚠️ Cần 1 Nước Tinh Khiết để tưới phun sương tăng tốc!';
      if (this.game && this.game.saveManager) this.game.saveManager.showSaveToast(msg);
      return false;
    }

    this.game.inventory.removeItem(waterSlot, 1);
    for (let pod of growingPods) {
      pod.progress = Math.min(pod.growthTime, pod.progress + pod.growthTime * 0.5);
      if (pod.progress >= pod.growthTime) {
        pod.progress = pod.growthTime;
        pod.ready = true;
      }
    }

    if (window.audioManager) window.audioManager.playEquip();
    const msg = `💧 ĐÃ TƯỚI NƯỚC SINH HỌC: TĂNG +50% TIẾN ĐỘ CHO ${growingPods.length} LỒNG CẤY!`;
    if (this.game && this.game.floatingTexts && this.game.player) {
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, msg, '#38bdf8', 13, 1.5));
    }
    if (this.game && this.game.saveManager) {
      this.game.saveManager.showSaveToast(msg);
    }
    this._lastHydroPercentSum = -999;
    this.renderHydroponicsTab();
    return true;
  }

  toggleAutoReplant() {
    this.autoReplant = !this.autoReplant;
    if (window.audioManager) window.audioManager.playEquip();
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

    // 2.5. Direct Egg Extraction Machine (Crush surplus eggs into Egg Fluid + Alien Chitin + Plasma Core)
    const extractCard = document.createElement('div');
    extractCard.className = 'hydro-pod';
    extractCard.style.borderColor = eggCount > 0 ? '#a855f7' : '#334155';
    extractCard.style.marginTop = '8px';
    extractCard.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div style="flex:1; min-width:220px;">
          <div class="pod-title" style="color:#d8b4fe; font-size:12px;">🧪 MÁY CHIẾT XUẤT TRỨNG DƯ TỨC THÌ (KHÔNG CẦN CHỜ ẤP)</div>
          <div class="pod-status" style="margin-top:2px; font-size:11px; color:#cbd5e1;">
            Nghiền <strong>1 Trứng Quái Vật</strong> nhận ngay:
            <span style="color:#f0abfc; font-weight:700;">+2 Dịch Tuyến Trứng</span> +
            <span style="color:#a78bfa; font-weight:700;">+2 Giáp Xác Ngoại Lai</span> +
            <span style="color:#38bdf8; font-weight:700;">+1 Lõi Plasma</span>
          </div>
        </div>
        <div class="pod-actions" style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="craft-btn ${eggCount > 0 ? 'can-craft' : 'disabled'}" ${eggCount > 0 ? '' : 'disabled'} id="btn-extract-1-egg" style="background:${eggCount > 0 ? '#7e22ce' : ''}; color:#fff;">
            🧪 Chiết Xuất 1 Trứng
          </button>
          ${eggCount > 1 ? `
            <button class="craft-btn can-craft" id="btn-extract-all-eggs" style="background:#581c87; color:#f3e8ff; border:1px solid #c084fc;">
              🧪 Chiết Xuất Hết (${eggCount})
            </button>
          ` : ''}
        </div>
      </div>
    `;
    const btnExt1 = extractCard.querySelector('#btn-extract-1-egg');
    if (btnExt1 && eggCount > 0) {
      btnExt1.onclick = () => ps.extractEggInLab(1);
    }
    const btnExtAll = extractCard.querySelector('#btn-extract-all-eggs');
    if (btnExtAll && eggCount > 1) {
      btnExtAll.onclick = () => ps.extractEggInLab(eggCount);
    }
    container.appendChild(extractCard);

    // 3. Currently Equipped Active Pet Section (Strictly 1 Pet Max + Lv.1 -> Lv.3 Evolution)
    const activeHeader = document.createElement('div');
    activeHeader.style.cssText = 'margin: 12px 0 6px 0; padding: 6px 10px; background: rgba(16, 185, 129, 0.16); border-left: 3px solid #10b981; color: #4ade80; font-weight: 800; font-size: 12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;';
    activeHeader.innerHTML = `
      <span>🐾 THÚ CƯNG ĐANG MANG BÊN NGƯỜI (${ps.activePet ? '1 / 1' : '0 / 1'} PET) — TIẾN HÓA TỐI ĐA LV.3</span>
      <span style="font-size:10px; color:#fde047;">★ Dùng Trứng dư hoặc Pet trùng để Cường Hóa (Lv.1 ➔ Lv.3)</span>
    `;
    container.appendChild(activeHeader);

    const activeCard = document.createElement('div');
    activeCard.className = 'recipe-card';
    const activeSpec = ps.getActiveSpecies();

    if (activeSpec) {
      const iconUrl = window.pixelArt ? window.pixelArt.getDataURL(`icon_${activeSpec.icon}`) : '';
      const curLv = activeSpec.level || 1;
      const isMaxLv = curLv >= 3;
      const eggCost = ps.getUpgradeEggCost(curLv);
      const canUpgradeByEgg = !isMaxLv && eggCount >= eggCost;
      const hasStoredPets = ps.storedPets && ps.storedPets.length > 0;
      const stars = '⭐'.repeat(curLv);

      activeCard.style.borderColor = activeSpec.color;
      activeCard.style.flexDirection = 'column';
      activeCard.style.alignItems = 'stretch';
      activeCard.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:230px;">
            ${iconUrl ? `<img src="${iconUrl}" style="width:48px;height:48px;image-rendering:pixelated;border:2px solid ${activeSpec.color};border-radius:8px;background:#0f172a;padding:3px;">` : ''}
            <div class="recipe-info">
              <div class="recipe-name" style="color:${activeSpec.color}; font-size:14px;">
                ${activeSpec.badgeIcon} ${activeSpec.name}
                <span style="color:#facc15; font-weight:900; margin-left:4px;">${stars} Lv.${curLv}${isMaxLv ? ' (MAX)' : ''}</span>
              </div>
              <div style="font-size:11px; font-weight:700; color:#e2e8f0;">
                Vai trò: ${activeSpec.role} • 🔫 Bắn phụ: <strong style="color:#fde047;">${activeSpec.damage} DMG${curLv >= 3 ? ' (x2 Đạn Đôi)' : ''}</strong>
                ${activeSpec.hpRegenPerSec > 0 ? ` • 💚 Hồi: +${activeSpec.hpRegenPerSec} HP/s` : ''}
                ${activeSpec.toxinCleansePerSec > 0 ? ` • 🧪 Lọc độc: -${activeSpec.toxinCleansePerSec}%/s` : ''}
              </div>
              <div class="recipe-desc">${activeSpec.desc}</div>
              <div class="recipe-ingredients">
                <span class="recipe-req req-met">❤️ +${activeSpec.statsBonus.hp || 0} Max HP</span>
                <span class="recipe-req req-met">🛡 +${activeSpec.statsBonus.armor || 0} Giáp</span>
                <span class="recipe-req req-met">☣ +${activeSpec.statsBonus.toxinResist || 0}% Kháng Độc</span>
                <span class="recipe-req req-met">👟 +${activeSpec.statsBonus.speedBonus || 0} Tốc Chạy</span>
              </div>
            </div>
          </div>
          <div class="recipe-action" style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
            <button class="craft-btn can-craft" id="btn-unequip-pet" style="background:#334155; color:#f8fafc;">
              🏠 CẤT VÀO LAB
            </button>
          </div>
        </div>
        <div style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(148, 163, 184, 0.25); display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
          <div style="font-size:11px; color:#fde047; font-weight:700;">
            ${isMaxLv
              ? '👑 ĐÃ ĐẠT CẤP TIẾN HÓA TỐI ĐA (Lv.3 MAX): Bắn 2 tia đạn song song +220% chỉ số hỗ trợ!'
              : `⬆️ Tiến hóa lên Lv.${curLv + 1} (${curLv + 1 === 2 ? '+45% Sát thương, +50% Hồi máu & Chỉ số' : 'Bắn 2 Đạn Đôi, +100% Sát thương, +120% Chỉ số'}): Cần ${eggCost} Trứng dư hoặc 1 Pet dự phòng`}
          </div>
          ${!isMaxLv ? `
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="craft-btn ${canUpgradeByEgg ? 'can-craft' : 'disabled'}" ${canUpgradeByEgg ? '' : 'disabled'} id="btn-upgrade-pet-egg" style="background:${canUpgradeByEgg ? '#d97706' : ''}; color:#fff;">
                🥚 Cường Hóa Bằng ${eggCost} Trứng (Có ${eggCount})
              </button>
              ${hasStoredPets ? `
                <button class="craft-btn can-craft" id="btn-upgrade-pet-fuse-first" style="background:#0284c7; color:#fff;">
                  🧬 Dung Hợp 1 Pet Dự Phòng (+1 Dịch Trứng)
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
      activeCard.querySelector('#btn-unequip-pet').onclick = () => ps.unequipActivePet();
      const btnUpEgg = activeCard.querySelector('#btn-upgrade-pet-egg');
      if (btnUpEgg && canUpgradeByEgg) {
        btnUpEgg.onclick = () => ps.upgradeActivePetWithEgg();
      }
      const btnFuseFirst = activeCard.querySelector('#btn-upgrade-pet-fuse-first');
      if (btnFuseFirst && hasStoredPets) {
        btnFuseFirst.onclick = () => ps.upgradeActivePetWithStored(ps.storedPets[0].uid);
      }
    } else {
      activeCard.innerHTML = `
        <div class="recipe-info">
          <div class="recipe-name" style="color:#94a3b8;">🐾 Chưa mang theo Thú Cưng nào (0 / 1 Pet)</div>
          <div class="recipe-desc">Hãy ấp Trứng Quái Vật ở trên hoặc chọn 1 Pet trong Chuồng Lưu Trữ bên dưới để mang theo hỗ trợ chiến đấu!</div>
        </div>
      `;
    }
    container.appendChild(activeCard);

    // 4. Stored Pets in Bio-Lab Sanctuary (Swap with 1-Pet Limit or Fuse into Active Pet)
    if (ps.storedPets && ps.storedPets.length > 0) {
      const storedHeader = document.createElement('div');
      storedHeader.style.cssText = 'margin: 12px 0 6px 0; padding: 6px 10px; background: rgba(56, 189, 248, 0.14); border-left: 3px solid #38bdf8; color: #38bdf8; font-weight: 800; font-size: 12px;';
      storedHeader.innerHTML = `🏠 CHUỒNG LƯU TRỮ PET TẠI PHÒNG LAB (${ps.storedPets.length} PET DỰ PHÒNG — ĐỔI MANG THEO HOẶC DUNG HỢP TĂNG SAO)`;
      container.appendChild(storedHeader);

      const canFuseToActive = ps.activePet && (ps.activePet.level || 1) < 3;

      ps.storedPets.forEach(petObj => {
        const sp = ps.getPetEffectiveStats(petObj);
        if (!sp) return;
        const iconUrl = window.pixelArt ? window.pixelArt.getDataURL(`icon_${sp.icon}`) : '';
        const pLv = sp.level || 1;

        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.style.marginBottom = '6px';
        card.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            ${iconUrl ? `<img src="${iconUrl}" style="width:38px;height:38px;image-rendering:pixelated;border:1px solid ${sp.color};border-radius:6px;background:#0f172a;padding:2px;">` : ''}
            <div class="recipe-info">
              <div class="recipe-name" style="color:${sp.color};">
                ${sp.badgeIcon} ${sp.name}
                <span style="color:#facc15; font-size:11px;">${'⭐'.repeat(pLv)} Lv.${pLv}</span>
                <span style="font-size:10px;color:#94a3b8;">(${sp.role})</span>
              </div>
              <div class="recipe-desc">${sp.desc}</div>
            </div>
          </div>
          <div class="recipe-action" style="display:flex; gap:6px; flex-wrap:wrap;">
            ${canFuseToActive ? `
              <button class="craft-btn can-craft btn-fuse-stored" style="background:#0284c7; color:#fff;" title="Hiến tế Pet này để tăng +1 Cấp Sao cho Pet đang mang bên người & nhận +1 Dịch Tuyến Trứng">
                🧬 DUNG HỢP (+1⭐)
              </button>
            ` : ''}
            <button class="craft-btn can-craft btn-equip-stored">
              ${ps.activePet ? '🔄 ĐỔI MANG THEO' : '✅ MANG BÊN NGƯỜI'}
            </button>
            <button class="craft-btn btn-release-stored" style="background:#450a0a; color:#fca5a5; border:1px solid #ef4444; padding:6px 8px;" title="Phóng thích Pet nhận lại Dịch Tuyến Trứng">
              ✖
            </button>
          </div>
        `;
        const fuseBtn = card.querySelector('.btn-fuse-stored');
        if (fuseBtn) {
          fuseBtn.onclick = () => ps.upgradeActivePetWithStored(petObj.uid);
        }
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
