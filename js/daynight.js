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

    // Queued wave spawns for massive 10x Blood Moon nights (prevents single-frame lag spike)
    this.pendingWaveSpawns = [];
    this.waveSpawnTimer = 0;

    // Persistent offscreen canvas for dynamic lighting (Eliminates per-frame DOM canvas creation lag!)
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  isBloodMoonDay(day = this.dayCount) {
    const interval = (CONSTANTS && CONSTANTS.BLOOD_MOON_INTERVAL_DAYS) ? CONSTANTS.BLOOD_MOON_INTERVAL_DAYS : 15;
    return day > 0 && (day % interval === 0);
  }

  isBloodMoonNight() {
    return this.isNight && this.isBloodMoonDay(this.dayCount);
  }

  getNextBloodMoonDay() {
    const interval = (CONSTANTS && CONSTANTS.BLOOD_MOON_INTERVAL_DAYS) ? CONSTANTS.BLOOD_MOON_INTERVAL_DAYS : 15;
    const rem = this.dayCount % interval;
    return rem === 0 ? this.dayCount : (this.dayCount + (interval - rem));
  }

  update(dt) {
    this.time += dt;
    if (this.time >= this.dayDuration) {
      this.time = 0;
      this.dayCount++;
      this.pendingWaveSpawns = [];

      if (this.game && this.game.floatingTexts) {
        if (this.isBloodMoonDay(this.dayCount)) {
          const bmMsg = `🩸 CẢNH BÁO NGÀY ${this.dayCount}: ĐÊM NAY LÀ TRĂNG MÁU - QUÁI VẬT ĐÔNG GẤP 10 LẦN! 🩸`;
          this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 48, bmMsg, '#ef4444', 15, 4.0));
          if (this.game.saveManager) this.game.saveManager.showSaveToast(bmMsg);
        } else if (this.getNextBloodMoonDay() - this.dayCount === 1) {
          const warnMsg = `⚠️ CẢNH BÁO: NGÀY MAI (NGÀY ${this.dayCount + 1}) SẼ XUẤT HIỆN TRĂNG MÁU (QUÁI X10)!`;
          this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 45, warnMsg, '#f97316', 14, 3.2));
          if (this.game.saveManager) this.game.saveManager.showSaveToast(warnMsg);
        } else {
          this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 40, `BẮT ĐẦU NGÀY MỚI ${this.dayCount}!`, '#facc15', 15, 2.0));
        }
      }
      if (this.game && this.game.world) {
        this.game.world.onNewDay(this.dayCount, this.game);
      }
    }

    const progress = this.time / this.dayDuration; // 0.0 -> 1.0
    const dayEnd = this.dayRatio; // 0.65
    const bloodMoonToday = this.isBloodMoonDay(this.dayCount);

    if (progress < dayEnd) {
      this.isNight = false;
      if (progress < 0.1) {
        const t = progress / 0.1;
        this.lightLevel = 0.3 + 0.7 * t;
        this.ambientColor = `rgba(249, 115, 22, ${(0.4 * (1 - t)).toFixed(2)})`;
      } else if (progress > dayEnd - 0.1) {
        const t = (progress - (dayEnd - 0.1)) / 0.1;
        this.lightLevel = 1.0 - 0.6 * t;
        this.ambientColor = bloodMoonToday
          ? `rgba(185, 28, 28, ${(0.62 * t).toFixed(2)})`
          : `rgba(244, 63, 94, ${(0.45 * t).toFixed(2)})`;
      } else {
        this.lightLevel = 1.0;
        this.ambientColor = bloodMoonToday ? 'rgba(153, 27, 27, 0.10)' : 'rgba(0, 0, 0, 0)';
      }
    } else {
      this.isNight = true;
      if (bloodMoonToday) {
        this.lightLevel = 0.14;
        this.ambientColor = 'rgba(72, 6, 18, 0.82)';
      } else {
        this.lightLevel = 0.12;
        this.ambientColor = 'rgba(10, 10, 35, 0.82)';
      }
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
      this.pendingWaveSpawns = [];
      window.audioManager.playDayGong();
      if (this.game && this.game.floatingTexts) {
        this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 45, '☀ BÌNH MINH: QUÁI VẬT TẠM RÚT LUI ☀', '#38bdf8', 16, 2.5));
      }
      if (this.game && this.game.saveManager) {
        this.game.saveManager.saveGame(true);
      }
    }

    // Stream queued reinforcements smoothly during Night / Blood Moon
    if (this.isNight && this.pendingWaveSpawns.length > 0 && this.game && this.game.monsters) {
      this.waveSpawnTimer -= dt;
      if (this.waveSpawnTimer <= 0) {
        this.waveSpawnTimer = 0.35;
        const batchSize = Math.min(this.pendingWaveSpawns.length, 14);
        for (let b = 0; b < batchSize; b++) {
          const spec = this.pendingWaveSpawns.shift();
          if (spec) {
            this.game.monsters.push(new Monster(spec.x, spec.y, spec.species, spec.customName));
          }
        }
      }
    }

    // Environmental Night Infection (intensified during Blood Moon)
    if (this.isNight && this.game.player && !this.game.player.isDead) {
      const isSheltered = this.game.world && this.game.world.isInsideIsolation(this.game.player.x, this.game.player.y);
      if (!isSheltered) {
        const rate = (bloodMoonToday ? 0.55 : 0.35) * dt;
        this.game.player.addInfection(rate, '', false);
      }
    }
  }

  // Render dynamic lighting & flashlight beam using persistent half-res offscreen buffer (4x faster GPU performance!)
  renderLighting(ctx, camera, player) {
    if (this.lightLevel >= 0.95 && !this.isBloodMoonDay(this.dayCount)) return;

    const w = Math.ceil(camera.width);
    const h = Math.ceil(camera.height);
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

    // Fill with ambient night / Blood Moon color
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

  pickWaveMonsterSpecies(index, eggCount, isBloodMoon) {
    const rand = Math.random();
    if (isBloodMoon) {
      if (index % 25 === 0) return 'behemoth';
      if (rand < 0.25) return 'frost_spitter';
      if (rand < 0.48) return 'spitter';
      if (rand < 0.72) return 'exploder';
      return 'crawler';
    }

    if (this.dayCount >= 3 || (this.dayCount >= 2 && eggCount >= 5)) {
      if (index === 0) return 'behemoth';
      if (rand < 0.24) return 'frost_spitter';
      if (rand < 0.46) return 'spitter';
      if (rand < 0.70) return 'exploder';
      return 'crawler';
    } else if (this.dayCount >= 2 || eggCount >= 3) {
      if (rand < 0.24) return 'frost_spitter';
      if (rand < 0.45) return 'spitter';
      if (rand < 0.70) return 'exploder';
      return 'crawler';
    } else {
      if (rand < 0.25) return 'frost_spitter';
      if (eggCount >= 4 && rand < 0.45) return 'exploder';
      return 'crawler';
    }
  }

  triggerNightWave() {
    if (!this.game || !this.game.world) return;

    const unhatchedEggs = this.game.world.harvestables.filter(h => h.type === 'alien_egg' && !h.isDestroyed);
    const eggCount = unhatchedEggs.length;

    const baseCount = 4 + this.dayCount * 3;
    const eggBonus = eggCount;
    const normalWave = baseCount + eggBonus;

    const isBloodMoon = this.isBloodMoonDay(this.dayCount);
    const multiplier = isBloodMoon ? (CONSTANTS.BLOOD_MOON_MULTIPLIER || 10) : 1;
    const totalWave = normalWave * multiplier;

    window.audioManager.playNightGong();
    if (this.game.floatingTexts) {
      const waveBanner = isBloodMoon
        ? `🩸 ĐÊM TRĂNG MÁU NGÀY ${this.dayCount}: ${totalWave} QUÁI VẬT (GẤP ${multiplier} LẦN BÌNH THƯỜNG)! 🩸`
        : `⚔ ĐỢT TẤN CÔNG ĐÊM ${this.dayCount}: ${totalWave} QUÁI VẬT (${eggCount} TỪ TRỨNG NỞ)! ⚔`;
      this.game.floatingTexts.push(new FloatingText(
        this.game.player.x, this.game.player.y - 60,
        waveBanner,
        '#ef4444', isBloodMoon ? 16 : 15, isBloodMoon ? 5.0 : 4.0
      ));
      if (isBloodMoon && this.game.saveManager) {
        this.game.saveManager.showSaveToast(waveBanner);
      }
    }

    this.pendingWaveSpawns = [];
    this.waveSpawnTimer = 0.35;

    const eggsToHatch = Math.min(unhatchedEggs.length, isBloodMoon ? unhatchedEggs.length : (2 + this.dayCount));
    for (let i = 0; i < eggsToHatch; i++) {
      const egg = unhatchedEggs[i];
      for (let k = 0; k < 6; k++) {
        this.game.particles.push(new Particle(egg.x, egg.y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, '#a855f7', 4, 0.35));
      }
      const sp = this.pickWaveMonsterSpecies(i + 1, eggCount, isBloodMoon);
      const safeEggPos = this.game.world.findSafeSpawnPoint(egg.x, egg.y, 18);
      this.game.monsters.push(new Monster(safeEggPos.x, safeEggPos.y, sp, `Xenomorph Nở Từ Trứng (#${i + 1})`));
    }

    // Safe land spawn points (completely avoiding col 52..57 river water & snow peaks)
    const spawnPoints = [
      { x: 38 * CONSTANTS.TILE_SIZE, y: 14 * CONSTANTS.TILE_SIZE },
      { x: 22 * CONSTANTS.TILE_SIZE, y: 15 * CONSTANTS.TILE_SIZE },
      { x: 46 * CONSTANTS.TILE_SIZE, y: 16 * CONSTANTS.TILE_SIZE },
      { x: 64 * CONSTANTS.TILE_SIZE, y: 19 * CONSTANTS.TILE_SIZE },
      { x: 14 * CONSTANTS.TILE_SIZE, y: 33 * CONSTANTS.TILE_SIZE },
      { x: 66 * CONSTANTS.TILE_SIZE, y: 34 * CONSTANTS.TILE_SIZE },
      { x: 20 * CONSTANTS.TILE_SIZE, y: 50 * CONSTANTS.TILE_SIZE },
      { x: 48 * CONSTANTS.TILE_SIZE, y: 50 * CONSTANTS.TILE_SIZE }
    ];

    const remainingToSpawn = Math.max(1, totalWave - eggsToHatch);
    const immediateCap = isBloodMoon ? 50 : remainingToSpawn;

    for (let i = 0; i < remainingToSpawn; i++) {
      const sp = spawnPoints[i % spawnPoints.length];
      const offsetX = (Math.random() - 0.5) * 80;
      const offsetY = (Math.random() - 0.5) * 80;
      const species = this.pickWaveMonsterSpecies(i, eggCount, isBloodMoon);
      const safePos = this.game.world.findSafeSpawnPoint(sp.x + offsetX, sp.y + offsetY, 18);
      const customName = isBloodMoon ? `Quái Trăng Máu (${CONSTANTS.MONSTER_SPECIES[species] ? CONSTANTS.MONSTER_SPECIES[species].name : species})` : null;

      if (i < immediateCap) {
        this.game.monsters.push(new Monster(safePos.x, safePos.y, species, customName));
      } else {
        this.pendingWaveSpawns.push({ x: safePos.x, y: safePos.y, species, customName });
      }
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
