// Game Constants & Configuration
// Alien Apocalypse: Survival + Adventure + Tower Defense + Upgrade System (Phase 1 - 5)

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

  // Armor Slots
  ARMOR_SLOTS: {
    HELMET: 'helmet',
    CHESTPLATE: 'chestplate',
    LEGGINGS: 'leggings',
    BOOTS: 'boots',
    GLOVES: 'gloves'
  },

  // Max stack size for inventory
  MAX_STACK_SIZE: 25,
  INVENTORY_SLOTS: 20,

  // Day & Night Configuration
  DAY_DURATION_SEC: 120, // 2 minutes per full day/night cycle
  DAY_RATIO: 0.65,       // 65% daytime, 35% nighttime
  
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

  // Item Registry
  ITEM_TYPES: {
    // Weapons
    spear: { name: 'Giáo Cận Chiến', category: 'weapon', weaponKey: 'SPEAR', icon: 'spear', maxStack: 1, desc: 'Vũ khí cán dài có khả năng quét ngang và nhảy vọt.' },
    staff: { name: 'Gậy Chấn Động', category: 'weapon', weaponKey: 'STAFF', icon: 'staff', maxStack: 1, desc: 'Gậy phát ra sóng xung kích làm choáng và đẩy lùi.' },
    dagger: { name: 'Dao Găm Đột Kích', category: 'weapon', weaponKey: 'DAGGER', icon: 'dagger', maxStack: 1, desc: 'Dao găm siêu bén, hỗ trợ bom khói tàng hình.' },
    bow: { name: 'Cung Thợ Săn', category: 'weapon', weaponKey: 'BOW', icon: 'bow', maxStack: 1, desc: 'Cung bắn tên lưới trói chân và đạn giật lùi.' },
    plasma_gun: { name: 'Súng Trường Plasma', category: 'weapon', weaponKey: 'GUN', icon: 'gun', maxStack: 1, desc: 'Súng năng lượng bắn liên thanh tốc độ cao [Phím G / Số 5].' },

    // Armors
    mask_gas: { 
      name: 'Mũ Lọc Khí Sinh Học', category: 'armor', slot: 'helmet', icon: 'helmet', maxStack: 1,
      stats: { hp: 15, armor: 2, toxinResist: 15 },
      desc: 'Mũ phòng độc chuyên dụng giúp giảm độc tố từ khí ô nhiễm môi trường.'
    },
    vest_survival: { 
      name: 'Áo Giáp Dã Chiến', category: 'armor', slot: 'chestplate', icon: 'chestplate', maxStack: 1,
      stats: { hp: 35, armor: 6, toxinResist: 5 },
      desc: 'Áo giáp gia cố sợi Kevlar và vảy sinh vật ngoài hành tinh.'
    },
    vest_titanium: {
      name: 'Giáp Chiến Đấu Titan-Plasma', category: 'armor', slot: 'chestplate', icon: 'chestplate', maxStack: 1,
      stats: { hp: 75, armor: 12, toxinResist: 20, speedBonus: 15 },
      desc: 'Giáp cơ giới hạng nặng đúc từ Hợp Kim Titan và Giáp Xác Ngoại Lai (+75 HP, +12 Giáp, +20% Kháng Độc).'
    },
    pants_hazard: { 
      name: 'Quần Chống Độc', category: 'armor', slot: 'leggings', icon: 'leggings', maxStack: 1,
      stats: { hp: 20, armor: 4, toxinResist: 10 },
      desc: 'Quần vải sợi tổng hợp cách ly với gai độc và đầm lầy.'
    },
    boots_scout: { 
      name: 'Giày Thám Hiểm', category: 'armor', slot: 'boots', icon: 'boots', maxStack: 1,
      stats: { hp: 10, speedBonus: 35, toxinResist: 5 },
      desc: 'Đế giày trợ lực giúp di chuyển nhanh nhẹn trên mọi địa hình.'
    },
    gloves_miner: { 
      name: 'Găng Tay Khai Khoáng', category: 'armor', slot: 'gloves', icon: 'gloves', maxStack: 1,
      stats: { hp: 10, armor: 2, toxinResist: 5 },
      desc: 'Bảo vệ đôi bàn tay khi hái thảo dược núi cao và đập vỡ trứng quái.'
    },

    // Resources & Materials
    snow_lotus: { id: 'snow_lotus', name: 'Tuyết Liên Núi Cao', category: 'resource', icon: 'lotus', maxStack: 25, desc: 'Thảo dược núi tuyết: Dùng trực tiếp (+12 HP, -12% Độc Tố) hoặc chế Huyết Thanh.' },
    sulfur_dust: { id: 'sulfur_dust', name: 'Bột Lưu Huỳnh', category: 'resource', icon: 'sulfur', maxStack: 25, desc: 'Chất khử trùng mạnh: Click để mở Phòng Lab chế Huyết Thanh hoặc nâng cấp Súng Cối.' },
    quartz_crystal: { id: 'quartz_crystal', name: 'Tinh Thể Thạch Anh', category: 'resource', icon: 'quartz', maxStack: 25, desc: 'Khoáng sản tinh khiết: Dùng chế Kháng Thể, Lõi Plasma hoặc nâng cấp Súng Tháp Canh.' },
    silver_moss: { id: 'silver_moss', name: 'Rêu Bạc Đỉnh Núi', category: 'resource', icon: 'moss', maxStack: 25, desc: 'Rêu bạc núi cao: Dùng trực tiếp (+15 HP, -8% Độc Tố) hoặc chế Kháng Thể Tinh Khiết.' },
    egg_fluid: { id: 'egg_fluid', name: 'Dịch Tuyến Trứng Ngoại Lai', category: 'resource', icon: 'egg_fluid', maxStack: 25, desc: 'Dịch trứng quái: Dùng trực tiếp (+20 HP, +30% Tốc chạy 8s, +15% Độc) hoặc chế Lõi Plasma.' },
    pure_water: { id: 'pure_water', name: 'Nước Tinh Khiết', category: 'consumable', icon: 'pure_water', maxStack: 25, desc: 'Nước ngọt đã qua đun sôi lọc sạch: +15 HP, -15% Độc Tố.' },
    dirty_water: { id: 'dirty_water', name: 'Nước Ao Sông Ô Nhiễm', category: 'consumable', icon: 'dirty_water', maxStack: 25, desc: 'Nước chưa qua lọc: +5 HP nhưng làm tăng +20% Độc Tố!' },
    wood: { id: 'wood', name: 'Gỗ Cây Biến Dị', category: 'resource', icon: 'wood', maxStack: 25, desc: 'Vật liệu cơ bản: Click để mở Bàn Chế Tạo / Lò Nung gia công vật phẩm.' },
    stone: { id: 'stone', name: 'Đá Núi Cứng', category: 'resource', icon: 'stone', maxStack: 25, desc: 'Vật liệu xây dựng: Click để mở Bàn Chế Tạo / Lò Nung đúc tường và nung quặng.' },
    tech_scrap: { id: 'tech_scrap', name: 'Mảnh Vỡ Công Nghệ', category: 'resource', icon: 'tech_scrap', maxStack: 25, desc: 'Linh kiện vi mạch: Click để mở Xưởng Thủ Thành lắp và nâng cấp Tháp Canh, Súng Cối.' },

    // Phase 5: New Upgrade Materials (Nguyên liệu nâng cấp Tường & Súng)
    iron_ore: { id: 'iron_ore', name: 'Quặng Sắt Titan', category: 'resource', icon: 'iron_ore', maxStack: 25, desc: 'Quặng kim loại nặng khai thác trên Núi Đá: Nung tại Lò Nung để tạo Hợp Kim Titan.' },
    titanium_alloy: { id: 'titanium_alloy', name: 'Hợp Kim Titan', category: 'resource', icon: 'titanium_alloy', maxStack: 25, desc: 'Vật liệu siêu bền dùng để NÂNG CẤP Tường Chắn, Súng Tháp Canh, Súng Cối và Vũ Khí!' },
    alien_chitin: { id: 'alien_chitin', name: 'Giáp Xác Ngoại Lai', category: 'resource', icon: 'alien_chitin', maxStack: 25, desc: 'Vỏ giáp cứng thu được khi tiêu diệt Quái Vật: Dùng nâng cấp Tường Chắn, Giáp và Vũ Khí.' },
    plasma_core: { id: 'plasma_core', name: 'Lõi Năng Lượng Plasma', category: 'resource', icon: 'plasma_core', maxStack: 25, desc: 'Lõi năng lượng cao cấp (thu ở Bờ Biển hoặc chế tại Lab/Xưởng): Nâng cấp Tường & Súng lên Cấp 3!' },

    // Phase 2: Wild Flora & Mutant Harvests
    wild_berry: { name: 'Quả Mọng Tự Nhiên Sạch', category: 'consumable', icon: 'berry_clean', maxStack: 25, desc: 'Quả rừng thu hoạch trong ngày còn tươi sạch: +18 HP, 0% Độc Tố.' },
    blighted_berry: { name: 'Quả Mọng Đột Biến Nhiễm Khuẩn', category: 'consumable', icon: 'berry_blighted', maxStack: 25, desc: 'Quả rừng bị qua đêm ngoài tự nhiên đã nhiễm độc: +5 HP nhưng TĂNG MẠNH +35% ĐỘC TỐ!' },
    blighted_herb: { name: 'Thảo Dược Bị Thối Rữa', category: 'resource', icon: 'blighted_herb', maxStack: 25, desc: 'Cây cỏ ngoài tự nhiên qua đêm bị khí độc phá hủy, không thể chế thuốc.' },

    // Phase 2: Antidotes (Thuốc Giải Ký Sinh)
    antidote_lesser: { 
      name: 'Huyết Thanh Sơ Cấp', category: 'consumable', icon: 'antidote_lesser', maxStack: 15, 
      desc: 'Huyết thanh giải độc cơ bản chế từ Tuyết Liên, Lưu Huỳnh và Nước sạch: GIẢM NGAY 25% ĐỘC TỐ.' 
    },
    antidote_pure: { 
      name: 'Thuốc Kháng Thể Tinh Khiết', category: 'consumable', icon: 'antidote_pure', maxStack: 15, 
      desc: 'Kháng thể tinh chế đặc biệt: GIẢM NGAY 60% ĐỘC TỐ + MIỄN NHIỄM ĐỘC TỐ TRONG 1 NGÀY!' 
    },

    // Phase 2: Seeds for Bio-Lab Hydroponics
    seed_snow_lotus: { name: 'Mầm Cấy Tuyết Liên', category: 'seed', targetCrop: 'snow_lotus', icon: 'seed_lotus', maxStack: 25, desc: 'Mô tế bào dùng cấy nuôi trong Phòng Lab cách ly, thu hoạch thảo dược sạch 100%.' },
    seed_silver_moss: { name: 'Bào Tử Rêu Bạc', category: 'seed', targetCrop: 'silver_moss', icon: 'seed_moss', maxStack: 25, desc: 'Bào tử rêu sạch dùng nhân giống trong lồng sinh học của Phòng Lab.' },

    // Phase 3: Defensive Structures & Upgrades
    defense_wall: { name: 'Tường Chắn Phòng Thủ', category: 'defense', structType: 'wall', icon: 'defense_wall', maxStack: 25, desc: 'Tường bê tông gia cố (250-1000 HP), chặn đường quái, có thể nâng cấp lên Cấp 3!' },
    defense_trap: { name: 'Bẫy Gai Sinh Học', category: 'defense', structType: 'trap', icon: 'defense_trap', maxStack: 25, desc: 'Đặt dưới đất làm chậm và gây sát thương, có thể nâng cấp lên Bẫy Xung Điện Cấp 3!' },
    defense_turret: { name: 'Tháp Canh Tự Động', category: 'defense', structType: 'turret', icon: 'defense_turret', maxStack: 15, desc: 'Súng tháp tự động bắn tỉa 360°, nâng cấp lên Gatling Laser (Cấp 2) & Pháo Railgun Tesla (Cấp 3)!' },
    defense_mortar: { name: 'Súng Cối Hạng Nặng', category: 'defense', structType: 'mortar', icon: 'defense_mortar', maxStack: 10, desc: 'Pháo cối tầm xa nổ AoE diện rộng, nâng cấp lên Pháo Nhiệt Hạch (Cấp 2) & Siêu Pháo Hạt Nhân (Cấp 3)!' },
    backpack_upgraded: { name: 'Balo Nâng Cấp Dã Chiến', category: 'upgrade', icon: 'backpack', maxStack: 1, desc: 'Mở rộng sức chứa kho đồ sinh tồn thêm 4 ô chứa mới (tối đa 28 ô)!' }
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

  // Monster Species
  MONSTER_SPECIES: {
    crawler: { name: 'Xenomorph Crawler', maxHp: 50, speed: 75, damage: 10, radius: 16, desc: 'Quái vật cơ bản bò nhanh nhẹn' },
    exploder: { name: 'Quái Cảm Tử (Kamikaze)', maxHp: 40, speed: 110, damage: 45, radius: 15, isKamikaze: true, desc: 'Lao nhanh phát nổ phá tan tường chắn' },
    spitter: { name: 'Quái Phun Axit', maxHp: 65, speed: 55, damage: 14, range: 190, radius: 17, isRanged: true, desc: 'Bắn đạn axit ăn mòn từ xa' },
    behemoth: { name: 'Quái Khổng Lồ (Behemoth)', maxHp: 280, speed: 45, damage: 32, radius: 26, isBoss: true, desc: 'Quái khổng lồ phá hủy mọi công trình' }
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
