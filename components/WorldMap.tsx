import React, { memo, useMemo, useRef, useEffect } from 'react';
import { Tile, TileType, Player, InteractableType, NPC } from '../types';
import { TILE_COLORS, TILE_ICONS, TILE_HEX_COLORS } from '../constants';
import { User, Users, DoorOpen, BedDouble, Package, Store, Hammer, Shield, FlaskConical, Utensils, Ghost, MapPin, X } from 'lucide-react';

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
// Optimized: Props simplified to ensure strict equality checks pass more often
const MapTile = memo(({ 
  tile,
  isPlayer, 
  isExplored, 
  isVoid,
  npcData
}: { 
  tile: Tile,
  isPlayer: boolean, 
  isExplored: boolean, 
  isVoid: boolean,
  npcData?: { id: string; role: string }
}) => {
  const type = tile.type;
  const hasPortal = tile.type === TileType.PORTAL;
  const interactable = tile.interactable;
  
  const isLandmark = [TileType.TOWN, TileType.DUNGEON, TileType.RUINS, TileType.PORTAL].includes(type);

  // Pre-calculate static classes
  const baseClasses = "aspect-square flex items-center justify-center relative border";
  const bgClass = isVoid ? 'bg-black' : (isExplored ? TILE_COLORS[type] : 'bg-slate-950');
  const borderClass = !isExplored && !isVoid ? 'border-slate-900/20' : (isLandmark ? 'border-white/30' : 'border-slate-950/10');
  const playerClasses = isPlayer ? 'ring-2 ring-yellow-400 z-30' : '';
  const landmarkClasses = isLandmark && isExplored ? 'ring-1 ring-white/20 z-10' : '';
  
  // Render unexplored tiles as darker (0.1 opacity equivalent) via style color if needed, or just handle via class
  // We use style for opacity only for unexplored to avoid passing changing opacity values
  const style = !isExplored && !isVoid ? { opacity: 0.1 } : undefined;

  return (
    <div
      className={`${baseClasses} ${bgClass} ${borderClass} ${playerClasses} ${landmarkClasses}`}
      style={style}
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
  return (
    prev.tile === next.tile && 
    prev.npcData?.id === next.npcData?.id &&
    prev.isPlayer === next.isPlayer &&
    prev.isExplored === next.isExplored &&
    prev.isVoid === next.isVoid
  );
});

const WorldMap: React.FC<WorldMapProps> = ({ mapData, player, npcs, viewRadius = 6 }) => {
  const { tiles, width, height } = mapData;

  // Optimization: Create a quick lookup map for NPCs to avoid finding them in the array for every tile
  const npcLookup = useMemo(() => {
    const map = new Map<string, { id: string, role: string }>();
    npcs.forEach(npc => {
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
            if (tile.npcs.length > 0) {
                const npcId = tile.npcs[0];
                npcData = npcLookup.get(npcId);
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
    <div className="relative bg-slate-950 rounded-lg border-2 border-slate-700 shadow-2xl overflow-hidden h-[70vh] w-[70vh] md:h-[85vh] md:w-[85vh] mx-auto flex items-center justify-center p-1 strict-contain transition-all duration-300 group">
      {/* Vignette Overlay for Fog/Atmosphere - GPU accelerated mask */}
      <div 
         className="absolute inset-0 z-10 pointer-events-none"
         style={{
             background: 'radial-gradient(circle, transparent 30%, rgba(2, 6, 23, 0.4) 70%, rgba(2, 6, 23, 0.9) 100%)',
             boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9)'
         }}
      ></div>

      <div 
        className="grid gap-[1px] bg-slate-900 w-full h-full"
        style={{ 
            gridTemplateColumns: `repeat(${viewRadius * 2 + 1}, minmax(0, 1fr))` 
        }}
      >
        {viewportGrid.map((row, vy) => (
          row.map((cell, vx) => {
            const isPlayerHere = vy === viewRadius && vx === viewRadius;
            
            return (
              <MapTile
                key={`${cell.tile.x}-${cell.tile.y}`}
                tile={cell.tile}
                isPlayer={isPlayerHere}
                isExplored={cell.tile.explored}
                isVoid={cell.isVoid}
                npcData={cell.npcData}
              />
            );
          })
        ))}
      </div>
      
      <div className="absolute bottom-2 right-2 text-[10px] text-slate-600 font-mono bg-black/50 px-2 rounded pointer-events-none backdrop-blur-md z-20">
        {player.position.x}, {player.position.y}
      </div>
    </div>
  );
};

export const FullMap: React.FC<{ 
    mapData: { tiles: Tile[][], width: number, height: number, name: string }; 
    player: Player;
    onClose: () => void;
}> = ({ mapData, player, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Determine Scale
        // Use a safe calculation for tile size to prevent 0 or negative values
        const viewportSize = Math.min(window.innerHeight * 0.85, window.innerWidth * 0.85);
        const maxDim = Math.max(mapData.width, mapData.height, 1);
        const tileSize = Math.max(2, Math.floor(viewportSize / maxDim));
        
        canvas.width = mapData.width * tileSize;
        canvas.height = mapData.height * tileSize;

        // Clear Background (Slate-950)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Tiles
        for(let y = 0; y < mapData.height; y++) {
            for(let x = 0; x < mapData.width; x++) {
                const tile = mapData.tiles[y][x];
                
                // Get color from constant map
                ctx.fillStyle = TILE_HEX_COLORS[tile.type] || '#0f172a';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

                // Highlight Landmarks
                if ([TileType.TOWN, TileType.PORTAL, TileType.DUNGEON].includes(tile.type)) {
                     ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                     ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }

        // Draw Player Marker
        const px = player.position.x * tileSize + tileSize/2;
        const py = player.position.y * tileSize + tileSize/2;
        const radius = Math.max(tileSize/1.5, 3);

        // Ping Animation Effect (Static on Canvas, but drawn distinctly)
        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.beginPath();
        ctx.arc(px, py, radius * 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#f59e0b'; // Amber 500
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, tileSize / 4);
        ctx.stroke();

    }, [mapData, player.position]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border-2 border-slate-700 p-3 rounded-lg shadow-2xl relative flex flex-col items-center max-h-screen max-w-screen overflow-auto">
                 <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded text-amber-500 font-bold pixel-font border border-amber-900/50 shadow-lg z-10 flex items-center gap-2">
                    <MapPin size={16} />
                    {mapData.name}
                 </div>
                 
                 <button 
                    onClick={onClose}
                    className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 border-2 border-slate-900 hover:bg-red-500 transition-colors shadow-lg z-20"
                    title="Close Map (M)"
                >
                    <X size={24} />
                 </button>

                 <div className="relative overflow-auto rounded border border-slate-800 shadow-inner bg-black">
                     <canvas ref={canvasRef} className="block" />
                 </div>
                 
                 <div className="mt-3 flex items-center gap-4 text-slate-400 text-xs font-mono bg-slate-950 px-4 py-2 rounded-full border border-slate-800">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> You
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-800"></span> Portal
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-stone-700"></span> Mountain
                    </span>
                    <span>Pos: {player.position.x}, {player.position.y}</span>
                 </div>
            </div>
        </div>
    );
};

export default memo(WorldMap);
