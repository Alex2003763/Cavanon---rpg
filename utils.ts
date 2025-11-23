

import { Player, Stats, TileType, Weather, TimeOfDay, NPC, DerivedStats, Enemy, Quest, QuestType, QuestStatus, Item, EquipmentSlot, ItemRarity, ItemMaterial, StatusEffect, GameDate, ItemEffectType, ItemEffect, GameMap, Tile, InteractableType } from './types';
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

const RANDOM_EFFECTS: ItemEffectType[] = ['LIFESTEAL', 'CRIT_DMG', 'THORNS', 'BLEED_CHANCE', 'STUN_CHANCE', 'MANA_STEAL'];

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
    if (rarityRoll > 0.995) rarity = ItemRarity.LEGENDARY;

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

    // Add Special Effects for higher rarity
    const effects: ItemEffect[] = [];
    if (rarity !== ItemRarity.COMMON && Math.random() > 0.5) {
        const effectType = RANDOM_EFFECTS[Math.floor(Math.random() * RANDOM_EFFECTS.length)];
        let val = 0.05; // Base 5%
        if (effectType === 'CRIT_DMG') val = 0.2; // 20%
        if (rarity === ItemRarity.RARE) val *= 1.5;
        if (rarity === ItemRarity.EPIC) val *= 2;
        if (rarity === ItemRarity.LEGENDARY) val *= 3;
        
        effects.push({ type: effectType, value: parseFloat(val.toFixed(2)) });
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
        quantity: 1,
        effects: effects.length > 0 ? effects : undefined
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

// Helper: Get aggregated Item Effects
const getPlayerItemEffects = (player: Player): Record<ItemEffectType, number> => {
    const totals: Record<ItemEffectType, number> = {
        LIFESTEAL: 0,
        MANA_STEAL: 0,
        CRIT_DMG: 0,
        THORNS: 0,
        STUN_CHANCE: 0,
        BLEED_CHANCE: 0
    };

    Object.values(player.equipment).forEach(item => {
        if (item && item.effects) {
            item.effects.forEach(eff => {
                totals[eff.type] += eff.value;
            });
        }
    });

    return totals;
};

// Helper: Process status effect ticks
const processStatusEffects = (effects: StatusEffect[], maxHp: number): { remaining: StatusEffect[], damageTaken: number, isStunned: boolean } => {
    let damageTaken = 0;
    let isStunned = false;
    const remaining: StatusEffect[] = [];

    effects.forEach(eff => {
        let keep = true;
        // Effect Logic
        if (eff.type === 'POISON' || eff.type === 'BLEED' || eff.type === 'BURN') {
             damageTaken += (eff.value || 0);
        }
        if (eff.type === 'STUN' || eff.type === 'FREEZE') {
             isStunned = true;
        }
        
        // Decrement Duration
        eff.duration -= 1;
        if (eff.duration <= 0) keep = false;
        
        if (keep) remaining.push(eff);
    });

    return { remaining, damageTaken, isStunned };
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
    const itemEffects = getPlayerItemEffects(player);
    
    let playerHp = player.hp;
    let enemyHp = enemy.hp;
    let playerMp = player.mp;
    let newCooldowns = { ...cooldowns };

    // --- Phase 0: Status Effects ---
    const pStatus = processStatusEffects(player.statusEffects, pStats.derived.maxHp);
    const eStatus = processStatusEffects(enemy.statusEffects, eStats.derived.maxHp);

    // Apply Damage from Status
    if (pStatus.damageTaken > 0) {
        playerHp -= pStatus.damageTaken;
        logs.push(`You took ${pStatus.damageTaken} damage from status effects.`);
    }
    if (eStatus.damageTaken > 0) {
        enemyHp -= eStatus.damageTaken;
        logs.push(`${enemy.name} took ${eStatus.damageTaken} damage from status effects.`);
    }

    player.statusEffects = pStatus.remaining;
    enemy.statusEffects = eStatus.remaining;


    // Decrement Cooldowns
    Object.keys(newCooldowns).forEach(k => {
        if (newCooldowns[k] > 0) newCooldowns[k]--;
    });

    // --- Phase 1: Player Turn ---
    
    if (pStatus.isStunned) {
        logs.push("You are stunned and cannot move!");
    } else if (playerHp > 0) {
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
            
            // Skill Effects (Hardcoded logic replaced/augmented)
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

            // Apply Skill Status Effect
            if (skill.statusEffect) {
                if (Math.random() < skill.statusEffect.chance) {
                    const newEffect: StatusEffect = {
                        id: `eff_${Date.now()}_${Math.random()}`,
                        type: skill.statusEffect.type,
                        name: skill.statusEffect.type,
                        duration: skill.statusEffect.duration,
                        value: skill.statusEffect.value
                    };
                    enemy.statusEffects.push(newEffect);
                    logs.push(`Applied ${skill.statusEffect.type} to ${enemy.name}!`);
                }
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
                    critBonus = 1.5 + itemEffects.CRIT_DMG; // Add crit dmg bonus from items
                    logs.push("CRITICAL HIT!");
                }

                // Weapon Damage Add
                let weaponDmg = 0;
                if (player.equipment[EquipmentSlot.MAIN_HAND]) weaponDmg = player.equipment[EquipmentSlot.MAIN_HAND]!.damage || 0;

                const rawDmg = (atk + weaponDmg) * dmgMult * critBonus;
                const finalDmg = Math.max(1, Math.floor(rawDmg - (def * 0.5))); // Defense mitigation
                
                enemyHp -= finalDmg;
                logs.push(`Dealt ${finalDmg} damage to ${enemy.name}.`);

                // Item On-Hit Effects (Spell Vamp?)
                if (itemEffects.MANA_STEAL > 0) {
                     const mpStolen = Math.ceil(finalDmg * itemEffects.MANA_STEAL);
                     playerMp = Math.min(pStats.derived.maxMp, playerMp + mpStolen);
                }
            }
        } else {
            // Basic Attack
            let weaponDmg = 0;
            if (player.equipment[EquipmentSlot.MAIN_HAND]) weaponDmg = player.equipment[EquipmentSlot.MAIN_HAND]!.damage || 0;
            
            const atk = pStats.totalStats.strength;
            const def = eStats.derived.physicalDef;
            
            let critBonus = 1.0;
            if (Math.random() * 100 < pStats.derived.critChance) {
                 critBonus = 1.5 + itemEffects.CRIT_DMG;
                 logs.push("CRITICAL HIT!");
            }

            const rawDmg = (atk + weaponDmg) * critBonus;
            const finalDmg = Math.max(1, Math.floor(rawDmg - (def * 0.5)));

            enemyHp -= finalDmg;
            logs.push(`You attacked ${enemy.name} for ${finalDmg} damage.`);

            // Item On-Hit Effects
            if (itemEffects.LIFESTEAL > 0) {
                const healing = Math.ceil(finalDmg * itemEffects.LIFESTEAL);
                playerHp = Math.min(pStats.derived.maxHp, playerHp + healing);
                logs.push(`Leached ${healing} HP.`);
            }
            if (itemEffects.MANA_STEAL > 0) {
                const mpStolen = Math.ceil(finalDmg * itemEffects.MANA_STEAL);
                playerMp = Math.min(pStats.derived.maxMp, playerMp + mpStolen);
            }
            if (itemEffects.BLEED_CHANCE > 0 && Math.random() < itemEffects.BLEED_CHANCE) {
                enemy.statusEffects.push({ id: `bleed_${Date.now()}`, type: 'BLEED', name: 'Bleed', duration: 3, value: Math.ceil(finalDmg * 0.2) });
                logs.push(`${enemy.name} is bleeding!`);
            }
            if (itemEffects.STUN_CHANCE > 0 && Math.random() < itemEffects.STUN_CHANCE) {
                enemy.statusEffects.push({ id: `stun_${Date.now()}`, type: 'STUN', name: 'Stun', duration: 1, value: 0 });
                logs.push(`${enemy.name} was stunned!`);
            }
        }
    }

    // --- Phase 2: Enemy Turn ---
    if (enemyHp > 0 && !eStatus.isStunned) {
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

             // Thorns Check
             if (itemEffects.THORNS > 0) {
                 const reflect = Math.ceil(finalDmg * itemEffects.THORNS);
                 enemyHp -= reflect;
                 logs.push(`${enemy.name} took ${reflect} reflected damage.`);
             }
        }
    } else if (eStatus.isStunned && enemyHp > 0) {
        logs.push(`${enemy.name} is stunned and cannot act.`);
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
    let targetName = '';
    let targetId = '';
    let amount = 3;
    let title = '';
    let description = '';
    let expReward = level * 50;
    let goldReward = level * 25;

    if (type === QuestType.KILL) {
        // Flatten enemy list
        const allEnemies = Object.values(ENEMY_TEMPLATES).flat();
        const template = allEnemies[Math.floor(Math.random() * allEnemies.length)];
        targetName = template.name;
        targetId = template.name; // Use name as ID for kill quests effectively
        amount = Math.floor(Math.random() * 3) + 3; // 3 to 5
        title = `${targetName} Hunt`;
        description = `The local ${targetName} population is out of control. Eliminate them.`;
    } else {
        // Collect items
        const collectables = Object.values(ITEMS).filter(i => i.type === 'MISC' || i.type === 'CONSUMABLE');
        const item = collectables[Math.floor(Math.random() * collectables.length)];
        targetName = item.name;
        targetId = item.id;
        amount = Math.floor(Math.random() * 5) + 3;
        title = `Gathering ${targetName}`;
        description = `We are in need of ${targetName}. Please bring some.`;
    }

    return {
        id: `quest_${Date.now()}_${Math.random()}`,
        title,
        description,
        type,
        targetId,
        targetName,
        amountRequired: amount,
        amountCurrent: 0,
        expReward,
        goldReward,
        status: QuestStatus.ACTIVE
    };
};

export const updateQuestProgress = (player: Player, killedEnemyName?: string): { quests: Quest[], notifications: string[] } => {
    const notifications: string[] = [];
    const newQuests = player.quests.map(q => {
        if (q.status === QuestStatus.COMPLETED) return q;

        let newCurrent = q.amountCurrent;
        let newStatus: QuestStatus = q.status;

        // Update Progress
        if (q.type === QuestType.KILL && killedEnemyName) {
             // Handle matching with possible prefixes like "Vicious" or "Alpha"
             if (killedEnemyName.includes(q.targetName)) {
                 newCurrent = Math.min(q.amountRequired, q.amountCurrent + 1);
             }
        } else if (q.type === QuestType.COLLECT) {
             // Always update based on inventory count for collect quests
             const count = player.inventory.filter(i => i.id === q.targetId).reduce((acc, i) => acc + (i.quantity || 1), 0);
             newCurrent = count;
        }

        // Check Completion
        if (newCurrent >= q.amountRequired) {
            newStatus = QuestStatus.COMPLETED;
            notifications.push(`Quest Ready: ${q.title}`);
        } else if (q.type === QuestType.COLLECT && newCurrent < q.amountRequired) {
            // Regressed (dropped item)
            newStatus = QuestStatus.ACTIVE;
        }

        // Return updated quest if changed
        if (newCurrent !== q.amountCurrent || newStatus !== q.status) {
            return { ...q, amountCurrent: newCurrent, status: newStatus };
        }
        return q;
    });

    return { quests: newQuests, notifications };
};

// --- Map Generators ---

const createTile = (x: number, y: number, type: TileType): Tile => ({
    x, y, type, explored: true, npcs: []
});

export const generateVillage = (): GameMap => {
    const width = 25;
    const height = 25;
    const tiles: Tile[][] = [];
    for(let y=0; y<height; y++) {
        const row: Tile[] = [];
        for(let x=0; x<width; x++) {
            let type = TileType.GRASS;
            // Simple village layout
            if (x >= 10 && x <= 15 && y >= 10 && y <= 15) type = TileType.TOWN;
            if (x === 0 || x === width-1 || y === 0 || y === height-1) type = TileType.FOREST;
            
            const tile = createTile(x, y, type);
            
            // Add NPCs
            if (x===12 && y===12) tile.npcs = ['npc_mayor'];
            if (x===13 && y===12) tile.npcs = ['npc_merchant'];
            if (x===12 && y===15) tile.npcs = ['npc_guard'];
            
            // Portal to World Map (Updated Target for New Map Layout)
            // Places player next to the village on the world map (84, 75)
            if (x===24 && y===12) {
                tile.type = TileType.PORTAL;
                tile.portalTarget = { mapId: 'world_map', x: 84, y: 75, desc: 'To World Map' };
            }

             // Portal to Home
            if (x===10 && y===10) {
                tile.type = TileType.TOWN;
                tile.portalTarget = { mapId: 'player_home', x: 4, y: 7, desc: 'To Home' };
            }

            row.push(tile);
        }
        tiles.push(row);
    }
    return { id: 'starter_village', name: 'Oakhaven Village', width, height, tiles };
};

export const generateWorldMap = (): GameMap => {
    const width = 100;
    const height = 100;
    const tiles: Tile[][] = [];
    const seed = Math.random() * 1000;

    for(let y=0; y<height; y++) {
        const row: Tile[] = [];
        for(let x=0; x<width; x++) {
             // Normalized coordinates
             const nx = x / width;
             const ny = y / height;

             // Base Noise for natural variance
             const n = Math.sin(nx * 10 + seed) * 0.1 + Math.cos(ny * 10 + seed) * 0.1;

             // SHAPE LOGIC: Approximating Reference Image
             // 1. West Continent (Savia / Gramburgh) - Strip on the left
             const isWest = nx < (0.28 + n * 0.5);

             // 2. East Continent (Markush / Macker) - Large mass on right
             const isEast = nx > (0.38 + n * 0.5);

             // 3. Central Sea in East Continent - Hollow out the middle
             // Circle roughly at x=0.7, y=0.5
             const dSea = Math.sqrt(Math.pow(nx - 0.7, 2) + Math.pow(ny - 0.5, 2));
             const isSea = dSea < (0.18 + n * 0.3);

             // 4. Northern Bridge? Maybe connects at top
             const isBridge = ny < 0.15 && nx > 0.2 && nx < 0.4;

             let isLand = isWest || (isEast && !isSea) || isBridge;

             // Terrain Type
             let type = TileType.WATER;
             if (isLand) {
                 // Elevation noise for biomes
                 const elevation = Math.sin(nx * 7 + seed) + Math.cos(ny * 6 + seed) 
                                 + Math.sin(nx * 15 + ny * 15 + seed) * 0.5;
                 
                 if (elevation < -0.8) type = TileType.GRASS; // Lowlands
                 else if (elevation < 0.2) type = TileType.FOREST; // Mid
                 else if (elevation < 0.8) type = TileType.MOUNTAIN; // High
                 else type = TileType.MOUNTAIN; // Peaks
                 
                 // Smoothing / Biome adjustment
                 if (type === TileType.MOUNTAIN && Math.random() > 0.7) type = TileType.FOREST;
             }

             // Force Safe Zones around Key Locations (Ensure they are on land)
             const locs = [
                 {x: 85, y: 75, r: 4}, // Village (South East)
                 {x: 75, y: 15, r: 4}, // City (North East)
                 {x: 15, y: 20, r: 3}, // West Ruins (North West)
                 {x: 15, y: 80, r: 3}  // West Dungeon (South West)
             ];
             
             for (const loc of locs) {
                 const d = Math.sqrt(Math.pow(x - loc.x, 2) + Math.pow(y - loc.y, 2));
                 if (d < loc.r) {
                     if (type === TileType.WATER) type = TileType.GRASS;
                     if (type === TileType.MOUNTAIN) type = TileType.FOREST;
                 }
             }

             const tile = createTile(x, y, type);

             // Places
             if (x === 85 && y === 75) {
                 tile.type = TileType.TOWN;
                 tile.portalTarget = { mapId: 'starter_village', x: 23, y: 12, desc: 'Oakhaven Village' };
             }
             if (x === 75 && y === 15) {
                 tile.type = TileType.TOWN;
                 tile.portalTarget = { mapId: 'capital_city', x: 15, y: 28, desc: 'Capital City' };
             }
             
             // POIs
             if (x === 15 && y === 20) tile.type = TileType.RUINS; // North West Ruins
             if (x === 15 && y === 80) tile.type = TileType.DUNGEON; // South West Dungeon

             row.push(tile);
        }
        tiles.push(row);
    }
    return { id: 'world_map', name: 'World Map', width, height, tiles };
};

export const generatePlayerHome = (): GameMap => {
    const width = 9;
    const height = 9;
    const tiles: Tile[][] = [];
    
    for(let y=0; y<height; y++) {
        const row: Tile[] = [];
        for(let x=0; x<width; x++) {
             let type = TileType.FLOOR;
             if (x===0 || x===width-1 || y===0 || y===height-1) type = TileType.WALL;
             
             const tile = createTile(x, y, type);
             
             if (x===4 && y===4) tile.interactable = { type: InteractableType.BED };
             if (x===2 && y===2) tile.interactable = { type: InteractableType.STORAGE };
             
             if (x===4 && y===8) {
                 tile.type = TileType.PORTAL;
                 tile.portalTarget = { mapId: 'starter_village', x: 10, y: 10, desc: 'Exit House' };
             }

             row.push(tile);
        }
        tiles.push(row);
    }
    return { id: 'player_home', name: 'Player Home', width, height, tiles };
};

export const generateCity = (): GameMap => {
    const width = 30;
    const height = 30;
    const tiles: Tile[][] = [];
    
    for(let y=0; y<height; y++) {
        const row: Tile[] = [];
        for(let x=0; x<width; x++) {
             // 1. Default Ground
             let type = TileType.GRASS;
             
             // 2. City Floor / Roads
             // Main walls area
             if (x >= 2 && x <= 27 && y >= 2 && y <= 27) {
                 type = TileType.TOWN; // General pavement
             }
             
             // Main Vertical Road (South to North)
             if (x >= 14 && x <= 15 && y >= 2) {
                 type = TileType.FLOOR; // Road
             }
             // Horizontal Plaza Road
             if (y >= 14 && y <= 15 && x >= 4 && x <= 25) {
                 type = TileType.FLOOR;
             }

             // 3. Buildings (Walls)
             // Smithy (Top Left)
             if (x >= 4 && x <= 10 && y >= 5 && y <= 10) {
                 if (x===4 || x===10 || y===5 || y===10) type = TileType.WALL;
                 else type = TileType.FLOOR;
             }
             
             // Inn (Bottom Left)
             if (x >= 4 && x <= 10 && y >= 20 && y <= 25) {
                 if (x===4 || x===10 || y===20 || y===25) type = TileType.WALL;
                 else type = TileType.FLOOR;
             }
             
             // Market Shops (Right Side)
             // Alchemist
             if (x >= 20 && x <= 26 && y >= 5 && y <= 10) {
                 if (x===20 || x===26 || y===5 || y===10) type = TileType.WALL;
                 else type = TileType.FLOOR;
             }
             // Baker
             if (x >= 20 && x <= 26 && y >= 15 && y <= 20) {
                 if (x===20 || x===26 || y===15 || y===20) type = TileType.WALL;
                 else type = TileType.FLOOR;
             }

             // 4. Outer City Walls
             if (x===2 || x===27 || y===2 || y===27) type = TileType.WALL;
             
             // 5. Gates
             if ((x===14 || x===15) && y===27) type = TileType.FLOOR; // South Gate
             if ((x===14 || x===15) && y===2) type = TileType.PORTAL; // Castle Gate

             const tile = createTile(x, y, type);
             
             // 6. Portals
             // Exit to World (South of City)
             if ((x===14 || x===15) && y===29) {
                 tile.type = TileType.PORTAL;
                 tile.portalTarget = { mapId: 'world_map', x: 75, y: 16, desc: 'Exit City' };
             }
             
             // 7. NPCs
             if (x===7 && y===7) tile.npcs = ['npc_city_armorer']; // In Smithy
             if (x===8 && y===7) tile.npcs = ['npc_city_weaponsmith']; // Also In Smithy
             if (x===7 && y===22) tile.npcs = ['npc_city_innkeeper']; // In Inn
             if (x===23 && y===7) tile.npcs = ['npc_city_alchemist']; // In Lab
             if (x===23 && y===17) tile.npcs = ['npc_city_baker']; // In Bakery

             // Add Doorways to buildings
             if (x===10 && y===8) tile.type = TileType.FLOOR; // Smithy Door
             if (x===10 && y===22) tile.type = TileType.FLOOR; // Inn Door
             if (x===20 && y===8) tile.type = TileType.FLOOR; // Alchemist Door
             if (x===20 && y===17) tile.type = TileType.FLOOR; // Baker Door

             // Interactables
             if (x===5 && y===21) tile.interactable = { type: InteractableType.BED }; // Inn Bed

             row.push(tile);
        }
        tiles.push(row);
    }
    return { id: 'capital_city', name: 'Capital City', width, height, tiles };
};
