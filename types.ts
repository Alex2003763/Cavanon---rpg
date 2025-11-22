
export enum TileType {
  GRASS = 'GRASS',
  FOREST = 'FOREST',
  MOUNTAIN = 'MOUNTAIN',
  WATER = 'WATER',
  TOWN = 'TOWN',
  DUNGEON = 'DUNGEON',
  RUINS = 'RUINS',
  VOID = 'VOID',
  PORTAL = 'PORTAL',
  WALL = 'WALL',
  FLOOR = 'FLOOR'
}

export enum Weather {
  CLEAR = 'CLEAR',
  RAIN = 'RAIN',
  STORM = 'STORM',
  FOG = 'FOG'
}

export enum TimeOfDay {
  DAWN = 'DAWN',
  DAY = 'DAY',
  DUSK = 'DUSK',
  NIGHT = 'NIGHT'
}

export interface GameDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export enum GameMode {
  MENU = 'MENU',
  CREATION = 'CREATION',
  EXPLORATION = 'EXPLORATION',
  COMBAT = 'COMBAT',
  INTERACTION = 'INTERACTION',
  SETTINGS = 'SETTINGS',
  INVENTORY = 'INVENTORY',
  LEVEL_UP = 'LEVEL_UP',
  CHARACTER = 'CHARACTER',
  STORAGE = 'STORAGE',
  QUESTS = 'QUESTS',
  SHOP = 'SHOP',
  SAVE = 'SAVE',
  LOAD = 'LOAD'
}

export enum EquipmentSlot {
  MAIN_HAND = 'MAIN_HAND',
  OFF_HAND = 'OFF_HAND',
  HEAD = 'HEAD',
  BODY = 'BODY',
  LEGS = 'LEGS',
  FEET = 'FEET',
  ACCESSORY = 'ACCESSORY'
}

export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export enum ItemMaterial {
  IRON = 'IRON',
  STEEL = 'STEEL',
  MITHRIL = 'MITHRIL',
  ADAMANTITE = 'ADAMANTITE',
  WOOD = 'WOOD',
  OBSIDIAN = 'OBSIDIAN',
  DRAGON_BONE = 'DRAGON_BONE',
  CLOTH = 'CLOTH',
  SILK = 'SILK',
  LEATHER = 'LEATHER'
}

export interface Stats {
  strength: number;
  dexterity: number;
  intelligence: number;
  constitution: number;
  speed: number;     // Derived/Base
  luck: number;      // Base
}

export interface DerivedStats {
  maxHp: number;
  maxMp: number;
  physicalDef: number;
  magicalDef: number;
  evasion: number;
  critChance: number;
  hpRegen: number;
  mpRegen: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'WEAPON' | 'ARMOR' | 'CONSUMABLE' | 'MISC';
  slot?: EquipmentSlot;
  value: number;
  description: string;
  stats?: Partial<Stats>; // Bonus stats
  defense?: number;
  damage?: number;
  rarity?: ItemRarity;
  material?: ItemMaterial;
  quantity?: number; // Stacking support
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  cooldown: number;
  type: 'ACTIVE' | 'PASSIVE';
  effect?: (user: Player, target: Enemy, stats: Stats, derived: DerivedStats) => { damage?: number, heal?: number, log: string };
}

export interface RaceData {
    id: string;
    name: string;
    description: string;
    passiveName: string;
    passiveDescription: string;
    baseStats: Stats;
}

export interface ClassData {
    id: string;
    name: string;
    description: string;
    skillId: string;
    baseStats: Stats;
    startingItems: string[];
}

export enum QuestType {
    KILL = 'KILL',
    COLLECT = 'COLLECT'
}

export enum QuestStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED'
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    type: QuestType;
    targetId: string;
    targetName: string;
    amountRequired: number;
    amountCurrent: number;
    expReward: number;
    goldReward: number;
    itemReward?: string;
    status: QuestStatus;
}

export type StatusEffectType = 'POISON' | 'STUN' | 'REGEN' | 'BUFF_STR' | 'BUFF_DEF' | 'BLEED' | 'BURN' | 'FREEZE';

export interface StatusEffect {
  id: string;
  type: StatusEffectType;
  duration: number; // Turns
  value?: number; // Intensity
  name: string;
}

export interface Player {
  name: string;
  race: string;
  class: string;
  level: number;
  exp: number;
  maxExp: number;
  attributePoints: number;
  hp: number;
  mp: number;
  baseStats: Stats;
  gold: number;
  inventory: Item[];
  equipment: Record<EquipmentSlot, Item | null>;
  position: { x: number; y: number };
  reputation: number;
  skills: string[];
  quests: Quest[];
  completedQuestIds: string[];
  statusEffects: StatusEffect[];
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  race: string;
  affinity: number;
  description: string;
  inventory: Item[];
  dialogueRoot: string;
  memory: string[];
  mapId: string;
  schedule: Record<TimeOfDay, { tileType: TileType, description: string }>;
  isMerchant?: boolean;
  isQuestGiver?: boolean;
  hasGeneratedInventory?: boolean; // Track if we've procedurally filled this shop
  lastRestockDay?: number; // Total days when last stocked
}

export interface DialogueOption {
  text: string;
  nextId?: string;
  requirement?: (p: Player, n: NPC) => boolean;
  effect?: (p: Player, n: NPC) => void;
  action?: 'OPEN_SHOP' | 'GENERATE_QUEST' | 'REST';
}

export interface DialogueNode {
  id: string;
  text: string | ((p: Player, n: NPC) => string);
  options: DialogueOption[];
}

export enum InteractableType {
    BED = 'BED',
    STORAGE = 'STORAGE'
}

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  explored: boolean;
  npcs: string[];
  portalTarget?: { mapId: string; x: number; y: number; desc: string };
  interactable?: { type: InteractableType };
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: Tile[][];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: 'NARRATIVE' | 'COMBAT' | 'SYSTEM' | 'INFO' | 'DIALOGUE' | 'QUEST';
}

export interface GameSettings {
  textSpeed: 'SLOW' | 'NORMAL' | 'FAST' | 'INSTANT';
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  showGrid: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  rarity: number;
  hp: number;
  maxHp: number;
  stats: Stats;
  expReward: number;
  goldReward: number;
  lootTable: { itemId: string; chance: number }[];
  type: TileType;
  race?: string;
  statusEffects: StatusEffect[];
}

export enum BattleSpeed {
  NORMAL = 1000,
  FAST = 500,
  VERY_FAST = 100
}

export interface CombatState {
  enemy: Enemy;
  logs: string[];
  turn: number;
  speed: BattleSpeed;
  isVictory: boolean | null;
  loot?: Item[];
  playerCooldowns: Record<string, number>;
  isStarted: boolean;
}

export interface GameState {
  mode: GameMode;
  previousMode?: GameMode;
  player: Player;
  npcs: NPC[];
  currentMapId: string;
  maps: Record<string, GameMap>;
  storage: Item[];
  date: GameDate;
  weather: Weather;
  timeOfDay: TimeOfDay;
  activeInteraction: { npcId: string; dialogueId: string; type: 'TALK' | 'TRADE' } | null;
  combat: CombatState | null;
  logs: LogEntry[];
  settings: GameSettings;
  activeShopNpcId?: string;
}

export type Action =
  | { type: 'START_GAME'; payload: Partial<Player> }
  | { type: 'SAVE_GAME'; payload: number }
  | { type: 'LOAD_GAME'; payload: number }
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'PLAYER_STEP'; payload: { x: number; y: number } }
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
  | { type: 'SELL_ITEM'; payload: Item }
  | { type: 'SEARCH_AREA' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> };
