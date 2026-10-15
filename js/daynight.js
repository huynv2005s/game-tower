// Day / Night Cycle & Environmental Infection Manager (Optimized with Persistent Half-Res Lighting Buffer)

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

    // Persistent offscreen canvas for dynamic lighting (Eliminates per-frame DOM canvas creation lag!)
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  update(dt) {
    this.time += dt;
    if (this.time >= this.dayDuration) {
      this.time = 0;
      this.dayCount++;
      if (this.game && this.game.floatingTexts) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 40, `BẮT ĐẦU NGÀY MỚI ${this.dayCount}!`, '#facc15', 15, 2.0));
      }
      if (this.game && this.game.world) {
        this.game.world.onNewDay(this.dayCount, this.game);
      }
    }

    const progress = this.time / this.dayDuration; // 0.0 -> 1.0
    const dayEnd = this.dayRatio; // 0.65

    if (progress < dayEnd) {
      this.isNight = false;
      if (progress < 0.1) {
        const t = progress / 0.1;
        this.lightLevel = 0.3 + 0.7 * t;
        this.ambientColor = `rgba(249, 115, 22, ${(0.4 * (1 - t)).toFixed(2)})`;
      } else if (progress > dayEnd - 0.1) {
        const t = (progress - (dayEnd - 0.1)) / 0.1;
        this.lightLevel = 1.0 - 0.6 * t;
        this.ambientColor = `rgba(244, 63, 94, ${(0.45 * t).toFixed(2)})`;
      } else {
        this.lightLevel = 1.0;
        this.ambientColor = 'rgba(0, 0, 0, 0)';
      }
    } else {
      this.isNight = true;
      this.lightLevel = 0.12;
      this.ambientColor = 'rgba(10, 10, 35, 0.82)';
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
      const isSheltered = this.game.world && this.game.world.isInsideIsolation(this.game.player.x, this.game.player.y);
      if (!isSheltered) {
        const rate = 0.35 * dt;
        this.game.player.addInfection(rate, '', false);
      }
    }
  }

  // Render dynamic lighting & flashlight beam using persistent half-res offscreen buffer (4x faster GPU performance!)
  renderLighting(ctx, camera, player) {
    if (this.lightLevel >= 0.95) return;

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const scale = 0.5;
    const lw = Math.max(1, Math.ceil(w * scale));
    const lh = Math.max(1, Math.ceil(h * scale));

    if (this.lightCanvas.width !== lw || this.lightCanvas.height !== lh) {
      this.lightCanvas.width = lw;
      this.lightCanvas.height = lh;
    }

    const octx = this.lightCtx;
    octx.globalCompositeOperation = 'source-over';
    octx.clearRect(0, 0, lw, lh);

    // Fill with ambient night color
    octx.fillStyle = this.ambientColor;
    octx.fillRect(0, 0, lw, lh);

    // Carve light sources
    octx.globalCompositeOperation = 'destination-out';

    // 1. Player's lantern beam
    const px = (player.x - camera.x) * scale;
    const py = (player.y - camera.y) * scale;
    const lanternRadius = (this.isNight ? 175 : 240) * scale;

    const grad = octx.createRadialGradient(px, py, 10 * scale, px, py, lanternRadius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    octx.fillStyle = grad;
    octx.beginPath();
    octx.arc(px, py, lanternRadius, 0, Math.PI * 2);
    octx.fill();

    // 2. Bio-Lab Safe Zone & Upgraded Turrets also emit soft light at night
    if (this.isNight && this.game && this.game.world) {
      for (let s of this.game.world.structures) {
        if (s.type === 'biolab') {
          const bx = (s.x + s.width / 2 - camera.x) * scale;
          const by = (s.y + s.height / 2 - camera.y) * scale;
          const br = s.isolationRadius * scale;
          if (bx + br >= 0 && bx - br <= lw && by + br >= 0 && by - br <= lh) {
            const bGrad = octx.createRadialGradient(bx, by, 10, bx, by, br);
            bGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
            bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            octx.fillStyle = bGrad;
            octx.beginPath();
            octx.arc(bx, by, br, 0, Math.PI * 2);
            octx.fill();
          }
        }
      }
    }

    // Draw scaled lighting buffer onto main canvas
    ctx.drawImage(this.lightCanvas, 0, 0, lw, lh, 0, 0, w, h);
  }

  triggerNightWave() {
    if (!this.game || !this.game.world) return;

    const unhatchedEggs = this.game.world.harvestables.filter(h => h.type === 'alien_egg' && !h.isDestroyed);
    const eggCount = unhatchedEggs.length;

    const baseCount = 4 + this.dayCount * 3;
    const eggBonus = eggCount;
    const totalWave = baseCount + eggBonus;

    window.audioManager.playNightGong();
    if (this.game.floatingTexts) {
      this.game.floatingTexts.push(new FloatingText(
        this.game.player.x, this.game.player.y - 60,
        `⚔ ĐỢT TẤN CÔNG ĐÊM ${this.dayCount}: ${totalWave} QUÁI VẬT (${eggCount} TỪ TRỨNG NỞ)! ⚔`,
        '#ef4444', 15, 4.0
      ));
    }

    const eggsToHatch = Math.min(unhatchedEggs.length, 2 + this.dayCount);
    for (let i = 0; i < eggsToHatch; i++) {
      const egg = unhatchedEggs[i];
      for (let k = 0; k < 6; k++) {
        this.game.particles.push(new Particle(egg.x, egg.y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, '#a855f7', 4, 0.35));
      }
      const sp = (this.dayCount >= 2 && Math.random() < 0.4) ? 'exploder' : 'crawler';
      this.game.monsters.push(new Monster(egg.x, egg.y, sp, `Xenomorph Nở Từ Trứng (#${i + 1})`));
    }

    const spawnPoints = [
      { x: 38 * CONSTANTS.TILE_SIZE, y: 10 * CONSTANTS.TILE_SIZE },
      { x: 25 * CONSTANTS.TILE_SIZE, y: 12 * CONSTANTS.TILE_SIZE },
      { x: 55 * CONSTANTS.TILE_SIZE, y: 12 * CONSTANTS.TILE_SIZE },
      { x: 12 * CONSTANTS.TILE_SIZE, y: 34 * CONSTANTS.TILE_SIZE },
      { x: 68 * CONSTANTS.TILE_SIZE, y: 34 * CONSTANTS.TILE_SIZE }
    ];

    const remainingToSpawn = Math.max(1, totalWave - eggsToHatch);
    for (let i = 0; i < remainingToSpawn; i++) {
      const sp = spawnPoints[i % spawnPoints.length];
      const offsetX = (Math.random() - 0.5) * 64;
      const offsetY = (Math.random() - 0.5) * 64;

      let species = 'crawler';
      const rand = Math.random();

      if (this.dayCount >= 3 || (this.dayCount >= 2 && eggCount >= 5)) {
        if (i === 0) {
          species = 'behemoth';
        } else if (rand < 0.35) {
          species = 'exploder';
        } else if (rand < 0.65) {
          species = 'spitter';
        } else {
          species = 'crawler';
        }
      } else if (this.dayCount >= 2 || eggCount >= 3) {
        if (rand < 0.35) {
          species = 'exploder';
        } else if (rand < 0.6) {
          species = 'spitter';
        } else {
          species = 'crawler';
        }
      } else {
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
