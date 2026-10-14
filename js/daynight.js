// Day / Night Cycle & Environmental Infection Manager

class DayNightSystem {
  constructor(game) {
    this.game = game;
    this.dayDuration = CONSTANTS.DAY_DURATION_SEC; // 120s per full cycle
    this.dayRatio = CONSTANTS.DAY_RATIO;          // 65% day, 35% night
    this.time = 0; // seconds into current cycle
    this.dayCount = 1;
    this.isNight = false;
    this.lightLevel = 1.0; // 1.0 = full daylight, 0.15 = dark night

    this.ambientColor = 'rgba(0, 0, 0, 0)';
    this.lastStateWasNight = false;
  }

  update(dt) {
    this.time += dt;
    if (this.time >= this.dayDuration) {
      this.time = 0;
      this.dayCount++;
      if (this.game && this.game.floatingTexts) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 40, `BẮT ĐẦU NGÀY MỚI ${this.dayCount}!`, '#facc15', 15, 2.0));
      }
      // Trigger New Day event on world
      if (this.game && this.game.world) {
        this.game.world.onNewDay(this.dayCount, this.game);
      }
    }

    const progress = this.time / this.dayDuration; // 0.0 -> 1.0
    const dayEnd = this.dayRatio; // 0.65

    if (progress < dayEnd) {
      // Daytime
      this.isNight = false;
      // Sunrise transition
      if (progress < 0.1) {
        const t = progress / 0.1;
        this.lightLevel = 0.3 + 0.7 * t;
        this.ambientColor = `rgba(249, 115, 22, ${0.4 * (1 - t)})`; // Dawn orange
      } else if (progress > dayEnd - 0.1) {
        // Sunset transition
        const t = (progress - (dayEnd - 0.1)) / 0.1;
        this.lightLevel = 1.0 - 0.6 * t;
        this.ambientColor = `rgba(244, 63, 94, ${0.45 * t})`; // Sunset pink/red
      } else {
        // Full daylight
        this.lightLevel = 1.0;
        this.ambientColor = 'rgba(0, 0, 0, 0)';
      }
    } else {
      // Nighttime
      this.isNight = true;
      this.lightLevel = 0.12; // deep dark
      this.ambientColor = 'rgba(10, 10, 35, 0.82)'; // Deep alien indigo darkness
    }

    // Audio gongs, Night assault & Auto-Save on state flip
    if (this.isNight && !this.lastStateWasNight) {
      this.lastStateWasNight = true;
      this.triggerNightWave();
      if (this.game && this.game.saveManager) {
        this.game.saveManager.saveGame(true);
      }
    } else if (!this.isNight && this.lastStateWasNight) {
      this.lastStateWasNight = false;
      window.audioManager.playDayGong();
      if (this.game && this.game.floatingTexts) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 45, '☀ BÌNH MINH: QUÁI VẬT TẠM RÚT LUI ☀', '#38bdf8', 16, 2.5));
      }
      if (this.game && this.game.saveManager) {
        this.game.saveManager.saveGame(true);
      }
    }

    // Environmental Night Infection
    if (this.isNight && this.game.player && !this.game.player.isDead) {
      // Check if player is safely sheltered inside Bio-Lab Isolation Zone
      const isSheltered = this.game.world && this.game.world.isInsideIsolation(this.game.player.x, this.game.player.y);
      if (!isSheltered) {
        // Exposed to outside toxic air
        const rate = 0.35 * dt;
        this.game.player.addInfection(rate);
      }
    }
  }

  // Render dynamic lighting & flashlight beam
  renderLighting(ctx, camera, player) {
    if (this.lightLevel >= 0.95) return; // Daylight, no dark overlay needed

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Create dark offscreen overlay
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = w;
    overlayCanvas.height = h;
    const octx = overlayCanvas.getContext('2d');

    // Fill with ambient night color
    octx.fillStyle = this.ambientColor;
    octx.fillRect(0, 0, w, h);

    // Carve player's lantern / flashlight beam (clear radial gradient)
    octx.globalCompositeOperation = 'destination-out';
    const px = player.x - camera.x;
    const py = player.y - camera.y;

    const lanternRadius = this.isNight ? 160 : 240;
    const grad = octx.createRadialGradient(px, py, 20, px, py, lanternRadius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    octx.fillStyle = grad;
    octx.beginPath();
    octx.arc(px, py, lanternRadius, 0, Math.PI * 2);
    octx.fill();

    // Reset composite operation & draw to main screen
    ctx.drawImage(overlayCanvas, 0, 0);
  }

  triggerNightWave() {
    if (!this.game || !this.game.world) return;

    const unhatchedEggs = this.game.world.harvestables.filter(h => h.type === 'alien_egg' && !h.isDestroyed);
    const eggCount = unhatchedEggs.length;

    // 1. Calculate Wave Composition based on Day and Eggs
    // Base count grows with days: Day 1: 7, Day 2: 11, Day 3: 15, etc.
    const baseCount = 4 + this.dayCount * 3;
    // Each unhatched egg adds 1 extra alien to the night assault!
    const eggBonus = eggCount;
    const totalWave = baseCount + eggBonus;

    // Audio & Big announcement
    window.audioManager.playNightGong();
    if (this.game.floatingTexts) {
      this.game.floatingTexts.push(new FloatingText(
        this.game.player.x, this.game.player.y - 60,
        `⚔ ĐỢT TẤN CÔNG ĐÊM ${this.dayCount}: ${totalWave} QUÁI VẬT (${eggCount} TỪ TRỨNG NỞ)! ⚔`,
        '#ef4444', 15, 4.0
      ));
    }

    // 2. Hatch Mountain Eggs directly
    const eggsToHatch = Math.min(unhatchedEggs.length, 2 + this.dayCount);
    for (let i = 0; i < eggsToHatch; i++) {
      const egg = unhatchedEggs[i];
      // Purple hatching smoke particles
      for (let k = 0; k < 10; k++) {
        this.game.particles.push(new Particle(egg.x, egg.y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, '#a855f7', 4, 0.4));
      }
      // Species hatched from egg
      const sp = (this.dayCount >= 2 && Math.random() < 0.4) ? 'exploder' : 'crawler';
      this.game.monsters.push(new Monster(egg.x, egg.y, sp, `Xenomorph Nở Từ Trứng (#${i + 1})`));
    }

    // 3. Spawn Assault Wave at Map Borders / Mountain Edge marching to central base
    const spawnPoints = [
      { x: 38 * CONSTANTS.TILE_SIZE, y: 10 * CONSTANTS.TILE_SIZE }, // North Mountain pass
      { x: 25 * CONSTANTS.TILE_SIZE, y: 12 * CONSTANTS.TILE_SIZE }, // North-West ridge
      { x: 55 * CONSTANTS.TILE_SIZE, y: 12 * CONSTANTS.TILE_SIZE }, // North-East ridge
      { x: 12 * CONSTANTS.TILE_SIZE, y: 34 * CONSTANTS.TILE_SIZE }, // West Plains
      { x: 68 * CONSTANTS.TILE_SIZE, y: 34 * CONSTANTS.TILE_SIZE }  // East Plains
    ];

    const remainingToSpawn = Math.max(1, totalWave - eggsToHatch);
    for (let i = 0; i < remainingToSpawn; i++) {
      const sp = spawnPoints[i % spawnPoints.length];
      const offsetX = (Math.random() - 0.5) * 64;
      const offsetY = (Math.random() - 0.5) * 64;

      // Select species according to Day & Eggs
      let species = 'crawler';
      const rand = Math.random();

      if (this.dayCount >= 3 || (this.dayCount >= 2 && eggCount >= 5)) {
        // High threat tier
        if (i === 0) {
          species = 'behemoth'; // Titan Behemoth Boss
        } else if (rand < 0.35) {
          species = 'exploder'; // Kamikaze
        } else if (rand < 0.65) {
          species = 'spitter';  // Acid Spitter
        } else {
          species = 'crawler';
        }
      } else if (this.dayCount >= 2 || eggCount >= 3) {
        // Medium threat tier
        if (rand < 0.35) {
          species = 'exploder';
        } else if (rand < 0.6) {
          species = 'spitter';
        } else {
          species = 'crawler';
        }
      } else {
        // Day 1: Mostly crawlers, rare exploder if many eggs
        if (eggCount >= 4 && rand < 0.3) {
          species = 'exploder';
        } else {
          species = 'crawler';
        }
      }

      const m = new Monster(sp.x + offsetX, sp.y + offsetY, species);
      this.game.monsters.push(m);
    }
  }

  getTimeFormatted() {
    // Convert cycle time to 24h clock: 06:00 is sunrise (time = 0)
    const hourFloat = (6 + (this.time / this.dayDuration) * 24) % 24;
    const hour = Math.floor(hourFloat);
    const minute = Math.floor((hourFloat - hour) * 60);
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

// Global registry
window.DayNightSystem = DayNightSystem;
