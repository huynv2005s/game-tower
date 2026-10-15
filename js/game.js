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
      height: window.innerHeight,
      zoom: 1.0,
      targetZoom: 1.0,
      minZoom: 0.36,
      maxZoom: 1.40
    };
    this.userCustomZoom = false;

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
    this.world.game = this;
    this.player = null;
    this.monsters = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];

    // High-Performance 128px Spatial Hash Grid for O(1) Monster Queries
    this.monsterGrid = new SpatialGrid(
      CONSTANTS.WORLD_COLS * CONSTANTS.TILE_SIZE,
      CONSTANTS.WORLD_ROWS * CONSTANTS.TILE_SIZE,
      128
    );

    this.weapons = new WeaponSystem(this);
    this.inventory = new InventorySystem(this);
    this.dayNight = new DayNightSystem(this);
    this.lab = new LabSystem(this);
    window.labSystem = this.lab;

    // Phase 6: Companion Pet & Bio-Lab Egg Incubator System
    this.petSystem = new PetSystem(this);
    window.petSystem = this.petSystem;

    // Phase 3: Tower Defense Building Manager
    this.buildingManager = new BuildingManager(this);
    window.buildingManager = this.buildingManager;

    // Mobile Controller & Save Manager
    this.saveManager = new SaveManager(this);
    window.saveManager = this.saveManager;

    this.mobileController = new MobileController(this);
    window.mobileController = this.mobileController;

    this.lastTime = performance.now();
    this.isPaused = false;
    this.frameCount = 0;
    this.minimapBgCanvas = null;
    this.tacticalMapBgCanvas = null;
    this._hudCache = null;
  }

  getDefaultZoom() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Narrow portrait mobile: zoom out significantly so player sees surrounding paths & resources
    if (w < 600) return 0.54;
    // Mobile landscape / compact tablet viewports: wide tactical camera view
    if (w <= 1024 || h <= 580) return 0.62;
    return 1.0;
  }

  getEffectiveMinZoom() {
    const worldW = (this.world && this.world.width) ? this.world.width : 3200;
    const worldH = (this.world && this.world.height) ? this.world.height : 2560;
    const fitZoom = Math.max(this.canvas.width / worldW, this.canvas.height / worldH);
    return Math.max(this.camera.minZoom, Math.min(1.0, fitZoom));
  }

  setZoom(newZoom, immediate = false, isUserAction = false) {
    const minZ = this.getEffectiveMinZoom();
    const clamped = Math.max(minZ, Math.min(this.camera.maxZoom, newZoom));
    this.camera.targetZoom = clamped;

    if (isUserAction) {
      this.userCustomZoom = true;
      try {
        localStorage.setItem('alien_apocalypse_zoom_v2', clamped.toFixed(2));
      } catch (e) {}
    }

    if (immediate) {
      const prevW = this.camera.width;
      const prevH = this.camera.height;
      this.camera.zoom = clamped;
      this.camera.width = this.canvas.width / this.camera.zoom;
      this.camera.height = this.canvas.height / this.camera.zoom;
      this.camera.x -= (this.camera.width - prevW) / 2;
      this.camera.y -= (this.camera.height - prevH) / 2;
      this.clampCamera();
    }

    this.updateZoomUI();
  }

  adjustZoom(delta, immediate = false) {
    this.setZoom(this.camera.targetZoom + delta, immediate, true);
    if (this.player && this.floatingTexts && this.floatingTexts.length < 40) {
      const pct = Math.round(this.camera.targetZoom * 100);
      this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 34, `🔍 ZOOM BẢN ĐỒ: ${pct}%`, '#38bdf8', 12, 0.75));
    }
  }

  cycleZoomPreset() {
    const presets = [0.45, 0.56, 0.68, 0.82, 1.0, 1.2];
    const cur = this.camera.targetZoom;
    let nextZoom = presets[0];
    for (let i = 0; i < presets.length; i++) {
      if (presets[i] > cur + 0.04) {
        nextZoom = presets[i];
        break;
      }
    }
    this.setZoom(nextZoom, false, true);
    if (this.player && this.floatingTexts) {
      const pct = Math.round(this.camera.targetZoom * 100);
      const modeDesc = pct <= 50 ? 'TOÀN CẢNH RỘNG' : (pct <= 70 ? 'TẦM NHÌN MOBILE' : (pct <= 90 ? 'TẦM NHÌN VỪA' : 'CẬN CẢNH'));
      this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 34, `🔍 GÓC NHÌN: ${pct}% (${modeDesc})`, '#facc15', 12, 1.0));
    }
  }

  updateZoomUI() {
    const pct = Math.round((this.camera.targetZoom || this.camera.zoom || 1) * 100) + '%';
    const badge = document.getElementById('zoom-level-label');
    if (badge) badge.innerText = pct;
    const modalBadge = document.getElementById('tactical-map-zoom-label');
    if (modalBadge) modalBadge.innerText = `Góc nhìn: ${pct}`;
  }

  clampCamera() {
    if (!this.world) return;
    const maxCamX = Math.max(0, this.world.width - this.camera.width);
    const maxCamY = Math.max(0, this.world.height - this.camera.height);
    this.camera.x = Math.max(0, Math.min(maxCamX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxCamY, this.camera.y));
  }

  init() {
    // Load saved zoom preference or apply optimal mobile/desktop default zoom
    let initialZoom = this.getDefaultZoom();
    try {
      const savedZ = parseFloat(localStorage.getItem('alien_apocalypse_zoom_v2'));
      if (!isNaN(savedZ) && savedZ >= 0.35 && savedZ <= 1.5) {
        initialZoom = savedZ;
        this.userCustomZoom = true;
      }
    } catch (e) {}
    this.camera.zoom = initialZoom;
    this.camera.targetZoom = initialZoom;

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

    // Snap camera immediately to player on startup
    this.camera.x = this.player.x - this.camera.width / 2;
    this.camera.y = this.player.y - this.camera.height / 2;
    this.clampCamera();

    // Initial UI render
    this.inventory.renderUI();
    this.updateHUD(true);
    this.updateZoomUI();

    // Start Game Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (!this.userCustomZoom) {
      const autoZ = this.getDefaultZoom();
      this.camera.zoom = autoZ;
      this.camera.targetZoom = autoZ;
    } else {
      const minZ = this.getEffectiveMinZoom();
      if (this.camera.zoom < minZ) this.camera.zoom = minZ;
      if (this.camera.targetZoom < minZ) this.camera.targetZoom = minZ;
    }
    this.camera.width = this.canvas.width / (this.camera.zoom || 1);
    this.camera.height = this.canvas.height / (this.camera.zoom || 1);
    this.clampCamera();
    this.updateZoomUI();
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

    // 2. Alien Crawlers & Ranged Frost-Web Spitters in Mountain biome (safe non-water coordinates)
    for (let i = 0; i < 12; i++) {
      const mx = (10 + Math.random() * 80) * CONSTANTS.TILE_SIZE;
      const my = (9 + Math.random() * 15) * CONSTANTS.TILE_SIZE;
      const safe = this.world.findSafeSpawnPoint(mx, my, 18);
      const sp = (i % 3 === 0) ? 'frost_spitter' : ((i % 4 === 0) ? 'spitter' : 'crawler');
      this.monsters.push(new Monster(safe.x, safe.y, sp));
    }

    // 3. Alien Crawlers & Ranged Frost-Web Spitters along Beach
    for (let i = 0; i < 8; i++) {
      const bx = (15 + Math.random() * 70) * CONSTANTS.TILE_SIZE;
      const by = (62 + Math.random() * 4) * CONSTANTS.TILE_SIZE;
      const safe = this.world.findSafeSpawnPoint(bx, by, 18);
      const sp = (i % 3 === 0) ? 'frost_spitter' : 'crawler';
      this.monsters.push(new Monster(safe.x, safe.y, sp));
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

      // If Inventory is open, Delete / Backspace removes selected item
      if (this.inventory && this.inventory.isOpen) {
        if (e.code === 'Delete' || e.code === 'Backspace') {
          e.preventDefault();
          if (e.shiftKey) {
            this.inventory.deleteSelectedStack();
          } else {
            this.inventory.deleteSelectedOne();
          }
          return;
        }
        if (e.code === 'Enter') {
          e.preventDefault();
          this.inventory.triggerSelectedAction();
          return;
        }
      }

      // Escape to close open modals or cancel build mode
      if (e.code === 'Escape') {
        if (this.inventory && this.inventory.isOpen) {
          this.inventory.toggleUI();
          return;
        }
        if (this.lab && this.lab.isOpen) {
          this.lab.close();
          return;
        }
        const tacMap = document.getElementById('tactical-map-modal');
        if (tacMap && tacMap.style.display === 'flex') {
          tacMap.style.display = 'none';
          return;
        }
        const helpModal = document.getElementById('help-modal');
        if (helpModal && helpModal.style.display === 'flex') {
          helpModal.style.display = 'none';
          return;
        }
        const resetModal = document.getElementById('reset-game-modal');
        if (resetModal && resetModal.style.display === 'flex') {
          resetModal.style.display = 'none';
          return;
        }
        if (this.buildingManager && this.buildingManager.buildMode) {
          this.buildingManager.exitBuildMode();
          return;
        }
      }

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

      // Inventory Toggle [KeyI or Tab]
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        this.inventory.toggleUI();
      }

      // Interact Key [KeyF] for Bio-Lab, Furnace, Workbench, Workshop, Alien Egg Pickup, Water
      if (e.code === 'KeyF') {
        const nearEgg = this.world.getAlienEggNear(this.player.x, this.player.y, 70);
        if (nearEgg) {
          this.world.pickupAlienEgg(nearEgg, this);
          return;
        }
        const struct = this.world.getStructureNear(this.player.x, this.player.y, 90);
        if (struct) {
          if (struct.type === 'biolab') {
            const hasReadyCrop = this.lab && this.lab.hydroPods && this.lab.hydroPods.some(p => p.seedId && p.ready);
            const nearGreenhouse = this.player.y < struct.y + 42;
            this.lab.open((hasReadyCrop || nearGreenhouse) ? 'hydroponics' : 'lab');
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

      // Pet & Incubator Toggle [KeyP]
      if (e.code === 'KeyP') {
        if (this.lab) {
          if (this.lab.isOpen && this.lab.currentTab === 'incubator') {
            this.lab.close();
          } else {
            this.lab.open('incubator');
          }
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

      // Camera Zoom Shortcuts [-, +, =, Z]
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        this.adjustZoom(-0.12);
      }
      if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        this.adjustZoom(0.12);
      }
      if (e.code === 'KeyZ') {
        this.cycleZoomPreset();
      }

      // Tactical Map Modal Toggle [KeyN or KeyV]
      if (e.code === 'KeyN' || e.code === 'KeyV') {
        this.toggleTacticalMap();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse Wheel Zoom on Canvas
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.10 : -0.10;
      this.adjustZoom(delta);
    }, { passive: false });

    // Disable context menu on right click to allow quick cancel build mode
    window.addEventListener('contextmenu', (e) => {
      if (this.buildingManager && this.buildingManager.buildMode) {
        e.preventDefault();
        this.buildingManager.exitBuildMode();
      }
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      const z = this.camera.zoom || 1;
      this.mouse.screenX = e.clientX;
      this.mouse.screenY = e.clientY;
      this.mouse.worldX = e.clientX / z + this.camera.x;
      this.mouse.worldY = e.clientY / z + this.camera.y;
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
          const z = this.camera.zoom || 1;
          this.mouse.screenX = e.clientX;
          this.mouse.screenY = e.clientY;
          this.mouse.worldX = e.clientX / z + this.camera.x;
          this.mouse.worldY = e.clientY / z + this.camera.y;

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

    // Smoothly interpolate camera zoom toward targetZoom
    if (Math.abs(this.camera.targetZoom - this.camera.zoom) > 0.001) {
      const prevW = this.camera.width;
      const prevH = this.camera.height;
      this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * Math.min(1, dt * 12);
      this.camera.width = this.canvas.width / this.camera.zoom;
      this.camera.height = this.canvas.height / this.camera.zoom;
      this.camera.x -= (this.camera.width - prevW) / 2;
      this.camera.y -= (this.camera.height - prevH) / 2;
    } else if (this.camera.zoom !== this.camera.targetZoom) {
      this.camera.zoom = this.camera.targetZoom;
      this.camera.width = this.canvas.width / this.camera.zoom;
      this.camera.height = this.canvas.height / this.camera.zoom;
    }

    // Update world mouse coords with camera zoom
    const z = this.camera.zoom || 1;
    this.mouse.worldX = this.mouse.screenX / z + this.camera.x;
    this.mouse.worldY = this.mouse.screenY / z + this.camera.y;

    // Check if UI modal is open (Crafting, Inventory, Help, GameOver, TacticalMap, ResetModal)
    if (!this._modalEls) {
      this._modalEls = {
        help: document.getElementById('help-modal'),
        gameover: document.getElementById('gameover-modal'),
        tacticalMap: document.getElementById('tactical-map-modal'),
        resetGame: document.getElementById('reset-game-modal')
      };
    }
    const isTacticalMapOpen = this._modalEls.tacticalMap && this._modalEls.tacticalMap.style.display === 'flex';
    if (isTacticalMapOpen && this.frameCount % 4 === 0) {
      this.renderTacticalMap();
    }

    const isModalOpen = (this.lab && this.lab.isOpen) ||
                        (this.inventory && this.inventory.isOpen) ||
                        isTacticalMapOpen ||
                        (this._modalEls.help && this._modalEls.help.style.display === 'flex') ||
                        (this._modalEls.gameover && this._modalEls.gameover.style.display === 'flex') ||
                        (this._modalEls.resetGame && this._modalEls.resetGame.style.display === 'flex');

    if (isModalOpen) {
      if (this.lab) this.lab.update(dt);
      if (this.petSystem) this.petSystem.update(dt);
      this.updateHUD();
      return; // Pause combat and environment while menu is active
    }

    // Rebuild 128px SpatialGrid once per frame for O(1) broadphase queries across Weapons, Pets, Drones, Projectiles & Monsters
    if (this.monsterGrid) {
      this.monsterGrid.insertAll(this.monsters);
    }

    // Continuous fire while holding mouse down with ranged weapon (Dagger / Plasma Gun)
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

    // Phase 6: Update Companion Pet & Incubator
    if (this.petSystem) {
      this.petSystem.update(dt);
    }

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
    this.clampCamera();

    // Update Monsters using single-pass O(N) compaction (zero splice overhead)
    updateAndCompact(this.monsters, (m) => {
      m.update(dt, this.player, this.world);
      return !(m.isDead && m.hp <= -50);
    });

    // Refresh SpatialGrid after monster movement so Projectiles & Defense Turrets/Traps query exact positions
    if (this.monsterGrid) {
      this.monsterGrid.insertAll(this.monsters);
    }

    // Update Projectiles using single-pass O(N) compaction
    updateAndCompact(this.projectiles, (proj) => {
      return proj.update(dt, this.world, this.monsters, this.particles, this.floatingTexts);
    });

    // Cap particle count to prevent lag spikes during massive explosions
    if (this.particles.length > 180) {
      const drop = this.particles.length - 180;
      this.particles.copyWithin(0, drop);
      this.particles.length = 180;
    }

    // Update Particles using single-pass O(N) compaction
    updateAndCompact(this.particles, (p) => p.update(dt));

    // Cap floating texts to prevent lag spikes
    if (this.floatingTexts.length > 45) {
      const drop = this.floatingTexts.length - 45;
      this.floatingTexts.copyWithin(0, drop);
      this.floatingTexts.length = 45;
    }

    // Update Floating Combat Texts using single-pass O(N) compaction
    updateAndCompact(this.floatingTexts, (ft) => ft.update(dt));

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

    this.ctx.save();
    if (this.camera.zoom && this.camera.zoom !== 1) {
      this.ctx.scale(this.camera.zoom, this.camera.zoom);
    }

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

    // 4. Render Player & Accompanying Pet (Max 1 Pet)
    this.player.render(this.ctx, this.camera);
    if (this.petSystem) {
      this.petSystem.render(this.ctx, this.camera);
    }

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

    this.ctx.restore();

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
        hudPetBadge: document.getElementById('hud-pet-badge'),
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

    // 3. Biome Indicator & Active Pet HUD Badge
    const biome = this.world.getBiomeAt(this.player.x, this.player.y);
    if (vals.biomeId !== biome.id && els.biomeBadge && els.biomeText) {
      vals.biomeId = biome.id;
      if (biome.id === 'mountain') {
        els.biomeText.innerText = 'NÚI TỬ THẦN';
        els.biomeBadge.style.borderColor = '#64748b';
        els.biomeBadge.style.color = '#94a3b8';
      } else if (biome.id === 'ocean') {
        els.biomeText.innerText = 'BỜ BIỂN ĐỘC';
        els.biomeBadge.style.borderColor = '#0ea5e9';
        els.biomeBadge.style.color = '#38bdf8';
      } else {
        els.biomeText.innerText = 'ĐỒNG BẰNG';
        els.biomeBadge.style.borderColor = '#22c55e';
        els.biomeBadge.style.color = '#86efac';
      }
    }

    if (els.hudPetBadge && this.petSystem) {
      const petSpec = this.petSystem.getActiveSpecies();
      const eggCnt = this.inventory ? this.inventory.getItemCount('monster_egg') : 0;
      const incReady = this.petSystem.incubator && this.petSystem.incubator.ready;
      const petLv = petSpec ? (petSpec.level || 1) : 0;
      const droneLv = this.petSystem.droneLevel || 0;
      const droneTag = droneLv > 0 ? ` • 🤖Lv.${droneLv}` : '';
      const petKey = `${petSpec ? petSpec.id : 'none'}_lv${petLv}_${eggCnt}_${incReady}_dr${droneLv}`;
      if (vals.petKey !== petKey) {
        vals.petKey = petKey;
        if (petSpec) {
          els.hudPetBadge.innerHTML = `${petSpec.badgeIcon} <strong>${petSpec.name}</strong> <span style="color:#facc15;">Lv.${petLv}</span>${droneTag}`;
          els.hudPetBadge.style.borderColor = petSpec.color;
          els.hudPetBadge.style.color = petSpec.color;
        } else if (incReady) {
          els.hudPetBadge.innerHTML = `🐣 <strong>Trứng Chín 100%!</strong> (Mở Lab)${droneTag}`;
          els.hudPetBadge.style.borderColor = '#facc15';
          els.hudPetBadge.style.color = '#facc15';
        } else {
          els.hudPetBadge.innerHTML = `🥚 <strong>Pet (0/1)</strong> • Trứng: ${eggCnt} [P]${droneTag}`;
          els.hudPetBadge.style.borderColor = '#c084fc';
          els.hudPetBadge.style.color = '#e9d5ff';
        }
      }
    }

    // 4. Day/Night, Dynamic Weather & Blood Moon Doomsday Clock Widget
    const timeStr = this.dayNight.getTimeFormatted();
    if (vals.timeStr !== timeStr && els.clockTime) {
      vals.timeStr = timeStr;
      els.clockTime.innerText = timeStr;
    }

    const isBMDay = this.dayNight.isBloodMoonDay ? this.dayNight.isBloodMoonDay() : false;
    const isBMNight = this.dayNight.isBloodMoonNight ? this.dayNight.isBloodMoonNight() : false;
    const nextBM = this.dayNight.getNextBloodMoonDay ? this.dayNight.getNextBloodMoonDay() : 5;
    const curWeather = this.dayNight.currentWeather || 'CLEAR';
    const wCfg = this.dayNight.getWeatherConfig ? this.dayNight.getWeatherConfig(curWeather) : { icon: '☀', name: 'Quang Đãng', color: '#38bdf8' };
    const clockStateKey = `${this.dayNight.dayCount}_${this.dayNight.isNight}_${isBMDay}_${curWeather}`;

    if (vals.clockStateKey !== clockStateKey) {
      vals.clockStateKey = clockStateKey;
      if (els.clockDay) {
        els.clockDay.innerText = isBMDay
          ? `🩸 HUYẾT NGUYỆT - NGÀY ${this.dayNight.dayCount}`
          : `NGÀY ${this.dayNight.dayCount}`;
        els.clockDay.style.color = isBMDay ? '#ff4d6d' : '';
      }
      if (els.clockPhase) {
        if (isBMNight || curWeather === 'BLOOD_MOON') {
          if (els.phaseIcon) els.phaseIcon.innerText = '🩸';
          if (els.phaseDesc) els.phaseDesc.innerText = 'HUYẾT NGUYỆT (LOOT X2)';
          els.clockPhase.style.color = '#ff1744';
        } else if (curWeather === 'ACID_RAIN') {
          if (els.phaseIcon) els.phaseIcon.innerText = '🌧️';
          if (els.phaseDesc) els.phaseDesc.innerText = `${this.dayNight.isNight ? 'ĐÊM' : 'NGÀY'}: MƯA AXIT (X2 DỊCH/GIÁP)`;
          els.clockPhase.style.color = '#84cc16';
        } else if (curWeather === 'EMP_STORM') {
          if (els.phaseIcon) els.phaseIcon.innerText = '⚡';
          if (els.phaseDesc) els.phaseDesc.innerText = `${this.dayNight.isNight ? 'ĐÊM' : 'NGÀY'}: BÃO ĐIỆN TỪ (+25% SÚNG)`;
          els.clockPhase.style.color = '#38bdf8';
        } else if (this.dayNight.isNight) {
          if (els.phaseIcon) els.phaseIcon.innerText = '💀';
          if (els.phaseDesc) els.phaseDesc.innerText = `ĐÊM (HUYẾT NGUYỆT: N.${nextBM})`;
          els.clockPhase.style.color = '#ef4444';
        } else {
          if (els.phaseIcon) els.phaseIcon.innerText = wCfg.icon || '☀';
          if (els.phaseDesc) els.phaseDesc.innerText = `QUANG ĐÃNG (HN: N.${nextBM})`;
          els.clockPhase.style.color = '#38bdf8';
        }
      }
      const isPanicOrBM = ((this.player.hp / this.player.maxHp) * 100 < 38) || isBMNight;
      if (els.bloodOverlay) {
        els.bloodOverlay.classList.toggle('active-panic', isPanicOrBM);
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
        const nearEgg = this.world.getAlienEggNear(this.player.x, this.player.y, 70);
        const struct = this.world.getStructureNear(this.player.x, this.player.y, 90);
        if (nearEgg) {
          promptKey = `egg_${nearEgg.col}_${nearEgg.row}`;
          onClickMode = 'interact';
          promptHtml = `🥚 BẤM <span class="key-hint">[F / 💬]</span> HOẶC ĐÁNH: <strong>NHẶT TRỨNG QUÁI VẬT ĐEM VỀ PHÒNG LAB ẤP PET!</strong>`;
        } else if (struct) {
          const labLv = (this.lab && this.lab.labLevel) ? this.lab.labLevel : 1;
          const readyCrops = (this.lab && this.lab.hydroPods) ? this.lab.hydroPods.filter(p => p.seedId && p.ready).length : 0;
          promptKey = `struct_${struct.type}_${labLv}_${readyCrops}`;
          onClickMode = 'interact';
          if (struct.type === 'biolab') {
            if (readyCrops > 0) {
              promptHtml = `✨ BẤM <span class="key-hint">[F / 💬]</span>: <strong>THU HOẠCH ${readyCrops} LỒNG CÂY CHÍN & NÂNG CẤP LAB (LV.${labLv})</strong>`;
            } else {
              promptHtml = `🧬 BẤM <span class="key-hint">[F / 💬]</span>: <strong>PHÒNG LAB LV.${labLv} — NÂNG CẤP MỞ RỘNG TRỒNG CÂY & ẤP PET</strong>`;
            }
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

  resetToNewGame() {
    // 1. Close all open modals
    const modalIds = ['gameover-modal', 'help-modal', 'tactical-map-modal', 'reset-game-modal'];
    for (const id of modalIds) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    }
    if (this.inventory && this.inventory.isOpen) {
      this.inventory.toggleUI();
    }
    if (this.lab && this.lab.isOpen) {
      this.lab.close();
    }

    // 2. Regenerate World Map, Ores, Flora & Alien Eggs
    this.world.generate();
    this.tacticalMapBgCanvas = null;
    this.buildMinimapCache();

    // 3. Clear active entities & spatial grid
    this.monsters.length = 0;
    this.projectiles.length = 0;
    this.particles.length = 0;
    this.floatingTexts.length = 0;
    if (this.monsterGrid) {
      this.monsterGrid.clear();
    }

    // 4. Respawn fresh Player at central base plaza
    const spawnX = 35 * CONSTANTS.TILE_SIZE;
    const spawnY = 38 * CONSTANTS.TILE_SIZE;
    this.player = new Player(spawnX, spawnY);

    // 5. Reset Weapons, Inventory, Lab, Pets, Drones, Defenses & Day/Night Cycle
    this.weapons = new WeaponSystem(this);
    this.inventory = new InventorySystem(this);
    this.dayNight = new DayNightSystem(this);
    this.lab = new LabSystem(this);
    window.labSystem = this.lab;

    this.petSystem = new PetSystem(this);
    window.petSystem = this.petSystem;

    this.buildingManager = new BuildingManager(this);
    window.buildingManager = this.buildingManager;

    this.inventory.updatePlayerStats();
    this.inventory.renderUI();

    // 6. Respawn Training Dummies & Initial Biome Monsters
    this.spawnTestEntities();

    // 7. Snap Camera to Player & Refresh HUD
    this.camera.x = this.player.x - this.camera.width / 2;
    this.camera.y = this.player.y - this.camera.height / 2;
    this.clampCamera();
    this.updateHUD(true);

    if (window.audioManager) {
      window.audioManager.playDayGong();
    }

    const msg = '🌱 ĐÃ BẮT ĐẦU VÁN MỚI — NGÀY 1 (08:00 BÌNH MINH)!';
    this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 36, msg, '#4ade80', 14, 2.8));
    if (this.saveManager) {
      this.saveManager.showSaveToast(msg);
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

    // 2. Draw Resource Nodes & Unhatched Alien Eggs on Minimap (Data-Driven via CONSTANTS.RESOURCE_NODES)
    const nodeDefs = CONSTANTS.RESOURCE_NODES || {};
    for (let h of this.world.resourceNodes) {
      if (h.isDestroyed) continue;
      const cfg = nodeDefs[h.type];
      if (cfg && !cfg.minimapColor) continue;
      const ex = (h.x / this.world.width) * mw;
      const ey = (h.y / this.world.height) * mh;
      const mCol = (cfg && cfg.minimapColor) || (h.type === 'alien_egg' ? '#e879f9' : '#38bdf8');
      const mSz = (cfg && cfg.minimapSize) || (h.type === 'alien_egg' ? 2.2 : 1.6);
      mctx.fillStyle = mCol;
      mctx.fillRect(ex - mSz * 0.5, ey - mSz * 0.5, mSz, mSz);
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
    mctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    mctx.lineWidth = 0.9;
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

  toggleTacticalMap() {
    const modal = document.getElementById('tactical-map-modal');
    if (!modal) return;
    const isOpening = modal.style.display !== 'flex';
    modal.style.display = isOpening ? 'flex' : 'none';
    if (isOpening) {
      this.updateZoomUI();
      this.renderTacticalMap();
    }
  }

  buildTacticalMapCache(mw, mh) {
    if (!this.tacticalMapBgCanvas) {
      this.tacticalMapBgCanvas = document.createElement('canvas');
    }
    this.tacticalMapBgCanvas.width = mw;
    this.tacticalMapBgCanvas.height = mh;
    const tctx = this.tacticalMapBgCanvas.getContext('2d');

    const scaleX = mw / this.world.cols;
    const scaleY = mh / this.world.rows;

    for (let r = 0; r < this.world.rows; r++) {
      for (let c = 0; c < this.world.cols; c++) {
        const t = this.world.tiles[r][c];
        let col = '#2d5a27';
        if (t === CONSTANTS.TILES.SNOW_PEAK) col = '#cbd5e1';
        else if (t === CONSTANTS.TILES.MOUNTAIN_ROCK || t === CONSTANTS.TILES.MOUNTAIN_SLATE) col = '#475569';
        else if (t === CONSTANTS.TILES.RIVER_WATER || t === CONSTANTS.TILES.LAKE_WATER) col = '#0284c7';
        else if (t === CONSTANTS.TILES.WOODEN_BRIDGE) col = '#d97706';
        else if (t === CONSTANTS.TILES.DIRT_PATH) col = '#854d0e';
        else if (t === CONSTANTS.TILES.SAND || t === CONSTANTS.TILES.SAND_WET) col = '#eab308';
        else if (t === CONSTANTS.TILES.OCEAN_SHALLOW) col = '#0d9488';
        else if (t === CONSTANTS.TILES.OCEAN_DEEP) col = '#0f172a';
        else if (t === CONSTANTS.TILES.TREE_ALIEN_PINE || t === CONSTANTS.TILES.TREE_POST_APOC) col = '#14532d';

        tctx.fillStyle = col;
        tctx.fillRect(c * scaleX, r * scaleY, Math.ceil(scaleX), Math.ceil(scaleY));
      }
    }

    // Biome Region Labels on Tactical Map
    tctx.save();
    tctx.font = 'bold 11px "Chakra Petch", sans-serif';
    tctx.textAlign = 'center';
    tctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
    tctx.shadowColor = '#000';
    tctx.shadowBlur = 4;
    tctx.fillText('🏔 VÙNG NÚI TỬ THẦN (Lưu Huỳnh, Thạch Anh, Titan, Tuyết Liên, Ổ Trứng)', mw * 0.5, mh * 0.12);
    tctx.fillText('🏕 ĐỒNG BẰNG TRUNG TÂM & CĂN CỨ (Gỗ, Thảo Dược, Cầu Gỗ, Sông Hồ)', mw * 0.42, mh * 0.52);
    tctx.fillText('🌊 BỜ BIỂN NHIỄM XẠ (Mảnh Vỡ Phi Thuyền, Trụ Năng Lượng Plasma)', mw * 0.5, mh * 0.86);
    tctx.restore();
  }

  renderTacticalMap() {
    const canvas = document.getElementById('tactical-map-canvas');
    if (!canvas || !this.world || !this.player) return;
    const ctx = canvas.getContext('2d');
    const mw = canvas.width;
    const mh = canvas.height;

    if (!this.tacticalMapBgCanvas || this.tacticalMapBgCanvas.width !== mw || this.tacticalMapBgCanvas.height !== mh) {
      this.buildTacticalMapCache(mw, mh);
    }

    ctx.drawImage(this.tacticalMapBgCanvas, 0, 0);

    // 1. Draw Wild Berry Flora (Green/Purple dots)
    for (let f of this.world.wildFlora) {
      if (f.isHarvested) continue;
      const fx = (f.x / this.world.width) * mw;
      const fy = (f.y / this.world.height) * mh;
      ctx.fillStyle = f.isBlighted ? '#c084fc' : '#4ade80';
      ctx.fillRect(fx - 1.5, fy - 1.5, 3, 3);
    }

    // 2. Draw Resource Nodes (Data-Driven via CONSTANTS.RESOURCE_NODES)
    const nodeDefs = CONSTANTS.RESOURCE_NODES || {};
    for (let h of this.world.resourceNodes) {
      if (h.isDestroyed) continue;
      const rx = (h.x / this.world.width) * mw;
      const ry = (h.y / this.world.height) * mh;
      const cfg = nodeDefs[h.type];
      const col = (cfg && cfg.tacticalColor) || '#facc15';
      const rSize = (cfg && cfg.tacticalSize) || 3.5;

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 3. Draw Base Structures & Safe Zone Ring
    for (let s of this.world.structures) {
      const sx = ((s.x + s.width / 2) / this.world.width) * mw;
      const sy = ((s.y + s.height / 2) / this.world.height) * mh;
      if (s.type === 'biolab') {
        const rad = (s.isolationRadius / this.world.width) * mw;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
      }
    }

    // 4. Draw Placed Defenses
    if (this.buildingManager) {
      for (let d of this.buildingManager.defenses) {
        const dx = (d.x / this.world.width) * mw;
        const dy = (d.y / this.world.height) * mh;
        ctx.fillStyle = d.level === 3 ? '#facc15' : (d.level === 2 ? '#c084fc' : '#38bdf8');
        ctx.fillRect(dx - 2, dy - 2, 4, 4);
      }
    }

    // 5. Draw Monsters
    for (let m of this.monsters) {
      if (m.isDead) continue;
      const mx = (m.x / this.world.width) * mw;
      const my = (m.y / this.world.height) * mh;
      ctx.fillStyle = m.species === 'dummy' ? '#facc15' : (m.isBoss ? '#c084fc' : '#ef4444');
      const sz = m.isBoss ? 6 : 3.5;
      ctx.fillRect(mx - sz / 2, my - sz / 2, sz, sz);
    }

    // 6. Draw Camera Viewport Box
    const camX = (this.camera.x / this.world.width) * mw;
    const camY = (this.camera.y / this.world.height) * mh;
    const camW = (this.camera.width / this.world.width) * mw;
    const camH = (this.camera.height / this.world.height) * mh;
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(camX, camY, camW, camH);

    // 7. Draw Player Position Marker
    const px = (this.player.x / this.world.width) * mw;
    const py = (this.player.y / this.world.height) * mh;
    ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.font = 'bold 10px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText('📍 BẠN ĐANG Ở ĐÂY', px, py - 9);
    ctx.restore();
  }
}

// Instantiate engine when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
  window.gameEngine.init();
});
