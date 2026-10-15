// Core Game Engine
// Coordinates Game Loop, Input, Camera, Entities, UI & Minimap

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = true;
    if (this.ctx.imageSmoothingQuality) {
      this.ctx.imageSmoothingQuality = 'high';
    }

    this.camera = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };

    // State & Systems
    this.keys = {};
    this.mouse = {
      screenX: 0,
      screenY: 0,
      worldX: 0,
      worldY: 0,
      isDown: false
    };

    this.world = new WorldMap();
    this.player = null;
    this.monsters = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];

    this.weapons = new WeaponSystem(this);
    this.inventory = new InventorySystem(this);
    this.dayNight = new DayNightSystem(this);
    this.lab = new LabSystem(this);
    window.labSystem = this.lab;

    // Phase 3: Tower Defense Building Manager
    this.buildingManager = new BuildingManager(this);
    window.buildingManager = this.buildingManager;
    this.world.game = this;

    // Mobile Controller & Save Manager
    this.saveManager = new SaveManager(this);
    window.saveManager = this.saveManager;

    this.mobileController = new MobileController(this);
    window.mobileController = this.mobileController;

    this.lastTime = performance.now();
    this.isPaused = false;
    this.frameCount = 0;
    this.minimapBgCanvas = null;
    this._hudCache = null;
  }

  init() {
    // Resize canvas
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Initialize procedural pixel art generator
    window.pixelArt.init();

    // Generate world map
    this.world.generate();

    // Pre-render static minimap background once
    this.buildMinimapCache();

    // Spawn player in the central Plains near the wooden bridge
    // Row 38, Col 35 (safe plains area)
    const spawnX = 35 * CONSTANTS.TILE_SIZE;
    const spawnY = 38 * CONSTANTS.TILE_SIZE;
    this.player = new Player(spawnX, spawnY);

    // Initial stats sync
    this.inventory.updatePlayerStats();

    // Spawn Test Dummy & Alien Monsters for skill testing
    this.spawnTestEntities();

    // Bind Controls
    this.bindInputs();
    window.unstuckPlayer = () => this.unstuckPlayer();

    // Auto-load saved game if present
    if (this.saveManager.hasSave()) {
      this.saveManager.loadGame();
    }

    // Initial UI render
    this.inventory.renderUI();
    this.updateHUD(true);

    // Start Game Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.width = this.canvas.width;
    this.camera.height = this.canvas.height;
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = true;
      if (this.ctx.imageSmoothingQuality) {
        this.ctx.imageSmoothingQuality = 'high';
      }
    }
  }

  spawnTestEntities() {
    // 1. Training Dummies in Plains - Dedicated Weapon Training Grounds (Southwest of Base)
    // Completely separated from doors, bridges, and waterways
    const trainCol = 29;
    const trainRow = 39;
    this.monsters.push(new Monster(trainCol * CONSTANTS.TILE_SIZE, trainRow * CONSTANTS.TILE_SIZE, 'dummy', 'Bù Nhìn Thử Vũ Khí', 150));
    this.monsters.push(new Monster((trainCol + 1.5) * CONSTANTS.TILE_SIZE, (trainRow + 1.5) * CONSTANTS.TILE_SIZE, 'dummy', 'Bù Nhìn Thử Vũ Khí', 150));
    this.monsters.push(new Monster((trainCol - 0.8) * CONSTANTS.TILE_SIZE, (trainRow + 2.2) * CONSTANTS.TILE_SIZE, 'dummy', 'Bù Nhìn Thử Vũ Khí', 150));

    // 2. Alien Crawlers in Mountain biome near eggs
    for (let i = 0; i < 12; i++) {
      const mx = (10 + Math.random() * 80) * CONSTANTS.TILE_SIZE;
      const my = (6 + Math.random() * 18) * CONSTANTS.TILE_SIZE;
      this.monsters.push(new Monster(mx, my, 'crawler', 'Xenomorph Crawler', 65));
    }

    // 3. Alien Crawlers along Beach
    for (let i = 0; i < 8; i++) {
      const bx = (15 + Math.random() * 70) * CONSTANTS.TILE_SIZE;
      const by = (63 + Math.random() * 5) * CONSTANTS.TILE_SIZE;
      this.monsters.push(new Monster(bx, by, 'crawler', 'Xenomorph Crawler', 55));
    }
  }

  bindInputs() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Toggle Audio on first user interaction
      window.audioManager.ensureContext();

      // Dash (Space)
      if (e.code === 'Space') {
        e.preventDefault();
        this.player.triggerDash(this.keys, this.mouse.worldX, this.mouse.worldY, this.particles, this.floatingTexts);
      }

      // Weapon Skill 1 [Q]
      if (e.code === 'KeyQ') {
        this.weapons.triggerSkill1(this.player, this.mouse.worldX, this.mouse.worldY);
      }

      // Weapon Skill 2 [E]
      if (e.code === 'KeyE') {
        this.weapons.triggerSkill2(this.player, this.mouse.worldX, this.mouse.worldY);
      }

      // Quick Weapon Switching [1, 2, 3, 4, G]
      if (e.code === 'Digit1') this.weapons.switchWeapon('SPEAR');
      if (e.code === 'Digit2') this.weapons.switchWeapon('STAFF');
      if (e.code === 'Digit3') this.weapons.switchWeapon('DAGGER');
      if (e.code === 'Digit4') this.weapons.switchWeapon('BOW');
      if (e.code === 'KeyG') this.weapons.switchWeapon('GUN');

      // Quick Defense Build & Upgrade Shortcuts [5, 6, 7, 8, 9, R]
      if (e.code === 'Digit5') this.buildingManager.enterBuildMode('wall');
      if (e.code === 'Digit6') this.buildingManager.enterBuildMode('trap');
      if (e.code === 'Digit7') this.buildingManager.enterBuildMode('turret');
      if (e.code === 'Digit8') this.buildingManager.enterBuildMode('mortar');
      if (e.code === 'Digit9') this.buildingManager.enterBuildMode('upgrade');
      if (e.code === 'KeyR') {
        if (this.buildingManager) {
          this.buildingManager.upgradeNearestOrHovered();
        }
      }

      // Escape to cancel build mode
      if (e.code === 'Escape') {
        if (this.buildingManager.buildMode) {
          this.buildingManager.exitBuildMode();
          return;
        }
      }

      // Inventory Toggle [KeyI or Tab]
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        this.inventory.toggleUI();
      }

      // Interact Key [KeyF] for Bio-Lab, Furnace, Workbench, Workshop, Water
      if (e.code === 'KeyF') {
        const struct = this.world.getStructureNear(this.player.x, this.player.y, 85);
        if (struct) {
          if (struct.type === 'biolab') {
            this.lab.open('lab');
            return;
          } else if (struct.type === 'furnace') {
            this.lab.open('furnace');
            return;
          } else if (struct.type === 'workbench') {
            this.lab.open('workbench');
            return;
          } else if (struct.type === 'workshop') {
            this.lab.open('workshop');
            return;
          }
        }
        if (this.world.isNearWater(this.player.x, this.player.y, 45)) {
          this.inventory.addItem('dirty_water', 1);
          window.audioManager.playEquip();
          this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, '+1 NƯỚC AO SÔNG Ô NHIỄM', '#65a30d', 12, 1.0));
          return;
        }
      }

      // Help Toggle [KeyH]
      if (e.code === 'KeyH') {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
          helpModal.style.display = (helpModal.style.display === 'flex') ? 'none' : 'flex';
        }
      }

      // Sound Mute Toggle [KeyM]
      if (e.code === 'KeyM') {
        const isMuted = window.audioManager.toggleMute();
        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, isMuted ? 'ÂM THANH: TẮT' : 'ÂM THANH: BẬT', '#facc15', 12, 0.8));
      }

      // Quick Save Game [KeyK]
      if (e.code === 'KeyK') {
        if (this.saveManager) {
          this.saveManager.saveGame(false);
        }
      }

      // Emergency Unstuck Key [KeyU]
      if (e.code === 'KeyU') {
        this.unstuckPlayer();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Disable context menu on right click to allow quick cancel build mode
    window.addEventListener('contextmenu', (e) => {
      if (this.buildingManager && this.buildingManager.buildMode) {
        e.preventDefault();
        this.buildingManager.exitBuildMode();
      }
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      this.mouse.screenX = e.clientX;
      this.mouse.screenY = e.clientY;
      this.mouse.worldX = e.clientX + this.camera.x;
      this.mouse.worldY = e.clientY + this.camera.y;
      if (this.mobileController && this.mobileController.joystickTouchId === null &&
          this.mobileController.moveVector.x === 0 && this.mobileController.moveVector.y === 0) {
        this.mobileController.isUsingTouchAim = false;
      }
    });

    // Mouse click (Attack / Place Structure)
    window.addEventListener('mousedown', (e) => {
      window.audioManager.ensureContext();

      if (e.button === 2) { // Right click -> Cancel build mode
        if (this.buildingManager.buildMode) {
          this.buildingManager.exitBuildMode();
          return;
        }
      }

      if (e.button === 0) { // Left click
        if (e.target.tagName === 'CANVAS') {
          this.mouse.screenX = e.clientX;
          this.mouse.screenY = e.clientY;
          this.mouse.worldX = e.clientX + this.camera.x;
          this.mouse.worldY = e.clientY + this.camera.y;

          // If in Build Mode, place or upgrade structure!
          if (this.buildingManager.buildMode) {
            this.buildingManager.updateHoverTile(this.mouse.worldX, this.mouse.worldY);
            this.buildingManager.placeStructure(
              this.buildingManager.hoverTile.col,
              this.buildingManager.hoverTile.row,
              this.buildingManager.buildMode
            );
            return;
          }

          // Otherwise normal weapon attack
          this.mouse.isDown = true;
          this.weapons.performBasicAttack(this.player, this.mouse.worldX, this.mouse.worldY);
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
    });
  }

  update(dt) {
    // Clamp delta time to avoid spiral of death
    dt = Math.min(dt, 0.1);
    this.frameCount++;

    // Update world mouse coords
    this.mouse.worldX = this.mouse.screenX + this.camera.x;
    this.mouse.worldY = this.mouse.screenY + this.camera.y;

    // Check if UI modal is open (Crafting, Inventory, Help, GameOver)
    if (!this._modalEls) {
      this._modalEls = {
        help: document.getElementById('help-modal'),
        gameover: document.getElementById('gameover-modal')
      };
    }
    const isModalOpen = (this.lab && this.lab.isOpen) ||
                        (this.inventory && this.inventory.isOpen) ||
                        (this._modalEls.help && this._modalEls.help.style.display === 'flex') ||
                        (this._modalEls.gameover && this._modalEls.gameover.style.display === 'flex');

    if (isModalOpen) {
      if (this.lab) this.lab.update(dt);
      this.updateHUD();
      return; // Pause combat and environment while menu is active
    }

    // Continuous fire while holding mouse down with ranged weapon (Bow / Plasma Gun)
    if (this.mouse.isDown && this.player && !this.player.isDead && (!this.buildingManager || !this.buildingManager.buildMode)) {
      if (this.player.activeWeapon === 'GUN' || this.player.activeWeapon === 'DAGGER') {
        this.weapons.performBasicAttack(this.player, this.mouse.worldX, this.mouse.worldY);
      }
    }

    // Day/Night progression
    this.dayNight.update(dt);

    // Bio-Lab progression
    if (this.lab) this.lab.update(dt);

    // Update Player
    this.player.update(dt, this.keys, this.mouse.worldX, this.mouse.worldY, this.world, this.particles, this.floatingTexts);

    // Update Mobile Controller UI (cooldowns & button states)
    if (this.mobileController) {
      this.mobileController.updateUI();
    }

    // Update Camera to follow player smoothly
    const targetCamX = this.player.x - this.camera.width / 2;
    const targetCamY = this.player.y - this.camera.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (targetCamY - this.camera.y) * 0.12;

    // Clamp camera within world boundaries
    this.camera.x = Math.max(0, Math.min(this.world.width - this.camera.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.world.height - this.camera.height, this.camera.y));

    // Update Monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      m.update(dt, this.player, this.world);
      // Clean up dead monsters after fade
      if (m.isDead && m.hp <= -50) {
        this.monsters.splice(i, 1);
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const alive = proj.update(dt, this.world, this.monsters, this.particles, this.floatingTexts);
      if (!alive) {
        this.projectiles.splice(i, 1);
      }
    }

    // Cap particle count to prevent lag spikes during massive explosions
    if (this.particles.length > 180) {
      this.particles.splice(0, this.particles.length - 180);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const alive = this.particles[i].update(dt);
      if (!alive) this.particles.splice(i, 1);
    }

    // Cap floating texts to prevent lag spikes
    if (this.floatingTexts.length > 45) {
      this.floatingTexts.splice(0, this.floatingTexts.length - 45);
    }

    // Update Floating Combat Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const alive = this.floatingTexts[i].update(dt);
      if (!alive) this.floatingTexts.splice(i, 1);
    }

    // Phase 3 & 5: Update Building Manager (Defenses, Turrets, Mortars, Placement/Upgrade Hover)
    if (this.buildingManager) {
      if (!(this.mobileController && this.mobileController.isUsingTouchAim)) {
        this.buildingManager.updateHoverTile(this.mouse.worldX, this.mouse.worldY);
      }
      this.buildingManager.update(dt, this.monsters, this.particles, this.floatingTexts, this.projectiles);
    }

    // Update HUD
    this.updateHUD();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Render World Map Tiles, Mountains & Forests (Cached offscreen ground + frustum culled nodes)
    this.world.render(this.ctx, this.camera, this.player);

    // 2. Render Placed Defenses & Build Ghost Preview (Walls, Traps, Turrets, Mortars)
    if (this.buildingManager) {
      this.buildingManager.render(this.ctx, this.camera);
    }

    // 3. Render Monsters
    for (let m of this.monsters) {
      m.render(this.ctx, this.camera);
    }

    // 4. Render Player
    this.player.render(this.ctx, this.camera);

    // 5. Render Projectiles
    for (let p of this.projectiles) {
      p.render(this.ctx, this.camera);
    }

    // 6. Render Particles
    for (let part of this.particles) {
      part.render(this.ctx, this.camera);
    }

    // 7. Day / Night Environmental Darkness & Lantern Beam
    this.dayNight.renderLighting(this.ctx, this.camera, this.player);

    // 8. Render Floating Combat Text (above lighting)
    for (let ft of this.floatingTexts) {
      ft.render(this.ctx, this.camera);
    }

    // 9. Render Minimap (throttled every 4 frames for 60 FPS performance)
    if (this.frameCount % 4 === 0) {
      this.renderMinimap();
    }
  }

  loop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (!this.isPaused) {
      this.update(dt);
      this.render();
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  initHUDCache() {
    this._hudCache = {
      els: {
        hpBar: document.getElementById('hp-bar-fill'),
        hpText: document.getElementById('hp-bar-text'),
        bloodOverlay: document.getElementById('blood-screen-overlay'),
        toxinBar: document.getElementById('toxin-bar-fill'),
        toxinText: document.getElementById('toxin-bar-text'),
        dangerBadge: document.getElementById('toxin-danger-level'),
        toxicOverlay: document.getElementById('toxic-screen-overlay'),
        biomeText: document.getElementById('biome-text-label'),
        biomeBadge: document.getElementById('current-biome-badge'),
        clockTime: document.getElementById('clock-time'),
        clockDay: document.getElementById('clock-day'),
        clockPhase: document.getElementById('clock-phase'),
        phaseIcon: document.getElementById('phase-icon'),
        phaseDesc: document.getElementById('phase-desc'),
        s1Name: document.getElementById('skill-1-name'),
        s1Cd: document.getElementById('skill-1-cd'),
        s2Name: document.getElementById('skill-2-name'),
        s2Cd: document.getElementById('skill-2-cd'),
        dashCd: document.getElementById('dash-cd'),
        immunityBadge: document.getElementById('immunity-badge'),
        promptBanner: document.getElementById('interaction-prompt'),
        weaponSlots: [
          document.getElementById('weapon-slot-1'),
          document.getElementById('weapon-slot-2'),
          document.getElementById('weapon-slot-3'),
          document.getElementById('weapon-slot-4'),
          document.getElementById('weapon-slot-5')
        ],
        weaponLvs: [
          document.getElementById('weapon-lv-1'),
          document.getElementById('weapon-lv-2'),
          document.getElementById('weapon-lv-3'),
          document.getElementById('weapon-lv-4'),
          document.getElementById('weapon-lv-5')
        ],
        defSlots: {
          wall: document.getElementById('def-slot-1'),
          trap: document.getElementById('def-slot-2'),
          turret: document.getElementById('def-slot-3'),
          mortar: document.getElementById('def-slot-4'),
          upgrade: document.getElementById('def-slot-5')
        }
      },
      vals: {}
    };
  }

  updateHUD(force = false) {
    if (!this.player) return;
    if (!this._hudCache || force) this.initHUDCache();
    const { els, vals } = this._hudCache;

    // 1. HP Bar & Horror Panic Overlay
    const hpRound = Math.round(this.player.hp);
    const maxHp = this.player.maxHp;
    if (vals.hpRound !== hpRound || vals.maxHp !== maxHp) {
      vals.hpRound = hpRound;
      vals.maxHp = maxHp;
      const hpPercent = Math.max(0, Math.min(100, (this.player.hp / maxHp) * 100));
      if (els.hpBar) els.hpBar.style.width = `${hpPercent}%`;
      if (els.hpText) els.hpText.innerText = `${hpRound} / ${maxHp}`;
      const isPanic = hpPercent < 38;
      if (vals.isPanic !== isPanic && els.bloodOverlay) {
        vals.isPanic = isPanic;
        els.bloodOverlay.classList.toggle('active-panic', isPanic);
      }
    }

    // 2. Infection / Mutagen Bar & Toxic Screen Overlay
    const infRound = Math.round(this.player.infection);
    if (vals.infRound !== infRound) {
      vals.infRound = infRound;
      if (els.toxinBar) els.toxinBar.style.width = `${this.player.infection}%`;
      if (els.toxinText) els.toxinText.innerText = `${infRound}%`;

      const isToxic = this.player.infection > 40;
      if (vals.isToxic !== isToxic && els.toxicOverlay) {
        vals.isToxic = isToxic;
        els.toxicOverlay.classList.toggle('active-toxic', isToxic);
      }

      const dangerTier = this.player.infection < 25 ? 0 : (this.player.infection < 65 ? 1 : 2);
      if (vals.dangerTier !== dangerTier && els.dangerBadge) {
        vals.dangerTier = dangerTier;
        if (dangerTier === 0) {
          els.dangerBadge.innerText = 'AN TOÀN';
          els.dangerBadge.style.color = '#86efac';
          els.dangerBadge.style.borderColor = '#22c55e';
          els.dangerBadge.style.background = 'rgba(34, 197, 94, 0.15)';
        } else if (dangerTier === 1) {
          els.dangerBadge.innerText = 'NHIỄM ĐỘC';
          els.dangerBadge.style.color = '#facc15';
          els.dangerBadge.style.borderColor = '#eab308';
          els.dangerBadge.style.background = 'rgba(234, 179, 8, 0.2)';
        } else {
          els.dangerBadge.innerText = 'ĐỘT BIẾN GẦN KỀ';
          els.dangerBadge.style.color = '#ef4444';
          els.dangerBadge.style.borderColor = '#ef4444';
          els.dangerBadge.style.background = 'rgba(239, 68, 68, 0.25)';
        }
      }
    }

    // 3. Biome Indicator
    const biome = this.world.getBiomeAt(this.player.x, this.player.y);
    if (vals.biomeId !== biome.id && els.biomeBadge && els.biomeText) {
      vals.biomeId = biome.id;
      if (biome.id === 'mountain') {
        els.biomeText.innerText = 'NÚI TỬ THẦN - VÙNG ĐỈNH NÚI';
        els.biomeBadge.style.borderColor = '#64748b';
        els.biomeBadge.style.color = '#94a3b8';
      } else if (biome.id === 'ocean') {
        els.biomeText.innerText = 'BỜ BIỂN NHIỄM XẠ - VÙNG NƯỚC ĐỘC';
        els.biomeBadge.style.borderColor = '#0ea5e9';
        els.biomeBadge.style.color = '#38bdf8';
      } else {
        els.biomeText.innerText = 'ĐỒNG BẰNG HOANG TÀN - CĂN CỨ';
        els.biomeBadge.style.borderColor = '#22c55e';
        els.biomeBadge.style.color = '#86efac';
      }
    }

    // 4. Day/Night Doomsday Clock Widget
    const timeStr = this.dayNight.getTimeFormatted();
    if (vals.timeStr !== timeStr && els.clockTime) {
      vals.timeStr = timeStr;
      els.clockTime.innerText = timeStr;
    }
    if (vals.dayCount !== this.dayNight.dayCount && els.clockDay) {
      vals.dayCount = this.dayNight.dayCount;
      els.clockDay.innerText = `NGÀY SINH TỒN ${this.dayNight.dayCount}`;
    }
    if (vals.isNight !== this.dayNight.isNight && els.clockPhase) {
      vals.isNight = this.dayNight.isNight;
      if (this.dayNight.isNight) {
        if (els.phaseIcon) els.phaseIcon.innerText = '💀';
        if (els.phaseDesc) els.phaseDesc.innerText = 'HUYẾT NGUYỆT: TẬN DIỆT!';
        els.clockPhase.style.color = '#ef4444';
      } else {
        if (els.phaseIcon) els.phaseIcon.innerText = '☀';
        if (els.phaseDesc) els.phaseDesc.innerText = 'BÌNH MINH HOANG TÀN';
        els.clockPhase.style.color = '#38bdf8';
      }
    }

    // 5. Weapon Action Slots & Level Badges (5 Weapons)
    const weaponKeys = ['SPEAR', 'STAFF', 'DAGGER', 'BOW', 'GUN'];
    const lvSig = this.weapons && this.weapons.weaponLevels
      ? weaponKeys.map(k => this.weapons.weaponLevels[k] || 1).join(',')
      : '1,1,1,1,1';

    if (vals.activeWeapon !== this.player.activeWeapon || vals.lvSig !== lvSig) {
      vals.activeWeapon = this.player.activeWeapon;
      vals.lvSig = lvSig;
      const activeW = CONSTANTS.WEAPONS[this.player.activeWeapon];
      weaponKeys.forEach((key, idx) => {
        const slotEl = els.weaponSlots[idx];
        if (slotEl) {
          slotEl.classList.toggle('active-weapon', this.player.activeWeapon === key);
        }
        const lvEl = els.weaponLvs[idx];
        if (lvEl && this.weapons && this.weapons.weaponLevels) {
          const lv = this.weapons.weaponLevels[key] || 1;
          lvEl.innerText = `Lv.${lv}`;
          lvEl.className = `slot-lv-badge lv-${lv}`;
        }
      });
      if (els.s1Name && activeW) els.s1Name.innerText = activeW.skill1.name;
      if (els.s2Name && activeW) els.s2Name.innerText = activeW.skill2.name;
    }

    // Highlight active Defense / Upgrade mode slot
    const curBuildMode = this.buildingManager ? this.buildingManager.buildMode : null;
    if (vals.curBuildMode !== curBuildMode) {
      vals.curBuildMode = curBuildMode;
      for (const [modeKey, slotEl] of Object.entries(els.defSlots)) {
        if (slotEl) {
          slotEl.classList.toggle('active-weapon', curBuildMode === modeKey);
        }
      }
    }

    // 6. Skill Cooldowns (only update when 0.1s string changes)
    const s1Txt = this.player.skill1CooldownTimer > 0 ? this.player.skill1CooldownTimer.toFixed(1) : '';
    if (vals.s1Txt !== s1Txt && els.s1Cd) {
      vals.s1Txt = s1Txt;
      els.s1Cd.style.display = s1Txt ? 'flex' : 'none';
      if (s1Txt) els.s1Cd.innerText = s1Txt;
    }

    const s2Txt = this.player.skill2CooldownTimer > 0 ? this.player.skill2CooldownTimer.toFixed(1) : '';
    if (vals.s2Txt !== s2Txt && els.s2Cd) {
      vals.s2Txt = s2Txt;
      els.s2Cd.style.display = s2Txt ? 'flex' : 'none';
      if (s2Txt) els.s2Cd.innerText = s2Txt;
    }

    const dashTxt = this.player.dashTimer > 0 ? this.player.dashTimer.toFixed(1) : '';
    if (vals.dashTxt !== dashTxt && els.dashCd) {
      vals.dashTxt = dashTxt;
      els.dashCd.style.display = dashTxt ? 'flex' : 'none';
      if (dashTxt) els.dashCd.innerText = dashTxt;
    }

    // 7. Immunity Badge
    const immSec = this.player.immunityTimer > 0 ? Math.ceil(this.player.immunityTimer) : 0;
    if (vals.immSec !== immSec && els.immunityBadge) {
      vals.immSec = immSec;
      els.immunityBadge.style.display = immSec > 0 ? 'inline-flex' : 'none';
      if (immSec > 0) els.immunityBadge.innerText = `🛡 KHÁNG ĐỘC: ${immSec}s`;
    }

    // 8. Interaction Prompt Banner
    if (els.promptBanner) {
      let promptKey = '';
      let promptHtml = '';
      let onClickMode = null;

      if (this.buildingManager && this.buildingManager.buildMode) {
        const bm = this.buildingManager.buildMode;
        promptKey = `build_${bm}`;
        onClickMode = 'exit_build';
        if (bm === 'upgrade') {
          promptHtml = `🔧 CHẾ ĐỘ NÂNG CẤP / SỬA CHỮA: Click vào Tường / Tháp / Súng Cối để nâng cấp (Lv.1 ➔ Lv.3) &nbsp;|&nbsp; <span class="key-hint" style="background:#ef4444;color:#fff;">✖ HỦY [ESC]</span>`;
        } else {
          promptHtml = `🏗 XÂY [${bm.toUpperCase()}]: Click đất trống để đặt (hoặc click công trình cũ để Nâng Cấp!) &nbsp;|&nbsp; <span class="key-hint" style="background:#ef4444;color:#fff;">✖ HỦY</span>`;
        }
      } else {
        const struct = this.world.getStructureNear(this.player.x, this.player.y, 90);
        if (struct) {
          promptKey = `struct_${struct.type}`;
          onClickMode = 'interact';
          if (struct.type === 'biolab') {
            promptHtml = `BẤM <span class="key-hint">[F / 💬]</span>: <strong>PHÒNG LAB CÁCH LY</strong>`;
          } else if (struct.type === 'furnace') {
            promptHtml = `BẤM <span class="key-hint">[F / 💬]</span>: <strong>LÒ NUNG KHỬ TRÙNG</strong>`;
          } else if (struct.type === 'workbench') {
            promptHtml = `BẤM <span class="key-hint">[F / 💬]</span>: <strong>BÀN CHẾ TẠO & NÂNG CẤP SÚNG</strong>`;
          } else if (struct.type === 'workshop') {
            promptHtml = `BẤM <span class="key-hint">[F / 💬]</span>: <strong>XƯỞNG THỦ THÀNH & NÂNG CẤP TƯỜNG/THÁP</strong>`;
          }
        } else if (this.world.isNearWater(this.player.x, this.player.y, 50)) {
          promptKey = 'water';
          onClickMode = 'interact';
          promptHtml = `BẤM <span class="key-hint">[F / 💬]</span>: <strong>MÚC NƯỚC AO SÔNG</strong>`;
        } else if (this.buildingManager) {
          const hoveredDef = this.buildingManager.getStructureAt(this.buildingManager.hoverTile.col, this.buildingManager.hoverTile.row);
          if (hoveredDef) {
            const lv = hoveredDef.level || 1;
            promptKey = `def_${hoveredDef.col}_${hoveredDef.row}_${lv}_${Math.round(hoveredDef.hp)}`;
            onClickMode = 'upgrade';
            if (lv < 3) {
              promptHtml = `🔧 BẤM <span class="key-hint">[R]</span> HOẶC CLICK: <strong>NÂNG CẤP ${hoveredDef.name.toUpperCase()} LÊN CẤP ${lv + 1}</strong>`;
            } else if (hoveredDef.hp < hoveredDef.maxHp) {
              promptHtml = `🔧 BẤM <span class="key-hint">[R]</span>: <strong>SỬA CHỮA ${hoveredDef.name.toUpperCase()} (${Math.round(hoveredDef.hp)}/${hoveredDef.maxHp})</strong>`;
            }
          }
        }
      }

      if (vals.promptKey !== promptKey) {
        vals.promptKey = promptKey;
        if (promptHtml) {
          els.promptBanner.style.display = 'block';
          els.promptBanner.style.cursor = 'pointer';
          els.promptBanner.innerHTML = promptHtml;
          if (onClickMode === 'exit_build') {
            els.promptBanner.onclick = () => this.buildingManager.exitBuildMode();
          } else if (onClickMode === 'upgrade') {
            els.promptBanner.onclick = () => this.buildingManager.upgradeNearestOrHovered();
          } else {
            els.promptBanner.onclick = () => {
              if (this.mobileController) this.mobileController.handleInteract();
            };
          }
        } else {
          els.promptBanner.style.display = 'none';
          els.promptBanner.onclick = null;
        }
      }
    }
  }

  triggerGameOver(reason) {
    const modal = document.getElementById('gameover-modal');
    if (!modal) return;

    modal.style.display = 'flex';
    window.audioManager.playNightGong();

    const titleEl = document.getElementById('gameover-title');
    const descEl = document.getElementById('gameover-desc');
    const daysEl = document.getElementById('gameover-days');

    if (reason === 'infection') {
      if (titleEl) titleEl.innerText = '☣ KÝ SINH ĐỘT BIẾN TOÀN DIỆN! ☣';
      if (descEl) descEl.innerText = 'Độc tố trong cơ thể đã đạt mức tử vong 100%! Cơ thể bạn đã biến đổi hoàn toàn thành sinh vật ngoại lai.';
    } else {
      if (titleEl) titleEl.innerText = '💀 BẠN ĐÃ BỊ QUÁI VẬT TIÊU DIỆT! 💀';
      if (descEl) descEl.innerText = 'Nhân vật đã kiệt sức trước các đòn tấn công tàn bạo của đàn quái vật ngoài hành tinh.';
    }

    if (daysEl) daysEl.innerText = `Số ngày sống sót: ${this.dayNight.dayCount} ngày`;
  }

  respawnPlayer() {
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.style.display = 'none';

    // Respawn in spacious open central plaza in front of Bio-Lab
    const rx = 35 * CONSTANTS.TILE_SIZE;
    const ry = 38 * CONSTANTS.TILE_SIZE;

    this.player.respawn(rx, ry);
    this.player.invulnerableTimer = 3.5; // 3.5s shield against spawn camp
    this.player.immunityTimer = 5.0; // 5.0s toxin immunity
    this.floatingTexts.push(new FloatingText(rx, ry - 30, '⚡ HỒI SINH: KHIÊN VÔ TRÙNG KÍCH HOẠT (3.5s)!', '#38bdf8', 14, 2.5));
    window.audioManager.playDayGong();

    // Bio-Lab EMP Disinfection Shockwave: Blast and stun any nearby hostile monsters
    for (let m of this.monsters) {
      if (m.species === 'dummy') continue;
      const dist = Math.hypot(m.x - rx, m.y - ry);
      if (dist < 190) {
        const a = Math.atan2(m.y - ry, m.x - rx);
        m.x += Math.cos(a) * 110;
        m.y += Math.sin(a) * 110;
        m.applyStun(2.0, this.floatingTexts);
      }
    }
  }

  unstuckPlayer() {
    const safeX = 35 * CONSTANTS.TILE_SIZE;
    const safeY = 38 * CONSTANTS.TILE_SIZE;
    this.player.x = safeX;
    this.player.y = safeY;
    this.player.isVaulting = false;
    this.player.isDashing = false;
    this.player.invulnerableTimer = 3.5;
    this.player.immunityTimer = 5.0;
    this.floatingTexts.push(new FloatingText(safeX, safeY - 30, '⚡ CỨU HỘ KHẨN CẤP: ĐÃ ĐƯA VỀ KHU AN TOÀN!', '#38bdf8', 13, 2.5));
    if (window.audioManager) window.audioManager.playEquip();

    // Disinfection Shockwave
    for (let m of this.monsters) {
      if (m.species === 'dummy') continue;
      const dist = Math.hypot(m.x - safeX, m.y - safeY);
      if (dist < 190) {
        const a = Math.atan2(m.y - safeY, m.x - safeX);
        m.x += Math.cos(a) * 120;
        m.y += Math.sin(a) * 120;
        m.applyStun(2.0, this.floatingTexts);
      }
    }
  }

  // Pre-render static minimap terrain & base structures once
  buildMinimapCache() {
    const miniCanvas = document.getElementById('minimap-canvas');
    const mw = miniCanvas ? miniCanvas.width : 140;
    const mh = miniCanvas ? miniCanvas.height : 112;

    if (!this.minimapBgCanvas) {
      this.minimapBgCanvas = document.createElement('canvas');
    }
    this.minimapBgCanvas.width = mw;
    this.minimapBgCanvas.height = mh;
    const mctx = this.minimapBgCanvas.getContext('2d');

    const scaleX = mw / this.world.cols;
    const scaleY = mh / this.world.rows;

    for (let r = 0; r < this.world.rows; r++) {
      for (let c = 0; c < this.world.cols; c++) {
        const t = this.world.tiles[r][c];
        let col = '#2d5a27';
        if (t === CONSTANTS.TILES.SNOW_PEAK) col = '#cbd5e1';
        else if (t === CONSTANTS.TILES.MOUNTAIN_ROCK || t === CONSTANTS.TILES.MOUNTAIN_SLATE) col = '#475569';
        else if (t === CONSTANTS.TILES.RIVER_WATER || t === CONSTANTS.TILES.LAKE_WATER) col = '#0284c7';
        else if (t === CONSTANTS.TILES.WOODEN_BRIDGE) col = '#b45309';
        else if (t === CONSTANTS.TILES.DIRT_PATH) col = '#785a40';
        else if (t === CONSTANTS.TILES.SAND || t === CONSTANTS.TILES.SAND_WET) col = '#eab308';
        else if (t === CONSTANTS.TILES.OCEAN_SHALLOW) col = '#0d9488';
        else if (t === CONSTANTS.TILES.OCEAN_DEEP) col = '#0f172a';
        else if (t === CONSTANTS.TILES.TREE_ALIEN_PINE || t === CONSTANTS.TILES.TREE_POST_APOC) col = '#14532d';

        mctx.fillStyle = col;
        mctx.fillRect(c * scaleX, r * scaleY, Math.ceil(scaleX), Math.ceil(scaleY));
      }
    }

    // Draw Base Structures (Bio-Lab Safe Zone in Emerald)
    for (let s of this.world.structures) {
      const sx = ((s.x + s.width / 2) / this.world.width) * mw;
      const sy = ((s.y + s.height / 2) / this.world.height) * mh;
      if (s.type === 'biolab') {
        mctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        mctx.lineWidth = 1;
        mctx.beginPath();
        mctx.arc(sx, sy, 6, 0, Math.PI * 2);
        mctx.stroke();
        mctx.fillStyle = '#10b981';
        mctx.fillRect(sx - 2, sy - 2, 4, 4);
      } else {
        mctx.fillStyle = '#38bdf8';
        mctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
      }
    }
  }

  renderMinimap() {
    if (!this._miniCanvas) {
      this._miniCanvas = document.getElementById('minimap-canvas');
      if (this._miniCanvas) this._miniCtx = this._miniCanvas.getContext('2d');
    }
    if (!this._miniCanvas || !this._miniCtx) return;

    const mctx = this._miniCtx;
    const mw = this._miniCanvas.width;
    const mh = this._miniCanvas.height;

    // 1. Blit pre-rendered static terrain in a single GPU call
    if (!this.minimapBgCanvas) this.buildMinimapCache();
    mctx.drawImage(this.minimapBgCanvas, 0, 0);

    // 2. Draw Unhatched Alien Eggs on Minimap (Magenta dots)
    mctx.fillStyle = '#e879f9';
    for (let h of this.world.harvestables) {
      if (h.isDestroyed || h.type !== 'alien_egg') continue;
      const ex = (h.x / this.world.width) * mw;
      const ey = (h.y / this.world.height) * mh;
      mctx.fillRect(ex - 1, ey - 1, 2, 2);
    }

    // 3. Draw Placed Defenses (color-coded by upgrade level)
    if (this.buildingManager) {
      for (let d of this.buildingManager.defenses) {
        const dx = (d.x / this.world.width) * mw;
        const dy = (d.y / this.world.height) * mh;
        mctx.fillStyle = d.level === 3 ? '#facc15' : (d.level === 2 ? '#c084fc' : '#38bdf8');
        mctx.fillRect(dx - 1, dy - 1, 2.2, 2.2);
      }
    }

    // 4. Draw Monsters on Minimap
    for (let m of this.monsters) {
      if (m.isDead) continue;
      const mx = (m.x / this.world.width) * mw;
      const my = (m.y / this.world.height) * mh;
      if (m.species === 'dummy') {
        mctx.fillStyle = '#facc15';
        mctx.fillRect(mx - 1, my - 1, 2, 2);
      } else if (m.isBoss) {
        mctx.fillStyle = '#c084fc';
        mctx.fillRect(mx - 2, my - 2, 4, 4);
      } else {
        mctx.fillStyle = '#ef4444';
        mctx.fillRect(mx - 1.2, my - 1.2, 2.4, 2.4);
      }
    }

    // 5. Draw Camera Viewport Rectangle
    const camX = (this.camera.x / this.world.width) * mw;
    const camY = (this.camera.y / this.world.height) * mh;
    const camW = (this.camera.width / this.world.width) * mw;
    const camH = (this.camera.height / this.world.height) * mh;
    mctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    mctx.lineWidth = 0.8;
    mctx.strokeRect(camX, camY, camW, camH);

    // 6. Draw Player on Minimap (Bright green pulsing beacon)
    const px = (this.player.x / this.world.width) * mw;
    const py = (this.player.y / this.world.height) * mh;
    mctx.fillStyle = '#4ade80';
    mctx.strokeStyle = '#ffffff';
    mctx.lineWidth = 1;
    mctx.beginPath();
    mctx.arc(px, py, 3.2, 0, Math.PI * 2);
    mctx.fill();
    mctx.stroke();

    // Minimap outer frame
    mctx.strokeStyle = '#38bdf8';
    mctx.lineWidth = 1;
    mctx.strokeRect(0, 0, mw, mh);
  }
}

// Instantiate engine when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
  window.gameEngine.init();
});
