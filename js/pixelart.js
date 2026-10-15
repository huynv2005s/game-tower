// High-Definition Realistic 2.5D Sprite & Texture Generator
// Generates detailed, realistic, high-contrast sprites for all creatures, flora, trees, resources, terrain, and structures

class PixelArt {
  constructor() {
    this.cache = {};
    this.dataUrlCache = {};
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
    this.generatePhase5UpgradeSprites();
  }

  createCanvas(width, height, smooth = true) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = smooth;
    if (smooth && ctx.imageSmoothingQuality) {
      ctx.imageSmoothingQuality = 'high';
    }
    return { canvas: c, ctx: ctx };
  }

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

  // Helper: Draw a realistic leaf at (x, y) with angle, length, width, and colors
  drawLeaf(ctx, x, y, angle, length, width, baseColor, tipColor, outlineColor = 'rgba(10,25,12,0.7)') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, 0, length, 0);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(1, tipColor);
    ctx.fillStyle = grad;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.5, -width, length, 0);
    ctx.quadraticCurveTo(length * 0.5, width, 0, 0);
    ctx.fill();
    ctx.stroke();
    // Center vein
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(length * 0.8, 0);
    ctx.stroke();
    ctx.restore();
  }

  // ===========================================================================
  // 1. TERRAIN & WORLD OBJECT SPRITES
  // ===========================================================================
  generateTileSprites() {
    const S = CONSTANTS.TILE_SIZE; // 32

    // 1. Grass Tile (Natural Lush Woodland Meadow - Easy on the eyes, high contrast for entities)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const bgGrad = ctx.createLinearGradient(0, 0, S, S);
      bgGrad.addColorStop(0, '#2d5a27');
      bgGrad.addColorStop(0.5, '#33662c');
      bgGrad.addColorStop(1, '#285223');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, S, S);

      // Subtle organic soil & moss mottling
      ctx.fillStyle = 'rgba(30, 62, 24, 0.45)';
      ctx.beginPath();
      ctx.arc(8, 10, 6, 0, Math.PI * 2);
      ctx.arc(24, 22, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(74, 142, 59, 0.35)';
      ctx.beginPath();
      ctx.arc(20, 8, 5, 0, Math.PI * 2);
      ctx.arc(10, 24, 6, 0, Math.PI * 2);
      ctx.fill();

      // Delicate grass blades
      const bladePositions = [
        [4, 8], [14, 6], [26, 10], [8, 19], [19, 16], [28, 26], [11, 28]
      ];
      bladePositions.forEach(([bx, by], i) => {
        ctx.strokeStyle = (i % 2 === 0) ? '#46893c' : '#58a34b';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx - 1.5, by - 3, bx - 2, by - 5);
        ctx.moveTo(bx + 1, by);
        ctx.quadraticCurveTo(bx + 2.5, by - 2.5, bx + 3, by - 4.5);
        ctx.stroke();
      });

      this.cache['tile_' + CONSTANTS.TILES.GRASS] = canvas;
    }

    // 1b. Tall Grass Tile (Previously missing! Lush swaying meadow grass & clover)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);

      // Darker root shadow under tall grass clumps
      ctx.fillStyle = 'rgba(15, 36, 14, 0.45)';
      ctx.beginPath();
      ctx.ellipse(10, 14, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(22, 25, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lush tall grass clumps
      const drawClump = (cx, cy) => {
        const angles = [-0.45, -0.2, 0.05, 0.28, 0.5];
        angles.forEach((a, idx) => {
          const len = 7 + (idx % 2) * 2.5;
          ctx.strokeStyle = idx % 2 === 0 ? '#3f8236' : '#65b755';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(cx + (idx - 2) * 1.5, cy);
          ctx.quadraticCurveTo(
            cx + Math.sin(a) * (len * 0.6),
            cy - len * 0.6,
            cx + Math.sin(a) * len,
            cy - len
          );
          ctx.stroke();
        });
      };
      drawClump(10, 14);
      drawClump(22, 25);
      drawClump(23, 11);

      this.cache['tile_' + CONSTANTS.TILES.GRASS_TALL] = canvas;
    }

    // 2. Grass Flowers (Realistic Woodland Wildflowers & Bioluminescent Blooms)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);

      const drawFlower = (fx, fy, petalColor, centerColor, radius = 3.2) => {
        // Leaf base
        ctx.fillStyle = '#1e461a';
        ctx.beginPath();
        ctx.arc(fx, fy + 1, radius + 1, 0, Math.PI * 2);
        ctx.fill();
        // 5 Petals
        ctx.fillStyle = petalColor;
        for (let a = 0; a < 5; a++) {
          const ang = (a * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(ang) * (radius * 0.65), fy + Math.sin(ang) * (radius * 0.65), radius * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
        // Flower core
        ctx.fillStyle = centerColor;
        ctx.beginPath();
        ctx.arc(fx, fy, radius * 0.42, 0, Math.PI * 2);
        ctx.fill();
      };

      drawFlower(8, 9, '#f43f5e', '#fef08a', 3.4);   // Crimson wild rose
      drawFlower(23, 21, '#c084fc', '#ffffff', 3.2); // Lavender orchid
      drawFlower(21, 8, '#38bdf8', '#e0f2fe', 2.8);  // Cyan dew blossom
      drawFlower(10, 24, '#facc15', '#b45309', 2.8); // Golden buttercup

      this.cache['tile_' + CONSTANTS.TILES.GRASS_FLOWERS] = canvas;
    }

    // 3. Dirt Path / Base Plaza Flagstone & Packed Earth
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const earthGrad = ctx.createLinearGradient(0, 0, S, S);
      earthGrad.addColorStop(0, '#5c4433');
      earthGrad.addColorStop(0.5, '#6b4f3b');
      earthGrad.addColorStop(1, '#523b2b');
      ctx.fillStyle = earthGrad;
      ctx.fillRect(0, 0, S, S);

      // Subtle stone pavers embedded in packed earth
      const stones = [
        { x: 3, y: 3, w: 12, h: 10 },
        { x: 17, y: 4, w: 12, h: 11 },
        { x: 5, y: 16, w: 13, h: 12 },
        { x: 20, y: 18, w: 9, h: 10 }
      ];
      stones.forEach(st => {
        ctx.fillStyle = 'rgba(42, 30, 21, 0.5)';
        ctx.beginPath();
        ctx.roundRect(st.x + 1, st.y + 1, st.w, st.h, 3);
        ctx.fill();

        ctx.fillStyle = '#7c624e';
        ctx.beginPath();
        ctx.roundRect(st.x, st.y, st.w, st.h, 3);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(st.x + 1, st.y + 1, st.w - 3, 1.5);
      });

      // Small pebbles
      ctx.fillStyle = '#9c826e';
      ctx.beginPath();
      ctx.arc(15, 14, 1.3, 0, Math.PI * 2);
      ctx.arc(3, 28, 1.2, 0, Math.PI * 2);
      ctx.arc(29, 16, 1.2, 0, Math.PI * 2);
      ctx.fill();

      this.cache['tile_' + CONSTANTS.TILES.DIRT_PATH] = canvas;
    }

    // 4. Mountain Rock (Chiseled Highland Granite)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const rockGrad = ctx.createLinearGradient(0, 0, S, S);
      rockGrad.addColorStop(0, '#3b4354');
      rockGrad.addColorStop(0.6, '#2e3543');
      rockGrad.addColorStop(1, '#232834');
      ctx.fillStyle = rockGrad;
      ctx.fillRect(0, 0, S, S);

      // Layered granite slabs
      ctx.fillStyle = '#475166';
      ctx.beginPath();
      ctx.roundRect(2, 2, 28, 12, 3);
      ctx.roundRect(3, 16, 26, 13, 3);
      ctx.fill();

      // Top sunlit bevel edge
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(4, 3); ctx.lineTo(27, 3);
      ctx.moveTo(5, 17); ctx.lineTo(26, 17);
      ctx.stroke();

      // Subtle geological crevices
      ctx.strokeStyle = '#171b24';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(2, 15); ctx.lineTo(14, 14); ctx.lineTo(30, 15);
      ctx.moveTo(16, 3); ctx.lineTo(14, 14);
      ctx.stroke();

      this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK] = canvas;
    }

    // 4b. Mountain Slate (Dark Stratified Basalt Terrace)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#252b38';
      ctx.fillRect(0, 0, S, S);

      for (let y = 1; y < S; y += 8) {
        ctx.fillStyle = '#323a4b';
        ctx.fillRect(1, y, 30, 6);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.fillRect(2, y, 28, 1.2);
        ctx.fillStyle = '#181c26';
        ctx.fillRect(0, y + 6, S, 1.5);
      }
      // Highland moss patch
      ctx.fillStyle = 'rgba(77, 124, 15, 0.45)';
      ctx.beginPath();
      ctx.ellipse(8, 6, 4, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(23, 22, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_SLATE] = canvas;
    }

    // 5. Snow Peak (Alpine Glacier Ice & Snowdrift)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const snowGrad = ctx.createLinearGradient(0, 0, S, S);
      snowGrad.addColorStop(0, '#f8fafc');
      snowGrad.addColorStop(0.55, '#e2e8f0');
      snowGrad.addColorStop(1, '#93c5fd');
      ctx.fillStyle = snowGrad;
      ctx.fillRect(0, 0, S, S);

      // Soft snowdrift ridge curves
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(10, 10, 9, 0, Math.PI * 2);
      ctx.arc(22, 20, 8, 0, Math.PI * 2);
      ctx.fill();

      // Glacial ice shadow crease
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(4, 24);
      ctx.quadraticCurveTo(16, 18, 28, 26);
      ctx.stroke();

      this.cache['tile_' + CONSTANTS.TILES.SNOW_PEAK] = canvas;
    }

    // 6-10. Mountain Resource Tiles (Ground base + high-detail 2.5D standing object sprite)
    // We also generate dedicated larger 44x44 standing sprites for world.js to render with depth!
    this.generateResourceNodeSprites();

    // Tile fallbacks for minimap/tile lookup:
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);
      ctx.drawImage(this.cache['obj_sulfur_ore'], 0, 0, S, S);
      this.cache['tile_' + CONSTANTS.TILES.ORE_SULFUR] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);
      ctx.drawImage(this.cache['obj_quartz_ore'], 0, 0, S, S);
      this.cache['tile_' + CONSTANTS.TILES.ORE_QUARTZ] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);
      ctx.drawImage(this.cache['obj_snow_lotus'], 0, 0, S, S);
      this.cache['tile_' + CONSTANTS.TILES.HERB_SNOW_LOTUS] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);
      ctx.drawImage(this.cache['obj_silver_moss'], 0, 0, S, S);
      this.cache['tile_' + CONSTANTS.TILES.HERB_SILVER_MOSS] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);
      ctx.drawImage(this.cache['obj_alien_egg'], 0, 0, S, S);
      this.cache['tile_' + CONSTANTS.TILES.ALIEN_EGG] = canvas;
    }

    // 11. River Water (Crystal Flowing Stream with Caustics)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const waterGrad = ctx.createLinearGradient(0, 0, S, S);
      waterGrad.addColorStop(0, '#0284c7');
      waterGrad.addColorStop(0.5, '#0369a1');
      waterGrad.addColorStop(1, '#075985');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 0, S, S);

      // Flowing water ripples
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(3, 8); ctx.quadraticCurveTo(10, 5, 18, 8);
      ctx.moveTo(14, 18); ctx.quadraticCurveTo(22, 15, 29, 18);
      ctx.moveTo(5, 26); ctx.quadraticCurveTo(12, 24, 20, 26);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(6, 11); ctx.lineTo(13, 11);
      ctx.moveTo(17, 21); ctx.lineTo(25, 21);
      ctx.stroke();

      this.cache['tile_' + CONSTANTS.TILES.RIVER_WATER] = canvas;
    }

    // 12. Lake Water (Deep Tranquil Alpine/Plains Lake)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const lakeGrad = ctx.createRadialGradient(16, 16, 2, 16, 16, 22);
      lakeGrad.addColorStop(0, '#0284c7');
      lakeGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = lakeGrad;
      ctx.fillRect(0, 0, S, S);

      // Gentle water shimmer
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(6, 10); ctx.quadraticCurveTo(12, 8, 18, 10);
      ctx.moveTo(14, 22); ctx.quadraticCurveTo(20, 20, 26, 22);
      ctx.stroke();

      this.cache['tile_' + CONSTANTS.TILES.LAKE_WATER] = canvas;
    }

    // 13. Wooden Bridge (Detailed Timber Plank Bridge with Side Beams & Nails)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Water visible in tiny gaps between planks
      ctx.fillStyle = '#075985';
      ctx.fillRect(0, 0, S, S);

      // Support stringer beams underneath
      ctx.fillStyle = '#3b1e08';
      ctx.fillRect(3, 0, 5, S);
      ctx.fillRect(24, 0, 5, S);

      // 4 Realistic grained timber planks
      for (let i = 0; i < 4; i++) {
        const py = i * 8;
        const plankGrad = ctx.createLinearGradient(0, py, S, py + 7);
        plankGrad.addColorStop(0, '#9a5b25');
        plankGrad.addColorStop(0.5, '#b06d32');
        plankGrad.addColorStop(1, '#854a1a');
        ctx.fillStyle = plankGrad;
        ctx.beginPath();
        ctx.roundRect(1, py + 0.5, 30, 6.8, 1.5);
        ctx.fill();

        // Plank bevel highlight & wood grain
        ctx.fillStyle = 'rgba(254, 243, 199, 0.22)';
        ctx.fillRect(2, py + 1, 28, 1);
        ctx.strokeStyle = 'rgba(69, 26, 3, 0.45)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(6, py + 3.5); ctx.lineTo(26, py + 3.5);
        ctx.stroke();

        // Iron rivets / nails on ends
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(4.5, py + 3.8, 1.1, 0, Math.PI * 2);
        ctx.arc(27.5, py + 3.8, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Side rope/timber guard rails
      ctx.fillStyle = '#5c3010';
      ctx.fillRect(0, 0, 2.5, S);
      ctx.fillRect(29.5, 0, 2.5, S);

      this.cache['tile_' + CONSTANTS.TILES.WOODEN_BRIDGE] = canvas;
    }

    // 14 & 14b. Tree Tile Fallbacks
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);
      this.cache['tile_' + CONSTANTS.TILES.TREE_ALIEN_PINE] = canvas;
      this.cache['tile_' + CONSTANTS.TILES.TREE_POST_APOC] = canvas;
    }

    // 15. Sand Beach (Warm Golden Coastal Sand with Wind Ripples & Shells)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const sandGrad = ctx.createLinearGradient(0, 0, S, S);
      sandGrad.addColorStop(0, '#f3d078');
      sandGrad.addColorStop(0.5, '#eab959');
      sandGrad.addColorStop(1, '#dfa846');
      ctx.fillStyle = sandGrad;
      ctx.fillRect(0, 0, S, S);

      // Soft wind-blown sand ripples
      ctx.strokeStyle = 'rgba(254, 249, 195, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(2, 9); ctx.quadraticCurveTo(16, 6, 30, 10);
      ctx.moveTo(4, 23); ctx.quadraticCurveTo(18, 20, 29, 24);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(180, 120, 40, 0.28)';
      ctx.beginPath();
      ctx.moveTo(2, 10.5); ctx.quadraticCurveTo(16, 7.5, 30, 11.5);
      ctx.moveTo(4, 24.5); ctx.quadraticCurveTo(18, 21.5, 29, 25.5);
      ctx.stroke();

      this.cache['tile_' + CONSTANTS.TILES.SAND] = canvas;
    }

    // 16. Wet Sand (Tidal Shoreline Sand)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const wetGrad = ctx.createLinearGradient(0, 0, 0, S);
      wetGrad.addColorStop(0, '#c89643');
      wetGrad.addColorStop(1, '#9c6f27');
      ctx.fillStyle = wetGrad;
      ctx.fillRect(0, 0, S, S);

      // Wet specular sheen & seafoam line
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 27);
      ctx.quadraticCurveTo(16, 23, 32, 27);
      ctx.stroke();

      this.cache['tile_' + CONSTANTS.TILES.SAND_WET] = canvas;
    }

    // 17. Shallow Ocean (Turquoise Surf & White Seafoam)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const surfGrad = ctx.createLinearGradient(0, 0, 0, S);
      surfGrad.addColorStop(0, '#14b8a6');
      surfGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = surfGrad;
      ctx.fillRect(0, 0, S, S);

      // White surf wave crests
      ctx.strokeStyle = 'rgba(240, 253, 250, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 6); ctx.quadraticCurveTo(16, 2, 32, 6);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(204, 251, 241, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(4, 20); ctx.quadraticCurveTo(16, 17, 28, 20);
      ctx.stroke();

      this.cache['tile_' + CONSTANTS.TILES.OCEAN_SHALLOW] = canvas;
    }

    // 18. Deep Ocean (Abyssal Swells)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const deepGrad = ctx.createLinearGradient(0, 0, 0, S);
      deepGrad.addColorStop(0, '#0369a1');
      deepGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = deepGrad;
      ctx.fillRect(0, 0, S, S);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(2, 10); ctx.quadraticCurveTo(16, 6, 30, 10);
      ctx.moveTo(6, 24); ctx.quadraticCurveTo(18, 21, 28, 24);
      ctx.stroke();

      this.cache['tile_' + CONSTANTS.TILES.OCEAN_DEEP] = canvas;
    }

    // 19. Tech Debris Tile & Sea Shell
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.SAND], 0, 0);
      ctx.drawImage(this.cache['obj_tech_debris'], 0, 0, S, S);
      this.cache['tile_' + CONSTANTS.TILES.TECH_DEBRIS] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.SAND], 0, 0);
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();
      this.cache['tile_' + CONSTANTS.TILES.SEA_SHELL] = canvas;
    }
  }

  // ===========================================================================
  // 1B. REALISTIC 2.5D STANDING RESOURCE NODES (44x44 to 48x48)
  // ===========================================================================
  generateResourceNodeSprites() {
    // 1. Sulfur Ore Node (44x44 Volcanic Rock with Bright Golden Sulfur Crystals)
    {
      const W = 44, H = 44;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
      ctx.beginPath();
      ctx.ellipse(22, 37, 17, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark volcanic basalt boulder base
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(6, 35);
      ctx.lineTo(9, 20);
      ctx.lineTo(22, 15);
      ctx.lineTo(35, 21);
      ctx.lineTo(38, 35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sunlit rock facet
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(9, 20);
      ctx.lineTo(22, 15);
      ctx.lineTo(24, 34);
      ctx.lineTo(7, 34);
      ctx.closePath();
      ctx.fill();

      // Helper to draw faceted sulfur crystal spire
      const drawSulfurCrystal = (cx, cy, w, h, angle) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const grad = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.45, '#facc15');
        grad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(w / 2, -h * 0.65);
        ctx.lineTo(w * 0.4, 0);
        ctx.lineTo(-w * 0.4, 0);
        ctx.lineTo(-w / 2, -h * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Specular facet highlight
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath();
        ctx.moveTo(0, -h + 1);
        ctx.lineTo(-w * 0.35, -h * 0.6);
        ctx.lineTo(0, -h * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      drawSulfurCrystal(15, 28, 9, 17, -0.32);
      drawSulfurCrystal(29, 29, 9, 16, 0.35);
      drawSulfurCrystal(22, 26, 11, 21, 0.02);
      drawSulfurCrystal(12, 33, 7, 11, -0.5);
      drawSulfurCrystal(32, 33, 7, 11, 0.48);

      this.cache['obj_sulfur_ore'] = canvas;
    }

    // 2. Quartz Crystal Geode Node (44x44 Radiant Cyan Hexagonal Prisms)
    {
      const W = 44, H = 44;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Cyan ambient ground glow + shadow
      const glow = ctx.createRadialGradient(22, 34, 2, 22, 34, 18);
      glow.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(22, 34, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(22, 37, 16, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Geode rock bed
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(22, 33, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      const drawQuartzPrism = (cx, cy, w, h, angle) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const grad = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, '#67e8f9');
        grad.addColorStop(0.75, '#06b6d4');
        grad.addColorStop(1, '#0e7490');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#083344';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(w / 2, -h * 0.72);
        ctx.lineTo(w * 0.38, 0);
        ctx.lineTo(-w * 0.38, 0);
        ctx.lineTo(-w / 2, -h * 0.72);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Central prism ridge line
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(0, -2);
        ctx.stroke();
        ctx.restore();
      };

      drawQuartzPrism(14, 32, 8, 19, -0.38);
      drawQuartzPrism(30, 32, 8, 18, 0.38);
      drawQuartzPrism(10, 35, 6, 12, -0.65);
      drawQuartzPrism(34, 35, 6, 12, 0.65);
      drawQuartzPrism(22, 33, 10, 26, 0);

      this.cache['obj_quartz_ore'] = canvas;
    }

    // 3. Sacred Snow Lotus Herb (44x44 Multi-petal Glowing Alpine Lotus)
    {
      const W = 44, H = 44;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Soft shadow & frost aura
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(22, 35, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Basal jade-frost leaves (8 leaves radiating out)
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI * 2) / 8;
        this.drawLeaf(ctx, 22, 29, ang, 14, 4.5, '#0f766e', '#5eead4', '#042f2e');
      }

      // Outer lotus petals (8 petals in lavender-violet)
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI * 2) / 8 + 0.2;
        this.drawLeaf(ctx, 22, 26, ang, 12, 4.2, '#7e22ce', '#e9d5ff', '#3b0764');
      }

      // Inner upright lotus petals (6 petals in ice-white & pink-lilac)
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        this.drawLeaf(ctx, 22, 24, ang, 8.5, 3.5, '#c084fc', '#ffffff', '#581c87');
      }

      // Glowing sacred golden-cyan stamen center
      const coreGrad = ctx.createRadialGradient(22, 24, 1, 22, 24, 5);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.5, '#fef08a');
      coreGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(22, 24, 4.2, 0, Math.PI * 2);
      ctx.fill();

      this.cache['obj_snow_lotus'] = canvas;
    }

    // 4. Silver Moss Herb (44x44 Lush Metallic Silver-Mint Alpine Cushion & Spores)
    {
      const W = 44, H = 44;
      const { canvas, ctx } = this.createCanvas(W, H);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.ellipse(22, 36, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Alpine rock base
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(22, 33, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cushions of silver-emerald moss
      const mounds = [
        { x: 15, y: 30, r: 8 },
        { x: 28, y: 31, r: 7.5 },
        { x: 22, y: 26, r: 9 }
      ];
      mounds.forEach(m => {
        const g = ctx.createRadialGradient(m.x - 2, m.y - 3, 1, m.x, m.y, m.r);
        g.addColorStop(0, '#f8fafc');
        g.addColorStop(0.45, '#86efac');
        g.addColorStop(0.85, '#10b981');
        g.addColorStop(1, '#064e3b');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#022c22';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Delicate glowing silver spore stalks
      const stalks = [[14, 24], [19, 19], [24, 18], [29, 23]];
      stalks.forEach(([sx, sy]) => {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(sx, sy + 6);
        ctx.quadraticCurveTo(sx - 1, sy + 2, sx + 1, sy);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx + 1, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      this.cache['obj_silver_moss'] = canvas;
    }

    // 5. Alien Egg Nest (48x48 Translucent Biomechanical Ovomorph with Embryo & Creep)
    {
      const W = 48, H = 48;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Organic purple biomass creep tendrils on ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(24, 39, 19, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const creepGrad = ctx.createRadialGradient(24, 37, 3, 24, 37, 18);
      creepGrad.addColorStop(0, '#701a75');
      creepGrad.addColorStop(0.7, '#4c1d95');
      creepGrad.addColorStop(1, 'rgba(46, 16, 101, 0)');
      ctx.fillStyle = creepGrad;
      ctx.beginPath();
      ctx.ellipse(24, 37, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Biomass root tendrils
      ctx.strokeStyle = '#86198f';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(24, 36);
        ctx.quadraticCurveTo(24 + Math.cos(a) * 10, 36 + Math.sin(a) * 4, 24 + Math.cos(a) * 17, 37 + Math.sin(a) * 6);
        ctx.stroke();
      }

      // Main Ovomorph Egg Pod
      const eggGrad = ctx.createRadialGradient(21, 20, 2, 24, 24, 16);
      eggGrad.addColorStop(0, '#f472b6'); // Translucent glowing pink-amber center
      eggGrad.addColorStop(0.45, '#be185d');
      eggGrad.addColorStop(0.8, '#581c87');
      eggGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = eggGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(24, 24, 11, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Curled embryo shadow silhouette visible inside translucent sac
      ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
      ctx.beginPath();
      ctx.arc(24, 24, 5, 0.3, Math.PI * 1.6);
      ctx.fill();

      // Glowing bioluminescent veins across shell
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(19, 13); ctx.quadraticCurveTo(22, 22, 18, 32);
      ctx.moveTo(29, 14); ctx.quadraticCurveTo(26, 23, 30, 33);
      ctx.stroke();

      // Top 4-petal opening seam with acid slime droplet
      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(19, 12); ctx.lineTo(29, 16);
      ctx.moveTo(29, 12); ctx.lineTo(19, 16);
      ctx.stroke();

      this.cache['obj_alien_egg'] = canvas;
    }

    // 6. Crashed Spaceship Tech Debris (48x44 Hull Plating, Circuitry & Solar Wing)
    {
      const W = 48, H = 44;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Ground shadow on sand
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(24, 35, 19, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Broken blue solar panel wing sticking out
      ctx.save();
      ctx.translate(14, 24);
      ctx.rotate(-0.35);
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-10, -8, 16, 12);
      ctx.strokeRect(-10, -8, 16, 12);
      // Solar grid lines
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-5, -8); ctx.lineTo(-5, 4);
      ctx.moveTo(0, -8); ctx.lineTo(0, 4);
      ctx.moveTo(-10, -2); ctx.lineTo(6, -2);
      ctx.stroke();
      ctx.restore();

      // Main Titanium Spacecraft Hull Cowling
      const hullGrad = ctx.createLinearGradient(10, 14, 38, 36);
      hullGrad.addColorStop(0, '#cbd5e1');
      hullGrad.addColorStop(0.5, '#64748b');
      hullGrad.addColorStop(1, '#334155');
      ctx.fillStyle = hullGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(10, 33);
      ctx.lineTo(15, 18);
      ctx.lineTo(35, 16);
      ctx.lineTo(40, 31);
      ctx.lineTo(26, 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Exposed glowing green/cyan circuit core & copper coils
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(20, 22, 12, 8);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(21, 25); ctx.lineTo(27, 25); ctx.lineTo(29, 28);
      ctx.stroke();

      // Glowing amber beacon diode
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(33, 21, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(33, 21, 1.2, 0, Math.PI * 2);
      ctx.fill();

      this.cache['obj_tech_debris'] = canvas;
    }
  }

  // ===========================================================================
  // 2. REALISTIC SURVIVOR PLAYER SPRITES (40x44)
  // ===========================================================================
  generatePlayerSprites() {
    const W = 40, H = 44;
    const directions = ['down', 'up', 'side'];

    directions.forEach(dir => {
      for (let frame = 0; frame < 3; frame++) {
        const { canvas, ctx } = this.createCanvas(W, H);

        const bob = (frame === 1) ? 1.2 : 0;
        const legStride = (frame === 1) ? -3 : (frame === 2) ? 3 : 0;
        const armSwing = (frame === 1) ? 2 : (frame === 2) ? -2 : 0;

        // 1. Backpack (drawn behind body when facing down or side)
        if (dir !== 'up') {
          ctx.fillStyle = '#064e3b';
          ctx.strokeStyle = '#022c22';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(10, 14 + bob, 20, 14, 3);
          ctx.fill();
          ctx.stroke();
        }

        // 2. Articulated Legs & Heavy Combat Boots
        const drawLeg = (lx, ly) => {
          // Tactical pants
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(lx, ly, 5.5, 9, 2);
          ctx.fill();
          ctx.stroke();
          // Knee pad
          ctx.fillStyle = '#475569';
          ctx.fillRect(lx + 0.8, ly + 2.5, 4, 2.5);
          // Combat boot
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(lx - 0.5, ly + 7, 6.5, 4, 1.5);
          ctx.fill();
          ctx.stroke();
        };

        if (dir === 'side') {
          drawLeg(17 - legStride * 0.7, 27 + bob);
          drawLeg(17 + legStride * 0.7, 27 + bob);
        } else {
          drawLeg(13, 27 + bob + legStride * 0.5);
          drawLeg(21.5, 27 + bob - legStride * 0.5);
        }

        // 3. Armored Hazmat/Tactical Torso & Rig
        const torsoGrad = ctx.createLinearGradient(12, 15 + bob, 28, 29 + bob);
        torsoGrad.addColorStop(0, '#475569');
        torsoGrad.addColorStop(0.5, '#334155');
        torsoGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = torsoGrad;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(12, 15 + bob, 16, 14, 3.5);
        ctx.fill();
        ctx.stroke();

        // Shoulder Pauldrons
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(12, 18 + bob, 3.5, 0, Math.PI * 2);
        ctx.arc(28, 18 + bob, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Yellow Hazard Harness & Utility Belt
        ctx.fillStyle = '#eab308';
        ctx.fillRect(14.5, 15.5 + bob, 2.2, 12);
        ctx.fillRect(23.3, 15.5 + bob, 2.2, 12);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(12.5, 25 + bob, 15, 2.8);
        ctx.fillStyle = '#f59e0b'; // Belt buckle
        ctx.fillRect(18.5, 25 + bob, 3, 2.8);

        // Chest Core Bio-Monitor Light
        if (dir === 'down') {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(20, 20.5 + bob, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Detailed Field Backpack (when facing UP)
        if (dir === 'up') {
          const packGrad = ctx.createLinearGradient(11, 14 + bob, 29, 28 + bob);
          packGrad.addColorStop(0, '#059669');
          packGrad.addColorStop(1, '#064e3b');
          ctx.fillStyle = packGrad;
          ctx.strokeStyle = '#022c22';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.roundRect(11, 15 + bob, 18, 13, 3);
          ctx.fill();
          ctx.stroke();
          // Rolled sleeping mat on top
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.roundRect(12, 13 + bob, 16, 3.5, 1.5);
          ctx.fill();
          ctx.stroke();
          // Glowing blue bio-tube on pack
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(25, 18 + bob, 2.2, 7);
        }

        // 5. Articulated Arms & Hazard Gloves
        const drawArm = (ax, ay) => {
          ctx.fillStyle = '#334155';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.roundRect(ax, ay, 4.2, 8, 2);
          ctx.fill();
          ctx.stroke();
          // Heavy yellow hazard glove
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(ax + 2.1, ay + 8, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        };

        if (dir === 'side') {
          drawArm(18 + armSwing * 0.5, 17 + bob);
        } else {
          drawArm(8.2, 17 + bob + armSwing * 0.5);
          drawArm(27.6, 17 + bob - armSwing * 0.5);
        }

        // 6. Ballistic Hazmat Helmet & Reflective Panoramic Visor
        const helmGrad = ctx.createRadialGradient(18, 8 + bob, 2, 20, 10 + bob, 9);
        helmGrad.addColorStop(0, '#64748b');
        helmGrad.addColorStop(0.7, '#334155');
        helmGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = helmGrad;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(20, 10.5 + bob, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (dir === 'down') {
          // Panoramic Glowing Cyan Bio-Visor
          const visorGrad = ctx.createLinearGradient(14, 7 + bob, 26, 13 + bob);
          visorGrad.addColorStop(0, '#67e8f9');
          visorGrad.addColorStop(0.5, '#06b6d4');
          visorGrad.addColorStop(1, '#0e7490');
          ctx.fillStyle = visorGrad;
          ctx.beginPath();
          ctx.roundRect(14, 8 + bob, 12, 5.2, 2.5);
          ctx.fill();
          ctx.stroke();
          // Visor specular reflection glint
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillRect(15.5, 9 + bob, 4, 1.3);

          // Twin Respirator Filter Canisters
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(15.5, 14.8 + bob, 2.4, 0, Math.PI * 2);
          ctx.arc(24.5, 14.8 + bob, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#22c55e'; // Filter LED
          ctx.fillRect(15, 14.3 + bob, 1.2, 1.2);
          ctx.fillRect(24, 14.3 + bob, 1.2, 1.2);
        } else if (dir === 'side') {
          // Side profile visor
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.roundRect(21, 8 + bob, 6.5, 5, 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(23, 9 + bob, 2.5, 1.2);
          // Side respirator snout
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(25.5, 14.2 + bob, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (dir === 'up') {
          // Back helmet plate & radio antenna
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(25, 6 + bob);
          ctx.lineTo(27, 1 + bob);
          ctx.stroke();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(27, 1 + bob, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        this.cache[`player_${dir}_${frame}`] = canvas;
      }
    });
  }

  // ===========================================================================
  // 3. WEAPON SPRITES (32x32)
  // ===========================================================================
  generateWeaponSprites() {
    // 1. Spear (Giáo Chiến Thuật Lưỡi Plasma)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.save();
      ctx.translate(16, 16);
      ctx.rotate(Math.PI / 4);
      // Carbon-alloy shaft with grip wraps
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.fillRect(-1.8, -12, 3.6, 26);
      ctx.strokeRect(-1.8, -12, 3.6, 26);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2.2, 0, 4.4, 7);
      // Glowing cyan plasma spearhead
      const bladeGrad = ctx.createLinearGradient(0, -21, 0, -10);
      bladeGrad.addColorStop(0, '#ffffff');
      bladeGrad.addColorStop(0.4, '#38bdf8');
      bladeGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(0, -21);
      ctx.lineTo(4.5, -11);
      ctx.lineTo(0, -13);
      ctx.lineTo(-4.5, -11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      this.cache['weapon_spear'] = canvas;
    }

    // 2. Staff (Gậy Chấn Động Năng Lượng)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.save();
      ctx.translate(16, 16);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.fillRect(-2, -11, 4, 24);
      ctx.strokeRect(-2, -11, 4, 24);
      // Shockwave resonator claws
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -14, 5.5, 0.3, Math.PI - 0.3);
      ctx.stroke();
      // Glowing purple grav-orb
      const orbGrad = ctx.createRadialGradient(-1, -15, 1, 0, -14, 5);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.5, '#d8b4fe');
      orbGrad.addColorStop(1, '#7e22ce');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(0, -14, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      this.cache['weapon_staff'] = canvas;
    }

    // 3. Dagger (Dao Găm Răng Cưa Sinh Học)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.save();
      ctx.translate(16, 16);
      ctx.rotate(Math.PI / 4);
      // Ergonomic grip & pommel
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2, 2, 4, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-5, 0, 10, 2.2);
      // Curved venomous bio-blade
      const dGrad = ctx.createLinearGradient(-3, -15, 3, 0);
      dGrad.addColorStop(0, '#bbf7d0');
      dGrad.addColorStop(0.5, '#22c55e');
      dGrad.addColorStop(1, '#14532d');
      ctx.fillStyle = dGrad;
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.quadraticCurveTo(4.5, -7, 3.2, 0);
      ctx.lineTo(-3.2, 0);
      ctx.quadraticCurveTo(-2, -8, 0, -15);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      this.cache['weapon_dagger'] = canvas;
    }

    // 4. Bow (Cung Phức Hợp Bắn Tỉa)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.save();
      ctx.translate(16, 16);
      // Recurve composite limbs
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-4, 0, 12, -Math.PI / 2.1, Math.PI / 2.1);
      ctx.stroke();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, 0, 10.5, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      // Glowing laser bowstring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-1, -11.5);
      ctx.lineTo(-1, 11.5);
      ctx.stroke();
      ctx.restore();
      this.cache['weapon_bow'] = canvas;
    }
  }

  // ===========================================================================
  // 4. INVENTORY & UI ITEM ICONS (32x32)
  // ===========================================================================
  generateItemIcons() {
    const S = 32;

    // Helmet
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(16, 15, 10, Math.PI, 0);
      ctx.lineTo(26, 23);
      ctx.lineTo(6, 23);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(9, 12, 14, 6, 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(10, 22, 3, 0, Math.PI * 2);
      ctx.arc(22, 22, 3, 0, Math.PI * 2);
      ctx.fill();
      this.cache['icon_helmet'] = canvas;
    }

    // Chestplate
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(6, 6, 20, 20, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#eab308';
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
      ctx.fillStyle = '#10b981';
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
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, 24, 12, 2);
      ctx.fillRect(16, 22, 12, 2);
      this.cache['icon_boots'] = canvas;
    }

    // Gloves
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(5, 8, 9, 15, 3);
      ctx.roundRect(17, 8, 9, 15, 3);
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.fillRect(7, 14, 5, 6);
      ctx.fillRect(19, 14, 5, 6);
      this.cache['icon_gloves'] = canvas;
    }

    // Resource Icons (Reuse high-detail node renders scaled cleanly to 32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['obj_snow_lotus'], 0, 0, S, S);
      this.cache['icon_lotus'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['obj_sulfur_ore'], 0, 0, S, S);
      this.cache['icon_sulfur'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['obj_quartz_ore'], 0, 0, S, S);
      this.cache['icon_quartz'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['obj_silver_moss'], 0, 0, S, S);
      this.cache['icon_moss'] = canvas;
    }

    // Alien Egg Fluid
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.roundRect(9, 8, 14, 18, 5);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(16, 17, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(12, 4, 8, 4);
      this.cache['icon_egg_fluid'] = canvas;
    }

    // Pure Water
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(12, 4, 8, 5);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(8, 9, 16, 18, 5);
      ctx.fill();
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.roundRect(10, 11, 12, 14, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 13, 3, 8);
      this.cache['icon_pure_water'] = canvas;
    }

    // Dirty Water
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(12, 4, 8, 5);
      ctx.fillStyle = '#3f6212';
      ctx.beginPath();
      ctx.roundRect(8, 9, 16, 18, 5);
      ctx.fill();
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(14, 16, 3, 0, Math.PI * 2);
      ctx.arc(19, 21, 2.5, 0, Math.PI * 2);
      ctx.fill();
      this.cache['icon_dirty_water'] = canvas;
    }

    // Wood Logs
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const drawLog = (x, y) => {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(x, y, 20, 7, 3);
        ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(x + 18, y + 3.5, 3, 0, Math.PI * 2);
        ctx.fill();
      };
      drawLog(5, 17);
      drawLog(7, 13);
      drawLog(6, 9);
      this.cache['icon_wood'] = canvas;
    }

    // Stone Boulder
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(5, 24);
      ctx.lineTo(9, 10);
      ctx.lineTo(22, 8);
      ctx.lineTo(27, 22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(9, 10);
      ctx.lineTo(22, 8);
      ctx.lineTo(18, 18);
      ctx.lineTo(7, 19);
      ctx.closePath();
      ctx.fill();
      this.cache['icon_stone'] = canvas;
    }

    // Tech Scrap
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['obj_tech_debris'], 0, 0, S, S);
      this.cache['icon_tech_scrap'] = canvas;
    }

    this.cache['icon_spear'] = this.cache['weapon_spear'];
    this.cache['icon_staff'] = this.cache['weapon_staff'];
    this.cache['icon_dagger'] = this.cache['weapon_dagger'];
    this.cache['icon_bow'] = this.cache['weapon_bow'];
  }

  // ===========================================================================
  // 5. REALISTIC BIOMECHANICAL MONSTER SPRITES (48x48 & 68x68)
  // ===========================================================================
  generateMonsterSprites() {
    // 1. Xenomorph Crawler (48x48 Realistic Biomechanical Insectoid Predator)
    {
      const W = 48, H = 48;
      const { canvas, ctx } = this.createCanvas(W, H);

      // 6 Articulated Scythe Legs (3 left, 3 right)
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 3.2;
      const legPairs = [
        { y: 17, spreadX: 19, tipY: 9 },
        { y: 24, spreadX: 21, tipY: 25 },
        { y: 31, spreadX: 18, tipY: 39 }
      ];
      legPairs.forEach(lp => {
        // Left leg
        ctx.beginPath();
        ctx.moveTo(19, lp.y);
        ctx.lineTo(24 - lp.spreadX * 0.65, lp.y - 3);
        ctx.lineTo(24 - lp.spreadX, lp.tipY);
        ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(29, lp.y);
        ctx.lineTo(24 + lp.spreadX * 0.65, lp.y - 3);
        ctx.lineTo(24 + lp.spreadX, lp.tipY);
        ctx.stroke();
      });

      // Highlight chitin on legs
      ctx.strokeStyle = '#7e22ce';
      ctx.lineWidth = 1.4;
      legPairs.forEach(lp => {
        ctx.beginPath();
        ctx.moveTo(19, lp.y);
        ctx.lineTo(24 - lp.spreadX * 0.65, lp.y - 3);
        ctx.moveTo(29, lp.y);
        ctx.lineTo(24 + lp.spreadX * 0.65, lp.y - 3);
        ctx.stroke();
      });

      // Whip-like Segmented Scorpion/Xenomorph Tail
      ctx.strokeStyle = '#3b0764';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(24, 34);
      ctx.quadraticCurveTo(32, 42, 22, 46);
      ctx.stroke();
      // Tail stinger barb
      ctx.fillStyle = '#a3e635';
      ctx.beginPath();
      ctx.moveTo(22, 46);
      ctx.lineTo(17, 44);
      ctx.lineTo(20, 42);
      ctx.closePath();
      ctx.fill();

      // Ribbed Chitinous Thorax & Abdomen
      const bodyGrad = ctx.createRadialGradient(22, 22, 2, 24, 24, 14);
      bodyGrad.addColorStop(0, '#9333ea');
      bodyGrad.addColorStop(0.55, '#4c1d95');
      bodyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(24, 25, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Dorsal chitin ribs
      ctx.strokeStyle = 'rgba(216, 180, 254, 0.45)';
      ctx.lineWidth = 1.2;
      for (let ry = 19; ry <= 31; ry += 4) {
        ctx.beginPath();
        ctx.arc(24, ry, 6.5, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }

      // Elongated Domed Xenomorph Head
      const headGrad = ctx.createLinearGradient(17, 6, 31, 18);
      headGrad.addColorStop(0, '#581c87');
      headGrad.addColorStop(0.5, '#2e1065');
      headGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(24, 13, 7.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Menacing Mandibles dripping Acid Venom
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(18, 9); ctx.lineTo(14, 3); ctx.lineTo(21, 8); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(30, 9); ctx.lineTo(34, 3); ctx.lineTo(27, 8); ctx.fill();

      // Venom droplets on fangs
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(14.5, 3.5, 1.6, 0, Math.PI * 2);
      ctx.arc(33.5, 3.5, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // 4 Glowing Crimson Compound Eyes
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(20.5, 11, 2, 0, Math.PI * 2);
      ctx.arc(27.5, 11, 2, 0, Math.PI * 2);
      ctx.arc(18.5, 13.5, 1.3, 0, Math.PI * 2);
      ctx.arc(29.5, 13.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(20, 10.5, 1, 1);
      ctx.fillRect(27, 10.5, 1, 1);

      this.cache['monster_crawler'] = canvas;
    }

    // 2. Training Dummy (48x48 Realistic Armored Combat Target Dummy)
    {
      const W = 48, H = 48;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Reinforced wooden/iron cross stand base
      ctx.fillStyle = '#451a03';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(24, 41, 13, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center wooden post & horizontal crossbar
      ctx.fillStyle = '#78350f';
      ctx.fillRect(21.5, 10, 5, 31);
      ctx.strokeRect(21.5, 10, 5, 31);
      ctx.fillRect(9, 18, 30, 4.5);
      ctx.strokeRect(9, 18, 30, 4.5);

      // Straw bundles sticking out at shoulders
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(9, 19); ctx.lineTo(5, 16);
      ctx.moveTo(9, 21); ctx.lineTo(4, 22);
      ctx.moveTo(39, 19); ctx.lineTo(43, 16);
      ctx.moveTo(39, 21); ctx.lineTo(44, 22);
      ctx.stroke();

      // Burlap sack torso wrapped in leather straps
      const sackGrad = ctx.createLinearGradient(14, 15, 34, 34);
      sackGrad.addColorStop(0, '#d97706');
      sackGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = sackGrad;
      ctx.beginPath();
      ctx.roundRect(14, 15, 20, 19, 4);
      ctx.fill();
      ctx.stroke();

      // Painted Bullseye Target on Chest
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(24, 24.5, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(24, 24.5, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(24, 24.5, 2, 0, Math.PI * 2);
      ctx.fill();

      // Dummy Burlap Head with Scrap Helmet
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(24, 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(24, 8.5, 6.5, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      this.cache['monster_dummy'] = canvas;
    }
  }

  // ===========================================================================
  // 6. PHASE 2 SPRITES: BIO-LAB, FURNACE, WILD FLORA & ANTIDOTES
  // ===========================================================================
  generatePhase2Sprites() {
    const S = 32;

    // 1. Bio-Lab Isolated Structure (96x96 High-Tech Geodesic Quarantine Dome & Airlock)
    {
      const { canvas, ctx } = this.createCanvas(96, 96);

      // Ground drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(6, 22, 84, 72, 10);
      ctx.fill();

      // Reinforced Octagonal Steel Bunker Foundation
      const baseGrad = ctx.createLinearGradient(0, 20, 96, 90);
      baseGrad.addColorStop(0, '#334155');
      baseGrad.addColorStop(0.5, '#1e293b');
      baseGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = baseGrad;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(6, 20, 84, 70, 8);
      ctx.fill();
      ctx.stroke();

      // Metallic wall paneling & rivets
      ctx.fillStyle = '#475569';
      ctx.fillRect(10, 48, 76, 36);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(10, 48, 76, 36);

      // Yellow/Black Hazard Quarantine Perimeter Stripe
      ctx.fillStyle = '#facc15';
      ctx.fillRect(8, 84, 80, 5);
      ctx.fillStyle = '#0f172a';
      for (let i = 8; i < 88; i += 10) {
        ctx.fillRect(i, 84, 5, 5);
      }

      // Geodesic Glass Quarantine Dome (Upper Half)
      const domeGrad = ctx.createRadialGradient(42, 34, 4, 48, 46, 38);
      domeGrad.addColorStop(0, 'rgba(167, 243, 208, 0.92)');
      domeGrad.addColorStop(0.45, 'rgba(16, 185, 129, 0.85)');
      domeGrad.addColorStop(0.85, 'rgba(6, 78, 59, 0.95)');
      domeGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.arc(48, 48, 36, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Visible Hydroponic Growth Tubes & DNA Helix Tanks inside Glass Dome
      const podX = [26, 44, 62];
      podX.forEach(px => {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.fillRect(px, 32, 8, 14);
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, 32, 8, 14);
        // Glowing green seedling inside pod
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(px + 4, 40, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Geodesic Titanium Dome Struts
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(48, 48, 36, Math.PI, 0);
      ctx.moveTo(12, 48); ctx.lineTo(84, 48);
      ctx.moveTo(48, 12); ctx.lineTo(48, 48);
      ctx.moveTo(23, 23); ctx.lineTo(48, 48);
      ctx.moveTo(73, 23); ctx.lineTo(48, 48);
      ctx.stroke();

      // Twin HEPA Air Filtration Towers on Sides
      [10, 76].forEach(tx => {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(tx, 10, 10, 18);
        ctx.strokeRect(tx, 10, 10, 18);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(tx + 5, 14, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Pressurized Airlock Blast Doorway
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(35, 52, 26, 32, 4);
      ctx.fill();
      const doorGrad = ctx.createLinearGradient(37, 54, 59, 84);
      doorGrad.addColorStop(0, '#38bdf8');
      doorGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = doorGrad;
      ctx.beginPath();
      ctx.roundRect(38, 55, 20, 28, 3);
      ctx.fill();
      // Airlock center seam & Medical Cross Emblem
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(46.5, 61, 3, 9);
      ctx.fillRect(43.5, 64, 9, 3);

      // Illuminated Roof Banner: BIO-LAB
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(24, 5, 48, 12, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ecfdf5';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✚ BIO-LAB', 48, 14);

      this.cache['building_biolab'] = canvas;
    }

    // 2. Furnace (48x48 Industrial Blast Smelter & Water Distiller)
    {
      const { canvas, ctx } = this.createCanvas(48, 48);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(24, 43, 21, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Copper water distillation tank on right side
      const tankGrad = ctx.createLinearGradient(34, 18, 45, 18);
      tankGrad.addColorStop(0, '#f59e0b');
      tankGrad.addColorStop(0.5, '#d97706');
      tankGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = tankGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(34, 16, 10, 24, 3);
      ctx.fill();
      ctx.stroke();
      // Pure water gauge window on tank
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(37, 21, 4, 12);

      // Main Cast-Iron & Refractory Brick Furnace Body
      const bodyGrad = ctx.createLinearGradient(4, 10, 36, 42);
      bodyGrad.addColorStop(0, '#475569');
      bodyGrad.addColorStop(0.6, '#334155');
      bodyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(4, 12, 32, 30, 5);
      ctx.fill();
      ctx.stroke();

      // Smokestack Chimney with Glowing Flue
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(14, 2, 12, 11);
      ctx.strokeRect(14, 2, 12, 11);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(20, 3, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Arched Molten Firebox Chamber
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(20, 31, 9, Math.PI, 0);
      ctx.lineTo(29, 39);
      ctx.lineTo(11, 39);
      ctx.closePath();
      ctx.fill();

      // Roaring Fire Gradient inside chamber
      const fireGrad = ctx.createRadialGradient(20, 35, 1, 20, 33, 9);
      fireGrad.addColorStop(0, '#ffffff');
      fireGrad.addColorStop(0.35, '#fef08a');
      fireGrad.addColorStop(0.7, '#f97316');
      fireGrad.addColorStop(1, '#dc2626');
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.arc(20, 32, 7.5, Math.PI, 0);
      ctx.lineTo(27.5, 38);
      ctx.lineTo(12.5, 38);
      ctx.closePath();
      ctx.fill();

      // Iron Firebox Bars
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.4;
      for (let bx = 15; bx <= 25; bx += 5) {
        ctx.beginPath();
        ctx.moveTo(bx, 24);
        ctx.lineTo(bx, 39);
        ctx.stroke();
      }

      this.cache['building_furnace'] = canvas;
    }

    // 3. Clean Wild Berry Bush (40x40 Lush Leafy Shrub with Glossy Ruby Berries)
    {
      const W = 40, H = 40;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(20, 33, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Layered leafy foliage clusters
      const puffs = [
        { x: 12, y: 25, r: 9, c1: '#166534', c2: '#14532d' },
        { x: 28, y: 25, r: 9, c1: '#166534', c2: '#14532d' },
        { x: 20, y: 27, r: 10, c1: '#15803d', c2: '#14532d' },
        { x: 15, y: 18, r: 8.5, c1: '#22c55e', c2: '#15803d' },
        { x: 25, y: 19, r: 8.5, c1: '#22c55e', c2: '#15803d' },
        { x: 20, y: 15, r: 8, c1: '#4ade80', c2: '#16a34a' }
      ];
      puffs.forEach(p => {
        const g = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, p.r);
        g.addColorStop(0, p.c1);
        g.addColorStop(1, p.c2);
        ctx.fillStyle = g;
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Individual outer leaves
      this.drawLeaf(ctx, 9, 22, -2.5, 7, 3, '#16a34a', '#86efac');
      this.drawLeaf(ctx, 31, 22, -0.5, 7, 3, '#16a34a', '#86efac');
      this.drawLeaf(ctx, 20, 10, -1.5, 6, 3, '#22c55e', '#bbf7d0');

      // Glossy Ruby-Red Wild Berries with Specular Shine
      const berries = [
        [13, 18], [16, 20], [24, 16], [27, 19], [19, 24], [22, 26], [11, 26], [28, 26]
      ];
      berries.forEach(([bx, by]) => {
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(bx, by, 2.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // White shine dot
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx - 1.2, by - 1.4, 1.2, 1.2);
      });

      this.cache['tile_berry_clean'] = canvas;
    }

    // 4. Blighted / Mutated Berry Bush (40x40 Thorny Toxic Violet Shrub dripping Acid)
    {
      const W = 40, H = 40;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Toxic purple ground puddle shadow
      ctx.fillStyle = 'rgba(88, 28, 135, 0.55)';
      ctx.beginPath();
      ctx.ellipse(20, 33, 16, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Withered dark violet/charcoal bramble puffs
      const puffs = [
        { x: 12, y: 25, r: 9, c1: '#4c1d95', c2: '#1e1b4b' },
        { x: 28, y: 25, r: 9, c1: '#4c1d95', c2: '#1e1b4b' },
        { x: 20, y: 26, r: 10, c1: '#581c87', c2: '#2e1065' },
        { x: 16, y: 17, r: 8, c1: '#7e22ce', c2: '#3b0764' },
        { x: 24, y: 18, r: 8, c1: '#7e22ce', c2: '#3b0764' }
      ];
      puffs.forEach(p => {
        const g = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, p.r);
        g.addColorStop(0, p.c1);
        g.addColorStop(1, p.c2);
        ctx.fillStyle = g;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Swollen Neon-Magenta Mutant Berries & Dripping Green Toxin
      const berries = [
        [13, 18], [24, 16], [19, 23], [27, 23], [12, 25]
      ];
      berries.forEach(([bx, by]) => {
        ctx.fillStyle = '#e879f9';
        ctx.strokeStyle = '#4a044e';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Green toxic slime drip
        ctx.fillStyle = '#a3e635';
        ctx.beginPath();
        ctx.arc(bx, by + 3, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      this.cache['tile_berry_blighted'] = canvas;
    }

    // 5. Blighted Herb
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.GRASS], 0, 0);
      ctx.fillStyle = '#262626';
      ctx.fillRect(14, 16, 4, 10);
      ctx.fillRect(10, 12, 12, 6);
      ctx.fillStyle = '#831843';
      ctx.fillRect(12, 14, 8, 4);
      this.cache['tile_herb_blighted'] = canvas;
    }

    // 6. Icons for Phase 2 Items
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_berry_clean'], 0, 0, S, S);
      this.cache['icon_berry_clean'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_berry_blighted'], 0, 0, S, S);
      this.cache['icon_berry_blighted'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#404040';
      ctx.fillRect(14, 10, 4, 14);
      ctx.fillRect(8, 14, 16, 6);
      ctx.fillStyle = '#701a75';
      ctx.fillRect(10, 16, 12, 4);
      this.cache['icon_blighted_herb'] = canvas;
    }

    // Antidote Lesser
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(12, 3, 8, 4);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(8, 7, 16, 21, 4);
      ctx.fill();
      const liqGrad = ctx.createLinearGradient(10, 12, 22, 26);
      liqGrad.addColorStop(0, '#6ee7b7');
      liqGrad.addColorStop(1, '#059669');
      ctx.fillStyle = liqGrad;
      ctx.beginPath();
      ctx.roundRect(10, 12, 12, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 16, 2, 6);
      ctx.fillRect(13, 18, 6, 2);
      this.cache['icon_antidote_lesser'] = canvas;
    }

    // Antidote Pure
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(12, 3, 8, 4);
      ctx.beginPath();
      ctx.roundRect(7, 7, 18, 21, 4);
      ctx.fill();
      const pureGrad = ctx.createLinearGradient(9, 10, 23, 26);
      pureGrad.addColorStop(0, '#e0f2fe');
      pureGrad.addColorStop(0.5, '#38bdf8');
      pureGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = pureGrad;
      ctx.beginPath();
      ctx.roundRect(9, 10, 14, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 14, 2, 8);
      ctx.fillRect(12, 17, 8, 2);
      this.cache['icon_antidote_pure'] = canvas;
    }

    // Seeds
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.drawImage(this.cache['obj_snow_lotus'], 4, 4, 24, 24);
      this.cache['icon_seed_lotus'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.drawImage(this.cache['obj_silver_moss'], 4, 4, 24, 24);
      this.cache['icon_seed_moss'] = canvas;
    }
  }

  // ===========================================================================
  // 7. PHASE 3 SPRITES: WORKBENCH, WORKSHOP, DEFENSES & ADVANCED MONSTERS
  // ===========================================================================
  generatePhase3Sprites() {
    const S = 32;

    // 1. Workbench (48x32 Heavy Oak Carpenter & Engineering Bench)
    {
      const { canvas, ctx } = this.createCanvas(48, 32);
      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(24, 28, 22, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sturdy timber legs
      ctx.fillStyle = '#451a03';
      ctx.fillRect(6, 20, 5, 10);
      ctx.fillRect(37, 20, 5, 10);
      ctx.fillRect(11, 24, 26, 3);

      // Thick Oak Tabletop with Wood Grain
      const topGrad = ctx.createLinearGradient(4, 6, 44, 22);
      topGrad.addColorStop(0, '#b45309');
      topGrad.addColorStop(0.5, '#92400e');
      topGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = topGrad;
      ctx.strokeStyle = '#270e02';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(4, 6, 40, 17, 3);
      ctx.fill();
      ctx.stroke();

      // Unrolled glowing blue engineering blueprint
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(9, 9, 16, 11);
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(10, 10, 14, 9);
      ctx.beginPath();
      ctx.moveTo(12, 14); ctx.lineTo(22, 14);
      ctx.moveTo(17, 11); ctx.lineTo(17, 18);
      ctx.stroke();

      // Steel Bench Vise on left edge
      ctx.fillStyle = '#64748b';
      ctx.fillRect(2, 11, 4, 7);
      // Hammer & Saw on right side
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(29, 10, 11, 3.5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(37, 9, 4, 5);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(32, 15, 2.5, 6);

      this.cache['building_workbench'] = canvas;
    }

    // 2. Workshop (64x48 Military Automated Munitions & Turret Bay)
    {
      const { canvas, ctx } = this.createCanvas(64, 48);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(4, 10, 56, 37, 6);
      ctx.fill();

      // Steel Factory Platform
      const platGrad = ctx.createLinearGradient(4, 8, 60, 44);
      platGrad.addColorStop(0, '#334155');
      platGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = platGrad;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(4, 8, 56, 36, 5);
      ctx.fill();
      ctx.stroke();

      // Hazard Striping Header
      ctx.fillStyle = '#facc15';
      ctx.fillRect(6, 10, 52, 5);
      ctx.fillStyle = '#0f172a';
      for (let i = 6; i < 58; i += 8) {
        ctx.fillRect(i, 10, 4, 5);
      }

      // Heavy Forging Anvil on Left
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(10, 26); ctx.lineTo(26, 26); ctx.lineTo(22, 31); ctx.lineTo(14, 31);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(13, 31, 10, 6);

      // Robotic Articulated Welding Arm & Plasma Core on Right
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(48, 36);
      ctx.lineTo(52, 24);
      ctx.lineTo(42, 22);
      ctx.stroke();

      // Glowing Cyan Plasma Battery Core
      const coreG = ctx.createRadialGradient(38, 28, 1, 38, 28, 7);
      coreG.addColorStop(0, '#ffffff');
      coreG.addColorStop(0.5, '#38bdf8');
      coreG.addColorStop(1, '#0369a1');
      ctx.fillStyle = coreG;
      ctx.beginPath();
      ctx.arc(38, 28, 6, 0, Math.PI * 2);
      ctx.fill();

      this.cache['building_workshop'] = canvas;
    }

    // 3. Defense: Reinforced Concrete & Steel Wall (32x32 2.5D Barricade)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // 2.5D Top & Front Concrete Block with Steel X-Bracing
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(1, 2, 30, 28);

      // Top bevel face
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(2, 2, 28, 7);
      // Front concrete wall face
      const wallG = ctx.createLinearGradient(0, 9, 0, 30);
      wallG.addColorStop(0, '#64748b');
      wallG.addColorStop(1, '#334155');
      ctx.fillStyle = wallG;
      ctx.fillRect(2, 9, 28, 19);

      // Steel Reinforcement Struts & Hazard Stripe
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 8, 28, 2);
      ctx.fillRect(7, 2, 3, 26);
      ctx.fillRect(22, 2, 3, 26);

      // Yellow caution stripe along base
      ctx.fillStyle = '#eab308';
      ctx.fillRect(3, 24, 26, 3);
      ctx.fillStyle = '#0f172a';
      for (let x = 4; x < 28; x += 6) ctx.fillRect(x, 24, 3, 3);

      // Steel rivets
      ctx.fillStyle = '#e2e8f0';
      [[8.5, 5], [23.5, 5], [8.5, 16], [23.5, 16]].forEach(([rx, ry]) => {
        ctx.beginPath(); ctx.arc(rx, ry, 1.2, 0, Math.PI * 2); ctx.fill();
      });

      this.cache['defense_wall'] = canvas;
    }

    // 4. Defense: Spike Trap (32x32 Neurotoxin Razor Spike Floor Grate)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Recessed steel floor plate
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(2, 2, 28, 28, 4);
      ctx.fill();
      ctx.stroke();

      // Grate cross-bars
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      for (let i = 10; i <= 22; i += 6) {
        ctx.beginPath();
        ctx.moveTo(4, i); ctx.lineTo(28, i);
        ctx.moveTo(i, 4); ctx.lineTo(i, 28);
        ctx.stroke();
      }

      // 9 Gleaming Conical Steel Spikes with Glowing Venom Tips
      const spikePos = [
        [8, 8], [16, 8], [24, 8],
        [8, 16], [16, 16], [24, 16],
        [8, 24], [16, 24], [24, 24]
      ];
      spikePos.forEach(([sx, sy]) => {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(sx, sy + 1, 3.2, 0, Math.PI * 2);
        ctx.fill();
        // Metallic cone
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 3.5);
        ctx.lineTo(sx + 2.8, sy + 2);
        ctx.lineTo(sx - 2.8, sy + 2);
        ctx.closePath();
        ctx.fill();
        // Green neurotoxin tip
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(sx, sy - 2.2, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      this.cache['defense_trap'] = canvas;
    }

    // 5. Defense: Watchtower / Plasma Turret (32x32 Rotating Twin-Barrel Autocannon)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Note: Turret rotates by `d.aimAngle` (0 rad = pointing RIGHT +X)
      // Let's draw it facing +X (Right) so rotation aligns barrel directly at target!
      // Armored circular turret housing
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(14, 16, 12, 0, Math.PI * 2); ctx.fill();

      const domeG = ctx.createRadialGradient(12, 14, 1, 14, 16, 10);
      domeG.addColorStop(0, '#64748b');
      domeG.addColorStop(1, '#1e293b');
      ctx.fillStyle = domeG;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(14, 16, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Twin Plasma Autocannon Barrels pointing RIGHT (+X)
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1;
      ctx.fillRect(18, 10.5, 13, 4);
      ctx.strokeRect(18, 10.5, 13, 4);
      ctx.fillRect(18, 17.5, 13, 4);
      ctx.strokeRect(18, 17.5, 13, 4);

      // Glowing Cyan Muzzle Coils
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(26, 11.2, 4, 2.6);
      ctx.fillRect(26, 18.2, 4, 2.6);

      // Center Plasma Reactor Core
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath(); ctx.arc(13, 16, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(13, 16, 1.8, 0, Math.PI * 2); ctx.fill();

      this.cache['defense_turret'] = canvas;
    }

    // 6. Defense: Heavy Siege Mortar (32x32 High-Caliber Artillery Cannon)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Heavy octagonal sandbag & steel stabilizer baseplate
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(16, 18, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hydraulic recoil struts
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(7, 24); ctx.lineTo(12, 14);
      ctx.moveTo(25, 24); ctx.lineTo(20, 14);
      ctx.stroke();

      // Massive Angled Siege Mortar Tube
      const tubeG = ctx.createLinearGradient(9, 4, 23, 22);
      tubeG.addColorStop(0, '#94a3b8');
      tubeG.addColorStop(0.5, '#475569');
      tubeG.addColorStop(1, '#1e293b');
      ctx.fillStyle = tubeG;
      ctx.beginPath();
      ctx.roundRect(9.5, 4, 13, 19, 3);
      ctx.fill();
      ctx.stroke();

      // Crimson Muzzle Ring & Dark Bore Hole
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(16, 6, 6.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.ellipse(16, 6, 4.2, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      this.cache['defense_mortar'] = canvas;
    }

    // 7. Icons for Defensive Structures & Backpack
    this.cache['icon_defense_wall'] = this.cache['defense_wall'];
    this.cache['icon_defense_trap'] = this.cache['defense_trap'];
    this.cache['icon_defense_turret'] = this.cache['defense_turret'];
    this.cache['icon_defense_mortar'] = this.cache['defense_mortar'];

    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#065f46';
      ctx.beginPath(); ctx.roundRect(6, 7, 20, 20, 4); ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.roundRect(8, 12, 16, 12, 3); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(10, 15, 3, 5);
      ctx.fillRect(19, 15, 3, 5);
      this.cache['icon_backpack'] = canvas;
    }

    // 8. Advanced Monster Species (48x48 & 68x68)
    // A. Kamikaze Exploder (48x48 Volatile Magma-Tick Creature)
    {
      const W = 48, H = 48;
      const { canvas, ctx } = this.createCanvas(W, H);

      // 6 Spiked Raptorial Legs gripping ground
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 3;
      const legs = [15, 24, 33];
      legs.forEach((ly, idx) => {
        ctx.beginPath();
        ctx.moveTo(14, ly); ctx.lineTo(4, ly + (idx - 1) * 5);
        ctx.moveTo(34, ly); ctx.lineTo(44, ly + (idx - 1) * 5);
        ctx.stroke();
      });

      // Massive Engorged Translucent Plasma-Bile Abdomen Sac
      const sacGrad = ctx.createRadialGradient(21, 24, 3, 24, 27, 16);
      sacGrad.addColorStop(0, '#ffffff');
      sacGrad.addColorStop(0.25, '#fef08a');
      sacGrad.addColorStop(0.6, '#f97316');
      sacGrad.addColorStop(0.88, '#dc2626');
      sacGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = sacGrad;
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(24, 27, 14.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pressurized glowing magma veins & pustules on sac
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(16, 20); ctx.quadraticCurveTo(24, 26, 18, 36);
      ctx.moveTo(32, 20); ctx.quadraticCurveTo(25, 27, 31, 35);
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(17, 29, 2.8, 0, Math.PI * 2);
      ctx.arc(31, 26, 2.5, 0, Math.PI * 2);
      ctx.arc(25, 35, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Armored Head & Frenzied Glowing Eyes
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.ellipse(24, 12, 7.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(20.5, 10.5, 2.2, 0, Math.PI * 2);
      ctx.arc(27.5, 10.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      this.cache['monster_exploder'] = canvas;
    }

    // B. Acid Spitter (48x48 Cobra-Hooded Venom Artillery Creature)
    {
      const W = 48, H = 48;
      const { canvas, ctx } = this.createCanvas(W, H);

      // 4 Long Stalker Arachnid Legs
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(16, 22); ctx.lineTo(5, 10); ctx.lineTo(3, 18);
      ctx.moveTo(32, 22); ctx.lineTo(43, 10); ctx.lineTo(45, 18);
      ctx.moveTo(16, 30); ctx.lineTo(6, 40); ctx.lineTo(4, 45);
      ctx.moveTo(32, 30); ctx.lineTo(42, 40); ctx.lineTo(44, 45);
      ctx.stroke();

      // Flared Venomous Cobra Hood / Frill
      const frillGrad = ctx.createRadialGradient(24, 18, 4, 24, 18, 17);
      frillGrad.addColorStop(0, '#4d7c0f');
      frillGrad.addColorStop(0.7, '#15803d');
      frillGrad.addColorStop(1, '#052e16');
      ctx.fillStyle = frillGrad;
      ctx.strokeStyle = '#022c22';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(24, 18, 15, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bioluminescent warning eye-spots on cobra hood
      ctx.fillStyle = '#bef264';
      ctx.beginPath();
      ctx.arc(13, 17, 2.5, 0, Math.PI * 2);
      ctx.arc(35, 17, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Distended Glowing Acid-Gland Abdomen
      const acidG = ctx.createRadialGradient(22, 29, 2, 24, 31, 11);
      acidG.addColorStop(0, '#ecfccb');
      acidG.addColorStop(0.45, '#a3e635');
      acidG.addColorStop(0.85, '#4d7c0f');
      acidG.addColorStop(1, '#14532d');
      ctx.fillStyle = acidG;
      ctx.beginPath();
      ctx.ellipse(24, 31, 9.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spitter Head & Open Acid-Spraying Maw
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(24, 13, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing Acid Globule in Mouth
      ctx.fillStyle = '#d9f99d';
      ctx.beginPath();
      ctx.arc(24, 7.5, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(24, 7.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(21, 12, 1.6, 0, Math.PI * 2);
      ctx.arc(27, 12, 1.6, 0, Math.PI * 2);
      ctx.fill();

      this.cache['monster_spitter'] = canvas;
    }

    // C. Titan Behemoth (68x68 Colossal Armored Siege Juggernaut Boss)
    {
      const W = 68, H = 68;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Massive Pillar Legs
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(14, 46, 14, 16, 4);
      ctx.roundRect(40, 46, 14, 16, 4);
      ctx.fill();
      ctx.stroke();

      // Colossal Gorilla/Rhino Crusher Forearms with Bone Claws
      const drawCrusherArm = (ax, ay, isRight) => {
        const dir = isRight ? 1 : -1;
        const armG = ctx.createLinearGradient(ax - 8, ay, ax + 8, ay + 26);
        armG.addColorStop(0, '#4338ca');
        armG.addColorStop(0.6, '#312e81');
        armG.addColorStop(1, '#0f172a');
        ctx.fillStyle = armG;
        ctx.beginPath();
        ctx.roundRect(ax - 7, ay, 14, 28, 6);
        ctx.fill();
        ctx.stroke();
        // Shoulder bone spikes
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(ax + dir * 4, ay + 2);
        ctx.lineTo(ax + dir * 13, ay - 6);
        ctx.lineTo(ax + dir * 7, ay + 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Knuckle claws
        for (let c = -4; c <= 4; c += 4) {
          ctx.beginPath();
          ctx.arc(ax + c, ay + 28, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      drawCrusherArm(10, 18, false);
      drawCrusherArm(58, 18, true);

      // Armored Juggernaut Carapace Torso
      const torsoG = ctx.createRadialGradient(30, 26, 4, 34, 30, 24);
      torsoG.addColorStop(0, '#6366f1');
      torsoG.addColorStop(0.5, '#3730a3');
      torsoG.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = torsoG;
      ctx.beginPath();
      ctx.roundRect(16, 14, 36, 36, 10);
      ctx.fill();
      ctx.stroke();

      // Glowing Purple Mutagenic Reactor Core Vents on Chest/Back
      ctx.fillStyle = '#d946ef';
      ctx.beginPath();
      ctx.roundRect(25, 24, 18, 4, 2);
      ctx.roundRect(27, 31, 14, 4, 2);
      ctx.fill();
      ctx.fillStyle = '#fdf4ff';
      ctx.fillRect(28, 25, 12, 2);

      // Armored Head & Twin Curved Siege-Ramming Horns
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(34, 16, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Left & Right Ivory Siege Horns
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      // Left horn
      ctx.beginPath();
      ctx.moveTo(25, 14);
      ctx.quadraticCurveTo(14, 6, 20, 1);
      ctx.quadraticCurveTo(22, 9, 29, 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Right horn
      ctx.beginPath();
      ctx.moveTo(43, 14);
      ctx.quadraticCurveTo(54, 6, 48, 1);
      ctx.quadraticCurveTo(46, 9, 39, 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 6 Glowing Blood-Red Boss Eyes
      ctx.fillStyle = '#ef4444';
      const eyes = [[29, 14], [39, 14], [27, 17], [41, 17], [31, 18], [37, 18]];
      eyes.forEach(([ex, ey]) => {
        ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, Math.PI * 2); ctx.fill();
      });

      this.cache['monster_behemoth'] = canvas;
    }
  }

  // ===========================================================================
  // 8. REALISTIC FOREST TREES & MOUNTAIN PEAKS
  // ===========================================================================
  generateMountainAndForestSprites() {
    // A. Tree Ancient Pine (64x92 Towering Realistic Multi-Cluster Conifer)
    {
      const W = 64, H = 92;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Soft Ground Cast Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(32, 84, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gnarled Roots & Textured Redwood/Pine Bark Trunk
      const trunkG = ctx.createLinearGradient(25, 58, 39, 85);
      trunkG.addColorStop(0, '#78350f');
      trunkG.addColorStop(0.5, '#542409');
      trunkG.addColorStop(1, '#291002');
      ctx.fillStyle = trunkG;
      ctx.strokeStyle = '#180901';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(27, 56);
      ctx.lineTo(37, 56);
      ctx.lineTo(39, 79);
      ctx.lineTo(45, 85);
      ctx.lineTo(34, 84);
      ctx.lineTo(32, 86);
      ctx.lineTo(29, 84);
      ctx.lineTo(19, 85);
      ctx.lineTo(25, 79);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Moss at root base
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(26, 82, 3.5, 0, Math.PI * 2);
      ctx.arc(37, 83, 3, 0, Math.PI * 2);
      ctx.fill();

      // Helper: Draw organic rounded pine foliage tier made of overlapping needle puffs
      const drawOrganicPineTier = (cy, spanW, tierH, scalePuff) => {
        const count = 5;
        // 1. Dark under-bough ambient occlusion shadow puffs
        for (let i = 0; i < count; i++) {
          const t = (i / (count - 1)) - 0.5; // -0.5 to 0.5
          const px = 32 + t * spanW;
          const py = cy + Math.abs(t) * 6 + 3;
          ctx.fillStyle = '#052010';
          ctx.beginPath();
          ctx.arc(px, py, scalePuff, 0, Math.PI * 2);
          ctx.fill();
        }
        // 2. Main lush pine needle clusters with sunlit top-left gradient
        for (let i = 0; i < count; i++) {
          const t = (i / (count - 1)) - 0.5;
          const px = 32 + t * (spanW * 0.92);
          const py = cy + Math.abs(t) * 5;
          const r = scalePuff * (1.05 - Math.abs(t) * 0.25);
          const g = ctx.createRadialGradient(px - r * 0.3, py - r * 0.35, 1, px, py, r);
          g.addColorStop(0, '#4ade80');
          g.addColorStop(0.45, '#16a34a');
          g.addColorStop(0.85, '#14532d');
          g.addColorStop(1, '#062c16');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // 6 Cascading Organic Bough Tiers from Bottom to Crown
      drawOrganicPineTier(60, 44, 16, 10.5);
      drawOrganicPineTier(49, 38, 15, 9.5);
      drawOrganicPineTier(38, 32, 14, 8.8);
      drawOrganicPineTier(28, 25, 13, 7.8);
      drawOrganicPineTier(19, 17, 11, 6.8);
      drawOrganicPineTier(11, 8, 9, 5.5);

      // Crown leader shoot
      this.drawLeaf(ctx, 32, 9, -Math.PI / 2, 7, 3, '#16a34a', '#86efac');

      this.cache['tree_ancient_pine'] = canvas;
    }

    // B. Tree Alien Spore Pine (64x96 Bioluminescent Extraterrestrial Canopy Tree)
    {
      const W = 64, H = 96;
      const { canvas, ctx } = this.createCanvas(W, H);

      // Bioluminescent ground glow & shadow
      const groundGlow = ctx.createRadialGradient(32, 86, 4, 32, 86, 26);
      groundGlow.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
      groundGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = groundGlow;
      ctx.beginPath();
      ctx.ellipse(32, 86, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(10, 5, 25, 0.5)';
      ctx.beginPath();
      ctx.ellipse(32, 86, 22, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Twisted Violet Trunk with Glowing Cyan Sap Veins
      ctx.fillStyle = '#2e1065';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(27, 54);
      ctx.lineTo(37, 54);
      ctx.lineTo(40, 82);
      ctx.lineTo(46, 88);
      ctx.lineTo(18, 88);
      ctx.lineTo(24, 82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, 56); ctx.quadraticCurveTo(34, 70, 27, 86);
      ctx.moveTo(35, 60); ctx.quadraticCurveTo(31, 74, 38, 86);
      ctx.stroke();

      // Small glowing mushrooms at tree roots
      [[22, 85], [41, 86]].forEach(([mx, my]) => {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(mx, my, 3, Math.PI, 0); ctx.fill();
      });

      const drawAlienCanopyTier = (cy, spanW, scalePuff) => {
        const count = 5;
        for (let i = 0; i < count; i++) {
          const t = (i / (count - 1)) - 0.5;
          const px = 32 + t * spanW;
          const py = cy + Math.abs(t) * 5;
          const r = scalePuff * (1.05 - Math.abs(t) * 0.2);

          const g = ctx.createRadialGradient(px - 2, py - 3, 1, px, py, r);
          g.addColorStop(0, '#e879f9');
          g.addColorStop(0.4, '#7e22ce');
          g.addColorStop(0.8, '#312e81');
          g.addColorStop(1, '#0f172a');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();

          // Hanging bioluminescent cyan/pink spore pods
          if (i === 0 || i === count - 1 || i === 2) {
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, py + r * 0.6);
            ctx.lineTo(px, py + r + 5);
            ctx.stroke();
            ctx.fillStyle = (i === 2) ? '#38bdf8' : '#f472b6';
            ctx.beginPath();
            ctx.arc(px, py + r + 5, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      };

      drawAlienCanopyTier(60, 44, 10.5);
      drawAlienCanopyTier(48, 38, 9.5);
      drawAlienCanopyTier(36, 30, 8.5);
      drawAlienCanopyTier(25, 22, 7.5);
      drawAlienCanopyTier(15, 12, 6.2);

      this.cache['tree_alien_pine'] = canvas;
    }

    // C. Tree Post-Apocalypse Charred (64x88 Gnarled Scorched Oak with Smoldering Heartwood)
    {
      const W = 64, H = 88;
      const { canvas, ctx } = this.createCanvas(W, H);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(32, 80, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gnarled Charcoal Trunk & Forked Branches
      ctx.strokeStyle = '#18181b';
      ctx.lineCap = 'round';
      // Trunk
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(32, 78);
      ctx.quadraticCurveTo(30, 56, 32, 38);
      ctx.stroke();

      // Roots
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(30, 74); ctx.lineTo(20, 81);
      ctx.moveTo(34, 74); ctx.lineTo(44, 81);
      ctx.stroke();

      // Major Branches
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(31, 52); ctx.quadraticCurveTo(18, 44, 11, 30);
      ctx.moveTo(33, 48); ctx.quadraticCurveTo(46, 40, 53, 26);
      ctx.moveTo(32, 38); ctx.quadraticCurveTo(24, 24, 20, 12);
      ctx.moveTo(32, 38); ctx.quadraticCurveTo(39, 22, 43, 10);
      ctx.stroke();

      // Secondary Twigs
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(18, 40); ctx.lineTo(14, 22);
      ctx.moveTo(46, 36); ctx.lineTo(50, 18);
      ctx.moveTo(25, 24); ctx.lineTo(31, 14);
      ctx.stroke();

      // Glowing Smoldering Magma Cracks inside Hollow Trunk
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(32, 44);
      ctx.lineTo(30, 56);
      ctx.lineTo(33, 68);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(31, 56, 2, 0, Math.PI * 2);
      ctx.fill();

      this.cache['tree_dead_apoc'] = canvas;
    }

    // D. Cut Tree Stump (32x24)
    {
      const { canvas, ctx } = this.createCanvas(32, 24);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.ellipse(16, 19, 13, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.roundRect(7, 9, 18, 11, 3);
      ctx.fill();

      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(16, 9, 8.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Concentric growth rings
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(16, 9, 5, 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      this.cache['tree_stump'] = canvas;
    }

    // E. Dense Forest Undergrowth & Ferns (32x24)
    {
      const { canvas, ctx } = this.createCanvas(32, 24);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI + (i * Math.PI) / 6;
        this.drawLeaf(ctx, 16, 19, a, 12, 3.5, '#14532d', '#4ade80');
      }
      this.cache['foliage_bush_dense'] = canvas;
    }

    // F. Majestic Large Snow Peak (64x64)
    {
      const S = 64;
      const { canvas, ctx } = this.createCanvas(S, S);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(32, 58, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Left sunlit snow face
      const leftG = ctx.createLinearGradient(6, 6, 32, 60);
      leftG.addColorStop(0, '#ffffff');
      leftG.addColorStop(0.6, '#e0f2fe');
      leftG.addColorStop(1, '#64748b');
      ctx.fillStyle = leftG;
      ctx.beginPath();
      ctx.moveTo(32, 4);
      ctx.lineTo(34, 28);
      ctx.lineTo(28, 44);
      ctx.lineTo(32, 60);
      ctx.lineTo(4, 60);
      ctx.closePath();
      ctx.fill();

      // Right shaded glacial face
      const rightG = ctx.createLinearGradient(32, 4, 60, 60);
      rightG.addColorStop(0, '#93c5fd');
      rightG.addColorStop(0.5, '#1e3a8a');
      rightG.addColorStop(1, '#0f172a');
      ctx.fillStyle = rightG;
      ctx.beginPath();
      ctx.moveTo(32, 4);
      ctx.lineTo(60, 60);
      ctx.lineTo(32, 60);
      ctx.lineTo(28, 44);
      ctx.lineTo(34, 28);
      ctx.closePath();
      ctx.fill();

      // Outline
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(4, 60);
      ctx.lineTo(32, 4);
      ctx.lineTo(60, 60);
      ctx.stroke();

      this.cache['mountain_peak_snow_large'] = canvas;
    }

    // G. Dark Granite Crag Spire (64x64)
    {
      const S = 64;
      const { canvas, ctx } = this.createCanvas(S, S);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(32, 58, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      const cragG = ctx.createLinearGradient(8, 6, 56, 60);
      cragG.addColorStop(0, '#64748b');
      cragG.addColorStop(0.5, '#334155');
      cragG.addColorStop(1, '#0f172a');
      ctx.fillStyle = cragG;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(4, 60);
      ctx.lineTo(24, 6);
      ctx.lineTo(35, 24);
      ctx.lineTo(44, 14);
      ctx.lineTo(60, 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sunlit ridge highlights
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(24, 6); ctx.lineTo(28, 56);
      ctx.moveTo(44, 14); ctx.lineTo(40, 56);
      ctx.stroke();

      this.cache['mountain_crag_spire'] = canvas;
    }

    // H. Vertical Cliff Wall (32x32)
    {
      const S = CONSTANTS.TILE_SIZE;
      const { canvas, ctx } = this.createCanvas(S, S);
      const cliffG = ctx.createLinearGradient(0, 0, 0, S);
      cliffG.addColorStop(0, '#475569');
      cliffG.addColorStop(0.3, '#334155');
      cliffG.addColorStop(1, '#0f172a');
      ctx.fillStyle = cliffG;
      ctx.fillRect(0, 0, S, S);

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, S, 2.5);
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(10, 2); ctx.lineTo(12, 30);
      ctx.moveTo(23, 2); ctx.lineTo(21, 30);
      ctx.stroke();

      this.cache['cliff_face_vertical'] = canvas;
    }

    // I. Cliff Top Ridge
    {
      const S = CONSTANTS.TILE_SIZE;
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['cliff_face_vertical'], 0, 0);
      this.cache['cliff_top_ridge'] = canvas;
    }

    // J. Active Volcanic Sulfur Fissure (32x32)
    {
      const S = CONSTANTS.TILE_SIZE;
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);

      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.ellipse(16, 16, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const lavaG = ctx.createRadialGradient(16, 16, 1, 16, 16, 10);
      lavaG.addColorStop(0, '#ffffff');
      lavaG.addColorStop(0.4, '#facc15');
      lavaG.addColorStop(0.8, '#f97316');
      lavaG.addColorStop(1, '#7c2d12');
      ctx.fillStyle = lavaG;
      ctx.beginPath();
      ctx.ellipse(16, 16, 9.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      this.cache['sulfur_fissure_active'] = canvas;
    }
  }

  // ===========================================================================
  // 9. PHASE 5 SPRITES: UPGRADED WALLS & GUNS (LV.2 - LV.3), PLASMA RIFLE, NEW MATERIALS & CACHED FX
  // ===========================================================================
  generatePhase5UpgradeSprites() {
    const S = 32;

    // 1. Wall Lv.2: Titanium Armored Wall (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(1, 2, 30, 28);

      // Brushed Titanium Top Bevel
      const topG = ctx.createLinearGradient(2, 2, 30, 9);
      topG.addColorStop(0, '#e2e8f0');
      topG.addColorStop(1, '#64748b');
      ctx.fillStyle = topG;
      ctx.fillRect(2, 2, 28, 7);

      // Metallic Blue-Steel Front Plate
      const frontG = ctx.createLinearGradient(0, 9, 0, 29);
      frontG.addColorStop(0, '#475569');
      frontG.addColorStop(0.5, '#1e293b');
      frontG.addColorStop(1, '#0f172a');
      ctx.fillStyle = frontG;
      ctx.fillRect(2, 9, 28, 20);

      // Diagonal Titanium X-Armor Straps
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(4, 11); ctx.lineTo(28, 27);
      ctx.moveTo(28, 11); ctx.lineTo(4, 27);
      ctx.stroke();

      // Glowing Cyan Thorns Energy Strip
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(3, 17, 26, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(4, 18, 24, 2);

      // Border Frame
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(1.5, 2.5, 29, 27);

      this.cache['defense_wall_lv2'] = canvas;
    }

    // 2. Wall Lv.3: Plasma Forcefield Wall (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(1, 1, 30, 30);

      // Golden-Titanium Outer Pillars
      const pilG = ctx.createLinearGradient(0, 2, 0, 30);
      pilG.addColorStop(0, '#facc15');
      pilG.addColorStop(0.5, '#ca8a04');
      pilG.addColorStop(1, '#422006');
      ctx.fillStyle = pilG;
      ctx.fillRect(1, 2, 7, 28);
      ctx.fillRect(24, 2, 7, 28);

      // Glowing Plasma Energy Barrier Core
      const coreG = ctx.createLinearGradient(8, 3, 24, 29);
      coreG.addColorStop(0, '#22d3ee');
      coreG.addColorStop(0.5, '#a855f7');
      coreG.addColorStop(1, '#06b6d4');
      ctx.fillStyle = coreG;
      ctx.fillRect(8, 3, 16, 26);

      // Horizontal Laser Forcefield Beams
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 7, 16, 2);
      ctx.fillRect(8, 15, 16, 2.5);
      ctx.fillRect(8, 23, 16, 2);

      // Gold Crown Trim
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1.5, 2, 29, 28);

      this.cache['defense_wall_lv3'] = canvas;
    }

    // 3. Turret Lv.2: Twin Gatling Laser Turret (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Armored Hex Base
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(13, 16, 12.5, 0, Math.PI * 2); ctx.fill();

      const domeG = ctx.createRadialGradient(11, 14, 1, 13, 16, 11);
      domeG.addColorStop(0, '#94a3b8');
      domeG.addColorStop(0.6, '#334155');
      domeG.addColorStop(1, '#0f172a');
      ctx.fillStyle = domeG;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(13, 16, 10.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Quad Gatling Laser Barrels pointing RIGHT (+X)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(17, 8, 14, 5);
      ctx.fillRect(17, 19, 14, 5);

      ctx.fillStyle = '#e879f9';
      ctx.fillRect(19, 9.5, 12, 2);
      ctx.fillRect(19, 20.5, 12, 2);

      // Glowing Magenta/Cyan Laser Tips
      ctx.fillStyle = '#fdf4ff';
      ctx.fillRect(28, 9, 3, 3);
      ctx.fillRect(28, 20, 3, 3);

      // Center Overclocked Core
      ctx.fillStyle = '#d946ef';
      ctx.beginPath(); ctx.arc(13, 16, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(13, 16, 2.2, 0, Math.PI * 2); ctx.fill();

      this.cache['defense_turret_lv2'] = canvas;
    }

    // 4. Turret Lv.3: Railgun Tesla Turret (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#090d16';
      ctx.beginPath(); ctx.arc(13, 16, 13, 0, Math.PI * 2); ctx.fill();

      // Gold & Titanium Chasis
      const domeG = ctx.createRadialGradient(11, 14, 1, 13, 16, 11);
      domeG.addColorStop(0, '#fef08a');
      domeG.addColorStop(0.55, '#ca8a04');
      domeG.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = domeG;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(13, 16, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Heavy Twin Electromagnetic Railgun Rails pointing RIGHT (+X)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(15, 7, 16, 6);
      ctx.fillRect(15, 19, 16, 6);

      // Cyan Tesla Coils along barrel
      ctx.fillStyle = '#22d3ee';
      for (let x = 18; x <= 28; x += 4) {
        ctx.fillRect(x, 7.5, 2.5, 5);
        ctx.fillRect(x, 19.5, 2.5, 5);
      }

      // Central Lightning Arc between rails
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(17, 14.5, 14, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(18, 13.5, 12, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(19, 15, 11, 2);

      // Core
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(12, 16, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(12, 16, 2.6, 0, Math.PI * 2); ctx.fill();

      this.cache['defense_turret_lv3'] = canvas;
    }

    // 5. Mortar Lv.2: Thermobaric Napalm Mortar (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(16, 18, 13.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Twin Napalm Fuel Tanks on sides
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(3, 11, 5, 13);
      ctx.fillRect(24, 11, 5, 13);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(4, 14, 3, 4);
      ctx.fillRect(25, 14, 3, 4);

      // Reinforced Mortar Barrel
      const tubeG = ctx.createLinearGradient(8, 3, 24, 23);
      tubeG.addColorStop(0, '#cbd5e1');
      tubeG.addColorStop(0.5, '#475569');
      tubeG.addColorStop(1, '#0f172a');
      ctx.fillStyle = tubeG;
      ctx.beginPath(); ctx.roundRect(8.5, 3, 15, 20, 3); ctx.fill(); ctx.stroke();

      // Glowing Orange Thermobaric Bore
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.ellipse(16, 5.5, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.ellipse(16, 5.5, 4, 2, 0, 0, Math.PI * 2); ctx.fill();

      this.cache['defense_mortar_lv2'] = canvas;
    }

    // 6. Mortar Lv.3: Orbital Mini-Nuke Cannon (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(16, 18, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Plasma Stabilizer Wings
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(2, 10, 6, 15);
      ctx.fillRect(24, 10, 6, 15);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(3.5, 12, 3, 11);
      ctx.fillRect(25.5, 12, 3, 11);

      // Colossal Nuke Tube
      const tubeG = ctx.createLinearGradient(8, 2, 24, 24);
      tubeG.addColorStop(0, '#fef08a');
      tubeG.addColorStop(0.5, '#7e22ce');
      tubeG.addColorStop(1, '#312e81');
      ctx.fillStyle = tubeG;
      ctx.beginPath(); ctx.roundRect(8, 2, 16, 21, 4); ctx.fill(); ctx.stroke();

      // Glowing Purple/Cyan Plasma Muzzle
      ctx.fillStyle = '#d946ef';
      ctx.beginPath(); ctx.ellipse(16, 5, 7.5, 3.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(16, 5, 4.5, 2.2, 0, 0, Math.PI * 2); ctx.fill();

      this.cache['defense_mortar_lv3'] = canvas;
    }

    // 7. Trap Lv.2: Titanium Sawblade Trap (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(2, 2, 28, 28, 4); ctx.fill(); ctx.stroke();

      const spikePos = [
        [8, 8], [16, 8], [24, 8],
        [8, 16], [16, 16], [24, 16],
        [8, 24], [16, 24], [24, 24]
      ];
      spikePos.forEach(([sx, sy]) => {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(sx, sy, 3.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 4); ctx.lineTo(sx + 3, sy + 2); ctx.lineTo(sx - 3, sy + 2);
        ctx.closePath(); ctx.fill();
      });

      this.cache['defense_trap_lv2'] = canvas;
    }

    // 8. Trap Lv.3: Tesla Shock Grid Trap (32x32)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.roundRect(2, 2, 28, 28, 4); ctx.fill(); ctx.stroke();

      // Electric grid lines
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(5, 10); ctx.lineTo(27, 10);
      ctx.moveTo(5, 16); ctx.lineTo(27, 16);
      ctx.moveTo(5, 22); ctx.lineTo(27, 22);
      ctx.moveTo(10, 5); ctx.lineTo(10, 27);
      ctx.moveTo(16, 5); ctx.lineTo(16, 27);
      ctx.moveTo(22, 5); ctx.lineTo(22, 27);
      ctx.stroke();

      // Glowing Tesla Nodes
      [[9, 9], [23, 9], [16, 16], [9, 23], [23, 23]].forEach(([nx, ny]) => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(nx, ny, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(nx, ny, 1.8, 0, Math.PI * 2); ctx.fill();
      });

      this.cache['defense_trap_lv3'] = canvas;
    }

    // 9. Player Weapon: Súng Trường Plasma (weapon_gun & icon_gun)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Futuristic Plasma Assault Rifle pointing RIGHT (+X)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.2;
      // Stock & Receiver
      ctx.beginPath();
      ctx.roundRect(2, 12, 22, 7, 2);
      ctx.fill();
      ctx.stroke();

      // Pistol Grip & Magazine
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(7, 18, 4, 6);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(14, 18, 4, 7);

      // Upper Titanium Shroud & Barrel
      ctx.fillStyle = '#64748b';
      ctx.fillRect(6, 10, 23, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(24, 11, 7, 3);

      // Glowing Cyan Plasma Chamber Coils
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(11, 12, 12, 3);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(13, 12.8, 8, 1.4);

      // holographic sight
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(10, 7, 5, 3);

      this.cache['weapon_gun'] = canvas;
      this.cache['icon_gun'] = canvas;
    }

    // 10. New World Resource: Quặng Sắt Titan (ORE_TITANIUM tile_9, obj_titanium_ore, icon_iron_ore)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.MOUNTAIN_ROCK], 0, 0);
      this.cache['tile_' + CONSTANTS.TILES.ORE_TITANIUM] = canvas;
    }
    {
      const W = 44, H = 44;
      const { canvas, ctx } = this.createCanvas(W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(22, 35, 16, 5.5, 0, 0, Math.PI * 2); ctx.fill();

      // Dark rock boulder with gleaming silver-blue Titanium veins
      const rockG = ctx.createLinearGradient(8, 8, 36, 36);
      rockG.addColorStop(0, '#94a3b8');
      rockG.addColorStop(0.5, '#475569');
      rockG.addColorStop(1, '#1e293b');
      ctx.fillStyle = rockG;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, 34); ctx.lineTo(11, 16); ctx.lineTo(22, 8); ctx.lineTo(34, 15); ctx.lineTo(37, 34);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      // Metallic Silver-Cyan Titanium Crystals
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(16, 26); ctx.lineTo(20, 12); ctx.lineTo(25, 25); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(24, 28); ctx.lineTo(29, 16); ctx.lineTo(33, 28); ctx.closePath(); ctx.fill();

      this.cache['obj_titanium_ore'] = canvas;

      const iconC = this.createCanvas(S, S);
      iconC.ctx.drawImage(canvas, 0, 0, S, S);
      this.cache['icon_iron_ore'] = iconC.canvas;
    }

    // 11. New Material Icon: Hợp Kim Titan (icon_titanium_alloy)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Stacked Gleaming Titanium Ingots
      const drawBar = (bx, by) => {
        const g = ctx.createLinearGradient(bx, by, bx + 20, by + 10);
        g.addColorStop(0, '#f8fafc');
        g.addColorStop(0.45, '#94a3b8');
        g.addColorStop(1, '#334155');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.roundRect(bx, by, 20, 9, 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(bx + 4, by + 3, 12, 2);
      };
      drawBar(4, 16);
      drawBar(8, 9);
      this.cache['icon_titanium_alloy'] = canvas;
    }

    // 12. New Material Icon: Giáp Xác Ngoại Lai (icon_alien_chitin)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const g = ctx.createRadialGradient(14, 12, 2, 16, 16, 13);
      g.addColorStop(0, '#c084fc');
      g.addColorStop(0.5, '#6b21a8');
      g.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(16, 3);
      ctx.quadraticCurveTo(28, 8, 26, 22);
      ctx.lineTo(16, 29);
      ctx.lineTo(6, 22);
      ctx.quadraticCurveTo(4, 8, 16, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Chitin ridges
      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, 12); ctx.lineTo(22, 12);
      ctx.moveTo(9, 18); ctx.lineTo(23, 18);
      ctx.stroke();

      this.cache['icon_alien_chitin'] = canvas;
    }

    // 13. New Material & Node: Lõi Năng Lượng Plasma (PLASMA_NODE tile_26, obj_plasma_node, icon_plasma_core)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache['tile_' + CONSTANTS.TILES.SAND], 0, 0);
      this.cache['tile_' + CONSTANTS.TILES.PLASMA_NODE] = canvas;
    }
    {
      const W = 44, H = 44;
      const { canvas, ctx } = this.createCanvas(W, H);
      // Glowing Containment Pylon on Beach
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(22, 36, 15, 5, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(12, 10, 20, 26, 4); ctx.fill(); ctx.stroke();

      const coreG = ctx.createRadialGradient(22, 22, 2, 22, 22, 9);
      coreG.addColorStop(0, '#ffffff');
      coreG.addColorStop(0.4, '#22d3ee');
      coreG.addColorStop(0.8, '#0284c7');
      coreG.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = coreG;
      ctx.beginPath(); ctx.arc(22, 22, 8, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.fillRect(13, 8, 18, 3);
      ctx.fillRect(13, 33, 18, 3);

      this.cache['obj_plasma_node'] = canvas;

      const iconC = this.createCanvas(S, S);
      iconC.ctx.drawImage(canvas, -4, -4, 40, 40);
      this.cache['icon_plasma_core'] = iconC.canvas;
    }

    // 14. Pre-rendered Performance FX Sprites (Eliminates per-frame createRadialGradient in render loops!)
    // A. Mist Cloud (128x64)
    {
      const W = 128, H = 64;
      const { canvas, ctx } = this.createCanvas(W, H);
      const grad = ctx.createRadialGradient(W / 2, H / 2, 6, W / 2, H / 2, W / 2);
      grad.addColorStop(0, 'rgba(224, 242, 254, 0.28)');
      grad.addColorStop(0.55, 'rgba(186, 230, 253, 0.14)');
      grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      this.cache['fx_mist_cloud'] = canvas;
    }

    // B. Bio-Lab Quarantine Field Aura (308x308)
    {
      const R = 150;
      const S2 = R * 2 + 8;
      const cx = S2 / 2, cy = S2 / 2;
      const { canvas, ctx } = this.createCanvas(S2, S2);
      const fieldGrad = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R);
      fieldGrad.addColorStop(0, 'rgba(16, 185, 129, 0.03)');
      fieldGrad.addColorStop(0.85, 'rgba(16, 185, 129, 0.10)');
      fieldGrad.addColorStop(1, 'rgba(52, 211, 153, 0.22)');
      ctx.fillStyle = fieldGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(52, 211, 153, 0.48)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      this.cache['fx_biolab_aura'] = canvas;
    }

    // C. Kamikaze Exploder Aura (64x64)
    {
      const W = 64, H = 64;
      const { canvas, ctx } = this.createCanvas(W, H);
      const glowGrad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
      glowGrad.addColorStop(0, 'rgba(251, 146, 60, 0.45)');
      glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();
      this.cache['fx_kamikaze_glow'] = canvas;
    }
  }

  get(name) {
    return this.cache[name];
  }

  getDataURL(name) {
    if (this.dataUrlCache[name]) {
      return this.dataUrlCache[name];
    }
    const c = this.cache[name];
    if (!c) return '';
    const url = c.toDataURL();
    this.dataUrlCache[name] = url;
    return url;
  }
}

// Global instance
window.pixelArt = new PixelArt();
