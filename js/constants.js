// Game Constants & Data-Driven Configuration Registry
// Alien Apocalypse: Survival + Adventure + Tower Defense + Companion Pet + Drone AI
// ===================================================================================
// HƯỚNG DẪN CẬP NHẬT NHANH (HOW TO ADD NEW CONTENT EASILY):
// 1. Thêm Quái Vật Mới: Thêm trực tiếp vào CONSTANTS.MONSTER_SPECIES (hoặc gọi GameRegistry.registerMonster)
// 2. Thêm Item / Thuốc / Giáp Mới: Thêm vào CONSTANTS.ITEM_TYPES (khai báo useEffect hoặc stats)
// 3. Thêm Đạn Mới: Thêm vào CONSTANTS.PROJECTILE_TYPES
// 4. Thêm Công Trình Thủ Thành Mới: Thêm vào CONSTANTS.DEFENSE
// 5. Thêm Mỏ Tài Nguyên Mới: Thêm vào CONSTANTS.RESOURCE_NODES
// ===================================================================================

const CONSTANTS = {
  TILE_SIZE: 32,
  WORLD_COLS: 100,
  WORLD_ROWS: 80,

  // Biome Boundary Rows
  BIOME_MOUNTAIN_END: 26,  // Rows 0 - 26
  BIOME_PLAINS_END: 60,    // Rows 27 - 60
  BIOME_OCEAN_START: 61,   // Rows 61 - 79

  // Tile IDs
  TILES: {
    // Mountains
    SNOW_PEAK: 1,
    MOUNTAIN_ROCK: 2,
    MOUNTAIN_SLATE: 3,
    ORE_SULFUR: 4,
    ORE_QUARTZ: 5,
    HERB_SNOW_LOTUS: 6,
    HERB_SILVER_MOSS: 7,
    ALIEN_EGG: 8,
    ORE_TITANIUM: 9,

    // Plains
    GRASS: 10,
    GRASS_TALL: 11,
    GRASS_FLOWERS: 12,
    DIRT_PATH: 13,
    RIVER_WATER: 14,
    LAKE_WATER: 15,
    WOODEN_BRIDGE: 16,
    TREE_ALIEN_PINE: 17,
    TREE_POST_APOC: 18,

    // Ocean & Beach
    SAND: 20,
    SAND_WET: 21,
    OCEAN_SHALLOW: 22,
    OCEAN_DEEP: 23,
    TECH_DEBRIS: 24,
    SEA_SHELL: 25,
    PLASMA_NODE: 26
  },

  // World Resource Node Definitions (Data-Driven Visuals, Drops & Minimap Colors)
  RESOURCE_NODES: {
    sulfur_ore: {
      type: 'sulfur_ore',
      tileId: 4,
      groundTile: 2,
      name: 'Quặng Lưu Huỳnh',
      tag: 'Quặng Lưu Huỳnh',
      icon: '🟡',
      sprite: 'obj_sulfur_ore',
      w: 44, h: 44,
      color: '#facc15',
      minimapColor: '#facc15',
      dropItemId: 'sulfur_dust',
      dropCount: 3,
      hp: 20
    },
    quartz_ore: {
      type: 'quartz_ore',
      tileId: 5,
      groundTile: 2,
      name: 'Quặng Thạch Anh',
      tag: 'Tinh Thể Thạch Anh',
      icon: '💎',
      sprite: 'obj_quartz_ore',
      w: 44, h: 44,
      color: '#38bdf8',
      minimapColor: '#38bdf8',
      dropItemId: 'quartz_crystal',
      dropCount: 2,
      hp: 20
    },
    titanium_ore: {
      type: 'titanium_ore',
      tileId: 9,
      groundTile: 2,
      name: 'Quặng Sắt Titan',
      tag: 'Quặng Sắt Titan',
      icon: '🔩',
      sprite: 'obj_titanium_ore',
      w: 44, h: 44,
      color: '#e2e8f0',
      minimapColor: '#f8fafc',
      dropItemId: 'iron_ore',
      dropCount: 2,
      hp: 25
    },
    snow_lotus: {
      type: 'snow_lotus',
      tileId: 6,
      groundTile: 1,
      name: 'Tuyết Liên Núi Cao',
      tag: 'Tuyết Liên Núi Cao',
      icon: '🪷',
      sprite: 'obj_snow_lotus',
      w: 44, h: 44,
      color: '#e879f9',
      minimapColor: '#4ade80',
      dropItemId: 'snow_lotus',
      dropCount: 1,
      hp: 20
    },
    silver_moss: {
      type: 'silver_moss',
      tileId: 7,
      groundTile: 2,
      name: 'Rêu Bạc Đỉnh Núi',
      tag: 'Rêu Bạc Đỉnh Núi',
      icon: '🌿',
      sprite: 'obj_silver_moss',
      w: 44, h: 44,
      color: '#4ade80',
      minimapColor: '#4ade80',
      dropItemId: 'silver_moss',
      dropCount: 2,
      hp: 20
    },
    alien_egg: {
      type: 'alien_egg',
      tileId: 8,
      groundTile: 2,
      name: 'Trứng Quái Vật Ngoài Hành Tinh',
      tag: 'Ổ Trứng Quái Vật ([F] Nhặt Ấp / Đánh)',
      icon: '🥚',
      sprite: 'obj_alien_egg',
      w: 48, h: 48,
      color: '#f43f5e',
      minimapColor: '#e879f9',
      tacticalColor: '#f43f5e',
      dropItemId: 'egg_fluid',
      dropCount: 1,
      hp: 45,
      bonusDrops: [
        { id: 'alien_chitin', count: 1 },
        { id: 'monster_egg', count: 1 }
      ]
    },
    tech_debris: {
      type: 'tech_debris',
      tileId: 24,
      groundTile: 20,
      name: 'Mảnh Vỡ Phi Thuyền',
      tag: 'Mảnh Vỡ Phi Thuyền',
      icon: '🛸',
      sprite: 'obj_tech_debris',
      w: 48, h: 44,
      color: '#fb923c',
      minimapColor: '#facc15',
      tacticalColor: '#fb923c',
      dropItemId: 'tech_scrap',
      dropCount: 2,
      hp: 20
    },
    plasma_node: {
      type: 'plasma_node',
      tileId: 26,
      groundTile: 20,
      name: 'Trụ Năng Lượng Plasma',
      tag: 'Trụ Năng Lượng Plasma',
      icon: '⚡',
      sprite: 'obj_plasma_node',
      w: 44, h: 44,
      color: '#22d3ee',
      minimapColor: '#38bdf8',
      tacticalColor: '#22d3ee',
      dropItemId: 'plasma_core',
      dropCount: 1,
      hp: 30
    }
  },

  // Armor Slots
  ARMOR_SLOTS: {
    HELMET: 'helmet',
    CHESTPLATE: 'chestplate',
    LEGGINGS: 'leggings',
    BOOTS: 'boots',
    GLOVES: 'gloves'
  },

  // Max stack size & slot limit for inventory (99 slots, max 99 items per stack)
  MAX_STACK_SIZE: 99,
  INVENTORY_SLOTS: 99,
  MAX_INVENTORY_SLOTS: 99,

  // Day & Night Configuration
  DAY_DURATION_SEC: 120, // 2 minutes per full day/night cycle
  DAY_RATIO: 0.65,       // 65% daytime, 35% nighttime
  BLOOD_MOON_INTERVAL_DAYS: 15, // Trăng Máu xuất hiện mỗi 15 ngày (Ngày 15, 30, 45...)
  BLOOD_MOON_MULTIPLIER: 10,    // Quái vật đông gấp 10 lần bình thường vào đêm Trăng Máu

  // Player Base Stats
  PLAYER_BASE: {
    MAX_HP: 100,
    MOVE_SPEED: 180, // pixels per second
    BASE_ARMOR: 0,
    BASE_TOXIN_RESIST: 0,
    DASH_COOLDOWN: 3.0, // seconds
    DASH_SPEED: 450,
    DASH_DURATION: 0.22,
    INFECTION_MAX: 100
  },

  // Weapons Definition (Supports Upgrading Lv.1 -> Lv.3)
  WEAPONS: {
    SPEAR: {
      id: 'spear',
      name: 'Giáo Cận Chiến (Spear)',
      type: 'melee',
      color: '#4fc3f7',
      baseDamage: 18,
      attackCooldown: 0.45,
      range: 75,
      description: 'Vũ khí tầm đánh xa, giữ khoảng cách tốt với quái vật.',
      skill1: {
        id: 'spear_sweep',
        name: 'Quét Ngang',
        key: 'Q',
        cooldown: 5.0,
        description: 'Vung giáo 120° phía trước, gây sát thương và hất văng quái vật 130px.'
      },
      skill2: {
        id: 'spear_vault',
        name: 'Chống Sào Nhảy Vọt',
        key: 'E',
        cooldown: 8.0,
        description: 'Cắm giáo bật nhảy qua đầu đám đông 180px, né tránh hoàn toàn vật cản.'
      }
    },
    STAFF: {
      id: 'staff',
      name: 'Gậy Chấn Động (Staff)',
      type: 'melee',
      color: '#ba68c8',
      baseDamage: 14,
      attackCooldown: 0.55,
      range: 55,
      description: 'Vũ khí hệ khống chế diện rộng, gây chấn động và lốc xoáy bảo vệ.',
      skill1: {
        id: 'staff_stun',
        name: 'Chấn Động',
        key: 'Q',
        cooldown: 6.0,
        description: 'Đập mạnh xuống đất phát sóng xung kích làm choáng quái xung quanh 1.5 giây.'
      },
      skill2: {
        id: 'staff_whirlwind',
        name: 'Lốc Xoáy Đẩy Lùi',
        key: 'E',
        cooldown: 7.0,
        description: 'Xoay gậy tạo lốc xoáy hất văng quái ra xa và tăng 30% tốc chạy trong 2 giây.'
      }
    },
    DAGGER: {
      id: 'dagger',
      name: 'Dao Găm Đột Kích (Dagger)',
      type: 'melee',
      color: '#81c784',
      baseDamage: 22,
      attackCooldown: 0.25,
      range: 40,
      description: 'Tốc độ chém chớp nhoáng, chuyên gia tàng hình và luồn lách.',
      skill1: {
        id: 'dagger_smoke',
        name: 'Bom Khói Sinh Học',
        key: 'Q',
        cooldown: 8.0,
        description: 'Tung khói độc mù mịt làm quái mất mục tiêu, tàng hình và đi xuyên vật cản 2s.'
      },
      skill2: {
        id: 'dagger_shadow_dash',
        name: 'Đâm Xuyên Bóng Tối',
        key: 'E',
        cooldown: 6.0,
        description: 'Lướt xuyên qua người bầy quái vật và làm chậm chúng 50% trong 3 giây.'
      }
    },
    BOW: {
      id: 'bow',
      name: 'Cung Thợ Săn (Bow)',
      type: 'ranged',
      color: '#ffb74d',
      baseDamage: 16,
      attackCooldown: 0.55,
      range: 280,
      description: 'Vũ khí tầm xa linh hoạt, bắn tên trói chân và giật lùi để giữ cự ly.',
      skill1: {
        id: 'bow_net',
        name: 'Tên Lưới Năng Lượng',
        key: 'Q',
        cooldown: 7.0,
        description: 'Bắn tấm lưới trói chân (Root) một cụm quái vật tại chỗ trong 2.5 giây.'
      },
      skill2: {
        id: 'bow_recoil',
        name: 'Bắn Giật Lùi',
        key: 'E',
        cooldown: 6.0,
        description: 'Bắn đạn xung lực đẩy lùi bản thân về sau 110px và làm chậm kẻ địch trúng đạn.'
      }
    },
    GUN: {
      id: 'gun',
      name: 'Súng Trường Plasma (Plasma Rifle)',
      type: 'ranged',
      color: '#38bdf8',
      baseDamage: 20,
      attackCooldown: 0.24,
      range: 340,
      description: 'Súng trường năng lượng ngoại lai bắn liên thanh tốc độ cao, có thể nâng cấp lên Cấp 3.',
      skill1: {
        id: 'gun_emp',
        name: 'Pháo Điện Từ EMP',
        key: 'Q',
        cooldown: 6.5,
        description: 'Bắn cầu năng lượng EMP nổ diện rộng 95px, gây sát thương lớn và làm choáng quái 1.8 giây.'
      },
      skill2: {
        id: 'gun_barrage',
        name: 'Xả Đạn Hủy Diệt',
        key: 'E',
        cooldown: 5.5,
        description: 'Xả loạt 5 tia đạn plasma hình quạt cực mạnh đồng thời giật lùi bản thân về sau 85px.'
      }
    }
  },

  // Weapon Upgrade Tiers (Lv.1 -> Lv.3)
  WEAPON_TIERS: {
    1: { level: 1, title: 'Cấp 1 (Cơ Bản)', dmgMult: 1.0, cdMult: 1.0, rangeMult: 1.0, color: '#94a3b8' },
    2: {
      level: 2,
      title: 'Cấp 2 (Tinh Chế Titan)',
      dmgMult: 1.38,
      cdMult: 0.85,
      rangeMult: 1.15,
      color: '#38bdf8',
      cost: [
        { id: 'titanium_alloy', count: 2, name: 'Hợp Kim Titan' },
        { id: 'tech_scrap', count: 2, name: 'Mảnh Vỡ Công Nghệ' },
        { id: 'quartz_crystal', count: 1, name: 'Tinh Thể Thạch Anh' }
      ]
    },
    3: {
      level: 3,
      title: 'Cấp 3 (Siêu Nạp Plasma)',
      dmgMult: 1.85,
      cdMult: 0.72,
      rangeMult: 1.28,
      color: '#facc15',
      cost: [
        { id: 'titanium_alloy', count: 3, name: 'Hợp Kim Titan' },
        { id: 'plasma_core', count: 2, name: 'Lõi Năng Lượng Plasma' },
        { id: 'alien_chitin', count: 2, name: 'Giáp Xác Ngoại Lai' }
      ]
    }
  },

  // Declarative Projectile Registry (Easy to add new projectile types!)
  PROJECTILE_TYPES: {
    arrow: {
      id: 'arrow',
      targetGroup: 'monster',
      radius: 6,
      renderStyle: 'arrow',
      color: '#ffb74d',
      secondaryColor: '#38bdf8',
      sparkCount: 4
    },
    plasma_bullet: {
      id: 'plasma_bullet',
      targetGroup: 'monster',
      radius: 6,
      renderStyle: 'plasma',
      color: '#38bdf8',
      secondaryColor: '#ffffff',
      sparkCount: 4
    },
    turret_railgun: {
      id: 'turret_railgun',
      targetGroup: 'monster',
      radius: 7,
      renderStyle: 'railgun',
      color: '#facc15',
      secondaryColor: '#38bdf8',
      slowFactor: 0.6,
      slowDuration: 2.0,
      ringRadius: 24,
      ringColor: '#facc15',
      chainCount: 2,
      chainRange: 95,
      chainDamageMult: 0.55,
      chainColor: '#38bdf8'
    },
    emp_blast: {
      id: 'emp_blast',
      targetGroup: 'monster',
      radius: 9,
      renderStyle: 'emp_orb',
      color: '#38bdf8',
      secondaryColor: '#facc15',
      aoeRadius: 95,
      stunDuration: 1.8,
      soundOnImpact: 'playStaffStun',
      impactText: '⚡ XUNG ĐIỆN EMP! ⚡',
      impactTextColor: '#38bdf8'
    },
    net_arrow: {
      id: 'net_arrow',
      targetGroup: 'monster',
      radius: 6,
      renderStyle: 'net',
      color: '#06b6d4',
      secondaryColor: '#ffffff',
      aoeRadius: 90,
      rootDuration: 2.5,
      soundOnImpact: 'playBowNet',
      impactText: 'NET EXPAND!',
      impactTextColor: '#38bdf8'
    },
    recoil_blast: {
      id: 'recoil_blast',
      targetGroup: 'monster',
      radius: 7,
      renderStyle: 'fire_orb',
      color: '#ef4444',
      secondaryColor: '#fde047',
      aoeRadius: 80,
      slowFactor: 0.4,
      slowDuration: 3.0,
      knockbackForce: 160
    },
    acid_spit: {
      id: 'acid_spit',
      targetGroup: 'player',
      radius: 6,
      renderStyle: 'acid_orb',
      color: '#84cc16',
      secondaryColor: '#bef264',
      slowFactor: 0.72,
      slowDuration: 1.8,
      slowSourceText: 'AXIT LÀM CHẬM',
      infectionAmount: 10,
      infectionSourceText: 'AXIT ĂN MÒN',
      sparkCount: 6
    },
    frost_spit: {
      id: 'frost_spit',
      targetGroup: 'player',
      radius: 6,
      renderStyle: 'frost_shard',
      color: '#06b6d4',
      secondaryColor: '#e0f2fe',
      slowFactor: 0.50,
      slowDuration: 3.0,
      slowSourceText: 'TƠ BĂNG HÀN',
      infectionAmount: 6,
      infectionSourceText: 'TƠ BĂNG HÀN',
      ringRadius: 22,
      ringColor: '#38bdf8',
      sparkCount: 7
    },
    pet_arrow: {
      id: 'pet_arrow',
      targetGroup: 'monster',
      radius: 6,
      renderStyle: 'arrow',
      color: '#ffb74d',
      secondaryColor: '#38bdf8',
      slowFactor: 0.7,
      slowDuration: 1.5,
      sparkCount: 4
    },
    pet_bio_shot: {
      id: 'pet_bio_shot',
      targetGroup: 'monster',
      radius: 6,
      renderStyle: 'bio_orb',
      color: '#4ade80',
      secondaryColor: '#ffffff',
      healPlayer: 2,
      ringRadius: 14,
      ringColor: '#4ade80'
    },
    pet_cleanse_shot: {
      id: 'pet_cleanse_shot',
      targetGroup: 'monster',
      radius: 6,
      renderStyle: 'bio_orb',
      color: '#c084fc',
      secondaryColor: '#ffffff',
      slowFactor: 0.7,
      slowDuration: 2.0,
      cleansePlayer: 1.5,
      ringRadius: 14,
      ringColor: '#c084fc'
    },
    pet_frost_bolt: {
      id: 'pet_frost_bolt',
      targetGroup: 'monster',
      radius: 6,
      renderStyle: 'frost_bolt',
      color: '#38bdf8',
      secondaryColor: '#e0f2fe',
      slowFactor: 0.45,
      slowDuration: 2.5,
      stunChance: 0.35,
      stunDuration: 1.2,
      ringRadius: 18,
      ringColor: '#38bdf8'
    },
    pet_plasma_bolt: {
      id: 'pet_plasma_bolt',
      targetGroup: 'monster',
      radius: 6,
      renderStyle: 'pet_plasma',
      color: '#facc15',
      secondaryColor: '#38bdf8',
      ringRadius: 18,
      ringColor: '#facc15',
      chainCount: 2,
      chainRange: 85,
      chainDamageMult: 0.5,
      chainColor: '#38bdf8'
    }
  },

  // Item Registry (Data-Driven with Declarative useEffect, craftStation, actionLabel & isJunk)
  ITEM_TYPES: {
    // Weapons
    spear: { name: 'Giáo Cận Chiến', category: 'weapon', weaponKey: 'SPEAR', icon: 'spear', maxStack: 1, actionLabel: 'CẦM', desc: 'Vũ khí cán dài có khả năng quét ngang và nhảy vọt.' },
    staff: { name: 'Gậy Chấn Động', category: 'weapon', weaponKey: 'STAFF', icon: 'staff', maxStack: 1, actionLabel: 'CẦM', desc: 'Gậy phát ra sóng xung kích làm choáng và đẩy lùi.' },
    dagger: { name: 'Dao Găm Đột Kích', category: 'weapon', weaponKey: 'DAGGER', icon: 'dagger', maxStack: 1, actionLabel: 'CẦM', desc: 'Dao găm siêu bén, hỗ trợ bom khói tàng hình.' },
    bow: { name: 'Cung Thợ Săn', category: 'weapon', weaponKey: 'BOW', icon: 'bow', maxStack: 1, actionLabel: 'CẦM', desc: 'Cung bắn tên lưới trói chân và đạn giật lùi.' },
    plasma_gun: { name: 'Súng Trường Plasma', category: 'weapon', weaponKey: 'GUN', icon: 'gun', maxStack: 1, actionLabel: 'CẦM', desc: 'Súng năng lượng bắn liên thanh tốc độ cao [Phím G / Số 5].' },

    // Armors
    mask_gas: {
      name: 'Mũ Lọc Khí Sinh Học', category: 'armor', slot: 'helmet', icon: 'helmet', maxStack: 1, actionLabel: 'MẶC',
      stats: { hp: 15, armor: 2, toxinResist: 15 },
      desc: 'Mũ phòng độc chuyên dụng giúp giảm độc tố từ khí ô nhiễm môi trường.'
    },
    vest_survival: {
      name: 'Áo Giáp Dã Chiến', category: 'armor', slot: 'chestplate', icon: 'chestplate', maxStack: 1, actionLabel: 'MẶC',
      stats: { hp: 35, armor: 6, toxinResist: 5 },
      desc: 'Áo giáp gia cố sợi Kevlar và vảy sinh vật ngoài hành tinh.'
    },
    vest_titanium: {
      name: 'Giáp Chiến Đấu Titan-Plasma', category: 'armor', slot: 'chestplate', icon: 'chestplate', maxStack: 1, actionLabel: 'MẶC',
      stats: { hp: 75, armor: 12, toxinResist: 20, speedBonus: 15 },
      desc: 'Giáp cơ giới hạng nặng đúc từ Hợp Kim Titan và Giáp Xác Ngoại Lai (+75 HP, +12 Giáp, +20% Kháng Độc).'
    },
    pants_hazard: {
      name: 'Quần Chống Độc', category: 'armor', slot: 'leggings', icon: 'leggings', maxStack: 1, actionLabel: 'MẶC',
      stats: { hp: 20, armor: 4, toxinResist: 10 },
      desc: 'Quần vải sợi tổng hợp cách ly với gai độc và đầm lầy.'
    },
    boots_scout: {
      name: 'Giày Thám Hiểm', category: 'armor', slot: 'boots', icon: 'boots', maxStack: 1, actionLabel: 'MẶC',
      stats: { hp: 10, speedBonus: 35, toxinResist: 5 },
      desc: 'Đế giày trợ lực giúp di chuyển nhanh nhẹn trên mọi địa hình.'
    },
    gloves_miner: {
      name: 'Găng Tay Khai Khoáng', category: 'armor', slot: 'gloves', icon: 'gloves', maxStack: 1, actionLabel: 'MẶC',
      stats: { hp: 10, armor: 2, toxinResist: 5 },
      desc: 'Bảo vệ đôi bàn tay khi hái thảo dược núi cao và đập vỡ trứng quái.'
    },

    // Resources & Usable Herbs
    snow_lotus: {
      id: 'snow_lotus', name: 'Tuyết Liên Núi Cao', category: 'resource', icon: 'lotus', maxStack: 99, actionLabel: 'DÙNG',
      usableInFilter: true,
      useEffect: { heal: 12, cleanse: 12, message: '🪷 ĐÃ DÙNG TUYẾT LIÊN TƯƠI: +12 HP & -12% ĐỘC TỐ!', color: '#e879f9' },
      desc: 'Thảo dược núi tuyết: Dùng trực tiếp (+12 HP, -12% Độc Tố) hoặc chế Huyết Thanh.'
    },
    sulfur_dust: {
      id: 'sulfur_dust', name: 'Bột Lưu Huỳnh', category: 'resource', icon: 'sulfur', maxStack: 99, actionLabel: 'CHẾ', craftStation: 'lab',
      desc: 'Chất khử trùng mạnh: Click để mở Phòng Lab chế Huyết Thanh hoặc nâng cấp Súng Cối.'
    },
    quartz_crystal: {
      id: 'quartz_crystal', name: 'Tinh Thể Thạch Anh', category: 'resource', icon: 'quartz', maxStack: 99, actionLabel: 'CHẾ', craftStation: 'lab',
      desc: 'Khoáng sản tinh khiết: Dùng chế Kháng Thể, Lõi Plasma hoặc nâng cấp Súng Tháp Canh.'
    },
    silver_moss: {
      id: 'silver_moss', name: 'Rêu Bạc Đỉnh Núi', category: 'resource', icon: 'moss', maxStack: 99, actionLabel: 'DÙNG',
      usableInFilter: true,
      useEffect: { heal: 15, cleanse: 8, message: '🌿 ĐÃ DÙNG RÊU BẠC ĐỈNH NÚI: +15 HP & -8% ĐỘC TỐ!', color: '#4ade80' },
      desc: 'Rêu bạc núi cao: Dùng trực tiếp (+15 HP, -8% Độc Tố) hoặc chế Kháng Thể Tinh Khiết.'
    },
    egg_fluid: {
      id: 'egg_fluid', name: 'Dịch Tuyến Trứng Ngoại Lai', category: 'resource', icon: 'egg_fluid', maxStack: 99, actionLabel: 'DÙNG',
      usableInFilter: true,
      useEffect: {
        heal: 20,
        speedBoost: { mult: 1.3, duration: 8.0 },
        addInfection: 15,
        infectionSource: 'DỊCH TRỨNG NGOẠI LAI',
        message: '🧪 ĐÃ HẤP THỤ DỊCH TUYẾN TRỨNG: +20 HP, +30% TỐC CHẠY (8s), +15% ĐỘC TỐ!',
        color: '#c084fc'
      },
      desc: 'Dịch trứng quái: Dùng trực tiếp (+20 HP, +30% Tốc chạy 8s, +15% Độc) hoặc chế Lõi Plasma.'
    },
    pure_water: {
      id: 'pure_water', name: 'Nước Tinh Khiết', category: 'consumable', icon: 'pure_water', maxStack: 99, actionLabel: 'DÙNG',
      useEffect: { heal: 15, cleanse: 15, message: '💧 ĐÃ UỐNG NƯỚC TINH KHIẾT: +15 HP & -15% ĐỘC TỐ!', color: '#38bdf8' },
      desc: 'Nước ngọt đã qua đun sôi lọc sạch: +15 HP, -15% Độc Tố.'
    },
    dirty_water: {
      id: 'dirty_water', name: 'Nước Ao Sông Ô Nhiễm', category: 'consumable', icon: 'dirty_water', maxStack: 99, actionLabel: 'DÙNG',
      isJunk: true,
      useEffect: { heal: 5, addInfection: 20, infectionSource: 'NƯỚC Ô NHIỄM', message: '☣ ĐÃ UỐNG NƯỚC Ô NHIỄM: +5 HP NHƯNG TĂNG +20% ĐỘC TỐ!', color: '#facc15', showFloat: false },
      desc: 'Nước chưa qua lọc: +5 HP nhưng làm tăng +20% Độc Tố!'
    },
    wood: {
      id: 'wood', name: 'Gỗ Cây Biến Dị', category: 'resource', icon: 'wood', maxStack: 99, actionLabel: 'CHẾ', craftStation: 'workbench',
      desc: 'Vật liệu cơ bản: Click để mở Bàn Chế Tạo / Lò Nung gia công vật phẩm.'
    },
    stone: {
      id: 'stone', name: 'Đá Núi Cứng', category: 'resource', icon: 'stone', maxStack: 99, actionLabel: 'CHẾ', craftStation: 'workbench',
      desc: 'Vật liệu xây dựng: Click để mở Bàn Chế Tạo / Lò Nung đúc tường và nung quặng.'
    },
    tech_scrap: {
      id: 'tech_scrap', name: 'Mảnh Vỡ Công Nghệ', category: 'resource', icon: 'tech_scrap', maxStack: 99, actionLabel: 'CHẾ', craftStation: 'workshop',
      desc: 'Linh kiện vi mạch: Click để mở Xưởng Thủ Thành lắp và nâng cấp Tháp Canh, Súng Cối.'
    },

    // Upgrade Materials
    iron_ore: {
      id: 'iron_ore', name: 'Quặng Sắt Titan', category: 'resource', icon: 'iron_ore', maxStack: 99, actionLabel: 'CHẾ', craftStation: 'furnace',
      desc: 'Quặng kim loại nặng khai thác trên Núi Đá: Nung tại Lò Nung để tạo Hợp Kim Titan.'
    },
    titanium_alloy: {
      id: 'titanium_alloy', name: 'Hợp Kim Titan', category: 'resource', icon: 'titanium_alloy', maxStack: 99, actionLabel: 'NÂNG', craftStation: 'workshop',
      desc: 'Vật liệu siêu bền dùng để NÂNG CẤP Tường Chắn, Súng Tháp Canh, Súng Cối và Vũ Khí!'
    },
    alien_chitin: {
      id: 'alien_chitin', name: 'Giáp Xác Ngoại Lai', category: 'resource', icon: 'alien_chitin', maxStack: 99, actionLabel: 'CHẾ', craftStation: 'workbench',
      desc: 'Vỏ giáp cứng thu được khi tiêu diệt Quái Vật: Dùng nâng cấp Tường Chắn, Giáp và Vũ Khí.'
    },
    plasma_core: {
      id: 'plasma_core', name: 'Lõi Năng Lượng Plasma', category: 'resource', icon: 'plasma_core', maxStack: 99, actionLabel: 'NÂNG', craftStation: 'workshop',
      desc: 'Lõi năng lượng cao cấp (thu ở Bờ Biển hoặc chế tại Lab/Xưởng): Nâng cấp Tường & Súng lên Cấp 3!'
    },

    // Wild Flora & Mutant Harvests
    wild_berry: {
      name: 'Quả Mọng Tự Nhiên Sạch', category: 'consumable', icon: 'berry_clean', maxStack: 99, actionLabel: 'DÙNG',
      useEffect: { heal: 18, message: '🍓 ĐÃ ĂN QUẢ MỌNG SẠCH: +18 HP!', color: '#22c55e' },
      desc: 'Quả rừng thu hoạch trong ngày còn tươi sạch: +18 HP, 0% Độc Tố.'
    },
    blighted_berry: {
      name: 'Quả Mọng Đột Biến Nhiễm Khuẩn', category: 'consumable', icon: 'berry_blighted', maxStack: 99, actionLabel: 'DÙNG',
      isJunk: true,
      useEffect: { heal: 5, addInfection: 35, infectionSource: 'QUẢ ĐỘT BIẾN NHIỄM ĐỘC', sound: 'hit', message: '☣ ĐÃ ĂN QUẢ ĐỘT BIẾN: +5 HP NHƯNG NHIỄM +35% ĐỘC TỐ!', color: '#ef4444', showFloat: false },
      desc: 'Quả rừng bị qua đêm ngoài tự nhiên đã nhiễm độc: +5 HP nhưng TĂNG MẠNH +35% ĐỘC TỐ!'
    },
    blighted_herb: {
      name: 'Thảo Dược Bị Thối Rữa', category: 'resource', icon: 'blighted_herb', maxStack: 99, actionLabel: 'HỦY',
      isJunk: true,
      useEffect: { deleteSelf: true },
      desc: 'Cây cỏ ngoài tự nhiên qua đêm bị khí độc phá hủy, không thể chế thuốc.'
    },

    // Antidotes (Thuốc Giải Ký Sinh)
    antidote_lesser: {
      name: 'Huyết Thanh Sơ Cấp', category: 'consumable', icon: 'antidote_lesser', maxStack: 99, actionLabel: 'DÙNG',
      useEffect: { heal: 10, cleanse: 25, message: '💉 ĐÃ DÙNG HUYẾT THANH SƠ CẤP: -25% ĐỘC TỐ & +10 HP!', color: '#22c55e' },
      desc: 'Huyết thanh giải độc cơ bản chế từ Tuyết Liên, Lưu Huỳnh và Nước sạch: GIẢM NGAY 25% ĐỘC TỐ.'
    },
    antidote_pure: {
      name: 'Thuốc Kháng Thể Tinh Khiết', category: 'consumable', icon: 'antidote_pure', maxStack: 99, actionLabel: 'DÙNG',
      useEffect: { heal: 25, cleanse: 60, immunityDuration: 120, message: '★ ĐÃ DÙNG KHÁNG THỂ TINH KHIẾT: -60% ĐỘC, +25 HP & MIỄN NHIỄM 1 NGÀY! ★', color: '#38bdf8' },
      desc: 'Kháng thể tinh chế đặc biệt: GIẢM NGAY 60% ĐỘC TỐ + MIỄN NHIỄM ĐỘC TỐ TRONG 1 NGÀY!'
    },

    // Seeds for Bio-Lab Hydroponics & Expanded Greenhouse
    seed_snow_lotus: { name: 'Mầm Cấy Tuyết Liên', category: 'seed', targetCrop: 'snow_lotus', icon: 'seed_lotus', maxStack: 99, actionLabel: 'CẤY', desc: 'Mô tế bào dùng cấy nuôi trong Phòng Lab cách ly, thu hoạch Tuyết Liên sạch 100% (+12 HP, -12% Độc).' },
    seed_silver_moss: { name: 'Bào Tử Rêu Bạc', category: 'seed', targetCrop: 'silver_moss', icon: 'seed_moss', maxStack: 99, actionLabel: 'CẤY', desc: 'Bào tử rêu sạch dùng nhân giống trong lồng sinh học Phòng Lab (+15 HP, -8% Độc).' },
    seed_wild_berry: { name: 'Hạt Giống Quả Mọng Ngọt', category: 'seed', targetCrop: 'wild_berry', icon: 'seed_berry', maxStack: 99, actionLabel: 'CẤY', desc: 'Hạt giống quả mọng tinh tuyển trồng trong Phòng Lab, thu hoạch Quả Mọng Sạch (+18 HP, 0% Độc) không bao giờ nhiễm độc!' },
    seed_quartz_bloom: { name: 'Mầm Thảo Dược Tinh Thể', category: 'seed', targetCrop: 'quartz_crystal', icon: 'seed_quartz', maxStack: 99, actionLabel: 'CẤY', desc: 'Mầm sinh khoáng lai tạo trong Phòng Lab, thu hoạch Tinh Thể Thạch Anh dùng chế Kháng Thể & Lõi Plasma!' },

    // Defensive Structures & Upgrades
    defense_wall: { name: 'Tường Chắn Phòng Thủ', category: 'defense', structType: 'wall', icon: 'defense_wall', maxStack: 99, actionLabel: 'XÂY', desc: 'Tường bê tông gia cố (250-1000 HP), chặn đường quái, có thể nâng cấp lên Cấp 3!' },
    defense_trap: { name: 'Bẫy Gai Sinh Học', category: 'defense', structType: 'trap', icon: 'defense_trap', maxStack: 99, actionLabel: 'XÂY', desc: 'Đặt dưới đất làm chậm và gây sát thương, có thể nâng cấp lên Bẫy Xung Điện Cấp 3!' },
    defense_turret: { name: 'Tháp Canh Tự Động', category: 'defense', structType: 'turret', icon: 'defense_turret', maxStack: 99, actionLabel: 'XÂY', desc: 'Súng tháp tự động bắn tỉa 360°, nâng cấp lên Gatling Laser (Cấp 2) & Pháo Railgun Tesla (Cấp 3)!' },
    defense_mortar: { name: 'Súng Cối Hạng Nặng', category: 'defense', structType: 'mortar', icon: 'defense_mortar', maxStack: 99, actionLabel: 'XÂY', desc: 'Pháo cối tầm xa nổ AoE diện rộng, nâng cấp lên Pháo Nhiệt Hạch (Cấp 2) & Siêu Pháo Hạt Nhân (Cấp 3)!' },
    backpack_upgraded: { name: 'Balo Nâng Cấp Dã Chiến', category: 'upgrade', icon: 'backpack', maxStack: 1, actionLabel: 'NÂNG', desc: 'Mở rộng sức chứa kho đồ sinh tồn lên tối đa 99 ô chứa (Max Stack 99)!' },

    // Monster Egg for Bio-Lab Pet Incubation
    monster_egg: {
      name: 'Trứng Quái Vật Nguyên Vẹn',
      category: 'egg',
      icon: 'monster_egg',
      maxStack: 99,
      actionLabel: 'ẤP LAB',
      desc: 'Trứng quái vật nhặt từ ổ trứng trên núi hoặc rơi từ quái. CHỈ ẤP ĐƯỢC TRONG PHÒNG LAB để nở ra Pet ngẫu nhiên (Tối đa mang theo 1 Pet)!'
    }
  },

  // Crafting Recipes for Bio-Lab, Furnace, Workbench & Workshop
  RECIPES: {
    // Bio-Lab Recipes
    LAB: [
      {
        id: 'antidote_lesser',
        name: 'Huyết Thanh Sơ Cấp (-25% Độc tố)',
        desc: 'Công thức: 1x Tuyết Liên + 1x Bột Lưu Huỳnh + 1x Nước Tinh Khiết. Giảm ngay 25% Độc tố.',
        inputs: [
          { id: 'snow_lotus', count: 1, name: 'Tuyết Liên Núi Cao' },
          { id: 'sulfur_dust', count: 1, name: 'Bột Lưu Huỳnh' },
          { id: 'pure_water', count: 1, name: 'Nước Tinh Khiết' }
        ],
        output: { id: 'antidote_lesser', count: 1 }
      },
      {
        id: 'antidote_pure',
        name: 'Thuốc Kháng Thể Tinh Khiết (-60% + Miễn nhiễm)',
        desc: 'Công thức: 2x Rêu Bạc + 1x Thạch Anh + 1x Dịch Tuyến Trứng. Giảm 60% Độc tố + Miễn nhiễm 1 ngày.',
        inputs: [
          { id: 'silver_moss', count: 2, name: 'Rêu Bạc Đỉnh Núi' },
          { id: 'quartz_crystal', count: 1, name: 'Tinh Thể Thạch Anh' },
          { id: 'egg_fluid', count: 1, name: 'Dịch Tuyến Trứng Ngoại Lai' }
        ],
        output: { id: 'antidote_pure', count: 1 }
      },
      {
        id: 'craft_plasma_core_lab',
        name: 'Tổng Hợp Lõi Năng Lượng Plasma (x1 Lõi)',
        desc: 'Công thức: 1x Tinh Thể Thạch Anh + 1x Dịch Tuyến Trứng + 1x Bột Lưu Huỳnh. Nguyên liệu nâng cấp Tường & Súng Cấp 3!',
        inputs: [
          { id: 'quartz_crystal', count: 1, name: 'Tinh Thể Thạch Anh' },
          { id: 'egg_fluid', count: 1, name: 'Dịch Tuyến Trứng Ngoại Lai' },
          { id: 'sulfur_dust', count: 1, name: 'Bột Lưu Huỳnh' }
        ],
        output: { id: 'plasma_core', count: 1 }
      },
      {
        id: 'extract_monster_egg_lab',
        name: '🧪 Chiết Xuất Trứng Quái Vật Dư (Nghiền Trực Tiếp)',
        desc: 'Tách chiết trực tiếp 1 Trứng Quái Vật dư (không cần chờ ấp) nhận ngay: +2 Dịch Tuyến Trứng + 2 Giáp Xác Ngoại Lai + 1 Lõi Năng Lượng Plasma!',
        inputs: [
          { id: 'monster_egg', count: 1, name: 'Trứng Quái Vật Nguyên Vẹn' }
        ],
        output: { id: 'egg_fluid', count: 2 },
        outputs: [
          { id: 'egg_fluid', count: 2 },
          { id: 'alien_chitin', count: 2 },
          { id: 'plasma_core', count: 1 }
        ]
      },
      {
        id: 'seed_snow_lotus',
        name: 'Nhân Mầm Cấy Tuyết Liên (x2 Mầm)',
        desc: 'Nhân giống 1 bông Tuyết Liên thành 2 Mầm Cấy để nuôi trong lồng kính Phòng Lab.',
        inputs: [
          { id: 'snow_lotus', count: 1, name: 'Tuyết Liên Núi Cao' },
          { id: 'pure_water', count: 1, name: 'Nước Tinh Khiết' }
        ],
        output: { id: 'seed_snow_lotus', count: 2 }
      },
      {
        id: 'seed_silver_moss',
        name: 'Nhân Bào Tử Rêu Bạc (x2 Bào Tử)',
        desc: 'Nhân giống 1 nhánh Rêu Bạc thành 2 Bào Tử nuôi cấy sạch.',
        inputs: [
          { id: 'silver_moss', count: 1, name: 'Rêu Bạc Đỉnh Núi' },
          { id: 'pure_water', count: 1, name: 'Nước Tinh Khiết' }
        ],
        output: { id: 'seed_silver_moss', count: 2 }
      },
      {
        id: 'seed_wild_berry',
        name: 'Nhân Hạt Giống Quả Mọng Ngọt (x2 Hạt)',
        desc: 'Tách chiết 1 Quả Mọng Sạch thành 2 Hạt Giống để trồng đại trà trong Nhà Kính Phòng Lab.',
        inputs: [
          { id: 'wild_berry', count: 1, name: 'Quả Mọng Tự Nhiên Sạch' },
          { id: 'pure_water', count: 1, name: 'Nước Tinh Khiết' }
        ],
        output: { id: 'seed_wild_berry', count: 2 }
      },
      {
        id: 'seed_quartz_bloom',
        name: 'Lai Tạo Mầm Thảo Dược Tinh Thể (x2 Mầm)',
        desc: 'Cấy ghép Tinh Thể Thạch Anh với Nước Tinh Khiết tạo 2 Mầm Thảo Dược Tinh Thể thu hoạch Thạch Anh.',
        inputs: [
          { id: 'quartz_crystal', count: 1, name: 'Tinh Thể Thạch Anh' },
          { id: 'pure_water', count: 1, name: 'Nước Tinh Khiết' }
        ],
        output: { id: 'seed_quartz_bloom', count: 2 }
      }
    ],

    // Furnace Recipes (Lò Nung)
    FURNACE: [
      {
        id: 'furnace_water',
        name: 'Đun Sôi Nước Tinh Khiết',
        desc: 'Khử trùng nước ao sông ô nhiễm thành nước sạch uống an toàn (-15% Độc tố).',
        inputs: [
          { id: 'dirty_water', count: 1, name: 'Nước Ao Sông Ô Nhiễm' },
          { id: 'wood', count: 1, name: 'Gỗ Cây Biến Dị' }
        ],
        output: { id: 'pure_water', count: 1 }
      },
      {
        id: 'furnace_titanium',
        name: 'Nung Luyện Hợp Kim Titan (x2 Hợp Kim)',
        desc: 'Nung chảy Quặng Sắt Titan cùng Đá Núi và Gỗ ở nhiệt độ cao để đúc 2 thanh Hợp Kim Titan nâng cấp Tường & Súng.',
        inputs: [
          { id: 'iron_ore', count: 2, name: 'Quặng Sắt Titan' },
          { id: 'stone', count: 1, name: 'Đá Núi Cứng' },
          { id: 'wood', count: 1, name: 'Gỗ Cây Biến Dị' }
        ],
        output: { id: 'titanium_alloy', count: 2 }
      },
      {
        id: 'furnace_titanium_scrap',
        name: 'Tái Chế Hợp Kim Titan Từ Phế Liệu',
        desc: 'Nung chảy Mảnh Vỡ Công Nghệ và Đá Núi để thu hồi 1 thanh Hợp Kim Titan.',
        inputs: [
          { id: 'tech_scrap', count: 1, name: 'Mảnh Vỡ Công Nghệ' },
          { id: 'stone', count: 2, name: 'Đá Núi Cứng' }
        ],
        output: { id: 'titanium_alloy', count: 1 }
      },
      {
        id: 'furnace_sulfur',
        name: 'Nung Quặng Bột Lưu Huỳnh',
        desc: 'Nung quặng núi đá và gỗ để tạo 2 Bột Lưu Huỳnh khử trùng thuốc giải và đạn pháo.',
        inputs: [
          { id: 'stone', count: 2, name: 'Đá Núi Cứng' },
          { id: 'wood', count: 1, name: 'Gỗ Cây Biến Dị' }
        ],
        output: { id: 'sulfur_dust', count: 2 }
      }
    ],

    // Workbench Recipes (Bàn chế tạo cơ bản & Nâng cấp)
    WORKBENCH: [
      {
        id: 'craft_wall_pack',
        name: 'Gia Công Tường Chắn (x4 Cái)',
        desc: 'Công thức: 4x Gỗ + 2x Đá Núi. Tạo 4 khối tường bê tông gia cố chịu lực (có thể nâng cấp lên Cấp 3).',
        inputs: [
          { id: 'wood', count: 4, name: 'Gỗ Cây Biến Dị' },
          { id: 'stone', count: 2, name: 'Đá Núi Cứng' }
        ],
        output: { id: 'defense_wall', count: 4 }
      },
      {
        id: 'craft_titanium_chitin',
        name: 'Ép Hợp Kim Sinh Cơ (x2 Hợp Kim Titan)',
        desc: 'Kết hợp Giáp Xác Ngoại Lai từ quái vật và Đá Núi để tạo 2 Hợp Kim Titan siêu cứng.',
        inputs: [
          { id: 'alien_chitin', count: 2, name: 'Giáp Xác Ngoại Lai' },
          { id: 'stone', count: 2, name: 'Đá Núi Cứng' }
        ],
        output: { id: 'titanium_alloy', count: 2 }
      },
      {
        id: 'craft_backpack',
        name: 'May Balo Nâng Cấp (+4 Ô Đồ)',
        desc: 'Công thức: 5x Gỗ + 2x Mảnh Vỡ Công Nghệ. Mở rộng thêm 4 ô kho đồ (tối đa 28 ô)!',
        inputs: [
          { id: 'wood', count: 5, name: 'Gỗ Cây Biến Dị' },
          { id: 'tech_scrap', count: 2, name: 'Mảnh Vỡ Công Nghệ' }
        ],
        output: { id: 'backpack_upgraded', count: 1 }
      },
      {
        id: 'craft_vest_titanium',
        name: 'Chế Tạo Giáp Chiến Đấu Titan-Plasma',
        desc: 'Công thức: 3x Hợp Kim Titan + 3x Giáp Xác Ngoại Lai + 1x Lõi Plasma. Tăng +75 HP, +12 Giáp, +20% Kháng Độc!',
        inputs: [
          { id: 'titanium_alloy', count: 3, name: 'Hợp Kim Titan' },
          { id: 'alien_chitin', count: 3, name: 'Giáp Xác Ngoại Lai' },
          { id: 'plasma_core', count: 1, name: 'Lõi Năng Lượng Plasma' }
        ],
        output: { id: 'vest_titanium', count: 1 }
      }
    ],

    // Workshop Recipes (Xưởng cơ khí chế tạo Thủ Thành & Súng)
    WORKSHOP: [
      {
        id: 'craft_trap_pack',
        name: 'Đúc Bẫy Gai Sinh Học (x3 Cái)',
        desc: 'Công thức: 3x Gỗ + 2x Đá + 1x Dịch Tuyến Trứng. Bẫy gai độc làm chậm 50% và gây sát thương (Nâng cấp được lên Cấp 3).',
        inputs: [
          { id: 'wood', count: 3, name: 'Gỗ Cây Biến Dị' },
          { id: 'stone', count: 2, name: 'Đá Núi Cứng' },
          { id: 'egg_fluid', count: 1, name: 'Dịch Tuyến Trứng Ngoại Lai' }
        ],
        output: { id: 'defense_trap', count: 3 }
      },
      {
        id: 'craft_turret',
        name: 'Lắp Ráp Súng Tháp Canh Tự Động',
        desc: 'Công thức: 4x Đá + 3x Mảnh Vỡ Công Nghệ + 1x Tinh Thể Thạch Anh. Tháp súng plasma bắn tỉa (Nâng cấp được lên Cấp 3).',
        inputs: [
          { id: 'stone', count: 4, name: 'Đá Núi Cứng' },
          { id: 'tech_scrap', count: 3, name: 'Mảnh Vỡ Công Nghệ' },
          { id: 'quartz_crystal', count: 1, name: 'Tinh Thể Thạch Anh' }
        ],
        output: { id: 'defense_turret', count: 1 }
      },
      {
        id: 'craft_mortar',
        name: 'Đúc Súng Cối Hạng Nặng',
        desc: 'Công thức: 6x Đá + 4x Mảnh Vỡ Công Nghệ + 2x Bột Lưu Huỳnh. Pháo nổ tầm xa diện rộng (Nâng cấp được lên Cấp 3)!',
        inputs: [
          { id: 'stone', count: 6, name: 'Đá Núi Cứng' },
          { id: 'tech_scrap', count: 4, name: 'Mảnh Vỡ Công Nghệ' },
          { id: 'sulfur_dust', count: 2, name: 'Bột Lưu Huỳnh' }
        ],
        output: { id: 'defense_mortar', count: 1 }
      },
      {
        id: 'craft_plasma_core_ws',
        name: 'Chế Tạo Lõi Năng Lượng Plasma (x1 Lõi)',
        desc: 'Công thức: 2x Mảnh Vỡ Công Nghệ + 1x Tinh Thể Thạch Anh + 1x Bột Lưu Huỳnh. Dùng nâng cấp Súng & Tường Cấp 3.',
        inputs: [
          { id: 'tech_scrap', count: 2, name: 'Mảnh Vỡ Công Nghệ' },
          { id: 'quartz_crystal', count: 1, name: 'Tinh Thể Thạch Anh' },
          { id: 'sulfur_dust', count: 1, name: 'Bột Lưu Huỳnh' }
        ],
        output: { id: 'plasma_core', count: 1 }
      }
    ]
  },

  // Defensive Structures Configuration with Multi-Tier Upgrades (Lv.1 -> Lv.2 -> Lv.3)
  DEFENSE: {
    wall: {
      name: 'Tường Chắn',
      behavior: 'wall',
      maxHp: 250,
      size: 32,
      blocksMovement: true,
      tiers: {
        1: {
          level: 1,
          name: 'Tường Bê Tông (Lv.1)',
          maxHp: 250,
          armor: 0,
          thorns: 0,
          regen: 0,
          desc: 'Tường bê tông cốt thép cơ bản chặn quái vật.'
        },
        2: {
          level: 2,
          name: 'Tường Hợp Kim Titan (Lv.2)',
          maxHp: 550,
          armor: 4,
          thorns: 8,
          regen: 2,
          desc: 'Gia cố Titan: 550 HP, Giáp -4 sát thương, Phản 8 DMG khi bị cắn, Tự hồi 2 HP/s.',
          cost: [
            { id: 'stone', count: 2, name: 'Đá Núi Cứng' },
            { id: 'titanium_alloy', count: 1, name: 'Hợp Kim Titan' },
            { id: 'alien_chitin', count: 1, name: 'Giáp Xác Ngoại Lai' }
          ]
        },
        3: {
          level: 3,
          name: 'Tường Khiên Plasma (Lv.3 MAX)',
          maxHp: 1000,
          armor: 9,
          thorns: 18,
          regen: 6,
          desc: 'Tường Từ Trường Plasma: 1000 HP, Giáp -9 sát thương, Phản 18 DMG xung điện + Làm chậm, Tự hồi 6 HP/s.',
          cost: [
            { id: 'titanium_alloy', count: 2, name: 'Hợp Kim Titan' },
            { id: 'plasma_core', count: 1, name: 'Lõi Năng Lượng Plasma' },
            { id: 'quartz_crystal', count: 1, name: 'Tinh Thể Thạch Anh' }
          ]
        }
      }
    },
    trap: {
      name: 'Bẫy Gai',
      behavior: 'trap',
      maxHp: 60,
      size: 32,
      damage: 22,
      slowFactor: 0.5,
      slowDuration: 2.0,
      blocksMovement: false,
      tiers: {
        1: {
          level: 1,
          name: 'Bẫy Gai Sinh Học (Lv.1)',
          maxHp: 60,
          damage: 22,
          slowFactor: 0.5,
          slowDuration: 2.0,
          stunDuration: 0,
          maxUses: 12,
          desc: 'Gây 22 DMG, làm chậm 50% (12 lần kích hoạt).'
        },
        2: {
          level: 2,
          name: 'Bẫy Lưỡi Cưa Titan (Lv.2)',
          maxHp: 120,
          damage: 38,
          slowFactor: 0.35,
          slowDuration: 2.5,
          stunDuration: 0,
          maxUses: 24,
          desc: 'Gây 38 DMG, làm chậm 65% (24 lần kích hoạt).',
          cost: [
            { id: 'titanium_alloy', count: 1, name: 'Hợp Kim Titan' },
            { id: 'egg_fluid', count: 1, name: 'Dịch Tuyến Trứng' }
          ]
        },
        3: {
          level: 3,
          name: 'Bẫy Xung Điện Tesla (Lv.3 MAX)',
          maxHp: 200,
          damage: 62,
          slowFactor: 0.25,
          slowDuration: 3.0,
          stunDuration: 0.8,
          maxUses: 45,
          desc: 'Gây 62 DMG + Choáng 0.8s + Làm chậm 75% (45 lần kích hoạt).',
          cost: [
            { id: 'titanium_alloy', count: 1, name: 'Hợp Kim Titan' },
            { id: 'plasma_core', count: 1, name: 'Lõi Năng Lượng Plasma' }
          ]
        }
      }
    },
    turret: {
      name: 'Tháp Canh',
      behavior: 'turret',
      maxHp: 160,
      size: 32,
      range: 175,
      damage: 16,
      fireCooldown: 0.45,
      blocksMovement: true,
      tiers: {
        1: {
          level: 1,
          name: 'Súng Tháp Canh (Lv.1)',
          maxHp: 160,
          range: 175,
          damage: 16,
          fireCooldown: 0.45,
          barrels: 1,
          chainCount: 0,
          desc: 'Bắn đạn plasma đơn (16 DMG, tầm 175px).'
        },
        2: {
          level: 2,
          name: 'Súng Tháp Gatling Laser (Lv.2)',
          maxHp: 320,
          range: 225,
          damage: 26,
          fireCooldown: 0.30,
          barrels: 2,
          chainCount: 0,
          desc: 'Nòng kép Laser bắn siêu tốc (26 DMG/phát, tầm 225px, tốc bắn 0.30s).',
          cost: [
            { id: 'tech_scrap', count: 2, name: 'Mảnh Vỡ Công Nghệ' },
            { id: 'titanium_alloy', count: 1, name: 'Hợp Kim Titan' },
            { id: 'quartz_crystal', count: 1, name: 'Tinh Thể Thạch Anh' }
          ]
        },
        3: {
          level: 3,
          name: 'Tháp Pháo Railgun Tesla (Lv.3 MAX)',
          maxHp: 520,
          range: 280,
          damage: 44,
          fireCooldown: 0.22,
          barrels: 2,
          chainCount: 2,
          desc: 'Pháo Điện Từ Siêu Thanh: 44 DMG, tầm 280px, giật sét lan sang 2 quái lân cận + làm chậm!',
          cost: [
            { id: 'titanium_alloy', count: 2, name: 'Hợp Kim Titan' },
            { id: 'plasma_core', count: 1, name: 'Lõi Năng Lượng Plasma' },
            { id: 'quartz_crystal', count: 2, name: 'Tinh Thể Thạch Anh' }
          ]
        }
      }
    },
    mortar: {
      name: 'Súng Cối',
      behavior: 'mortar',
      maxHp: 140,
      size: 32,
      minRange: 80,
      range: 280,
      damage: 55,
      aoeRadius: 65,
      fireCooldown: 2.2,
      blocksMovement: true,
      tiers: {
        1: {
          level: 1,
          name: 'Súng Cối Hạng Nặng (Lv.1)',
          maxHp: 140,
          minRange: 80,
          range: 280,
          damage: 55,
          aoeRadius: 65,
          fireCooldown: 2.2,
          stunDuration: 0,
          desc: 'Bắn đạn pháo cầu vồng 55 DMG AoE (bán kính 65px).'
        },
        2: {
          level: 2,
          name: 'Pháo Cối Nhiệt Hạch (Lv.2)',
          maxHp: 280,
          minRange: 70,
          range: 340,
          damage: 95,
          aoeRadius: 85,
          fireCooldown: 1.75,
          stunDuration: 0.5,
          desc: 'Đạn Napalm Nhiệt Hạch: 95 DMG AoE (85px) + Choáng 0.5s + Tầm bắn 340px.',
          cost: [
            { id: 'sulfur_dust', count: 2, name: 'Bột Lưu Huỳnh' },
            { id: 'titanium_alloy', count: 1, name: 'Hợp Kim Titan' },
            { id: 'tech_scrap', count: 2, name: 'Mảnh Vỡ Công Nghệ' }
          ]
        },
        3: {
          level: 3,
          name: 'Siêu Pháo Quỹ Đạo Hạt Nhân (Lv.3 MAX)',
          maxHp: 460,
          minRange: 60,
          range: 410,
          damage: 155,
          aoeRadius: 115,
          fireCooldown: 1.35,
          stunDuration: 1.2,
          desc: 'Siêu Pháo Hạt Nhân Plasma: 155 DMG AoE (115px) + Choáng diện rộng 1.2s + Hất văng mạnh!',
          cost: [
            { id: 'titanium_alloy', count: 2, name: 'Hợp Kim Titan' },
            { id: 'plasma_core', count: 1, name: 'Lõi Năng Lượng Plasma' },
            { id: 'sulfur_dust', count: 3, name: 'Bột Lưu Huỳnh' }
          ]
        }
      }
    }
  },

  // Monster Species (100% Data-Driven: Stats, AI Type, Visuals, Projectiles, Spawn Rules & Loot)
  MONSTER_SPECIES: {
    dummy: {
      id: 'dummy',
      name: 'Bù Nhìn Thử Vũ Khí',
      tag: '🎯 Bù Nhìn Tập Luyện',
      maxHp: 150,
      speed: 0,
      damage: 0,
      radius: 16,
      aiType: 'dummy',
      sprite: 'monster_dummy',
      spriteSize: 48,
      hpColor: '#f59e0b',
      bloodColor: '#a855f7',
      desc: 'Bù nhìn tập luyện thử sát thương và kỹ năng vũ khí'
    },
    crawler: {
      id: 'crawler',
      name: 'Xenomorph Crawler',
      tag: '🕷 Xenomorph',
      maxHp: 50,
      speed: 75,
      damage: 10,
      radius: 16,
      aiType: 'melee',
      attackCooldown: 1.1,
      infectionOnHit: 12,
      sprite: 'monster_crawler',
      spriteSize: 48,
      hpColor: '#ef4444',
      bloodColor: '#a855f7',
      extraLootItem: 'iron_ore',
      spawn: { minDay: 1, weight: 30, bloodMoonWeight: 28, minEggs: 0 },
      desc: 'Quái vật cơ bản bò nhanh nhẹn'
    },
    exploder: {
      id: 'exploder',
      name: 'Quái Cảm Tử (Kamikaze)',
      tag: '💥 Cảm Tử Nổ',
      maxHp: 40,
      speed: 110,
      damage: 45,
      radius: 15,
      aiType: 'kamikaze',
      isKamikaze: true,
      blastRadius: 55,
      infectionOnHit: 18,
      sprite: 'monster_exploder',
      spriteSize: 48,
      hpColor: '#f97316',
      bloodColor: '#ea580c',
      extraLootItem: 'sulfur_dust',
      spawn: { minDay: 2, weight: 24, bloodMoonWeight: 24, minEggs: 3 },
      desc: 'Lao nhanh phát nổ phá tan tường chắn'
    },
    spitter: {
      id: 'spitter',
      name: 'Quái Phun Axit',
      tag: '🧪 Phun Axit',
      maxHp: 65,
      speed: 55,
      damage: 14,
      range: 190,
      radius: 17,
      aiType: 'ranged',
      isRanged: true,
      attackCooldown: 1.8,
      slowPlayerFactor: 0.72,
      slowPlayerDuration: 1.8,
      projectile: { type: 'acid_spit', speed: 260, rangeBonus: 45 },
      sprite: 'monster_spitter',
      spriteSize: 48,
      hpColor: '#84cc16',
      bloodColor: '#84cc16',
      extraLootItem: 'iron_ore',
      spawn: { minDay: 2, weight: 22, bloodMoonWeight: 23, minEggs: 3 },
      desc: 'Bắn đạn axit ăn mòn và làm chậm nhẹ từ xa'
    },
    frost_spitter: {
      id: 'frost_spitter',
      name: 'Quái Xạ Thủ Băng Hàn',
      tag: '❄️ Xạ Thủ Băng Hàn (Làm Chậm)',
      maxHp: 75,
      speed: 62,
      damage: 12,
      range: 245,
      radius: 17,
      aiType: 'ranged',
      isRanged: true,
      attackCooldown: 1.55,
      slowPlayerFactor: 0.50,
      slowPlayerDuration: 3.0,
      projectile: { type: 'frost_spit', speed: 295, rangeBonus: 45 },
      sprite: 'monster_frost_spitter',
      spriteSize: 48,
      hpColor: '#38bdf8',
      bloodColor: '#38bdf8',
      extraLootItem: 'quartz_crystal',
      spawn: { minDay: 1, weight: 24, bloodMoonWeight: 25, minEggs: 0 },
      desc: 'Bắn đạn tơ băng kết tinh từ xa làm chậm 50% tốc độ di chuyển của nhân vật'
    },
    behemoth: {
      id: 'behemoth',
      name: 'Quái Khổng Lồ (Behemoth)',
      tag: '👑 TITAN BEHEMOTH',
      maxHp: 280,
      speed: 45,
      damage: 32,
      radius: 26,
      aiType: 'melee',
      isBoss: true,
      attackCooldown: 1.4,
      infectionOnHit: 20,
      sprite: 'monster_behemoth',
      spriteSize: 68,
      hpColor: '#c084fc',
      bloodColor: '#a855f7',
      spawn: { minDay: 3, weight: 0, bloodMoonWeight: 0, isWaveBoss: true },
      desc: 'Quái khổng lồ phá hủy mọi công trình'
    }
  },

  // Companion Pet System (Incubated ONLY inside Bio-Lab, Max 1 Active Pet)
  MAX_ACTIVE_PETS: 1,
  PET_INCUBATION_TIME: 10, // seconds in Bio-Lab Incubator

  PET_SPECIES: {
    pet_archer: {
      id: 'pet_archer',
      name: 'Xạ Thủ Gai Quang Học',
      role: 'Tấn Công Tầm Xa (Như Cung)',
      badgeIcon: '🏹',
      color: '#ffb74d',
      sprite: 'pet_archer',
      icon: 'pet_archer',
      attackRange: 290,
      attackCooldown: 0.80,
      damage: 18,
      projectileType: 'pet_arrow',
      hpRegenPerSec: 0,
      toxinCleansePerSec: 0,
      statsBonus: { hp: 10, armor: 1, toxinResist: 5, speedBonus: 15 },
      desc: 'Tự động bắn Tên Gai Quang Học tầm xa 290px (18 DMG, làm chậm 30%). Mỗi phát bắn thứ 3 là Tên Xuyên Phá gây 32 DMG!'
    },
    pet_healer: {
      id: 'pet_healer',
      name: 'Tinh Linh Sinh Dược',
      role: 'Phục Hồi Sinh Mệnh (HP)',
      badgeIcon: '💚',
      color: '#4ade80',
      sprite: 'pet_healer',
      icon: 'pet_healer',
      attackRange: 210,
      attackCooldown: 1.15,
      damage: 11,
      projectileType: 'pet_bio_shot',
      hpRegenPerSec: 3.0,
      burstHealAmount: 12,
      burstHealInterval: 6.0,
      toxinCleansePerSec: 0.4,
      statsBonus: { hp: 35, armor: 2, toxinResist: 10, speedBonus: 5 },
      desc: 'Tự động Phục hồi +3 HP/giây liên tục và phát Sóng Đại Trị Liệu +12 HP mỗi 6s. Bắn đạn bào tử tự vệ (11 DMG, hút +2 HP).'
    },
    pet_antitoxin: {
      id: 'pet_antitoxin',
      name: 'Bọ Giáp Lọc Độc Tinh Thể',
      role: 'Kháng Độc & Thanh Lọc Ký Sinh',
      badgeIcon: '🛡️',
      color: '#c084fc',
      sprite: 'pet_antitoxin',
      icon: 'pet_antitoxin',
      attackRange: 230,
      attackCooldown: 1.0,
      damage: 13,
      projectileType: 'pet_cleanse_shot',
      hpRegenPerSec: 1.0,
      toxinCleansePerSec: 2.2,
      statsBonus: { hp: 15, armor: 5, toxinResist: 50, speedBonus: 5 },
      desc: 'Tăng +50% Kháng Độc Tố, tự động Thanh lọc -2.2% Độc Tố/giây khỏi cơ thể chủ nhân và bắn Đạn Tinh Thể Khử Khuẩn tầm xa!'
    },
    pet_frost: {
      id: 'pet_frost',
      name: 'Phượng Hoàng Băng Cực Hàn',
      role: 'Bắn Băng Tầm Xa & Đóng Băng',
      badgeIcon: '❄️',
      color: '#38bdf8',
      sprite: 'pet_frost',
      icon: 'pet_frost',
      attackRange: 270,
      attackCooldown: 0.92,
      damage: 16,
      projectileType: 'pet_frost_bolt',
      hpRegenPerSec: 1.0,
      toxinCleansePerSec: 0.5,
      statsBonus: { hp: 15, armor: 6, toxinResist: 20, speedBonus: 10 },
      desc: 'Bắn Mũi Tên Băng Giá tầm xa 270px (16 DMG) làm chậm quái 55% và có 35% tỉ lệ Đóng Băng (Choáng 1.2s) mục tiêu!'
    },
    pet_plasma: {
      id: 'pet_plasma',
      name: 'Rồng Con Điện Từ Plasma',
      role: 'Bắn Xa Giật Sét + Hồi HP + Kháng Độc',
      badgeIcon: '⚡',
      color: '#facc15',
      sprite: 'pet_plasma',
      icon: 'pet_plasma',
      attackRange: 300,
      attackCooldown: 0.75,
      damage: 22,
      projectileType: 'pet_plasma_bolt',
      hpRegenPerSec: 2.0,
      toxinCleansePerSec: 1.2,
      statsBonus: { hp: 25, armor: 5, toxinResist: 30, speedBonus: 12 },
      desc: 'Pet Huyền Thoại! Bắn Tia Laser Plasma tầm xa 300px (22 DMG + Giật sét lan), đồng thời Hồi +2 HP/s & Giảm -1.2% Độc Tố/s!'
    }
  },

  // Bio-Lab & Hydroponics Expansion Upgrade System (Lv.1 -> Lv.4 MAX)
  BIOLAB_TIERS: {
    1: {
      level: 1,
      name: 'Phòng Lab Cách Ly Cơ Bản (Lv.1)',
      shortTitle: 'Lab Cấp 1 (3 Lồng Cấy)',
      podCount: 3,
      growthTime: 35,
      harvestYield: 2,
      seedRefundChance: 0.25,
      isolationRadius: 150,
      hpRegenInZone: 0,
      toxinCleanseInZone: 0,
      color: '#10b981',
      desc: 'Quy mô khởi đầu: 3 Lồng Cấy vô trùng, thời gian lớn 35s, thu hoạch x2 cây/lồng, bán kính cách ly 150px.'
    },
    2: {
      level: 2,
      name: 'Nhà Kính Sinh Học Mở Rộng (Lv.2)',
      shortTitle: 'Lab Cấp 2 (6 Lồng Cấy)',
      podCount: 6,
      growthTime: 24,
      harvestYield: 3,
      seedRefundChance: 0.50,
      isolationRadius: 205,
      hpRegenInZone: 1.5,
      toxinCleanseInZone: 0.4,
      color: '#38bdf8',
      desc: 'Mở rộng gấp đôi: 6 Lồng Cấy (+3 luống nhà kính ngoài trời), tốc độ lớn nhanh (24s), thu hoạch x3 cây/lồng, hồi +1.5 HP/s trong vùng Lab (205px).',
      cost: [
        { id: 'wood', count: 5, name: 'Gỗ Cây Biến Dị' },
        { id: 'stone', count: 4, name: 'Đá Núi Cứng' },
        { id: 'pure_water', count: 1, name: 'Nước Tinh Khiết' },
        { id: 'quartz_crystal', count: 1, name: 'Tinh Thể Thạch Anh' }
      ],
      bonusSeeds: [
        { id: 'seed_snow_lotus', count: 3 },
        { id: 'seed_silver_moss', count: 3 },
        { id: 'seed_wild_berry', count: 3 }
      ]
    },
    3: {
      level: 3,
      name: 'Quần Thể Nông Trại Thủy Canh (Lv.3)',
      shortTitle: 'Lab Cấp 3 (9 Lồng Cấy)',
      podCount: 9,
      growthTime: 16,
      harvestYield: 4,
      seedRefundChance: 0.75,
      isolationRadius: 260,
      hpRegenInZone: 3.0,
      toxinCleanseInZone: 0.9,
      color: '#c084fc',
      desc: 'Quy mô công nghiệp: 9 Lồng Cấy (+6 luống nhà kính), lớn siêu tốc (16s), thu hoạch x4 cây/lồng (+75% hoàn hạt giống), hồi +3 HP/s & lọc độc trong vùng Lab (260px).',
      cost: [
        { id: 'wood', count: 6, name: 'Gỗ Cây Biến Dị' },
        { id: 'stone', count: 5, name: 'Đá Núi Cứng' },
        { id: 'titanium_alloy', count: 2, name: 'Hợp Kim Titan' },
        { id: 'tech_scrap', count: 2, name: 'Mảnh Vỡ Công Nghệ' }
      ],
      bonusSeeds: [
        { id: 'seed_snow_lotus', count: 4 },
        { id: 'seed_silver_moss', count: 4 },
        { id: 'seed_wild_berry', count: 4 },
        { id: 'seed_quartz_bloom', count: 3 }
      ]
    },
    4: {
      level: 4,
      name: 'Siêu Trung Tâm Sinh Quyển Vũ Trụ (Lv.4 MAX)',
      shortTitle: 'Lab Cấp 4 MAX (12 Lồng Cấy)',
      podCount: 12,
      growthTime: 10,
      harvestYield: 6,
      seedRefundChance: 1.0,
      isolationRadius: 320,
      hpRegenInZone: 5.0,
      toxinCleanseInZone: 1.8,
      color: '#facc15',
      desc: 'Quy mô tối thượng: 12 Lồng Cấy Sinh Quyển, chín thần tốc 10s, thu hoạch x6 cây/lồng + 100% hoàn hạt giống tự động, hào quang Sinh Quyển 320px hồi +5 HP/s & thanh lọc độc!',
      cost: [
        { id: 'titanium_alloy', count: 3, name: 'Hợp Kim Titan' },
        { id: 'plasma_core', count: 2, name: 'Lõi Năng Lượng Plasma' },
        { id: 'quartz_crystal', count: 2, name: 'Tinh Thể Thạch Anh' },
        { id: 'egg_fluid', count: 1, name: 'Dịch Tuyến Trứng Ngoại Lai' }
      ],
      bonusSeeds: [
        { id: 'seed_snow_lotus', count: 6 },
        { id: 'seed_silver_moss', count: 6 },
        { id: 'seed_wild_berry', count: 6 },
        { id: 'seed_quartz_bloom', count: 6 }
      ]
    }
  },

  // Dynamic Weather & Apocalyptic Phenomenon System
  WEATHER_TYPES: {
    CLEAR: {
      id: 'CLEAR',
      name: 'Quang Đãng',
      icon: '☀',
      color: '#38bdf8',
      desc: 'Thời tiết ổn định, tầm nhìn rõ ràng.'
    },
    ACID_RAIN: {
      id: 'ACID_RAIN',
      name: 'Mưa Axit Độc',
      icon: '🌧️',
      color: '#84cc16',
      desc: 'Mưa axit ngoài trời (+0.30% Độc/s khi ở ngoài Lab), cây Lồng Cấy lớn nhanh +40% & Quái rớt X2 Giáp Xác + Dịch Trứng!'
    },
    EMP_STORM: {
      id: 'EMP_STORM',
      name: 'Bão Điện Từ',
      icon: '⚡',
      color: '#38bdf8',
      desc: 'Sét đánh choáng quái ngoài trời, tăng +25% sát thương Súng Plasma/Tháp Canh/Drone & Quái rớt X2 Linh Kiện + Lõi Plasma!'
    },
    BLOOD_MOON: {
      id: 'BLOOD_MOON',
      name: 'Huyết Nguyệt',
      icon: '🩸',
      color: '#ef4444',
      desc: 'Trăng Máu cuồng nộ: Mọi quái vật bị tiêu diệt đều rớt X2 CHIẾN LỢI PHẨM HIẾM (Trứng Quái Vật, Hợp Kim Titan, Giáp Xác)!'
    }
  },

  // Autonomous Support Drone System (Auto-Harvest Resources + Auto-Repair Defenses + Combat Laser)
  DRONE_TIERS: {
    1: {
      level: 1,
      name: 'Drone Thu Thập & Sửa Chữa (Lv.1)',
      droneCount: 1,
      scanRadius: 280,
      harvestInterval: 2.6,
      repairPerSec: 16,
      laserDamage: 15,
      laserCooldown: 0.85,
      armorBonus: 4,
      color: '#38bdf8',
      desc: 'Triển khai 1 Drone bay tự động: Quét 280px tự khai thác tài nguyên vào Balo (2.6s/lần), tự hàn sửa Tường/Tháp (+16 HP/s) & bắn Laser 15 DMG.',
      cost: [
        { id: 'titanium_alloy', count: 2, name: 'Hợp Kim Titan' },
        { id: 'tech_scrap', count: 3, name: 'Mảnh Vỡ Công Nghệ' },
        { id: 'quartz_crystal', count: 2, name: 'Tinh Thể Thạch Anh' }
      ]
    },
    2: {
      level: 2,
      name: 'Phi Đội Drone Kép Từ Trường (Lv.2)',
      droneCount: 2,
      scanRadius: 400,
      harvestInterval: 1.8,
      repairPerSec: 34,
      laserDamage: 24,
      laserCooldown: 0.65,
      armorBonus: 8,
      color: '#a855f7',
      desc: 'Mở khóa 2 Drone bay song song: Quét rộng 400px, tự thu hoạch nhanh (1.8s/lần), hàn sửa công trình +34 HP/s, bắn Laser 24 DMG & cộng +8 Giáp.',
      cost: [
        { id: 'titanium_alloy', count: 3, name: 'Hợp Kim Titan' },
        { id: 'tech_scrap', count: 3, name: 'Mảnh Vỡ Công Nghệ' },
        { id: 'plasma_core', count: 1, name: 'Lõi Năng Lượng Plasma' }
      ]
    },
    3: {
      level: 3,
      name: 'Phi Đội Drone AI Siêu Nạp (Lv.3 MAX)',
      droneCount: 2,
      scanRadius: 540,
      harvestInterval: 1.1,
      repairPerSec: 60,
      laserDamage: 38,
      laserCooldown: 0.48,
      armorBonus: 14,
      color: '#facc15',
      desc: '2 Drone AI Tối Thượng: Quét toàn khu 540px, tự thu hoạch cả Trứng Quái Vật & Quặng (1.1s/lần), hàn sửa siêu tốc +60 HP/s, bắn Plasma 38 DMG & +14 Giáp!',
      cost: [
        { id: 'titanium_alloy', count: 4, name: 'Hợp Kim Titan' },
        { id: 'plasma_core', count: 2, name: 'Lõi Năng Lượng Plasma' },
        { id: 'alien_chitin', count: 3, name: 'Giáp Xác Ngoại Lai' }
      ]
    }
  }
};

// Ensure every item definition has its .id property populated
Object.keys(CONSTANTS.ITEM_TYPES).forEach((key) => {
  CONSTANTS.ITEM_TYPES[key].id = key;
});

// Export to global scope
if (typeof window !== 'undefined') {
  window.CONSTANTS = CONSTANTS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTS;
}
