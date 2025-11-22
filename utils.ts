
import { Player, Stats, TileType, Weather, TimeOfDay, NPC, DerivedStats, Enemy, Quest, QuestType, QuestStatus, Item, EquipmentSlot, ItemRarity, ItemMaterial } from './types';
import { ENEMY_TEMPLATES, BASE_STATS, SKILLS, CLASSES, RACES, ITEMS, RARITY_MULTIPLIERS, MATERIAL_STATS } from './constants';

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
  [TileType.FLOOR]: ['dusty', 'clean', 'wooden', 'tiled']
};

export const generateLocationDescription = (
  tileType: TileType,
  weather: Weather,
  time: TimeOfDay,
  npcs: NPC[]
): string => {
  const adjList = ADJECTIVES[tileType] || ['average'];
  const adj = adjList[Math.floor(Math.random() * adjList.length)];
  let base = `You are in a ${adj} ${tileType.toLowerCase()}. It is ${time.toLowerCase()} and ${weather.toLowerCase()}.`;
  
  if (npcs.length > 0) {
    const npcNames = npcs.map(n => n.name).join(', ');
    base += ` You see ${npcNames} here.`;
  }
  
  return base;
};

// --- Procedural Item Generation ---

export const generateProceduralItem = (level: number, type: 'WEAPON' | 'ARMOR'): Item => {
    const rarityRoll = Math.random();
    let rarity = ItemRarity.COMMON;
    if (rarityRoll > 0.95) rarity = ItemRarity.LEGENDARY;
    else if (rarityRoll > 0.85) rarity = ItemRarity.EPIC;
    else if (rarityRoll > 0.70) rarity = ItemRarity.RARE;
    else if (rarityRoll > 0.40) rarity = ItemRarity.UNCOMMON;

    // Material Selection based on type
    let validMaterials = [ItemMaterial.IRON, ItemMaterial.STEEL];
    if (level > 5) validMaterials.push(ItemMaterial.MITHRIL);
    if (level > 10) validMaterials.push(ItemMaterial.ADAMANTITE);
    if (level > 15) validMaterials.push(ItemMaterial.DRAGON_BONE);

    if (type === 'ARMOR') {
        validMaterials.push(ItemMaterial.LEATHER, ItemMaterial.CLOTH);
        if (level > 8) validMaterials.push(ItemMaterial.SILK);
    } else {
        validMaterials.push(ItemMaterial.WOOD, ItemMaterial.OBSIDIAN);
    }

    const material = validMaterials[Math.floor(Math.random() * validMaterials.length)];
    const matData = MATERIAL_STATS[material];
    const rarityMult = RARITY_MULTIPLIERS[rarity];
    
    const baseVal = level * 10 + matData.baseValue;
    const value = Math.floor(baseVal * rarityMult * (0.8 + Math.random() * 0.4));

    let name = `${rarity === ItemRarity.COMMON ? '' : rarity.charAt(0) + rarity.slice(1).toLowerCase() + ' '}${matData.name} `;
    let description = `A ${rarity.toLowerCase()} item made of ${matData.name.toLowerCase()}.`;
    let slot: EquipmentSlot = EquipmentSlot.MAIN_HAND;
    let damage = 0;
    let defense = 0;
    let stats: Partial<Stats> = { ...matData.stats };

    // Scale stats by rarity
    Object.keys(stats).forEach(k => {
        const key = k as keyof Stats;
        if (stats[key]) stats[key] = Math.ceil(stats[key]! * rarityMult);
    });

    if (type === 'WEAPON') {
        const weapons = [
            { sub: 'Sword', dmg: 6, slot: EquipmentSlot.MAIN_HAND },
            { sub: 'Axe', dmg: 8, slot: EquipmentSlot.MAIN_HAND },
            { sub: 'Dagger', dmg: 4, slot: EquipmentSlot.MAIN_HAND },
            { sub: 'Staff', dmg: 3, slot: EquipmentSlot.MAIN_HAND },
            { sub: 'Mace', dmg: 7, slot: EquipmentSlot.MAIN_HAND },
        ];
        const w = weapons[Math.floor(Math.random() * weapons.length)];
        name += w.sub;
        slot = w.slot;
        damage = Math.ceil((w.dmg + (level * 0.5)) * rarityMult);
        if (material === ItemMaterial.WOOD) damage = Math.ceil(damage * 0.7); // Wood weapons weaker physically
        
        description = `${description} Deals ${damage} damage.`;
    } else {
        const armors = [
            { sub: 'Helmet', def: 2, slot: EquipmentSlot.HEAD },
            { sub: 'Chestplate', def: 6, slot: EquipmentSlot.BODY },
            { sub: 'Leggings', def: 4, slot: EquipmentSlot.LEGS },
            { sub: 'Boots', def: 2, slot: EquipmentSlot.FEET },
            { sub: 'Shield', def: 4, slot: EquipmentSlot.OFF_HAND },
        ];
        const a = armors[Math.floor(Math.random() * armors.length)];
        name += a.sub;
        slot = a.slot;
        defense = Math.ceil((a.def + (level * 0.3)) * rarityMult);
        
        if (material === ItemMaterial.CLOTH || material === ItemMaterial.SILK) defense = Math.ceil(defense * 0.5); // Cloth is weak

        description = `${description} Provides ${defense} defense.`;
    }

    return {
        id: `proc_${Date.now()}_${Math.random()}`,
        name,
        type,
        slot,
        value,
        description,
        stats,
        damage,
        defense,
        rarity,
        material
    };
};

// --- Quest Generation ---

export const generateRandomQuest = (playerLevel: number): Quest => {
    const isKillQuest = Math.random() > 0.4; // 60% Chance for Kill Quest
    const id = `quest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    if (isKillQuest) {
        // Pick a random biome
        const biomes = [TileType.GRASS, TileType.FOREST, TileType.MOUNTAIN, TileType.DUNGEON, TileType.RUINS];
        const biome = biomes[Math.floor(Math.random() * biomes.length)];
        const enemies = ENEMY_TEMPLATES[biome];
        
        if (!enemies) return generateRandomQuest(playerLevel); // fallback

        const targetEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        const amount = Math.floor(Math.random() * 3) + 2; // 2 to 5
        
        // Rewards scaling
        const expReward = Math.floor((playerLevel * 20) + (amount * 10));
        const goldReward = Math.floor((playerLevel * 5) + (amount * 5));
        
        return {
            id,
            type: QuestType.KILL,
            title: `Cull the ${targetEnemy.name}s`,
            description: `The ${targetEnemy.name} population in the ${biome.toLowerCase()} is getting out of hand. Eliminate ${amount} of them.`,
            targetId: targetEnemy.name, // Using name for kill tracking simplicity
            targetName: targetEnemy.name,
            amountRequired: amount,
            amountCurrent: 0,
            expReward,
            goldReward,
            status: QuestStatus.ACTIVE
        };
    } else {
        // Collect Quest
        const collectables = Object.values(ITEMS).filter(i => i.type === 'MISC' || i.type === 'CONSUMABLE');
        const targetItem = collectables[Math.floor(Math.random() * collectables.length)];
        const amount = Math.floor(Math.random() * 3) + 1; // 1 to 3
        
        const expReward = Math.floor((playerLevel * 15) + (targetItem.value * amount));
        const goldReward = Math.floor((targetItem.value * amount) * 1.5) + 10;

        return {
             id,
             type: QuestType.COLLECT,
             title: `Supply Run: ${targetItem.name}`,
             description: `I am in desperate need of ${amount} ${targetItem.name}. Can you bring them to me?`,
             targetId: targetItem.id,
             targetName: targetItem.name,
             amountRequired: amount,
             amountCurrent: 0,
             expReward,
             goldReward,
             status: QuestStatus.ACTIVE
        };
    }
};


// --- Combat Logic ---

export const generateEnemy = (tileType: TileType, playerLevel: number): Enemy => {
    const templates = ENEMY_TEMPLATES[tileType] || ENEMY_TEMPLATES[TileType.GRASS]!;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    let levelOffset = 0;
    if (tileType === TileType.DUNGEON || tileType === TileType.MOUNTAIN) levelOffset = 2;
    if (tileType === TileType.GRASS) levelOffset = -1;
    
    const level = Math.max(1, playerLevel + levelOffset + Math.floor(Math.random() * 3) - 1);
    
    // Determine Rarity (1 to 5 Stars)
    const rarityRoll = Math.random();
    let rarity = 1;
    if (rarityRoll > 0.98) rarity = 5;      // 2% Legendary
    else if (rarityRoll > 0.90) rarity = 4; // 8% Epic
    else if (rarityRoll > 0.75) rarity = 3; // 15% Rare
    else if (rarityRoll > 0.50) rarity = 2; // 25% Uncommon
    else rarity = 1;                        // 50% Common

    // Rarity Multiplier
    // Common: 0.8x, Uncommon: 1.0x, Rare: 1.2x, Epic: 1.5x, Legendary: 2.0x
    const rarityMultipliers = { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.5, 5: 2.0 };
    const rMult = rarityMultipliers[rarity as keyof typeof rarityMultipliers];

    // Reduced level scaling factor (was 0.15)
    const scaleFactor = (1 + (level * 0.10)) * rMult;

    const stats: Stats = {
        strength: Math.floor(template.stats!.strength * scaleFactor),
        dexterity: Math.floor(template.stats!.dexterity * scaleFactor),
        intelligence: Math.floor(template.stats!.intelligence * scaleFactor),
        constitution: Math.floor(template.stats!.constitution * scaleFactor),
        speed: Math.floor(template.stats!.speed * scaleFactor),
        luck: Math.floor(template.stats!.luck * scaleFactor),
    };

    const hp = Math.floor(50 + (stats.constitution * 5) + (level * 10));

    return {
        id: `enemy_${Date.now()}_${Math.random()}`,
        name: template.name || 'Unknown Entity',
        level,
        rarity,
        hp,
        maxHp: hp,
        stats,
        expReward: Math.floor(10 * scaleFactor * rMult), // Double dip rarity for reward
        goldReward: Math.floor(Math.random() * 5 * scaleFactor * rMult),
        lootTable: template.lootTable || [],
        type: tileType,
        race: template.race
    };
};

export const calculateFleeChance = (player: Player, enemy: Enemy): number => {
    const { totalStats: pStats, derived: pDerived } = calculateStats(player);
    const { totalStats: eStats } = calculateStats(enemy);

    const baseChance = 50;
    const speedDiff = (pStats.speed - eStats.speed) * 2; // Fast players flee easier
    const luckBonus = pStats.luck * 1;
    
    // Health Factor: Low HP makes it harder to run (injured)
    const hpRatio = player.hp / pDerived.maxHp;
    const hpPenalty = (1 - hpRatio) * 20; // Up to -20% at 0 HP

    let chance = baseChance + speedDiff + luckBonus - hpPenalty;
    
    // Clamp between 5% and 95%
    return Math.max(5, Math.min(95, Math.floor(chance)));
};

const calculateDamage = (attacker: Player | Enemy, defender: Player | Enemy, baseDamage: number, isMagic: boolean): { damage: number, isCrit: boolean } => {
    const { totalStats: attStats } = calculateStats(attacker);
    const { derived: defStats } = calculateStats(defender);

    let attackValue = isMagic ? attStats.intelligence : attStats.strength;
    let defenseValue = isMagic ? defStats.magicalDef : defStats.physicalDef;
    
    // Racial Passive: Orc (Bloodlust) - Attacker
    if ('race' in attacker && attacker.race === 'Orc' && (attacker.hp / (50 + attStats.constitution * 5 + attacker.level * 10)) < 0.5) {
        attackValue *= 1.2;
    }

    // Crit Calc
    const critRoll = Math.random() * 100;
    const isCrit = critRoll < defStats.critChance; 
    
    if (isCrit) attackValue *= 1.5;
    
    let damage = Math.max(1, (attackValue * 2) - defenseValue);
    
    // Racial Passive: Dwarf (Iron Skin) - Defender
    if ('race' in defender && defender.race === 'Dwarf') {
        damage = Math.max(1, damage - 2);
    }

    // Variance +/- 10%
    const variance = 0.9 + (Math.random() * 0.2);
    damage = Math.floor((damage + baseDamage) * variance);
    
    return { damage, isCrit };
};

export const resolveAutoTurn = (
    player: Player, 
    enemy: Enemy, 
    cooldowns: Record<string, number>
): { 
    playerHp: number, 
    enemyHp: number, 
    playerMp: number,
    logs: string[],
    newCooldowns: Record<string, number>
} => {
    const logs: string[] = [];
    let pCurrentHp = player.hp;
    let pCurrentMp = player.mp;
    let eCurrentHp = enemy.hp;
    let newCooldowns = { ...cooldowns };

    const { totalStats: pStats, derived: pDerived } = calculateStats(player);
    const { totalStats: eStats, derived: eDerived } = calculateStats(enemy);
    
    // Reduce cooldowns at start of turn
    Object.keys(newCooldowns).forEach(key => {
        if (newCooldowns[key] > 0) newCooldowns[key]--;
    });

    const performPlayerAction = () => {
        if (eCurrentHp <= 0) return;

        // Identify Player Class Skill
        const classData = CLASSES[player.class];
        const skillId = classData?.skillId;
        const skill = skillId ? SKILLS[skillId] : null;

        // Check if skill is usable
        let usedSkill = false;
        if (skill && pCurrentMp >= skill.mpCost && (!newCooldowns[skillId!] || newCooldowns[skillId!] === 0)) {
            // Skill Logic
            usedSkill = true;
            pCurrentMp -= skill.mpCost;
            newCooldowns[skillId!] = skill.cooldown;

            if (skillId === 'HOLY_LIGHT') {
                const healAmount = Math.floor(pStats.intelligence * 3);
                pCurrentHp = Math.min(pDerived.maxHp, pCurrentHp + healAmount);
                logs.push(`You cast ${skill.name} and healed ${healAmount} HP.`);
            } 
            else if (skillId === 'RECKLESS_BLOW') {
                const { damage, isCrit } = calculateDamage(player, enemy, 0, false);
                const finalDmg = Math.floor(damage * 2.5);
                const recoil = Math.floor(pDerived.maxHp * 0.1);
                eCurrentHp = Math.max(0, eCurrentHp - finalDmg);
                pCurrentHp = Math.max(1, pCurrentHp - recoil);
                logs.push(`You used ${skill.name}! Dealt ${finalDmg}${isCrit ? ' (CRIT!)' : ''} to enemy, took ${recoil} recoil.`);
            }
            else if (skillId === 'FIREBALL') {
                 const { damage, isCrit } = calculateDamage(player, enemy, 0, true);
                 const finalDmg = Math.floor(damage * 1.8);
                 eCurrentHp = Math.max(0, eCurrentHp - finalDmg);
                 logs.push(`You cast ${skill.name} for ${finalDmg}${isCrit ? ' (CRIT!)' : ''} magic damage!`);
            }
            else if (skillId === 'SHADOW_STRIKE') {
                 // High Crit logic hack - manually calc damage with forced crit chance logic or just bonus mult
                 let { damage } = calculateDamage(player, enemy, 0, false);
                 // Simulate +30% crit check
                 const critRoll = Math.random() * 100;
                 const isSuperCrit = critRoll < (pDerived.critChance + 30);
                 if (isSuperCrit) damage = Math.floor(damage * 1.5);
                 
                 eCurrentHp = Math.max(0, eCurrentHp - damage);
                 logs.push(`You used ${skill.name}! Dealt ${damage}${isSuperCrit ? ' (CRIT!)' : ''} damage.`);
            }
            else if (skillId === 'POWER_SLASH') {
                 const { damage, isCrit } = calculateDamage(player, enemy, 0, false);
                 const finalDmg = Math.floor(damage * 1.5);
                 eCurrentHp = Math.max(0, eCurrentHp - finalDmg);
                 logs.push(`You used ${skill.name}! Dealt ${finalDmg}${isCrit ? ' (CRIT!)' : ''} damage.`);
            }
        } 

        if (!usedSkill) {
             // Basic Attack
             let weaponDmg = 0;
             if (player.equipment.MAIN_HAND?.damage) weaponDmg = player.equipment.MAIN_HAND.damage;
             
             const { damage, isCrit } = calculateDamage(player, enemy, weaponDmg, false);
             eCurrentHp = Math.max(0, eCurrentHp - damage);
             logs.push(`You attacked ${enemy.name} for ${damage}${isCrit ? ' (CRIT!)' : ''} damage.`);
        }
    };

    const performEnemyAction = () => {
        if (pCurrentHp <= 0) return;

        if (Math.random() < 0.2) {
             const { damage, isCrit } = calculateDamage(enemy, player, 0, false);
             const strongDmg = Math.floor(damage * 1.2);
             pCurrentHp = Math.max(0, pCurrentHp - strongDmg);
             logs.push(`${enemy.name} unleashed a ferocious attack for ${strongDmg}${isCrit ? ' (CRIT!)' : ''} damage!`);
        } else {
             const { damage, isCrit } = calculateDamage(enemy, player, 0, false);
             pCurrentHp = Math.max(0, pCurrentHp - damage);
             logs.push(`${enemy.name} attacked you for ${damage}${isCrit ? ' (CRIT!)' : ''} damage.`);
        }
    };

    if (pStats.speed >= eStats.speed) {
        performPlayerAction();
        if (eCurrentHp > 0) performEnemyAction();
    } else {
        performEnemyAction();
        if (pCurrentHp > 0) performPlayerAction();
    }

    return { playerHp: pCurrentHp, enemyHp: eCurrentHp, playerMp: pCurrentMp, logs, newCooldowns };
};
