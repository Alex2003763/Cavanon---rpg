
import React, { memo, useMemo } from 'react';
import { Tile, TileType, Player, InteractableType, NPC } from '../types';
import { TILE_COLORS, TILE_ICONS } from '../constants';
import { User, Users, DoorOpen, BedDouble, Package, Store, Hammer, Shield, FlaskConical, Utensils, Ghost, MapPin } from 'lucide-react';

interface WorldMapProps {
  mapData: { tiles: Tile[][], width: number, height: number };
  player: Player;
  npcs: NPC[]; // Pass full NPC list to lookup details
  viewRadius?: number;
}

// Helper to get NPC Icon component directly
const NpcIcon = ({ role, id }: { role: string, id: string }) => {
    const r = role.toLowerCase();
    if (r.includes('merchant') || id === 'npc_merchant') return <Store size={16} className="text-yellow-400" />;
    if (r.includes('smith') || r.includes('weapon')) return <Hammer size={16} className="text-red-400" />;
    if (r.includes('armor')) return <Shield size={16} className="text-blue-400" />;
    if (r.includes('alchemist') || r.includes('potion')) return <FlaskConical size={16} className="text-purple-400" />;
    if (r.includes('baker') || r.includes('food')) return <Utensils size={16} className="text-orange-400" />;
    if (r.includes('guard')) return <Shield size={16} className="text-slate-300" />;
    if (r.includes('innkeeper')) return <BedDouble size={16} className="text-pink-300" />;
    return <User size={16} className="text-amber-300" />;
};

// Renders a single visual tile
// Optimized: Replaced `npcs` array prop with specific `npcData` object to improve reference stability in memo
const MapTile = memo(({ 
  tile,
  isPlayer, 
  isExplored, 
  opacity,
  isVoid,
  npcData
}: { 
  tile: Tile,
  isPlayer: boolean, 
  isExplored: boolean, 
  opacity: number,
  isVoid: boolean,
  npcData?: { id: string; role: string }
}) => {
  const type = tile.type;
  const hasPortal = tile.type === TileType.PORTAL;
  const interactable = tile.interactable;
  
  const isLandmark = [TileType.TOWN, TileType.DUNGEON, TileType.RUINS, TileType.PORTAL].includes(type);

  const bgColor = isVoid ? 'bg-black' : (isExplored ? TILE_COLORS[type] : 'bg-slate-950');
  const borderColor = !isExplored && !isVoid ? 'border-slate-900/20' : (isLandmark ? 'border-white/30' : 'border-slate-950/10');

  return (
    <div
      className={`
        aspect-square flex items-center justify-center relative
        ${bgColor} border ${borderColor}
        ${isPlayer ? 'ring-2 ring-yellow-400 z-30 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}
        ${isLandmark && isExplored ? 'ring-1 ring-white/20 z-10' : ''}
        gpu-accelerate
      `}
      style={{ opacity: isVoid ? 1 : (isExplored ? opacity : 0.1) }}
    >
      {isExplored && !isVoid && (
        <span className={`font-mono font-bold drop-shadow-sm select-none flex items-center justify-center text-[10px] sm:text-sm lg:text-base ${isLandmark ? 'text-white scale-110' : 'text-white/80'}`}>
          {isPlayer ? (
            <User size={18} className="text-yellow-300 fill-yellow-300/20" />
          ) : hasPortal ? (
            <DoorOpen size={18} className="text-cyan-300 animate-pulse" />
          ) : npcData ? (
             <div className="relative z-20">
                <NpcIcon role={npcData.role} id={npcData.id} />
                <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-2 h-2 animate-ping"></span>
             </div>
          ) : interactable?.type === InteractableType.BED ? (
            <BedDouble size={18} className="text-blue-300" />
          ) : interactable?.type === InteractableType.STORAGE ? (
            <Package size={18} className="text-amber-600" />
          ) : (
            TILE_ICONS[type]
          )}
        </span>
      )}
      {isExplored && isLandmark && !isPlayer && !npcData && !hasPortal && (
          <div className="absolute inset-0 bg-white/5 pointer-events-none animate-pulse"></div>
      )}
    </div>
  );
}, (prev, next) => {
  // Strict comparison optimization
  return (
    prev.tile === next.tile && // Tile objects are referentially stable from reducer unless changed
    prev.npcData?.id === next.npcData?.id && // Check NPC ID equality
    prev.isPlayer === next.isPlayer &&
    prev.isExplored === next.isExplored &&
    prev.opacity === next.opacity &&
    prev.isVoid === next.isVoid
  );
});

const WorldMap: React.FC<WorldMapProps> = ({ mapData, player, npcs, viewRadius = 6 }) => {
  const { tiles, width, height } = mapData;

  // Optimization: Create a quick lookup map for NPCs to avoid finding them in the array for every tile
  const npcLookup = useMemo(() => {
    const map = new Map<string, { id: string, role: string }>();
    npcs.forEach(npc => {
        // We key by specific tile location if possible, but since NPCs move, we usually lookup by ID stored in tile
        map.set(npc.id, { id: npc.id, role: npc.role });
    });
    return map;
  }, [npcs]);

  // Generate the viewport grid based on player position
  const viewportGrid = useMemo(() => {
    const grid = [];
    const diameter = viewRadius * 2 + 1;
    
    const startX = player.position.x - viewRadius;
    const startY = player.position.y - viewRadius;

    for (let y = 0; y < diameter; y++) {
      const row = [];
      for (let x = 0; x < diameter; x++) {
        const mapX = startX + x;
        const mapY = startY + y;

        // Check bounds
        if (mapX >= 0 && mapX < width && mapY >= 0 && mapY < height) {
            const tile = tiles[mapY][mapX];
            let npcData = undefined;
            // Resolve NPC data immediately during grid construction
            if (tile.npcs.length > 0) {
                const npcId = tile.npcs[0];
                npcData = npcLookup.get(npcId);
                // Fallback if lookup failed but ID exists (shouldn't happen if props are synced)
                if (!npcData) npcData = { id: npcId, role: 'Unknown' }; 
            }
            
            row.push({ 
                tile, 
                isVoid: false, 
                npcData
            });
        } else {
            // Create dummy tile for void
            row.push({ 
                tile: { x: mapX, y: mapY, type: TileType.VOID, explored: true, npcs: [] } as Tile, 
                isVoid: true,
                npcData: undefined
            });
        }
      }
      grid.push(row);
    }
    return grid;
  }, [player.position.x, player.position.y, tiles, width, height, viewRadius, npcLookup]);

  return (
    <div className="relative bg-slate-950 rounded-lg border-2 border-slate-700 shadow-2xl overflow-hidden h-[70vh] w-[70vh] md:h-[85vh] md:w-[85vh] mx-auto flex items-center justify-center p-1 gpu-accelerate strict-contain transition-all duration-300">
      <div 
        className="grid gap-[1px] bg-slate-900 w-full h-full"
        style={{ 
            gridTemplateColumns: `repeat(${viewRadius * 2 + 1}, minmax(0, 1fr))` 
        }}
      >
        {viewportGrid.map((row, vy) => (
          row.map((cell, vx) => {
            const isPlayerHere = vy === viewRadius && vx === viewRadius;
            
            // Distance from center (player) for opacity/fog
            const dist = Math.abs(vx - viewRadius) + Math.abs(vy - viewRadius);
            const opacity = isPlayerHere ? 1 : Math.max(0.2, 1 - dist * 0.1);

            return (
              <MapTile
                key={`${cell.tile.x}-${cell.tile.y}`}
                tile={cell.tile}
                isPlayer={isPlayerHere}
                isExplored={cell.tile.explored}
                opacity={opacity}
                isVoid={cell.isVoid}
                npcData={cell.npcData}
              />
            );
          })
        ))}
      </div>
      
      <div className="absolute bottom-2 right-2 text-[10px] text-slate-600 font-mono bg-black/50 px-2 rounded pointer-events-none backdrop-blur-md">
        {player.position.x}, {player.position.y}
      </div>
    </div>
  );
};

export default memo(WorldMap);
