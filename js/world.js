// World Map & 3 Biomes Generator
// Biome 1: Mountains (Top) - Ore, Herbs, Alien Eggs
// Biome 2: Plains (Center) - Lakes, River, Trees, Base area
// Biome 3: Ocean & Beach (Bottom) - Sand, Ocean, Tech Debris

class WorldMap {
  constructor() {
    this.cols = CONSTANTS.WORLD_COLS; // 100
    this.rows = CONSTANTS.WORLD_ROWS; // 80
    this.tileSize = CONSTANTS.TILE_SIZE; // 32
    this.width = this.cols * this.tileSize; // 3200px
    this.height = this.rows * this.tileSize; // 2560px

    this.tiles = [];
    this.harvestables = []; // Interactive world objects (Ores, Herbs, Eggs, Debris)
    this.structures = [];   // Bio-Lab, Furnace
    this.wildFlora = [];    // Wild plants that get blighted overnight
  }

  generate() {
    this.tiles = new Array(this.rows);
    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = new Array(this.cols).fill(CONSTANTS.TILES.GRASS);
    }
    this.harvestables = [];

    // 1. Generate Biome Base Layers
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Natural jagged biome borders using sine waves
        const mountainBorder = CONSTANTS.BIOME_MOUNTAIN_END + Math.floor(Math.sin(c * 0.15) * 2.5 + Math.cos(c * 0.08) * 1.5);
        const oceanBorder = CONSTANTS.BIOME_PLAINS_END + Math.floor(Math.sin(c * 0.12) * 2.0 + Math.cos(c * 0.05) * 2.0);

        if (r <= mountainBorder) {
          // MOUNTAIN BIOME
          if (r < 7 + Math.floor(Math.sin(c * 0.2) * 2)) {
            this.tiles[r][c] = CONSTANTS.TILES.SNOW_PEAK;
          } else if (r < 18) {
            this.tiles[r][c] = CONSTANTS.TILES.MOUNTAIN_ROCK;
          } else {
            this.tiles[r][c] = CONSTANTS.TILES.MOUNTAIN_SLATE;
          }
        } else if (r >= oceanBorder) {
          // OCEAN & BEACH BIOME
          const beachWidth = 5;
          if (r <= oceanBorder + beachWidth) {
            // Sand beach
            const isWet = (r === oceanBorder + beachWidth);
            this.tiles[r][c] = isWet ? CONSTANTS.TILES.SAND_WET : CONSTANTS.TILES.SAND;
          } else if (r <= oceanBorder + beachWidth + 4) {
            this.tiles[r][c] = CONSTANTS.TILES.OCEAN_SHALLOW;
          } else {
            this.tiles[r][c] = CONSTANTS.TILES.OCEAN_DEEP;
          }
        } else {
          // PLAINS BIOME (Center)
          const rand = Math.random();
          if (rand < 0.15) {
            this.tiles[r][c] = CONSTANTS.TILES.GRASS_FLOWERS;
          } else if (rand < 0.25) {
            this.tiles[r][c] = CONSTANTS.TILES.GRASS_TALL;
          } else {
            this.tiles[r][c] = CONSTANTS.TILES.GRASS;
          }
        }
      }
    }

    // 2. Carve River from Mountains down to Ocean
    // River flows from col 50 (top) down to col 58 (bottom) with curves
    let riverCol = 48;
    for (let r = 12; r < this.rows; r++) {
      riverCol += Math.sin(r * 0.18) * 0.8 + (Math.random() - 0.5) * 0.5;
      const centerCol = Math.round(riverCol);
      for (let dc = -2; dc <= 2; dc++) {
        const c = centerCol + dc;
        if (c >= 0 && c < this.cols) {
          if (r < CONSTANTS.BIOME_PLAINS_END + 5) {
            this.tiles[r][c] = CONSTANTS.TILES.RIVER_WATER;
          }
        }
      }
    }

    // 3. Wooden Bridges across the River in Plains
    const bridgeRows = [34, 48];
    bridgeRows.forEach(br => {
      for (let c = 0; c < this.cols; c++) {
        if (this.tiles[br][c] === CONSTANTS.TILES.RIVER_WATER) {
          this.tiles[br][c] = CONSTANTS.TILES.WOODEN_BRIDGE;
          this.tiles[br + 1][c] = CONSTANTS.TILES.WOODEN_BRIDGE;
        }
      }
    });

    // 4. Carve Lakes in Plains
    const lakes = [
      { r: 35, c: 24, radius: 5 },
      { r: 45, c: 78, radius: 6 },
      { r: 52, c: 30, radius: 4 }
    ];
    lakes.forEach(lake => {
      for (let dr = -lake.radius; dr <= lake.radius; dr++) {
        for (let dc = -lake.radius; dc <= lake.radius; dc++) {
          if (dr * dr + dc * dc <= lake.radius * lake.radius) {
            const r = lake.r + dr;
            const c = lake.c + dc;
            if (r > CONSTANTS.BIOME_MOUNTAIN_END && r < CONSTANTS.BIOME_PLAINS_END) {
              if (c >= 0 && c < this.cols) {
                this.tiles[r][c] = CONSTANTS.TILES.LAKE_WATER;
              }
            }
          }
        }
      }
    });

    // 5. Populate Mountain Resources & Alien Eggs
    for (let r = 4; r <= CONSTANTS.BIOME_MOUNTAIN_END; r++) {
      for (let c = 2; c < this.cols - 2; c++) {
        const tile = this.tiles[r][c];
        if (tile === CONSTANTS.TILES.MOUNTAIN_ROCK || tile === CONSTANTS.TILES.MOUNTAIN_SLATE || tile === CONSTANTS.TILES.SNOW_PEAK) {
          const rand = Math.random();
          if (rand < 0.035) {
            this.tiles[r][c] = CONSTANTS.TILES.ORE_SULFUR;
            this.addHarvestable(c, r, 'sulfur_ore', 'Quặng Lưu Huỳnh', 'sulfur_dust', 3);
          } else if (rand < 0.065) {
            this.tiles[r][c] = CONSTANTS.TILES.ORE_QUARTZ;
            this.addHarvestable(c, r, 'quartz_ore', 'Quặng Thạch Anh', 'quartz_crystal', 2);
          } else if (rand < 0.09) {
            this.tiles[r][c] = CONSTANTS.TILES.HERB_SNOW_LOTUS;
            this.addHarvestable(c, r, 'snow_lotus', 'Tuyết Liên Núi Cao', 'snow_lotus', 1);
          } else if (rand < 0.12) {
            this.tiles[r][c] = CONSTANTS.TILES.HERB_SILVER_MOSS;
            this.addHarvestable(c, r, 'silver_moss', 'Rêu Bạc Đỉnh Núi', 'silver_moss', 2);
          } else if (rand < 0.155) {
            this.tiles[r][c] = CONSTANTS.TILES.ALIEN_EGG;
            this.addHarvestable(c, r, 'alien_egg', 'Trứng Quái Vật Ngoài Hành Tinh', 'egg_fluid', 1, 45); // 45 HP to break
          }
        }
      }
    }

    // 6. Populate Plains with Trees & Alien Plants
    for (let r = CONSTANTS.BIOME_MOUNTAIN_END + 2; r < CONSTANTS.BIOME_PLAINS_END; r++) {
      for (let c = 2; c < this.cols - 2; c++) {
        if (this.tiles[r][c] === CONSTANTS.TILES.GRASS || this.tiles[r][c] === CONSTANTS.TILES.GRASS_TALL) {
          // Avoid river and lakes
          if (Math.random() < 0.08) {
            this.tiles[r][c] = CONSTANTS.TILES.TREE_ALIEN_PINE;
            this.addHarvestable(c, r, 'alien_tree', 'Cây Thông Biến Dị', 'wood', 4);
          }
        }
      }
    }

    // 7. Populate Beach with Tech Debris & Ocean Resources
    for (let r = CONSTANTS.BIOME_PLAINS_END + 1; r < CONSTANTS.BIOME_PLAINS_END + 5; r++) {
      for (let c = 2; c < this.cols - 2; c++) {
        if (this.tiles[r][c] === CONSTANTS.TILES.SAND && Math.random() < 0.07) {
          this.tiles[r][c] = CONSTANTS.TILES.TECH_DEBRIS;
          this.addHarvestable(c, r, 'tech_debris', 'Mảnh Vỡ Phi Thuyền', 'tech_scrap', 2);
        }
      }
    }

    // 8. Place Central Base Structures: Bio-Lab & Furnace (in Plains)
    this.structures = [];
    // Bio-Lab: 96x96 px (3x3 tiles), Center at (38 * 32, 34 * 32)
    this.structures.push({
      id: 'biolab',
      name: 'Phòng Lab Sinh Học Cách Ly (Bio-Lab)',
      type: 'biolab',
      x: 37 * this.tileSize,
      y: 33 * this.tileSize,
      width: 96,
      height: 96,
      doorX: 37 * this.tileSize + 48,
      doorY: 33 * this.tileSize + 85,
      isolationRadius: 150
    });

    // Clear tiles under Bio-Lab
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        this.tiles[33 + dr][37 + dc] = CONSTANTS.TILES.DIRT_PATH;
      }
    }

    // Furnace: 48x48 px, near Bio-Lab
    this.structures.push({
      id: 'furnace',
      name: 'Lò Nung Khử Trùng (Furnace)',
      type: 'furnace',
      x: 42 * this.tileSize,
      y: 34 * this.tileSize,
      width: 48,
      height: 48,
      doorX: 42 * this.tileSize + 24,
      doorY: 34 * this.tileSize + 40
    });

    // Clear tiles under Furnace
    this.tiles[34][42] = CONSTANTS.TILES.DIRT_PATH;
    this.tiles[34][43] = CONSTANTS.TILES.DIRT_PATH;
    this.tiles[35][42] = CONSTANTS.TILES.DIRT_PATH;
    this.tiles[35][43] = CONSTANTS.TILES.DIRT_PATH;

    // Workbench: 48x32 px, to the left of Bio-Lab
    this.structures.push({
      id: 'workbench',
      name: 'Bàn Chế Tạo (Workbench)',
      type: 'workbench',
      x: 33 * this.tileSize,
      y: 34 * this.tileSize,
      width: 48,
      height: 32,
      doorX: 33 * this.tileSize + 24,
      doorY: 34 * this.tileSize + 30
    });
    this.tiles[34][33] = CONSTANTS.TILES.DIRT_PATH;
    this.tiles[34][34] = CONSTANTS.TILES.DIRT_PATH;

    // Workshop: 64x48 px, to the right of Furnace
    this.structures.push({
      id: 'workshop',
      name: 'Xưởng Cơ Khí Thủ Thành (Workshop)',
      type: 'workshop',
      x: 46 * this.tileSize,
      y: 33 * this.tileSize,
      width: 64,
      height: 48,
      doorX: 46 * this.tileSize + 32,
      doorY: 33 * this.tileSize + 44
    });
    for (let dr = 0; dr < 2; dr++) {
      for (let dc = 0; dc < 2; dc++) {
        this.tiles[33 + dr][46 + dc] = CONSTANTS.TILES.DIRT_PATH;
      }
    }

    // 9. Populate Wild Flora in Plains (Berry bushes)
    this.wildFlora = [];
    this.spawnWildFlora(16);
  }

  spawnWildFlora(count = 14) {
    let spawned = 0;
    let attempts = 0;
    while (spawned < count && attempts < 100) {
      attempts++;
      const r = Math.floor(CONSTANTS.BIOME_MOUNTAIN_END + 3 + Math.random() * (CONSTANTS.BIOME_PLAINS_END - CONSTANTS.BIOME_MOUNTAIN_END - 6));
      const c = Math.floor(4 + Math.random() * (this.cols - 8));
      const tile = this.tiles[r][c];
      if (tile === CONSTANTS.TILES.GRASS || tile === CONSTANTS.TILES.GRASS_TALL) {
        // Ensure not too close to Bio-Lab
        const wx = c * this.tileSize;
        const wy = r * this.tileSize;
        const distToLab = Math.hypot(wx - 38 * this.tileSize, wy - 34 * this.tileSize);
        if (distToLab > 120) {
          this.wildFlora.push({
            id: 'wild_flora_' + Date.now() + '_' + spawned,
            col: c,
            row: r,
            x: wx + this.tileSize / 2,
            y: wy + this.tileSize / 2,
            isBlighted: false,
            daySpawned: 1,
            hp: 15,
            isHarvested: false
          });
          spawned++;
        }
      }
    }
  }

  // Overnight Eco-system Handler
  onNewDay(dayNumber, game) {
    // 1. Turn unharvested wild plants into blighted/mutant plants
    let blightedCount = 0;
    for (let plant of this.wildFlora) {
      if (!plant.isHarvested && !plant.isBlighted) {
        plant.isBlighted = true;
        blightedCount++;
      }
    }

    // 2. Remove very old blighted plants & spawn fresh healthy ones
    this.wildFlora = this.wildFlora.filter(p => !p.isHarvested);
    this.spawnWildFlora(10);

    if (game && game.floatingTexts) {
      game.floatingTexts.push(new FloatingText(
        game.player.x, game.player.y - 45,
        `⚠ ${blightedCount} CÂY RỪNG NGOÀI TỰ NHIÊN ĐÃ BIẾN DỊ NHIỄM ĐỘC QUA ĐÊM!`,
        '#d946ef', 12, 3.0
      ));
    }
  }

  addHarvestable(col, row, type, name, dropItemId, dropCount, hp = 20) {
    this.harvestables.push({
      col,
      row,
      x: col * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2,
      type,
      name,
      dropItemId,
      dropCount,
      hp,
      maxHp: hp,
      isDestroyed: false
    });
  }

  getTile(c, r) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
      return CONSTANTS.TILES.MOUNTAIN_ROCK;
    }
    return this.tiles[r][c];
  }

  getBiomeAt(worldX, worldY) {
    const row = Math.floor(worldY / this.tileSize);
    if (row <= CONSTANTS.BIOME_MOUNTAIN_END) {
      return { id: 'mountain', name: 'Vùng Núi Hiểm Trở', color: '#64748b' };
    } else if (row >= CONSTANTS.BIOME_PLAINS_END) {
      return { id: 'ocean', name: 'Bờ Biển & Đại Dương', color: '#0ea5e9' };
    } else {
      return { id: 'plains', name: 'Đồng Bằng Trung Tâm', color: '#22c55e' };
    }
  }

  // Check if position is solid / collidable
  isColliding(x, y, radius = 10) {
    // Check map boundaries
    if (x - radius < 0 || x + radius > this.width || y - radius < 0 || y + radius > this.height) {
      return true;
    }

    const minC = Math.floor((x - radius) / this.tileSize);
    const maxC = Math.floor((x + radius) / this.tileSize);
    const minR = Math.floor((y - radius) / this.tileSize);
    const maxR = Math.floor((y + radius) / this.tileSize);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const tile = this.getTile(c, r);
        // Solid blocking tiles
        if (
          tile === CONSTANTS.TILES.SNOW_PEAK ||
          tile === CONSTANTS.TILES.OCEAN_DEEP ||
          tile === CONSTANTS.TILES.LAKE_WATER ||
          tile === CONSTANTS.TILES.RIVER_WATER // River is water barrier, use bridge!
        ) {
          // Check circle to tile AABB intersection
          const tileLeft = c * this.tileSize;
          const tileRight = tileLeft + this.tileSize;
          const tileTop = r * this.tileSize;
          const tileBottom = tileTop + this.tileSize;

          const closestX = Math.max(tileLeft, Math.min(x, tileRight));
          const closestY = Math.max(tileTop, Math.min(y, tileBottom));

          const distX = x - closestX;
          const distY = y - closestY;
          if (distX * distX + distY * distY < radius * radius) {
            return true;
          }
        }
      }
    }

    // Check placed player defenses (Walls, Turrets, Mortars)
    if (this.game && this.game.buildingManager && this.game.buildingManager.isBlocking(x, y, radius)) {
      return true;
    }

    return false;
  }

  // Find harvestable near point
  getHarvestableAt(x, y, reach = 50) {
    for (let h of this.harvestables) {
      if (h.isDestroyed) continue;
      const dx = h.x - x;
      const dy = h.y - y;
      if (dx * dx + dy * dy <= reach * reach) {
        return h;
      }
    }
    return null;
  }

  damageHarvestable(h, damage) {
    h.hp -= damage;
    if (h.hp <= 0) {
      h.isDestroyed = true;
      // Change tile back to ground
      const row = h.row;
      const col = h.col;
      if (row <= CONSTANTS.BIOME_MOUNTAIN_END) {
        this.tiles[row][col] = CONSTANTS.TILES.MOUNTAIN_SLATE;
      } else if (row >= CONSTANTS.BIOME_PLAINS_END) {
        this.tiles[row][col] = CONSTANTS.TILES.SAND;
      } else {
        this.tiles[row][col] = CONSTANTS.TILES.GRASS;
      }
      return true; // destroyed
    }
    return false;
  }

  // Find wild flora (berries) near point
  getWildFloraAt(x, y, reach = 40) {
    for (let f of this.wildFlora) {
      if (f.isHarvested) continue;
      const dist = Math.hypot(f.x - x, f.y - y);
      if (dist <= reach) return f;
    }
    return null;
  }

  harvestWildFlora(f) {
    if (f.isHarvested) return null;
    f.isHarvested = true;
    return f.isBlighted ? 'blighted_berry' : 'wild_berry';
  }

  // Check if position is protected by Bio-Lab Quarantine Isolation
  isInsideIsolation(x, y) {
    for (let s of this.structures) {
      if (s.type === 'biolab') {
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;
        if (Math.hypot(x - cx, y - cy) <= s.isolationRadius) {
          return true;
        }
      }
    }
    return false;
  }

  // Find structure near player
  getStructureNear(x, y, reach = 65) {
    for (let s of this.structures) {
      const cx = s.doorX || (s.x + s.width / 2);
      const cy = s.doorY || (s.y + s.height / 2);
      if (Math.hypot(x - cx, y - cy) <= reach) {
        return s;
      }
    }
    return null;
  }

  // Check if position is near water
  isNearWater(x, y, reach = 40) {
    const minC = Math.max(0, Math.floor((x - reach) / this.tileSize));
    const maxC = Math.min(this.cols - 1, Math.floor((x + reach) / this.tileSize));
    const minR = Math.max(0, Math.floor((y - reach) / this.tileSize));
    const maxR = Math.min(this.rows - 1, Math.floor((y + reach) / this.tileSize));

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const t = this.tiles[r][c];
        if (t === CONSTANTS.TILES.RIVER_WATER || t === CONSTANTS.TILES.LAKE_WATER) {
          return true;
        }
      }
    }
    return false;
  }

  render(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.ceil((camera.x + camera.width) / this.tileSize));
    const startRow = Math.max(0, Math.floor(camera.y / this.tileSize));
    const endRow = Math.min(this.rows - 1, Math.ceil((camera.y + camera.height) / this.tileSize));

    // 1. Render Base Tiles
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tileId = this.tiles[r][c];
        const sprite = window.pixelArt.get('tile_' + tileId);
        const screenX = c * this.tileSize - camera.x;
        const screenY = r * this.tileSize - camera.y;

        if (sprite) {
          ctx.drawImage(sprite, screenX, screenY);
        } else {
          ctx.fillStyle = '#222';
          ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
        }
      }
    }

    // 2. Render Wild Flora (Berry Bushes)
    for (let f of this.wildFlora) {
      if (f.isHarvested) continue;
      const sx = f.x - this.tileSize / 2 - camera.x;
      const sy = f.y - this.tileSize / 2 - camera.y;
      const spriteName = f.isBlighted ? 'tile_berry_blighted' : 'tile_berry_clean';
      const sprite = window.pixelArt.get(spriteName);
      if (sprite) {
        ctx.drawImage(sprite, sx, sy);
      }
    }

    // 3. Render Structures (Bio-Lab & Furnace)
    for (let s of this.structures) {
      const sx = s.x - camera.x;
      const sy = s.y - camera.y;

      if (s.type === 'biolab') {
        // Draw Quarantine Safe Zone Field Glow
        ctx.save();
        ctx.beginPath();
        const cx = sx + s.width / 2;
        const cy = sy + s.height / 2;
        ctx.arc(cx, cy, s.isolationRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.restore();

        const sprite = window.pixelArt.get('building_biolab');
        if (sprite) {
          ctx.drawImage(sprite, sx, sy);
        }
      } else if (s.type === 'furnace') {
        const sprite = window.pixelArt.get('building_furnace');
        if (sprite) {
          ctx.drawImage(sprite, sx, sy);
        }
      } else if (s.type === 'workbench') {
        const sprite = window.pixelArt.get('building_workbench');
        if (sprite) {
          ctx.drawImage(sprite, sx, sy);
        }
      } else if (s.type === 'workshop') {
        const sprite = window.pixelArt.get('building_workshop');
        if (sprite) {
          ctx.drawImage(sprite, sx, sy);
        }
      }
    }
  }
}

// Global instance
window.WorldMap = WorldMap;
