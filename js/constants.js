// Game Constants & Configuration
// Alien Apocalypse: Survival + Adventure + Tower Defense (Phase 1)

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
    SEA_SHELL: 25
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
  MAX_STACK_SIZE: 20,
  INVENTORY_SLOTS: 12,

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

  // Weapons Definition
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
      attackCooldown: 0.6,
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
    }
  },

  // Item Registry
  ITEM_TYPES: {
    // Weapons
    spear: { name: 'Giáo Cận Chiến', category: 'weapon', weaponKey: 'SPEAR', icon: 'spear', maxStack: 1, desc: 'Vũ khí cán dài có khả năng quét ngáng và nhảy vọt.' },
    staff: { name: 'Gậy Chấn Động', category: 'weapon', weaponKey: 'STAFF', icon: 'staff', maxStack: 1, desc: 'Gậy phát ra sóng xung kích làm choáng và đẩy lùi.' },
    dagger: { name: 'Dao Găm Đột Kích', category: 'weapon', weaponKey: 'DAGGER', icon: 'dagger', maxStack: 1, desc: 'Dao găm siêu bén, hỗ trợ bom khói tàng hình.' },
    bow: { name: 'Cung Thợ Săn', category: 'weapon', weaponKey: 'BOW', icon: 'bow', maxStack: 1, desc: 'Cung bắn tên lưới trói chân và đạn giật lùi.' },

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
    snow_lotus: { name: 'Tuyết Liên Núi Cao', category: 'resource', icon: 'lotus', maxStack: 20, desc: 'Thảo dược quý hiếm mọc trên đỉnh núi tuyết, dùng pha chế Huyết Thanh.' },
    sulfur_dust: { name: 'Bột Lưu Huỳnh', category: 'resource', icon: 'sulfur', maxStack: 20, desc: 'Thu được từ quặng lưu huỳnh núi đá, chất khử trùng mạnh.' },
    quartz_crystal: { name: 'Tinh Thể Thạch Anh', category: 'resource', icon: 'quartz', maxStack: 20, desc: 'Khoáng sản tinh khiết vùng núi, dùng chế Thuốc Kháng Thể Tinh Khiết.' },
    silver_moss: { name: 'Rêu Bạc Đỉnh Núi', category: 'resource', icon: 'moss', maxStack: 20, desc: 'Rêu bạc chỉ sinh trưởng ở vách đá lạnh giá.' },
    egg_fluid: { name: 'Dịch Tuyến Trứng Ngoại Lai', category: 'resource', icon: 'egg_fluid', maxStack: 20, desc: 'Dịch lấy từ trứng quái vật bị đập vỡ, chứa kháng nguyên kỳ lạ.' },
    pure_water: { name: 'Nước Tinh Khiết', category: 'consumable', icon: 'pure_water', maxStack: 20, desc: 'Nước ngọt đã qua đun sôi lọc sạch: +15 HP, -15% Độc Tố.' },
    dirty_water: { name: 'Nước Ao Sông Ô Nhiễm', category: 'consumable', icon: 'dirty_water', maxStack: 20, desc: 'Nước chưa qua lọc, uống vào sẽ làm tăng +20% Độc Tố!' },
    wood: { name: 'Gỗ Cây Biến Dị', category: 'resource', icon: 'wood', maxStack: 20, desc: 'Vật liệu cơ bản để đốt lò nung và xây dựng phòng lab.' },
    stone: { name: 'Đá Núi Cứng', category: 'resource', icon: 'stone', maxStack: 20, desc: 'Vật liệu xây dựng phòng lab và lò nung.' },
    tech_scrap: { name: 'Mảnh Vỡ Công Nghệ', category: 'resource', icon: 'tech_scrap', maxStack: 20, desc: 'Mảnh kim loại và vi mạch trôi dạt vào bãi biển.' },

    // Phase 2: Wild Flora & Mutant Harvests
    wild_berry: { name: 'Quả Mọng Tự Nhiên Sạch', category: 'consumable', icon: 'berry_clean', maxStack: 20, desc: 'Quả rừng thu hoạch trong ngày còn tươi sạch: +18 HP, 0% Độc Tố.' },
    blighted_berry: { name: 'Quả Mọng Đột Biến Nhiễm Khuẩn', category: 'consumable', icon: 'berry_blighted', maxStack: 20, desc: 'Quả rừng bị qua đêm ngoài tự nhiên đã nhiễm độc: +5 HP nhưng TĂNG MẠNH +35% ĐỘC TỐ!' },
    blighted_herb: { name: 'Thảo Dược Bị Thối Rữa', category: 'resource', icon: 'blighted_herb', maxStack: 20, desc: 'Cây cỏ ngoài tự nhiên qua đêm bị khí độc phá hủy, không thể chế thuốc.' },

    // Phase 2: Antidotes (Thuốc Giải Ký Sinh)
    antidote_lesser: { 
      name: 'Huyết Thanh Sơ Cấp', category: 'consumable', icon: 'antidote_lesser', maxStack: 10, 
      desc: 'Huyết thanh giải độc cơ bản chế từ Tuyết Liên, Lưu Huỳnh và Nước sạch: GIẢM NGAY 25% ĐỘC TỐ.' 
    },
    antidote_pure: { 
      name: 'Thuốc Kháng Thể Tinh Khiết', category: 'consumable', icon: 'antidote_pure', maxStack: 10, 
      desc: 'Kháng thể tinh chế đặc biệt: GIẢM NGAY 60% ĐỘC TỐ + MIỄN NHIỄM ĐỘC TỐ TRONG 1 NGÀY!' 
    },

    // Phase 2: Seeds for Bio-Lab Hydroponics
    seed_snow_lotus: { name: 'Mầm Cấy Tuyết Liên', category: 'seed', targetCrop: 'snow_lotus', icon: 'seed_lotus', maxStack: 20, desc: 'Mô tế bào dùng cấy nuôi trong Phòng Lab cách ly, thu hoạch thảo dược sạch 100%.' },
    seed_silver_moss: { name: 'Bào Tử Rêu Bạc', category: 'seed', targetCrop: 'silver_moss', icon: 'seed_moss', maxStack: 20, desc: 'Bào tử rêu sạch dùng nhân giống trong lồng sinh học của Phòng Lab.' },

    // Phase 3: Defensive Structures & Upgrades
    defense_wall: { name: 'Tường Chắn Phòng Thủ', category: 'defense', structType: 'wall', icon: 'defense_wall', maxStack: 20, desc: 'Tường bê tông gia cố (250 HP), chặn đường quái và tạo lối đi bẫy.' },
    defense_trap: { name: 'Bẫy Gai Sinh Học', category: 'defense', structType: 'trap', icon: 'defense_trap', maxStack: 20, desc: 'Đặt dưới đất, quái giẫm lên bị gây sát thương liên tục và chậm 50%.' },
    defense_turret: { name: 'Tháp Canh Tự Động', category: 'defense', structType: 'turret', icon: 'defense_turret', maxStack: 10, desc: 'Tháp phòng thủ tự động xoay và bắn tỉa quái vật tốc độ cao trong tầm 175px.' },
    defense_mortar: { name: 'Súng Cối Hạng Nặng', category: 'defense', structType: 'mortar', icon: 'defense_mortar', maxStack: 5, desc: 'Pháo cối bắn đạn cầu vồng tầm xa (280px), nổ phá AoE cực mạnh diện rộng.' },
    backpack_upgraded: { name: 'Balo Nâng Cấp Dã Chiến', category: 'upgrade', icon: 'backpack', maxStack: 1, desc: 'Mở rộng sức chứa kho đồ sinh tồn thêm 6 ô chứa mới!' }
  },

  // Phase 2: Crafting Recipes for Bio-Lab & Furnace
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
        id: 'furnace_sulfur',
        name: 'Nung Quặng Bột Lưu Huỳnh',
        desc: 'Nung quặng núi đá và gỗ để tạo 2 Bột Lưu Huỳnh khử trùng thuốc giải.',
        inputs: [
          { id: 'stone', count: 2, name: 'Đá Núi Cứng' },
          { id: 'wood', count: 1, name: 'Gỗ Cây Biến Dị' }
        ],
        output: { id: 'sulfur_dust', count: 2 }
      }
    ],

    // Phase 3: Workbench Recipes (Bàn chế tạo cơ bản & Nâng cấp)
    WORKBENCH: [
      {
        id: 'craft_wall_pack',
        name: 'Gia Công Tường Chắn (x4 Cái)',
        desc: 'Công thức: 4x Gỗ + 2x Đá Núi. Tạo 4 khối tường bê tông gia cố chịu lực.',
        inputs: [
          { id: 'wood', count: 4, name: 'Gỗ Cây Biến Dị' },
          { id: 'stone', count: 2, name: 'Đá Núi Cứng' }
        ],
        output: { id: 'defense_wall', count: 4 }
      },
      {
        id: 'craft_backpack',
        name: 'May Balo Nâng Cấp (+6 Ô Đồ)',
        desc: 'Công thức: 6x Gỗ + 3x Mảnh Vỡ Công Nghệ. Mở rộng thêm 6 ô kho đồ!',
        inputs: [
          { id: 'wood', count: 6, name: 'Gỗ Cây Biến Dị' },
          { id: 'tech_scrap', count: 3, name: 'Mảnh Vỡ Công Nghệ' }
        ],
        output: { id: 'backpack_upgraded', count: 1 }
      },
      {
        id: 'craft_vest',
        name: 'Gia Cố Áo Giáp Dã Chiến',
        desc: 'Công thức: 5x Gỗ + 3x Đá Núi + 2x Mảnh Vỡ Công Nghệ. Giáp chống cắn bảo hộ.',
        inputs: [
          { id: 'wood', count: 5, name: 'Gỗ Cây Biến Dị' },
          { id: 'stone', count: 3, name: 'Đá Núi Cứng' },
          { id: 'tech_scrap', count: 2, name: 'Mảnh Vỡ Công Nghệ' }
        ],
        output: { id: 'vest_survival', count: 1 }
      }
    ],

    // Phase 3: Workshop Recipes (Xưởng cơ khí chế tạo Thủ Thành)
    WORKSHOP: [
      {
        id: 'craft_trap_pack',
        name: 'Đúc Bẫy Gai Sinh Học (x3 Cái)',
        desc: 'Công thức: 3x Gỗ + 2x Đá + 1x Dịch Tuyến Trứng. Bẫy gai độc làm chậm 50% và gây sát thương.',
        inputs: [
          { id: 'wood', count: 3, name: 'Gỗ Cây Biến Dị' },
          { id: 'stone', count: 2, name: 'Đá Núi Cứng' },
          { id: 'egg_fluid', count: 1, name: 'Dịch Tuyến Trứng Ngoại Lai' }
        ],
        output: { id: 'defense_trap', count: 3 }
      },
      {
        id: 'craft_turret',
        name: 'Lắp Ráp Tháp Canh Tự Động',
        desc: 'Công thức: 4x Đá + 3x Mảnh Vỡ Công Nghệ + 1x Tinh Thể Thạch Anh. Tháp súng plasma bắn tỉa 175px.',
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
        desc: 'Công thức: 6x Đá + 4x Mảnh Vỡ Công Nghệ + 2x Bột Lưu Huỳnh. Bắn pháo nổ tầm xa 280px diện rộng!',
        inputs: [
          { id: 'stone', count: 6, name: 'Đá Núi Cứng' },
          { id: 'tech_scrap', count: 4, name: 'Mảnh Vỡ Công Nghệ' },
          { id: 'sulfur_dust', count: 2, name: 'Bột Lưu Huỳnh' }
        ],
        output: { id: 'defense_mortar', count: 1 }
      }
    ]
  },

  // Defensive Structures Configuration
  DEFENSE: {
    wall: { name: 'Tường Chắn', maxHp: 250, size: 32, blocksMovement: true },
    trap: { name: 'Bẫy Gai', maxHp: 60, size: 32, damage: 22, slowFactor: 0.5, slowDuration: 2.0, blocksMovement: false },
    turret: { name: 'Tháp Canh', maxHp: 160, size: 32, range: 175, damage: 16, fireCooldown: 0.45, blocksMovement: true },
    mortar: { name: 'Súng Cối', maxHp: 140, size: 32, minRange: 80, range: 280, damage: 55, aoeRadius: 65, fireCooldown: 2.2, blocksMovement: true }
  },

  // Monster Species
  MONSTER_SPECIES: {
    crawler: { name: 'Xenomorph Crawler', maxHp: 50, speed: 75, damage: 10, radius: 16, desc: 'Quái vật cơ bản bò nhanh nhẹn' },
    exploder: { name: 'Quái Cảm Tử (Kamikaze)', maxHp: 40, speed: 110, damage: 45, radius: 15, isKamikaze: true, desc: 'Lao nhanh phát nổ phá tan tường chắn' },
    spitter: { name: 'Quái Phun Axit', maxHp: 65, speed: 55, damage: 14, range: 190, radius: 17, isRanged: true, desc: 'Bắn đạn axit ăn mòn từ xa' },
    behemoth: { name: 'Quái Khổng Lồ (Behemoth)', maxHp: 280, speed: 45, damage: 32, radius: 26, isBoss: true, desc: 'Quái khổng lồ phá hủy mọi công trình' }
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.CONSTANTS = CONSTANTS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTS;
}
