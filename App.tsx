
import React, { useReducer, useEffect, useCallback, useState, useRef, useMemo } from 'react';
import WorldMap from './components/WorldMap';
import { Panel, Button, StatBar, DialoguePanel, CharacterCreation, SettingsModal, HelpModal, InventoryModal, CharacterSheet, StorageModal, BestiaryModal, QuestPanel, ShopInterface } from './components/UIComponents';
import GameLog from './components/GameLog';
import CombatView from './components/CombatView';
import { 
  GameState, GameMode, TileType, Weather, TimeOfDay, Player, LogEntry, NPC, EquipmentSlot, Item, Stats, BattleSpeed, Enemy, CombatState, InteractableType, QuestStatus, QuestType 
} from './types';
import { 
  BASE_STATS, WEATHER_ICONS, NPC_TEMPLATES, DIALOGUE_TREE, ITEMS, generateVillage, generateWorldMap, generatePlayerHome, generateCity
} from './constants';
import { 
  calculateStats, formatTime, formatDate, generateLocationDescription, generateEnemy, resolveAutoTurn, calculateFleeChance, generateRandomQuest, generateProceduralItem 
} from './utils';
import { Settings, HelpCircle, Clock, Calendar, Map as MapIcon, Backpack, User, BookOpen, Save, Upload, Loader, Sparkles, Scroll } from 'lucide-react';

// --- Actions ---

type Action =
  | { type: 'START_GAME'; payload: Partial<Player> }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'QUICK_SAVE' }
  | { type: 'QUICK_LOAD' }
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'MOVE_PLAYER'; payload: { x: number; y: number } }
  | { type: 'SWITCH_MAP'; payload: { mapId: string; x: number; y: number } }
  | { type: 'ADD_LOG'; payload: Omit<LogEntry, 'id' | 'timestamp'> }
  | { type: 'START_INTERACTION'; payload: { npcId: string; dialogueId: string } }
  | { type: 'UPDATE_GAME_STATE'; payload: { player?: Player; npcs?: NPC[] } }
  | { type: 'END_INTERACTION' }
  | { type: 'UPDATE_PLAYER'; payload: Partial<Player> }
  | { type: 'ADVANCE_TIME'; payload: number } // Minutes
  | { type: 'EQUIP_ITEM'; payload: Item }
  | { type: 'UNEQUIP_ITEM'; payload: EquipmentSlot }
  | { type: 'USE_ITEM'; payload: Item }
  | { type: 'LEVEL_UP' }
  | { type: 'ALLOCATE_STAT'; payload: keyof Stats }
  | { type: 'INIT_COMBAT'; payload: { enemy: Enemy } }
  | { type: 'START_COMBAT' } // Starts the actual ticking
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
    completedQuestIds: []
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
    case 'LOAD_GAME':
        return { ...action.payload, mode: GameMode.EXPLORATION };
    case 'QUICK_SAVE': {
        try {
            localStorage.setItem('cavanon_save', JSON.stringify(state));
            return {
                 ...state,
                 logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: "Game Saved Successfully.", type: 'SYSTEM' }]
            };
        } catch (e) {
            return state;
        }
    }
    case 'QUICK_LOAD': {
         try {
            const saved = localStorage.getItem('cavanon_save');
            if (saved) {
                const loadedState = JSON.parse(saved);
                return { ...loadedState, mode: GameMode.EXPLORATION, logs: [...loadedState.logs, { id: Date.now().toString(), timestamp: formatTime(loadedState.date), text: "Game Loaded.", type: 'SYSTEM' }] };
            }
        } catch (e) {}
        return state;
    }
    case 'SET_MODE':
      return { 
        ...state, 
        mode: action.payload, 
        previousMode: (state.mode === GameMode.EXPLORATION) ? state.mode : state.previousMode 
      };
    case 'MOVE_PLAYER': {
      const currentMap = state.maps[state.currentMapId];
      const { x, y } = action.payload;
      
      // Optimized Update: Only clone if tile is NOT explored to save performance
      if (!currentMap.tiles[y][x].explored) {
          const newRows = [...currentMap.tiles]; 
          newRows[y] = [...newRows[y]]; 
          newRows[y][x] = { ...newRows[y][x], explored: true }; 

          return {
            ...state,
            player: { ...state.player, position: action.payload },
            maps: {
              ...state.maps,
              [state.currentMapId]: { ...currentMap, tiles: newRows }
            }
          };
      }

      return {
        ...state,
        player: { ...state.player, position: action.payload }
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
    case 'UPDATE_PLAYER':
      return { ...state, player: { ...state.player, ...action.payload } };
    case 'ADVANCE_TIME': {
      const addedMinutes = action.payload;
      let { year, month, day, hour, minute } = state.date;
      
      minute += addedMinutes;
      while (minute >= 60) {
          minute -= 60;
          hour++;
      }
      while (hour >= 24) {
          hour -= 24;
          day++;
      }
      while (day > 30) {
          day -= 30;
          month++;
      }
      while (month > 12) {
          month -= 12;
          year++;
      }

      let timeOfDay = TimeOfDay.NIGHT;
      if (hour >= 5 && hour < 9) timeOfDay = TimeOfDay.DAWN;
      else if (hour >= 9 && hour < 18) timeOfDay = TimeOfDay.DAY;
      else if (hour >= 18 && hour < 21) timeOfDay = TimeOfDay.DUSK;

      // Passive Regen Logic (Based on Stats)
      const { derived } = calculateStats(state.player);
      const hpRecovered = Math.max(0, (derived.hpRegen * (addedMinutes / 60)));
      const mpRecovered = Math.max(0, (derived.mpRegen * (addedMinutes / 60)));

      const newHp = Math.min(derived.maxHp, state.player.hp + hpRecovered);
      const newMp = Math.min(derived.maxMp, state.player.mp + mpRecovered);

      return { 
          ...state, 
          date: { year, month, day, hour, minute }, 
          timeOfDay,
          player: { ...state.player, hp: newHp, mp: newMp }
      };
    }
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
        
        // Logic for consumable effects (Hardcoded for demo)
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
                hp: derived.maxHp, // Full heal on level up
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
        // Check if inventory needs generation
        const npcIndex = state.npcs.findIndex(n => n.id === npcId);
        let updatedNpcs = state.npcs;

        if (npcIndex >= 0 && state.npcs[npcIndex].isMerchant && !state.npcs[npcIndex].hasGeneratedInventory) {
             // Generate Loot
             const npc = state.npcs[npcIndex];
             const newInventory = [...npc.inventory]; // Keep static items
             const itemCount = 5;
             const role = npc.role.toLowerCase();

             for (let i=0; i<itemCount; i++) {
                 // Check specific roles first to avoid "Armor Smith" matching "Smith"
                 if (role.includes('armor')) {
                     newInventory.push(generateProceduralItem(state.player.level, 'ARMOR'));
                 } else if (role.includes('weapon') || role.includes('smith')) {
                     newInventory.push(generateProceduralItem(state.player.level, 'WEAPON'));
                 }
             }
             
             updatedNpcs = [...state.npcs];
             updatedNpcs[npcIndex] = { ...npc, inventory: newInventory, hasGeneratedInventory: true };
        }

        return {
            ...state,
            npcs: updatedNpcs,
            mode: GameMode.SHOP,
            activeShopNpcId: npcId
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
        const { victory } = action.payload;
        
        if (victory) {
            let xp = state.combat?.enemy.expReward || 0;
            if (state.player.race === 'Human') {
                xp = Math.floor(xp * 1.1);
            }
            const gold = state.combat?.enemy.goldReward || 0;
            const loot = state.combat?.loot || [];

            const newExp = state.player.exp + xp;
            const newGold = state.player.gold + gold;
            const newInventory = [...state.player.inventory, ...loot];

            const updatedQuests = state.player.quests.map(q => {
                if (q.status === QuestStatus.ACTIVE && q.type === QuestType.KILL && state.combat?.enemy.name === q.targetName) {
                    const newAmount = q.amountCurrent + 1;
                    if (newAmount >= q.amountRequired) {
                         return { ...q, amountCurrent: newAmount, status: QuestStatus.COMPLETED };
                    }
                    return { ...q, amountCurrent: newAmount };
                }
                return q;
            });

            return {
                ...state,
                mode: GameMode.EXPLORATION,
                combat: null,
                player: { ...state.player, exp: newExp, gold: newGold, inventory: newInventory, quests: updatedQuests },
                logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: `Victory against ${state.combat?.enemy.name}! Gained ${xp} XP, ${gold}g.`, type: 'COMBAT' }]
            };
        } else {
            return {
                ...state,
                mode: GameMode.EXPLORATION,
                combat: null,
                currentMapId: 'starter_village',
                player: { ...state.player, hp: 1, position: { x: 7, y: 7 } }, 
                logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: `You were defeated... dragged back to safety by a passing merchant.`, type: 'COMBAT' }]
            };
        }
    }
    case 'CLOSE_COMBAT': 
        return {
             ...state,
             mode: GameMode.EXPLORATION,
             combat: null,
             logs: [...state.logs, { id: Date.now().toString(), timestamp: formatTime(state.date), text: `Escaped from combat!`, type: 'COMBAT' }]
        };
    default:
      return state;
  }
};

// --- Loading Component ---

const LoadingScreen: React.FC<{ progress: number; tip: string }> = ({ progress, tip }) => (
  <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center font-mono text-slate-200">
      <div className="w-full max-w-md p-8 flex flex-col items-center space-y-8 relative">
          <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="text-center space-y-2 relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold pixel-font text-amber-500 animate-bounce-slow tracking-widest drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                  CAVANON
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-[0.3em]">Infinite Grid RPG</p>
          </div>

          <div className="w-full space-y-2 relative z-10">
              <div className="h-2 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
                  <div 
                      className="h-full bg-amber-500 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      style={{ width: `${progress}%` }}
                  />
              </div>
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  <span>{Math.round(progress)}%</span>
                  <span className="flex items-center gap-2 animate-pulse">
                      {progress < 100 ? <Loader size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      {progress < 100 ? 'Loading Assets...' : 'Ready'}
                  </span>
              </div>
          </div>

          <div className="h-8 text-center relative z-10">
               <p className="text-xs text-slate-400 italic animate-in fade-in slide-in-from-bottom-1 duration-500" key={tip}>
                  "{tip}"
               </p>
          </div>
      </div>
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  // Loading State
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingTip, setLoadingTip] = useState("Initializing world engine...");
  
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [showHelp, setShowHelp] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  // Temporary state for Bed interaction dialog
  const [restDialog, setRestDialog] = useState(false);
  
  const combatTimerRef = useRef<number | null>(null);

  // Derived data for UI
  const { derived: derivedStats, totalStats } = calculateStats(state.player);

  const currentMapNpcs = useMemo(() => {
      return state.npcs.filter(n => 
          n.mapId === state.currentMapId && n.schedule[state.timeOfDay].tileType
      );
  }, [state.npcs, state.currentMapId, state.timeOfDay]);

  // --- Loading Logic ---
  useEffect(() => {
      const tips = [
          "Generating terrain chunks...",
          "Sharpening polygon swords...",
          "Teaching NPCs how to talk...",
          "Brewing health potions...",
          "Calculating loot tables...",
          "Summoning monsters...",
          "Polishing pixels..."
      ];

      const waitForFonts = async () => {
          await document.fonts.ready;
      };

      waitForFonts().then(() => {
          const interval = setInterval(() => {
              setLoadProgress(prev => {
                  if (prev >= 100) {
                      clearInterval(interval);
                      setTimeout(() => setIsLoading(false), 800); 
                      return 100;
                  }
                  const jump = Math.random() * 5 + 1;
                  if (Math.random() < 0.1) {
                      setLoadingTip(tips[Math.floor(Math.random() * tips.length)]);
                  }
                  return Math.min(prev + jump, 100);
              });
          }, 50); 
          
          return () => clearInterval(interval);
      });
  }, []);

  // Level Up Check Effect
  useEffect(() => {
      if (state.player.exp >= state.player.maxExp) {
          dispatch({ type: 'LEVEL_UP' });
      }
  }, [state.player.exp, state.player.maxExp]);

  // --- Combat Loop ---
  useEffect(() => {
      if (state.mode === GameMode.COMBAT && state.combat?.isVictory === null && state.combat.isStarted) {
          const tickRate = state.combat.speed;
          combatTimerRef.current = window.setInterval(() => {
              dispatch({ type: 'COMBAT_TICK' });
          }, tickRate);
      }
      return () => {
          if (combatTimerRef.current) window.clearInterval(combatTimerRef.current);
      };
  }, [state.mode, state.combat?.isVictory, state.combat?.speed, state.combat?.isStarted]);


  // --- Save / Load Logic ---
  const saveGame = () => {
      try {
          localStorage.setItem('cavanon_save', JSON.stringify(state));
          dispatch({ type: 'ADD_LOG', payload: { text: "Game Saved.", type: 'SYSTEM' } });
          dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION });
      } catch (e) {
          console.error("Save failed", e);
      }
  };

  const loadGame = () => {
      try {
          const saved = localStorage.getItem('cavanon_save');
          if (saved) {
              const loadedState = JSON.parse(saved);
              dispatch({ type: 'LOAD_GAME', payload: loadedState });
          }
      } catch (e) {
          console.error("Load failed", e);
      }
  };

  // --- Handlers ---

  const handleMove = useCallback((dx: number, dy: number) => {
    if (state.mode !== GameMode.EXPLORATION) return;

    const currentMap = state.maps[state.currentMapId];
    const newX = state.player.position.x + dx;
    const newY = state.player.position.y + dy;

    if (newX < 0 || newX >= currentMap.width || newY < 0 || newY >= currentMap.height) {
        return;
    }

    const tile = currentMap.tiles[newY][newX];
    
    if (tile.type === TileType.VOID || tile.type === TileType.WALL) {
      dispatch({ type: 'ADD_LOG', payload: { text: "The path is blocked.", type: 'INFO' } });
      return;
    }

    dispatch({ type: 'MOVE_PLAYER', payload: { x: newX, y: newY } });

    // Improved Time Cost Logic
    let timeCost = 1;
    if (state.currentMapId === 'world_map') {
        if (tile.type === TileType.MOUNTAIN || tile.type === TileType.WATER) {
            timeCost = 10;
        } else {
            timeCost = 5;
        }
    }
    dispatch({ type: 'ADVANCE_TIME', payload: timeCost });

    const safeTiles = [TileType.TOWN, TileType.PORTAL, TileType.WALL, TileType.FLOOR];
    if ((state.currentMapId === 'world_map' || state.currentMapId === 'capital_city') && !safeTiles.includes(tile.type)) {
        // REDUCED ENCOUNTER RATE: 10% -> 4%
        if (Math.random() < 0.04) {
             const enemy = generateEnemy(tile.type, state.player.level);
             dispatch({ type: 'INIT_COMBAT', payload: { enemy } });
             return;
        }
    }

    const npcsHere = state.npcs.filter(n => n.mapId === state.currentMapId && n.schedule[state.timeOfDay].tileType === tile.type && Math.random() > 0.5); 
    const desc = generateLocationDescription(tile.type, state.weather, state.timeOfDay, npcsHere);
    dispatch({ type: 'ADD_LOG', payload: { text: desc, type: 'NARRATIVE' } });

  }, [state.mode, state.player.position, state.currentMapId, state.maps, state.timeOfDay, state.weather, state.npcs, state.player.level]);

  const handleInteract = useCallback(() => {
    if (state.mode !== GameMode.EXPLORATION) return;

    const currentMap = state.maps[state.currentMapId];
    const { x, y } = state.player.position;
    const tile = currentMap.tiles[y][x];

    if (tile.type === TileType.PORTAL && tile.portalTarget) {
        dispatch({ type: 'SWITCH_MAP', payload: tile.portalTarget });
        return;
    }

    if (tile.interactable) {
        if (tile.interactable.type === InteractableType.BED) {
            setRestDialog(true);
            return;
        }
        if (tile.interactable.type === InteractableType.STORAGE) {
            dispatch({ type: 'SET_MODE', payload: GameMode.STORAGE });
            return;
        }
    }

    // Fix: Interaction should be strictly based on presence in the tile data for consistency
    // The old method checked schedule type match, which broke in cities where all floor tiles are the same type
    let npcFound: NPC | undefined = undefined;
    
    if (tile.npcs.length > 0) {
        npcFound = state.npcs.find(n => n.id === tile.npcs[0]);
    }

    // Fallback for wandering NPCs only in villages/wilderness, not cities
    if (!npcFound && state.currentMapId !== 'capital_city') {
         npcFound = state.npcs.find(n => 
            n.mapId === state.currentMapId && n.schedule[state.timeOfDay].tileType === tile.type
        );
    }
    
    if (npcFound) {
        dispatch({ type: 'START_INTERACTION', payload: { npcId: npcFound.id, dialogueId: npcFound.dialogueRoot } });
        return;
    }

    if (state.currentMapId === 'world_map' && ![TileType.TOWN, TileType.PORTAL].includes(tile.type)) {
         dispatch({ type: 'ADD_LOG', payload: { text: "You search the immediate area...", type: 'INFO' } });
         dispatch({ type: 'ADVANCE_TIME', payload: 15 });
         
         if (Math.random() < 0.3) {
            const enemy = generateEnemy(tile.type, state.player.level);
            dispatch({ type: 'INIT_COMBAT', payload: { enemy } });
         } else {
            dispatch({ type: 'ADD_LOG', payload: { text: "...but find nothing of interest.", type: 'NARRATIVE' } });
         }
         return;
    }

    dispatch({ type: 'ADD_LOG', payload: { text: "There is nothing to interact with here.", type: 'INFO' } });

  }, [state.mode, state.player.position, state.currentMapId, state.maps, state.timeOfDay, state.npcs, state.player.level]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (state.mode === GameMode.CREATION) return;

      switch(e.key.toLowerCase()) {
        case 'w': handleMove(0, -1); break;
        case 's': handleMove(0, 1); break;
        case 'a': handleMove(-1, 0); break;
        case 'd': handleMove(1, 0); break;
        case 'e': handleInteract(); break;
        case 'i': 
            if (state.mode === GameMode.EXPLORATION) dispatch({ type: 'SET_MODE', payload: GameMode.INVENTORY });
            else if (state.mode === GameMode.INVENTORY) dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION });
            break;
        case 'c':
            if (state.mode === GameMode.EXPLORATION) dispatch({ type: 'SET_MODE', payload: GameMode.CHARACTER });
            else if (state.mode === GameMode.CHARACTER) dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION });
            break;
        case 'q':
            if (state.mode === GameMode.EXPLORATION) dispatch({ type: 'SET_MODE', payload: GameMode.QUESTS });
            else if (state.mode === GameMode.QUESTS) dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION });
            break;
        case 'escape':
            if (state.mode !== GameMode.EXPLORATION && state.mode !== GameMode.COMBAT) dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION });
            break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleInteract, state.mode, isLoading]);


  // --- Render ---
  
  if (isLoading) {
      return <LoadingScreen progress={loadProgress} tip={loadingTip} />;
  }

  if (state.mode === GameMode.MENU || (state.mode === GameMode.SETTINGS && !state.previousMode)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200 relative overflow-hidden font-sans selection:bg-amber-500/30">
        
        {/* CSS-Only Background Implementation */}
        <div className="absolute inset-0 bg-[#020617] z-0">
            {/* Deep radial gradient for atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black opacity-80"></div>
            
            {/* Animated Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vh] h-[70vh] bg-amber-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[70vh] h-[70vh] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            
            {/* Grid Pattern - CSS based */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ 
                     backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(to right, #cbd5e1 1px, transparent 1px)`,
                     backgroundSize: '40px 40px',
                     maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
                 }}>
            </div>
            
            {/* Subtle Particle/Dust effect via CSS pattern */}
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>
        </div>
        
         <div className="z-10 flex flex-col items-center space-y-12 animate-in fade-in zoom-in duration-1000 relative">
            <div className="text-center space-y-4">
                <h1 className="text-7xl md:text-9xl font-bold pixel-font text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] tracking-tighter scale-y-110">
                    CAVANON
                </h1>
                <p className="text-xl md:text-2xl text-slate-400 font-serif tracking-[0.5em] uppercase text-shadow-sm">
                    Infinite Grid RPG
                </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl px-8">
                <button 
                    onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.CREATION })} 
                    className="flex-1 group relative px-8 py-4 bg-slate-900/50 border border-amber-600/50 hover:border-amber-500 hover:bg-amber-900/20 text-amber-100 font-bold text-xl tracking-widest uppercase transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] overflow-hidden"
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                    New Game
                </button>

                {localStorage.getItem('cavanon_save') && (
                    <button 
                        onClick={loadGame} 
                        className="flex-1 group relative px-8 py-4 bg-slate-900/50 border border-slate-600/50 hover:border-cyan-500 hover:bg-cyan-900/20 text-cyan-100 font-bold text-xl tracking-widest uppercase transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden"
                    >
                         <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                         Continue
                    </button>
                )}
            </div>

            <button 
                onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.SETTINGS })} 
                className="text-slate-500 hover:text-slate-300 text-sm uppercase tracking-widest transition-colors flex items-center gap-2"
            >
                <Settings size={14} /> System Settings
            </button>
         </div>

         <div className="absolute bottom-8 text-[10px] text-slate-600 font-mono">
             v1.2.0 • Aetheria Engine
         </div>

         {state.mode === GameMode.SETTINGS && (
            <SettingsModal 
                onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.MENU })} 
                onSave={saveGame}
                onLoad={loadGame}
                isMainMenu={true}
            />
         )}
       </div>
    );
  }

  if (state.mode === GameMode.CREATION) {
    return <CharacterCreation onComplete={(p) => dispatch({ type: 'START_GAME', payload: p })} onCancel={() => dispatch({ type: 'SET_MODE', payload: GameMode.MENU })} />;
  }

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col text-slate-200 overflow-hidden font-sans selection:bg-amber-500/30">
      
      {/* Header / HUD */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shadow-md z-10 shrink-0">
        <div className="flex items-center gap-4">
            <h1 className="pixel-font text-amber-500 text-lg hidden sm:block">CAVANON</h1>
            <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(state.date)}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {formatTime(state.date)}</span>
                <span className="flex items-center gap-1 ml-2 text-amber-300">{state.timeOfDay}</span>
                <span className="flex items-center gap-1 ml-2">{WEATHER_ICONS[state.weather]}</span>
            </div>
        </div>

        <div className="flex items-center gap-2">
             <div className="flex flex-col items-end mr-4">
                <div className="text-sm font-bold text-white">{state.player.name}</div>
                <div className="text-[10px] text-slate-400">Lvl {state.player.level} {state.player.race} {state.player.class}</div>
             </div>
             {/* Quick Save/Load */}
             <Button variant="ghost" onClick={() => dispatch({ type: 'QUICK_SAVE' })} title="Quick Save"><Save size={18} /></Button>
             <Button variant="ghost" onClick={() => dispatch({ type: 'QUICK_LOAD' })} title="Quick Load"><Upload size={18} /></Button>
             <div className="h-4 w-px bg-slate-700 mx-1"></div>
             <Button variant="ghost" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.QUESTS })} title="Quest Log (Q)"><Scroll size={18} /></Button>
             <Button variant="ghost" onClick={() => setShowBestiary(true)} title="Bestiary"><BookOpen size={18} /></Button>
             <Button variant="ghost" onClick={() => setShowHelp(true)}><HelpCircle size={18} /></Button>
             <Button variant="ghost" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.SETTINGS })}><Settings size={18} /></Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar - Player Stats */}
        <div className="w-72 bg-slate-900/50 border-r border-slate-800 p-4 hidden md:flex flex-col gap-4 overflow-y-auto scrollbar-thin shrink-0">
           <Panel title="Vitals">
             <div className="space-y-4">
                <StatBar label="HP" value={Math.round(state.player.hp)} max={derivedStats.maxHp} color="bg-red-600" />
                <StatBar label="MP" value={Math.round(state.player.mp)} max={derivedStats.maxMp} color="bg-blue-600" />
                <StatBar label="EXP" value={state.player.exp} max={state.player.maxExp} color="bg-yellow-600" />
             </div>
           </Panel>
           
           <Panel title="Attributes" className="flex-1">
             <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                <div className="flex justify-between border-b border-slate-800 py-1"><span>STR</span> <span className="font-bold text-amber-200">{totalStats.strength}</span></div>
                <div className="flex justify-between border-b border-slate-800 py-1"><span>DEX</span> <span className="font-bold text-amber-200">{totalStats.dexterity}</span></div>
                <div className="flex justify-between border-b border-slate-800 py-1"><span>INT</span> <span className="font-bold text-amber-200">{totalStats.intelligence}</span></div>
                <div className="flex justify-between border-b border-slate-800 py-1"><span>CON</span> <span className="font-bold text-amber-200">{totalStats.constitution}</span></div>
                <div className="flex justify-between border-b border-slate-800 py-1"><span>SPD</span> <span className="font-bold text-amber-200">{totalStats.speed}</span></div>
                <div className="flex justify-between border-b border-slate-800 py-1"><span>LCK</span> <span className="font-bold text-amber-200">{totalStats.luck}</span></div>
             </div>
             <div className="mt-4 text-xs font-mono text-slate-400 space-y-1">
                <div className="flex justify-between"><span>Gold</span> <span className="text-yellow-400">{state.player.gold}g</span></div>
                <div className="flex justify-between"><span>Reputation</span> <span className={state.player.reputation >= 0 ? "text-green-400" : "text-red-400"}>{state.player.reputation}</span></div>
             </div>
           </Panel>

           <div className="flex gap-2">
                <Button className="flex-1 py-3 text-[10px]" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.INVENTORY })}>
                    <Backpack size={14} /> Bag
                </Button>
                <Button className="flex-1 py-3 text-[10px]" variant="secondary" onClick={() => dispatch({ type: 'SET_MODE', payload: GameMode.CHARACTER })}>
                    <User size={14} /> Stats
                </Button>
           </div>
        </div>

        {/* Center - Game World */}
        <div className="flex-1 flex flex-col items-center justify-center bg-black/20 relative p-4 min-w-0">
            {/* Map Viewport */}
            <div className="relative z-0 w-full h-full flex items-center justify-center">
                <WorldMap 
                    mapData={state.maps[state.currentMapId]} 
                    player={state.player} 
                    npcs={currentMapNpcs}
                    viewRadius={15} 
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono text-slate-500 flex items-center gap-2 bg-slate-950/80 px-2 py-1 rounded backdrop-blur-sm border border-slate-800">
                    <MapIcon size={12} /> {state.maps[state.currentMapId].name}
                </div>
            </div>

             {/* Context Action Hint */}
             <div className="absolute bottom-16 h-6 z-10 pointer-events-none">
                {state.maps[state.currentMapId].tiles[state.player.position.y][state.player.position.x].type === TileType.PORTAL && (
                    <div className="animate-bounce bg-cyan-900/80 text-cyan-200 px-3 py-1 rounded-full text-xs font-bold border border-cyan-500/50">
                        Press [E] to Enter Portal
                    </div>
                )}
                 {state.maps[state.currentMapId].tiles[state.player.position.y][state.player.position.x].interactable && (
                    <div className="animate-bounce bg-amber-900/80 text-amber-200 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/50">
                        Press [E] to Interact
                    </div>
                )}
                 {!state.maps[state.currentMapId].tiles[state.player.position.y][state.player.position.x].interactable && 
                  state.maps[state.currentMapId].tiles[state.player.position.y][state.player.position.x].type !== TileType.PORTAL &&
                  state.currentMapId === 'world_map' && (
                     <div className="bg-slate-900/80 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-700">
                        Press [E] to Search
                    </div>
                 )}
             </div>
        </div>

        {/* Right Sidebar - Log */}
        <div className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col h-full shrink-0">
             <div className="bg-slate-900 p-2 border-b border-slate-800 font-bold text-xs text-slate-400 uppercase tracking-widest flex justify-between items-center">
                <span>Chronicle</span>
             </div>
             <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0">
                    <GameLog logs={state.logs} isLoading={false} />
                </div>
             </div>
        </div>

      </div>

      {/* Overlays */}

      {state.mode === GameMode.COMBAT && state.combat && (
          <CombatView 
            combatState={state.combat}
            player={state.player}
            onToggleSpeed={() => dispatch({ type: 'TOGGLE_COMBAT_SPEED' })}
            onFleeAttempt={() => dispatch({ type: 'ATTEMPT_FLEE' })}
            onStart={() => dispatch({ type: 'START_COMBAT' })}
            onClose={() => dispatch({ type: 'END_COMBAT', payload: { victory: !!state.combat?.isVictory } })}
          />
      )}

      {state.mode === GameMode.INTERACTION && state.activeInteraction && (
          <DialoguePanel 
            npcName={state.npcs.find(n => n.id === state.activeInteraction?.npcId)?.name || 'Unknown'}
            text={typeof DIALOGUE_TREE[state.activeInteraction.dialogueId].text === 'function' 
                ? (DIALOGUE_TREE[state.activeInteraction.dialogueId].text as any)(state.player, state.npcs.find(n => n.id === state.activeInteraction?.npcId)!) 
                : DIALOGUE_TREE[state.activeInteraction.dialogueId].text as string}
            options={DIALOGUE_TREE[state.activeInteraction.dialogueId].options.filter(opt => !opt.requirement || opt.requirement(state.player, state.npcs.find(n => n.id === state.activeInteraction?.npcId)!)).map(opt => ({
                label: opt.text,
                onClick: () => {
                    if (opt.effect) {
                        const npc = state.npcs.find(n => n.id === state.activeInteraction?.npcId)!;
                        const newNpcs = state.npcs.map(n => n.id === npc.id ? { ...n, memory: [...n.memory] } : n); 
                        const targetNpc = newNpcs.find(n => n.id === npc.id)!;
                        const newPlayer = { ...state.player, inventory: [...state.player.inventory] };
                        opt.effect(newPlayer, targetNpc);
                        dispatch({ type: 'UPDATE_GAME_STATE', payload: { player: newPlayer, npcs: newNpcs } });
                    }
                    
                    if (opt.action === 'GENERATE_QUEST') {
                         dispatch({ type: 'GENERATE_QUEST' });
                         dispatch({ type: 'END_INTERACTION' });
                         return;
                    }
                    if (opt.action === 'OPEN_SHOP') {
                        dispatch({ type: 'OPEN_SHOP', payload: state.activeInteraction!.npcId });
                        return;
                    }
                    if (opt.action === 'REST') {
                        dispatch({ type: 'REST' });
                        dispatch({ type: 'END_INTERACTION' });
                        return;
                    }

                    if (opt.nextId) {
                        dispatch({ type: 'START_INTERACTION', payload: { npcId: state.activeInteraction!.npcId, dialogueId: opt.nextId } });
                    } else {
                        dispatch({ type: 'END_INTERACTION' });
                    }
                }
            }))}
            onClose={() => dispatch({ type: 'END_INTERACTION' })}
          />
      )}

      {restDialog && (
          <DialoguePanel
            npcName="Comfortable Bed"
            text="It looks warm and inviting. Do you want to rest for a while? (Restores HP/MP, Advances Time)"
            options={[
                { label: "Sleep (8 Hours)", onClick: () => { dispatch({ type: 'REST' }); setRestDialog(false); } },
                { label: "Not now", onClick: () => setRestDialog(false) }
            ]}
            onClose={() => setRestDialog(false)
            }
          />
      )}

      {state.mode === GameMode.STORAGE && (
          <StorageModal
            player={state.player}
            storage={state.storage}
            onDeposit={(item) => dispatch({ type: 'STORAGE_DEPOSIT', payload: item })}
            onWithdraw={(item) => dispatch({ type: 'STORAGE_WITHDRAW', payload: item })}
            onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
          />
      )}

      {state.mode === GameMode.INVENTORY && (
          <InventoryModal 
            player={state.player}
            onEquip={(item) => dispatch({ type: 'EQUIP_ITEM', payload: item })}
            onUnequip={(slot) => dispatch({ type: 'UNEQUIP_ITEM', payload: slot })}
            onUse={(item) => dispatch({ type: 'USE_ITEM', payload: item })}
            onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
          />
      )}

      {state.mode === GameMode.CHARACTER && (
          <CharacterSheet 
            player={state.player}
            onAllocate={(stat) => dispatch({ type: 'ALLOCATE_STAT', payload: stat })}
            onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
          />
      )}
      
      {state.mode === GameMode.QUESTS && (
          <QuestPanel 
            quests={state.player.quests}
            onClaim={(id) => dispatch({ type: 'CLAIM_QUEST', payload: id })}
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
            onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })}
          />
      )}

      {state.mode === GameMode.SETTINGS && (
          <SettingsModal 
            onClose={() => dispatch({ type: 'SET_MODE', payload: GameMode.EXPLORATION })} 
            onSave={saveGame}
            onLoad={loadGame}
          />
      )}
    </div>
  );
};

export default App;
