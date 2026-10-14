// Bio-Lab & Furnace Interactive Management System
// Tab 1: Antidote Medicine Alchemy (Huyết thanh sơ cấp & Thuốc kháng thể tinh khiết)
// Tab 2: Furnace & Purifier (Đun nước sạch & Nung bột lưu huỳnh)
// Tab 3: Isolated Hydroponics (Nuôi cấy thảo dược cách ly không bị nhiễm khuẩn qua đêm)

class LabSystem {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.currentTab = 'lab'; // 'lab', 'furnace', 'hydroponics'

    // 3 Isolated Hydroponic Growth Pods inside Bio-Lab
    this.hydroPods = [
      { id: 0, seedId: null, progress: 0, growthTime: 40, ready: false },
      { id: 1, seedId: null, progress: 0, growthTime: 40, ready: false },
      { id: 2, seedId: null, progress: 0, growthTime: 40, ready: false }
    ];
  }

  update(dt) {
    // Advance hydroponics growth
    for (let pod of this.hydroPods) {
      if (pod.seedId && !pod.ready) {
        pod.progress += dt;
        if (pod.progress >= pod.growthTime) {
          pod.progress = pod.growthTime;
          pod.ready = true;
        }
      }
    }

    if (this.isOpen && this.currentTab === 'hydroponics') {
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
    } else if (tab === 'workshop') {
      this.renderRecipesTab('WORKSHOP', 'workshop-recipe-list', 'LẮP RÁP THỦ THÀNH');
    } else if (tab === 'hydroponics') {
      this.renderHydroponicsTab();
    }

    // Toggle panels
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

  // Render recipes for Lab or Furnace
  renderRecipesTab(recipeGroup, containerId, actionBtnText) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const recipes = CONSTANTS.RECIPES[recipeGroup] || [];

    recipes.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'recipe-card';

      // Check ingredients in inventory
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

      const outDef = CONSTANTS.ITEM_TYPES[recipe.output.id];

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
    let total = 0;
    for (let slot of this.game.inventory.slots) {
      if (slot && slot.id === itemId) {
        total += slot.count;
      }
    }
    return total;
  }

  craftRecipe(recipe) {
    // 1. Double check materials
    for (let input of recipe.inputs) {
      if (this.getItemCountInInventory(input.id) < input.count) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'THIẾU NGUYÊN LIỆU!', '#ef4444', 12, 0.8));
        return;
      }
    }

    // 2. Consume materials
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

    // 3. Grant output
    if (recipe.output.id === 'backpack_upgraded') {
      this.game.inventory.expandCapacity(6);
    } else {
      this.game.inventory.addItem(recipe.output.id, recipe.output.count);
    }

    // Audio & Visual feedback
    window.audioManager.playEquip();
    const outDef = CONSTANTS.ITEM_TYPES[recipe.output.id];
    this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, `ĐÃ HOÀN TẤT: +${recipe.output.count} ${outDef.name}!`, '#38bdf8', 13, 1.2));

    // Refresh UI
    this.game.inventory.renderUI();
    this.switchTab(this.currentTab);
  }

  // Render Hydroponics Pods
  renderHydroponicsTab() {
    const container = document.getElementById('hydroponics-pods');
    if (!container) return;
    container.innerHTML = '';

    this.hydroPods.forEach((pod, idx) => {
      const podEl = document.createElement('div');
      podEl.className = 'hydro-pod';

      if (!pod.seedId) {
        // Empty pod
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

    // Deduct 1 seed
    this.game.inventory.removeItem(this.game.inventory.slots.findIndex(s => s && s.id === seedId), 1);

    const pod = this.hydroPods[podIndex];
    pod.seedId = seedId;
    pod.progress = 0;
    pod.ready = false;

    window.audioManager.playEquip();
    this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 25, 'ĐÃ CẤY MẦM VÀO LỒNG VÔ TRÙNG!', '#22c55e', 12, 1.0));
    this.renderHydroponicsTab();
  }

  harvestPod(podIndex) {
    const pod = this.hydroPods[podIndex];
    if (!pod || !pod.ready) return;

    const seedDef = CONSTANTS.ITEM_TYPES[pod.seedId];
    const cropId = seedDef.targetCrop; // 'snow_lotus' or 'silver_moss'

    // Add 2 clean herbs
    this.game.inventory.addItem(cropId, 2);

    window.audioManager.playEquip();
    this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, `THU HOẠCH THÀNH CÔNG: +2 ${CONSTANTS.ITEM_TYPES[cropId].name}!`, '#38bdf8', 13, 1.2));

    // Reset pod
    pod.seedId = null;
    pod.progress = 0;
    pod.ready = false;

    this.renderHydroponicsTab();
  }
}

// Global registry
window.LabSystem = LabSystem;
