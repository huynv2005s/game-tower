// Mobile Touch Controls & Orientation Manager
// Features: Virtual Joystick, Large Touch Action Buttons, Auto-Aim Assist, Landscape Prompt

class MobileController {
  constructor(game) {
    this.game = game;
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
    this.userToggled = false;
    this.forceShowControls = false;
    this.rotateDismissed = false;

    // Aiming & Attack hold state
    this.isUsingTouchAim = this.isTouchDevice || this.isSmallViewport();
    this.lastAimAngle = 0;
    this.isAttackHeld = false;

    // Joystick state
    this.joystickTouchId = null;
    this.joystickBase = null;
    this.joystickKnob = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.maxRadius = 42; // Maximum travel distance for knob in pixels
    this.moveVector = { x: 0, y: 0 };

    // Overlay elements
    this.container = null;
    this.rotateOverlay = null;

    // Pinch-to-zoom state
    this.isPinching = false;
    this.pinchStartDist = 0;
    this.pinchStartZoom = 1.0;
    this.pinchEndTime = 0;

    this.initDOM();
    this.bindEvents();
    this.checkOrientation();
  }

  isSmallViewport() {
    return window.innerWidth <= 1024 || window.innerHeight <= 580;
  }

  initDOM() {
    this.container = document.getElementById('mobile-controls');
    this.rotateOverlay = document.getElementById('rotate-device-overlay');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickKnob = document.getElementById('joystick-knob');

    // Auto-display if touch device or mobile viewport detected
    this.updateControlsVisibility();
  }

  updateControlsVisibility() {
    if (!this.container) return;
    const shouldShow = this.userToggled ? this.forceShowControls : (this.isTouchDevice || this.isSmallViewport());
    this.forceShowControls = shouldShow;
    this.container.style.display = shouldShow ? 'block' : 'none';
    document.body.classList.toggle('mobile-controls-active', shouldShow);

    // Update toggle button state in HUD
    const toggleBtn = document.getElementById('btn-toggle-touch');
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', shouldShow);
      toggleBtn.textContent = '📱';
      toggleBtn.title = shouldShow ? 'Phím Ảo Cảm Ứng: ĐANG BẬT (Bấm để ẩn)' : 'Phím Ảo Cảm Ứng: ĐANG TẮT (Bấm để bật)';
    }
  }

  toggleControls() {
    this.userToggled = true;
    this.forceShowControls = !this.forceShowControls;
    this.isUsingTouchAim = this.forceShowControls;
    this.updateControlsVisibility();
    if (this.game && this.game.floatingTexts && this.game.player) {
      const msg = this.forceShowControls ? '📱 ĐÃ BẬT PHÍM ẢO CẢM ỨNG' : '📱 ĐÃ ẨN PHÍM ẢO CẢM ỨNG';
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, msg, '#38bdf8', 12, 1.2));
    }
  }

  dismissRotatePrompt() {
    this.rotateDismissed = true;
    if (this.rotateOverlay) {
      this.rotateOverlay.style.display = 'none';
    }
  }

  bindEvents() {
    const joystickZone = document.getElementById('joystick-zone');
    if (joystickZone) {
      // Touch events on Joystick with multi-touch isolation
      joystickZone.addEventListener('touchstart', (e) => this.onJoystickTouchStart(e), { passive: false });
      window.addEventListener('touchmove', (e) => this.onJoystickTouchMove(e), { passive: false });
      window.addEventListener('touchend', (e) => this.onJoystickTouchEnd(e), { passive: false });
      window.addEventListener('touchcancel', (e) => this.onJoystickTouchEnd(e), { passive: false });

      // Mouse support for joystick (works on desktop & touchscreen laptops)
      joystickZone.addEventListener('mousedown', (e) => this.onJoystickMouseDown(e));
    }

    // Touch Action Buttons
    this.bindAttackButton('btn-touch-attack');
    this.bindActionButton('btn-touch-dash', () => this.handleDash());
    this.bindActionButton('btn-touch-skill1', () => this.handleSkill1());
    this.bindActionButton('btn-touch-skill2', () => this.handleSkill2());
    this.bindActionButton('btn-touch-switch', () => this.handleSwitchWeapon());
    this.bindActionButton('btn-touch-interact', () => this.handleInteract());
    this.bindActionButton('btn-touch-build', () => this.handleToggleBuildBar());
    this.bindActionButton('btn-touch-bag', () => {
      if (this.game && this.game.inventory) this.game.inventory.toggleUI();
    });
    this.bindActionButton('btn-touch-unstuck', () => {
      if (window.unstuckPlayer) window.unstuckPlayer();
    });

    // Map Zoom & Full Tactical Map Buttons
    this.bindActionButton('btn-zoom-out', () => {
      if (this.game) this.game.adjustZoom(-0.12);
    });
    this.bindActionButton('btn-zoom-in', () => {
      if (this.game) this.game.adjustZoom(0.12);
    });
    this.bindActionButton('btn-zoom-reset', () => {
      if (this.game) this.game.cycleZoomPreset();
    });
    this.bindActionButton('btn-tactical-map', () => {
      if (this.game) this.game.toggleTacticalMap();
    });

    // Direct Canvas Touch for Pinch-to-Zoom, Building Placement, Structure Interaction & Tap-to-Attack
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.addEventListener('touchstart', (e) => this.onCanvasTouchStart(e), { passive: false });
      canvas.addEventListener('touchmove', (e) => this.onCanvasTouchMove(e), { passive: false });
      canvas.addEventListener('touchend', (e) => this.onCanvasTouchEnd(e), { passive: false });
      canvas.addEventListener('touchcancel', (e) => this.onCanvasTouchEnd(e), { passive: false });
    }

    // Prevent default browser touch interactions (pinch-to-zoom, pull-to-refresh)
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

    // Orientation & viewport change listener
    window.addEventListener('resize', () => {
      this.checkOrientation();
      this.updateControlsVisibility();
      if (this.game) this.game.resizeCanvas();
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.checkOrientation();
        this.updateControlsVisibility();
        if (this.game) this.game.resizeCanvas();
      }, 200);
    });
  }

  bindAttackButton(elementId) {
    const btn = document.getElementById(elementId);
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.isUsingTouchAim = true;
      window.audioManager.ensureContext();
      btn.classList.add('pressed');
      this.isAttackHeld = true;
      this.handleAttack();
    }, { passive: false });

    const endHold = (e) => {
      if (e && e.cancelable) e.preventDefault();
      btn.classList.remove('pressed');
      this.isAttackHeld = false;
    };

    btn.addEventListener('touchend', endHold, { passive: false });
    btn.addEventListener('touchcancel', endHold, { passive: false });

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.isUsingTouchAim = true;
      window.audioManager.ensureContext();
      btn.classList.add('pressed');
      this.isAttackHeld = true;
      this.handleAttack();
    });

    window.addEventListener('mouseup', () => {
      if (this.isAttackHeld) {
        btn.classList.remove('pressed');
        this.isAttackHeld = false;
      }
    });
  }

  bindActionButton(elementId, callback) {
    const btn = document.getElementById(elementId);
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.isUsingTouchAim = true;
      window.audioManager.ensureContext();
      btn.classList.add('pressed');
      callback();
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.classList.remove('pressed');
    }, { passive: false });

    btn.addEventListener('touchcancel', () => {
      btn.classList.remove('pressed');
    }, { passive: false });

    // Mouse fallback
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.isUsingTouchAim = true;
      window.audioManager.ensureContext();
      callback();
    });
  }

  getCanvasTouches(e) {
    const list = [];
    if (!e.touches) return list;
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      if (t.identifier === this.joystickTouchId) continue;
      if (t.target && t.target.id === 'gameCanvas') {
        list.push(t);
      }
    }
    return list;
  }

  onCanvasTouchStart(e) {
    if (!this.game || !this.game.player) return;

    const canvasTouches = this.getCanvasTouches(e);
    if (canvasTouches.length >= 2) {
      e.preventDefault();
      this.isPinching = true;
      const t1 = canvasTouches[0];
      const t2 = canvasTouches[1];
      this.pinchStartDist = Math.max(10, Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY));
      this.pinchStartZoom = this.game.camera.zoom || 1.0;
      return;
    }

    if (this.isPinching || (performance.now() - this.pinchEndTime < 180)) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;

    const touch = e.changedTouches[0];
    window.audioManager.ensureContext();
    this.isUsingTouchAim = true;

    const zoom = (this.game.camera && this.game.camera.zoom) ? this.game.camera.zoom : 1;
    const worldX = touch.clientX / zoom + this.game.camera.x;
    const worldY = touch.clientY / zoom + this.game.camera.y;
    this.game.mouse.screenX = touch.clientX;
    this.game.mouse.screenY = touch.clientY;
    this.game.mouse.worldX = worldX;
    this.game.mouse.worldY = worldY;

    // 1. If in Tower Defense Build Mode, update tile & place structure on tap!
    if (this.game.buildingManager && this.game.buildingManager.buildMode) {
      e.preventDefault();
      this.game.buildingManager.updateHoverTile(worldX, worldY);
      this.game.buildingManager.placeStructure(
        this.game.buildingManager.hoverTile.col,
        this.game.buildingManager.hoverTile.row,
        this.game.buildingManager.buildMode
      );
      return;
    }

    // 2. Check tapping on a nearby Base Structure (Bio-Lab, Furnace, Workbench, Workshop)
    const p = this.game.player;
    const struct = this.game.world.getStructureNear(p.x, p.y, 100);
    if (struct) {
      const distTapToStruct = Math.hypot(worldX - (struct.x + struct.width / 2), worldY - (struct.y + struct.height / 2));
      if (distTapToStruct <= 75) {
        e.preventDefault();
        if (struct.type === 'biolab') this.game.lab.open('lab');
        else if (struct.type === 'furnace') this.game.lab.open('furnace');
        else if (struct.type === 'workbench') this.game.lab.open('workbench');
        else if (struct.type === 'workshop') this.game.lab.open('workshop');
        return;
      }
    }

    // 3. Aim and attack/harvest toward the tapped world position
    const angle = Math.atan2(worldY - p.y, worldX - p.x);
    this.lastAimAngle = angle;
    p.aimAngle = angle;
    if (this.game.weapons) {
      this.game.weapons.performBasicAttack(p, worldX, worldY);
    }
  }

  onCanvasTouchMove(e) {
    if (!this.game) return;

    const canvasTouches = this.getCanvasTouches(e);
    if (canvasTouches.length >= 2) {
      if (e.cancelable) e.preventDefault();
      const t1 = canvasTouches[0];
      const t2 = canvasTouches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (!this.isPinching) {
        this.isPinching = true;
        this.pinchStartDist = Math.max(10, dist);
        this.pinchStartZoom = this.game.camera.zoom || 1.0;
      } else if (this.pinchStartDist > 10) {
        const scale = dist / this.pinchStartDist;
        this.game.setZoom(this.pinchStartZoom * scale, true, true);
      }
      return;
    }

    if (this.isPinching || !e.changedTouches || e.changedTouches.length === 0) return;

    const touch = e.changedTouches[0];
    const zoom = (this.game.camera && this.game.camera.zoom) ? this.game.camera.zoom : 1;
    this.game.mouse.screenX = touch.clientX;
    this.game.mouse.screenY = touch.clientY;
    this.game.mouse.worldX = touch.clientX / zoom + this.game.camera.x;
    this.game.mouse.worldY = touch.clientY / zoom + this.game.camera.y;
    if (this.game.buildingManager && this.game.buildingManager.buildMode) {
      this.game.buildingManager.updateHoverTile(this.game.mouse.worldX, this.game.mouse.worldY);
    }
  }

  onCanvasTouchEnd(e) {
    if (this.isPinching) {
      const canvasTouches = this.getCanvasTouches(e);
      if (canvasTouches.length < 2) {
        this.isPinching = false;
        this.pinchEndTime = performance.now();
      }
    }
  }

  // --- JOYSTICK LOGIC ---
  onJoystickTouchStart(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.joystickTouchId !== null) return; // Already tracking a finger

    const touch = e.changedTouches[0];
    this.joystickTouchId = touch.identifier;
    this.isUsingTouchAim = true;

    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    this.maxRadius = Math.max(32, rect.width * 0.36);

    this.updateJoystickPosition(touch.clientX, touch.clientY);
  }

  onJoystickTouchMove(e) {
    if (this.joystickTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        if (e.cancelable) e.preventDefault();
        this.updateJoystickPosition(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  onJoystickTouchEnd(e) {
    if (this.joystickTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.resetJoystick();
        break;
      }
    }
    if (e.touches && e.touches.length === 0) {
      this.resetJoystick();
    }
  }

  onJoystickMouseDown(e) {
    if (this.joystickTouchId !== null) return;
    e.preventDefault();
    e.stopPropagation();
    this.isUsingTouchAim = true;

    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    this.maxRadius = Math.max(32, rect.width * 0.36);

    const onMouseMove = (ev) => {
      this.updateJoystickPosition(ev.clientX, ev.clientY);
    };

    const onMouseUp = () => {
      this.resetJoystick();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    this.updateJoystickPosition(e.clientX, e.clientY);
  }

  updateJoystickPosition(clientX, clientY) {
    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, this.maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (this.joystickKnob) {
      this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    // Normalized move vector (-1.0 to 1.0)
    const factor = clampedDist / this.maxRadius;
    this.moveVector.x = Math.cos(angle) * factor;
    this.moveVector.y = Math.sin(angle) * factor;

    // Update player facing/aiming direction if moving
    if (factor > 0.12) {
      this.isUsingTouchAim = true;
      this.lastAimAngle = angle;
      if (this.game && this.game.player) {
        this.game.player.aimAngle = angle;
      }
    }
  }

  resetJoystick() {
    this.joystickTouchId = null;
    this.moveVector = { x: 0, y: 0 };
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = 'translate(0px, 0px)';
    }
  }

  // --- ACTION BUTTON HANDLERS ---
  getSmartAimTarget() {
    if (!this.game || !this.game.player) return { x: 0, y: 0 };
    const p = this.game.player;
    const w = (this.game.weapons && p.activeWeapon)
      ? this.game.weapons.getWeaponStats(p.activeWeapon)
      : ((CONSTANTS.WEAPONS && p.activeWeapon) ? CONSTANTS.WEAPONS[p.activeWeapon] : null);
    const weaponRange = w ? w.range : 68;
    const searchRange = Math.max(220, weaponRange + 20);

    // 1. Prioritize closest hostile monster in range (O(1) SpatialGrid query!)
    let closestMonster = null;
    const maxDummyDist = Math.max(95, weaponRange + 25);

    if (this.game.monsterGrid) {
      closestMonster = this.game.monsterGrid.findClosest(
        p.x, p.y, searchRange,
        m => m.species !== 'dummy' || Math.hypot(m.x - p.x, m.y - p.y) <= maxDummyDist
      );
    } else if (this.game.monsters) {
      let minDist = searchRange;
      for (let m of this.game.monsters) {
        if (m.isDead) continue;
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        const maxAcquireDist = (m.species === 'dummy') ? maxDummyDist : searchRange;
        if (d <= maxAcquireDist && d < minDist) {
          minDist = d;
          closestMonster = m;
        }
      }
    }

    if (closestMonster) {
      const a = Math.atan2(closestMonster.y - p.y, closestMonster.x - p.x);
      this.lastAimAngle = a;
      p.aimAngle = a;
      return { x: closestMonster.x, y: closestMonster.y };
    }

    // 2. Check closest harvestable resource (O(1) tile window lookup!) or Berry Bush near player
    let closestResource = null;
    let minResDist = Math.max(75, Math.min(weaponRange + 22, 160));

    if (this.game.world) {
      const h = this.game.world.getHarvestableAt(p.x, p.y, minResDist);
      if (h) {
        closestResource = h;
        minResDist = Math.hypot(h.x - p.x, h.y - p.y);
      }
      if (this.game.world.wildFlora) {
        for (let f of this.game.world.wildFlora) {
          if (f.isHarvested) continue;
          const d = Math.hypot(f.x - p.x, f.y - p.y);
          if (d < minResDist) {
            minResDist = d;
            closestResource = f;
          }
        }
      }
    }

    if (closestResource) {
      const a = Math.atan2(closestResource.y - p.y, closestResource.x - p.x);
      this.lastAimAngle = a;
      p.aimAngle = a;
      return { x: closestResource.x, y: closestResource.y };
    }

    // 3. Otherwise aim in movement direction or last facing angle
    const angle = (this.moveVector.x !== 0 || this.moveVector.y !== 0)
      ? Math.atan2(this.moveVector.y, this.moveVector.x)
      : (this.isUsingTouchAim ? this.lastAimAngle : p.aimAngle);
    this.lastAimAngle = angle;
    p.aimAngle = angle;

    const aimDist = Math.min(weaponRange, 90);
    return {
      x: p.x + Math.cos(angle) * aimDist,
      y: p.y + Math.sin(angle) * aimDist
    };
  }

  handleAttack() {
    if (!this.game || !this.game.player || !this.game.weapons) return;

    if (this.game.buildingManager && this.game.buildingManager.buildMode) {
      const p = this.game.player;
      const buildX = p.x + Math.cos(p.aimAngle) * 40;
      const buildY = p.y + Math.sin(p.aimAngle) * 40;
      this.game.buildingManager.updateHoverTile(buildX, buildY);
      this.game.buildingManager.placeStructure(
        this.game.buildingManager.hoverTile.col,
        this.game.buildingManager.hoverTile.row,
        this.game.buildingManager.buildMode
      );
      return;
    }

    const target = this.getSmartAimTarget();
    this.game.weapons.performBasicAttack(this.game.player, target.x, target.y);
  }

  handleDash() {
    if (!this.game || !this.game.player) return;
    const target = this.getSmartAimTarget();
    this.game.player.triggerDash(
      this.game.keys,
      target.x, target.y,
      this.game.particles,
      this.game.floatingTexts
    );
  }

  handleSkill1() {
    if (!this.game || !this.game.player || !this.game.weapons) return;
    const target = this.getSmartAimTarget();
    this.game.weapons.triggerSkill1(this.game.player, target.x, target.y);
  }

  handleSkill2() {
    if (!this.game || !this.game.player || !this.game.weapons) return;
    const target = this.getSmartAimTarget();
    this.game.weapons.triggerSkill2(this.game.player, target.x, target.y);
  }

  handleSwitchWeapon() {
    if (!this.game || !this.game.weapons) return;
    const weapons = (CONSTANTS && CONSTANTS.WEAPONS) ? Object.keys(CONSTANTS.WEAPONS) : ['SPEAR', 'STAFF', 'DAGGER', 'BOW', 'GUN'];
    const currentIdx = weapons.indexOf(this.game.player.activeWeapon);
    const nextIdx = (currentIdx + 1) % weapons.length;
    const nextKey = weapons[nextIdx];
    this.game.weapons.switchWeapon(nextKey);

    const emojis = { SPEAR: '🗡', STAFF: '🪄', DAGGER: '🔪', BOW: '🏹', GUN: '🔫' };
    const wCfg = CONSTANTS.WEAPONS ? CONSTANTS.WEAPONS[nextKey] : null;
    const switchBtn = document.getElementById('btn-touch-switch');
    if (switchBtn) {
      switchBtn.innerText = (wCfg && wCfg.emoji) ? wCfg.emoji : (emojis[nextKey] || '🗡');
    }
  }

  handleInteract() {
    if (!this.game) return;
    const p = this.game.player;
    const nearEgg = this.game.world.getAlienEggNear(p.x, p.y, 65);
    if (nearEgg) {
      this.game.world.pickupAlienEgg(nearEgg, this.game);
      return;
    }
    const struct = this.game.world.getStructureNear(p.x, p.y, 95);
    if (struct) {
      if (struct.type === 'biolab') {
        const hasReadyCrop = this.game.lab && this.game.lab.hydroPods && this.game.lab.hydroPods.some(pod => pod.seedId && pod.ready);
        const nearGreenhouse = p.y < struct.y + 42;
        this.game.lab.open((hasReadyCrop || nearGreenhouse) ? 'hydroponics' : 'lab');
        return;
      } else if (struct.type === 'furnace') {
        this.game.lab.open('furnace');
        return;
      } else if (struct.type === 'workbench') {
        this.game.lab.open('workbench');
        return;
      } else if (struct.type === 'workshop') {
        this.game.lab.open('workshop');
        return;
      }
    }
    if (this.game.world.isNearWater(p.x, p.y, 55)) {
      this.game.inventory.addItem('dirty_water', 1);
      window.audioManager.playEquip();
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 20, '+1 NƯỚC AO SÔNG Ô NHIỄM', '#65a30d', 12, 1.0));
      return;
    }
    if (this.game.buildingManager) {
      const nearDef = this.game.buildingManager.getStructureAt(p.x, p.y, 70);
      if (nearDef) {
        this.game.buildingManager.upgradeStructure(nearDef);
        return;
      }
    }
    if (this.game.lab) {
      this.game.lab.open('workbench');
    }
  }

  handleToggleBuildBar() {
    const buildBar = document.getElementById('quick-defense-bar');
    if (buildBar) {
      const isOpen = buildBar.classList.toggle('mobile-open');
      if (!isOpen && this.game && this.game.buildingManager && this.game.buildingManager.buildMode) {
        this.game.buildingManager.exitBuildMode();
      }
    }
  }

  // --- ORIENTATION CHECK ---
  checkOrientation() {
    if (!this.rotateOverlay) return;
    if (this.rotateDismissed) {
      this.rotateOverlay.style.display = 'none';
      return;
    }
    // Only suggest landscape on narrow portrait mobile screens
    const isNarrowPortrait = window.innerWidth < 560 && window.innerHeight > window.innerWidth * 1.15;
    if (isNarrowPortrait) {
      this.rotateOverlay.style.display = 'flex';
    } else {
      this.rotateOverlay.style.display = 'none';
    }
  }

  // Update cooldown badges & continuous attack on mobile buttons
  updateUI() {
    if (!this.game || !this.game.player) return;
    const p = this.game.player;

    // Continuous attack while holding Attack button
    if (this.isAttackHeld && !p.isDead) {
      this.handleAttack();
    }

    if (!this.forceShowControls) return;

    // Update build preview tile in front of player when in touch mode
    if (this.isUsingTouchAim && this.game.buildingManager && this.game.buildingManager.buildMode) {
      const previewX = p.x + Math.cos(p.aimAngle) * 40;
      const previewY = p.y + Math.sin(p.aimAngle) * 40;
      this.game.buildingManager.updateHoverTile(previewX, previewY);
    }

    if (!this._uiCache) {
      this._uiCache = {
        dashBadge: document.getElementById('touch-dash-cd'),
        s1Badge: document.getElementById('touch-s1-cd'),
        s1Label: document.getElementById('touch-s1-name'),
        s2Badge: document.getElementById('touch-s2-cd'),
        s2Label: document.getElementById('touch-s2-name'),
        interactBtn: document.getElementById('btn-touch-interact'),
        dashText: '',
        s1Text: '',
        s2Text: '',
        activeW: '',
        canInteract: false
      };
    }
    const c = this._uiCache;

    // Dash cooldown
    if (c.dashBadge) {
      const txt = p.dashTimer > 0 ? p.dashTimer.toFixed(1) + 's' : '';
      if (txt !== c.dashText) {
        c.dashText = txt;
        c.dashBadge.style.display = txt ? 'flex' : 'none';
        if (txt) c.dashBadge.innerText = txt;
      }
    }

    // Skill 1 cooldown & label
    if (c.s1Badge) {
      const txt = p.skill1CooldownTimer > 0 ? p.skill1CooldownTimer.toFixed(1) + 's' : '';
      if (txt !== c.s1Text) {
        c.s1Text = txt;
        c.s1Badge.style.display = txt ? 'flex' : 'none';
        if (txt) c.s1Badge.innerText = txt;
      }
    }

    // Skill 2 cooldown & label
    if (c.s2Badge) {
      const txt = p.skill2CooldownTimer > 0 ? p.skill2CooldownTimer.toFixed(1) + 's' : '';
      if (txt !== c.s2Text) {
        c.s2Text = txt;
        c.s2Badge.style.display = txt ? 'flex' : 'none';
        if (txt) c.s2Badge.innerText = txt;
      }
    }

    if (p.activeWeapon !== c.activeW) {
      c.activeW = p.activeWeapon;
      const w = (CONSTANTS.WEAPONS && p.activeWeapon) ? CONSTANTS.WEAPONS[p.activeWeapon] : null;
      if (c.s1Label) c.s1Label.innerText = (w && w.skill1 && w.skill1.name) ? w.skill1.name.split(' ')[0] : 'Q';
      if (c.s2Label) c.s2Label.innerText = (w && w.skill2 && w.skill2.name) ? w.skill2.name.split(' ')[0] : 'E';
    }

    // Dynamic Interact button visibility
    if (c.interactBtn) {
      const isNearStructure = !!this.game.world.getStructureNear(p.x, p.y, 95);
      const isNearWater = this.game.world.isNearWater(p.x, p.y, 55);
      const isNearEgg = !!this.game.world.getAlienEggNear(p.x, p.y, 65);
      const canInt = isNearStructure || isNearWater || isNearEgg;
      if (canInt !== c.canInteract) {
        c.canInteract = canInt;
        c.interactBtn.classList.toggle('available', canInt);
      }
    }
  }
}

// Global registry
window.MobileController = MobileController;

