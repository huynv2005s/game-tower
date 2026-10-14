// Procedural Pixel Art Sprite Generator
// Generates high quality pixel art textures, player sprites, weapons, and items on offscreen canvases

class PixelArt {
  constructor() {
    this.cache = {};
  }

  init() {
    this.generateTileSprites();
    this.generateMountainAndForestSprites();
    this.generatePlayerSprites();
    this.generateWeaponSprites();
    this.generateItemIcons();
    this.generateMonsterSprites();
    this.generatePhase2Sprites();
    this.generatePhase3Sprites();
  }

  createCanvas(width, height) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: ctx };
  }

  // Draw pixel grid from ascii / color map
  drawPixelMatrix(ctx, matrix, colorMap, scale = 1, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < matrix.length; y++) {
      const row = matrix[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        const color = colorMap[char];
        if (color && color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
        }
      }
    }
  }

  generateTileSprites() {
    const S = CONSTANTS.TILE_SIZE; // 32

    // 1. Grass Tile (Rich deep woodland meadow)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Dark earth underbed
      ctx.fillStyle = '#1c3d19';
      ctx.fillRect(0, 0, S, S);
      // Base grass gradient patches
      ctx.fillStyle = '#265322';
      ctx.fillRect(1, 1, 30, 30);
      ctx.fillStyle = '#2e6329';
      ctx.fillRect(3, 4, 12, 10);
      ctx.fillRect(16, 12, 13, 14);
      // Fine grass tufts & highlights
      ctx.fillStyle = '#3d7e36';
      for (let i = 0; i < 22; i++) {
        const rx = (i * 9) % 30;
        const ry = (i * 13) % 30;
        ctx.fillRect(rx, ry, 2, 3);
        ctx.fillRect(rx + 1, ry - 1, 1, 2);
      }
      ctx.fillStyle = '#529e49';
      for (let i = 0; i < 10; i++) {
        const rx = (i * 13 + 5) % 29;
        const ry = (i * 17 + 3) % 29;
        ctx.fillRect(rx, ry, 1, 2);
      }
      ctx.fillStyle = '#142c12';
      for (let i = 0; i < 8; i++) {
        const rx = (i * 11 + 2) % 28;
        const ry = (i * 19 + 7) % 28;
        ctx.fillRect(rx, ry, 2, 2);
      }
      this.cache['tile_' + CONSTANTS.TILES.GRASS] = canvas;
    }

    // 2. Grass Flowers (Bioluminescent Alien Flora)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);
      // Luminescent flowers & alien spore blooms
      ctx.fillStyle = '#f43f5e'; // Crimson alien rose
      ctx.fillRect(6, 8, 4, 4);
      ctx.fillStyle = '#fda4af';
      ctx.fillRect(7, 9, 2, 2);

      ctx.fillStyle = '#a855f7'; // Toxic purple orchid
      ctx.fillRect(20, 20, 4, 4);
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(21, 21, 2, 2);

      ctx.fillStyle = '#06b6d4'; // Cyan spore blossom
      ctx.fillRect(18, 6, 3, 3);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(19, 7, 1, 1);

      ctx.fillStyle = '#eab308'; // Amber pollen head
      ctx.fillRect(8, 22, 3, 3);
      this.cache['tile_' + CONSTANTS.TILES.GRASS_FLOWERS] = canvas;
    }

    // 3. Dirt Path
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#453023';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#5c402f';
      ctx.fillRect(2, 2, 28, 28);
      ctx.fillStyle = '#73523d';
      for (let i = 0; i < 16; i++) {
        ctx.fillRect((i * 9) % 29, (i * 15) % 29, 3, 2);
      }
      ctx.fillStyle = '#36241a';
      ctx.fillRect(5, 12, 5, 3);
      ctx.fillRect(20, 8, 4, 3);
      ctx.fillRect(12, 24, 6, 2);
      // Small pebbles
      ctx.fillStyle = '#8c7365';
      ctx.fillRect(8, 6, 2, 2);
      ctx.fillRect(24, 18, 2, 2);
      ctx.fillRect(15, 15, 1, 1);
      this.cache['tile_' + CONSTANTS.TILES.DIRT_PATH] = canvas;
    }

    // 4. Mountain Rock (Majestic Chiseled Granite with Strata & Fissures)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Deep rock bedrock base
      ctx.fillStyle = '#1e222a';
      ctx.fillRect(0, 0, S, S);
      // Granite mass
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(1, 1, 30, 30);
      ctx.fillStyle = '#404856';
      ctx.fillRect(3, 2, 26, 12);
      ctx.fillRect(2, 16, 27, 13);
      // Chiseled highlights & bevels (top-left lighting)
      ctx.fillStyle = '#647084';
      ctx.fillRect(3, 2, 26, 2);
      ctx.fillRect(2, 16, 27, 2);
      ctx.fillRect(3, 2, 2, 12);
      ctx.fillStyle = '#8392a8';
      ctx.fillRect(4, 3, 8, 2);
      ctx.fillRect(18, 17, 7, 2);
      // Deep angular geological fissure cracks
      ctx.fillStyle = '#14171d';
      ctx.fillRect(8, 6, 14, 2);
      ctx.fillRect(20, 8, 2, 14);
      ctx.fillRect(12, 18, 10, 2);
      ctx.fillRect(6, 20, 2, 8);
      // Quartz/mineral flecks
      ctx.fillStyle = '#a0aec0';
      ctx.fillRect(10, 10, 2, 2);
      ctx.fillRect(22, 24, 2, 2);
      ctx.fillRect(16, 8, 1, 1);
      this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK] = canvas;
    }

    // 4b. Mountain Slate (Dark Stratified Basalt Cliff Surface)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#14171e';
      ctx.fillRect(0, 0, S, S);
      // Horizontal slate cleavage layers
      ctx.fillStyle = '#242a35';
      ctx.fillRect(1, 1, 30, 7);
      ctx.fillRect(1, 9, 30, 8);
      ctx.fillRect(1, 18, 30, 7);
      ctx.fillRect(1, 26, 30, 5);
      // Slate shelf highlights
      ctx.fillStyle = '#3d4657';
      ctx.fillRect(2, 1, 28, 2);
      ctx.fillRect(2, 9, 28, 2);
      ctx.fillRect(2, 18, 28, 2);
      ctx.fillStyle = '#56627a';
      ctx.fillRect(4, 2, 12, 1);
      ctx.fillRect(18, 10, 10, 1);
      // Crevices and shadows
      ctx.fillStyle = '#0b0d11';
      ctx.fillRect(0, 8, S, 1);
      ctx.fillRect(0, 17, S, 1);
      ctx.fillRect(0, 25, S, 1);
      ctx.fillRect(14, 2, 1, 6);
      ctx.fillRect(22, 11, 1, 6);
      // Ancient highland lichen
      ctx.fillStyle = '#3f6212';
      ctx.fillRect(5, 5, 3, 2);
      ctx.fillRect(19, 21, 4, 2);
      this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_SLATE] = canvas;
    }

    // 5. Snow Peak (Majestic Alpine Glacial Crest)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Dark rock bedrock
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, S, S);
      // Glacial ice base
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(2, 2, 28, 28);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(3, 3, 26, 26);
      // Wind-swept snow drifts
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(2, 2, 20, 20);
      ctx.fillRect(8, 12, 22, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 3, 14, 12);
      ctx.fillRect(12, 15, 14, 10);
      // Shaded eastern ice crevasse
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(22, 4, 6, 24);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(26, 6, 4, 22);
      // Glistening diamond frost
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 6, 3, 3);
      ctx.fillRect(16, 18, 3, 3);
      ctx.fillRect(8, 24, 2, 2);
      this.cache['tile_' + CONSTANTS.TILES.SNOW_PEAK] = canvas;
    }

    // 6. Sulfur Ore
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);
      // Yellow sulfur crystals
      ctx.fillStyle = '#f9d423';
      ctx.fillRect(10, 8, 5, 4);
      ctx.fillRect(18, 14, 6, 5);
      ctx.fillRect(8, 20, 5, 4);
      ctx.fillStyle = '#fff475';
      ctx.fillRect(11, 9, 2, 2);
      ctx.fillRect(19, 15, 2, 2);
      ctx.fillStyle = '#d39e00';
      ctx.fillRect(10, 12, 5, 1);
      ctx.fillRect(18, 19, 6, 1);
      this.cache['tile_' + CONSTANTS.TILES.ORE_SULFUR] = canvas;
    }

    // 7. Quartz Ore
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);
      // Radiant cyan crystals
      ctx.fillStyle = '#00f2fe';
      ctx.fillRect(8, 10, 6, 6);
      ctx.fillRect(18, 12, 7, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 11, 2, 2);
      ctx.fillRect(20, 13, 2, 3);
      ctx.fillStyle = '#4facfe';
      ctx.fillRect(14, 14, 2, 2);
      this.cache['tile_' + CONSTANTS.TILES.ORE_QUARTZ] = canvas;
    }

    // 8. Snow Lotus Herb
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.SNOW_PEAK], 0, 0);
      // Sacred lotus
      ctx.fillStyle = '#c77dff';
      ctx.fillRect(12, 10, 8, 12);
      ctx.fillRect(10, 14, 12, 6);
      ctx.fillStyle = '#e0aaff';
      ctx.fillRect(14, 12, 4, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 13, 2, 3);
      this.cache['tile_' + CONSTANTS.TILES.HERB_SNOW_LOTUS] = canvas;
    }

    // 9. Silver Moss Herb
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);
      ctx.fillStyle = '#80ed99';
      ctx.fillRect(6, 8, 10, 6);
      ctx.fillRect(16, 16, 11, 8);
      ctx.fillStyle = '#c7f9cc';
      ctx.fillRect(8, 9, 6, 3);
      ctx.fillRect(18, 18, 7, 4);
      this.cache['tile_' + CONSTANTS.TILES.HERB_SILVER_MOSS] = canvas;
    }

    // 10. Alien Egg Nest
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);
      // Creep slime base
      ctx.fillStyle = '#560bad';
      ctx.fillRect(4, 18, 24, 10);
      ctx.fillRect(8, 14, 16, 14);
      // Egg pod
      ctx.fillStyle = '#b5179e';
      ctx.fillRect(11, 8, 10, 16);
      ctx.fillRect(9, 12, 14, 10);
      // Glowing organic veins
      ctx.fillStyle = '#7209b7';
      ctx.fillRect(12, 6, 8, 4);
      ctx.fillStyle = '#4cc9f0';
      ctx.fillRect(13, 11, 2, 4);
      ctx.fillRect(17, 15, 2, 3);
      ctx.fillStyle = '#3f37c9';
      ctx.fillRect(12, 22, 8, 3);
      this.cache['tile_' + CONSTANTS.TILES.ALIEN_EGG] = canvas;
    }

    // 11. River Water
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#1e6091';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#168aad';
      ctx.fillRect(0, 8, S, 6);
      ctx.fillRect(0, 22, S, 6);
      ctx.fillStyle = '#52b69a';
      ctx.fillRect(4, 10, 10, 2);
      ctx.fillRect(18, 24, 10, 2);
      this.cache['tile_' + CONSTANTS.TILES.RIVER_WATER] = canvas;
    }

    // 12. Lake Water
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#184e77';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#1e6091';
      ctx.fillRect(4, 4, 24, 24);
      ctx.fillStyle = '#34a0a4';
      ctx.fillRect(8, 12, 8, 3);
      ctx.fillRect(18, 20, 8, 3);
      this.cache['tile_' + CONSTANTS.TILES.LAKE_WATER] = canvas;
    }

    // 13. Wooden Bridge
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#583101';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#8c531b';
      ctx.fillRect(2, 2, 28, 6);
      ctx.fillRect(2, 10, 28, 6);
      ctx.fillRect(2, 18, 28, 6);
      ctx.fillRect(2, 26, 28, 6);
      ctx.fillStyle = '#301a00';
      ctx.fillRect(4, 4, 2, 2);
      ctx.fillRect(26, 4, 2, 2);
      ctx.fillRect(4, 12, 2, 2);
      ctx.fillRect(26, 12, 2, 2);
      this.cache['tile_' + CONSTANTS.TILES.WOODEN_BRIDGE] = canvas;
    }

    // 14. Tree Alien Pine (Fallback 32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);
      // Soft shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(16, 29, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Trunk
      ctx.fillStyle = '#26150d';
      ctx.fillRect(14, 18, 4, 12);
      // Dense tiered foliage
      ctx.fillStyle = '#0f2f1d';
      ctx.fillRect(5, 14, 22, 7);
      ctx.fillRect(8, 8, 16, 7);
      ctx.fillRect(11, 2, 10, 7);
      ctx.fillStyle = '#1e5e38';
      ctx.fillRect(7, 15, 18, 3);
      ctx.fillRect(10, 9, 12, 3);
      ctx.fillRect(12, 3, 8, 3);
      ctx.fillStyle = '#38a169';
      ctx.fillRect(15, 1, 2, 2);
      this.cache['tile_' + CONSTANTS.TILES.TREE_ALIEN_PINE] = canvas;
    }

    // 14b. Tree Post Apocalypse (Fallback 32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);
      // Ash shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(16, 29, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Charred trunk
      ctx.fillStyle = '#09090b';
      ctx.fillRect(14, 12, 4, 18);
      ctx.fillRect(10, 16, 4, 3);
      ctx.fillRect(18, 18, 5, 3);
      ctx.fillRect(8, 11, 3, 5);
      ctx.fillRect(22, 13, 3, 5);
      // Glowing embers
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(15, 16, 2, 4);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(15, 18, 1, 2);
      this.cache['tile_' + CONSTANTS.TILES.TREE_POST_APOC] = canvas;
    }

    // 15. Sand Beach
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#e9c46a';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#f4a261';
      for (let i = 0; i < 16; i++) {
        ctx.fillRect((i * 11) % 30, (i * 17) % 30, 2, 2);
      }
      ctx.fillStyle = '#dfb050';
      for (let i = 0; i < 10; i++) {
        ctx.fillRect((i * 7) % 28 + 2, (i * 13) % 28 + 2, 2, 2);
      }
      this.cache['tile_' + CONSTANTS.TILES.SAND] = canvas;
    }

    // 16. Wet Sand
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#c99b4d';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#b3863b';
      for (let i = 0; i < 14; i++) {
        ctx.fillRect((i * 9) % 30, (i * 15) % 30, 2, 2);
      }
      this.cache['tile_' + CONSTANTS.TILES.SAND_WET] = canvas;
    }

    // 17. Shallow Ocean
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#2a9d8f';
      ctx.fillRect(0, 0, S, S);
      // Surf foam
      ctx.fillStyle = '#e0fbfc';
      ctx.fillRect(0, 2, S, 2);
      ctx.fillRect(6, 14, 18, 2);
      ctx.fillRect(2, 26, 26, 2);
      this.cache['tile_' + CONSTANTS.TILES.OCEAN_SHALLOW] = canvas;
    }

    // 18. Deep Ocean
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#0f3057';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#00587a';
      ctx.fillRect(2, 6, 28, 4);
      ctx.fillRect(2, 20, 28, 4);
      ctx.fillStyle = '#008891';
      ctx.fillRect(8, 8, 12, 2);
      ctx.fillRect(16, 22, 12, 2);
      this.cache['tile_' + CONSTANTS.TILES.OCEAN_DEEP] = canvas;
    }

    // 19. Tech Debris (Spaceship wreckage)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.SAND], 0, 0);
      // Rusted metal plating
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(4, 6, 24, 18);
      ctx.fillStyle = '#9b2c2c'; // rust
      ctx.fillRect(6, 8, 12, 6);
      ctx.fillRect(16, 14, 10, 8);
      // Blinking diode
      ctx.fillStyle = '#f6ad55';
      ctx.fillRect(22, 8, 3, 3);
      this.cache['tile_' + CONSTANTS.TILES.TECH_DEBRIS] = canvas;
    }
  }

  generatePlayerSprites() {
    // 32x32 player character with Gas Mask, Survival Gear, Backpack
    const directions = ['down', 'up', 'side'];
    
    directions.forEach(dir => {
      for (let frame = 0; frame < 3; frame++) {
        const { canvas, ctx } = this.createCanvas(32, 32);
        
        // Bobbing offset for walking
        const bob = (frame === 1) ? 1 : 0;
        const legOffset = (frame === 1) ? -2 : (frame === 2) ? 2 : 0;

        // Shadow under player
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(16, 29, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs / Boots
        ctx.fillStyle = '#1e293b'; // Combat pants
        ctx.fillRect(11 + legOffset, 21 + bob, 4, 6);
        ctx.fillRect(17 - legOffset, 21 + bob, 4, 6);
        ctx.fillStyle = '#0f172a'; // Boots
        ctx.fillRect(10 + legOffset, 27, 5, 3);
        ctx.fillRect(17 - legOffset, 27, 5, 3);

        // Body / Jacket
        ctx.fillStyle = '#334155'; // Dark survival jacket
        ctx.fillRect(10, 11 + bob, 12, 11);
        ctx.fillStyle = '#eab308'; // Hazard orange straps
        ctx.fillRect(12, 11 + bob, 2, 11);
        ctx.fillRect(18, 11 + bob, 2, 11);
        ctx.fillRect(10, 18 + bob, 12, 2);

        // Backpack on back
        if (dir === 'up') {
          ctx.fillStyle = '#065f46'; // Forest green pack
          ctx.fillRect(9, 12 + bob, 14, 9);
          ctx.fillStyle = '#047857';
          ctx.fillRect(11, 14 + bob, 10, 5);
        }

        // Head / Gas Mask
        ctx.fillStyle = '#475569'; // Hood
        ctx.fillRect(10, 3 + bob, 12, 9);
        
        if (dir === 'down') {
          // Gas mask front
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(12, 5 + bob, 8, 7);
          // Glowing cyan bio-visors
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(13, 6 + bob, 2, 2);
          ctx.fillRect(17, 6 + bob, 2, 2);
          // Filter canister
          ctx.fillStyle = '#64748b';
          ctx.fillRect(14, 9 + bob, 4, 3);
        } else if (dir === 'up') {
          // Back of head hood
          ctx.fillStyle = '#334155';
          ctx.fillRect(11, 4 + bob, 10, 8);
        } else if (dir === 'side') {
          // Profile visor
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(15, 5 + bob, 6, 6);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(18, 6 + bob, 2, 2);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(19, 9 + bob, 3, 2);
        }

        // Hands / Gloves
        ctx.fillStyle = '#f59e0b'; // Heavy yellow hazard gloves
        if (dir === 'side') {
          ctx.fillRect(17, 15 + bob, 4, 4);
        } else {
          ctx.fillRect(7, 15 + bob, 3, 4);
          ctx.fillRect(22, 15 + bob, 3, 4);
        }

        this.cache[`player_${dir}_${frame}`] = canvas;
      }
    });
  }

  generateWeaponSprites() {
    // 1. Spear (Giáo)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.save();
      ctx.translate(16, 16);
      ctx.rotate(Math.PI / 4);
      // Shaft
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-2, -14, 4, 28);
      // Spear tip (alien alloy)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(4, -13);
      ctx.lineTo(-4, -13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(-1, -17, 2, 5);
      ctx.restore();
      this.cache['weapon_spear'] = canvas;
    }

    // 2. Staff (Gậy)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.save();
      ctx.translate(16, 16);
      ctx.rotate(Math.PI / 4);
      // Shaft
      ctx.fillStyle = '#475569';
      ctx.fillRect(-2, -12, 4, 24);
      // Head orb
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(0, -14, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3e8ff';
      ctx.beginPath();
      ctx.arc(-1, -15, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      this.cache['weapon_staff'] = canvas;
    }

    // 3. Dagger (Dao)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.save();
      ctx.translate(16, 16);
      ctx.rotate(Math.PI / 4);
      // Grip
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2, 2, 4, 8);
      // Guard
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-5, 0, 10, 2);
      // Serrated bio-blade
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-3, -12, 6, 12);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(-1, -12, 2, 10);
      ctx.restore();
      this.cache['weapon_dagger'] = canvas;
    }

    // 4. Bow (Cung)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.save();
      ctx.translate(16, 16);
      // Bow limbs
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-4, 0, 12, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();
      // Bow string
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-1, -11);
      ctx.lineTo(-1, 11);
      ctx.stroke();
      ctx.restore();
      this.cache['weapon_bow'] = canvas;
    }
  }

  generateItemIcons() {
    // 32x32 UI Icons for Inventory & Hotbar
    const S = 32;

    // Helmets
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 6, 20, 18);
      ctx.fillStyle = '#06b6d4'; // Glowing visor
      ctx.fillRect(10, 12, 12, 5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(12, 19, 8, 4);
      this.cache['icon_helmet'] = canvas;
    }

    // Chestplate
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 6, 20, 20);
      ctx.fillStyle = '#eab308'; // Orange armor plate
      ctx.fillRect(10, 10, 12, 12);
      ctx.fillStyle = '#475569';
      ctx.fillRect(13, 8, 6, 16);
      this.cache['icon_chestplate'] = canvas;
    }

    // Leggings
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, 6, 16, 6);
      ctx.fillRect(8, 12, 7, 14);
      ctx.fillRect(17, 12, 7, 14);
      ctx.fillStyle = '#10b981'; // Anti-toxin bands
      ctx.fillRect(8, 18, 7, 3);
      ctx.fillRect(17, 18, 7, 3);
      this.cache['icon_leggings'] = canvas;
    }

    // Boots
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 10, 8, 14);
      ctx.fillRect(6, 20, 12, 6);
      ctx.fillRect(16, 8, 8, 14);
      ctx.fillRect(16, 18, 12, 6);
      ctx.fillStyle = '#38bdf8'; // Spring boosters
      ctx.fillRect(6, 24, 12, 2);
      ctx.fillRect(16, 22, 12, 2);
      this.cache['icon_boots'] = canvas;
    }

    // Gloves
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(6, 8, 8, 14);
      ctx.fillRect(16, 8, 8, 14);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(8, 14, 4, 6);
      ctx.fillRect(18, 14, 4, 6);
      this.cache['icon_gloves'] = canvas;
    }

    // Resources icons
    // Snow Lotus
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3e8ff';
      ctx.beginPath();
      ctx.arc(16, 16, 5, 0, Math.PI * 2);
      ctx.fill();
      this.cache['icon_lotus'] = canvas;
    }

    // Sulfur Dust
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(8, 14, 16, 10);
      ctx.fillRect(11, 10, 10, 14);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(13, 12, 6, 6);
      this.cache['icon_sulfur'] = canvas;
    }

    // Quartz Crystal
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(12, 6, 8, 20);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(8, 12, 16, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, 8, 4, 10);
      this.cache['icon_quartz'] = canvas;
    }

    // Silver Moss
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(6, 12, 20, 12);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(10, 10, 12, 8);
      this.cache['icon_moss'] = canvas;
    }

    // Alien Egg Fluid
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(10, 8, 12, 16);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(12, 12, 8, 10);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(14, 6, 4, 3);
      this.cache['icon_egg_fluid'] = canvas;
    }

    // Pure Water
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Flask
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(13, 6, 6, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(9, 11, 14, 15);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(11, 13, 4, 9);
      this.cache['icon_pure_water'] = canvas;
    }

    // Dirty Water
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(13, 6, 6, 5);
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(9, 11, 14, 15);
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(11, 13, 5, 8);
      this.cache['icon_dirty_water'] = canvas;
    }

    // Wood
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 10, 20, 12);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(8, 12, 16, 8);
      this.cache['icon_wood'] = canvas;
    }

    // Stone
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(8, 10, 16, 12);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(10, 12, 12, 6);
      this.cache['icon_stone'] = canvas;
    }

    // Tech Scrap
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 8, 20, 16);
      ctx.fillStyle = '#f97316'; // glowing circuit
      ctx.fillRect(9, 11, 14, 3);
      ctx.fillRect(12, 14, 3, 6);
      this.cache['icon_tech_scrap'] = canvas;
    }

    // Weapons also as inventory icons
    this.cache['icon_spear'] = this.cache['weapon_spear'];
    this.cache['icon_staff'] = this.cache['weapon_staff'];
    this.cache['icon_dagger'] = this.cache['weapon_dagger'];
    this.cache['icon_bow'] = this.cache['weapon_bow'];
  }

  generateMonsterSprites() {
    // Alien Crawler Mutant (Test Alien)
    {
      const { canvas, ctx } = this.createCanvas(36, 36);
      // Multi-legged body
      ctx.fillStyle = '#4c1d95'; // Chitin violet
      ctx.fillRect(8, 10, 20, 14);
      // Legs
      ctx.fillStyle = '#6d28d9';
      ctx.fillRect(4, 8, 4, 6);
      ctx.fillRect(4, 20, 4, 6);
      ctx.fillRect(28, 8, 4, 6);
      ctx.fillRect(28, 20, 4, 6);
      // Head & Glowing Red Multi-eyes
      ctx.fillStyle = '#2e1065';
      ctx.fillRect(12, 4, 12, 8);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(14, 6, 2, 2);
      ctx.fillRect(20, 6, 2, 2);
      ctx.fillRect(16, 8, 4, 2);
      // Mandibles / Acid Fangs
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(11, 10, 2, 4);
      ctx.fillRect(23, 10, 2, 4);
      this.cache['monster_crawler'] = canvas;
    }

    // Training Dummy / Alien Nest Husk (for hitting & testing)
    {
      const { canvas, ctx } = this.createCanvas(36, 36);
      // Stand base
      ctx.fillStyle = '#78350f';
      ctx.fillRect(10, 28, 16, 4);
      ctx.fillRect(16, 12, 4, 16);
      // Straw / Alien armored dummy body
      ctx.fillStyle = '#a16207';
      ctx.fillRect(10, 8, 16, 16);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(12, 10, 12, 12);
      // Target bullseye
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(15, 13, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(17, 15, 2, 2);
      this.cache['monster_dummy'] = canvas;
    }
  }

  generatePhase2Sprites() {
    const S = 32;

    // 1. Bio-Lab Isolated Structure (96x96 px)
    {
      const { canvas, ctx } = this.createCanvas(96, 96);

      // Concrete foundation
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 20, 88, 72);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(8, 24, 80, 64);

      // Hazard warning stripes along base
      ctx.fillStyle = '#facc15';
      ctx.fillRect(8, 84, 80, 4);
      ctx.fillStyle = '#000000';
      for (let i = 8; i < 88; i += 12) {
        ctx.fillRect(i, 84, 6, 4);
      }

      // Reinforced Glass Quarantine Dome
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(48, 48, 36, Math.PI, 0);
      ctx.fill();

      // Glass shine & Hydroponic Emerald interior glow
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(48, 50, 30, Math.PI, 0);
      ctx.fill();

      // Hydroponic plants inside glass
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(28, 42, 8, 8);
      ctx.fillRect(44, 38, 8, 12);
      ctx.fillRect(60, 42, 8, 8);

      // Glass frame struts
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(48, 48, 36, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(48, 12);
      ctx.lineTo(48, 48);
      ctx.moveTo(24, 26);
      ctx.lineTo(48, 48);
      ctx.moveTo(72, 26);
      ctx.lineTo(48, 48);
      ctx.stroke();

      // Airlock Doorway
      ctx.fillStyle = '#334155';
      ctx.fillRect(38, 56, 20, 28);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(40, 58, 16, 12); // Blue decontamination scanner
      ctx.fillStyle = '#10b981';
      ctx.fillRect(47, 72, 2, 4); // Handle

      // Clean Air Ventilation & Filter Chimneys
      ctx.fillStyle = '#475569';
      ctx.fillRect(12, 10, 8, 14);
      ctx.fillRect(76, 10, 8, 14);
      ctx.fillStyle = '#22c55e'; // Green status LED
      ctx.fillRect(15, 6, 2, 4);
      ctx.fillRect(79, 6, 2, 4);

      // Illuminated Sign: BIO-LAB
      ctx.fillStyle = '#065f46';
      ctx.fillRect(26, 8, 44, 10);
      ctx.strokeStyle = '#34d399';
      ctx.strokeRect(26, 8, 44, 10);
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('BIO-LAB', 30, 16);

      this.cache['building_biolab'] = canvas;
    }

    // 2. Furnace (48x48 px)
    {
      const { canvas, ctx } = this.createCanvas(48, 48);

      // Stone brick base
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 12, 40, 32);
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 14, 36, 28);

      // Chimney
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(18, 2, 12, 12);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(20, 0, 8, 3); // smoke glow

      // Fire chamber with glowing coals
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14, 24, 20, 16);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(16, 28, 16, 10);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(18, 30, 12, 6);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(21, 32, 6, 4);

      // Metal Grate
      ctx.fillStyle = '#64748b';
      ctx.fillRect(14, 30, 20, 2);
      ctx.fillRect(14, 34, 20, 2);

      this.cache['building_furnace'] = canvas;
    }

    // 3. Clean Wild Berry Bush (tile)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);
      // Green bush
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(16, 18, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(14, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      // Bright red berries
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, 14, 3, 3);
      ctx.fillRect(18, 12, 3, 3);
      ctx.fillRect(14, 20, 3, 3);
      ctx.fillRect(20, 19, 3, 3);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(10, 14, 1, 1);
      ctx.fillRect(18, 12, 1, 1);
      this.cache['tile_berry_clean'] = canvas;
    }

    // 4. Blighted / Mutated Berry Bush (tile)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);
      // Rotten withered dark violet bush
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.arc(16, 18, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(14, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      // Toxic neon magenta/acid dripping berries
      ctx.fillStyle = '#d946ef';
      ctx.fillRect(10, 14, 3, 4);
      ctx.fillRect(18, 12, 3, 4);
      ctx.fillRect(14, 20, 3, 4);
      ctx.fillRect(20, 19, 3, 4);
      ctx.fillStyle = '#84cc16'; // Toxic slime dot
      ctx.fillRect(11, 16, 2, 2);
      ctx.fillRect(19, 14, 2, 2);
      this.cache['tile_berry_blighted'] = canvas;
    }

    // 5. Blighted Herb (tile)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);
      // Charred withered plant
      ctx.fillStyle = '#262626';
      ctx.fillRect(14, 16, 4, 10);
      ctx.fillRect(10, 12, 12, 6);
      ctx.fillStyle = '#831843'; // mold
      ctx.fillRect(12, 14, 8, 4);
      this.cache['tile_herb_blighted'] = canvas;
    }

    // 6. Icons for Phase 2 Items
    // Clean berry icon
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#22c55e'; // leaf
      ctx.fillRect(16, 8, 6, 4);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(12, 18, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(20, 18, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(16, 23, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(10, 16, 2, 2);
      ctx.fillRect(18, 16, 2, 2);
      this.cache['icon_berry_clean'] = canvas;
    }

    // Blighted berry icon
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(16, 8, 6, 4);
      ctx.fillStyle = '#a21caf';
      ctx.beginPath(); ctx.arc(12, 18, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(20, 18, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#84cc16'; // acid drops
      ctx.fillRect(11, 17, 3, 3);
      ctx.fillRect(19, 17, 3, 3);
      this.cache['icon_berry_blighted'] = canvas;
    }

    // Blighted herb icon
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#404040';
      ctx.fillRect(14, 10, 4, 14);
      ctx.fillRect(8, 14, 16, 6);
      ctx.fillStyle = '#701a75';
      ctx.fillRect(10, 16, 12, 4);
      this.cache['icon_blighted_herb'] = canvas;
    }

    // Antidote Lesser (Syringe/Vial with -25% icon)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Vial flask
      ctx.fillStyle = '#64748b';
      ctx.fillRect(12, 4, 8, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, 8, 16, 20);
      // Emerald curative liquid
      ctx.fillStyle = '#10b981';
      ctx.fillRect(10, 14, 12, 12);
      ctx.fillStyle = '#a7f3d0';
      ctx.fillRect(12, 16, 4, 6);
      // Medical cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 17, 2, 6);
      ctx.fillRect(13, 19, 6, 2);
      this.cache['icon_antidote_lesser'] = canvas;
    }

    // Antidote Pure (Golden-Cyan High-tech Vial with -60% Immunity)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Gold alloy casing
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(12, 4, 8, 4);
      ctx.fillRect(8, 8, 16, 20);
      // Radiant cyan DNA serum
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(10, 12, 12, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 14, 3, 3);
      ctx.fillRect(17, 18, 3, 3);
      ctx.fillRect(12, 22, 3, 3);
      // Glowing aura
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 6, 20, 24);
      this.cache['icon_antidote_pure'] = canvas;
    }

    // Seeds / Tissue cultures
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Petri dish
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 2); ctx.stroke();
      // Lotus seedling inside
      ctx.fillStyle = '#c084fc';
      ctx.beginPath(); ctx.arc(16, 16, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 15, 2, 2);
      this.cache['icon_seed_lotus'] = canvas;
    }

    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 2); ctx.stroke();
      // Silver moss seedling
      ctx.fillStyle = '#34d399';
      ctx.fillRect(12, 13, 8, 6);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(14, 15, 4, 3);
      this.cache['icon_seed_moss'] = canvas;
    }
  }

  generatePhase3Sprites() {
    const S = 32;

    // 1. Workbench (48x32 px)
    {
      const { canvas, ctx } = this.createCanvas(48, 32);
      // Wooden desk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, 8, 40, 20);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(6, 10, 36, 16);
      // Legs
      ctx.fillStyle = '#451a03';
      ctx.fillRect(6, 24, 6, 8);
      ctx.fillRect(36, 24, 6, 8);
      // Tools & Blueprints on top
      ctx.fillStyle = '#0284c7'; // Blue blueprint
      ctx.fillRect(10, 12, 14, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 14, 10, 1);
      ctx.fillRect(12, 17, 8, 1);
      // Metal saw & hammer
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(28, 12, 12, 3);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(36, 12, 3, 7);
      this.cache['building_workbench'] = canvas;
    }

    // 2. Workshop (64x48 px)
    {
      const { canvas, ctx } = this.createCanvas(64, 48);
      // Industrial steel frame
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 8, 56, 38);
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, 12, 48, 30);
      // Industrial Gears & Anvil
      ctx.fillStyle = '#64748b';
      ctx.fillRect(14, 22, 14, 10); // Anvil
      ctx.fillRect(18, 18, 6, 4);
      // Yellow hazard warning stripe on top
      ctx.fillStyle = '#facc15';
      ctx.fillRect(8, 12, 48, 4);
      ctx.fillStyle = '#000000';
      for (let i = 8; i < 56; i += 8) {
        ctx.fillRect(i, 12, 4, 4);
      }
      // Sparking welding torch / neon glow
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(38, 24, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(41, 27, 2, 2);
      this.cache['building_workshop'] = canvas;
    }

    // 3. Defense: Reinforced Wall (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Concrete stone blocks
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 2, 28, 12);
      ctx.fillRect(2, 16, 28, 14);
      // Mortar lines
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 14, 32, 2);
      ctx.fillRect(15, 2, 2, 12);
      ctx.fillRect(8, 16, 2, 14);
      ctx.fillRect(24, 16, 2, 14);
      // Steel rebar / barbed edge
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(2, 0, 28, 2);
      ctx.fillRect(6, -2, 2, 4);
      ctx.fillRect(18, -2, 2, 4);
      this.cache['defense_wall'] = canvas;
    }

    // 4. Defense: Spike Trap (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Ground grate plate
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 2, 28, 28);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 4, 24, 24);
      // Steel spikes coated in alien toxin
      ctx.fillStyle = '#94a3b8';
      const spikePos = [
        [8, 8], [16, 8], [24, 8],
        [8, 16], [16, 16], [24, 16],
        [8, 24], [16, 24], [24, 24]
      ];
      spikePos.forEach(([x, y]) => {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = '#22c55e'; // Acid venom tip
        ctx.fillRect(x - 1, y - 1, 2, 2);
      });
      this.cache['defense_trap'] = canvas;
    }

    // 5. Defense: Watchtower / Turret (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Turret base
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(16, 16, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.beginPath(); ctx.arc(16, 16, 10, 0, Math.PI * 2); ctx.fill();
      // Twin plasma barrels
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(12, 2, 3, 14);
      ctx.fillRect(17, 2, 3, 14);
      // Core glowing power diode
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(16, 16, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 15, 2, 2);
      this.cache['defense_turret'] = canvas;
    }

    // 6. Defense: Heavy Mortar (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Heavy swivel base
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 18, 24, 10);
      ctx.fillStyle = '#334155';
      ctx.beginPath(); ctx.arc(16, 20, 10, 0, Math.PI * 2); ctx.fill();
      // Thick mortar barrel angled upward
      ctx.fillStyle = '#475569';
      ctx.fillRect(11, 4, 10, 16);
      ctx.fillStyle = '#dc2626'; // Red firing ring
      ctx.fillRect(10, 3, 12, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(13, 2, 6, 2); // Bore hole
      this.cache['defense_mortar'] = canvas;
    }

    // 7. Icons for Defensive Structures & Backpack
    this.cache['icon_defense_wall'] = this.cache['defense_wall'];
    this.cache['icon_defense_trap'] = this.cache['defense_trap'];
    this.cache['icon_defense_turret'] = this.cache['defense_turret'];
    this.cache['icon_defense_mortar'] = this.cache['defense_mortar'];

    // Backpack Icon
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#065f46';
      ctx.fillRect(6, 6, 20, 20);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(8, 12, 16, 12);
      ctx.fillStyle = '#f59e0b'; // Gold buckles
      ctx.fillRect(10, 16, 3, 4);
      ctx.fillRect(19, 16, 3, 4);
      ctx.fillStyle = '#047857';
      ctx.fillRect(10, 4, 12, 4);
      this.cache['icon_backpack'] = canvas;
    }

    // 8. New Monster Species Sprites
    // Exploder (Kamikaze - Glowing Orange/Red pulsing alien)
    {
      const { canvas, ctx } = this.createCanvas(36, 36);
      // Swollen volatile sac
      ctx.fillStyle = '#ea580c';
      ctx.beginPath(); ctx.arc(18, 18, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.arc(16, 16, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(15, 15, 5, 0, Math.PI * 2); ctx.fill();
      // Crawling legs
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(4, 12, 4, 12);
      ctx.fillRect(28, 12, 4, 12);
      // Glowing red multi-eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(13, 8, 3, 3);
      ctx.fillRect(20, 8, 3, 3);
      this.cache['monster_exploder'] = canvas;
    }

    // Acid Spitter (Long-legged green acid spitter)
    {
      const { canvas, ctx } = this.createCanvas(36, 36);
      // Body
      ctx.fillStyle = '#14532d';
      ctx.fillRect(10, 12, 16, 12);
      // Acid venom sac on back
      ctx.fillStyle = '#84cc16';
      ctx.beginPath(); ctx.arc(18, 10, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#bef264';
      ctx.fillRect(16, 8, 3, 3);
      // Long spindly legs
      ctx.fillStyle = '#166534';
      ctx.fillRect(4, 6, 3, 24);
      ctx.fillRect(29, 6, 3, 24);
      // Spitter jaws
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(12, 22, 12, 6);
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(16, 24, 4, 4);
      this.cache['monster_spitter'] = canvas;
    }

    // Titan Behemoth (Giant wall-crusher alien 52x52)
    {
      const { canvas, ctx } = this.createCanvas(52, 52);
      // Massive armored torso
      ctx.fillStyle = '#312e81';
      ctx.fillRect(8, 10, 36, 32);
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(12, 14, 28, 24);
      // Heavy Chitin Armor Plates & Spikes
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(4, 6, 8, 8); // Shoulder spikes
      ctx.fillRect(40, 6, 8, 8);
      ctx.fillRect(10, 38, 12, 10); // Heavy trunk legs
      ctx.fillRect(30, 38, 12, 10);
      // Brutal Ramming Horns
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(18, 4, 16, 10);
      ctx.fillStyle = '#dc2626'; // Four demonic red glowing eyes
      ctx.fillRect(20, 8, 3, 3);
      ctx.fillRect(29, 8, 3, 3);
      ctx.fillRect(23, 12, 2, 2);
      ctx.fillRect(27, 12, 2, 2);
      this.cache['monster_behemoth'] = canvas;
    }
  }

  generateMountainAndForestSprites() {
    // =========================================================================
    // 1. MAJESTIC TALL TREES (48x72 & 48x76 Multi-tier Foliage with Cast Shadow)
    // =========================================================================

    // A. Tree Ancient Pine (Cây Thông Đại Ngàn Cổ Thụ 48x72)
    {
      const W = 48, H = 72;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Soft Ground Cast Shadow under the tree
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.ellipse(24, 67, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Textured Pine Trunk & Gnarled Roots
      ctx.fillStyle = '#26150d'; // Deep bark shadow
      ctx.fillRect(20, 46, 8, 22);
      ctx.fillRect(17, 63, 14, 5); // Spreading base roots
      ctx.fillStyle = '#422818'; // Mid bark
      ctx.fillRect(21, 46, 6, 20);
      ctx.fillRect(18, 64, 12, 3);
      ctx.fillStyle = '#613c23'; // Bark highlights & ridges
      ctx.fillRect(22, 48, 2, 16);
      ctx.fillRect(25, 52, 1, 12);
      // Moss on trunk base
      ctx.fillStyle = '#164e2d';
      ctx.fillRect(19, 62, 3, 3);
      ctx.fillRect(26, 63, 2, 3);

      // Helper function to draw a rich pine needle bough tier
      const drawPineBough = (cx, topY, width, height, isTip = false) => {
        const halfW = width / 2;
        // 1. Deep inner shadow layer
        ctx.fillStyle = '#081c10';
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(cx + halfW, topY + height);
        ctx.lineTo(cx - halfW, topY + height);
        ctx.closePath();
        ctx.fill();

        // 2. Main pine foliage body (jagged pine needle clusters)
        ctx.fillStyle = '#133e23';
        ctx.beginPath();
        ctx.moveTo(cx, topY + 2);
        ctx.lineTo(cx + halfW - 2, topY + height - 1);
        ctx.lineTo(cx - halfW + 2, topY + height - 1);
        ctx.closePath();
        ctx.fill();

        // 3. Sunlit needle shelves & highlights (top-left light source)
        ctx.fillStyle = '#1e5e36';
        ctx.fillRect(cx - halfW + 4, topY + height - 4, width - 8, 3);
        ctx.fillStyle = '#2d8a50';
        for (let x = cx - halfW + 6; x < cx + halfW - 6; x += 3) {
          ctx.fillRect(x, topY + height - 3, 2, 2);
        }
        ctx.fillStyle = '#4ade80'; // Sunlit needle tips
        for (let x = cx - halfW + 8; x < cx + 2; x += 4) {
          ctx.fillRect(x, topY + height - 5, 2, 1);
        }

        // Pinecone clusters on lower boughs
        if (!isTip && width > 28) {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(cx - halfW + 6, topY + height - 1, 2, 3);
          ctx.fillRect(cx + halfW - 8, topY + height - 1, 2, 3);
        }
      };

      // 5 Tiered cascading fir needle boughs from bottom to top
      drawPineBough(24, 38, 42, 18, false); // Bottom tier (broadest)
      drawPineBough(24, 28, 36, 17, false); // Tier 4
      drawPineBough(24, 18, 30, 16, false); // Tier 3
      drawPineBough(24, 10, 22, 14, false); // Tier 2
      drawPineBough(24, 3, 14, 12, true);   // Top summit tip

      // High pinnacle evergreen needle tip
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(23, 2, 2, 3);

      this.cache['tree_ancient_pine'] = canvas;
    }

    // B. Tree Alien Spore Pine (Cây Đại Thụ Bào Tử Ngoài Hành Tinh 48x76)
    {
      const W = 48, H = 76;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Bioluminescent Ground Shadow
      ctx.fillStyle = 'rgba(20, 10, 35, 0.48)';
      ctx.beginPath();
      ctx.ellipse(24, 71, 19, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Twisted extraterrestrial trunk with bioluminescent veins
      ctx.fillStyle = '#1e112a';
      ctx.fillRect(20, 48, 8, 24);
      ctx.fillRect(16, 66, 16, 6);
      ctx.fillStyle = '#3b1d54';
      ctx.fillRect(21, 48, 6, 22);
      // Pulsing cyan & magenta organic vein lines
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(22, 50, 2, 18);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(25, 54, 1, 14);

      // Extraterrestrial boughs helper
      const drawAlienBough = (cx, topY, width, height) => {
        const halfW = width / 2;
        // Deep cosmic void shadow
        ctx.fillStyle = '#0b1320';
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(cx + halfW, topY + height);
        ctx.lineTo(cx - halfW, topY + height);
        ctx.closePath();
        ctx.fill();

        // Alien twilight violet/teal foliage body
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.moveTo(cx, topY + 2);
        ctx.lineTo(cx + halfW - 2, topY + height - 1);
        ctx.lineTo(cx - halfW + 2, topY + height - 1);
        ctx.closePath();
        ctx.fill();

        // Shimmering alien fronds
        ctx.fillStyle = '#4338ca';
        ctx.fillRect(cx - halfW + 4, topY + height - 4, width - 8, 3);
        ctx.fillStyle = '#818cf8';
        for (let x = cx - halfW + 6; x < cx + halfW - 6; x += 3) {
          ctx.fillRect(x, topY + height - 3, 2, 2);
        }

        // Weeping bioluminescent spore pods
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(cx - halfW + 4, topY + height, 2, 4);
        ctx.fillRect(cx + halfW - 6, topY + height, 2, 4);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx - 3, topY + height + 1, 2, 3);
        ctx.fillRect(cx + 3, topY + height + 1, 2, 3);
      };

      // 5 Tiered Alien Boughs
      drawAlienBough(24, 40, 44, 20);
      drawAlienBough(24, 29, 38, 18);
      drawAlienBough(24, 19, 30, 16);
      drawAlienBough(24, 10, 22, 14);
      drawAlienBough(24, 3, 14, 12);

      // Glowing Spore Bulb Summit
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(23, 1, 2, 4);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(22, 2, 4, 2);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(23, 2, 2, 2);

      this.cache['tree_alien_pine'] = canvas;
    }

    // C. Tree Post-Apocalypse Charred (Cây Cháy Khô Tận Thế 48x68)
    {
      const W = 48, H = 68;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Soot / ash ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(24, 63, 15, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Charred, split trunk
      ctx.fillStyle = '#09090b';
      ctx.fillRect(21, 30, 6, 34);
      ctx.fillRect(17, 58, 14, 6);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(22, 30, 4, 32);
      ctx.fillStyle = '#27272a';
      ctx.fillRect(23, 32, 2, 30);

      // Twisted bare skeletal branches reaching outward
      ctx.fillStyle = '#09090b';
      // Branch Left 1
      ctx.fillRect(12, 40, 10, 3);
      ctx.fillRect(8, 34, 5, 7);
      ctx.fillRect(6, 28, 3, 7);
      // Branch Right 1
      ctx.fillRect(26, 42, 12, 3);
      ctx.fillRect(36, 36, 4, 8);
      ctx.fillRect(39, 30, 3, 7);
      // Branch Left 2
      ctx.fillRect(14, 24, 8, 3);
      ctx.fillRect(10, 18, 5, 7);
      // Branch Right 2
      ctx.fillRect(26, 22, 10, 3);
      ctx.fillRect(34, 15, 4, 8);
      // Jagged broken lightning-struck top spire
      ctx.fillRect(22, 10, 4, 20);
      ctx.fillRect(21, 6, 3, 5);

      // Internal glowing thermal embers & radioactive fractures
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(23, 44, 2, 8);
      ctx.fillRect(24, 36, 1, 6);
      ctx.fillRect(16, 41, 3, 1);
      ctx.fillRect(30, 43, 4, 1);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(23, 46, 2, 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(24, 47, 1, 2);

      this.cache['tree_dead_apoc'] = canvas;
    }

    // D. Tree Stump (Gốc Cây Đã Chặt 32x24)
    {
      const { canvas, ctx } = this.createCanvas(32, 24);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(16, 19, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stump bark body
      ctx.fillStyle = '#2b1810';
      ctx.fillRect(9, 9, 14, 10);
      ctx.fillRect(6, 15, 20, 5);
      ctx.fillStyle = '#4a2810';
      ctx.fillRect(10, 9, 12, 9);
      // Cut surface with wood rings
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(16, 9, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(16, 9, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(15, 8, 2, 2); // Center heartwood
      // Moss on sides
      ctx.fillStyle = '#15803d';
      ctx.fillRect(8, 14, 2, 3);
      ctx.fillRect(22, 15, 2, 2);
      this.cache['tree_stump'] = canvas;
    }

    // E. Dense Forest Undergrowth & Ferns (32x24)
    {
      const { canvas, ctx } = this.createCanvas(32, 24);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(16, 18, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lush forest ferns
      ctx.fillStyle = '#14532d';
      ctx.fillRect(8, 8, 16, 10);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(6, 10, 8, 4);
      ctx.fillRect(18, 10, 8, 4);
      ctx.fillRect(10, 5, 12, 5);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(14, 3, 4, 3);
      // Wild forest mushrooms
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(7, 14, 4, 3);
      ctx.fillRect(22, 13, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 14, 1, 1);
      ctx.fillRect(23, 13, 1, 1);
      this.cache['foliage_bush_dense'] = canvas;
    }

    // =========================================================================
    // 2. MAJESTIC MOUNTAIN SPRITES (Towering Peaks, Crags & Stratified Cliffs)
    // =========================================================================

    // A. Majestic Large Snow Peak (64x64 Alpine Pinnacle)
    {
      const S = 64;
      const { canvas, ctx } = this.createCanvas(S, S);

      // Deep alpine bedrock foundation
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 32, S, 32);

      // Jagged mountain silhouette polygon
      ctx.beginPath();
      ctx.moveTo(32, 2);   // Mountain summit peak
      ctx.lineTo(60, 62);  // Right base
      ctx.lineTo(4, 62);   // Left base
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      // Right slope in deep glacial azure shadow (East Face)
      ctx.beginPath();
      ctx.moveTo(32, 2);
      ctx.lineTo(60, 62);
      ctx.lineTo(32, 62);
      ctx.closePath();
      ctx.fillStyle = '#1e3a8a';
      ctx.fill();

      // Left slope in brilliant sunlit glacial snow (West Face)
      ctx.beginPath();
      ctx.moveTo(32, 2);
      ctx.lineTo(32, 62);
      ctx.lineTo(4, 62);
      ctx.closePath();
      ctx.fillStyle = '#93c5fd';
      ctx.fill();

      // Pristine snowpack cascading down western ridge
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(32, 2);
      ctx.lineTo(34, 18);
      ctx.lineTo(26, 26);
      ctx.lineTo(30, 40);
      ctx.lineTo(18, 54);
      ctx.lineTo(10, 62);
      ctx.lineTo(4, 62);
      ctx.lineTo(24, 20);
      ctx.closePath();
      ctx.fill();

      // Summit needle & diamond frost
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(31, 2, 2, 8);
      ctx.fillRect(29, 6, 6, 4);

      // Glacial ice crevasse fissures in deep blue
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(34, 18, 2, 16);
      ctx.fillRect(38, 28, 2, 20);
      ctx.fillRect(44, 40, 2, 18);

      // Rugged granite ribs piercing through the snow
      ctx.fillStyle = '#334155';
      ctx.fillRect(16, 28, 4, 8);
      ctx.fillRect(24, 42, 5, 10);
      ctx.fillRect(12, 48, 6, 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(16, 28, 4, 2);
      ctx.fillRect(24, 42, 5, 2);

      this.cache['mountain_peak_snow_large'] = canvas;
    }

    // B. Majestic Dark Granite Crag Spire (64x64 Jagged Mountain Horn)
    {
      const S = 64;
      const { canvas, ctx } = this.createCanvas(S, S);

      // Base shadow
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 40, S, 24);

      // Jagged twin horn rock mass
      ctx.fillStyle = '#1c2028';
      ctx.beginPath();
      ctx.moveTo(26, 4);  // Main spire
      ctx.lineTo(42, 18); // Sub horn
      ctx.lineTo(60, 62); // Right foot
      ctx.lineTo(4, 62);  // Left foot
      ctx.closePath();
      ctx.fill();

      // Chiseled granite strata (Midtone)
      ctx.fillStyle = '#2d3340';
      ctx.fillRect(12, 22, 26, 38);
      ctx.fillRect(36, 28, 18, 32);

      // Sharp bevel highlights on ridges (Sunlit edges)
      ctx.fillStyle = '#546076';
      ctx.fillRect(25, 4, 3, 20);
      ctx.fillRect(22, 24, 3, 24);
      ctx.fillRect(41, 18, 3, 16);
      ctx.fillStyle = '#7a89a3';
      ctx.fillRect(25, 4, 1, 16);
      ctx.fillRect(22, 24, 1, 18);

      // Deep vertical geological faults & fissures
      ctx.fillStyle = '#0b0d12';
      ctx.fillRect(28, 12, 2, 28);
      ctx.fillRect(34, 26, 2, 30);
      ctx.fillRect(18, 36, 2, 22);
      ctx.fillRect(46, 32, 2, 26);

      // High mountain lichen & alpine moss
      ctx.fillStyle = '#365314';
      ctx.fillRect(14, 44, 6, 3);
      ctx.fillRect(38, 48, 8, 3);

      this.cache['mountain_crag_spire'] = canvas;
    }

    // C. Vertical Cliff Wall (32x32 Stratified Rock Facade with Shadow)
    {
      const S = CONSTANTS.TILE_SIZE; // 32
      const { canvas, ctx } = this.createCanvas(S, S);

      // Deep rock bedrock
      ctx.fillStyle = '#0f1218';
      ctx.fillRect(0, 0, S, S);

      // 4 Horizontal strata bands (Geological sedimentary layers)
      ctx.fillStyle = '#1e232d';
      ctx.fillRect(0, 0, S, 7);
      ctx.fillStyle = '#282f3c';
      ctx.fillRect(0, 8, S, 8);
      ctx.fillStyle = '#1e232d';
      ctx.fillRect(0, 17, S, 7);
      ctx.fillStyle = '#141820';
      ctx.fillRect(0, 25, S, 7);

      // Ledge top highlights
      ctx.fillStyle = '#4d596e';
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 8, S, 2);
      ctx.fillRect(0, 17, S, 2);
      ctx.fillStyle = '#6e7d98';
      ctx.fillRect(4, 0, 12, 1);
      ctx.fillRect(18, 8, 10, 1);

      // Vertical fault fissures & cracks
      ctx.fillStyle = '#080a0e';
      ctx.fillRect(10, 0, 2, 16);
      ctx.fillRect(22, 9, 2, 23);
      ctx.fillRect(6, 18, 2, 14);

      // Hanging cliff creepers / dark moss
      ctx.fillStyle = '#15803d';
      ctx.fillRect(4, 2, 2, 6);
      ctx.fillRect(16, 10, 3, 7);
      ctx.fillRect(26, 3, 2, 5);

      this.cache['cliff_face_vertical'] = canvas;
    }

    // D. Cliff Top Ridge (32x32 Plateau Edge Overhang)
    {
      const S = CONSTANTS.TILE_SIZE; // 32
      const { canvas, ctx } = this.createCanvas(S, S);
      // Plateau ground top half
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(0, 0, S, 18);
      ctx.fillStyle = '#404856';
      ctx.fillRect(0, 0, S, 14);
      // Jagged edge overhanging the sheer drop
      ctx.fillStyle = '#647084';
      ctx.fillRect(0, 14, S, 4);
      ctx.fillStyle = '#8392a8';
      ctx.fillRect(2, 15, 12, 2);
      ctx.fillRect(18, 15, 10, 2);
      // Underneath sheer shadow drop
      ctx.fillStyle = '#0f1218';
      ctx.fillRect(0, 18, S, 14);
      ctx.fillStyle = '#1a1f29';
      ctx.fillRect(0, 22, S, 10);
      this.cache['cliff_top_ridge'] = canvas;
    }

    // E. Active Volcanic / Sulfur Fissure (32x32)
    {
      const S = CONSTANTS.TILE_SIZE;
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);

      // Scorched rift
      ctx.fillStyle = '#1a0505';
      ctx.fillRect(6, 10, 20, 12);
      // Boiling glowing sulfur & magma fissure
      ctx.fillStyle = '#f97316';
      ctx.fillRect(8, 12, 16, 8);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(10, 14, 12, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, 15, 4, 2);
      // Glowing green/yellow toxic fumes
      ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.fillRect(4, 6, 24, 6);
      this.cache['sulfur_fissure_active'] = canvas;
    }
  }

  get(name) {
    return this.cache[name];
  }
}

// Global instance
window.pixelArt = new PixelArt();
