
import { TileType, Weather, TimeOfDay, Item, NPC, DialogueNode, Tile, GameMap, EquipmentSlot, Stats, Skill, InteractableType, RaceData, ClassData, ItemRarity, ItemMaterial } from './types';

export const TILE_COLORS: Record<TileType, string> = {
  [TileType.GRASS]: 'bg-emerald-900',
  [TileType.FOREST]: 'bg-green-950',
  [TileType.MOUNTAIN]: 'bg-stone-700',
  [TileType.WATER]: 'bg-blue-900',
  [TileType.TOWN]: 'bg-amber-900',
  [TileType.DUNGEON]: 'bg-purple-950',
  [TileType.RUINS]: 'bg-stone-900',
  [TileType.VOID]: 'bg-black',
  [TileType.PORTAL]: 'bg-cyan-900',
  [TileType.WALL]: 'bg-slate-800',
  [TileType.FLOOR]: 'bg-orange-950',
};

export const TILE_ICONS: Record<TileType, string> = {
  [TileType.GRASS]: '·',
  [TileType.FOREST]: '♠',
  [TileType.MOUNTAIN]: '▲',
  [TileType.WATER]: '≈',
  [TileType.TOWN]: '⌂',
  [TileType.DUNGEON]: 'Ω',
  [TileType.RUINS]: 'Π',
  [TileType.VOID]: ' ',
  [TileType.PORTAL]: '🌀',
  [TileType.WALL]: '#',
  [TileType.FLOOR]: '.',
};

export const BASE_STATS: Stats = {
  strength: 10,
  dexterity: 10,
  intelligence: 10,
  constitution: 10,
  speed: 10,
  luck: 10
};

// --- Rarity & Material Data ---

export const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
    [ItemRarity.COMMON]: 1.0,
    [ItemRarity.UNCOMMON]: 1.2,
    [ItemRarity.RARE]: 1.5,
    [ItemRarity.EPIC]: 2.0,
    [ItemRarity.LEGENDARY]: 3.0
};

export const MATERIAL_STATS: Record<ItemMaterial, { name: string, baseValue: number, stats: Partial<Stats> }> = {
    [ItemMaterial.IRON]: { name: 'Iron', baseValue: 10, stats: { strength: 1 } },
    [ItemMaterial.STEEL]: { name: 'Steel', baseValue: 30, stats: { strength: 3 } },
    [ItemMaterial.MITHRIL]: { name: 'Mithril', baseValue: 80, stats: { strength: 2, intelligence: 4, speed: 2 } },
    [ItemMaterial.ADAMANTITE]: { name: 'Adamantite', baseValue: 150, stats: { constitution: 5, strength: 5 } },
    [ItemMaterial.WOOD]: { name: 'Wooden', baseValue: 5, stats: { intelligence: 1 } },
    [ItemMaterial.OBSIDIAN]: { name: 'Obsidian', baseValue: 60, stats: { strength: 4, dexterity: -2 } },
    [ItemMaterial.DRAGON_BONE]: { name: 'Dragonbone', baseValue: 300, stats: { strength: 8, intelligence: 5 } },
    [ItemMaterial.CLOTH]: { name: 'Cloth', baseValue: 5, stats: { speed: 1 } },
    [ItemMaterial.SILK]: { name: 'Silk', baseValue: 20, stats: { intelligence: 2, speed: 2 } },
    [ItemMaterial.LEATHER]: { name: 'Leather', baseValue: 15, stats: { dexterity: 2, speed: 1 } }
};

export const WEATHER_ICONS: Record<Weather, string> = {
  [Weather.CLEAR]: '☀',
  [Weather.RAIN]: '🌧',
  [Weather.STORM]: '⚡',
  [Weather.FOG]: '🌫',
};

export const TIME_ICONS: Record<TimeOfDay, string> = {
  [TimeOfDay.DAWN]: '🌅',
  [TimeOfDay.DAY]: '☀️',
  [TimeOfDay.DUSK]: '🌇',
  [TimeOfDay.NIGHT]: '🌙',
};

// --- Items ---

export const ITEMS: Record<string, Item> = {
  // Consumables
  'POTION_HP': { id: 'POTION_HP', name: 'Health Potion', type: 'CONSUMABLE', value: 10, description: 'Restores 50 HP', rarity: ItemRarity.COMMON },
  'POTION_MAX': { id: 'POTION_MAX', name: 'Max Potion', type: 'CONSUMABLE', value: 50, description: 'Fully restores HP', rarity: ItemRarity.RARE },
  'BREAD': { id: 'BREAD', name: 'Stale Bread', type: 'CONSUMABLE', value: 2, description: 'Restores 10 HP', rarity: ItemRarity.COMMON },
  'STEAK': { id: 'STEAK', name: 'Cooked Steak', type: 'CONSUMABLE', value: 15, description: 'Restores 30 HP', rarity: ItemRarity.UNCOMMON },
  'CHEESE': { id: 'CHEESE', name: 'Aged Cheese', type: 'CONSUMABLE', value: 8, description: 'Restores 20 HP', rarity: ItemRarity.COMMON },
  
  // Basic Weapons (Starters)
  'SWORD_IRON': { id: 'SWORD_IRON', name: 'Iron Sword', type: 'WEAPON', slot: EquipmentSlot.MAIN_HAND, value: 50, description: 'Standard infantry blade', damage: 5, stats: { strength: 2 }, rarity: ItemRarity.COMMON, material: ItemMaterial.IRON },
  'DAGGER_IRON': { id: 'DAGGER_IRON', name: 'Iron Dagger', type: 'WEAPON', slot: EquipmentSlot.MAIN_HAND, value: 40, description: 'Quick blade', damage: 3, stats: { dexterity: 3, speed: 2 }, rarity: ItemRarity.COMMON, material: ItemMaterial.IRON },
  'STAFF_WOOD': { id: 'STAFF_WOOD', name: 'Wooden Staff', type: 'WEAPON', slot: EquipmentSlot.MAIN_HAND, value: 40, description: 'Focus for mana', damage: 2, stats: { intelligence: 4 }, rarity: ItemRarity.COMMON, material: ItemMaterial.WOOD },
  'AXE_BATTLE': { id: 'AXE_BATTLE', name: 'Battle Axe', type: 'WEAPON', slot: EquipmentSlot.MAIN_HAND, value: 55, description: 'Double-bitted axe', damage: 8, stats: { strength: 4, speed: -2 }, rarity: ItemRarity.COMMON, material: ItemMaterial.IRON },
  'MACE_IRON': { id: 'MACE_IRON', name: 'Iron Mace', type: 'WEAPON', slot: EquipmentSlot.MAIN_HAND, value: 45, description: 'Heavy crusher', damage: 6, stats: { strength: 3, speed: -1 }, rarity: ItemRarity.COMMON, material: ItemMaterial.IRON },
  
  // Basic Armor (Starters)
  'SHIELD_WOOD': { id: 'SHIELD_WOOD', name: 'Wooden Shield', type: 'ARMOR', slot: EquipmentSlot.OFF_HAND, value: 30, description: 'Basic protection', defense: 2, rarity: ItemRarity.COMMON, material: ItemMaterial.WOOD },
  'HELMET_LEATHER': { id: 'HELMET_LEATHER', name: 'Leather Cap', type: 'ARMOR', slot: EquipmentSlot.HEAD, value: 25, description: 'Light head protection', defense: 1, rarity: ItemRarity.COMMON, material: ItemMaterial.LEATHER },
  'ARMOR_LEATHER': { id: 'ARMOR_LEATHER', name: 'Leather Vest', type: 'ARMOR', slot: EquipmentSlot.BODY, value: 50, description: 'Light body armor', defense: 3, rarity: ItemRarity.COMMON, material: ItemMaterial.LEATHER },
  'BOOTS_LEATHER': { id: 'BOOTS_LEATHER', name: 'Leather Boots', type: 'ARMOR', slot: EquipmentSlot.FEET, value: 25, description: 'Sturdy boots', defense: 1, stats: { speed: 1 }, rarity: ItemRarity.COMMON, material: ItemMaterial.LEATHER },
  
  // Misc
  'GIFT_FLOWER': { id: 'GIFT_FLOWER', name: 'Wildflower', type: 'MISC', value: 5, description: 'A pretty flower. Good for gifting.', rarity: ItemRarity.COMMON },
  'RAT_TAIL': { id: 'RAT_TAIL', name: 'Rat Tail', type: 'MISC', value: 1, description: 'Proof of a kill.', rarity: ItemRarity.COMMON },
  'WOLF_PELT': { id: 'WOLF_PELT', name: 'Wolf Pelt', type: 'MISC', value: 15, description: 'Warm fur.', rarity: ItemRarity.UNCOMMON },
  'GOBLIN_EAR': { id: 'GOBLIN_EAR', name: 'Goblin Ear', type: 'MISC', value: 5, description: 'A grotesque trophy.', rarity: ItemRarity.COMMON },
  'MAGIC_DUST': { id: 'MAGIC_DUST', name: 'Magic Dust', type: 'MISC', value: 25, description: 'Sparkling residue.', rarity: ItemRarity.RARE },
  'BONE_SHARD': { id: 'BONE_SHARD', name: 'Bone Shard', type: 'MISC', value: 3, description: 'Fragment of a skeleton.', rarity: ItemRarity.COMMON },
};

// --- Data Registries ---

export const SKILLS: Record<string, Skill> = {
  'POWER_SLASH': {
    id: 'POWER_SLASH', name: 'Power Slash', description: 'A heavy strike dealing 150% Physical damage.', mpCost: 5, cooldown: 3, type: 'ACTIVE'
  },
  'FIREBALL': {
    id: 'FIREBALL', name: 'Fireball', description: 'Launch a ball of fire dealing 180% Magic damage.', mpCost: 10, cooldown: 2, type: 'ACTIVE'
  },
  'SHADOW_STRIKE': {
    id: 'SHADOW_STRIKE', name: 'Shadow Strike', description: 'A lethal strike with +30% Crit Chance.', mpCost: 8, cooldown: 4, type: 'ACTIVE'
  },
  'HOLY_LIGHT': {
    id: 'HOLY_LIGHT', name: 'Holy Light', description: 'Restores HP based on Intelligence.', mpCost: 15, cooldown: 4, type: 'ACTIVE'
  },
  'RECKLESS_BLOW': {
    id: 'RECKLESS_BLOW', name: 'Reckless Blow', description: 'Deal 250% damage but take 10% max HP recoil.', mpCost: 5, cooldown: 2, type: 'ACTIVE'
  }
};

export const RACES: Record<string, RaceData> = {
    'Human': {
        id: 'Human', name: 'Human', description: 'Versatile and ambitious.',
        passiveName: 'Adaptive', passiveDescription: 'Gains 10% more Experience.',
        baseStats: { ...BASE_STATS, luck: 12, constitution: 12 }
    },
    'Elf': {
        id: 'Elf', name: 'Elf', description: 'Agile and magically attuned.',
        passiveName: 'Nature\'s Grace', passiveDescription: 'Has +10% Evasion.',
        baseStats: { ...BASE_STATS, dexterity: 14, intelligence: 14, speed: 12, constitution: 8 }
    },
    'Orc': {
        id: 'Orc', name: 'Orc', description: 'Brutal and resilient.',
        passiveName: 'Bloodlust', passiveDescription: 'Deal 20% more damage when HP is below 50%.',
        baseStats: { ...BASE_STATS, strength: 15, constitution: 14, intelligence: 6 }
    },
    'Dwarf': {
        id: 'Dwarf', name: 'Dwarf', description: 'Stout and unyielding.',
        passiveName: 'Iron Skin', passiveDescription: 'Reduces all incoming damage by 2 (min 1).',
        baseStats: { ...BASE_STATS, constitution: 16, strength: 12, speed: 8 }
    },
    'Halfling': {
        id: 'Halfling', name: 'Halfling', description: 'Small and incredibly lucky.',
        passiveName: 'Lucky Streak', passiveDescription: '+15% Critical Hit Chance.',
        baseStats: { ...BASE_STATS, luck: 18, dexterity: 14, strength: 6 }
    }
};

export const CLASSES: Record<string, ClassData> = {
    'Warrior': {
        id: 'Warrior', name: 'Warrior', description: 'A master of melee combat.',
        skillId: 'POWER_SLASH',
        baseStats: { ...BASE_STATS, strength: 4, constitution: 2 },
        startingItems: ['SWORD_IRON', 'ARMOR_LEATHER']
    },
    'Mage': {
        id: 'Mage', name: 'Mage', description: 'A scholar of arcane arts.',
        skillId: 'FIREBALL',
        baseStats: { ...BASE_STATS, intelligence: 5, mp: 20 } as any, // mp hack
        startingItems: ['STAFF_WOOD', 'ARMOR_LEATHER']
    },
    'Rogue': {
        id: 'Rogue', name: 'Rogue', description: 'A stealthy striker.',
        skillId: 'SHADOW_STRIKE',
        baseStats: { ...BASE_STATS, dexterity: 4, speed: 3 },
        startingItems: ['DAGGER_IRON', 'ARMOR_LEATHER']
    },
    'Cleric': {
        id: 'Cleric', name: 'Cleric', description: 'A holy healer.',
        skillId: 'HOLY_LIGHT',
        baseStats: { ...BASE_STATS, intelligence: 3, constitution: 3 },
        startingItems: ['MACE_IRON', 'ARMOR_LEATHER']
    },
    'Berserker': {
        id: 'Berserker', name: 'Berserker', description: 'A raging fighter who ignores pain.',
        skillId: 'RECKLESS_BLOW',
        baseStats: { ...BASE_STATS, strength: 6, speed: 2, constitution: -2 },
        startingItems: ['AXE_BATTLE', 'ARMOR_LEATHER']
    }
};

// --- Enemy Data ---
export const ENEMY_TEMPLATES: Partial<Record<TileType, Array<{
    name: string, 
    stats: Stats, 
    lootTable: { itemId: string, chance: number }[],
    race?: string 
}>>> = {
    [TileType.GRASS]: [
        { name: 'Wild Dog', stats: { ...BASE_STATS, strength: 6, speed: 10, constitution: 8 }, lootTable: [{ itemId: 'RAT_TAIL', chance: 0.5 }] },
        { name: 'Goblin Scout', stats: { ...BASE_STATS, strength: 7, dexterity: 10, constitution: 8 }, lootTable: [{ itemId: 'GOBLIN_EAR', chance: 0.3 }, { itemId: 'DAGGER_IRON', chance: 0.05 }] }
    ],
    [TileType.FOREST]: [
        { name: 'Dire Wolf', stats: { ...BASE_STATS, strength: 10, speed: 12, constitution: 9 }, lootTable: [{ itemId: 'WOLF_PELT', chance: 0.4 }] },
        { name: 'Bandit', stats: { ...BASE_STATS, strength: 9, constitution: 10, dexterity: 8 }, lootTable: [{ itemId: 'BREAD', chance: 0.3 }, { itemId: 'POTION_HP', chance: 0.1 }], race: 'Human' },
        { name: 'Giant Spider', stats: { ...BASE_STATS, dexterity: 12, speed: 12, constitution: 8 }, lootTable: [] }
    ],
    [TileType.MOUNTAIN]: [
        { name: 'Rock Golem', stats: { ...BASE_STATS, strength: 14, constitution: 15, speed: 3 }, lootTable: [] },
        { name: 'Harpy', stats: { ...BASE_STATS, dexterity: 12, speed: 14, constitution: 9 }, lootTable: [{ itemId: 'GIFT_FLOWER', chance: 0.2 }] }
    ],
    [TileType.RUINS]: [
        { name: 'Skeleton', stats: { ...BASE_STATS, strength: 9, constitution: 7, speed: 8 }, lootTable: [{ itemId: 'BONE_SHARD', chance: 0.6 }, { itemId: 'SWORD_IRON', chance: 0.02 }] },
        { name: 'Animated Armor', stats: { ...BASE_STATS, constitution: 14, strength: 11, speed: 5 }, lootTable: [{ itemId: 'HELMET_LEATHER', chance: 0.05 }] }
    ],
    [TileType.DUNGEON]: [
        { name: 'Dark Mage', stats: { ...BASE_STATS, intelligence: 14, strength: 4, constitution: 8 }, lootTable: [{ itemId: 'MAGIC_DUST', chance: 0.5 }, { itemId: 'STAFF_WOOD', chance: 0.1 }], race: 'Human' },
        { name: 'Slime', stats: { ...BASE_STATS, constitution: 18, speed: 4, strength: 8 }, lootTable: [{ itemId: 'POTION_HP', chance: 0.2 }] }
    ],
    [TileType.WATER]: [
        { name: 'Giant Crab', stats: { ...BASE_STATS, constitution: 14, strength: 10, speed: 6 }, lootTable: [] }
    ]
};


// --- Dialogue ---

export const DIALOGUE_TREE: Record<string, DialogueNode> = {
  'mayor_intro': {
    id: 'mayor_intro',
    text: (p, n) => `Welcome to Cavanon, traveler. I am ${n.name}, the Mayor here. You look like you've seen some rough roads.`,
    options: [
      { text: "Any work available?", nextId: 'mayor_work' },
      { text: "Just passing through.", nextId: 'mayor_neutral' },
      { text: "[Gift Wildflower] Here, for the town.", requirement: (p) => p.inventory.some(i => i.id === 'GIFT_FLOWER'), nextId: 'mayor_happy', effect: (p, n) => { n.affinity += 10; p.inventory = p.inventory.filter(i => i.id !== 'GIFT_FLOWER'); } }
    ]
  },
  'mayor_neutral': {
    id: 'mayor_neutral',
    text: () => "Very well. Keep your weapon sheathed and we won't have problems.",
    options: [{ text: "Understood.", nextId: undefined }]
  },
  'mayor_work': {
    id: 'mayor_work',
    text: () => "There is always work for those willing to bleed. I can assign you a task if you're ready.",
    options: [
      { text: "Give me a quest.", action: 'GENERATE_QUEST', nextId: undefined },
      { text: "Maybe later.", nextId: undefined }
    ]
  },
  'mayor_happy': {
    id: 'mayor_happy',
    text: () => "Oh! How thoughtful! You are a friend to Cavanon.",
    options: [{ text: "Glad you like it.", nextId: undefined }]
  },
  'merchant_intro': {
    id: 'merchant_intro',
    text: (p, n) => n.affinity > 20 ? "Ah, my favorite customer! What can I get you?" : "Coins on the counter. No loitering.",
    options: [
      { text: "Trade.", action: 'OPEN_SHOP', nextId: undefined },
      { text: "Heard any rumors?", nextId: 'merchant_rumor' }
    ]
  },
  'merchant_rumor': {
    id: 'merchant_rumor',
    text: () => "They say the fog in the east makes people forget their own names...",
    options: [{ text: "Creepy.", nextId: undefined }]
  },
  'guard_intro': {
    id: 'guard_intro',
    text: (p, n) => p.reputation < 0 ? "Watch it, scum. I've got my eye on you." : "Move along, citizen.",
    options: [
      { text: "Just leaving.", nextId: undefined },
      { text: "[Bribe 10g] Look the other way.", requirement: (p) => p.gold >= 10, nextId: 'guard_bribe', effect: (p, n) => { p.gold -= 10; n.affinity += 5; } }
    ]
  },
  'guard_bribe': {
    id: 'guard_bribe',
    text: () => "*Coughs and pockets the coin* I didn't see anything.",
    options: [{ text: "Good.", nextId: undefined }]
  },
  // Specialized Shop Dialogues
  'blacksmith_intro': {
      id: 'blacksmith_intro',
      text: () => "Steel and iron, forged in fire. Best blades in the kingdom.",
      options: [{ text: "Show me your weapons.", action: 'OPEN_SHOP', nextId: undefined }, { text: "Leaving.", nextId: undefined }]
  },
  'armorer_intro': {
      id: 'armorer_intro',
      text: () => "Don't go out there without protection. My armor has saved many lives.",
      options: [{ text: "I need armor.", action: 'OPEN_SHOP', nextId: undefined }, { text: "Leaving.", nextId: undefined }]
  },
  'alchemist_intro': {
      id: 'alchemist_intro',
      text: () => "Brewing... bubbling... Ah! A customer? Care for a draught?",
      options: [{ text: "What potions do you have?", action: 'OPEN_SHOP', nextId: undefined }, { text: "No thanks.", nextId: undefined }]
  },
  'baker_intro': {
      id: 'baker_intro',
      text: () => "Fresh bread! Warm pies! Don't adventure on an empty stomach!",
      options: [{ text: "Something to eat.", action: 'OPEN_SHOP', nextId: undefined }, { text: "Smells good.", nextId: undefined }]
  },
  'innkeeper_city_intro': {
      id: 'innkeeper_city_intro',
      text: () => "Welcome to the Gilded Rest. We have the softest beds in the city.",
      options: [
          { text: "I'd like to rest. (20g)", requirement: (p) => p.gold >= 20, nextId: undefined, effect: (p) => { p.gold -= 20; }, action: 'REST' },
          { text: "Just looking.", nextId: undefined }
      ]
  }
};

// --- NPCs ---

export const NPC_TEMPLATES: NPC[] = [
  {
    id: 'npc_mayor',
    name: 'Mayor Eldrin',
    role: 'Mayor',
    race: 'Human',
    affinity: 50,
    description: 'An elderly man with a weary but kind face.',
    inventory: [],
    dialogueRoot: 'mayor_intro',
    memory: [],
    mapId: 'starter_village',
    schedule: {
      [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'watching the sunrise' },
      [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'managing town affairs' },
      [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'lighting the lamps' },
      [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'sleeping' },
    },
    isQuestGiver: true
  },
  {
    id: 'npc_merchant',
    name: 'Sila the Trader',
    role: 'General Merchant',
    race: 'Elf',
    affinity: 40,
    description: 'A sharp-eyed elf surrounded by wares.',
    inventory: [
        ITEMS['POTION_HP'], 
        ITEMS['BREAD'], 
        ITEMS['GIFT_FLOWER'], 
        ITEMS['HELMET_LEATHER'], 
        ITEMS['SWORD_IRON'], 
        ITEMS['SHIELD_WOOD']
    ],
    dialogueRoot: 'merchant_intro',
    memory: [],
    mapId: 'starter_village',
    schedule: {
      [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'setting up her stall' },
      [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'selling goods' },
      [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'packing up' },
      [TimeOfDay.NIGHT]: { tileType: TileType.GRASS, description: 'camping nearby' }, 
    },
    isMerchant: true
  },
  {
    id: 'npc_guard',
    name: 'Sergeant Kael',
    role: 'Guard',
    race: 'Orc',
    affinity: 30,
    description: 'A hulking orc in rusted chainmail.',
    inventory: [],
    dialogueRoot: 'guard_intro',
    memory: [],
    mapId: 'starter_village',
    schedule: {
      [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'patrolling the gates' },
      [TimeOfDay.DAY]: { tileType: TileType.FOREST, description: 'patrolling the woods' },
      [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'returning from patrol' },
      [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'guarding the inn' },
    }
  },
  // NEW CITY NPCs
  {
    id: 'npc_blacksmith',
    name: 'Grom the Hammer',
    role: 'Weapon Smith',
    race: 'Dwarf',
    affinity: 40,
    description: 'A soot-covered dwarf pounding red-hot steel.',
    inventory: [], // Will be filled procedurally
    dialogueRoot: 'blacksmith_intro',
    memory: [],
    mapId: 'capital_city',
    schedule: {
        [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'stoking the forge' },
        [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'forging weapons' },
        [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'sharpening blades' },
        [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'sleeping' },
    },
    isMerchant: true
  },
  {
    id: 'npc_armorer',
    name: 'Thalia Ironheart',
    role: 'Armor Smith',
    race: 'Human',
    affinity: 40,
    description: 'A stern woman inspecting a breastplate.',
    inventory: [], // Will be filled procedurally
    dialogueRoot: 'armorer_intro',
    memory: [],
    mapId: 'capital_city',
    schedule: {
        [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'opening shop' },
        [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'polishing armor' },
        [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'taking inventory' },
        [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'sleeping' },
    },
    isMerchant: true
  },
  {
    id: 'npc_alchemist',
    name: 'Lysara of the Mist',
    role: 'Potion Alchemist',
    race: 'Elf',
    affinity: 40,
    description: 'An ethereal elf surrounded by strange fumes.',
    inventory: [ITEMS['POTION_HP'], ITEMS['POTION_MAX'], ITEMS['MAGIC_DUST']],
    dialogueRoot: 'alchemist_intro',
    memory: [],
    mapId: 'capital_city',
    schedule: {
        [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'gathering herbs' },
        [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'brewing potions' },
        [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'bottling elixirs' },
        [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'meditating' },
    },
    isMerchant: true
  },
  {
    id: 'npc_baker',
    name: 'Barnaby Bun',
    role: 'Food Merchant',
    race: 'Halfling',
    affinity: 60,
    description: 'A cheerful halfling covered in flour.',
    inventory: [ITEMS['BREAD'], ITEMS['CHEESE'], ITEMS['STEAK']],
    dialogueRoot: 'baker_intro',
    memory: [],
    mapId: 'capital_city',
    schedule: {
        [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'baking bread' },
        [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'selling pastries' },
        [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'cleaning ovens' },
        [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'sleeping' },
    },
    isMerchant: true
  },
  {
    id: 'npc_innkeeper_city',
    name: 'Olin Keeper',
    role: 'Innkeeper',
    race: 'Human',
    affinity: 50,
    description: 'A welcoming man with a clean apron.',
    inventory: [],
    dialogueRoot: 'innkeeper_city_intro',
    memory: [],
    mapId: 'capital_city',
    schedule: {
        [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'cleaning rooms' },
        [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'managing the inn' },
        [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'serving guests' },
        [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'checking logs' },
    }
  }
];

// --- Map Generators ---

export const generatePlayerHome = (): GameMap => {
    const size = 10;
    const map: Tile[][] = [];
    
    for (let y = 0; y < size; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < size; x++) {
            // Create walls around the edges
            let type = (x === 0 || x === size - 1 || y === 0 || y === size - 1) ? TileType.WALL : TileType.FLOOR;
            const tile: Tile = { x, y, type, explored: true, npcs: [] }; // Home is always explored
            row.push(tile);
        }
        map.push(row);
    }

    // Add Exit
    map[size-1][Math.floor(size/2)].type = TileType.PORTAL;
    map[size-1][Math.floor(size/2)].portalTarget = {
        mapId: 'starter_village',
        x: 10,
        y: 10,
        desc: "Leave Home"
    };

    // Add Bed
    map[2][2].interactable = { type: InteractableType.BED };
    
    // Add Storage Chest
    map[2][size-3].interactable = { type: InteractableType.STORAGE };

    return { id: 'player_home', name: "Player's Home", width: size, height: size, tiles: map };
};

export const generateVillage = (): GameMap => {
  const size = 15;
  const map: Tile[][] = [];
  const centerX = Math.floor(size / 2); // 7
  const centerY = Math.floor(size / 2); // 7
  
  for (let y = 0; y < size; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < size; x++) {
      let type = TileType.GRASS;
      
      const dx = x - size/2;
      const dy = y - size/2;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < 4) type = TileType.TOWN;
      else if (dist > 6) type = TileType.FOREST;
      
      if (Math.abs(dx) < 1 || Math.abs(dy) < 1) type = TileType.TOWN;

      // Force all tiles explored
      row.push({ x, y, type, explored: true, npcs: [] });
    }
    map.push(row);
  }

  // --- Place NPCs specifically ---
  // Mayor in the Center
  if (map[centerY][centerX]) map[centerY][centerX].npcs.push('npc_mayor');
  
  // Trader to the West (Market Stall)
  if (map[centerY][centerX - 2]) map[centerY][centerX - 2].npcs.push('npc_merchant');

  // Guard to the East (Gate)
  if (map[centerY][centerX + 2]) map[centerY][centerX + 2].npcs.push('npc_guard');


  // Player Home Entrance
  map[10][10].type = TileType.PORTAL;
  map[10][10].portalTarget = {
      mapId: 'player_home',
      x: 5,
      y: 8,
      desc: "Enter Home"
  };

  // Portal to World Map
  const exitY = Math.floor(size / 2);
  const exitX = size - 1;
  map[exitY][exitX].type = TileType.PORTAL;
  map[exitY][exitX].portalTarget = {
    mapId: 'world_map',
    x: 40, 
    y: 40,
    desc: "Enter the Wilderness"
  };

  return { id: 'starter_village', name: 'Oakhaven Village', width: size, height: size, tiles: map };
};

export const generateCity = (): GameMap => {
    const size = 25;
    const map: Tile[][] = [];
    const cx = Math.floor(size/2);
    const cy = Math.floor(size/2);
    
    for (let y = 0; y < size; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < size; x++) {
        // Basic Terrain: Stone/Town
        let type = TileType.TOWN;
        
        // Walls
        if (x === 0 || x === size - 1 || y === 0 || y === size - 1) type = TileType.WALL;
        
        // Paved Roads
        if (x === cx || y === cy) type = TileType.FLOOR;
  
        // Central Plaza
        if (Math.abs(x - cx) < 3 && Math.abs(y - cy) < 3) type = TileType.FLOOR;
  
        row.push({ x, y, type, explored: true, npcs: [] });
      }
      map.push(row);
    }
  
    // --- Place NPCs specifically in the Plaza Corners ---
    // Blacksmith (Top Left of Plaza)
    map[cy - 2][cx - 2].npcs.push('npc_blacksmith');
    
    // Armorer (Top Right of Plaza)
    map[cy - 2][cx + 2].npcs.push('npc_armorer');

    // Alchemist (Bottom Left of Plaza)
    map[cy + 2][cx - 2].npcs.push('npc_alchemist');

    // Baker (Bottom Right of Plaza)
    map[cy + 2][cx + 2].npcs.push('npc_baker');

    // Innkeeper (North of Plaza)
    map[cy - 3][cx].npcs.push('npc_innkeeper_city');


    // Portal to World Map
    const exitX = Math.floor(size / 2);
    const exitY = size - 2;
    map[exitY][exitX].type = TileType.PORTAL;
    map[exitY][exitX].portalTarget = {
      mapId: 'world_map',
      x: 60, // Near the mountains
      y: 60,
      desc: "Leave City"
    };

    return { id: 'capital_city', name: 'High King\'s City', width: size, height: size, tiles: map };
};

export const generateWorldMap = (): GameMap => {
  const size = 80; // Large World Map
  const map: Tile[][] = [];
  const centerX = size / 2;
  const centerY = size / 2;

  for (let y = 0; y < size; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < size; x++) {
      // Distance from center for Continent Shape
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const noise1 = Math.sin(x * 0.1) * 5 + Math.cos(y * 0.15) * 5;
      const noise2 = Math.sin((x + y) * 0.05) * 10;
      
      const elevation = (size / 2) - dist + noise1 + noise2;

      let type = TileType.WATER;

      if (elevation > 5) {
          // Landmass logic
          if (elevation > 35) type = TileType.MOUNTAIN; // High Peaks
          else if (elevation > 28) type = TileType.RUINS; // Rocky/Ancient
          else if (elevation > 20) type = TileType.FOREST; // Dense Forests
          else type = TileType.GRASS; // Plains/Coasts
          
          // Random patches
          if (type === TileType.GRASS && Math.random() < 0.1) type = TileType.FOREST;
      }

      // Force map boundaries to be water
      if (x < 2 || x > size - 3 || y < 2 || y > size - 3) type = TileType.WATER;

      // Force all tiles explored
      row.push({ x, y, type, explored: true, npcs: [] });
    }
    map.push(row);
  }

  // Portal back to Village (Placed in a safe central-ish area)
  const entryY = 40;
  const entryX = 40;
  
  // Create a safe landing zone for village
  for(let dy=-1; dy<=1; dy++){
      for(let dx=-1; dx<=1; dx++){
          if (map[entryY+dy] && map[entryY+dy][entryX+dx]) {
              map[entryY+dy][entryX+dx].type = TileType.GRASS;
          }
      }
  }

  map[entryY][entryX].type = TileType.PORTAL;
  map[entryY][entryX].portalTarget = {
    mapId: 'starter_village',
    x: 13,
    y: 7, 
    desc: "Return to Oakhaven"
  };

  // Portal to Capital City (Placed near mountains)
  const cityY = 60;
  const cityX = 60;
  
  // Create safe landing zone for city
  for(let dy=-1; dy<=1; dy++){
      for(let dx=-1; dx<=1; dx++){
          if (map[cityY+dy] && map[cityY+dy][cityX+dx]) {
              map[cityY+dy][cityX+dx].type = TileType.MOUNTAIN;
          }
      }
  }
  
  map[cityY][cityX].type = TileType.PORTAL;
  map[cityY][cityX].portalTarget = {
      mapId: 'capital_city',
      x: 12,
      y: 23,
      desc: "Enter High King's City"
  };

  return { id: 'world_map', name: 'The Wildlands', width: size, height: size, tiles: map };
};
