// Procedural Pixel Art Sprite Generator
// Generates high quality pixel art textures, player sprites, weapons, and items on offscreen canvases

class PixelArt {
  constructor() {
    this.cache = {};
  }

  init() {
    this.generateTileSprites();
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

    // 1. Grass Tile
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#2d5a27';
      ctx.fillRect(0, 0, S, S);
      // Highlights & grass blades
      ctx.fillStyle = '#3a6e32';
      for (let i = 0; i < 18; i++) {
        const rx = (i * 7) % 30;
        const ry = (i * 13) % 30;
        ctx.fillRect(rx, ry, 2, 3);
      }
      ctx.fillStyle = '#1e401a';
      for (let i = 0; i < 12; i++) {
        const rx = (i * 11) % 28 + 2;
        const ry = (i * 17) % 28 + 2;
        ctx.fillRect(rx, ry, 2, 2);
      }
      this.cache['tile_' + CONSTANTS.TILES.GRASS] = canvas;
    }

    // 2. Grass Flowers
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);
      // Little alien wildflowers
      ctx.fillStyle = '#ff6b81';
      ctx.fillRect(6, 8, 3, 3);
      ctx.fillRect(20, 22, 3, 3);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(7, 9, 1, 1);
      ctx.fillRect(21, 23, 1, 1);
      ctx.fillStyle = '#9b5de5';
      ctx.fillRect(18, 6, 3, 3);
      this.cache['tile_' + CONSTANTS.TILES.GRASS_FLOWERS] = canvas;
    }

    // 3. Dirt Path
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#614835';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#7a5c43';
      for (let i = 0; i < 14; i++) {
        ctx.fillRect((i * 9) % 29, (i * 15) % 29, 3, 2);
      }
      ctx.fillStyle = '#453224';
      ctx.fillRect(5, 12, 4, 3);
      ctx.fillRect(22, 8, 3, 3);
      ctx.fillRect(14, 25, 3, 2);
      this.cache['tile_' + CONSTANTS.TILES.DIRT_PATH] = canvas;
    }

    // 4. Mountain Rock
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#3c4048';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#4a505a';
      ctx.fillRect(2, 2, 28, 28);
      ctx.fillStyle = '#2b2d33';
      // jagged cracks
      ctx.fillRect(6, 6, 20, 2);
      ctx.fillRect(18, 6, 2, 16);
      ctx.fillRect(10, 16, 12, 2);
      ctx.fillStyle = '#59606d';
      ctx.fillRect(2, 2, 28, 2);
      ctx.fillRect(2, 2, 2, 28);
      this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK] = canvas;
    }

    // 5. Snow Peak
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#d0e1fd';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 24, 24);
      ctx.fillStyle = '#a6c8f5';
      ctx.fillRect(0, 28, 32, 4);
      ctx.fillRect(28, 0, 4, 32);
      // Ice crystal sheen
      ctx.fillStyle = '#e8f4fd';
      ctx.fillRect(8, 8, 6, 4);
      ctx.fillRect(18, 16, 8, 4);
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

    // 14. Tree Alien Pine
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);
      // Trunk
      ctx.fillStyle = '#4a2810';
      ctx.fillRect(14, 20, 4, 12);
      // Foliage layers with mutant purple sheen
      ctx.fillStyle = '#183a27';
      ctx.fillRect(6, 16, 20, 7);
      ctx.fillRect(9, 10, 14, 7);
      ctx.fillRect(12, 4, 8, 7);
      ctx.fillStyle = '#295a3d';
      ctx.fillRect(8, 17, 16, 3);
      ctx.fillRect(11, 11, 10, 3);
      ctx.fillRect(13, 5, 6, 3);
      // Alien spore tip
      ctx.fillStyle = '#9d4edd';
      ctx.fillRect(15, 2, 2, 3);
      this.cache['tile_' + CONSTANTS.TILES.TREE_ALIEN_PINE] = canvas;
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

  get(name) {
    return this.cache[name];
  }
}

// Global instance
window.pixelArt = new PixelArt();
