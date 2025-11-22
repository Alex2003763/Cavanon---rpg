
import { Player, Stats, TileType, Weather, TimeOfDay, NPC, DerivedStats, Enemy, Quest, QuestType, QuestStatus, Item, EquipmentSlot, ItemRarity, ItemMaterial, StatusEffect, GameDate } from './types';
import { ENEMY_TEMPLATES, BASE_STATS, SKILLS, CLASSES, RACES, ITEMS, RARITY_MULTIPLIERS, MATERIAL_STATS } from './constants';

// --- Inventory Stacking Logic ---

export const addToInventory = (inventory: Item[], newItem: Item, amount: number = 1): Item[] => {
    const newInv = [...inventory];
    
    // Equipment usually doesn't stack (unique IDs or distinct properties), but Consumables/Misc do
    const isStackable = newItem.type === 'CONSUMABLE' || newItem.type === 'MISC';
    
    if (isStackable) {
        const existingItemIndex = newInv.findIndex(i => i.id === newItem.id);
        if (existingItemIndex >= 0) {
            // Update existing stack
            const existingItem = newInv[existingItemIndex];
            newInv[existingItemIndex] = {
                ...existingItem,
                quantity: (existingItem.quantity || 1) + amount
            };
        } else {
            // Add new item
            newInv.push({ ...newItem, quantity: amount });
        }
    } else {
        // Add unique items individually
        for (let i = 0; i < amount; i++) {
            newInv.push({ ...newItem, quantity: 1 });
        }
    }
    
    return newInv;
};

export const removeFromInventory = (inventory: Item[], itemToRemove: Item, amount: number = 1): Item[] => {
    const newInv = [...inventory];
    const index = newInv.findIndex(i => i === itemToRemove || i.id === itemToRemove.id); // match ref or id for stackables
    
    if (index >= 0) {
        const item = newInv[index];
        const currentQty = item.quantity || 1;
        
        if (currentQty > amount) {
            newInv[index] = { ...item, quantity: currentQty - amount };
        } else {
            newInv.splice(index, 1);
        }
    }
    return newInv;
};


// --- Stats Calculation ---

export const calculateStats = (player: Player | Enemy): { derived: DerivedStats, totalStats: Stats } => {
    let totalStats: Stats;
    
    if ('baseStats' in player) {
        totalStats = { ...player.baseStats };
        // Add Equipment Bonuses
        Object.values(player.equipment).forEach(item => {
            if (item && item.stats) {
                Object.entries(item.stats).forEach(([key, val]) => {
                    if (val) totalStats[key as keyof Stats] += (val as number);
                });
            }
        });
    } else {
        totalStats = { ...player.stats };
    }

    // Status Effect Modifiers (Simple implementation)
    if (player.statusEffects) {
        player.statusEffects.forEach(effect => {
            if (effect.type === 'BUFF_STR') totalStats.strength += (effect.value || 0);
            if (effect.type === 'BUFF_DEF') totalStats.constitution += (effect.value || 0);
        });
    }

    // Derived Logic
    const derived: DerivedStats = {
        maxHp: 50 + (totalStats.constitution * 5) + (player.level * 10),
        maxMp: 20 + (totalStats.intelligence * 3) + (player.level * 5),
        physicalDef: (totalStats.constitution * 0.5) + (totalStats.strength * 0.2),
        magicalDef: (totalStats.intelligence * 0.5),
        evasion: totalStats.speed * 0.5 + totalStats.luck * 0.1,
        critChance: totalStats.dexterity * 0.5 + totalStats.luck * 0.2,
        // Regeneration rates (Per In-Game Hour)
        hpRegen: Math.floor((totalStats.constitution * 1) + (totalStats.strength * 0.2)), 
        mpRegen: Math.floor((totalStats.intelligence * 0.8) + (player.level * 0.5))
    };

    // Racial Passive: Elf (+10% Evasion Base)
    if ('race' in player && player.race === 'Elf') {
        derived.evasion += 10;
    }
    // Racial Passive: Halfling (+15% Crit Chance)
    if ('race' in player && player.race === 'Halfling') {
        derived.critChance += 15;
    }
    
    // Add Armor Defense for Player
    if ('equipment' in player) {
        Object.values(player.equipment).forEach(item => {
            if (item && item.defense) derived.physicalDef += item.defense;
        });
    }

    return { derived, totalStats };
};

// --- Time Formatting ---

export const formatTime = (date: { hour: number, minute: number }) => {
    return `${date.hour.toString().padStart(2, '0')}:${date.minute.toString().padStart(2, '0')}`;
};

export const formatDate = (date: { year: number, month: number, day: number }) => {
    return `Y${date.year} M${date.month} D${date.day}`;
};

export const calculateTotalDays = (date: GameDate): number => {
    return (date.year * 360) + (date.month * 30) + date.day;
};

// --- Procedural Generation ---

const ADJECTIVES: Record<TileType, string[]> = {
  [TileType.GRASS]: ['windswept', 'peaceful', 'overgrown', 'dew-covered'],
  [TileType.FOREST]: ['dense', 'shadowy', 'ancient', 'whispering'],
  [TileType.MOUNTAIN]: ['rocky', 'imposing', 'snow-capped', 'jagged'],
  [TileType.WATER]: ['murky', 'crystal clear', 'rushing', 'stagnant'],
  [TileType.TOWN]: ['bustling', 'quiet', 'run-down', 'fortified'],
  [TileType.DUNGEON]: ['dank', 'echoing', 'bone-chilling', 'dark'],
  [TileType.RUINS]: ['crumbled', 'mossy', 'mysterious', 'haunted'],
  [TileType.VOID]: ['empty'],
  [TileType.PORTAL]: ['shimmering', 'unstable', 'glowing', 'mystical'],
  [TileType.WALL]: ['solid', 'impenetrable', 'stone', 'brick'],
  [TileType.FLOOR]: ['dusty', 'polished', 'wooden', 'stone']
};

export const generateLocationDescription = (
  tileType: TileType,
  weather: Weather,
  time: TimeOfDay,
  npcs: NPC[]
): string => {
  const adj = ADJECTIVES[tileType][Math.floor(Math.random() * ADJECTIVES[tileType].length)];
  let base = `You are in a ${adj} ${tileType.toLowerCase()}. It is ${time.toLowerCase()} and ${weather.toLowerCase()}.`;
  
  if (npcs.length > 0) {
    const npcNames = npcs.map(n => n.name).join(', ');
    base += ` You see ${npcNames} here.`;
  }
  
  return base;
};

export const generateProceduralItem = (level: number, type: 'WEAPON' | 'ARMOR'): Item => {
    const materials = Object.values(ItemMaterial);
    // Simple material selection based on level tiers
    let material = ItemMaterial.IRON;
    if (level > 3) material = ItemMaterial.STEEL;
    if (level > 8) material = ItemMaterial.MITHRIL;
    if (level > 15) material = ItemMaterial.ADAMANTITE;
    
    if (type === 'ARMOR' && level < 5) material = Math.random() > 0.5 ? ItemMaterial.LEATHER : ItemMaterial.IRON;

    const matData = MATERIAL_STATS[material];
    const rarityRoll = Math.random();
    let rarity = ItemRarity.COMMON;
    if (rarityRoll > 0.7) rarity = ItemRarity.UNCOMMON;
    if (rarityRoll > 0.9) rarity = ItemRarity.RARE;
    if (rarityRoll > 0.98) rarity = ItemRarity.EPIC;

    const rarityMult = RARITY_MULTIPLIERS[rarity];
    const id = `${type}_${material}_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    
    const baseName = type === 'WEAPON' 
        ? (['Sword', 'Axe', 'Mace', 'Dagger'][Math.floor(Math.random() * 4)])
        : (['Helmet', 'Armor', 'Boots', 'Shield'][Math.floor(Math.random() * 4)]);

    const slot = baseName === 'Sword' || baseName === 'Axe' || baseName === 'Mace' || baseName === 'Dagger' ? EquipmentSlot.MAIN_HAND :
                 baseName === 'Shield' ? EquipmentSlot.OFF_HAND :
                 baseName === 'Helmet' ? EquipmentSlot.HEAD :
                 baseName === 'Boots' ? EquipmentSlot.FEET : EquipmentSlot.BODY;

    const stats: Partial<Stats> = {};
    if (matData.stats) {
        Object.entries(matData.stats).forEach(([k, v]) => {
            stats[k as keyof Stats] = Math.ceil((v as number) * rarityMult);
        });
    }

    return {
        id,
        name: `${rarity !== ItemRarity.COMMON ? rarity.charAt(0) + rarity.slice(1).toLowerCase() + ' ' : ''}${matData.name} ${baseName}`,
        type,
        slot,
        value: Math.floor(matData.baseValue * rarityMult * (1 + level * 0.1)),
        description: `A ${rarity.toLowerCase()} ${baseName.toLowerCase()} made of ${matData.name.toLowerCase()}.`,
        rarity,
        material,
        damage: type === 'WEAPON' ? Math.floor(5 * rarityMult + level) : undefined,
        defense: type === 'ARMOR' ? Math.floor(2 * rarityMult + level * 0.5) : undefined,
        stats,
        quantity: 1
    };
};

export const generateShopInventory = (role: string, level: number): Item[] => {
    const inventory: Item[] = [];
    const r = role.toLowerCase();
    const count = 5;

    // Always add basics based on role
    if (r.includes('merchant') || r.includes('general')) {
        inventory.push({ ...ITEMS['POTION_HP'], quantity: 1 });
        inventory.push({ ...ITEMS['BREAD'], quantity: 1 });
        inventory.push({ ...ITEMS['GIFT_FLOWER'], quantity: 1 });
    }
    if (r.includes('alchemist')) {
        inventory.push({ ...ITEMS['POTION_HP'], quantity: 1 });
        inventory.push({ ...ITEMS['POTION_MAX'], quantity: 1 });
        inventory.push({ ...ITEMS['MAGIC_DUST'], quantity: 1 });
    }
    if (r.includes('baker')) {
        inventory.push({ ...ITEMS['BREAD'], quantity: 1 });
        inventory.push({ ...ITEMS['CHEESE'], quantity: 1 });
        inventory.push({ ...ITEMS['STEAK'], quantity: 1 });
    }

    // Procedural Gear
    for(let i=0; i<count; i++) {
        // Specific checks first
        if (r.includes('weapon')) {
             inventory.push(generateProceduralItem(level, 'WEAPON'));
        }
        else if (r.includes('armor')) {
             inventory.push(generateProceduralItem(level, 'ARMOR'));
        }
        else if (r.includes('smith')) {
             // Generic smith might have either, but prioritize weapons if ambiguous unless explicitly armor
             inventory.push(generateProceduralItem(level, Math.random() > 0.3 ? 'WEAPON' : 'ARMOR'));
        }
        else if (r.includes('merchant')) {
             if (Math.random() > 0.7) inventory.push(generateProceduralItem(level, Math.random() > 0.5 ? 'WEAPON' : 'ARMOR'));
        }
    }

    return inventory;
};

export const generateEnemy = (tileType: TileType, playerLevel: number): Enemy => {
    const templates = ENEMY_TEMPLATES[tileType] || ENEMY_TEMPLATES[TileType.GRASS]!;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Scaling
    const level = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1);
    const scale = 1 + (level * 0.1);

    // Rarity Check
    const roll = Math.random();
    let rarity = 1;
    if (roll > 0.8) rarity = 2; // Uncommon
    if (roll > 0.95) rarity = 3; // Rare
    
    const rarityMult = 1 + ((rarity - 1) * 0.5);

    const stats: Stats = {
        strength: Math.floor(template.stats!.strength! * scale * rarityMult),
        dexterity: Math.floor(template.stats!.dexterity! * scale * rarityMult),
        intelligence: Math.floor(template.stats!.intelligence! * scale * rarityMult),
        constitution: Math.floor(template.stats!.constitution! * scale * rarityMult),
        speed: Math.floor(template.stats!.speed! * scale * rarityMult),
        luck: Math.floor(template.stats!.luck! * scale * rarityMult)
    };

    // Derived HP for Enemy
    const maxHp = Math.floor((50 + (stats.constitution * 5)) * scale);

    const statusEffects: StatusEffect[] = [];
    if (rarity >= 3) {
        statusEffects.push({ id: `buff_str_${Date.now()}`, type: 'BUFF_STR', name: 'Rage', duration: 99, value: 5 });
    }

    return {
        id: `enemy_${Date.now()}`,
        name: `${rarity === 2 ? 'Vicious ' : rarity === 3 ? 'Alpha ' : ''}${template.name}`,
        level,
        rarity,
        hp: maxHp,
        maxHp: maxHp,
        stats,
        expReward: Math.floor(10 * level * rarityMult),
        goldReward: Math.floor(5 * level * rarityMult),
        lootTable: template.lootTable || [],
        type: tileType,
        race: template.race,
        statusEffects
    };
};

export const resolveAutoTurn = (player: Player, enemy: Enemy, cooldowns: Record<string, number>): { 
    playerHp: number, 
    enemyHp: number, 
    playerMp: number, 
    newCooldowns: Record<string, number>, 
    logs: string[] 
} => {
    const pStats = calculateStats(player);
    const eStats = calculateStats(enemy);
    const logs: string[] = [];
    
    let playerHp = player.hp;
    let enemyHp = enemy.hp;
    let playerMp = player.mp;
    let newCooldowns = { ...cooldowns };

    // Decrement Cooldowns
    Object.keys(newCooldowns).forEach(k => {
        if (newCooldowns[k] > 0) newCooldowns[k]--;
    });

    // --- Player Turn ---
    
    // Determine Action (Skill vs Attack)
    const classData = CLASSES[player.class];
    const skill = SKILLS[classData?.skillId];
    let usedSkill = false;

    // AI: Use skill if off cooldown and enough MP
    if (skill && (newCooldowns[skill.id] || 0) === 0 && playerMp >= skill.mpCost) {
        usedSkill = true;
        newCooldowns[skill.id] = skill.cooldown;
        playerMp -= skill.mpCost;
        
        logs.push(`You used ${skill.name}!`);
        
        // Skill Effects (Hardcoded for simplicity/safety vs Eval)
        let dmgMult = 1.0;
        if (skill.id === 'POWER_SLASH') dmgMult = 1.5;
        if (skill.id === 'FIREBALL') dmgMult = 1.8; // Magic
        if (skill.id === 'SHADOW_STRIKE') dmgMult = 1.2; // Crit bonus handled below
        if (skill.id === 'RECKLESS_BLOW') {
            dmgMult = 2.5;
            const recoil = pStats.derived.maxHp * 0.1;
            playerHp -= recoil;
            logs.push(`You took ${Math.floor(recoil)} recoil damage.`);
        }
        if (skill.id === 'HOLY_LIGHT') {
            const heal = pStats.totalStats.intelligence * 3;
            playerHp = Math.min(pStats.derived.maxHp, playerHp + heal);
            logs.push(`Recovered ${heal} HP.`);
            dmgMult = 0; // No damage
        }

        if (dmgMult > 0) {
            // Calculate Damage
            const isPhys = skill.id !== 'FIREBALL';
            const atk = isPhys ? pStats.totalStats.strength : pStats.totalStats.intelligence;
            const def = isPhys ? eStats.derived.physicalDef : eStats.derived.magicalDef;
            
            // Crit Check
            let critBonus = 1.0;
            let critChance = pStats.derived.critChance;
            if (skill.id === 'SHADOW_STRIKE') critChance += 30;
            if (Math.random() * 100 < critChance) {
                critBonus = 1.5;
                logs.push("CRITICAL HIT!");
            }

            // Weapon Damage Add
            let weaponDmg = 0;
            if (player.equipment[EquipmentSlot.MAIN_HAND]) weaponDmg = player.equipment[EquipmentSlot.MAIN_HAND]!.damage || 0;

            const rawDmg = (atk + weaponDmg) * dmgMult * critBonus;
            const finalDmg = Math.max(1, Math.floor(rawDmg - (def * 0.5))); // Defense mitigation
            
            enemyHp -= finalDmg;
            logs.push(`Dealt ${finalDmg} damage to ${enemy.name}.`);
        }
    } else {
        // Basic Attack
        let weaponDmg = 0;
        if (player.equipment[EquipmentSlot.MAIN_HAND]) weaponDmg = player.equipment[EquipmentSlot.MAIN_HAND]!.damage || 0;
        
        const atk = pStats.totalStats.strength;
        const def = eStats.derived.physicalDef;
        
        let critBonus = 1.0;
        if (Math.random() * 100 < pStats.derived.critChance) {
             critBonus = 1.5;
             logs.push("CRITICAL HIT!");
        }

        const rawDmg = (atk + weaponDmg) * critBonus;
        const finalDmg = Math.max(1, Math.floor(rawDmg - (def * 0.5)));

        enemyHp -= finalDmg;
        logs.push(`You attacked ${enemy.name} for ${finalDmg} damage.`);
    }

    // --- Enemy Turn ---
    if (enemyHp > 0) {
        // Basic Enemy Logic: Attack
        const atk = eStats.totalStats.strength;
        const def = pStats.derived.physicalDef;
        
        // Evasion Check
        if (Math.random() * 100 < pStats.derived.evasion) {
            logs.push(`${enemy.name} attacked but you dodged!`);
        } else {
             const finalDmg = Math.max(1, Math.floor(atk - (def * 0.5)));
             playerHp -= finalDmg;
             logs.push(`${enemy.name} attacked you for ${finalDmg} damage.`);
        }
    }

    return { playerHp, enemyHp, playerMp, newCooldowns, logs };
};

export const calculateFleeChance = (player: Player, enemy: Enemy): number => {
    const pSpeed = calculateStats(player).totalStats.speed;
    const eSpeed = enemy.stats.speed;
    
    if (pSpeed > eSpeed) return 90;
    return Math.max(10, 50 + (pSpeed - eSpeed) * 5);
};

export const generateRandomQuest = (level: number): Quest => {
    const type = Math.random() > 0.5 ? QuestType.KILL : QuestType.COLLECT;
    const templates = type === QuestType.KILL ? [
        { name: 'Wolf', title: 'Wolf Hunt', desc: 'Thin the wolf pack nearby.' },
        { name: 'Bandit', title: 'Bandit Raid', desc: 'Stop the bandits terrorizing the road.' },
        { name: 'Skeleton', title: 'Bone Breaker', desc: 'Put the restless dead to sleep.' }
    ] : [
        { name: 'Wolf Pelt', title: 'Fur Trade', desc: 'Collect pelts for the winter.' },
        { name: 'Rat Tail', title: 'Vermin Control', desc: 'Bring proof of extermination.' }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    const amount = Math.floor(Math.random() * 3) + 2;

    return {
        id: `quest_${Date.now()}`,
        title: t.title,
        description: t.desc,
        type,
        targetId: 'any', // Simplified matching by name
        targetName: t.name,
        amountRequired: amount,
        amountCurrent: 0,
        expReward: level * 50,
        goldReward: level * 25,
        status: QuestStatus.ACTIVE
    };
};
