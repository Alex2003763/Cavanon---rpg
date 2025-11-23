import React, { useReducer, useEffect, useState, useRef } from 'react';
import WorldMap, { FullMap } from './components/WorldMap';
import { Panel, Button, DialoguePanel, CharacterCreation, SettingsModal, HelpModal, InventoryModal, CharacterSheet, StorageModal, BestiaryModal, QuestPanel, ShopInterface, SaveLoadModal } from './components/UIComponents';
import GameLog from './components/GameLog';
import CombatView from './components/CombatView';
import { 
  GameState, GameMode, TileType, Weather, TimeOfDay, Player, LogEntry, NPC, EquipmentSlot, Item, Stats, BattleSpeed, Enemy, CombatState, InteractableType, QuestStatus, QuestType, Action, AutoSaveFrequency, GameDate 
} from './types';
import { 
  BASE_STATS, WEATHER_ICONS, NPC_TEMPLATES, DIALOGUE_TREE, ITEMS, generateVillage, generateWorldMap, generatePlayerHome, generateCity
} from './constants';
import { 
  calculateStats, formatTime, generateEnemy, resolveAutoTurn, calculateFleeChance, generateRandomQuest, calculateTotalDays, generateShopInventory, generateProceduralItem, addToInventory, removeFromInventory
} from './utils';
import { Clock, Backpack, User, BookOpen, Save, HelpCircle, Heart, Zap, Scroll, Star, Settings, Sword, Map, Gamepad2, Skull, Crown } from 'lucide-react';

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
  settings: { 
      textSpeed: 'NORMAL',
      autoSaveFrequency: AutoSaveFrequency.EVENTS
  }
};

// --- Helper for Auto Save Check ---
const checkAutoSave = (oldDate: GameDate, newDate: GameDate, frequency: AutoSaveFrequency, isEvent: boolean) => {
    switch (frequency) {
        case AutoSaveFrequency.OFF: return false;
        case AutoSaveFrequency.EVENTS: return isEvent;
        case AutoSaveFrequency.HOURLY: return oldDate.hour !== newDate.hour || oldDate.day !== newDate.day;
        case AutoSaveFrequency.DAILY: return oldDate.day !== newDate.day || oldDate.month !== newDate.month;
        case AutoSaveFrequency.WEEKLY: 
            const oldWeek = Math.floor(calculateTotalDays(oldDate) / 7);
            const newWeek = Math.floor(calculateTotalDays(newDate) / 7);
            return oldWeek !== newWeek;
        default: return false;
    }
};

// --- Reducer ---

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'START_GAME': {
      const startPlayer = { ...state.player, ...action.payload };
      const { derived: startDerived } = calculateStats(startPlayer as Player);
      startPlayer.hp = startDerived.maxHp;
      startPlayer.mp = startDerived.maxMp;
      
      // Ensure starter items stack properly
      let stackedInv: Item[] = [];
      startPlayer.inventory.forEach(item => {
          stackedInv = addToInventory(stackedInv, item, item.quantity || 1);
      });
      startPlayer.inventory = stackedInv;

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
            const key = slot === 0 ? 'cavanon_autosave' : `cavanon_save_${slot}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                const loadedState = JSON.parse(saved);
                return { 
                    ...loadedState, 
                    mode: GameMode.EXPLORATION, 
                    logs: [...loadedState.logs, { id: Date.now().toString(), timestamp: formatTime(loadedState.date), text: slot === 0 ? "Auto Save Loaded." : "Game Loaded.", type: 'SYSTEM' }] 
                };
            }
        } catch (e) {}
        return state;
    }
    case 'SET_MODE':
      return { 
        ...state, 
        mode: action.payload, 
        // Don't track SETTINGS as a previous mode to return to; return to what was before it.
        previousMode: (state.mode === GameMode.EXPLORATION || state.mode === GameMode.MENU) ? state.mode : state.previousMode 
      };
    case 'UPDATE_SETTINGS':
        return {
            ...state,
            settings: { ...state.settings, ...action.payload }
        };
    case 'PLAYER_STEP': {
      const currentMap = state.maps[state.currentMapId];
      const { x, y } = action.payload;
      const oldDate = state.date;
      
      // 1. Map Updates (Optimized)
      let newMaps = state.maps;
      if (!currentMap.tiles[y][x].explored) {
          const newRows = [...currentMap.tiles]; 
          newRows[y] = [...newRows[y]]; 
          newRows[y][x] = { ...newRows[y][x], explored: true }; 
          newMaps = { ...state.maps, [state.currentMapId]: { ...currentMap, tiles: newRows } };
      }

      // 2. Time Updates
      // Base cost: 1 min for small maps, 5 mins for world map
      let addedMinutes = state.currentMapId === 'world_map' ? 5 : 1;
      
      // Terrain penalty: Mountain and Water cost 10 mins
      const targetTile = currentMap.tiles[y][x];
      if (targetTile.type === TileType.MOUNTAIN || targetTile.type === TileType.WATER) {
          addedMinutes = 10;
      }
      
      let { year, month, day, hour, minute } = state.date;
      minute += addedMinutes;
      while (minute >= 60) { minute -= 60; hour++; }
      while (hour >= 24) { hour -= 24; day++; }
      while (day > 30) { day -= 30; month++; }
      while (month > 12) { month -= 12; year++; }

      const newDate = { year, month, day, hour, minute };

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

      // 4. Encounter Check (Only on World Map)
      const tile = currentMap.tiles[y][x];
      let nextMode = state.mode;
      let nextCombat = state.combat;
      const isWorldMap = state.currentMapId === 'world_map';
      
      if (isWorldMap && [TileType.GRASS, TileType.FOREST, TileType.MOUNTAIN, TileType.DUNGEON, TileType.RUINS, TileType.WATER].includes(tile.type)) {
           if (Math.random() < 0.03) { // 3% chance on step
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

      const newState = {
        ...state,
        player: { ...state.player, position: { x, y }, hp: newHp, mp: newMp },
        maps: newMaps,
        date: newDate,
        timeOfDay,
        mode: nextMode,
        combat: nextCombat
      };

      // Auto Save Check
      if (checkAutoSave(oldDate, newDate, state.settings.autoSaveFrequency, false)) {
          try {
             localStorage.setItem('cavanon_autosave', JSON.stringify({ ...newState, mode: GameMode.EXPLORATION }));
             newState.logs = [...newState.logs, { id: Date.now().toString(), timestamp: formatTime(newState.date), text: "Auto Saved.", type: 'SYSTEM' }];
          } catch(e) {}
      }

      return newState;
    }
    case 'SEARCH_AREA': {
        const oldDate = state.date;
        // 1. Time Updates (Searching takes 30 mins)
        const addedMinutes = 30;
        let { year, month, day, hour, minute } = state.date;
        minute += addedMinutes;
        while (minute >= 60) { minute -= 60; hour++; }
        while (hour >= 24) { hour -= 24; day++; }
        while (day > 30) { day -= 30; month++; }
        while (month > 12) { month -= 12; year++; }

        const newDate = { year, month, day, hour, minute };

        let timeOfDay = TimeOfDay.NIGHT;
        if (hour >= 5 && hour < 9) timeOfDay = TimeOfDay.DAWN;
        else if (hour >= 9 && hour < 18) timeOfDay = TimeOfDay.DAY;
        else if (hour >= 18 && hour < 21) timeOfDay = TimeOfDay.DUSK;

        // 2. Regeneration
        const { derived } = calculateStats(state.player);
        const hpRecovered = Math.max(0, (derived.hpRegen * (addedMinutes / 60)));
        const mpRecovered = Math.max(0, (derived.mpRegen * (addedMinutes / 60)));
        const newHp = Math.min(derived.maxHp, state.player.hp + hpRecovered);
        const newMp = Math.min(derived.maxMp, state.player.mp + mpRecovered);

        // 3. Search Outcome Logic
        const roll = Math.random();
        const currentMap = state.maps[state.currentMapId];
        const tile = currentMap.tiles[state.player.position.y][state.player.position.x];
        
        let nextMode = state.mode;
        let nextCombat = state.combat;
        let newLogs = [...state.logs];
        let newInventory = [...state.player.inventory];

        // Can only find things in wild areas on World Map mostly, but allow local map foraging
        const isWild = [TileType.GRASS, TileType.FOREST, TileType.MOUNTAIN, TileType.DUNGEON, TileType.RUINS, TileType.WATER].includes(tile.type);

        if (isWild) {
            // Check world map for encounter restriction
            const isWorldMap = state.currentMapId === 'world_map';
            if (roll < 0.35 && isWorldMap) { 
                // 35% Encounter (Only on world map)
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
            } else if (roll < 0.55) {
                // 20% Find Item
                const itemType = Math.random() > 0.5 ? 'CONSUMABLE' : 'MISC';
                let foundItem;
                if (itemType === 'CONSUMABLE') {
                    foundItem = Math.random() > 0.5 ? ITEMS['POTION_HP'] : ITEMS['BREAD'];
                } else {
                    foundItem = generateProceduralItem(state.player.level, 'WEAPON'); // Occasional gear
                    if (Math.random() > 0.1) foundItem = ITEMS['GIFT_FLOWER']; // Mostly trash/misc
                }
                
                // Stack the item
                newInventory = addToInventory(newInventory, foundItem, 1);

                newLogs.push({
                    id: Date.now().toString(),
                    timestamp: `${hour}:${minute.toString().padStart(2,'0')}`,
                    text: `You searched the area and found: ${foundItem.name}.`,
                    type: 'INFO'
                });
            } else {
                // Nothing
                newLogs.push({
                    id: Date.now().toString(),
                    timestamp: `${hour}:${minute.toString().padStart(2,'0')}`,
                    text: `You spent 30 minutes searching but found nothing of interest.`,
                    type: 'NARRATIVE'
                });
            }
        } else {
            newLogs.push({
                id: Date.now().toString(),
                timestamp: `${hour}:${minute.toString().padStart(2,'0')}`,
                text: `You look around the ${tile.type.toLowerCase()}, but there is nothing to find here.`,
                type: 'NARRATIVE'
            });
        }

        const newState = {
            ...state,
            player: { ...state.player, hp: newHp, mp: newMp, inventory: newInventory },
            date: newDate,
            timeOfDay,
            mode: nextMode,
            combat: nextCombat,
            logs: newLogs
        };

        // Auto Save Check
        if (checkAutoSave(oldDate, newDate, state.settings.autoSaveFrequency, false)) {
            try {
                localStorage.setItem('cavanon_autosave', JSON.stringify({ ...newState, mode: GameMode.EXPLORATION }));
                newState.logs = [...newState.logs, { id: Date.now().toString(), timestamp: formatTime(newState.date), text: "Auto Saved.", type: 'SYSTEM' }];
            } catch(e) {}
        }

        return newState;
    }
    case 'SWITCH_MAP': {
      const newState = {
        ...state,
        currentMapId: action.payload.mapId,
        player: { ...state.player, position: { x: action.payload.x, y: action.payload.y } },
        logs: [...state.logs.slice(-49), {
          id: Date.now().toString(),
          timestamp: formatTime(state.date),
          text: `Traveled to ${state.maps[action.payload.mapId].name}.`,
          type: 'INFO' as const
        }]
      };

      if (checkAutoSave(state.date, state.date, state.settings.autoSaveFrequency, true)) {
          try {
             const saveState = { ...newState, mode: GameMode.EXPLORATION };
             localStorage.setItem('cavanon_autosave', JSON.stringify(saveState));
             newState.logs = [...newState.logs, { id: Date.now().toString(), timestamp: formatTime(newState.date), text: "Auto Saved.", type: 'SYSTEM' }];
          } catch(e) {}
      }

      return newState;
    }
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
        
        // Remove 1 count of new item from inventory
        let newInventory = removeFromInventory(state.player.inventory, item, 1);
        
        // Add old item back to inventory
        if (oldItem) {
            newInventory = addToInventory(newInventory, oldItem, 1);
        }
        
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

        const newInventory = addToInventory(state.player.inventory, item, 1);

        return {
            ...state,
            player: {
                ...state.player,
                inventory: newInventory,
                equipment: {
                    ...state.player.equipment,
                    [slot]: null
                }
            }
        };
    }
    case 'USE_ITEM': {
        const item = action.payload;
        
        // Remove 1 unit
        const newInventory = removeFromInventory(state.player.inventory, item, 1);
        
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
        const oldDate = state.date;
        const addedMinutes = 480;
        const { derived } = calculateStats(state.player);
        
        let { year, month, day, hour, minute } = state.date;
        minute += addedMinutes;
        while (minute >= 60) { minute -= 60; hour++; }
        while (hour >= 24) { hour -= 24; day++; }
        while (day > 30) { day -= 30; month++; }
        while (month > 12) { month -= 12; year++; }

        const newDate = { year, month, day, hour, minute };

        let timeOfDay = TimeOfDay.NIGHT;
        if (hour >= 5 && hour < 9) timeOfDay = TimeOfDay.DAWN;
        else if (hour >= 9 && hour < 18) timeOfDay = TimeOfDay.DAY;
        else if (hour >= 18 && hour < 21) timeOfDay = TimeOfDay.DUSK;

        const newState = {
            ...state,
            date: newDate,
            timeOfDay,
            player: { ...state.player, hp: derived.maxHp, mp: derived.maxMp },
            logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: "You slept soundly and feel completely refreshed.", type: 'NARRATIVE' as const }]
        };
        
        // Rest counts as an event and time passing
        if (checkAutoSave(oldDate, newDate, state.settings.autoSaveFrequency, true)) {
             try {
                 localStorage.setItem('cavanon_autosave', JSON.stringify(newState));
                 newState.logs = [...newState.logs, { id: Date.now().toString(), timestamp: formatTime(newState.date), text: "Auto Saved.", type: 'SYSTEM' }];
             } catch(e) {}
        }
        return newState;
    }
    case 'STORAGE_DEPOSIT': {
        const item = action.payload;
        // Remove 1 from player
        const newInv = removeFromInventory(state.player.inventory, item, 1);
        // Add 1 to storage
        const newStorage = addToInventory(state.storage, item, 1);
        return {
            ...state,
            player: { ...state.player, inventory: newInv },
            storage: newStorage
        };
    }
    case 'STORAGE_WITHDRAW': {
        const item = action.payload;
        // Remove 1 from storage
        const newStorage = removeFromInventory(state.storage, item, 1);
        // Add 1 to player
        const newInv = addToInventory(state.player.inventory, item, 1);
        return {
            ...state,
            player: { ...state.player, inventory: newInv },
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
        
        // Add to inventory (handles stacks)
        const newInv = addToInventory(state.player.inventory, item, 1);

        return {
            ...state,
            player: {
                ...state.player,
                gold: state.player.gold - item.value,
                inventory: newInv
            }
        };
    }
    case 'SELL_ITEM': {
        const item = action.payload;
        const sellPrice = Math.floor(item.value * 0.5);
        
        // Remove 1 from inventory
        const newInv = removeFromInventory(state.player.inventory, item, 1);

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
                state.combat.loot.forEach(item => {
                    newInv = addToInventory(newInv, item, 1);
                });
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
            
            // Level Up check is handled by the useEffect in the App component

        } else {
            newLogs.push({ 
                id: Date.now().toString(), 
                timestamp: formatTime(state.date), 
                text: `Defeated by ${state.combat.enemy.name}. You limp back to safety.`,
                type: 'COMBAT' 
            });
            newPlayer.hp = 1;
        }

        const newState = {
            ...state,
            mode: GameMode.EXPLORATION,
            combat: null,
            player: { ...newPlayer, inventory: newInv },
            logs: newLogs
        };

        if (state.combat.isVictory && checkAutoSave(state.date, state.date, state.settings.autoSaveFrequency, true)) {
            try {
                const saveState = { ...newState, mode: GameMode.EXPLORATION };
                localStorage.setItem('cavanon_autosave', JSON.stringify(saveState));
                newState.logs = [...newState.logs, { id: Date.now().toString(), timestamp: formatTime(newState.date), text: "Auto Saved.", type: 'SYSTEM' }];
            } catch(e) {}
        }

        return newState;
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

  // Level Up Check Effect
  useEffect(() => {
     if (state.player.exp >= state.player.maxExp) {
         dispatch({ type: 'LEVEL_UP' });
     }
  }, [state.player.exp, state.player.maxExp]);

  // Input Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (state.mode === GameMode.CREATION) return;
        
        // Menu toggles
        if (e.key === 'Escape') {
             dispatch({ type: 'SET_MODE', payload: state.mode === GameMode.SETTINGS ? state.previousMode || GameMode.EXPLORATION : GameMode.SETTINGS });
        }
        
        // Handle Map View toggle
        if (e.key === 'm') {
             if (state.mode === GameMode.EXPLORATION) {
                 dispatch({ type: 'SET_MODE', payload: GameMode.MAP_VIEW });
             } else if (state.mode === GameMode.MAP_VIEW) {
                 dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION });
             }
             return;
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
                        
                        // Portal Check - Now supports PORTAL types and any tile with a target (like Towns converted to portals)
                        if (tile.portalTarget) {
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
                let foundInteraction = false;

                // Interactable Objects
                if (tile.interactable) {
                    foundInteraction = true;
                    if (tile.interactable.type === InteractableType.BED) {
                        dispatch({ type: 'REST' });
                    }
                    if (tile.interactable.type === InteractableType.STORAGE) {
                        dispatch({ type: 'SET_MODE', payload: GameMode.STORAGE });
                    }
                }

                // NPCs
                if (!foundInteraction) {
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
                                    foundInteraction = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                // If nothing specific, Search/Forage the area
                if (!foundInteraction) {
                    dispatch({ type: 'SEARCH_AREA' });
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

  const isMenuContext = state.mode === GameMode.MENU || 
    ((state.mode === GameMode.SETTINGS || state.mode === GameMode.LOAD) && state.previousMode === GameMode.MENU);

  if (isMenuContext) {
      return (
          <div className="h-full w-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
              {/* High Quality Fantasy Background */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2544&auto=format&fit=crop')] bg-cover bg-center opacity-40 animate-pulse-slow"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-900/60 to-slate-950 z-0"></div>
              
              {/* Main Container */}
              <div className="relative z-10 flex flex-col items-center gap-10 animate-in zoom-in duration-700">
                  
                  {/* Title Section */}
                  <div className="text-center group">
                      <div className="flex items-center justify-center gap-4 mb-2">
                          <Sword size={40} className="text-amber-600 animate-bounce-slow" />
                          <h1 className="pixel-font text-7xl text-amber-500 tracking-[0.2em] drop-shadow-[0_0_25px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform duration-500">
                              CAVANON
                          </h1>
                          <Sword size={40} className="text-amber-600 animate-bounce-slow rotate-180 scale-x-[-1]" />
                      </div>
                      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-700 to-transparent mb-2"></div>
                      <p className="text-slate-400 font-serif italic tracking-widest text-sm drop-shadow-md">INFINITE GRID RPG</p>
                  </div>

                  {/* Menu Options */}
                  <div className="flex flex-col gap-4 w-80">
                      <button 
                          onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.CREATION })} 
                          className="group relative bg-slate-900/80 backdrop-blur-sm border border-amber-900/50 hover:border-amber-500 p-4 rounded transition-all duration-300 hover:bg-slate-800/90 overflow-hidden shadow-lg"
                      >
                          <div className="absolute inset-0 bg-amber-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                          <div className="flex items-center justify-between relative z-10">
                              <span className="pixel-font text-lg text-amber-100 group-hover:text-amber-400 transition-colors">New Game</span>
                              <Map className="text-slate-500 group-hover:text-amber-500" size={20} />
                          </div>
                      </button>

                      <button 
                          onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.LOAD })} 
                          className="group relative bg-slate-900/80 backdrop-blur-sm border border-slate-800 hover:border-cyan-500 p-4 rounded transition-all duration-300 hover:bg-slate-800/90 overflow-hidden shadow-lg"
                      >
                          <div className="absolute inset-0 bg-cyan-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                          <div className="flex items-center justify-between relative z-10">
                              <span className="pixel-font text-lg text-slate-300 group-hover:text-cyan-400 transition-colors">Load Game</span>
                              <Save className="text-slate-500 group-hover:text-cyan-500" size={20} />
                          </div>
                      </button>

                      <button 
                          onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.SETTINGS })} 
                          className="group relative bg-slate-900/80 backdrop-blur-sm border border-slate-800 hover:border-slate-400 p-4 rounded transition-all duration-300 hover:bg-slate-800/90 overflow-hidden shadow-lg"
                      >
                          <div className="absolute inset-0 bg-slate-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                          <div className="flex items-center justify-between relative z-10">
                              <span className="pixel-font text-lg text-slate-300 group-hover:text-white transition-colors">Settings</span>
                              <Settings className="text-slate-500 group-hover:text-white" size={20} />
                          </div>
                      </button>

                      <button 
                          onClick={() => setShowBestiary(true)} 
                          className="group relative bg-slate-900/80 backdrop-blur-sm border border-slate-800 hover:border-red-500 p-4 rounded transition-all duration-300 hover:bg-slate-800/90 overflow-hidden shadow-lg"
                      >
                          <div className="absolute inset-0 bg-red-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                          <div className="flex items-center justify-between relative z-10">
                              <span className="pixel-font text-lg text-slate-300 group-hover:text-red-400 transition-colors">Bestiary</span>
                              <BookOpen className="text-slate-500 group-hover:text-red-500" size={20} />
                          </div>
                      </button>
                  </div>
                  
                  {/* Footer */}
                  <div className="text-slate-500 text-xs font-mono bg-slate-950/50 px-2 py-1 rounded">v1.3.0 • Early Access Build</div>
              </div>

              {showBestiary && <BestiaryModal onClose={() => setShowBestiary(false)} />}
              
              {/* Render Settings Modal on top of menu if active */}
              {state.mode === GameMode.SETTINGS && (
                  <SettingsModal 
                      onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.MENU })}
                      onLoadGame={() => dispatch({ type: 'SET_MODE', payload: GameMode.LOAD })}
                      isMainMenu={true}
                      settings={state.settings}
                      onUpdate={(newSettings) => dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings })}
                      onOpenHelp={() => setShowHelp(true)}
                  />
              )}
              
              {/* Render Load Modal on top of menu if active */}
              {state.mode === GameMode.LOAD && (
                  <SaveLoadModal 
                      mode="LOAD"
                      onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.MENU })}
                      onAction={(slot) => dispatch({ type: 'LOAD_GAME', payload: slot })}
                  />
              )}

              {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
          </div>
      );
  }

  if (state.mode === GameMode.CREATION) {
      return <CharacterCreation onComplete={(p) => dispatch({ type: 'START_GAME', payload: p })} onCancel={() => dispatch({ type: 'SET_MODE', payload: GameMode.MENU })} />;
  }

  if (state.mode === GameMode.COMBAT && state.combat) {
    return (
        <CombatView 
          combatState={state.combat} 
          player={state.player}
          onToggleSpeed={() => dispatch({ type: 'TOGGLE_COMBAT_SPEED' })}
          onFleeAttempt={() => dispatch({ type: 'ATTEMPT_FLEE' })}
          onStart={() => dispatch({ type: 'START_COMBAT' })}
          onClose={() => dispatch({ type: 'CLOSE_COMBAT' })}
        />
    );
  }

  // Calculate stats for HUD
  const { derived } = calculateStats(state.player);

  // Exploration & Other Modes Overlay
  const currentMap = state.maps[state.currentMapId];
  
  return (
      <div className="h-full w-full bg-slate-950 text-slate-200 font-sans overflow-hidden flex flex-col md:flex-row">
          
          {/* Left: Game World */}
          <div className="flex-1 relative flex items-center justify-center bg-black shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
              
              {/* World Map Frame */}
              <div className="relative p-1 rounded-xl bg-slate-900 shadow-2xl border border-slate-800">
                 <div className="absolute -inset-1 bg-gradient-to-br from-slate-800 to-slate-950 rounded-xl -z-10"></div>
                 <WorldMap mapData={currentMap} player={state.player} npcs={state.npcs} />
              </div>
              
              {/* Time/Weather Overlay (Detailed View) */}
              <div className="absolute top-4 left-4 bg-slate-900/90 p-3 rounded-lg border border-slate-700 shadow-xl backdrop-blur-sm flex flex-col gap-1 animate-in slide-in-from-top-2 z-10 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 text-amber-500 font-bold text-xs tracking-wider border-b border-slate-800 pb-1 mb-1 uppercase">
                        <span>Y{state.date.year} / M{state.date.month} / D{state.date.day}</span>
                        <Clock size={12} />
                  </div>
                  <div className="flex items-center justify-between gap-4 font-mono">
                      <div className="flex items-center gap-2 text-slate-200 text-lg font-bold">
                          {formatTime(state.date)} <span className="text-xs text-slate-500 font-normal relative top-0.5">{state.timeOfDay}</span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-2 text-sm" title={state.weather}>
                          {WEATHER_ICONS[state.weather]}
                      </div>
                  </div>
              </div>
          </div>

          {/* Right: HUD */}
          <div className="w-full md:w-96 bg-slate-950 border-l border-slate-800 flex flex-col z-20 shadow-2xl">
              {/* Stats Panel */}
              <div className="p-5 border-b border-slate-800 bg-slate-900/50">
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-amber-600">
                              <User size={20} />
                          </div>
                          <div>
                              <h2 className="font-bold text-amber-500 text-lg leading-none">{state.player.name}</h2>
                              <span className="text-xs text-slate-500 font-mono">Lvl {state.player.level} {state.player.race} {state.player.class}</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="space-y-3 bg-slate-950 p-3 rounded border border-slate-800 shadow-inner">
                       <div className="flex items-center gap-2" title="Health Points">
                          <Heart size={14} className="text-red-500 shrink-0" />
                          <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                              <div className="h-full bg-gradient-to-r from-red-700 to-red-500" style={{ width: `${(state.player.hp / derived.maxHp) * 100}%` }}></div> 
                          </div>
                          <span className="text-xs font-mono w-16 text-right font-bold text-slate-300">{Math.ceil(state.player.hp)}</span>
                       </div>
                       <div className="flex items-center gap-2" title="Mana Points">
                          <Zap size={14} className="text-blue-500 shrink-0" />
                          <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                              <div className="h-full bg-gradient-to-r from-blue-700 to-blue-500" style={{ width: `${(state.player.mp / derived.maxMp) * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-mono w-16 text-right font-bold text-slate-300">{Math.ceil(state.player.mp)}</span>
                       </div>
                       <div className="flex items-center gap-2" title="Experience">
                          <Star size={14} className="text-yellow-500 shrink-0" />
                          <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                              <div className="h-full bg-yellow-600" style={{ width: `${(state.player.exp / state.player.maxExp) * 100}%` }}></div>
                          </div>
                          <span className="text-[10px] font-mono w-16 text-right text-slate-500">{Math.floor((state.player.exp/state.player.maxExp)*100)}%</span>
                       </div>
                  </div>

                  {/* Quick Actions Grid */}
                  <div className="mt-4 grid grid-cols-6 gap-2">
                      <Button title="Inventory [I]" variant="secondary" className="py-2 rounded-lg hover:bg-slate-800 border-slate-700" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.INVENTORY })}><Backpack size={16}/></Button>
                      <Button title="Character [C]" variant="secondary" className="py-2 rounded-lg hover:bg-slate-800 border-slate-700" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.CHARACTER })}><Crown size={16}/></Button>
                      <Button title="Quests [Q]" variant="secondary" className="py-2 rounded-lg hover:bg-slate-800 border-slate-700" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.QUESTS })}><Scroll size={16}/></Button>
                      <Button title="Map [M]" variant="secondary" className="py-2 rounded-lg hover:bg-slate-800 border-slate-700" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.MAP_VIEW })}><Map size={16}/></Button>
                      <Button title="Bestiary" variant="secondary" className="py-2 rounded-lg hover:bg-slate-800 border-slate-700" onClick={() => setShowBestiary(true)}><BookOpen size={16}/></Button>
                      <Button title="Settings [ESC]" variant="secondary" className="py-2 rounded-lg hover:bg-slate-800 border-slate-700" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.SETTINGS })}><Settings size={16}/></Button>
                  </div>
              </div>

              {/* Game Log */}
              <div className="flex-1 overflow-hidden bg-slate-950 relative">
                  <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none"></div>
                  <GameLog logs={state.logs} isLoading={false} />
                  <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none"></div>
              </div>
              
              {/* Interaction Prompt Bar */}
              <div className="p-2 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between px-4 font-mono">
                 <span>WASD to Move</span>
                 <span>E to Interact/Search</span>
              </div>
          </div>

          {/* Modals */}
          
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
                  settings={state.settings}
                  onUpdate={(newSettings) => dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings })}
                  onOpenHelp={() => setShowHelp(true)}
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

          {state.mode === GameMode.MAP_VIEW && (
              <FullMap 
                  mapData={state.maps[state.currentMapId]} 
                  player={state.player}
                  onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
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
                              dispatch({ type: 'UPDATE_GAME_STATE', payload: { player: { ...state.player }, npcs: [...state.npcs] } });
                          }

                          if (opt.action === 'OPEN_SHOP') {
                              dispatch({ type: 'OPEN_SHOP', payload: npc.id });
                          } else if (opt.action === 'GENERATE_QUEST') {
                              dispatch({ type: 'GENERATE_QUEST' });
                              // Close interaction after generating quest usually, or go to next text
                              if (opt.nextId) dispatch({ type: 'START_INTERACTION', payload: { npcId: npc.id, dialogueId: opt.nextId } });
                              else dispatch({ type: 'END_INTERACTION' });
                          } else if (opt.action === 'REST') {
                               dispatch({ type: 'REST' });
                               dispatch({ type: 'END_INTERACTION' });
                          } else if (opt.nextId) {
                              dispatch({ type: 'START_INTERACTION', payload: { npcId: npc.id, dialogueId: opt.nextId } });
                          } else {
                              dispatch({ type: 'END_INTERACTION' });
                          }
                      }
                  }))}
                  onClose={() => dispatch({ type: 'END_INTERACTION' })}
              />
          )}
          
          {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
          {showBestiary && <BestiaryModal onClose={() => setShowBestiary(false)} />}
      </div>
  );
};

export default App;