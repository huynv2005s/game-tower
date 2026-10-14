// Mobile Touch Controls & Orientation Manager
// Features: Virtual Joystick, Large Touch Action Buttons, Auto-Aim Assist, Landscape Prompt

class MobileController {
  constructor(game) {
    this.game = game;
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
    this.forceShowControls = false;

    // Joystick state
    this.joystickTouchId = null;
    this.joystickBase = null;
    this.joystickKnob = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.maxRadius = 45; // Maximum travel distance for knob in pixels
    this.moveVector = { x: 0, y: 0 };

    // Overlay elements
    this.container = null;
    this.rotateOverlay = null;

    this.initDOM();
    this.bindEvents();
    this.checkOrientation();
  }

  initDOM() {
    this.container = document.getElementById('mobile-controls');
    this.rotateOverlay = document.getElementById('rotate-device-overlay');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickKnob = document.getElementById('joystick-knob');

    // Auto-display if touch device detected or enabled
    this.updateControlsVisibility();
  }

  updateControlsVisibility() {
    if (!this.container) return;
    const shouldShow = this.isTouchDevice || this.forceShowControls;
    this.container.style.display = shouldShow ? 'block' : 'none';

    // Update toggle button state in HUD
    const toggleBtn = document.getElementById('btn-toggle-touch');
    if (toggleBtn) {
      if (shouldShow) {
        toggleBtn.classList.add('active');
        toggleBtn.innerHTML = '📱 CẢM ỨNG: BẬT';
      } else {
        toggleBtn.classList.remove('active');
        toggleBtn.innerHTML = '📱 CẢM ỨNG: TẮT';
      }
    }
  }

  toggleControls() {
    this.forceShowControls = !this.forceShowControls;
    this.updateControlsVisibility();
    if (this.game && this.game.floatingTexts && this.game.player) {
      const msg = this.forceShowControls ? '📱 ĐÃ BẬT PHÍM ẢO CẢM ỨNG' : '📱 ĐÃ ẨN PHÍM ẢO CẢM ỨNG';
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 30, msg, '#38bdf8', 12, 1.2));
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

      // Mouse fallback for joystick testing in desktop browser
      joystickZone.addEventListener('mousedown', (e) => this.onJoystickMouseDown(e));
    }

    // Touch Action Buttons
    this.bindActionButton('btn-touch-attack', () => this.handleAttack());
    this.bindActionButton('btn-touch-dash', () => this.handleDash());
    this.bindActionButton('btn-touch-skill1', () => this.handleSkill1());
    this.bindActionButton('btn-touch-skill2', () => this.handleSkill2());
    this.bindActionButton('btn-touch-switch', () => this.handleSwitchWeapon());
    this.bindActionButton('btn-touch-interact', () => this.handleInteract());
    this.bindActionButton('btn-touch-build', () => this.handleToggleBuildBar());

    // Prevent default browser touch interactions (pinch-to-zoom, pull-to-refresh)
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

    // Orientation change listener
    window.addEventListener('resize', () => {
      this.checkOrientation();
      if (this.game) this.game.resizeCanvas();
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.checkOrientation();
        if (this.game) this.game.resizeCanvas();
      }, 200);
    });
  }

  bindActionButton(elementId, callback) {
    const btn = document.getElementById(elementId);
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.audioManager.ensureContext();
      btn.classList.add('pressed');
      callback();
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.classList.remove('pressed');
    }, { passive: false });

    btn.addEventListener('touchcancel', (e) => {
      btn.classList.remove('pressed');
    }, { passive: false });

    // Mouse fallback
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.audioManager.ensureContext();
      callback();
    });
  }

  // --- JOYSTICK LOGIC ---
  onJoystickTouchStart(e) {
    e.preventDefault();
    if (this.joystickTouchId !== null) return; // Already tracking a finger

    const touch = e.changedTouches[0];
    this.joystickTouchId = touch.identifier;

    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    this.updateJoystickPosition(touch.clientX, touch.clientY);
  }

  onJoystickTouchMove(e) {
    if (this.joystickTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        e.preventDefault();
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
  }

  onJoystickMouseDown(e) {
    if (this.isTouchDevice) return;
    e.preventDefault();

    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

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
    if (this.game && this.game.player && factor > 0.15) {
      this.game.player.aimAngle = angle;
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

    // Check closest monster in 220px range
    let closestMonster = null;
    let minDist = 220;

    if (this.game.monsters) {
      for (let m of this.game.monsters) {
        if (m.isDead) continue;
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d < minDist) {
          minDist = d;
          closestMonster = m;
        }
      }
    }

    if (closestMonster) {
      return { x: closestMonster.x, y: closestMonster.y };
    }

    // Otherwise aim in movement direction or facing angle
    const angle = p.aimAngle;
    return {
      x: p.x + Math.cos(angle) * 120,
      y: p.y + Math.sin(angle) * 120
    };
  }

  handleAttack() {
    if (!this.game || !this.game.player || !this.game.weapons) return;
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
    const weapons = ['SPEAR', 'STAFF', 'DAGGER', 'BOW'];
    const currentIdx = weapons.indexOf(this.game.player.activeWeapon);
    const nextIdx = (currentIdx + 1) % weapons.length;
    this.game.weapons.switchWeapon(weapons[nextIdx]);

    const iconCanvas = window.pixelArt.get(`weapon_${weapons[nextIdx].toLowerCase()}`);
    const switchBtn = document.getElementById('btn-touch-switch');
    if (switchBtn && iconCanvas) {
      switchBtn.style.backgroundImage = `url(${iconCanvas.toDataURL()})`;
    }
  }

  handleInteract() {
    if (!this.game) return;
    // Emulate KeyF
    const p = this.game.player;
    const struct = this.game.world.getStructureNear(p.x, p.y, 90);
    if (struct) {
      if (struct.type === 'biolab') {
        this.game.lab.open('lab');
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
    if (this.game.world.isNearWater(p.x, p.y, 50)) {
      this.game.inventory.addItem('dirty_water', 1);
      window.audioManager.playEquip();
      this.game.floatingTexts.push(new FloatingText(p.x, p.y - 20, '+1 NƯỚC AO SÔNG Ô NHIỄM', '#65a30d', 12, 1.0));
    }
  }

  handleToggleBuildBar() {
    const buildBar = document.getElementById('quick-defense-bar');
    if (buildBar) {
      buildBar.classList.toggle('mobile-open');
    }
  }

  // --- ORIENTATION CHECK ---
  checkOrientation() {
    if (!this.rotateOverlay) return;
    // Check if screen is in portrait (height > width) on small/medium mobile devices
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait) {
      this.rotateOverlay.style.display = 'flex';
    } else {
      this.rotateOverlay.style.display = 'none';
    }
  }

  // Update cooldown badges on mobile buttons
  updateUI() {
    if (!this.game || !this.game.player) return;
    const p = this.game.player;

    // Dash cooldown
    const dashBadge = document.getElementById('touch-dash-cd');
    if (dashBadge) {
      if (p.dashTimer > 0) {
        dashBadge.style.display = 'block';
        dashBadge.innerText = p.dashTimer.toFixed(1) + 's';
      } else {
        dashBadge.style.display = 'none';
      }
    }

    // Skill 1 cooldown & label
    const s1Badge = document.getElementById('touch-s1-cd');
    const s1Label = document.getElementById('touch-s1-name');
    if (s1Badge) {
      if (p.skill1CooldownTimer > 0) {
        s1Badge.style.display = 'block';
        s1Badge.innerText = p.skill1CooldownTimer.toFixed(1) + 's';
      } else {
        s1Badge.style.display = 'none';
      }
    }
    const w = (CONSTANTS.WEAPONS && p.activeWeapon) ? CONSTANTS.WEAPONS[p.activeWeapon] : null;
    if (s1Label && w && w.skill1 && w.skill1.name) {
      s1Label.innerText = w.skill1.name.split(' ')[0];
    } else if (s1Label) {
      s1Label.innerText = 'Q';
    }

    // Skill 2 cooldown & label
    const s2Badge = document.getElementById('touch-s2-cd');
    const s2Label = document.getElementById('touch-s2-name');
    if (s2Badge) {
      if (p.skill2CooldownTimer > 0) {
        s2Badge.style.display = 'block';
        s2Badge.innerText = p.skill2CooldownTimer.toFixed(1) + 's';
      } else {
        s2Badge.style.display = 'none';
      }
    }
    if (s2Label && w && w.skill2 && w.skill2.name) {
      s2Label.innerText = w.skill2.name.split(' ')[0];
    } else if (s2Label) {
      s2Label.innerText = 'E';
    }

    // Dynamic Interact button visibility
    const interactBtn = document.getElementById('btn-touch-interact');
    if (interactBtn) {
      const isNearStructure = !!this.game.world.getStructureNear(p.x, p.y, 85);
      const isNearWater = this.game.world.isNearWater(p.x, p.y, 50);
      if (isNearStructure || isNearWater) {
        interactBtn.classList.add('available');
      } else {
        interactBtn.classList.remove('available');
      }
    }
  }
}

// Global registry
window.MobileController = MobileController;
