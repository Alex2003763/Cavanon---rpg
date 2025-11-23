

import { TileType, Weather, TimeOfDay, Item, NPC, DialogueNode, Tile, GameMap, EquipmentSlot, Stats, Skill, InteractableType, RaceData, ClassData, ItemRarity, ItemMaterial } from './types';
import { addToInventory } from './utils';

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

export const TILE_HEX_COLORS: Record<TileType, string> = {
  [TileType.GRASS]: '#064e3b', 
  [TileType.FOREST]: '#052e16',
  [TileType.MOUNTAIN]: '#44403c',
  [TileType.WATER]: '#1e3a8a',
  [TileType.TOWN]: '#78350f',
  [TileType.DUNGEON]: '#3b0764',
  [TileType.RUINS]: '#1c1917',
  [TileType.VOID]: '#000000',
  [TileType.PORTAL]: '#164e63',
  [TileType.WALL]: '#1e293b',
  [TileType.FLOOR]: '#431407',
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
  'PEARL': { id: 'PEARL', name: 'Shimmering Pearl', type: 'MISC', value: 50, description: 'A valuable gem from the sea.', rarity: ItemRarity.RARE },
  'IRON_ORE': { id: 'IRON_ORE', name: 'Iron Ore', type: 'MISC', value: 10, description: 'Raw iron.', rarity: ItemRarity.COMMON },
  
  // Basic Weapons (Starters)
  'SWORD_IRON': { id: 'SWORD_IRON', name: 'Iron Sword', type: 'WEAPON', slot: EquipmentSlot.MAIN_HAND, value: 50, description: 'Standard infantry blade', damage: 5, stats: { strength: 2 }, rarity: ItemRarity.COMMON, material: ItemMaterial.IRON },
  'DAGGER_IRON': { id: 'DAGGER_IRON', name: 'Iron Dagger', type: 'WEAPON', slot: EquipmentSlot.MAIN_HAND, value: 40, description: 'Quick blade', damage: 3, stats: { dexterity: 3, speed: 2 }, rarity: ItemRarity.COMMON, material: ItemMaterial.IRON, effects: [{ type: 'BLEED_CHANCE', value: 0.15 }] },
  'STAFF_WOOD': { id: 'STAFF_WOOD', name: 'Wooden Staff', type: 'WEAPON', slot: EquipmentSlot.MAIN_HAND, value: 40, description: 'Focus for mana', damage: 2, stats: { intelligence: 4 }, rarity: ItemRarity.COMMON, material: ItemMaterial.WOOD, effects: [{ type: 'MANA_STEAL', value: 0.05 }] },
  'AXE_BATTLE': { id: 'AXE_BATTLE', name: 'Battle Axe', type: 'WEAPON', slot: EquipmentSlot.MAIN_HAND, value: 55, description: 'Double-bitted axe', damage: 8, stats: { strength: 4, speed: -2 }, rarity: ItemRarity.COMMON, material: ItemMaterial.IRON, effects: [{ type: 'CRIT_DMG', value: 0.5 }] },
  'MACE_IRON': { id: 'MACE_IRON', name: 'Iron Mace', type: 'WEAPON', slot: EquipmentSlot.MAIN_HAND, value: 45, description: 'Heavy crusher', damage: 6, stats: { strength: 3, speed: -1 }, rarity: ItemRarity.COMMON, material: ItemMaterial.IRON, effects: [{ type: 'STUN_CHANCE', value: 0.1 }] },
  
  // Basic Armor (Starters)
  'SHIELD_WOOD': { id: 'SHIELD_WOOD', name: 'Wooden Shield', type: 'ARMOR', slot: EquipmentSlot.OFF_HAND, value: 30, description: 'Basic protection', defense: 2, rarity: ItemRarity.COMMON, material: ItemMaterial.WOOD, effects: [{ type: 'THORNS', value: 0.1 }] },
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
    id: 'POWER_SLASH', name: 'Power Slash', description: 'A heavy strike dealing 150% Physical damage. Chance to Stun.', mpCost: 5, cooldown: 3, type: 'ACTIVE',
    statusEffect: { type: 'STUN', chance: 0.3, duration: 1, value: 0 }
  },
  'FIREBALL': {
    id: 'FIREBALL', name: 'Fireball', description: 'Launch a ball of fire dealing 180% Magic damage. Chance to Burn.', mpCost: 10, cooldown: 2, type: 'ACTIVE',
    statusEffect: { type: 'BURN', chance: 0.4, duration: 3, value: 5 }
  },
  'SHADOW_STRIKE': {
    id: 'SHADOW_STRIKE', name: 'Shadow Strike', description: 'A lethal strike with +30% Crit Chance. Causes Bleeding.', mpCost: 8, cooldown: 4, type: 'ACTIVE',
    statusEffect: { type: 'BLEED', chance: 1.0, duration: 3, value: 5 }
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
        baseStats: { ...BASE_STATS, strength: 14, constitution: 12 },
        startingItems: ['SWORD_IRON', 'ARMOR_LEATHER']
    },
    'Mage': {
        id: 'Mage', name: 'Mage', description: 'A scholar of arcane arts.',
        skillId: 'FIREBALL',
        baseStats: { ...BASE_STATS, intelligence: 15 },
        startingItems: ['STAFF_WOOD', 'ARMOR_LEATHER']
    },
    'Rogue': {
        id: 'Rogue', name: 'Rogue', description: 'A stealthy striker.',
        skillId: 'SHADOW_STRIKE',
        baseStats: { ...BASE_STATS, dexterity: 14, speed: 13 },
        startingItems: ['DAGGER_IRON', 'ARMOR_LEATHER']
    },
    'Cleric': {
        id: 'Cleric', name: 'Cleric', description: 'A holy healer.',
        skillId: 'HOLY_LIGHT',
        baseStats: { ...BASE_STATS, intelligence: 13, constitution: 13 },
        startingItems: ['MACE_IRON', 'ARMOR_LEATHER']
    },
    'Berserker': {
        id: 'Berserker', name: 'Berserker', description: 'A raging fighter who ignores pain.',
        skillId: 'RECKLESS_BLOW',
        baseStats: { ...BASE_STATS, strength: 16, speed: 12, constitution: 8 },
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
        { name: 'Goblin Scout', stats: { ...BASE_STATS, strength: 7, dexterity: 10, constitution: 8 }, lootTable: [{ itemId: 'GOBLIN_EAR', chance: 0.3 }, { itemId: 'DAGGER_IRON', chance: 0.05 }] },
        { name: 'Giant Rat', stats: { ...BASE_STATS, strength: 4, speed: 12, constitution: 6 }, lootTable: [{ itemId: 'RAT_TAIL', chance: 0.8 }] },
        { name: 'Plains Boar', stats: { ...BASE_STATS, strength: 12, constitution: 12, speed: 8 }, lootTable: [{ itemId: 'STEAK', chance: 0.4 }] },
        { name: 'Slime', stats: { ...BASE_STATS, constitution: 15, strength: 5, speed: 4 }, lootTable: [{ itemId: 'POTION_HP', chance: 0.1 }] }
    ],
    [TileType.FOREST]: [
        { name: 'Dire Wolf', stats: { ...BASE_STATS, strength: 10, speed: 12, constitution: 9 }, lootTable: [{ itemId: 'WOLF_PELT', chance: 0.4 }] },
        { name: 'Bandit', stats: { ...BASE_STATS, strength: 9, constitution: 10, dexterity: 8 }, lootTable: [{ itemId: 'BREAD', chance: 0.3 }, { itemId: 'POTION_HP', chance: 0.1 }], race: 'Human' },
        { name: 'Giant Spider', stats: { ...BASE_STATS, dexterity: 12, speed: 12, constitution: 8 }, lootTable: [{ itemId: 'SILK', chance: 0.4 }] },
        { name: 'Treant Sapling', stats: { ...BASE_STATS, strength: 14, constitution: 16, speed: 4 }, lootTable: [{ itemId: 'STAFF_WOOD', chance: 0.1 }] },
        { name: 'Bear', stats: { ...BASE_STATS, strength: 16, constitution: 18, speed: 8 }, lootTable: [{ itemId: 'WOLF_PELT', chance: 0.5 }, { itemId: 'STEAK', chance: 0.5 }] }
    ],
    [TileType.MOUNTAIN]: [
        { name: 'Rock Golem', stats: { ...BASE_STATS, strength: 14, constitution: 15, speed: 3 }, lootTable: [{ itemId: 'IRON_ORE', chance: 0.3 }] },
        { name: 'Harpy', stats: { ...BASE_STATS, dexterity: 12, speed: 14, constitution: 9 }, lootTable: [{ itemId: 'GIFT_FLOWER', chance: 0.2 }] },
        { name: 'Wyvern Hatchling', stats: { ...BASE_STATS, strength: 16, speed: 14, constitution: 12 }, lootTable: [{ itemId: 'DRAGON_BONE', chance: 0.1 }] },
        { name: 'Stone Giant', stats: { ...BASE_STATS, strength: 20, constitution: 20, speed: 2 }, lootTable: [{ itemId: 'MACE_IRON', chance: 0.1 }] },
        { name: 'Troll', stats: { ...BASE_STATS, strength: 14, constitution: 18, speed: 6 }, lootTable: [{ itemId: 'POTION_HP', chance: 0.2 }] }
    ],
    [TileType.RUINS]: [
        { name: 'Skeleton', stats: { ...BASE_STATS, strength: 9, constitution: 7, speed: 8 }, lootTable: [{ itemId: 'BONE_SHARD', chance: 0.6 }, { itemId: 'SWORD_IRON', chance: 0.02 }] },
        { name: 'Animated Armor', stats: { ...BASE_STATS, constitution: 14, strength: 11, speed: 5 }, lootTable: [{ itemId: 'HELMET_LEATHER', chance: 0.05 }] },
        { name: 'Lich Apprentice', stats: { ...BASE_STATS, intelligence: 16, speed: 8 }, lootTable: [{ itemId: 'MAGIC_DUST', chance: 0.4 }] },
        { name: 'Gargoyle', stats: { ...BASE_STATS, constitution: 16, strength: 12, speed: 10 }, lootTable: [{ itemId: 'BONE_SHARD', chance: 0.3 }] },
        { name: 'Specter', stats: { ...BASE_STATS, dexterity: 15, intelligence: 14, constitution: 5 }, lootTable: [{ itemId: 'MAGIC_DUST', chance: 0.5 }] }
    ],
    [TileType.DUNGEON]: [
        { name: 'Dark Mage', stats: { ...BASE_STATS, intelligence: 14, strength: 4, constitution: 8 }, lootTable: [{ itemId: 'MAGIC_DUST', chance: 0.5 }, { itemId: 'STAFF_WOOD', chance: 0.1 }], race: 'Human' },
        { name: 'Giant Slime', stats: { ...BASE_STATS, constitution: 22, speed: 4, strength: 10 }, lootTable: [{ itemId: 'POTION_MAX', chance: 0.1 }] },
        { name: 'Minotaur', stats: { ...BASE_STATS, strength: 18, constitution: 18, speed: 10 }, lootTable: [{ itemId: 'AXE_BATTLE', chance: 0.2 }] },
        { name: 'Beholder Eye', stats: { ...BASE_STATS, intelligence: 20, dexterity: 15, constitution: 10 }, lootTable: [{ itemId: 'MAGIC_DUST', chance: 0.8 }] },
        { name: 'Rat King', stats: { ...BASE_STATS, strength: 12, speed: 16, constitution: 12 }, lootTable: [{ itemId: 'RAT_TAIL', chance: 1.0 }] }
    ],
    [TileType.WATER]: [
        { name: 'Giant Crab', stats: { ...BASE_STATS, constitution: 14, strength: 10, speed: 6 }, lootTable: [] },
        { name: 'Sea Serpent', stats: { ...BASE_STATS, strength: 15, speed: 12, constitution: 14 }, lootTable: [{ itemId: 'DRAGON_BONE', chance: 0.2 }] },
        { name: 'Drowned Sailor', stats: { ...BASE_STATS, strength: 10, constitution: 10, speed: 6 }, lootTable: [{ itemId: 'DAGGER_IRON', chance: 0.1 }] },
        { name: 'Siren', stats: { ...BASE_STATS, intelligence: 16, speed: 14, constitution: 8 }, lootTable: [{ itemId: 'PEARL', chance: 0.1 }] }
    ]
};


// --- Dialogue ---

export const DIALOGUE_TREE: Record<string, DialogueNode> = {
  'mayor_intro': {
    id: 'mayor_intro',
    text: (p, n) => {
        if (n.affinity > 70) return `Ah, ${p.name}! The hero of Oakhaven! What can I do for you today?`;
        if (n.affinity > 30) return `Welcome back, ${p.name}. Things are quiet, thankfully.`;
        if (p.race === 'Orc' && n.affinity < 20) return `(He eyes your tusks warily) We want no trouble here, Orc. State your business.`;
        return `Welcome to Cavanon, traveler. I am ${n.name}, the Mayor. You look like you've traveled far.`;
    },
    options: [
      { text: "Any work available?", nextId: 'mayor_work' },
      { text: "Tell me about this town's history.", nextId: 'mayor_history', requirement: (p, n) => n.affinity >= 20 },
      { text: "Just passing through.", nextId: 'mayor_neutral' },
      { text: "[Gift Wildflower] A gift for the town.", 
        requirement: (p) => p.inventory.some(i => i.id === 'GIFT_FLOWER'), 
        nextId: 'mayor_gift', 
        effect: (p, n) => { 
            n.affinity += 15; 
            const idx = p.inventory.findIndex(i => i.id === 'GIFT_FLOWER');
            if(idx > -1) {
                if(p.inventory[idx].quantity && p.inventory[idx].quantity! > 1) p.inventory[idx].quantity!--;
                else p.inventory.splice(idx, 1);
            }
        } 
      }
    ]
  },
  'mayor_gift': {
      id: 'mayor_gift',
      text: () => "A wildflower! These grow near the old shrine. It reminds me of my youth. Thank you, traveler.",
      options: [{ text: "You're welcome.", nextId: 'mayor_intro' }]
  },
  'mayor_history': {
      id: 'mayor_history',
      text: () => "Oakhaven was built on the ruins of an ancient elven outpost. Some say the cellars beneath the inn still connect to the old tunnels.",
      options: [
          { text: "Interesting. Tunnels?", nextId: 'mayor_tunnels' },
          { text: "Thanks for the lesson.", nextId: 'mayor_intro' }
      ]
  },
  'mayor_tunnels': {
      id: 'mayor_tunnels',
      text: () => "Yes, but they are sealed now. Too many rats... and worse things. Best left alone.",
      options: [{ text: "I'll keep that in mind.", nextId: 'mayor_intro' }]
  },
  'mayor_neutral': {
    id: 'mayor_neutral',
    text: () => "Very well. Keep your weapon sheathed and we won't have problems.",
    options: [{ text: "Understood.", nextId: undefined }]
  },
  'mayor_work': {
    id: 'mayor_work',
    text: () => "There is always work for those willing to bleed. Monsters encroach from the forest daily.",
    options: [
      { text: "Give me a quest.", action: 'GENERATE_QUEST', nextId: undefined },
      { text: "Maybe later.", nextId: 'mayor_intro' }
    ]
  },
  
  // MERCHANT
  'merchant_intro': {
    id: 'merchant_intro',
    text: (p, n) => {
        if (n.affinity > 80) return "My dearest friend! Please, look at my private reserve. Discounts for you, of course!";
        if (n.affinity > 40) return "Good to see a familiar face. Need supplies?";
        return "Coins on the counter. No loitering.";
    },
    options: [
      { text: "Show me your wares.", action: 'OPEN_SHOP', nextId: undefined },
      { text: "Heard any rumors?", nextId: 'merchant_rumor' },
      { text: "Let's chat for a bit.", nextId: 'merchant_chat', requirement: (p, n) => n.affinity < 50 },
      { text: "[Gift 50g] Invest in your business.", requirement: (p) => p.gold >= 50, nextId: 'merchant_invest', effect: (p, n) => { p.gold -= 50; n.affinity += 10; } },
      { text: "Do you have anything... special?", nextId: 'merchant_special', requirement: (p, n) => n.affinity >= 80 }
    ]
  },
  'merchant_chat': {
      id: 'merchant_chat',
      text: (p, n) => {
          const topics = ["The weather has been terrible lately.", "Trade routes are dangerous with all these goblins.", "I miss the grand markets of the capital."];
          return topics[Math.floor(Math.random() * topics.length)];
      },
      options: [{ text: "I see.", nextId: 'merchant_intro', effect: (p, n) => { if(Math.random() > 0.5) n.affinity += 2; } }]
  },
  'merchant_invest': {
      id: 'merchant_invest',
      text: () => "Oh! A silent partner? I assure you, this gold will go towards expanding our inventory. You won't regret this.",
      options: [{ text: "I expect results.", nextId: 'merchant_intro' }]
  },
  'merchant_special': {
      id: 'merchant_special',
      text: () => "Shh. Keep your voice down. Since you've been such a loyal patron... take this. It fell off a wagon.",
      options: [{ 
          text: "[Take Gift]", 
          nextId: 'merchant_intro', 
          effect: (p) => { 
              const gifts = [ITEMS['POTION_MAX'], ITEMS['MAGIC_DUST'], ITEMS['STEAK']];
              const gift = gifts[Math.floor(Math.random() * gifts.length)];
              p.inventory = addToInventory(p.inventory, gift, 1);
          } 
      }]
  },
  'merchant_rumor': {
    id: 'merchant_rumor',
    text: () => "They say the fog in the east makes people forget their own names... and I heard the Blacksmith in the city is looking for rare ores.",
    options: [{ text: "Good to know.", nextId: 'merchant_intro' }]
  },

  // GUARD
  'guard_intro': {
    id: 'guard_intro',
    text: (p, n) => {
        if (p.race === 'Orc') return "Kin. Keep your blade sharp. The humans are skittish today.";
        if (p.reputation < -10) return "One wrong move, scum, and you're in irons.";
        if (n.affinity > 20) return "Stay safe out there, citizen.";
        return "Move along. No trouble.";
    },
    options: [
      { text: "Just passing through.", nextId: undefined },
      { text: "Report a crime.", nextId: 'guard_crime' },
      { text: "Lok'tar. (Orc Greeting)", requirement: (p) => p.race === 'Orc', nextId: 'guard_orc', effect: (p, n) => { n.affinity += 5; } },
      { text: "[Bribe 20g] Look the other way.", requirement: (p) => p.gold >= 20, nextId: 'guard_bribe', effect: (p, n) => { 
          p.gold -= 20; 
          if(Math.random() > 0.5) n.affinity += 5; 
          else { n.affinity -= 5; p.reputation -= 5; }
      }}
    ]
  },
  'guard_orc': {
      id: 'guard_orc',
      text: () => "Strength and honor. If you find any good fights, save some for me.",
      options: [{ text: "I will.", nextId: 'guard_intro' }]
  },
  'guard_crime': {
      id: 'guard_crime',
      text: () => "Unless you have proof or a body, I don't want to hear it. Too much paperwork.",
      options: [{ text: "Nevermind.", nextId: 'guard_intro' }]
  },
  'guard_bribe': {
    id: 'guard_bribe',
    text: (p, n) => n.affinity >= 25 ? "*Coughs and pockets the coin* I saw nothing. Go." : "Are you trying to bribe an officer? Get out of my sight before I arrest you!",
    options: [{ text: "Leaving.", nextId: undefined }]
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
  'weaponsmith_intro': {
      id: 'weaponsmith_intro',
      text: () => "Sharpest steel in the city. If you want to kill it, I have the tool.",
      options: [{ text: "Show me your weapons.", action: 'OPEN_SHOP', nextId: undefined }, { text: "Just looking.", nextId: undefined }]
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
    id: 'npc_mayor', name: 'Mayor Arin', role: 'Mayor', race: 'Human', affinity: 20, description: 'The elected official of Oakhaven.', inventory: [], dialogueRoot: 'mayor_intro', memory: [], mapId: 'starter_village',
    schedule: { [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'Waking up' }, [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'Working at Hall' }, [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'Evening stroll' }, [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'Sleeping' } }
  },
  {
    id: 'npc_merchant', name: 'Garret', role: 'Merchant', race: 'Human', affinity: 10, description: 'A local trader.', inventory: [], dialogueRoot: 'merchant_intro', memory: [], mapId: 'starter_village', isMerchant: true,
    schedule: { [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'Opening Shop' }, [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'Trading' }, [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'Counting Coin' }, [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'Sleeping' } }
  },
  {
    id: 'npc_guard', name: 'Sgt. Pike', role: 'Guard', race: 'Human', affinity: 0, description: 'Village guard.', inventory: [], dialogueRoot: 'guard_intro', memory: [], mapId: 'starter_village',
    schedule: { [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'Patrol' }, [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'Gate Duty' }, [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'Patrol' }, [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'Off duty' } }
  },
  {
      id: 'npc_blacksmith', name: 'Korg', role: 'Blacksmith', race: 'Orc', affinity: 10, description: 'A master smith.', inventory: [], dialogueRoot: 'blacksmith_intro', memory: [], mapId: 'starter_village', isMerchant: true,
      schedule: { [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'Firing forge' }, [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'Smithing' }, [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'Cooling down' }, [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'Sleeping' } }
  },
  // City NPCs
  {
      id: 'npc_city_armorer', name: 'Gareth', role: 'Armorer', race: 'Human', affinity: 10, description: 'Sells heavy plate and shields.', inventory: [], dialogueRoot: 'armorer_intro', memory: [], mapId: 'capital_city', isMerchant: true,
      schedule: { [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'Polishing armor' }, [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'Selling wares' }, [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'Closing up' }, [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'Sleeping' } }
  },
  {
    id: 'npc_city_weaponsmith', name: 'Thane', role: 'Weaponsmith', race: 'Dwarf', affinity: 10, description: 'Surrounded by swords and axes.', inventory: [], dialogueRoot: 'weaponsmith_intro', memory: [], mapId: 'capital_city', isMerchant: true,
    schedule: { [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'Sharpening' }, [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'Selling weapons' }, [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'Cleaning' }, [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'Sleeping' } }
  },
  {
      id: 'npc_city_alchemist', name: 'Elara', role: 'Alchemist', race: 'Elf', affinity: 10, description: 'brews strange potions.', inventory: [], dialogueRoot: 'alchemist_intro', memory: [], mapId: 'capital_city', isMerchant: true,
      schedule: { [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'Gathering herbs' }, [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'Brewing' }, [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'Researching' }, [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'Trance' } }
  },
  {
      id: 'npc_city_baker', name: 'Pip', role: 'Baker', race: 'Halfling', affinity: 20, description: 'Smells of yeast and sugar.', inventory: [], dialogueRoot: 'baker_intro', memory: [], mapId: 'capital_city', isMerchant: true,
      schedule: { [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'Baking bread' }, [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'Selling pies' }, [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'Cleaning flour' }, [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'Sleeping' } }
  },
  {
      id: 'npc_city_innkeeper', name: 'Bess', role: 'Innkeeper', race: 'Human', affinity: 15, description: 'Runs the Gilded Rest.', inventory: [], dialogueRoot: 'innkeeper_city_intro', memory: [], mapId: 'capital_city',
      schedule: { [TimeOfDay.DAWN]: { tileType: TileType.TOWN, description: 'Preparing breakfast' }, [TimeOfDay.DAY]: { tileType: TileType.TOWN, description: 'Cleaning rooms' }, [TimeOfDay.DUSK]: { tileType: TileType.TOWN, description: 'Serving drinks' }, [TimeOfDay.NIGHT]: { tileType: TileType.TOWN, description: 'Working late' } }
  }
];
