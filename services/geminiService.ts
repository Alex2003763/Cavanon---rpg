
import { TileType, Weather, TimeOfDay, NPC } from "../types";

// Procedural Description Generator
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

export const generateEncounter = (tileType: TileType): { description: string, enemyName: string } => {
    const enemies = {
        [TileType.FOREST]: ['Wolf', 'Bandit', 'Giant Spider'],
        [TileType.MOUNTAIN]: ['Troll', 'Eagle', 'Rock Golem'],
        [TileType.DUNGEON]: ['Skeleton', 'Slime', 'Dark Mage'],
        [TileType.GRASS]: ['Wild Dog', 'Goblin Scout'],
        [TileType.RUINS]: ['Ghost', 'Animated Armor'],
        [TileType.WATER]: ['Siren', 'Giant Crab'],
        [TileType.TOWN]: ['Thief', 'Drunkard'],
        [TileType.VOID]: ['Nothingness'],
        [TileType.PORTAL]: ['Dimensional Shifter', 'Void Wisp'],
        [TileType.WALL]: ['Wall Mimic', 'Lurker'],
        [TileType.FLOOR]: ['Floor Trap', 'Burrower']
    };

    const list = (enemies as any)[tileType] || ['Rat'];
    const enemy = list[Math.floor(Math.random() * list.length)];
    
    return {
        description: `A hostile ${enemy} draws near!`,
        enemyName: enemy
    };
};
