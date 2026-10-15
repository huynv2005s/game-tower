// Core Architecture: EventBus, SpatialGrid (O(1) Broadphase), ObjectPool (Zero-GC), and Data-Driven GameRegistry
// Designed for easy expansion of Monsters, Items, Weapons, Defenses, Pets & High-Performance Crowd Simulation

// ============================================================================
// 1. EVENT BUS (Decoupled Pub/Sub for Quests, Buffs, Achievements, Boss Triggers)
// ============================================================================
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
    return () => this.off(event, listener);
  }

  once(event, listener) {
    const wrapper = (payload) => {
      this.off(event, wrapper);
      listener(payload);
    };
    return this.on(event, wrapper);
  }

  off(event, listener) {
    const list = this.listeners.get(event);
    if (!list) return;
    const idx = list.indexOf(listener);
    if (idx !== -1) list.splice(idx, 1);
  }

  emit(event, payload) {
    const list = this.listeners.get(event);
    if (!list || list.length === 0) return;
    for (let i = 0; i < list.length; i++) {
      try {
        list[i](payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    }
  }
}

// ============================================================================
// 2. SPATIAL HASH GRID (O(1) Broadphase Collision & Target Acquisition)
// Eliminates O(N * M) bottlenecks when hundreds of monsters & buildings exist
// ============================================================================
class SpatialGrid {
  constructor(worldWidth = 3200, worldHeight = 2560, cellSize = 128) {
    this.cellSize = cellSize;
    this.invCellSize = 1 / cellSize;
    this.cols = Math.ceil(worldWidth / cellSize) + 1;
    this.rows = Math.ceil(worldHeight / cellSize) + 1;
    this.totalCells = this.cols * this.rows;

    // Pre-allocated flat array of buckets to avoid per-frame array allocations
    this.buckets = new Array(this.totalCells);
    for (let i = 0; i < this.totalCells; i++) {
      this.buckets[i] = [];
    }
    this._queryScratch = [];
    this._neighborScratch = [];
  }

  clear() {
    for (let i = 0; i < this.totalCells; i++) {
      if (this.buckets[i].length > 0) {
        this.buckets[i].length = 0;
      }
    }
  }

  _getCellCoords(x, y) {
    let c = (x * this.invCellSize) | 0;
    let r = (y * this.invCellSize) | 0;
    if (c < 0) c = 0;
    else if (c >= this.cols) c = this.cols - 1;
    if (r < 0) r = 0;
    else if (r >= this.rows) r = this.rows - 1;
    return r * this.cols + c;
  }

  insert(entity) {
    if (!entity || entity.isDead) return;
    const idx = this._getCellCoords(entity.x, entity.y);
    this.buckets[idx].push(entity);
  }

  insertAll(entities) {
    this.clear();
    if (!entities) return;
    for (let i = 0, len = entities.length; i < len; i++) {
      const e = entities[i];
      if (e && !e.isDead && !e.isDestroyed) {
        const idx = this._getCellCoords(e.x, e.y);
        this.buckets[idx].push(e);
      }
    }
  }

  // Returns entities within radius of (x, y). Uses internal scratch array by default for zero GC.
  queryRadius(x, y, radius, outArray = this._queryScratch) {
    outArray.length = 0;
    const rSq = radius * radius;
    let minC = ((x - radius) * this.invCellSize) | 0;
    let maxC = ((x + radius) * this.invCellSize) | 0;
    let minR = ((y - radius) * this.invCellSize) | 0;
    let maxR = ((y + radius) * this.invCellSize) | 0;

    if (minC < 0) minC = 0;
    if (maxC >= this.cols) maxC = this.cols - 1;
    if (minR < 0) minR = 0;
    if (maxR >= this.rows) maxR = this.rows - 1;

    for (let r = minR; r <= maxR; r++) {
      const rowOffset = r * this.cols;
      for (let c = minC; c <= maxC; c++) {
        const bucket = this.buckets[rowOffset + c];
        const bLen = bucket.length;
        for (let i = 0; i < bLen; i++) {
          const e = bucket[i];
          if (e.isDead || e.isDestroyed) continue;
          const dx = e.x - x;
          const dy = e.y - y;
          const maxDist = radius + (e.radius || 0);
          if (dx * dx + dy * dy <= maxDist * maxDist || dx * dx + dy * dy <= rSq) {
            outArray.push(e);
          }
        }
      }
    }
    return outArray;
  }

  // Fast closest entity search within maxRadius without allocating any array
  findClosest(x, y, maxRadius, filterFn = null) {
    let bestEntity = null;
    let bestDistSq = maxRadius * maxRadius;

    let minC = ((x - maxRadius) * this.invCellSize) | 0;
    let maxC = ((x + maxRadius) * this.invCellSize) | 0;
    let minR = ((y - maxRadius) * this.invCellSize) | 0;
    let maxR = ((y + maxRadius) * this.invCellSize) | 0;

    if (minC < 0) minC = 0;
    if (maxC >= this.cols) maxC = this.cols - 1;
    if (minR < 0) minR = 0;
    if (maxR >= this.rows) maxR = this.rows - 1;

    for (let r = minR; r <= maxR; r++) {
      const rowOffset = r * this.cols;
      for (let c = minC; c <= maxC; c++) {
        const bucket = this.buckets[rowOffset + c];
        const bLen = bucket.length;
        for (let i = 0; i < bLen; i++) {
          const e = bucket[i];
          if (e.isDead || e.isDestroyed) continue;
          if (filterFn && !filterFn(e)) continue;
          const dx = e.x - x;
          const dy = e.y - y;
          const dSq = dx * dx + dy * dy;
          if (dSq <= bestDistSq) {
            bestDistSq = dSq;
            bestEntity = e;
          }
        }
      }
    }
    return bestEntity;
  }

  // Get entities in the exact cell + 8 immediate neighbors (fast local neighborhood for separation/traps)
  getCellNeighborhood(x, y, outArray = this._neighborScratch) {
    outArray.length = 0;
    const centerC = (x * this.invCellSize) | 0;
    const centerR = (y * this.invCellSize) | 0;
    const minC = Math.max(0, centerC - 1);
    const maxC = Math.min(this.cols - 1, centerC + 1);
    const minR = Math.max(0, centerR - 1);
    const maxR = Math.min(this.rows - 1, centerR + 1);

    for (let r = minR; r <= maxR; r++) {
      const rowOffset = r * this.cols;
      for (let c = minC; c <= maxC; c++) {
        const bucket = this.buckets[rowOffset + c];
        for (let i = 0, len = bucket.length; i < len; i++) {
          outArray.push(bucket[i]);
        }
      }
    }
    return outArray;
  }
}

// ============================================================================
// 3. OBJECT POOL & O(1) IN-PLACE ARRAY COMPACTION (Zero-GC Memory Management)
// ============================================================================
class ObjectPool {
  constructor(factoryFn, maxPoolSize = 400) {
    this.factoryFn = factoryFn;
    this.maxPoolSize = maxPoolSize;
    this.freeList = [];
  }

  acquire(...args) {
    if (this.freeList.length > 0) {
      const instance = this.freeList.pop();
      if (instance.reset) {
        instance.reset(...args);
      }
      return instance;
    }
    return this.factoryFn(...args);
  }

  release(instance) {
    if (!instance) return;
    if (this.freeList.length < this.maxPoolSize) {
      this.freeList.push(instance);
    }
  }
}

// Fast O(N) single-pass in-place compaction that replaces slow O(N^2) Array.splice() loops
function updateAndCompact(array, updateCheckFn, pool = null) {
  let writeIdx = 0;
  const len = array.length;
  for (let readIdx = 0; readIdx < len; readIdx++) {
    const item = array[readIdx];
    const keep = updateCheckFn(item, readIdx);
    if (keep) {
      if (writeIdx !== readIdx) {
        array[writeIdx] = item;
      }
      writeIdx++;
    } else if (pool) {
      pool.release(item);
    }
  }
  array.length = writeIdx;
}

// ============================================================================
// 4. DATA-DRIVEN GAME REGISTRY (Plug-and-Play Extension API)
// Add new Monsters, Items, Weapons, Defenses, Pets, Recipes & Projectiles easily!
// ============================================================================
const GameRegistry = {
  events: new EventBus(),

  /**
   * Register a new Monster Species (or override an existing one)
   * @param {string} id - Unique species key (e.g., 'acid_boss', 'shadow_stalker')
   * @param {object} config - Monster stats, AI type, visuals, spawn rules, and loot table
   */
  registerMonster(id, config) {
    if (!id || !config) return null;
    const normalized = {
      id,
      name: config.name || id,
      tag: config.tag || `👾 ${config.name || id}`,
      maxHp: config.maxHp || 60,
      speed: config.speed !== undefined ? config.speed : 75,
      damage: config.damage || 12,
      radius: config.radius || 16,
      aiType: config.aiType || (config.isKamikaze ? 'kamikaze' : (config.isRanged ? 'ranged' : 'melee')),
      isKamikaze: !!config.isKamikaze || config.aiType === 'kamikaze',
      isRanged: !!config.isRanged || config.aiType === 'ranged',
      isBoss: !!config.isBoss,
      range: config.range || (config.isRanged ? 190 : 26),
      attackCooldown: config.attackCooldown || (config.isRanged ? 1.7 : (config.isBoss ? 1.4 : 1.1)),
      infectionOnHit: config.infectionOnHit !== undefined ? config.infectionOnHit : (config.isBoss ? 20 : 12),
      blastRadius: config.blastRadius || 55,
      slowPlayerFactor: config.slowPlayerFactor || 0.72,
      slowPlayerDuration: config.slowPlayerDuration || 1.8,
      sprite: config.sprite || `monster_${id}`,
      spriteSize: config.spriteSize || (config.isBoss ? 68 : 48),
      hpColor: config.hpColor || (config.isBoss ? '#c084fc' : '#ef4444'),
      bloodColor: config.bloodColor || '#a855f7',
      projectile: config.projectile || null,
      spawn: {
        minDay: 1,
        weight: 10,
        bloodMoonWeight: 10,
        minEggs: 0,
        ...(config.spawn || {})
      },
      loot: Array.isArray(config.loot) ? config.loot : null,
      desc: config.desc || ''
    };
    CONSTANTS.MONSTER_SPECIES[id] = normalized;
    return normalized;
  },

  /**
   * Register a new Item Type (Consumable, Armor, Weapon, Resource, Seed, Defense, Upgrade)
   * @param {string} id - Unique item ID (e.g., 'medkit_nano', 'helmet_titan')
   * @param {object} config - Item definition including optional declarative useEffect
   */
  registerItem(id, config) {
    if (!id || !config) return null;
    const normalized = {
      id,
      name: config.name || id,
      category: config.category || 'resource',
      icon: config.icon || id,
      maxStack: config.maxStack !== undefined ? config.maxStack : (
        (config.category === 'weapon' || config.category === 'armor' || config.category === 'upgrade') ? 1 : (CONSTANTS.MAX_STACK_SIZE || 99)
      ),
      desc: config.desc || '',
      ...config
    };
    CONSTANTS.ITEM_TYPES[id] = normalized;
    return normalized;
  },

  /**
   * Register a new Weapon
   * @param {string} weaponKey - Uppercase key (e.g., 'FLAMETHROWER')
   * @param {object} config - Weapon stats, skill1, skill2, and optional custom attack handlers
   */
  registerWeapon(weaponKey, config) {
    if (!weaponKey || !config) return null;
    const key = weaponKey.toUpperCase();
    CONSTANTS.WEAPONS[key] = {
      id: config.id || key.toLowerCase(),
      name: config.name || key,
      type: config.type || 'melee',
      color: config.color || '#38bdf8',
      baseDamage: config.baseDamage || 15,
      attackCooldown: config.attackCooldown || 0.4,
      range: config.range || 70,
      description: config.description || '',
      skill1: config.skill1 || { id: `${key.toLowerCase()}_s1`, name: 'Kỹ năng 1', key: 'Q', cooldown: 6.0, description: '' },
      skill2: config.skill2 || { id: `${key.toLowerCase()}_s2`, name: 'Kỹ năng 2', key: 'E', cooldown: 7.0, description: '' },
      ...config
    };
    return CONSTANTS.WEAPONS[key];
  },

  /**
   * Register a new Defensive Structure Type
   * @param {string} typeKey - Structure key (e.g., 'laser_tower')
   * @param {object} config - Structure configuration & tiers (Lv.1 -> Lv.3)
   */
  registerDefense(typeKey, config) {
    if (!typeKey || !config) return null;
    CONSTANTS.DEFENSE[typeKey] = {
      name: config.name || typeKey,
      maxHp: config.maxHp || 150,
      size: config.size || 32,
      blocksMovement: config.blocksMovement !== undefined ? config.blocksMovement : true,
      behavior: config.behavior || typeKey, // 'wall', 'trap', 'turret', 'mortar', or custom
      ...config
    };
    return CONSTANTS.DEFENSE[typeKey];
  },

  /**
   * Register a new Companion Pet Species
   */
  registerPet(speciesId, config) {
    if (!speciesId || !config) return null;
    CONSTANTS.PET_SPECIES[speciesId] = {
      id: speciesId,
      name: config.name || speciesId,
      role: config.role || 'Chiến Đấu & Hỗ Trợ',
      badgeIcon: config.badgeIcon || '🐾',
      color: config.color || '#38bdf8',
      sprite: config.sprite || speciesId,
      icon: config.icon || speciesId,
      attackRange: config.attackRange || 260,
      attackCooldown: config.attackCooldown || 0.85,
      damage: config.damage || 15,
      projectileType: config.projectileType || 'pet_arrow',
      hpRegenPerSec: config.hpRegenPerSec || 0,
      toxinCleansePerSec: config.toxinCleansePerSec || 0,
      statsBonus: config.statsBonus || { hp: 15, armor: 2, toxinResist: 10, speedBonus: 5 },
      desc: config.desc || '',
      ...config
    };
    return CONSTANTS.PET_SPECIES[speciesId];
  },

  /**
   * Register a Projectile Type
   */
  registerProjectile(typeId, config) {
    if (!typeId || !config) return null;
    if (!CONSTANTS.PROJECTILE_TYPES) CONSTANTS.PROJECTILE_TYPES = {};
    CONSTANTS.PROJECTILE_TYPES[typeId] = {
      id: typeId,
      targetGroup: config.targetGroup || 'monster', // 'monster' or 'player'
      radius: config.radius || 6,
      renderStyle: config.renderStyle || 'bolt',
      color: config.color || '#38bdf8',
      secondaryColor: config.secondaryColor || '#ffffff',
      ...config
    };
    return CONSTANTS.PROJECTILE_TYPES[typeId];
  },

  /**
   * Register a Crafting Recipe into a station ('LAB', 'FURNACE', 'WORKBENCH', 'WORKSHOP')
   */
  registerRecipe(stationKey, recipeConfig) {
    const group = stationKey.toUpperCase();
    if (!CONSTANTS.RECIPES[group]) {
      CONSTANTS.RECIPES[group] = [];
    }
    const existingIdx = CONSTANTS.RECIPES[group].findIndex(r => r.id === recipeConfig.id);
    if (existingIdx !== -1) {
      CONSTANTS.RECIPES[group][existingIdx] = recipeConfig;
    } else {
      CONSTANTS.RECIPES[group].push(recipeConfig);
    }
    return recipeConfig;
  },

  /**
   * Register a World Harvestable Resource Node Type
   */
  registerResourceNode(nodeType, config) {
    if (!nodeType || !config) return null;
    if (!CONSTANTS.RESOURCE_NODES) CONSTANTS.RESOURCE_NODES = {};
    CONSTANTS.RESOURCE_NODES[nodeType] = {
      type: nodeType,
      name: config.name || nodeType,
      dropItemId: config.dropItemId || 'stone',
      dropCount: config.dropCount || 1,
      hp: config.hp || 20,
      sprite: config.sprite || `obj_${nodeType}`,
      w: config.w || 44,
      h: config.h || 44,
      color: config.color || '#38bdf8',
      icon: config.icon || '⛏',
      tag: config.tag || config.name || nodeType,
      minimapColor: config.minimapColor || config.color || '#38bdf8',
      ...config
    };
    return CONSTANTS.RESOURCE_NODES[nodeType];
  }
};

if (typeof window !== 'undefined') {
  window.EventBus = EventBus;
  window.SpatialGrid = SpatialGrid;
  window.ObjectPool = ObjectPool;
  window.updateAndCompact = updateAndCompact;
  window.GameRegistry = GameRegistry;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventBus, SpatialGrid, ObjectPool, updateAndCompact, GameRegistry };
}
