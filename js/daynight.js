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

    // Dynamic Weather & Apocalyptic Phenomenon System ('CLEAR', 'ACID_RAIN', 'EMP_STORM', 'BLOOD_MOON')
    this.currentWeather = 'CLEAR';
    this.weatherAnimTimer = 0;
    this.empLightningTimer = 3.5;
    this.lightningFlashAlpha = 0;

    // Persistent offscreen canvas for dynamic lighting (Eliminates per-frame DOM canvas creation lag!)
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  getWeatherConfig(weatherId = this.currentWeather) {
    const map = (CONSTANTS && CONSTANTS.WEATHER_TYPES) ? CONSTANTS.WEATHER_TYPES : {};
    return map[weatherId] || map.CLEAR || { id: 'CLEAR', name: 'Quang Đãng', icon: '☀', color: '#38bdf8', desc: '' };
  }

  rollDailyWeather() {
    if (this.isBloodMoonDay(this.dayCount)) {
      this.setWeather('BLOOD_MOON', true);
      return;
    }
    const r = Math.random();
    if (r < 0.34) {
      this.setWeather('ACID_RAIN', true);
    } else if (r < 0.64) {
      this.setWeather('EMP_STORM', true);
    } else {
      this.setWeather('CLEAR', false);
    }
  }

  setWeather(weatherId, announce = true) {
    if (!CONSTANTS.WEATHER_TYPES || !CONSTANTS.WEATHER_TYPES[weatherId]) {
      weatherId = 'CLEAR';
    }
    this.currentWeather = weatherId;
    const cfg = this.getWeatherConfig(weatherId);

    if (announce && this.game && this.game.player && this.game.floatingTexts) {
      const msg = `${cfg.icon} THỜI TIẾT: ${cfg.name.toUpperCase()} — ${cfg.desc}`;
      this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 52, `${cfg.icon} ${cfg.name.toUpperCase()}!`, cfg.color, 14, 2.6));
      if (this.game.saveManager) this.game.saveManager.showSaveToast(msg);
    }
    if (this.game && this.game.updateHUD) {
      this.game.updateHUD(true);
    }
  }

  cycleWeatherManually() {
    const order = ['CLEAR', 'ACID_RAIN', 'EMP_STORM', 'BLOOD_MOON'];
    const idx = order.indexOf(this.currentWeather);
    const nextId = order[(idx + 1) % order.length];
    if (window.audioManager) window.audioManager.playEquip();
    this.setWeather(nextId, true);
  }

  isBloodMoonDay(day = this.dayCount) {
    if (day === this.dayCount && this.currentWeather === 'BLOOD_MOON') return true;
    const interval = (CONSTANTS && CONSTANTS.BLOOD_MOON_INTERVAL_DAYS) ? CONSTANTS.BLOOD_MOON_INTERVAL_DAYS : 5;
    return day > 0 && (day % interval === 0);
  }

  isBloodMoonNight() {
    return this.isNight && this.isBloodMoonDay(this.dayCount);
  }

  getNextBloodMoonDay() {
    const interval = (CONSTANTS && CONSTANTS.BLOOD_MOON_INTERVAL_DAYS) ? CONSTANTS.BLOOD_MOON_INTERVAL_DAYS : 5;
    const rem = this.dayCount % interval;
    return rem === 0 ? this.dayCount : (this.dayCount + (interval - rem));
  }

  update(dt) {
    this.time += dt;
    this.weatherAnimTimer += dt;
    if (this.lightningFlashAlpha > 0) {
      this.lightningFlashAlpha = Math.max(0, this.lightningFlashAlpha - dt * 1.4);
    }

    if (this.time >= this.dayDuration) {
      this.time = 0;
      this.dayCount++;
      this.pendingWaveSpawns = [];
      this.rollDailyWeather();

      if (this.game && this.game.floatingTexts) {
        if (this.isBloodMoonDay(this.dayCount)) {
          const bmMsg = `🩸 CẢNH BÁO NGÀY ${this.dayCount}: ĐÊM NAY LÀ HUYẾT NGUYỆT — QUÁI RỚT X2 CHIẾN LỢI PHẨM HIẾM! 🩸`;
          this.game.floatingTexts.push(new FloatingText(this.game.player.x, this.game.player.y - 48, bmMsg, '#ef4444', 15, 4.0));
          if (this.game.saveManager) this.game.saveManager.showSaveToast(bmMsg);
        } else if (this.getNextBloodMoonDay() - this.dayCount === 1) {
          const warnMsg = `⚠️ CẢNH BÁO: NGÀY MAI (NGÀY ${this.dayCount + 1}) SẼ XUẤT HIỆN HUYẾT NGUYỆT (LOOT X2)!`;
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

    // Environmental Night & Acid Rain Infection
    if (this.game.player && !this.game.player.isDead) {
      const isSheltered = this.game.world && this.game.world.isInsideIsolation(this.game.player.x, this.game.player.y);
      if (!isSheltered) {
        let envToxinRate = 0;
        if (this.isNight) {
          envToxinRate += bloodMoonToday ? 0.55 : 0.35;
        }
        if (this.currentWeather === 'ACID_RAIN') {
          envToxinRate += 0.30;
        }
        if (envToxinRate > 0) {
          this.game.player.addInfection(envToxinRate * dt, '', false);
        }
      }
    }

    // EMP Storm Periodic Lightning Strikes on Monsters (O(1) SpatialGrid lookup)
    if (this.currentWeather === 'EMP_STORM' && this.game && this.game.monsters && this.game.player) {
      this.empLightningTimer -= dt;
      if (this.empLightningTimer <= 0) {
        this.empLightningTimer = 3.2 + Math.random() * 1.5;
        const p = this.game.player;
        let struckMonster = null;
        if (this.game.monsterGrid) {
          struckMonster = this.game.monsterGrid.findClosest(p.x, p.y, 420, m => m.species !== 'dummy');
        } else {
          let bestDist = 420;
          for (let m of this.game.monsters) {
            if (m.isDead || m.species === 'dummy') continue;
            const d = Math.hypot(m.x - p.x, m.y - p.y);
            if (d <= bestDist) {
              bestDist = d;
              struckMonster = m;
            }
          }
        }
        if (struckMonster) {
          this.lightningFlashAlpha = 0.22;
          struckMonster.takeDamage(28, this.game.particles, this.game.floatingTexts);
          struckMonster.applyStun(1.8);
          if (this.game.particles) {
            this.game.particles.push(new Particle(struckMonster.x, struckMonster.y - 180, 0, 0, '#38bdf8', 3, 0.28, 'lightning', { x2: struckMonster.x, y2: struckMonster.y }));
            this.game.particles.push(new Particle(struckMonster.x, struckMonster.y, 0, 0, '#38bdf8', 38, 0.35, 'ring'));
          }
          if (this.game.floatingTexts && this.game.floatingTexts.length < 38) {
            this.game.floatingTexts.push(new FloatingText(struckMonster.x, struckMonster.y - 28, '⚡ SÉT ĐIỆN TỪ (-28 & CHOÁNG)!', '#38bdf8', 11, 0.9));
          }
        }
      }
    }
  }

  // Render dynamic lighting, weather particles & flashlight beam using persistent half-res offscreen buffer (4x faster GPU performance!)
  renderLighting(ctx, camera, player) {
    const w = Math.ceil(camera.width);
    const h = Math.ceil(camera.height);

    // 1. Render 60FPS Weather Overlay Effects (Acid Rain / EMP Storm / Blood Moon Embers)
    if (this.currentWeather === 'ACID_RAIN') {
      ctx.save();
      ctx.fillStyle = 'rgba(101, 163, 13, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.55)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      const t = this.weatherAnimTimer * 420;
      for (let i = 0; i < 36; i++) {
        const rx = (i * 97 + t * 0.45) % w;
        const ry = (i * 73 + t) % h;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 6, ry + 16);
      }
      ctx.stroke();
      ctx.restore();
    } else if (this.currentWeather === 'EMP_STORM') {
      ctx.save();
      if (this.lightningFlashAlpha > 0) {
        ctx.fillStyle = `rgba(56, 189, 248, ${this.lightningFlashAlpha.toFixed(2)})`;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const t = this.weatherAnimTimer * 480;
      for (let i = 0; i < 24; i++) {
        const rx = (i * 127 + t * 0.6) % w;
        const ry = (i * 89 + t) % h;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 8, ry + 14);
      }
      ctx.stroke();
      ctx.restore();
    } else if (this.isBloodMoonDay(this.dayCount)) {
      ctx.save();
      ctx.fillStyle = 'rgba(248, 113, 113, 0.55)';
      const t = this.weatherAnimTimer * 45;
      for (let i = 0; i < 20; i++) {
        const ex = (i * 131 + Math.sin(this.weatherAnimTimer + i) * 24 + w) % w;
        const ey = h - ((i * 83 + t) % h);
        ctx.fillRect(ex, ey, 2.5, 2.5);
      }
      ctx.restore();
    }

    if (this.lightLevel >= 0.95 && !this.isBloodMoonDay(this.dayCount)) return;

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

  // Data-driven wave monster species picker (automatically includes any species registered in CONSTANTS.MONSTER_SPECIES)
  pickWaveMonsterSpecies(index, eggCount, isBloodMoon) {
    const speciesMap = (CONSTANTS && CONSTANTS.MONSTER_SPECIES) ? CONSTANTS.MONSTER_SPECIES : null;
    if (speciesMap) {
      // Check Boss cadence first
      if (isBloodMoon && index % 25 === 0 && speciesMap.behemoth) return 'behemoth';
      if (!isBloodMoon && index === 0 && (this.dayCount >= 3 || (this.dayCount >= 2 && eggCount >= 5)) && speciesMap.behemoth) {
        return 'behemoth';
      }

      // Build weighted pool from all eligible non-boss species
      let totalWeight = 0;
      const eligible = [];
      for (const key in speciesMap) {
        if (key === 'dummy') continue;
        const cfg = speciesMap[key];
        if (!cfg || cfg.isBoss) continue;
        const sp = cfg.spawn || {};
        const minDay = sp.minDay !== undefined ? sp.minDay : 1;
        const minEggs = sp.minEggs !== undefined ? sp.minEggs : 99;
        if (!isBloodMoon && this.dayCount < minDay && eggCount < minEggs) continue;
        const w = isBloodMoon ? (sp.bloodMoonWeight || sp.weight || 20) : (sp.weight || 20);
        if (w > 0) {
          eligible.push({ key, weight: w });
          totalWeight += w;
        }
      }

      if (totalWeight > 0) {
        let roll = Math.random() * totalWeight;
        for (let i = 0; i < eligible.length; i++) {
          roll -= eligible[i].weight;
          if (roll <= 0) return eligible[i].key;
        }
        return eligible[eligible.length - 1].key;
      }
    }

    return 'crawler';
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
