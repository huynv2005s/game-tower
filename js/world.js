// World Map & 3 Biomes Generator (Optimized with Offscreen Ground Layer Caching & Frustum Culling)
// Biome 1: Mountains (Top) - Sulfur, Quartz, Titanium Ore, Herbs, Alien Eggs
// Biome 2: Plains (Center) - Lakes, River, Trees, Base area
// Biome 3: Ocean & Beach (Bottom) - Sand, Ocean, Tech Debris, Plasma Nodes

class WorldMap {
  constructor() {
    this.cols = CONSTANTS.WORLD_COLS; // 100
    this.rows = CONSTANTS.WORLD_ROWS; // 80
    this.tileSize = CONSTANTS.TILE_SIZE; // 32
    this.width = this.cols * this.tileSize; // 3200px
    this.height = this.rows * this.tileSize; // 2560px

    this.tiles = [];
    this.harvestables = []; // All interactive world objects
    this.harvestableTileMap = new Map(); // O(1) tile lookup: (row << 8) | col -> harvestable
    this.resourceNodes = []; // Non-tree harvestables for fast rendering
    this.treeNodes = [];     // Tree harvestables for fast rendering
    this.structures = [];   // Bio-Lab, Furnace, Workbench, Workshop
    this.wildFlora = [];    // Wild plants that get blighted overnight
    this.mountainPeaks = []; // Majestic multi-tile mountain pinnacles & spires
    this.cliffBorders = [];  // Vertical cliff walls along mountain edge
    this.mountainMists = []; // Soft drifting mountain mist clouds
    this.ambientSpores = []; // Drifting forest spores & embers
    this._badgeWidthCache = Object.create(null);

    // Offscreen Ground Cache Canvas (Eliminates 600+ tile drawImage calls per frame!)
    this.groundCanvas = null;
    this.groundCtx = null;
  }

  _tileKey(col, row) {
    return (row << 8) | col;
  }

  generate() {
    this.tiles = new Array(this.rows);
    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = new Array(this.cols).fill(CONSTANTS.TILES.GRASS);
    }
    this.harvestables = [];
    this.harvestableTileMap.clear();
    this.resourceNodes = [];
    this.treeNodes = [];
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
    let riverCol = 54;
    for (let r = 12; r < this.rows; r++) {
      riverCol += Math.sin(r * 0.16) * 0.6 + (Math.random() - 0.5) * 0.3;
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

    // 3. Wooden Bridges across the River in Mountains & Plains
    const bridgeRows = [19, 34, 48];
    this.bridgeCrossings = [];
    bridgeRows.forEach(br => {
      let minBridgeC = this.cols;
      let maxBridgeC = 0;
      for (let c = 0; c < this.cols; c++) {
        if (this.tiles[br][c] === CONSTANTS.TILES.RIVER_WATER || this.tiles[br + 1][c] === CONSTANTS.TILES.RIVER_WATER) {
          this.tiles[br][c] = CONSTANTS.TILES.WOODEN_BRIDGE;
          this.tiles[br + 1][c] = CONSTANTS.TILES.WOODEN_BRIDGE;
          if (c < minBridgeC) minBridgeC = c;
          if (c > maxBridgeC) maxBridgeC = c;
        }
      }
      if (minBridgeC <= maxBridgeC) {
        const centerCol = (minBridgeC + maxBridgeC + 1) * 0.5;
        this.bridgeCrossings.push({
          row: br,
          col: centerCol,
          x: centerCol * this.tileSize,
          y: (br + 1) * this.tileSize,
          westEntryX: (minBridgeC - 1.2) * this.tileSize,
          eastEntryX: (maxBridgeC + 2.2) * this.tileSize
        });
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

    // Populate Mountain Resources (Sulfur, Quartz, Titanium Ore, Snow Lotus, Silver Moss, Alien Eggs)
    for (let r = 4; r <= CONSTANTS.BIOME_MOUNTAIN_END; r++) {
      for (let c = 2; c < this.cols - 2; c++) {
        const tile = this.tiles[r][c];
        if (tile === CONSTANTS.TILES.MOUNTAIN_ROCK || tile === CONSTANTS.TILES.MOUNTAIN_SLATE || tile === CONSTANTS.TILES.SNOW_PEAK) {
          const rand = Math.random();
          if (rand < 0.032) {
            this.tiles[r][c] = CONSTANTS.TILES.ORE_SULFUR;
            this.addHarvestable(c, r, 'sulfur_ore', 'Quặng Lưu Huỳnh', 'sulfur_dust', 3);
          } else if (rand < 0.060) {
            this.tiles[r][c] = CONSTANTS.TILES.ORE_QUARTZ;
            this.addHarvestable(c, r, 'quartz_ore', 'Quặng Thạch Anh', 'quartz_crystal', 2);
          } else if (rand < 0.092) {
            this.tiles[r][c] = CONSTANTS.TILES.ORE_TITANIUM;
            this.addHarvestable(c, r, 'titanium_ore', 'Quặng Sắt Titan', 'iron_ore', 2, 25);
          } else if (rand < 0.115) {
            this.tiles[r][c] = CONSTANTS.TILES.HERB_SNOW_LOTUS;
            this.addHarvestable(c, r, 'snow_lotus', 'Tuyết Liên Núi Cao', 'snow_lotus', 1);
          } else if (rand < 0.140) {
            this.tiles[r][c] = CONSTANTS.TILES.HERB_SILVER_MOSS;
            this.addHarvestable(c, r, 'silver_moss', 'Rêu Bạc Đỉnh Núi', 'silver_moss', 2);
          } else if (rand < 0.172) {
            this.tiles[r][c] = CONSTANTS.TILES.ALIEN_EGG;
            this.addHarvestable(c, r, 'alien_egg', 'Trứng Quái Vật Ngoài Hành Tinh', 'egg_fluid', 1, 45);
          }
        }
      }
    }

    // 6. Populate Deep, Majestic Forests
    for (let r = CONSTANTS.BIOME_MOUNTAIN_END + 2; r < CONSTANTS.BIOME_PLAINS_END; r++) {
      for (let c = 2; c < this.cols - 2; c++) {
        const tile = this.tiles[r][c];
        if (tile === CONSTANTS.TILES.GRASS || tile === CONSTANTS.TILES.GRASS_TALL) {
          const distToLab = Math.hypot(c - 38, r - 34);
          if (distToLab < 8) continue;

          let spawnChance = 0.035;
          let variant = 'ancient_pine';
          let treeName = 'Cây Thông Đại Ngàn';

          if (c >= 4 && c <= 30 && r >= 29 && r <= 58) {
            spawnChance = 0.15;
            variant = 'ancient_pine';
            treeName = 'Cây Thông Cổ Thụ';
          } else if (c >= 66 && c <= 95 && r >= 29 && r <= 55) {
            spawnChance = 0.16;
            variant = 'alien_pine';
            treeName = 'Cây Đại Thụ Bào Tử';
          } else if (r >= CONSTANTS.BIOME_MOUNTAIN_END + 1 && r <= CONSTANTS.BIOME_MOUNTAIN_END + 4) {
            spawnChance = 0.14;
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

    // Initialize Atmospheric Mountain Mist Clouds (Capped to 12 for 60FPS performance)
    this.mountainMists = [];
    for (let i = 0; i < 12; i++) {
      this.mountainMists.push({
        x: Math.random() * this.width,
        y: 10 + Math.random() * (CONSTANTS.BIOME_MOUNTAIN_END * this.tileSize - 40),
        width: 120 + Math.random() * 100,
        height: 42 + Math.random() * 28,
        speed: 8 + Math.random() * 12,
        opacity: 0.45 + Math.random() * 0.25
      });
    }

    // Initialize Drifting Forest Spores & Embers (Capped to 24 for 60FPS performance)
    this.ambientSpores = [];
    for (let i = 0; i < 24; i++) {
      this.ambientSpores.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.3) * 16,
        vy: (Math.random() - 0.5) * 8,
        radius: 1.2 + Math.random() * 1.8,
        color: Math.random() < 0.5 ? 'rgba(74, 222, 128, 0.65)' : 'rgba(192, 132, 252, 0.65)'
      });
    }

    // 7. Populate Beach with Tech Debris & Plasma Energy Nodes
    for (let r = CONSTANTS.BIOME_PLAINS_END + 1; r < CONSTANTS.BIOME_PLAINS_END + 5; r++) {
      for (let c = 2; c < this.cols - 2; c++) {
        if (this.tiles[r][c] === CONSTANTS.TILES.SAND) {
          const rand = Math.random();
          if (rand < 0.055) {
            this.tiles[r][c] = CONSTANTS.TILES.TECH_DEBRIS;
            this.addHarvestable(c, r, 'tech_debris', 'Mảnh Vỡ Phi Thuyền', 'tech_scrap', 2);
          } else if (rand < 0.080) {
            this.tiles[r][c] = CONSTANTS.TILES.PLASMA_NODE;
            this.addHarvestable(c, r, 'plasma_node', 'Trụ Năng Lượng Plasma', 'plasma_core', 1, 30);
          }
        }
      }
    }

    // 8. Place Central Base Structures: Bio-Lab, Furnace, Workbench, Workshop
    this.structures = [];
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

    for (let r = 32; r <= 38; r++) {
      for (let c = 32; c <= 50; c++) {
        this.tiles[r][c] = CONSTANTS.TILES.DIRT_PATH;
      }
    }

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

    for (let r = 38; r <= 42; r++) {
      for (let c = 27; c <= 31; c++) {
        this.tiles[r][c] = CONSTANTS.TILES.DIRT_PATH;
      }
    }

    // 9. Populate Wild Flora in Plains (Berry bushes)
    this.wildFlora = [];
    this.spawnWildFlora(16);

    // 10. Pre-render Static Ground & Cliffs into Offscreen Cache Canvas for 60FPS!
    this.buildGroundCache();
  }

  getUnderlyingGroundTile(rawTileId, r) {
    if (rawTileId === CONSTANTS.TILES.TREE_ALIEN_PINE || rawTileId === CONSTANTS.TILES.TREE_POST_APOC) {
      return CONSTANTS.TILES.GRASS;
    } else if (
      rawTileId === CONSTANTS.TILES.ORE_SULFUR ||
      rawTileId === CONSTANTS.TILES.ORE_QUARTZ ||
      rawTileId === CONSTANTS.TILES.ORE_TITANIUM ||
      rawTileId === CONSTANTS.TILES.HERB_SILVER_MOSS ||
      rawTileId === CONSTANTS.TILES.ALIEN_EGG
    ) {
      return CONSTANTS.TILES.MOUNTAIN_ROCK;
    } else if (rawTileId === CONSTANTS.TILES.HERB_SNOW_LOTUS) {
      return (r < 9) ? CONSTANTS.TILES.SNOW_PEAK : CONSTANTS.TILES.MOUNTAIN_ROCK;
    } else if (rawTileId === CONSTANTS.TILES.TECH_DEBRIS || rawTileId === CONSTANTS.TILES.PLASMA_NODE) {
      return CONSTANTS.TILES.SAND;
    }
    return rawTileId;
  }

  // Pre-renders the entire static ground tile map + cliffs + mountain peaks into a single canvas
  buildGroundCache() {
    if (!this.groundCanvas) {
      this.groundCanvas = document.createElement('canvas');
      this.groundCanvas.width = this.width;
      this.groundCanvas.height = this.height;
      this.groundCtx = this.groundCanvas.getContext('2d');
    }
    const gctx = this.groundCtx;

    // 1. Draw all base ground tiles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tileId = this.getUnderlyingGroundTile(this.tiles[r][c], r);
        const sprite = window.pixelArt.get('tile_' + tileId);
        const x = c * this.tileSize;
        const y = r * this.tileSize;
        if (sprite) {
          gctx.drawImage(sprite, x, y, this.tileSize, this.tileSize);
        } else {
          gctx.fillStyle = '#2d5a27';
          gctx.fillRect(x, y, this.tileSize, this.tileSize);
        }
      }
    }

    // 2. Draw Vertical Mountain Cliff Walls
    const cliffWallSprite = window.pixelArt.get('cliff_face_vertical');
    if (cliffWallSprite && this.cliffBorders) {
      for (let cb of this.cliffBorders) {
        gctx.drawImage(cliffWallSprite, cb.x, cb.y);
        gctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        gctx.fillRect(cb.x, cb.y + this.tileSize, this.tileSize, 8);
      }
    }

    // 3. Draw Static Mountain Peaks, Spires & Sulfur Fissures
    if (this.mountainPeaks) {
      for (let peak of this.mountainPeaks) {
        const sprite = window.pixelArt.get(peak.type);
        if (sprite) {
          gctx.drawImage(sprite, peak.x, peak.y);
        }
      }
    }
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
    let blightedCount = 0;
    for (let plant of this.wildFlora) {
      if (!plant.isHarvested && !plant.isBlighted) {
        plant.isBlighted = true;
        blightedCount++;
      }
    }

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
    const nodeCfg = (CONSTANTS.RESOURCE_NODES && CONSTANTS.RESOURCE_NODES[type]) ? CONSTANTS.RESOURCE_NODES[type] : null;
    const obj = {
      col,
      row,
      x: col * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2,
      type,
      name: name || (nodeCfg ? nodeCfg.name : type),
      dropItemId: dropItemId || (nodeCfg ? nodeCfg.dropItemId : 'wood'),
      dropCount: dropCount !== undefined ? dropCount : (nodeCfg ? nodeCfg.dropCount : 1),
      hp: hp !== undefined ? hp : (nodeCfg ? nodeCfg.hp : 20),
      maxHp: hp !== undefined ? hp : (nodeCfg ? nodeCfg.hp : 20),
      isDestroyed: false,
      ...metadata
    };
    this.harvestables.push(obj);
    this.harvestableTileMap.set(this._tileKey(col, row), obj);
    if (type === 'alien_tree' || (nodeCfg && nodeCfg.isTree)) {
      this.treeNodes.push(obj);
    } else {
      this.resourceNodes.push(obj);
    }
    return obj;
  }

  removeHarvestableFromMap(node) {
    if (!node) return;
    node.isDestroyed = true;
    if (this.harvestableTileMap && node.col !== undefined && node.row !== undefined) {
      this.harvestableTileMap.delete(this._tileKey(node.col, node.row));
    }
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
        if (
          tile === CONSTANTS.TILES.SNOW_PEAK ||
          tile === CONSTANTS.TILES.OCEAN_DEEP ||
          tile === CONSTANTS.TILES.LAKE_WATER ||
          tile === CONSTANTS.TILES.RIVER_WATER
        ) {
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

    if (this.game && this.game.buildingManager && this.game.buildingManager.isBlocking(x, y, radius)) {
      return true;
    }

    return false;
  }

  // Find a valid non-colliding land position near (x, y) so monsters never spawn stuck in water/cliffs
  findSafeSpawnPoint(x, y, radius = 18) {
    const pad = radius + 8;
    const cx = Math.max(pad, Math.min(this.width - pad, x));
    const cy = Math.max(pad, Math.min(this.height - pad, y));
    if (!this.isColliding(cx, cy, radius)) {
      return { x: cx, y: cy };
    }

    for (let dist = 16; dist <= 288; dist += 16) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const tx = Math.max(pad, Math.min(this.width - pad, cx + Math.cos(angle) * dist));
        const ty = Math.max(pad, Math.min(this.height - pad, cy + Math.sin(angle) * dist));
        if (!this.isColliding(tx, ty, radius)) {
          return { x: tx, y: ty };
        }
      }
    }
    return { x: 35 * this.tileSize, y: 38 * this.tileSize };
  }

  // Smart Waypoint Routing: guides monsters over wooden bridges when the river separates them from their target
  getSmartWaypoint(x, y, targetX, targetY) {
    if (!this.bridgeCrossings || this.bridgeCrossings.length === 0) {
      return { x: targetX, y: targetY };
    }

    let crossesRiver = false;
    const steps = 8;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sx = x + (targetX - x) * t;
      const sy = y + (targetY - y) * t;
      const tile = this.getTile(Math.floor(sx / this.tileSize), Math.floor(sy / this.tileSize));
      if (tile === CONSTANTS.TILES.RIVER_WATER) {
        crossesRiver = true;
        break;
      }
    }

    if (!crossesRiver) {
      return { x: targetX, y: targetY };
    }

    let bestBridge = this.bridgeCrossings[0];
    let bestScore = Infinity;
    for (let i = 0; i < this.bridgeCrossings.length; i++) {
      const b = this.bridgeCrossings[i];
      const score = Math.abs(y - b.y) + Math.abs(targetY - b.y) * 0.35;
      if (score < bestScore) {
        bestScore = score;
        bestBridge = b;
      }
    }

    if (Math.abs(y - bestBridge.y) > 22) {
      const entryX = (x < bestBridge.x) ? bestBridge.westEntryX : bestBridge.eastEntryX;
      return { x: entryX, y: bestBridge.y };
    }

    const exitX = (targetX < bestBridge.x) ? bestBridge.westEntryX : bestBridge.eastEntryX;
    return { x: exitX, y: bestBridge.y };
  }

  // O(1) Tile-Window Harvestable Lookup (replaces O(N) full array scan!)
  getHarvestableAt(x, y, reach = 50) {
    const rSq = reach * reach;
    const centerCol = Math.floor(x / this.tileSize);
    const centerRow = Math.floor(y / this.tileSize);
    const span = Math.ceil(reach / this.tileSize);
    let best = null;
    let bestDistSq = rSq;

    for (let r = centerRow - span; r <= centerRow + span; r++) {
      const rowBits = r << 8;
      for (let c = centerCol - span; c <= centerCol + span; c++) {
        const h = this.harvestableTileMap.get(rowBits | c);
        if (!h || h.isDestroyed) continue;
        const dx = h.x - x;
        const dy = h.y - y;
        const dSq = dx * dx + dy * dy;
        if (dSq <= bestDistSq) {
          bestDistSq = dSq;
          best = h;
        }
      }
    }
    return best;
  }

  damageHarvestable(h, damage) {
    h.hp -= damage;
    if (h.hp <= 0) {
      h.isDestroyed = true;
      const row = h.row;
      const col = h.col;
      if (row <= CONSTANTS.BIOME_MOUNTAIN_END) {
        this.tiles[row][col] = CONSTANTS.TILES.MOUNTAIN_SLATE;
      } else if (row >= CONSTANTS.BIOME_PLAINS_END) {
        this.tiles[row][col] = CONSTANTS.TILES.SAND;
      } else {
        this.tiles[row][col] = CONSTANTS.TILES.GRASS;
      }
      if (this.game) {
        this.game.minimapDirty = true;
      }
      return true;
    }
    return false;
  }

  getWildFloraAt(x, y, reach = 40) {
    const rSq = reach * reach;
    for (let i = 0; i < this.wildFlora.length; i++) {
      const f = this.wildFlora[i];
      if (f.isHarvested) continue;
      const dx = f.x - x;
      const dy = f.y - y;
      if (dx * dx + dy * dy <= rSq) return f;
    }
    return null;
  }

  harvestWildFlora(f) {
    if (f.isHarvested) return null;
    f.isHarvested = true;
    return f.isBlighted ? 'blighted_berry' : 'wild_berry';
  }

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

  getStructureNear(x, y, reach = 65) {
    for (let s of this.structures) {
      const cx = s.doorX || (s.x + s.width / 2);
      const cy = s.doorY || (s.y + s.height / 2);
      if (Math.hypot(x - cx, y - cy) <= reach) {
        return s;
      }
      if (s.type === 'biolab') {
        const midX = s.x + s.width / 2;
        const midY = s.y + s.height / 2 - 12;
        if (Math.hypot(x - midX, y - midY) <= reach + 38) {
          return s;
        }
      }
    }
    return null;
  }

  getAlienEggNear(x, y, reach = 68) {
    const rSq = reach * reach;
    const centerCol = Math.floor(x / this.tileSize);
    const centerRow = Math.floor(y / this.tileSize);
    const span = Math.ceil(reach / this.tileSize);

    for (let r = centerRow - span; r <= centerRow + span; r++) {
      const rowBits = r << 8;
      for (let c = centerCol - span; c <= centerCol + span; c++) {
        const h = this.harvestableTileMap.get(rowBits | c);
        if (!h || h.isDestroyed || h.type !== 'alien_egg') continue;
        const dx = h.x - x;
        const dy = h.y - y;
        if (dx * dx + dy * dy <= rSq) {
          return h;
        }
      }
    }
    return null;
  }

  pickupAlienEgg(eggObj, game) {
    if (!eggObj || eggObj.isDestroyed) return false;
    eggObj.hp = 0;
    eggObj.isDestroyed = true;
    const row = eggObj.row;
    const col = eggObj.col;
    if (row <= CONSTANTS.BIOME_MOUNTAIN_END) {
      this.tiles[row][col] = CONSTANTS.TILES.MOUNTAIN_SLATE;
    } else {
      this.tiles[row][col] = CONSTANTS.TILES.GRASS;
    }

    if (game && game.inventory) {
      game.inventory.addItem('monster_egg', 1);
      game.inventory.addItem('egg_fluid', 1);
    }
    if (window.audioManager) window.audioManager.playEquip();

    if (game && game.particles) {
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 25 + Math.random() * 55;
        game.particles.push(new Particle(eggObj.x, eggObj.y, Math.cos(a) * spd, Math.sin(a) * spd, '#f0abfc', 3.5, 0.35));
      }
    }

    const msg = '🥚 ĐÃ NHẶT +1 TRỨNG QUÁI VẬT NGUYÊN VẸN! (Mang về Phòng Lab để ấp Pet!)';
    if (game && game.floatingTexts) {
      game.floatingTexts.push(new FloatingText(eggObj.x, eggObj.y - 26, msg, '#facc15', 12, 1.8));
    }
    if (game && game.saveManager) {
      game.saveManager.showSaveToast(msg);
    }
    if (game) game.minimapDirty = true;
    return true;
  }

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

  drawObjectBadge(ctx, x, y, text, borderColor = '#38bdf8', textColor = '#f8fafc', bgAlpha = 0.82) {
    ctx.save();
    ctx.font = 'bold 10px "Segoe UI", Tahoma, sans-serif';
    const paddingX = 7;
    let textWidth = this._badgeWidthCache[text];
    if (textWidth === undefined) {
      textWidth = ctx.measureText(text).width;
      this._badgeWidthCache[text] = textWidth;
    }
    const boxW = textWidth + paddingX * 2;
    const boxH = 18;
    const bx = x - boxW / 2;
    const by = y - boxH / 2;

    ctx.fillStyle = `rgba(9, 13, 22, ${bgAlpha})`;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.2;
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 0.5);
    ctx.restore();
  }

  render(ctx, camera, player = null) {
    const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.ceil((camera.x + camera.width) / this.tileSize));
    const startRow = Math.max(0, Math.floor(camera.y / this.tileSize));
    const endRow = Math.min(this.rows - 1, Math.ceil((camera.y + camera.height) / this.tileSize));
    const now = performance.now();
    const mouseWorldX = (this.game && this.game.mouse) ? this.game.mouse.worldX : -9999;
    const mouseWorldY = (this.game && this.game.mouse) ? this.game.mouse.worldY : -9999;

    // 1. Blit Pre-Rendered Ground + Cliffs + Mountain Peaks in a SINGLE drawImage call!
    if (this.groundCanvas) {
      const sx = Math.max(0, Math.floor(camera.x));
      const sy = Math.max(0, Math.floor(camera.y));
      const sw = Math.min(this.width - sx, Math.ceil(camera.width) + 2);
      const sh = Math.min(this.height - sy, Math.ceil(camera.height) + 2);
      if (sw > 0 && sh > 0) {
        ctx.drawImage(this.groundCanvas, sx, sy, sw, sh, sx - camera.x, sy - camera.y, sw, sh);
      }
    }

    // 2. Animated Water Caustic Shimmer (Only drawn on visible water tiles)
    ctx.fillStyle = 'rgba(186, 230, 253, 0.16)';
    for (let r = startRow; r <= endRow; r++) {
      const rowTiles = this.tiles[r];
      for (let c = startCol; c <= endCol; c++) {
        const rawTileId = rowTiles[c];
        if (
          rawTileId === CONSTANTS.TILES.RIVER_WATER ||
          rawTileId === CONSTANTS.TILES.LAKE_WATER ||
          rawTileId === CONSTANTS.TILES.OCEAN_SHALLOW ||
          rawTileId === CONSTANTS.TILES.OCEAN_DEEP
        ) {
          const waveOffset = Math.sin(now * 0.003 + c * 0.7 + r * 0.5) * 3;
          ctx.fillRect(c * this.tileSize - camera.x + 6 + waveOffset, r * this.tileSize - camera.y + 14, 14, 2);
        }
      }
    }

    // 3. Render 2.5D Standing Resource Nodes (Data-Driven via CONSTANTS.RESOURCE_NODES)
    const resourceVisualMap = CONSTANTS.RESOURCE_NODES || {};

    const camLeft = camera.x - 60;
    const camRight = camera.x + camera.width + 60;
    const camTop = camera.y - 60;
    const camBottom = camera.y + camera.height + 60;
    const zoomFactor = camera.zoom || 1;
    const badgeDetectDist = Math.round(115 / Math.min(1, zoomFactor));

    for (let i = 0; i < this.resourceNodes.length; i++) {
      const h = this.resourceNodes[i];
      if (h.isDestroyed) continue;
      if (h.x < camLeft || h.x > camRight || h.y < camTop || h.y > camBottom) continue;

      const vis = resourceVisualMap[h.type];
      if (!vis) continue;

      const sx = h.x - camera.x;
      const sy = h.y - camera.y;

      // Ground ring
      ctx.strokeStyle = vis.color;
      ctx.lineWidth = zoomFactor < 0.75 ? 2.0 : 1.4;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 8, vis.w * 0.36, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      const sprite = window.pixelArt.get(vis.sprite);
      if (sprite) {
        if (h.type === 'alien_egg') {
          const scaleX = 1 + Math.sin(now * 0.005 + h.row) * 0.045;
          const scaleY = 1 - Math.sin(now * 0.005 + h.row) * 0.045;
          ctx.save();
          ctx.translate(sx, sy + 10);
          ctx.scale(scaleX, scaleY);
          ctx.drawImage(sprite, -vis.w / 2, -vis.h + 8, vis.w, vis.h);
          ctx.restore();
        } else {
          ctx.drawImage(sprite, sx - vis.w / 2, sy - vis.h / 2 - 2, vis.w, vis.h);
        }
      }

      if (h.hp < h.maxHp) {
        const bw = 30, bh = 4;
        const pct = Math.max(0, h.hp / h.maxHp);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(sx - bw / 2 - 1, sy - 25, bw + 2, bh + 2);
        ctx.fillStyle = vis.color;
        ctx.fillRect(sx - bw / 2, sy - 24, bw * pct, bh);
      }

      const dxP = player ? Math.abs(player.x - h.x) : 9999;
      const dyP = player ? Math.abs(player.y - h.y) : 9999;
      const dxM = Math.abs(mouseWorldX - h.x);
      const dyM = Math.abs(mouseWorldY - h.y);
      if ((dxP <= badgeDetectDist && dyP <= badgeDetectDist) || (dxM <= 36 && dyM <= 36)) {
        this.drawObjectBadge(ctx, sx, sy - 28, `${vis.icon} ${vis.tag}`, vis.color, '#ffffff');
      } else if (zoomFactor <= 0.78) {
        // Compact resource beacon icon when zoomed out on mobile so resources are easy to spot from afar
        this.drawObjectBadge(ctx, sx, sy - 26, vis.icon, vis.color, '#ffffff', 0.75);
      }
    }

    // 4. Render Wild Flora (Berry Bushes)
    for (let i = 0; i < this.wildFlora.length; i++) {
      const f = this.wildFlora[i];
      if (f.isHarvested) continue;
      if (f.x < camLeft || f.x > camRight || f.y < camTop || f.y > camBottom) continue;

      const sx = f.x - camera.x;
      const sy = f.y - camera.y;
      const spriteName = f.isBlighted ? 'tile_berry_blighted' : 'tile_berry_clean';
      const sprite = window.pixelArt.get(spriteName);
      const sway = Math.sin(now * 0.0025 + f.col) * 1.0;

      if (sprite) {
        ctx.drawImage(sprite, sx - 20 + sway, sy - 22, 40, 40);
      }

      const dxP = player ? Math.abs(player.x - f.x) : 9999;
      const dyP = player ? Math.abs(player.y - f.y) : 9999;
      const dxM = Math.abs(mouseWorldX - f.x);
      const dyM = Math.abs(mouseWorldY - f.y);
      if ((dxP <= 100 && dyP <= 100) || (dxM <= 30 && dyM <= 30)) {
        const label = f.isBlighted ? '☣ Quả Đột Biến (Nhiễm Độc!)' : '🍓 Quả Rừng Sạch (+18 HP)';
        const borderCol = f.isBlighted ? '#e879f9' : '#4ade80';
        this.drawObjectBadge(ctx, sx, sy - 26, label, borderCol, '#ffffff');
      }
    }

    // 5. Render Central Base Structures (Bio-Lab + Expanded Greenhouse Pods, Furnace, Workbench, Workshop)
    const stationMeta = {
      biolab:    { sprite: 'building_biolab',    label: '🧬 PHÒNG LAB & TRỒNG CÂY [F]', color: '#10b981' },
      furnace:   { sprite: 'building_furnace',   label: '🔥 LÒ NUNG KHỬ TRÙNG [F]',     color: '#f97316' },
      workbench: { sprite: 'building_workbench', label: '🔨 BÀN CHẾ TẠO [F]',           color: '#eab308' },
      workshop:  { sprite: 'building_workshop',  label: '⚙ XƯỞNG THỦ THÀNH & SÚNG [F]', color: '#38bdf8' }
    };

    const podSpriteMap = {
      seed_snow_lotus: 'obj_snow_lotus',
      seed_silver_moss: 'obj_silver_moss',
      seed_wild_berry: 'tile_berry_clean',
      seed_quartz_bloom: 'obj_quartz_ore'
    };

    for (let s of this.structures) {
      const sx = s.x - camera.x;
      const sy = s.y - camera.y;
      const cx = sx + s.width / 2;
      const cy = sy + s.height / 2;

      if (cx < -320 || cx > camera.width + 320 || cy < -320 || cy > camera.height + 320) continue;

      if (s.type === 'biolab') {
        const labSys = (this.game && this.game.lab) ? this.game.lab : null;
        const labLv = labSys ? (labSys.labLevel || 1) : 1;
        const isoRad = s.isolationRadius || 150;

        // 5a. Quarantine Aura scaled to upgraded isolationRadius
        const auraSpr = window.pixelArt.get('fx_biolab_aura');
        if (auraSpr) {
          const auraDiam = isoRad * 2;
          ctx.drawImage(auraSpr, cx - auraDiam / 2, cy - auraDiam / 2, auraDiam, auraDiam);
        }

        if (labLv >= 2) {
          ctx.save();
          ctx.strokeStyle = labLv >= 4 ? 'rgba(250, 204, 21, 0.42)' : (labLv === 3 ? 'rgba(192, 132, 252, 0.38)' : 'rgba(56, 189, 248, 0.35)');
          ctx.lineWidth = 1.6;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(cx, cy, isoRad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // 5b. Render Hydroponic Greenhouse Plots around the Bio-Lab (3 -> 6 -> 9 -> 12 Pods)
        const podOffsets = [
          // Lv.1 (3 Pods - North Terrace Row 1)
          { dx: 14, dy: -22 }, { dx: 48, dy: -22 }, { dx: 82, dy: -22 },
          // Lv.2 (+3 Pods = 6 Pods - West & East Greenhouse Wings)
          { dx: -22, dy: 22 }, { dx: -22, dy: 58 }, { dx: 118, dy: 22 },
          // Lv.3 (+3 Pods = 9 Pods - North Terrace Row 2)
          { dx: 14, dy: -58 }, { dx: 48, dy: -58 }, { dx: 82, dy: -58 },
          // Lv.4 (+3 Pods = 12 Pods - Outer Corner Biosphere Pods)
          { dx: 118, dy: 58 }, { dx: -22, dy: -22 }, { dx: 118, dy: -22 }
        ];

        const pods = (labSys && Array.isArray(labSys.hydroPods)) ? labSys.hydroPods : [];
        const podBedSpr = window.pixelArt.get('building_greenhouse_pod');

        for (let i = 0; i < pods.length && i < podOffsets.length; i++) {
          const pod = pods[i];
          const off = podOffsets[i];
          const px = sx + off.dx;
          const py = sy + off.dy;

          if (podBedSpr) {
            ctx.drawImage(podBedSpr, px - 18, py - 18, 36, 36);
          }

          if (pod.seedId) {
            const pct = Math.min(1, Math.max(0, pod.progress / (pod.growthTime || 35)));
            const cropSprKey = podSpriteMap[pod.seedId] || 'obj_snow_lotus';
            const cropSpr = window.pixelArt.get(cropSprKey);
            if (cropSpr) {
              const scale = 0.42 + pct * 0.44;
              const drawW = 34 * scale;
              const drawH = 34 * scale;
              ctx.drawImage(cropSpr, px - drawW / 2, py - drawH / 2 - 2, drawW, drawH);
            }

            if (pod.ready) {
              const pulse = 0.65 + Math.sin(now * 0.006 + i) * 0.3;
              ctx.strokeStyle = `rgba(250, 204, 21, ${pulse.toFixed(2)})`;
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.arc(px, py, 15, 0, Math.PI * 2);
              ctx.stroke();
            } else {
              // Mini progress bar on greenhouse bed
              const bw = 22, bh = 3;
              ctx.fillStyle = '#090d16';
              ctx.fillRect(px - bw / 2 - 1, py + 11, bw + 2, bh + 1);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(px - bw / 2, py + 11.5, bw * pct, bh);
            }
          }
        }
      }

      const meta = stationMeta[s.type];
      if (meta) {
        const sprite = window.pixelArt.get(meta.sprite);
        if (sprite) {
          ctx.drawImage(sprite, sx, sy, s.width, s.height);
        }
        const distP = player ? Math.hypot(player.x - (s.x + s.width / 2), player.y - (s.y + s.height / 2)) : 9999;
        const isNear = distP <= 115;

        let badgeText = meta.label;
        let badgeCol = isNear ? '#ffffff' : meta.color;
        let badgeY = sy - 10;

        if (s.type === 'biolab' && this.game && this.game.lab) {
          const lv = this.game.lab.labLevel || 1;
          const totalPods = this.game.lab.hydroPods ? this.game.lab.hydroPods.length : 3;
          const readyCnt = this.game.lab.hydroPods ? this.game.lab.hydroPods.filter(p => p.seedId && p.ready).length : 0;
          badgeY = lv >= 3 ? sy - 78 : sy - 42;
          if (readyCnt > 0) {
            badgeText = `✨ LAB LV.${lv} (${readyCnt}/${totalPods} CÂY ĐÃ CHÍN - BẤM [F] THU HOẠCH!)`;
            badgeCol = '#facc15';
          } else {
            badgeText = `🧬 PHÒNG LAB LV.${lv} (${totalPods} LỒNG TRỒNG CÂY) [F]`;
          }
        }

        this.drawObjectBadge(
          ctx,
          cx,
          badgeY,
          badgeText,
          badgeCol,
          isNear ? '#fef08a' : '#f8fafc',
          isNear ? 0.95 : 0.80
        );
      }
    }

    // 6. Render Multi-tier Trees (Frustum Culling via this.treeNodes)
    const treeLeft = camera.x - 80;
    const treeRight = camera.x + camera.width + 80;
    const treeTop = camera.y - 90;
    const treeBottom = camera.y + camera.height + 110;

    for (let i = 0; i < this.treeNodes.length; i++) {
      const h = this.treeNodes[i];
      if (h.x < treeLeft || h.x > treeRight || h.y < treeTop || h.y > treeBottom) continue;

      const screenX = h.x - camera.x;
      const screenY = h.y - camera.y;

      if (h.isDestroyed) {
        const stumpSprite = window.pixelArt.get('tree_stump');
        if (stumpSprite) {
          ctx.drawImage(stumpSprite, screenX - 16, screenY - 12);
        }
      } else {
        const variant = h.treeVariant || 'ancient_pine';
        let spriteKey = 'tree_ancient_pine';
        let treeW = 64, treeH = 92;

        if (variant === 'alien_pine') {
          spriteKey = 'tree_alien_pine';
          treeH = 96;
        } else if (variant === 'dead_apoc') {
          spriteKey = 'tree_dead_apoc';
          treeH = 88;
        }

        const treeSprite = window.pixelArt.get(spriteKey) || window.pixelArt.get('tree_ancient_pine');
        if (treeSprite) {
          const sway = Math.sin(now * 0.0018 + (h.swayOffset || 0)) * 1.5;
          const drawX = screenX - treeW / 2 + sway;
          const drawY = screenY - (treeH - 14);

          let isPlayerUnder = false;
          if (player) {
            const dx = Math.abs(player.x - h.x);
            const dy = player.y - (h.y - 34);
            if (dx < 32 && dy > -46 && dy < 22) {
              isPlayerUnder = true;
            }
          }

          if (isPlayerUnder) {
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.drawImage(treeSprite, drawX, drawY, treeW, treeH);
            ctx.restore();
          } else {
            ctx.drawImage(treeSprite, drawX, drawY, treeW, treeH);
          }

          if (h.hp < h.maxHp) {
            const bw = 32, bh = 4;
            ctx.fillStyle = '#090d16';
            ctx.fillRect(screenX - bw / 2 - 1, screenY - 22, bw + 2, bh + 2);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(screenX - bw / 2, screenY - 21, bw * (h.hp / h.maxHp), bh);
          }
          if (Math.abs(mouseWorldX - h.x) <= 26 && Math.abs(mouseWorldY - h.y) <= 26) {
            this.drawObjectBadge(ctx, screenX, drawY + 12, `🌲 ${h.name} (+4 Gỗ)`, '#4ade80', '#ffffff');
          }
        }
      }
    }

    // 7. Render Atmospheric Mountain Mist Clouds using Pre-Rendered Sprite (Zero per-frame gradient allocation!)
    if (this.mountainMists && camera.y < CONSTANTS.BIOME_MOUNTAIN_END * this.tileSize + 200) {
      const mistSprite = window.pixelArt.get('fx_mist_cloud');
      if (mistSprite) {
        for (let mist of this.mountainMists) {
          mist.x += mist.speed * 0.016;
          if (mist.x > this.width + mist.width) mist.x = -mist.width;

          const mx = mist.x - camera.x;
          const my = mist.y - camera.y;
          if (mx + mist.width >= 0 && mx <= camera.width && my + mist.height >= 0 && my <= camera.height) {
            ctx.drawImage(mistSprite, mx, my, mist.width, mist.height);
          }
        }
      }
    }

    // 8. Render Drifting Ambient Forest Spores & Embers
    if (this.ambientSpores) {
      for (let i = 0; i < this.ambientSpores.length; i++) {
        const spore = this.ambientSpores[i];
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
          ctx.fillRect(sx - spore.radius, sy - spore.radius, spore.radius * 2, spore.radius * 2);
        }
      }
    }
  }
}

// Global instance
window.WorldMap = WorldMap;
