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
    this.harvestables = []; // Interactive world objects (Ores, Herbs, Eggs, Debris, Trees)
    this.structures = [];   // Bio-Lab, Furnace
    this.wildFlora = [];    // Wild plants that get blighted overnight
    this.mountainPeaks = []; // Majestic multi-tile mountain pinnacles & spires
    this.cliffBorders = [];  // Vertical cliff walls along mountain edge
    this.mountainMists = []; // Soft drifting mountain mist clouds
    this.ambientSpores = []; // Drifting forest spores & embers
  }

  generate() {
    this.tiles = new Array(this.rows);
    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = new Array(this.cols).fill(CONSTANTS.TILES.GRASS);
    }
    this.harvestables = [];
    this.mountainPeaks = [];
    this.cliffBorders = [];

    // 1. Generate Biome Base Layers
    const mountainBorders = new Array(this.cols);
    for (let c = 0; c < this.cols; c++) {
      mountainBorders[c] = CONSTANTS.BIOME_MOUNTAIN_END + Math.floor(Math.sin(c * 0.15) * 2.5 + Math.cos(c * 0.08) * 1.5);
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const mountainBorder = mountainBorders[c];
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
    // River flows smoothly to the East of the central base settlement
    let riverCol = 54;
    for (let r = 12; r < this.rows; r++) {
      riverCol += Math.sin(r * 0.16) * 0.6 + (Math.random() - 0.5) * 0.3;
      // Guarantee wide clearance around central base (rows 26 to 45)
      if (r >= 26 && r <= 45) {
        riverCol = Math.max(54, riverCol);
      }
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

    // 3. Wooden Bridges across the River in Plains (Connecting Base to Eastern Wilderness)
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

    // 5. Populate Mountain Cliff Borders, Majestic Peaks & Volcanic Fissures
    for (let c = 0; c < this.cols; c++) {
      const mb = mountainBorders[c];
      this.cliffBorders.push({
        col: c,
        row: mb,
        x: c * this.tileSize,
        y: mb * this.tileSize
      });
    }

    // Majestic Alpine Snow Pinnacles across the highest summits
    const snowPinnacleCols = [6, 18, 30, 46, 62, 74, 88];
    snowPinnacleCols.forEach((col, idx) => {
      const row = 2 + (idx % 3);
      this.mountainPeaks.push({
        x: col * this.tileSize,
        y: row * this.tileSize,
        type: 'mountain_peak_snow_large',
        width: 64,
        height: 64
      });
    });

    // Dark Granite Crag Spires across middle mountain ridges
    const cragCols = [12, 24, 40, 56, 68, 82, 94];
    cragCols.forEach((col, idx) => {
      const row = 9 + (idx % 4) * 2;
      this.mountainPeaks.push({
        x: col * this.tileSize,
        y: row * this.tileSize,
        type: 'mountain_crag_spire',
        width: 64,
        height: 64
      });
    });

    // Active Volcanic Sulfur Fissures
    const sulfurFissures = [
      { c: 16, r: 16 }, { c: 36, r: 18 }, { c: 66, r: 17 }, { c: 80, r: 19 }
    ];
    sulfurFissures.forEach(f => {
      this.mountainPeaks.push({
        x: f.c * this.tileSize,
        y: f.r * this.tileSize,
        type: 'sulfur_fissure_active',
        width: 32,
        height: 32
      });
    });

    // Populate Mountain Resources & Alien Eggs
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

    // 6. Populate Deep, Majestic, Realistic Forests (Ancient Pines, Alien Spores, Charred Trees)
    for (let r = CONSTANTS.BIOME_MOUNTAIN_END + 2; r < CONSTANTS.BIOME_PLAINS_END; r++) {
      for (let c = 2; c < this.cols - 2; c++) {
        const tile = this.tiles[r][c];
        if (tile === CONSTANTS.TILES.GRASS || tile === CONSTANTS.TILES.GRASS_TALL) {
          // Avoid river, lakes, and central base
          const distToLab = Math.hypot(c - 38, r - 34);
          if (distToLab < 8) continue;

          let spawnChance = 0.04;
          let variant = 'ancient_pine';
          let treeName = 'Cây Thông Đại Ngàn';

          // A. Western Ancient Fir Grove (Dense woodland biome)
          if (c >= 4 && c <= 30 && r >= 29 && r <= 58) {
            spawnChance = 0.17;
            variant = 'ancient_pine';
            treeName = 'Cây Thông Cổ Thụ';
          }
          // B. Eastern Alien Spore Forest (Extraterrestrial bioluminescent forest)
          else if (c >= 66 && c <= 95 && r >= 29 && r <= 55) {
            spawnChance = 0.18;
            variant = 'alien_pine';
            treeName = 'Cây Đại Thụ Bào Tử';
          }
          // C. Northern Foothills Charred Wasteland (Apocalyptic burned forest)
          else if (r >= CONSTANTS.BIOME_MOUNTAIN_END + 1 && r <= CONSTANTS.BIOME_MOUNTAIN_END + 4) {
            spawnChance = 0.15;
            variant = 'dead_apoc';
            treeName = 'Cây Tận Thế Cháy Khô';
          }

          if (Math.random() < spawnChance) {
            this.tiles[r][c] = CONSTANTS.TILES.TREE_ALIEN_PINE;
            this.addHarvestable(c, r, 'alien_tree', treeName, 'wood', 4, 25, {
              treeVariant: variant,
              swayOffset: Math.random() * 6.28
            });
          }
        }
      }
    }

    // Initialize Atmospheric Mountain Mist & Valley Fog Clouds
    this.mountainMists = [];
    for (let i = 0; i < 20; i++) {
      this.mountainMists.push({
        x: Math.random() * this.width,
        y: 10 + Math.random() * (CONSTANTS.BIOME_MOUNTAIN_END * this.tileSize - 40),
        width: 110 + Math.random() * 110,
        height: 38 + Math.random() * 32,
        speed: 8 + Math.random() * 12,
        opacity: 0.18 + Math.random() * 0.12
      });
    }

    // Initialize Drifting Forest Spores & Embers
    this.ambientSpores = [];
    for (let i = 0; i < 35; i++) {
      this.ambientSpores.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.3) * 16,
        vy: (Math.random() - 0.5) * 8,
        radius: 1 + Math.random() * 2,
        color: Math.random() < 0.5 ? 'rgba(74, 222, 128, 0.65)' : 'rgba(192, 132, 252, 0.65)'
      });
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

    // Clear tiles & pave spacious connected plaza across Central Base (Workbench, Bio-Lab, Furnace, Workshop)
    for (let r = 32; r <= 38; r++) {
      for (let c = 32; c <= 50; c++) {
        this.tiles[r][c] = CONSTANTS.TILES.DIRT_PATH;
      }
    }

    // Furnace: 48x48 px, to the right of Bio-Lab
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

    // Pave Dedicated Weapon Training Grounds (Southwest of Base)
    for (let r = 38; r <= 42; r++) {
      for (let c = 27; c <= 31; c++) {
        this.tiles[r][c] = CONSTANTS.TILES.DIRT_PATH;
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

  addHarvestable(col, row, type, name, dropItemId, dropCount, hp = 20, metadata = {}) {
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
      isDestroyed: false,
      ...metadata
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

  render(ctx, camera, player = null) {
    const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.ceil((camera.x + camera.width) / this.tileSize));
    const startRow = Math.max(0, Math.floor(camera.y / this.tileSize));
    const endRow = Math.min(this.rows - 1, Math.ceil((camera.y + camera.height) / this.tileSize));

    // 1. Render Base Ground Tiles
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        let tileId = this.tiles[r][c];
        // If it's a tree tile, render grass underneath so ground is beautiful
        if (tileId === CONSTANTS.TILES.TREE_ALIEN_PINE || tileId === CONSTANTS.TILES.TREE_POST_APOC) {
          tileId = CONSTANTS.TILES.GRASS;
        }

        const sprite = window.pixelArt.get('tile_' + tileId);
        const screenX = c * this.tileSize - camera.x;
        const screenY = r * this.tileSize - camera.y;

        if (sprite) {
          ctx.drawImage(sprite, screenX, screenY);
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
        }
      }
    }

    // 2. Render Vertical Mountain Cliff Walls (Demarcating Mountain Plateau & Plains)
    const cliffWallSprite = window.pixelArt.get('cliff_face_vertical');
    if (cliffWallSprite && this.cliffBorders) {
      for (let cb of this.cliffBorders) {
        if (cb.col >= startCol - 1 && cb.col <= endCol + 1) {
          const sx = cb.x - camera.x;
          const sy = cb.y - camera.y;
          // Render cliff facade
          ctx.drawImage(cliffWallSprite, sx, sy);
          // Drop shadow cast onto the plains below
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(sx, sy + this.tileSize, this.tileSize, 8);
        }
      }
    }

    // 3. Render Majestic Mountain Peaks, Spires & Sulfur Fissures
    if (this.mountainPeaks) {
      for (let peak of this.mountainPeaks) {
        const sx = peak.x - camera.x;
        const sy = peak.y - camera.y;
        if (sx + peak.width >= -64 && sx <= camera.width + 64 && sy + peak.height >= -64 && sy <= camera.height + 64) {
          const sprite = window.pixelArt.get(peak.type);
          if (sprite) {
            ctx.drawImage(sprite, sx, sy);
          }
        }
      }
    }

    // 4. Render Wild Flora (Berry Bushes)
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

    // 5. Render Structures (Bio-Lab & Furnace, Workbench, Workshop)
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

    // 6. Render Majestic Multi-tier Trees with Cast Shadows & Wind Sway
    const now = Date.now();
    for (let h of this.harvestables) {
      if (h.type !== 'alien_tree') continue;
      const screenX = h.x - camera.x;
      const screenY = h.y - camera.y;

      // Viewport culling with generous margin for tall trees
      if (screenX < -64 || screenX > camera.width + 64 || screenY < -100 || screenY > camera.height + 64) {
        continue;
      }

      if (h.isDestroyed) {
        // Render Cut Tree Stump
        const stumpSprite = window.pixelArt.get('tree_stump');
        if (stumpSprite) {
          ctx.drawImage(stumpSprite, screenX - 16, screenY - 12);
        }
      } else {
        // Determine tree variant & dimensions
        const variant = h.treeVariant || 'ancient_pine';
        let spriteKey = 'tree_ancient_pine';
        let treeW = 48, treeH = 72;

        if (variant === 'alien_pine') {
          spriteKey = 'tree_alien_pine';
          treeH = 76;
        } else if (variant === 'dead_apoc') {
          spriteKey = 'tree_dead_apoc';
          treeH = 68;
        }

        const treeSprite = window.pixelArt.get(spriteKey) || window.pixelArt.get('tree_ancient_pine');
        if (treeSprite) {
          // Subtle natural wind sway
          const sway = Math.sin(now * 0.0016 + (h.swayOffset || 0)) * 1.5;
          const drawX = screenX - 24 + sway;
          const drawY = screenY - (treeH - 14); // Ground trunk root aligns with h.y

          // Check if player is standing behind/underneath this tree's canopy
          let isPlayerUnder = false;
          if (player) {
            const dx = Math.abs(player.x - h.x);
            const dy = player.y - (h.y - 28);
            if (dx < 26 && dy > -38 && dy < 18) {
              isPlayerUnder = true;
            }
          }

          if (isPlayerUnder) {
            ctx.save();
            ctx.globalAlpha = 0.62;
            ctx.drawImage(treeSprite, drawX, drawY);
            ctx.restore();
          } else {
            ctx.drawImage(treeSprite, drawX, drawY);
          }
        }
      }
    }

    // 7. Render Atmospheric Mountain Mist & Valley Clouds across Mountain Zone
    if (this.mountainMists && camera.y < CONSTANTS.BIOME_MOUNTAIN_END * this.tileSize + 200) {
      ctx.save();
      for (let mist of this.mountainMists) {
        mist.x += mist.speed * 0.016;
        if (mist.x > this.width + mist.width) mist.x = -mist.width;

        const mx = mist.x - camera.x;
        const my = mist.y - camera.y;
        if (mx + mist.width >= 0 && mx <= camera.width && my + mist.height >= 0 && my <= camera.height) {
          const grad = ctx.createRadialGradient(
            mx + mist.width / 2, my + mist.height / 2, 8,
            mx + mist.width / 2, my + mist.height / 2, mist.width / 2
          );
          grad.addColorStop(0, `rgba(224, 242, 254, ${mist.opacity})`);
          grad.addColorStop(0.55, `rgba(186, 230, 253, ${mist.opacity * 0.55})`);
          grad.addColorStop(1, 'rgba(186, 230, 253, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(mx + mist.width / 2, my + mist.height / 2, mist.width / 2, mist.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 8. Render Drifting Ambient Forest Spores & Embers
    if (this.ambientSpores) {
      ctx.save();
      for (let spore of this.ambientSpores) {
        spore.x += spore.vx * 0.016;
        spore.y += spore.vy * 0.016;
        if (spore.x < 0) spore.x = this.width;
        if (spore.x > this.width) spore.x = 0;
        if (spore.y < 0) spore.y = this.height;
        if (spore.y > this.height) spore.y = 0;

        const sx = spore.x - camera.x;
        const sy = spore.y - camera.y;
        if (sx >= 0 && sx <= camera.width && sy >= 0 && sy <= camera.height) {
          ctx.fillStyle = spore.color;
          ctx.beginPath();
          ctx.arc(sx, sy, spore.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }
}

// Global instance
window.WorldMap = WorldMap;
