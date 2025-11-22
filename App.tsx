
import React, { useReducer, useEffect, useCallback, useState, useRef, useMemo } from 'react';
import WorldMap from './components/WorldMap';
import { Panel, Button, StatBar, DialoguePanel, CharacterCreation, SettingsModal, HelpModal, InventoryModal, CharacterSheet, StorageModal, BestiaryModal, QuestPanel, ShopInterface, SaveLoadModal } from './components/UIComponents';
import GameLog from './components/GameLog';
import CombatView from './components/CombatView';
import { 
  GameState, GameMode, TileType, Weather, TimeOfDay, Player, LogEntry, NPC, EquipmentSlot, Item, Stats, BattleSpeed, Enemy, CombatState, InteractableType, QuestStatus, QuestType 
} from './types';
import { 
  BASE_STATS, WEATHER_ICONS, NPC_TEMPLATES, DIALOGUE_TREE, ITEMS, generateVillage, generateWorldMap, generatePlayerHome, generateCity
} from './constants';
import { 
  calculateStats, formatTime, formatDate, generateLocationDescription, generateEnemy, resolveAutoTurn, calculateFleeChance, generateRandomQuest, generateProceduralItem, calculateTotalDays, generateShopInventory
} from './utils';
import { Settings, HelpCircle, Clock, Calendar, Map as MapIcon, Backpack, User, BookOpen, Save, Upload, Loader, Sparkles, Scroll, Heart, Zap } from 'lucide-react';

// --- Actions ---

type Action =
  | { type: 'START_GAME'; payload: Partial<Player> }
  | { type: 'SAVE_GAME'; payload: number }
  | { type: 'LOAD_GAME'; payload: number }
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'PLAYER_STEP'; payload: { x: number; y: number } } // Consolidated Action
  | { type: 'SWITCH_MAP'; payload: { mapId: string; x: number; y: number } }
  | { type: 'ADD_LOG'; payload: Omit<LogEntry, 'id' | 'timestamp'> }
  | { type: 'START_INTERACTION'; payload: { npcId: string; dialogueId: string } }
  | { type: 'UPDATE_GAME_STATE'; payload: { player?: Player; npcs?: NPC[] } }
  | { type: 'END_INTERACTION' }
  | { type: 'EQUIP_ITEM'; payload: Item }
  | { type: 'UNEQUIP_ITEM'; payload: EquipmentSlot }
  | { type: 'USE_ITEM'; payload: Item }
  | { type: 'LEVEL_UP' }
  | { type: 'ALLOCATE_STAT'; payload: keyof Stats }
  | { type: 'INIT_COMBAT'; payload: { enemy: Enemy } }
  | { type: 'START_COMBAT' }
  | { type: 'ATTEMPT_FLEE' }
  | { type: 'COMBAT_TICK' }
  | { type: 'TOGGLE_COMBAT_SPEED' }
  | { type: 'END_COMBAT'; payload: { victory: boolean } }
  | { type: 'CLOSE_COMBAT' }
  | { type: 'REST' }
  | { type: 'STORAGE_DEPOSIT'; payload: Item }
  | { type: 'STORAGE_WITHDRAW'; payload: Item }
  | { type: 'GENERATE_QUEST' }
  | { type: 'CLAIM_QUEST'; payload: string }
  | { type: 'OPEN_SHOP'; payload: string }
  | { type: 'RESTOCK_SHOP'; payload: string }
  | { type: 'BUY_ITEM'; payload: Item }
  | { type: 'SELL_ITEM'; payload: Item };

// --- Initial State ---

const villageMap = generateVillage();
const worldMap = generateWorldMap();
const homeMap = generatePlayerHome();
const cityMap = generateCity();

const initialState: GameState = {
  mode: GameMode.MENU,
  player: {
    name: 'Traveler',
    race: 'Human',
    class: 'Peasant',
    level: 1,
    exp: 0,
    maxExp: 100,
    attributePoints: 0,
    hp: 100,
    mp: 50,
    baseStats: BASE_STATS,
    gold: 50,
    inventory: [],
    equipment: {
        [EquipmentSlot.MAIN_HAND]: null,
        [EquipmentSlot.OFF_HAND]: null,
        [EquipmentSlot.HEAD]: null,
        [EquipmentSlot.BODY]: null,
        [EquipmentSlot.LEGS]: null,
        [EquipmentSlot.FEET]: null,
        [EquipmentSlot.ACCESSORY]: null,
    },
    position: { x: Math.floor(villageMap.width / 2), y: Math.floor(villageMap.height / 2) },
    reputation: 0,
    skills: [],
    quests: [],
    completedQuestIds: [],
    statusEffects: []
  },
  npcs: NPC_TEMPLATES,
  currentMapId: 'starter_village',
  maps: {
    'starter_village': villageMap,
    'world_map': worldMap,
    'player_home': homeMap,
    'capital_city': cityMap
  },
  storage: [],
  date: { year: 1, month: 1, day: 1, hour: 8, minute: 0 },
  weather: Weather.CLEAR,
  timeOfDay: TimeOfDay.DAY,
  logs: [{ id: 'init', timestamp: '00:00', text: 'Welcome to Cavanon.', type: 'SYSTEM' }],
  activeInteraction: null,
  combat: null,
  settings: { textSpeed: 'NORMAL' }
};

// --- Reducer ---

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'START_GAME': {
      const startPlayer = { ...state.player, ...action.payload };
      const { derived: startDerived } = calculateStats(startPlayer as Player);
      startPlayer.hp = startDerived.maxHp;
      startPlayer.mp = startDerived.maxMp;

      return {
        ...state,
        mode: GameMode.EXPLORATION,
        player: startPlayer as Player,
        logs: [...state.logs, { 
          id: Date.now().toString(), 
          timestamp: formatTime(state.date), 
          text: `You awaken in Oakhaven Village. The journey begins.`, 
          type: 'NARRATIVE' 
        }]
      };
    }
    case 'SAVE_GAME': {
        const slot = action.payload;
        try {
            const saveState = { ...state, mode: GameMode.EXPLORATION }; // Ensure we save as Exploration
            localStorage.setItem(`cavanon_save_${slot}`, JSON.stringify(saveState));
            return {
                 ...state,
                 mode: GameMode.EXPLORATION,
                 logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: `Game Saved to Slot ${slot}.`, type: 'SYSTEM' }]
            };
        } catch (e) {
            return state;
        }
    }
    case 'LOAD_GAME': {
         try {
            const slot = action.payload;
            const saved = localStorage.getItem(`cavanon_save_${slot}`);
            if (saved) {
                const loadedState = JSON.parse(saved);
                return { 
                    ...loadedState, 
                    mode: GameMode.EXPLORATION, 
                    logs: [...loadedState.logs, { id: Date.now().toString(), timestamp: formatTime(loadedState.date), text: "Game Loaded.", type: 'SYSTEM' }] 
                };
            }
        } catch (e) {}
        return state;
    }
    case 'SET_MODE':
      return { 
        ...state, 
        mode: action.payload, 
        // Improve previousMode tracking to handle Menu/Settings correctly
        previousMode: (state.mode === GameMode.EXPLORATION || state.mode === GameMode.MENU || state.mode === GameMode.SETTINGS) ? state.mode : state.previousMode 
      };
    case 'PLAYER_STEP': {
      const currentMap = state.maps[state.currentMapId];
      const { x, y } = action.payload;
      
      // 1. Map Updates (Optimized)
      let newMaps = state.maps;
      if (!currentMap.tiles[y][x].explored) {
          const newRows = [...currentMap.tiles]; 
          newRows[y] = [...newRows[y]]; 
          newRows[y][x] = { ...newRows[y][x], explored: true }; 
          newMaps = { ...state.maps, [state.currentMapId]: { ...currentMap, tiles: newRows } };
      }

      // 2. Time Updates
      const addedMinutes = 5;
      let { year, month, day, hour, minute } = state.date;
      minute += addedMinutes;
      while (minute >= 60) { minute -= 60; hour++; }
      while (hour >= 24) { hour -= 24; day++; }
      while (day > 30) { day -= 30; month++; }
      while (month > 12) { month -= 12; year++; }

      let timeOfDay = TimeOfDay.NIGHT;
      if (hour >= 5 && hour < 9) timeOfDay = TimeOfDay.DAWN;
      else if (hour >= 9 && hour < 18) timeOfDay = TimeOfDay.DAY;
      else if (hour >= 18 && hour < 21) timeOfDay = TimeOfDay.DUSK;

      // 3. Regeneration
      const { derived } = calculateStats(state.player);
      const hpRecovered = Math.max(0, (derived.hpRegen * (addedMinutes / 60)));
      const mpRecovered = Math.max(0, (derived.mpRegen * (addedMinutes / 60)));
      const newHp = Math.min(derived.maxHp, state.player.hp + hpRecovered);
      const newMp = Math.min(derived.maxMp, state.player.mp + mpRecovered);

      // 4. Encounter Check
      const tile = currentMap.tiles[y][x];
      let nextMode = state.mode;
      let nextCombat = state.combat;
      
      if ([TileType.GRASS, TileType.FOREST, TileType.MOUNTAIN, TileType.DUNGEON, TileType.RUINS, TileType.WATER].includes(tile.type)) {
           if (Math.random() < 0.05) { // 5% chance
               const enemy = generateEnemy(tile.type, state.player.level);
               nextMode = GameMode.COMBAT;
               nextCombat = {
                    enemy,
                    logs: [],
                    turn: 1,
                    speed: BattleSpeed.NORMAL,
                    isVictory: null,
                    playerCooldowns: {},
                    isStarted: false
               };
           }
      }

      return {
        ...state,
        player: { ...state.player, position: { x, y }, hp: newHp, mp: newMp },
        maps: newMaps,
        date: { year, month, day, hour, minute },
        timeOfDay,
        mode: nextMode,
        combat: nextCombat
      };
    }
    case 'SWITCH_MAP':
      return {
        ...state,
        currentMapId: action.payload.mapId,
        player: { ...state.player, position: { x: action.payload.x, y: action.payload.y } },
        logs: [...state.logs.slice(-49), {
          id: Date.now().toString(),
          timestamp: formatTime(state.date),
          text: `Traveled to ${state.maps[action.payload.mapId].name}.`,
          type: 'INFO'
        }]
      };
    case 'ADD_LOG':
      return {
        ...state,
        logs: [...state.logs.slice(-49), {
          id: Date.now().toString(),
          timestamp: formatTime(state.date),
          ...action.payload
        }]
      };
    case 'START_INTERACTION':
      return {
        ...state,
        mode: GameMode.INTERACTION,
        activeInteraction: {
          npcId: action.payload.npcId,
          dialogueId: action.payload.dialogueId,
          type: 'TALK'
        }
      };
    case 'UPDATE_GAME_STATE':
        return {
            ...state,
            player: action.payload.player || state.player,
            npcs: action.payload.npcs || state.npcs
        };
    case 'END_INTERACTION':
      return { ...state, mode: GameMode.EXPLORATION, activeInteraction: null };
    case 'EQUIP_ITEM': {
        const item = action.payload;
        if (!item.slot) return state;
        
        const oldItem = state.player.equipment[item.slot];
        const newInventory = state.player.inventory.filter(i => i !== item);
        if (oldItem) newInventory.push(oldItem);
        
        return {
            ...state,
            player: {
                ...state.player,
                inventory: newInventory,
                equipment: {
                    ...state.player.equipment,
                    [item.slot]: item
                }
            }
        };
    }
    case 'UNEQUIP_ITEM': {
        const slot = action.payload;
        const item = state.player.equipment[slot];
        if (!item) return state;

        return {
            ...state,
            player: {
                ...state.player,
                inventory: [...state.player.inventory, item],
                equipment: {
                    ...state.player.equipment,
                    [slot]: null
                }
            }
        };
    }
    case 'USE_ITEM': {
        const item = action.payload;
        const newInventory = state.player.inventory.filter(i => i !== item);
        let newHp = state.player.hp;
        let text = `Used ${item.name}.`;
        
        if (item.id === 'POTION_HP') {
            const { derived } = calculateStats(state.player);
            newHp = Math.min(derived.maxHp, state.player.hp + 50);
            text += " Recovered 50 HP.";
        }
        if (item.id === 'POTION_MAX') {
             const { derived } = calculateStats(state.player);
             newHp = derived.maxHp;
             text += " Fully Recovered HP.";
        }
        if (item.id === 'BREAD') {
             const { derived } = calculateStats(state.player);
             newHp = Math.min(derived.maxHp, state.player.hp + 10);
             text += " Recovered 10 HP.";
        }
        if (item.id === 'STEAK') {
             const { derived } = calculateStats(state.player);
             newHp = Math.min(derived.maxHp, state.player.hp + 30);
             text += " Recovered 30 HP.";
        }
        if (item.id === 'CHEESE') {
             const { derived } = calculateStats(state.player);
             newHp = Math.min(derived.maxHp, state.player.hp + 20);
             text += " Recovered 20 HP.";
        }

        return {
            ...state,
            player: { ...state.player, inventory: newInventory, hp: newHp },
            logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text, type: 'INFO' }]
        };
    }
    case 'LEVEL_UP': {
        const newLevel = state.player.level + 1;
        const newMaxExp = Math.floor(state.player.maxExp * 1.5);
        const newPoints = state.player.attributePoints + 2;
        const { derived } = calculateStats({ ...state.player, level: newLevel });

        return {
            ...state,
            player: {
                ...state.player,
                level: newLevel,
                exp: state.player.exp - state.player.maxExp,
                maxExp: newMaxExp,
                attributePoints: newPoints,
                hp: derived.maxHp,
                mp: derived.maxMp
            },
            logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: `Level Up! You are now level ${newLevel}. (+2 Attribute Points)`, type: 'SYSTEM' }]
        };
    }
    case 'ALLOCATE_STAT': {
        if (state.player.attributePoints <= 0) return state;
        const stat = action.payload;
        const newBaseStats = { ...state.player.baseStats, [stat]: state.player.baseStats[stat] + 1 };
        return {
            ...state,
            player: {
                ...state.player,
                baseStats: newBaseStats,
                attributePoints: state.player.attributePoints - 1
            }
        };
    }
    case 'REST': {
        const addedMinutes = 480;
        const { derived } = calculateStats(state.player);
        
        let { year, month, day, hour, minute } = state.date;
        minute += addedMinutes;
        while (minute >= 60) { minute -= 60; hour++; }
        while (hour >= 24) { hour -= 24; day++; }
        while (day > 30) { day -= 30; month++; }
        while (month > 12) { month -= 12; year++; }

        let timeOfDay = TimeOfDay.NIGHT;
        if (hour >= 5 && hour < 9) timeOfDay = TimeOfDay.DAWN;
        else if (hour >= 9 && hour < 18) timeOfDay = TimeOfDay.DAY;
        else if (hour >= 18 && hour < 21) timeOfDay = TimeOfDay.DUSK;

        return {
            ...state,
            date: { year, month, day, hour, minute },
            timeOfDay,
            player: { ...state.player, hp: derived.maxHp, mp: derived.maxMp },
            logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: "You slept soundly and feel completely refreshed.", type: 'NARRATIVE' }]
        };
    }
    case 'STORAGE_DEPOSIT': {
        const item = action.payload;
        const newInv = state.player.inventory.filter(i => i !== item);
        return {
            ...state,
            player: { ...state.player, inventory: newInv },
            storage: [...state.storage, item]
        };
    }
    case 'STORAGE_WITHDRAW': {
        const item = action.payload;
        const newStorage = state.storage.filter(i => i !== item);
        return {
            ...state,
            player: { ...state.player, inventory: [...state.player.inventory, item] },
            storage: newStorage
        };
    }
    case 'GENERATE_QUEST': {
        const newQuest = generateRandomQuest(state.player.level);
        return {
            ...state,
            player: { ...state.player, quests: [...state.player.quests, newQuest] },
            logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: `New Quest Accepted: ${newQuest.title}`, type: 'QUEST' }]
        };
    }
    case 'CLAIM_QUEST': {
        const questId = action.payload;
        const quest = state.player.quests.find(q => q.id === questId);
        if (!quest || quest.status !== QuestStatus.COMPLETED) return state;

        const newExp = state.player.exp + quest.expReward;
        const newGold = state.player.gold + quest.goldReward;
        const remainingQuests = state.player.quests.filter(q => q.id !== questId);
        
        return {
            ...state,
            player: {
                ...state.player,
                exp: newExp,
                gold: newGold,
                quests: remainingQuests,
                completedQuestIds: [...state.player.completedQuestIds, questId]
            },
            logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: `Quest Complete: ${quest.title} (+${quest.expReward} XP, +${quest.goldReward}g)`, type: 'QUEST' }]
        };
    }
    case 'OPEN_SHOP': {
        const npcId = action.payload;
        const npcIndex = state.npcs.findIndex(n => n.id === npcId);
        if (npcIndex === -1) return state;
        
        const currentDays = calculateTotalDays(state.date);
        const npc = state.npcs[npcIndex];
        let updatedNpcs = state.npcs;

        // Check for Restock (First time OR Weekly)
        const shouldRestock = !npc.hasGeneratedInventory || (npc.lastRestockDay && (currentDays - npc.lastRestockDay >= 7));

        if (shouldRestock) {
             const newInventory = generateShopInventory(npc.role, state.player.level);
             updatedNpcs = [...state.npcs];
             updatedNpcs[npcIndex] = { 
                 ...npc, 
                 inventory: newInventory, 
                 hasGeneratedInventory: true,
                 lastRestockDay: currentDays
             };
        }

        return {
            ...state,
            npcs: updatedNpcs,
            mode: GameMode.SHOP,
            activeShopNpcId: npcId
        };
    }
    case 'RESTOCK_SHOP': {
        const npcId = action.payload;
        const npcIndex = state.npcs.findIndex(n => n.id === npcId);
        if (npcIndex === -1) return state;
        if (state.player.gold < 100) return state;

        const currentDays = calculateTotalDays(state.date);
        const newInventory = generateShopInventory(state.npcs[npcIndex].role, state.player.level);
        const updatedNpcs = [...state.npcs];
        updatedNpcs[npcIndex] = { 
            ...state.npcs[npcIndex], 
            inventory: newInventory,
            lastRestockDay: currentDays
        };

        return {
            ...state,
            player: { ...state.player, gold: state.player.gold - 100 },
            npcs: updatedNpcs,
            logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: "Shop restocked.", type: 'SYSTEM' }]
        };
    }
    case 'BUY_ITEM': {
        const item = action.payload;
        if (state.player.gold < item.value) return state;

        return {
            ...state,
            player: {
                ...state.player,
                gold: state.player.gold - item.value,
                inventory: [...state.player.inventory, item]
            }
        };
    }
    case 'SELL_ITEM': {
        const item = action.payload;
        const sellPrice = Math.floor(item.value * 0.5);
        const newInv = state.player.inventory.filter(i => i !== item);

        return {
            ...state,
            player: {
                ...state.player,
                gold: state.player.gold + sellPrice,
                inventory: newInv
            }
        };
    }
    case 'INIT_COMBAT':
        return {
            ...state,
            mode: GameMode.COMBAT,
            combat: {
                enemy: action.payload.enemy,
                logs: [],
                turn: 1,
                speed: BattleSpeed.NORMAL,
                isVictory: null,
                playerCooldowns: {},
                isStarted: false
            }
        };
    case 'START_COMBAT':
        if (!state.combat) return state;
        return {
            ...state,
            combat: {
                ...state.combat,
                isStarted: true,
                logs: [`A wild ${state.combat.enemy.name} appeared!`]
            }
        };
    case 'ATTEMPT_FLEE': {
        if (!state.combat) return state;
        const chance = calculateFleeChance(state.player, state.combat.enemy);
        const roll = Math.random() * 100;
        
        if (roll < chance) {
            return {
                 ...state,
                 mode: GameMode.EXPLORATION,
                 combat: null,
                 logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: `Successfully fled from ${state.combat.enemy.name}.`, type: 'COMBAT' }]
            };
        } else {
            const { playerHp, logs } = resolveAutoTurn({ ...state.player, baseStats: { ...state.player.baseStats, speed: -999 } }, state.combat.enemy, {});
            
            return {
                ...state,
                combat: {
                    ...state.combat,
                    isStarted: true,
                    logs: [...state.combat.logs, `Failed to flee! (Chance: ${chance}%)`]
                }
            };
        }
    }
    case 'COMBAT_TICK': {
        if (!state.combat || state.combat.isVictory !== null || !state.combat.isStarted) return state;

        const result = resolveAutoTurn(state.player, state.combat.enemy, state.combat.playerCooldowns);
        
        const newPlayerHp = result.playerHp;
        const newEnemyHp = result.enemyHp;
        const newMp = result.playerMp;
        const newCooldowns = result.newCooldowns;

        let victoryStatus: boolean | null = null;
        let loot: Item[] = [];

        if (newEnemyHp <= 0) {
            victoryStatus = true;
            state.combat.enemy.lootTable.forEach(entry => {
                if (Math.random() < entry.chance) {
                    loot.push(ITEMS[entry.itemId]);
                }
            });
        } else if (newPlayerHp <= 0) {
            victoryStatus = false;
        }

        return {
            ...state,
            player: { ...state.player, hp: newPlayerHp, mp: newMp },
            combat: {
                ...state.combat,
                enemy: { ...state.combat.enemy, hp: newEnemyHp },
                logs: [...state.combat.logs, ...result.logs],
                turn: state.combat.turn + 1,
                isVictory: victoryStatus,
                loot: loot.length > 0 ? loot : undefined,
                playerCooldowns: newCooldowns
            }
        };
    }
    case 'TOGGLE_COMBAT_SPEED': {
        if (!state.combat) return state;
        let newSpeed = BattleSpeed.NORMAL;
        if (state.combat.speed === BattleSpeed.NORMAL) newSpeed = BattleSpeed.FAST;
        else if (state.combat.speed === BattleSpeed.FAST) newSpeed = BattleSpeed.VERY_FAST;
        
        return { ...state, combat: { ...state.combat, speed: newSpeed } };
    }
    case 'END_COMBAT': {
        return {
            ...state,
            combat: state.combat ? { ...state.combat, isVictory: action.payload.victory } : null
        };
    }
    case 'CLOSE_COMBAT': {
        if (!state.combat) return state;
        
        let newPlayer = { ...state.player };
        let newLogs = [...state.logs];
        let newInv = [...state.player.inventory];

        if (state.combat.isVictory) {
            newPlayer.exp += state.combat.enemy.expReward;
            newPlayer.gold += state.combat.enemy.goldReward;
            
            // Add Loot
            if (state.combat.loot) {
                newInv = [...newInv, ...state.combat.loot];
            }
            
            newLogs.push({ 
                id: Date.now().toString(), 
                timestamp: formatTime(state.date), 
                text: `Defeated ${state.combat.enemy.name}. Gained ${state.combat.enemy.expReward} XP and ${state.combat.enemy.goldReward} gold.`,
                type: 'COMBAT' 
            });
            
            // Quest Progress Check (Kill Quests)
            newPlayer.quests = newPlayer.quests.map(q => {
                if (q.status === QuestStatus.ACTIVE && q.type === QuestType.KILL && q.targetName === state.combat?.enemy.name) {
                    const newAmt = q.amountCurrent + 1;
                    return { ...q, amountCurrent: newAmt, status: newAmt >= q.amountRequired ? QuestStatus.COMPLETED : QuestStatus.ACTIVE };
                }
                return q;
            });

        } else {
            newLogs.push({ 
                id: Date.now().toString(), 
                timestamp: formatTime(state.date), 
                text: `Defeated by ${state.combat.enemy.name}. You limp back to safety.`,
                type: 'COMBAT' 
            });
            newPlayer.hp = 1;
        }

        return {
            ...state,
            mode: GameMode.EXPLORATION,
            combat: null,
            player: { ...newPlayer, inventory: newInv },
            logs: newLogs
        };
    }
    default:
        return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [showHelp, setShowHelp] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);

  // Combat Tick Effect
  useEffect(() => {
    let interval: number;
    if (state.mode === GameMode.COMBAT && state.combat?.isStarted && state.combat.isVictory === null) {
        interval = setInterval(() => {
            dispatch({ type: 'COMBAT_TICK' });
        }, state.combat.speed) as unknown as number;
    }
    return () => clearInterval(interval);
  }, [state.mode, state.combat?.isStarted, state.combat?.isVictory, state.combat?.speed]);

  // Input Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (state.mode === GameMode.CREATION) return;
        
        // Menu toggles
        if (e.key === 'Escape') {
             dispatch({ type: 'SET_MODE', payload: state.mode === GameMode.SETTINGS ? state.previousMode || GameMode.EXPLORATION : GameMode.SETTINGS });
        }

        if (state.mode === GameMode.EXPLORATION) {
            let dx = 0; let dy = 0;
            if (e.key === 'w' || e.key === 'ArrowUp') dy = -1;
            if (e.key === 's' || e.key === 'ArrowDown') dy = 1;
            if (e.key === 'a' || e.key === 'ArrowLeft') dx = -1;
            if (e.key === 'd' || e.key === 'ArrowRight') dx = 1;

            if (dx !== 0 || dy !== 0) {
                const newX = state.player.position.x + dx;
                const newY = state.player.position.y + dy;
                const map = state.maps[state.currentMapId];
                
                // Bounds Check
                if (newX >= 0 && newX < map.width && newY >= 0 && newY < map.height) {
                    const tile = map.tiles[newY][newX];
                    if (tile.type !== TileType.WALL) {
                        
                        // Portal Check
                        if (tile.type === TileType.PORTAL && tile.portalTarget) {
                             dispatch({ type: 'SWITCH_MAP', payload: tile.portalTarget });
                             return;
                        }
                        
                        // Consolidated Player Step (Movement + Time + Encounters)
                        dispatch({ type: 'PLAYER_STEP', payload: { x: newX, y: newY } });
                    }
                }
            }

            if (e.key === 'e') {
                // Interaction
                const map = state.maps[state.currentMapId];
                const tile = map.tiles[state.player.position.y][state.player.position.x];
                
                // Interactable Objects
                if (tile.interactable) {
                    if (tile.interactable.type === InteractableType.BED) {
                        dispatch({ type: 'REST' });
                    }
                    if (tile.interactable.type === InteractableType.STORAGE) {
                        dispatch({ type: 'SET_MODE', payload: GameMode.STORAGE });
                    }
                }

                // NPCs
                const checkOffsets = [[0,0], [0,-1], [0,1], [-1,0], [1,0]];
                for (let [ox, oy] of checkOffsets) {
                    const tx = state.player.position.x + ox;
                    const ty = state.player.position.y + oy;
                    if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height) {
                        const t = map.tiles[ty][tx];
                        if (t.npcs.length > 0) {
                            const npcId = t.npcs[0]; // Just first one
                            const npc = state.npcs.find(n => n.id === npcId);
                            if (npc) {
                                dispatch({ type: 'START_INTERACTION', payload: { npcId: npc.id, dialogueId: npc.dialogueRoot } });
                                break;
                            }
                        }
                    }
                }
            }

            if (e.key === 'i') dispatch({ type: 'SET_MODE', payload: GameMode.INVENTORY });
            if (e.key === 'c') dispatch({ type: 'SET_MODE', payload: GameMode.CHARACTER });
            if (e.key === 'q') dispatch({ type: 'SET_MODE', payload: GameMode.QUESTS });
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.mode, state.player.position, state.currentMapId, state.maps, state.npcs, state.previousMode]);


  // --- Rendering ---

  if (state.mode === GameMode.MENU) {
      return (
          <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 animate-pulse"></div>
              <h1 className="pixel-font text-6xl text-amber-500 mb-8 drop-shadow-lg tracking-widest">CAVANON</h1>
              <div className="space-y-4 z-10">
                  <Button onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.CREATION })} className="w-64 py-4 text-xl">New Game</Button>
                  <Button onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.LOAD })} variant="secondary" className="w-64 py-4 text-xl">Load Game</Button>
                  <Button onClick={() => setShowBestiary(true)} variant="ghost" className="w-64">Bestiary</Button>
              </div>
              {showBestiary && <BestiaryModal onClose={() => setShowBestiary(false)} />}
          </div>
      );
  }

  if (state.mode === GameMode.CREATION) {
      return <CharacterCreation onComplete={(p) => dispatch({ type: 'START_GAME', payload: p })} onCancel={() => dispatch({ type: 'SET_MODE', payload: GameMode.MENU })} />;
  }

  // Exploration & Other Modes Overlay
  const currentMap = state.maps[state.currentMapId];
  
  return (
      <div className="h-full w-full bg-slate-900 text-slate-200 font-sans overflow-hidden flex flex-col md:flex-row">
          
          {/* Left: Game World */}
          <div className="flex-1 relative flex items-center justify-center bg-black/50">
              <WorldMap mapData={currentMap} player={state.player} npcs={state.npcs} />
              
              {/* Time/Weather Overlay (Detailed View) */}
              <div className="absolute top-4 left-4 bg-slate-900/90 p-3 rounded border border-slate-700 shadow-lg backdrop-blur-sm flex flex-col gap-1 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-sm tracking-wider border-b border-slate-800 pb-1 mb-1">
                        <span>Year {state.date.year}</span>
                        <span className="text-slate-600">•</span>
                        <span>Month {state.date.month}</span>
                        <span className="text-slate-600">•</span>
                        <span>Day {state.date.day}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs font-mono">
                      <div className="flex items-center gap-2 text-slate-300">
                          <Clock size={14} className={state.timeOfDay === TimeOfDay.NIGHT ? "text-blue-400" : "text-yellow-400"} />
                          {formatTime(state.date)} <span className="text-slate-500 uppercase">({state.timeOfDay})</span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-2" title={state.weather}>
                          {WEATHER_ICONS[state.weather]} {state.weather}
                      </div>
                  </div>
              </div>

              {/* Quick Actions */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                  <button onClick={() => setShowHelp(true)} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white border border-slate-600 shadow-lg" title="Help"><HelpCircle size={20} /></button>
                  <button onClick={() => setShowBestiary(true)} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white border border-slate-600 shadow-lg" title="Bestiary"><BookOpen size={20} /></button>
                  <button onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.SAVE })} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white border border-slate-600 shadow-lg" title="Save Game"><Save size={20} /></button>
                  <button onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.SETTINGS })} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white border border-slate-600 shadow-lg" title="Settings"><Settings size={20} /></button>
              </div>
          </div>

          {/* Right: HUD */}
          <div className="w-full md:w-96 bg-slate-950 border-l border-slate-800 flex flex-col">
              {/* Stats Panel */}
              <div className="p-4 border-b border-slate-800 bg-slate-900">
                  <div className="flex justify-between items-center mb-2">
                      <h2 className="font-bold text-amber-500">{state.player.name}</h2>
                      <span className="text-xs text-slate-500">Lvl {state.player.level} {state.player.race} {state.player.class}</span>
                  </div>
                  
                  <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          <Heart size={12} className="text-red-500" />
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-red-600" style={{ width: `${(state.player.hp / state.player.baseStats.constitution /* approx max */) * 100}%` }}></div> 
                              {/* Note: using simplified max calc for UI here, or invoke calculateStats */}
                          </div>
                          <span className="text-xs font-mono w-16 text-right">{Math.ceil(state.player.hp)}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Zap size={12} className="text-blue-500" />
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${(state.player.mp / 20) * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-mono w-16 text-right">{Math.ceil(state.player.mp)}</span>
                       </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                      <Button variant="secondary" className="py-1 px-1" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.INVENTORY })}><Backpack size={16}/></Button>
                      <Button variant="secondary" className="py-1 px-1" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.CHARACTER })}><User size={16}/></Button>
                      <Button variant="secondary" className="py-1 px-1" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.QUESTS })}><Scroll size={16}/></Button>
                      <Button variant="secondary" className="py-1 px-1" onClick={() => setShowBestiary(true)}><BookOpen size={16}/></Button>
                  </div>
              </div>

              {/* Game Log */}
              <div className="flex-1 overflow-hidden bg-slate-950">
                  <GameLog logs={state.logs} isLoading={false} />
              </div>
          </div>

          {/* Modals */}
          {state.mode === GameMode.COMBAT && state.combat && (
              <CombatView 
                combatState={state.combat} 
                player={state.player}
                onToggleSpeed={() => dispatch({ type: 'TOGGLE_COMBAT_SPEED' })}
                onFleeAttempt={() => dispatch({ type: 'ATTEMPT_FLEE' })}
                onStart={() => dispatch({ type: 'START_COMBAT' })}
                onClose={() => dispatch({ type: 'CLOSE_COMBAT' })}
              />
          )}

          {state.mode === GameMode.INVENTORY && (
              <InventoryModal 
                  player={state.player}
                  onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
                  onEquip={(item) => dispatch({ type: 'EQUIP_ITEM', payload: item })}
                  onUnequip={(slot) => dispatch({ type: 'UNEQUIP_ITEM', payload: slot })}
                  onUse={(item) => dispatch({ type: 'USE_ITEM', payload: item })}
              />
          )}
          
          {state.mode === GameMode.CHARACTER && (
              <CharacterSheet
                  player={state.player}
                  onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
                  onAllocate={(stat) => dispatch({ type: 'ALLOCATE_STAT', payload: stat })}
              />
          )}

          {state.mode === GameMode.STORAGE && (
              <StorageModal
                  player={state.player}
                  storage={state.storage}
                  onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
                  onDeposit={(item) => dispatch({ type: 'STORAGE_DEPOSIT', payload: item })}
                  onWithdraw={(item) => dispatch({ type: 'STORAGE_WITHDRAW', payload: item })}
              />
          )}

          {state.mode === GameMode.QUESTS && (
              <QuestPanel
                  quests={state.player.quests}
                  onClaim={(id) => dispatch({ type: 'CLAIM_QUEST', payload: id })}
                  onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
              />
          )}

          {state.mode === GameMode.SETTINGS && (
              <SettingsModal 
                  onClose={() => dispatch({ type: 'SET_MODE', payload: state.previousMode || GameMode.EXPLORATION })}
                  onLoadGame={() => dispatch({ type: 'SET_MODE', payload: GameMode.LOAD })}
              />
          )}

          {state.mode === GameMode.SAVE && (
              <SaveLoadModal 
                  mode="SAVE"
                  onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
                  onAction={(slot) => dispatch({ type: 'SAVE_GAME', payload: slot })}
              />
          )}

          {state.mode === GameMode.LOAD && (
              <SaveLoadModal 
                  mode="LOAD"
                  onClose={() => dispatch({ type: 'SET_MODE', payload: state.previousMode || GameMode.EXPLORATION })}
                  onAction={(slot) => dispatch({ type: 'LOAD_GAME', payload: slot })}
              />
          )}
          
          {state.mode === GameMode.SHOP && state.activeShopNpcId && (
              <ShopInterface 
                merchantName={state.npcs.find(n => n.id === state.activeShopNpcId)?.name || 'Merchant'}
                merchantInventory={state.npcs.find(n => n.id === state.activeShopNpcId)?.inventory || []}
                player={state.player}
                onBuy={(item) => dispatch({ type: 'BUY_ITEM', payload: item })}
                onSell={(item) => dispatch({ type: 'SELL_ITEM', payload: item })}
                onRestock={() => dispatch({ type: 'RESTOCK_SHOP', payload: state.activeShopNpcId! })}
                onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
              />
          )}

          {state.mode === GameMode.INTERACTION && state.activeInteraction && (
              <DialoguePanel 
                  npcName={state.npcs.find(n => n.id === state.activeInteraction!.npcId)?.name || 'Unknown'}
                  text={
                       typeof DIALOGUE_TREE[state.activeInteraction.dialogueId].text === 'function'
                       ? (DIALOGUE_TREE[state.activeInteraction.dialogueId].text as Function)(state.player, state.npcs.find(n => n.id === state.activeInteraction!.npcId))
                       : DIALOGUE_TREE[state.activeInteraction.dialogueId].text as string
                  }
                  options={DIALOGUE_TREE[state.activeInteraction.dialogueId].options.map(opt => ({
                      label: opt.text,
                      disabled: opt.requirement ? !opt.requirement(state.player, state.npcs.find(n => n.id === state.activeInteraction!.npcId)!) : false,
                      onClick: () => {
                          const npc = state.npcs.find(n => n.id === state.activeInteraction!.npcId)!;
                          if (opt.effect) {
                              opt.effect(state.player, npc);
                              dispatch({ type: 'UPDATE_GAME_