
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player, EquipmentSlot, Item, Stats, GameMode, TileType, Quest, QuestStatus, QuestType, ItemRarity, GameState, GameSettings, AutoSaveFrequency, ClassData, RaceData, NPC, StatusEffect } from '../types';
import { ITEMS, BASE_STATS, RACES, CLASSES, SKILLS, ENEMY_TEMPLATES, TILE_ICONS } from '../constants';
import { calculateStats, formatDate, formatTime } from '../utils';
import { Shield, Sword, Footprints, Brain, Zap, Heart, Star, X, Trash2, Shirt, Save, Upload, User, ArrowLeftRight, Package, Info, BookOpen, Scroll, Store, Check, Coins, Activity, RefreshCw, Disc, FileText, LogOut, MousePointer2, Backpack, Volume2, Sliders, Grid, Skull, HelpCircle, ChevronRight, Play, Crown, Flame, Clock, Loader2, Droplet, Snowflake, Download } from 'lucide-react';

// Helper for rarity styling
const getRarityBorder = (rarity?: ItemRarity) => {
    switch(rarity) {
        case ItemRarity.COMMON: return 'border-slate-700';
        case ItemRarity.UNCOMMON: return 'border-green-600';
        case ItemRarity.RARE: return 'border-blue-500';
        case ItemRarity.EPIC: return 'border-purple-500';
        case ItemRarity.LEGENDARY: return 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
        default: return 'border-slate-700';
    }
};

const getRarityText = (rarity?: ItemRarity) => {
    switch(rarity) {
        case ItemRarity.COMMON: return 'text-slate-400';
        case ItemRarity.UNCOMMON: return 'text-green-400';
        case ItemRarity.RARE: return 'text-blue-400';
        case ItemRarity.EPIC: return 'text-purple-400';
        case ItemRarity.LEGENDARY: return 'text-yellow-400 font-bold';
        default: return 'text-slate-400';
    }
};

const getItemTooltip = (item: Item): string => {
    let tooltip = `[${item.rarity || 'COMMON'}] ${item.name}`;
    if (item.quantity && item.quantity > 1) tooltip += ` (x${item.quantity})`;
    tooltip += `\nType: ${item.type} ${item.material ? `(${item.material})` : ''}`;
    
    if (item.damage) tooltip += `\nDamage: ${item.damage}`;
    if (item.defense) tooltip += `\nDefense: ${item.defense}`;
    
    if (item.stats) {
        const bonuses = Object.entries(item.stats)
            .filter(([_, val]) => val !== 0)
            .map(([key, val]) => `${val! > 0 ? '+' : ''}${val} ${key.toUpperCase()}`)
            .join(', ');
        if (bonuses) tooltip += `\nStats: ${bonuses}`;
    }

    if (item.effects) {
        const effectText = item.effects.map(eff => {
            const val = Math.round(eff.value * 100);
            return `${eff.type.replace('_', ' ')}: ${val}%`;
        }).join(', ');
        tooltip += `\nEffects: ${effectText}`;
    }
    
    tooltip += `\nValue: ${item.value}g`;
    tooltip += `\n\n"${item.description}"`;
    return tooltip;
};

export const Panel: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`bg-slate-900 border border-slate-700 rounded shadow-lg flex flex-col ${className}`}>
    {title && <h3 className="text-amber-500 font-bold pixel-font px-4 py-2 text-sm uppercase tracking-wider border-b border-slate-700">{title}</h3>}
    <div className="p-4 flex-1">{children}</div>
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-3 py-2 rounded font-bold font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-amber-700 hover:bg-amber-600 text-slate-100 border border-amber-800 shadow-sm",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600",
    danger: "bg-red-900/50 hover:bg-red-800/50 text-red-200 border border-red-800",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white",
    success: "bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-900"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const StatBar: React.FC<{ label: string; value: number; max: number; color: string; subLabel?: string }> = ({ label, value, max, color, subLabel }) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] font-mono mb-0.5 text-slate-400 uppercase tracking-wider">
        <span className="font-bold text-slate-300">{label}</span>
        <span>{value}/{max} {subLabel}</span>
      </div>
      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700/50">
        <div 
          className={`h-full ${color} transition-all duration-500 ease-out`} 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export const StatusBadge: React.FC<{ effect: StatusEffect }> = ({ effect }) => {
    let colorClass = 'bg-slate-700 border-slate-600 text-slate-200';
    let Icon = Activity;

    switch (effect.type) {
        case 'POISON': 
            colorClass = 'bg-green-900/50 border-green-700 text-green-400'; 
            Icon = Skull; 
            break;
        case 'STUN': 
            colorClass = 'bg-yellow-900/50 border-yellow-700 text-yellow-400'; 
            Icon = Zap; 
            break;
        case 'BLEED': 
            colorClass = 'bg-red-900/50 border-red-700 text-red-400'; 
            Icon = Droplet; 
            break;
        case 'BURN': 
            colorClass = 'bg-orange-900/50 border-orange-700 text-orange-400'; 
            Icon = Flame; 
            break;
        case 'FREEZE': 
            colorClass = 'bg-cyan-900/50 border-cyan-700 text-cyan-400'; 
            Icon = Snowflake; 
            break;
        case 'REGEN': 
            colorClass = 'bg-emerald-900/50 border-emerald-700 text-emerald-400'; 
            Icon = Heart; 
            break;
        case 'BUFF_STR': 
            colorClass = 'bg-blue-900/50 border-blue-700 text-blue-400'; 
            Icon = Sword; 
            break;
        case 'BUFF_DEF': 
            colorClass = 'bg-indigo-900/50 border-indigo-700 text-indigo-400'; 
            Icon = Shield; 
            break;
    }

    return (
        <div 
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] md:text-xs font-bold uppercase border ${colorClass} shadow-sm animate-in zoom-in duration-300`}
            title={`${effect.name}: ${effect.duration} turns remaining. Value: ${effect.value || 'N/A'}`}
        >
            <Icon size={12} />
            <span>{effect.name}</span>
            <span className="opacity-75 border-l border-white/10 pl-1.5 ml-0.5 font-mono">{effect.duration}t</span>
        </div>
    );
};

export const DialoguePanel: React.FC<{ 
  npc: NPC; 
  text: string; 
  options: { label: string; onClick: () => void; disabled?: boolean }[];
  onClose: () => void;
}> = ({ npc, text, options, onClose }) => {
  // Calculate hearts based on affinity (0-100 scale, 5 hearts total)
  const hearts = Math.floor(npc.affinity / 20);
  const remainder = npc.affinity % 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border-2 border-amber-700 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 rounded-lg overflow-hidden flex flex-col">
        
        {/* Header with Info and Affinity */}
        <div className="bg-slate-950/80 border-b border-amber-700/50 p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-full border-2 border-amber-600 flex items-center justify-center text-amber-500 shadow-lg">
                    <User size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-amber-500 pixel-font tracking-wide">
                        {npc.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{npc.role}</span>
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{npc.race}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
                 <button onClick={onClose} className="text-slate-500 hover:text-white hover:bg-slate-800 rounded-full p-1 mb-1"><X size={18} /></button>
                 <div className="flex items-center gap-0.5" title={`Affinity: ${npc.affinity}/100`}>
                     {[...Array(5)].map((_, i) => (
                         <Heart 
                            key={i} 
                            size={14} 
                            className={`${i < hearts ? 'fill-pink-500 text-pink-500' : 'text-slate-700'}`} 
                         />
                     ))}
                 </div>
            </div>
        </div>

        {/* Dialogue Content */}
        <div className="p-6 min-h-[140px] text-lg text-slate-200 font-serif leading-relaxed bg-slate-900 relative">
          <span className="text-4xl text-slate-700 absolute top-2 left-2 font-serif opacity-30">"</span>
          <div className="relative z-10">{text}</div>
        </div>

        {/* Options */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 grid gap-2">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={opt.onClick}
              disabled={opt.disabled}
              className={`
                w-full text-left p-3 border rounded transition-all flex items-center justify-between group
                ${opt.disabled 
                  ? 'border-slate-800 text-slate-600 bg-transparent cursor-not-allowed opacity-50' 
                  : 'border-slate-700 hover:border-amber-600 hover:bg-slate-800/50 text-slate-300 hover:text-amber-400 bg-slate-900 shadow-sm hover:shadow-md hover:translate-x-1'
                }
              `}
            >
              <span className="font-mono text-sm flex items-center gap-3">
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${opt.disabled ? 'bg-slate-800' : 'bg-slate-800 group-hover:bg-amber-900 text-slate-400 group-hover:text-amber-200'}`}>{idx + 1}</span> 
                  {opt.label}
              </span>
              {!opt.disabled && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Inventory & Equipment ---

const SlotIcon: React.FC<{ slot: EquipmentSlot }> = ({ slot }) => {
    switch(slot) {
        case EquipmentSlot.MAIN_HAND: return <Sword size={16} />;
        case EquipmentSlot.OFF_HAND: return <Shield size={16} />;
        case EquipmentSlot.HEAD: return <div className="text-[10px] font-bold">HEAD</div>;
        case EquipmentSlot.BODY: return <Shirt size={16} />;
        case EquipmentSlot.LEGS: return <div className="text-[10px] font-bold">LEGS</div>;
        case EquipmentSlot.FEET: return <Footprints size={16} />;
        case EquipmentSlot.ACCESSORY: return <Star size={16} />;
        default: return <div />;
    }
};

const InventoryGridItem: React.FC<{ item: Item; isSelected: boolean; onClick: () => void }> = ({ item, isSelected, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className={`
                aspect-square relative border-2 rounded cursor-pointer transition-all group
                flex items-center justify-center
                ${isSelected ? 'border-white bg-slate-800 shadow-lg scale-105 z-10' : `${getRarityBorder(item.rarity)} bg-slate-900 hover:border-slate-400 hover:bg-slate-800`}
            `}
            title={item.name}
        >
            {/* Item Icon */}
            <div className={`${item.type === 'WEAPON' ? 'text-red-400' : item.type === 'ARMOR' ? 'text-blue-400' : item.type === 'CONSUMABLE' ? 'text-green-400' : 'text-slate-400'}`}>
                {item.type === 'WEAPON' ? <Sword size={24} /> : item.type === 'ARMOR' ? <Shield size={24} /> : item.type === 'CONSUMABLE' ? <Package size={24} /> : <Star size={24} />}
            </div>
            
            {/* Quantity Badge */}
            {(item.quantity || 1) > 1 && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono font-bold px-1 rounded border border-slate-700">
                    {item.quantity}
                </div>
            )}
        </div>
    );
};

export const InventoryModal: React.FC<{ 
    player: Player; 
    onEquip: (item: Item) => void;
    onUnequip: (slot: EquipmentSlot) => void;
    onUse: (item: Item) => void;
    onClose: () => void;
}> = ({ player, onEquip, onUnequip, onUse, onClose }) => {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-950 border border-slate-600 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col md:flex-row h-[80vh] overflow-hidden">
                
                {/* Left: Equipment Paper Doll */}
                <div className="w-full md:w-1/3 bg-slate-950 p-6 border-r border-slate-800 flex flex-col items-center">
                    <h3 className="pixel-font text-amber-500 mb-6 flex items-center gap-2"><User size={18}/> Equipment</h3>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-[200px]">
                        {[EquipmentSlot.HEAD, EquipmentSlot.ACCESSORY, EquipmentSlot.BODY, EquipmentSlot.OFF_HAND, EquipmentSlot.MAIN_HAND, EquipmentSlot.LEGS, EquipmentSlot.FEET].map(slot => {
                            const item = player.equipment[slot as EquipmentSlot];
                            return (
                                <div key={slot} className={`
                                    aspect-square rounded border-2 flex flex-col items-center justify-center p-2 relative group cursor-pointer transition-colors shadow-inner
                                    ${item ? getRarityBorder(item.rarity) + ' bg-slate-900' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}
                                `}
                                onClick={() => item && onUnequip(slot as EquipmentSlot)}
                                title={item ? getItemTooltip(item) : `Empty ${slot}`}
                                >
                                    <div className={`text-slate-500 mb-1 ${item ? getRarityText(item.rarity) : ''}`}><SlotIcon slot={slot as EquipmentSlot} /></div>
                                    <div className="text-[8px] text-center uppercase tracking-wider text-slate-500">{slot.replace('_', ' ')}</div>
                                    {item && (
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-red-400 font-bold transition-opacity">
                                            UNEQUIP
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Stats Summary */}
                    <div className="mt-auto w-full space-y-2 text-xs font-mono text-slate-400 bg-slate-900 p-4 rounded border border-slate-800">
                        <div className="flex justify-between border-b border-slate-800 pb-1"><span>Phys Def</span> <span className="text-slate-200">{Math.floor(player.level * 2 + (player.baseStats.constitution / 2))}</span></div>
                        <div className="flex justify-between border-b border-slate-800 pb-1"><span>Mag Def</span> <span className="text-slate-200">{Math.floor(player.level + (player.baseStats.intelligence / 2))}</span></div>
                        <div className="flex justify-between border-b border-slate-800 pb-1"><span>Speed</span> <span className="text-slate-200">{player.baseStats.speed}</span></div>
                    </div>
                </div>

                {/* Right: Inventory Grid & Details */}
                <div className="flex-1 flex flex-col bg-slate-900 relative">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                        <h3 className="pixel-font text-slate-200 flex items-center gap-2"><Backpack size={18}/> Inventory</h3>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                            <span>{player.inventory.length} Slots Used</span>
                            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded bg-slate-800"><X size={16} /></button>
                        </div>
                    </div>
                    
                    {/* Grid Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
                        {player.inventory.length === 0 ? (
                            <div className="text-center text-slate-600 italic mt-20">Your backpack is empty.</div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                                {player.inventory.map((item, idx) => (
                                    <InventoryGridItem 
                                        key={`${item.id}-${idx}`} 
                                        item={item} 
                                        isSelected={selectedItem === item}
                                        onClick={() => setSelectedItem(item)}
                                    />
                                ))}
                                {/* Empty slots visual filler (optional) */}
                                {Array.from({ length: Math.max(0, 24 - player.inventory.length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square border border-slate-800/50 rounded bg-slate-950/30"></div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Item Details Pane (Bottom) */}
                    <div className="h-48 bg-slate-950 border-t border-slate-800 p-4 flex gap-6 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                        {selectedItem ? (
                            <>
                                <div className={`w-24 h-24 shrink-0 border-2 rounded-lg flex items-center justify-center bg-slate-900 ${getRarityBorder(selectedItem.rarity)}`}>
                                     {selectedItem.type === 'WEAPON' ? <Sword size={40} className={getRarityText(selectedItem.rarity)} /> : 
                                      selectedItem.type === 'ARMOR' ? <Shield size={40} className={getRarityText(selectedItem.rarity)} /> : 
                                      selectedItem.type === 'CONSUMABLE' ? <Package size={40} className={getRarityText(selectedItem.rarity)} /> : <Star size={40} className={getRarityText(selectedItem.rarity)} />}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className={`text-lg font-bold ${getRarityText(selectedItem.rarity)}`}>{selectedItem.name}</h4>
                                            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">{selectedItem.type} • {selectedItem.material || 'Unknown'}</div>
                                        </div>
                                        <div className="text-xs text-amber-400 font-mono">{selectedItem.value}g</div>
                                    </div>
                                    <div className="text-sm text-slate-400 italic my-2 leading-tight">"{selectedItem.description}"</div>
                                    
                                    {/* Stats display */}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-slate-300 mb-auto">
                                        {selectedItem.damage && <span>DMG: <span className="text-red-400">{selectedItem.damage}</span></span>}
                                        {selectedItem.defense && <span>DEF: <span className="text-blue-400">{selectedItem.defense}</span></span>}
                                        {selectedItem.stats && Object.entries(selectedItem.stats).map(([k,v]) => (
                                            <span key={k}>{k.substring(0,3).toUpperCase()}: <span className="text-green-400">+{v}</span></span>
                                        ))}
                                        {selectedItem.effects && selectedItem.effects.map((eff, i) => (
                                            <span key={`eff-${i}`} className="text-cyan-400 font-bold">
                                                {eff.type.replace('_',' ')}: {Math.round(eff.value*100)}%
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex gap-3 mt-2">
                                        {selectedItem.type === 'CONSUMABLE' && (
                                            <Button variant="primary" onClick={() => { onUse(selectedItem); setSelectedItem(null); }} className="flex-1 py-1">Use Item</Button>
                                        )}
                                        {(selectedItem.type === 'WEAPON' || selectedItem.type === 'ARMOR') && (
                                            <Button variant="success" onClick={() => { onEquip(selectedItem); setSelectedItem(null); }} className="flex-1 py-1">Equip</Button>
                                        )}
                                        <Button variant="danger" className="w-12 py-1"><Trash2 size={16} /></Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center w-full text-slate-600 italic gap-2">
                                <MousePointer2 size={20} /> Select an item to view details
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Character Creation ---

export const CharacterCreation: React.FC<{ onComplete: (p: Partial<Player>) => void, onCancel: () => void }> = ({ onComplete, onCancel }) => {
    const [name, setName] = useState('');
    const [race, setRace] = useState<string>('Human');
    const [cls, setCls] = useState<string>('Warrior');

    const selectedRaceData = RACES[race];
    const selectedClassData = CLASSES[cls];
    const selectedSkill = SKILLS[selectedClassData.skillId];

    // Calculate Merged Stats: Base + (Race - Base) + (Class - Base)
    // Use simple additive logic for stats that deviate from base 10
    const mergedStats = useMemo(() => {
        const r = selectedRaceData.baseStats;
        const c = selectedClassData.baseStats;
        const m: Stats = { ...BASE_STATS };
        (Object.keys(m) as Array<keyof Stats>).forEach(k => {
            m[k] = r[k] + c[k] - BASE_STATS[k];
        });
        return m;
    }, [selectedRaceData, selectedClassData]);

    // Calculate Derived Stats for Preview (HP, MP, etc)
    const derivedStats = useMemo(() => {
        const dummyPlayer = {
            baseStats: mergedStats,
            level: 1,
            equipment: {},
            race: race,
            class: cls
        } as unknown as Player; // Cast to satisfy type since we only need stats for calculation
        return calculateStats(dummyPlayer).derived;
    }, [mergedStats, race, cls]);

    return (
        <div className="flex items-center justify-center h-full w-full bg-slate-950 p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4"><button onClick={onCancel} className="text-slate-500 hover:text-white"><X /></button></div>
                
                {/* Form Side */}
                <div className="p-8 w-full md:w-1/2 flex flex-col gap-6 border-r border-slate-800 bg-slate-900/50">
                    <h2 className="pixel-font text-3xl text-amber-500 mb-2">Create Character</h2>
                    
                    <div>
                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Name</label>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter Name..."
                            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 mt-1 focus:border-amber-500 focus:outline-none placeholder-slate-600"
                        />
                    </div>

                    <div>
                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Race</label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                            {Object.keys(RACES).map(r => (
                                <button 
                                    key={r} 
                                    onClick={() => setRace(r)}
                                    className={`p-2 rounded border text-sm font-mono transition-all ${race === r ? 'bg-amber-900/50 border-amber-500 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Class</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {Object.keys(CLASSES).map(c => (
                                <button 
                                    key={c} 
                                    onClick={() => setCls(c)}
                                    className={`p-2 rounded border text-sm font-mono transition-all ${cls === c ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Passive Info */}
                    <div className="bg-slate-950/50 p-4 rounded border border-slate-800 mt-2">
                        <div className="text-xs text-slate-300">
                            <span className="text-amber-500 font-bold uppercase text-[10px] block mb-1">Racial Passive</span>
                            <span className="font-bold text-slate-200">{selectedRaceData.passiveName}</span>
                            <p className="text-slate-500 italic mt-0.5">{selectedRaceData.passiveDescription}</p>
                        </div>
                    </div>

                    <div className="mt-auto pt-4">
                        <Button 
                            className="w-full py-3 text-lg" 
                            disabled={!name.trim()}
                            onClick={() => onComplete({ 
                                name, 
                                race, 
                                class: cls, 
                                baseStats: mergedStats, 
                                inventory: [...selectedClassData.startingItems.map(id => ({ ...ITEMS[id] }))] 
                            })}
                        >
                            Begin Journey <ChevronRight />
                        </Button>
                    </div>
                </div>

                {/* Info Side (Status & Skill) */}
                <div className="w-full md:w-1/2 bg-black/30 p-8 flex flex-col gap-6 overflow-y-auto">
                    
                    {/* Status Preview */}
                    <div className="bg-slate-950 p-4 rounded border border-slate-800 relative">
                        <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-slate-400 text-xs font-bold border border-slate-800 rounded">STATUS PREVIEW</div>
                        
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-2">
                            {/* Base Stats */}
                            <div className="space-y-1">
                                {Object.entries(mergedStats).map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-xs font-mono border-b border-slate-800/50 pb-0.5">
                                        <span className="text-slate-500 uppercase">{k.substring(0,3)}</span>
                                        <span className={v > 10 ? 'text-amber-400 font-bold' : v < 10 ? 'text-red-400' : 'text-slate-300'}>{v}</span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Derived Stats */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-mono border-b border-slate-800/50 pb-0.5">
                                    <span className="text-slate-500">HP</span>
                                    <span className="text-red-400 font-bold">{Math.round(derivedStats.maxHp)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono border-b border-slate-800/50 pb-0.5">
                                    <span className="text-slate-500">MP</span>
                                    <span className="text-blue-400 font-bold">{Math.round(derivedStats.maxMp)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono border-b border-slate-800/50 pb-0.5">
                                    <span className="text-slate-500">DEF</span>
                                    <span className="text-slate-300">{Math.round(derivedStats.physicalDef)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono border-b border-slate-800/50 pb-0.5">
                                    <span className="text-slate-500">M.DEF</span>
                                    <span className="text-slate-300">{Math.round(derivedStats.magicalDef)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono border-b border-slate-800/50 pb-0.5">
                                    <span className="text-slate-500">CRIT</span>
                                    <span className="text-yellow-500">{derivedStats.critChance.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skill Details */}
                    <div className="bg-slate-950 p-4 rounded border border-slate-800 flex-1 relative">
                        <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-cyan-400 text-xs font-bold border border-slate-800 rounded">STARTING SKILL</div>
                        
                        <div className="mt-2">
                             <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-slate-900 rounded border border-slate-700 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-100 text-lg leading-none">{selectedSkill.name}</h3>
                                    <span className="text-[10px] text-cyan-500 font-mono bg-cyan-950/30 px-1 rounded uppercase tracking-wider">{selectedSkill.type}</span>
                                </div>
                             </div>

                             <div className="flex gap-4 text-xs font-mono text-slate-500 mb-4 border-b border-slate-800 pb-2">
                                 <span className="flex items-center gap-1"><Flame size={12} className="text-blue-500"/> Cost: <span className="text-slate-300">{selectedSkill.mpCost} MP</span></span>
                                 <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400"/> CD: <span className="text-slate-300">{selectedSkill.cooldown} Turns</span></span>
                             </div>

                             <p className="text-sm text-slate-400 italic mb-4">"{selectedSkill.description}"</p>

                             {selectedSkill.statusEffect && (
                                 <div className="bg-slate-900/50 p-2 rounded border border-slate-800/50 flex items-center gap-2">
                                     <Activity size={14} className="text-yellow-500" />
                                     <div className="text-xs">
                                         <span className="text-slate-400 uppercase font-bold mr-2">Effect:</span>
                                         <span className="text-yellow-400 font-mono">
                                             {Math.round(selectedSkill.statusEffect.chance * 100)}% chance to {selectedSkill.statusEffect.type}
                                         </span>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Character Sheet ---

export const CharacterSheet: React.FC<{ player: Player, onClose: () => void, onAllocate: (stat: keyof Stats) => void }> = ({ player, onClose, onAllocate }) => {
    const { derived, totalStats } = calculateStats(player);
    
    // Attack Calculations
    const mainHand = player.equipment[EquipmentSlot.MAIN_HAND];
    const weaponDamage = mainHand?.damage || 0;
    const physAttack = totalStats.strength + weaponDamage;
    const magAttack = totalStats.intelligence + weaponDamage;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-600 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col h-[85vh]">
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-950">
                    <h2 className="pixel-font text-xl text-amber-500 flex items-center gap-2"><Crown size={20}/> Character Sheet</h2>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white" /></button>
                </div>
                
                <div className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-8">
                    {/* Left: Attributes */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-1">Attributes</h3>
                            {player.attributePoints > 0 && <span className="text-green-400 text-xs font-bold animate-pulse">Points Available: {player.attributePoints}</span>}
                        </div>

                        {Object.entries(player.baseStats).map(([key, baseVal]) => {
                            const totalVal = totalStats[key as keyof Stats];
                            const bonus = totalVal - (baseVal as number);
                            
                            return (
                                <div key={key} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                                    <span className="text-slate-400 font-mono uppercase text-sm">{key}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-bold text-xl text-slate-200">{totalVal}</span>
                                            {bonus > 0 && <span className="text-xs text-green-400 font-mono">(+{bonus})</span>}
                                            {bonus < 0 && <span className="text-xs text-red-400 font-mono">({bonus})</span>}
                                        </div>
                                        {player.attributePoints > 0 && (
                                            <button 
                                                onClick={() => onAllocate(key as keyof Stats)}
                                                className="bg-green-900 hover:bg-green-700 text-green-200 rounded p-0.5 ml-2"
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">+</div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Detailed Stats */}
                    <div className="flex-1 space-y-6">
                        
                        {/* Player Info Summary */}
                        <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                <div>
                                    <div className="font-bold text-slate-200 text-lg">{player.name}</div>
                                    <div className="text-xs text-slate-500">{player.race} {player.class}</div>
                                </div>
                                <div className="text-center">
                                    <span className="text-slate-400 text-xs block uppercase">Level</span>
                                    <span className="text-amber-500 font-bold text-xl">{player.level}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-slate-500 font-mono">
                                    <span>EXP Progress</span>
                                    <span>{player.exp} / {player.maxExp}</span>
                                </div>
                                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                                     <div className="h-full bg-yellow-600 shadow-[0_0_10px_rgba(202,138,4,0.5)]" style={{ width: `${Math.min(100, (player.exp / player.maxExp) * 100)}%` }}></div>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-slate-400 text-sm">Gold</span>
                                <span className="text-yellow-500 font-mono font-bold flex items-center gap-1"><Coins size={14}/> {player.gold}</span>
                            </div>
                        </div>

                        {/* Combat Ratings Grid */}
                        <div>
                             <h3 className="font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-1 mb-4">Combat Ratings</h3>
                             <div className="grid grid-cols-2 gap-3">
                                 {/* Attack Power */}
                                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center hover:border-red-900/50 transition-colors">
                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Phys Atk</div>
                                     <div className="text-red-400 font-bold text-lg flex items-center justify-center gap-1 font-mono">
                                         <Sword size={14} /> {physAttack}
                                     </div>
                                 </div>
                                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center hover:border-blue-900/50 transition-colors">
                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Mag Atk</div>
                                     <div className="text-blue-400 font-bold text-lg flex items-center justify-center gap-1 font-mono">
                                         <Zap size={14} /> {magAttack}
                                     </div>
                                 </div>

                                 {/* Defenses */}
                                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Phys Def</div>
                                     <div className="text-slate-300 font-bold text-lg font-mono">{Math.round(derived.physicalDef)}</div>
                                 </div>
                                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Mag Def</div>
                                     <div className="text-slate-300 font-bold text-lg font-mono">{Math.round(derived.magicalDef)}</div>
                                 </div>
                                 
                                 {/* Secondary */}
                                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Crit Chance</div>
                                     <div className="text-yellow-500 font-bold text-lg font-mono">{derived.critChance.toFixed(1)}%</div>
                                 </div>
                                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Evasion</div>
                                     <div className="text-green-500 font-bold text-lg font-mono">{derived.evasion.toFixed(1)}%</div>
                                 </div>
                                 
                                 {/* Regen Rates */}
                                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center col-span-2 flex justify-around items-center">
                                     <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">HP Regen</span>
                                        <span className="text-red-400 font-bold font-mono">{derived.hpRegen}/hr</span>
                                     </div>
                                     <div className="w-px h-8 bg-slate-800"></div>
                                     <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">MP Regen</span>
                                        <span className="text-blue-400 font-bold font-mono">{derived.mpRegen}/hr</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                        
                        {/* Equipment Summary */}
                        <div>
                            <h3 className="font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-1 mb-2">Equipped</h3>
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2 text-xs font-mono">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 flex items-center gap-2"><Sword size={12}/> Main Hand</span>
                                    <span className={player.equipment.MAIN_HAND ? getRarityText(player.equipment.MAIN_HAND.rarity) : 'text-slate-600 italic'}>
                                        {player.equipment.MAIN_HAND?.name || 'Empty'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 flex items-center gap-2"><Shield size={12}/> Off Hand</span>
                                    <span className={player.equipment.OFF_HAND ? getRarityText(player.equipment.OFF_HAND.rarity) : 'text-slate-600 italic'}>
                                        {player.equipment.OFF_HAND?.name || 'Empty'}
                                    </span>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-slate-500 flex items-center gap-2"><Shirt size={12}/> Body</span>
                                    <span className={player.equipment.BODY ? getRarityText(player.equipment.BODY.rarity) : 'text-slate-600 italic'}>
                                        {player.equipment.BODY?.name || 'Empty'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Active Effects */}
                        <div>
                             <h3 className="font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-1 mb-4">Active Effects</h3>
                             {player.statusEffects.length === 0 ? (
                                 <div className="text-slate-500 text-sm italic p-2 bg-slate-950 rounded border border-slate-800 text-center">No active status effects.</div>
                             ) : (
                                 <div className="flex flex-wrap gap-2">
                                     {player.statusEffects.map((eff, i) => <StatusBadge key={i} effect={eff} />)}
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Storage Modal ---

export const StorageModal: React.FC<{ 
    player: Player; 
    storage: Item[]; 
    onClose: () => void;
    onDeposit: (item: Item) => void; 
    onWithdraw: (item: Item) => void; 
}> = ({ player, storage, onClose, onDeposit, onWithdraw }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                    <h2 className="pixel-font text-amber-500 text-xl flex items-center gap-2"><Package size={20}/> Storage Chest</h2>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* Player Inventory */}
                    <div className="flex-1 p-4 bg-slate-900 border-r border-slate-800 flex flex-col">
                        <h3 className="font-bold text-slate-400 mb-4 text-center">Backpack ({player.inventory.length})</h3>
                        <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2 content-start p-2">
                             {player.inventory.map((item, i) => (
                                 <div 
                                    key={i} 
                                    className={`aspect-square bg-slate-950 border ${getRarityBorder(item.rarity)} rounded flex items-center justify-center relative cursor-pointer hover:bg-slate-800`}
                                    onClick={() => onDeposit(item)}
                                    title={`Deposit ${item.name}`}
                                 >
                                     <div className={getRarityText(item.rarity)}>
                                         {item.type === 'WEAPON' ? <Sword size={20}/> : item.type === 'ARMOR' ? <Shield size={20}/> : <Star size={20}/>}
                                     </div>
                                     {(item.quantity || 1) > 1 && <span className="absolute bottom-0 right-1 text-[10px] font-bold text-white">{item.quantity}</span>}
                                 </div>
                             ))}
                        </div>
                        <div className="text-center text-xs text-slate-500 mt-2">Click item to Deposit</div>
                    </div>

                    {/* Storage */}
                    <div className="flex-1 p-4 bg-slate-950 flex flex-col">
                        <h3 className="font-bold text-amber-500 mb-4 text-center">Storage ({storage.length})</h3>
                        <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2 content-start p-2">
                             {storage.map((item, i) => (
                                 <div 
                                    key={i} 
                                    className={`aspect-square bg-slate-900 border ${getRarityBorder(item.rarity)} rounded flex items-center justify-center relative cursor-pointer hover:bg-slate-800`}
                                    onClick={() => onWithdraw(item)}
                                    title={`Withdraw ${item.name}`}
                                 >
                                     <div className={getRarityText(item.rarity)}>
                                         {item.type === 'WEAPON' ? <Sword size={20}/> : item.type === 'ARMOR' ? <Shield size={20}/> : <Star size={20}/>}
                                     </div>
                                     {(item.quantity || 1) > 1 && <span className="absolute bottom-0 right-1 text-[10px] font-bold text-white">{item.quantity}</span>}
                                 </div>
                             ))}
                             {storage.length === 0 && <div className="col-span-4 text-center text-slate-600 italic">Empty</div>}
                        </div>
                        <div className="text-center text-xs text-slate-500 mt-2">Click item to Withdraw</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Settings Modal ---

export const SettingsModal: React.FC<{ 
    settings: GameSettings;
    onUpdate: (s: Partial<GameSettings>) => void;
    onClose: () => void;
    onLoadGame: () => void;
    isMainMenu?: boolean;
    onOpenHelp: () => void;
}> = ({ settings, onUpdate, onClose, onLoadGame, isMainMenu, onOpenHelp }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-lg shadow-2xl p-6 relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X/></button>
                 <h2 className="pixel-font text-xl text-slate-200 mb-6 flex items-center gap-2"><Sliders size={20}/> Settings</h2>
                 
                 <div className="space-y-6">
                     <div>
                         <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Text Speed</label>
                         <div className="flex gap-2">
                             {['SLOW', 'NORMAL', 'FAST'].map(s => (
                                 <button 
                                    key={s}
                                    onClick={() => onUpdate({ textSpeed: s as any })}
                                    className={`flex-1 py-2 rounded text-xs font-mono border ${settings.textSpeed === s ? 'bg-amber-900 border-amber-500 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                 >
                                     {s}
                                 </button>
                             ))}
                         </div>
                     </div>

                     <div>
                         <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Auto Save Frequency</label>
                         <select 
                            value={settings.autoSaveFrequency}
                            onChange={(e) => onUpdate({ autoSaveFrequency: e.target.value as AutoSaveFrequency })}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-2 text-sm"
                         >
                             {Object.keys(AutoSaveFrequency).map(k => (
                                 <option key={k} value={k}>{k}</option>
                             ))}
                         </select>
                     </div>

                     <div className="border-t border-slate-800 pt-6 flex flex-col gap-3">
                         {!isMainMenu && (
                             <>
                                <Button onClick={onLoadGame} variant="secondary">Load Game</Button>
                                <Button onClick={() => window.location.reload()} variant="danger">Quit to Menu</Button>
                             </>
                         )}
                         <Button onClick={onOpenHelp} variant="secondary">View Controls / Help</Button>
                     </div>
                 </div>
             </div>
        </div>
    );
};

// --- Shop Interface ---

export const ShopInterface: React.FC<{
    merchantName: string;
    merchantInventory: Item[];
    player: Player;
    onBuy: (item: Item) => void;
    onSell: (item: Item) => void;
    onRestock: () => void;
    onClose: () => void;
}> = ({ merchantName, merchantInventory, player, onBuy, onSell, onRestock, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
             <div className="bg-slate-900 border border-amber-800 w-full max-w-5xl h-[85vh] rounded-lg shadow-2xl flex flex-col">
                 <div className="p-4 bg-amber-950/20 border-b border-amber-900 flex justify-between items-center">
                     <div>
                         <h2 className="pixel-font text-amber-500 text-xl flex items-center gap-2"><Store size={20}/> {merchantName}</h2>
                         <div className="text-xs text-slate-400 font-mono">"Best prices in the realm!"</div>
                     </div>
                     <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded text-yellow-400 font-mono font-bold border border-yellow-900">
                             <Coins size={14}/> {player.gold}g
                         </div>
                         <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                     </div>
                 </div>
                 
                 <div className="flex-1 flex overflow-hidden">
                     {/* Merchant Side */}
                     <div className="flex-1 p-4 border-r border-slate-800 bg-slate-900/50 flex flex-col">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-amber-500">Buy</h3>
                            <button onClick={onRestock} className="text-[10px] text-slate-500 hover:text-amber-400 flex items-center gap-1" title="Restock (100g)"><RefreshCw size={10}/> Restock</button>
                         </div>
                         <div className="flex-1 overflow-y-auto space-y-2 p-1">
                             {merchantInventory.map((item, i) => (
                                 <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800 hover:border-amber-600 transition-colors group">
                                     <div className="flex items-center gap-3">
                                         <div className={`p-2 bg-slate-900 rounded border ${getRarityBorder(item.rarity)}`}>
                                             {item.type === 'WEAPON' ? <Sword size={16} className={getRarityText(item.rarity)}/> : 
                                              item.type === 'ARMOR' ? <Shield size={16} className={getRarityText(item.rarity)}/> : 
                                              <Package size={16} className={getRarityText(item.rarity)}/>}
                                         </div>
                                         <div>
                                             <div className={`text-sm font-bold ${getRarityText(item.rarity)}`}>{item.name}</div>
                                             <div className="text-[10px] text-slate-500">{item.type} • {item.damage ? `DMG ${item.damage}` : item.defense ? `DEF ${item.defense}` : 'Item'}</div>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={() => onBuy(item)}
                                        disabled={player.gold < item.value}
                                        className="px-3 py-1 bg-slate-800 hover:bg-amber-700 disabled:opacity-50 disabled:bg-slate-900 rounded text-xs font-bold text-amber-100 flex items-center gap-1 border border-slate-700"
                                     >
                                         {item.value}g
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>
                     
                     {/* Player Side */}
                     <div className="flex-1 p-4 bg-slate-900 flex flex-col">
                         <h3 className="font-bold text-blue-400 mb-4">Sell</h3>
                         <div className="flex-1 overflow-y-auto space-y-2 p-1">
                             {player.inventory.map((item, i) => (
                                 <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800 hover:border-blue-600 transition-colors group">
                                     <div className="flex items-center gap-3">
                                         <div className={`p-2 bg-slate-900 rounded border ${getRarityBorder(item.rarity)}`}>
                                             {item.type === 'WEAPON' ? <Sword size={16} className={getRarityText(item.rarity)}/> : 
                                              item.type === 'ARMOR' ? <Shield size={16} className={getRarityText(item.rarity)}/> : 
                                              <Package size={16} className={getRarityText(item.rarity)}/>}
                                         </div>
                                         <div>
                                             <div className={`text-sm font-bold ${getRarityText(item.rarity)}`}>{item.name} {(item.quantity || 1) > 1 && `(x${item.quantity})`}</div>
                                             <div className="text-[10px] text-slate-500">{item.type}</div>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={() => onSell(item)}
                                        className="px-3 py-1 bg-slate-800 hover:bg-blue-700 rounded text-xs font-bold text-blue-100 flex items-center gap-1 border border-slate-700"
                                     >
                                         {Math.floor(item.value / 2)}g
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

// --- Quest Panel ---

export const QuestPanel: React.FC<{ quests: Quest[], onClaim: (id: string) => void, onClose: () => void }> = ({ quests, onClaim, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-900 border border-amber-600 w-full max-w-3xl h-[70vh] rounded-lg shadow-2xl flex flex-col relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X/></button>
                <div className="p-6 border-b border-slate-800">
                    <h2 className="pixel-font text-amber-500 text-2xl flex items-center gap-2"><Scroll size={24}/> Quest Log</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {quests.length === 0 && <div className="text-center text-slate-500 italic mt-10">No active quests.</div>}
                    
                    {quests.map(q => (
                        <div key={q.id} className="bg-slate-950 p-4 rounded border border-slate-800 relative overflow-hidden group">
                            {q.status === QuestStatus.COMPLETED && <div className="absolute right-0 top-0 p-2 text-green-500 opacity-20"><Check size={60}/></div>}
                            
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <h3 className={`font-bold text-lg ${q.status === QuestStatus.COMPLETED ? 'text-green-400' : 'text-slate-200'}`}>{q.title}</h3>
                                {q.status === QuestStatus.COMPLETED && (
                                    <Button onClick={() => onClaim(q.id)} variant="success" className="shadow-lg animate-pulse">Claim Reward</Button>
                                )}
                            </div>
                            
                            <p className="text-slate-400 text-sm mb-4 italic">"{q.description}"</p>
                            
                            <div className="bg-slate-900 rounded p-2 mb-2">
                                <div className="flex justify-between text-xs font-mono text-slate-500 mb-1">
                                    <span>Progress</span>
                                    <span>{q.amountCurrent} / {q.amountRequired}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-600 transition-all duration-500" style={{ width: `${Math.min(100, (q.amountCurrent / q.amountRequired) * 100)}%` }}></div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 text-xs font-mono text-amber-500/80 mt-2">
                                <span>Reward:</span>
                                <span>{q.expReward} XP</span>
                                <span>{q.goldReward} Gold</span>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </div>
    );
};

// --- Help Modal ---

export const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-600 max-w-lg w-full rounded-lg shadow-2xl p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X/></button>
            <h2 className="pixel-font text-2xl text-slate-200 mb-6 flex items-center gap-2"><HelpCircle/> Controls</h2>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="block text-amber-500 font-bold mb-1">Movement</span>
                    <span className="text-slate-300">WASD / Arrows</span>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="block text-amber-500 font-bold mb-1">Interact / Search</span>
                    <span className="text-slate-300">E</span>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="block text-amber-500 font-bold mb-1">Character Menu</span>
                    <span className="text-slate-300">C</span>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="block text-amber-500 font-bold mb-1">Inventory</span>
                    <span className="text-slate-300">I</span>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="block text-amber-500 font-bold mb-1">Quests</span>
                    <span className="text-slate-300">Q</span>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="block text-amber-500 font-bold mb-1">Map View</span>
                    <span className="text-slate-300">M</span>
                </div>
            </div>
            
            <div className="mt-6 text-xs text-slate-500 text-center">
                Use the mouse to navigate menus and tooltips.
            </div>
        </div>
    </div>
);

// --- Bestiary Modal ---

export const BestiaryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-600 w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X/></button>
            <div className="p-6 border-b border-slate-800">
                <h2 className="pixel-font text-red-500 text-2xl flex items-center gap-2"><BookOpen/> Bestiary</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(ENEMY_TEMPLATES).flatMap(([biome, enemies]) => 
                    (enemies || []).map((e, idx) => (
                        <div key={`${biome}-${idx}`} className="bg-slate-950 p-4 rounded border border-slate-800 hover:border-red-900/50 group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-200">{e.name}</h4>
                                <span className="text-[10px] uppercase bg-slate-900 text-slate-500 px-2 py-0.5 rounded">{biome}</span>
                            </div>
                            
                            <div className="flex gap-4 text-xs font-mono text-slate-500 mb-2">
                                <span className="flex items-center gap-1"><Heart size={10} className="text-red-900"/> {e.stats?.constitution ? 50 + e.stats.constitution * 5 : '??'} HP</span>
                                <span className="flex items-center gap-1"><Sword size={10} className="text-slate-700"/> {e.stats?.strength || '??'} STR</span>
                            </div>
                            
                            {e.lootTable && e.lootTable.length > 0 && (
                                <div className="text-[10px] text-slate-600 border-t border-slate-900 pt-2 mt-2">
                                    <span className="font-bold">Drops:</span> {e.lootTable.map(l => ITEMS[l.itemId]?.name || l.itemId).join(', ')}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
);

// --- Save/Load Modal ---

export const SaveLoadModal: React.FC<{ 
    mode: 'SAVE' | 'LOAD', 
    onClose: () => void, 
    onAction: (slot: number) => void,
    onImport?: (state: GameState) => void 
}> = ({ mode, onClose, onAction, onImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const getSaveInfo = (slot: number) => {
        try {
            const key = slot === 0 ? 'cavanon_autosave' : `cavanon_save_${slot}`;
            const data = localStorage.getItem(key);
            if (!data) return null;
            const state = JSON.parse(data) as GameState;
            return state;
        } catch (e) {
            return null;
        }
    };

    const handleExport = (e: React.MouseEvent, slot: number) => {
        e.stopPropagation();
        const key = slot === 0 ? 'cavanon_autosave' : `cavanon_save_${slot}`;
        const data = localStorage.getItem(key);
        if (!data) return;
        
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cavanon_save_slot${slot}_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                // Basic structure validation
                if (json.player && json.maps && onImport) {
                    onImport(json);
                } else {
                    alert("Invalid save file format.");
                }
            } catch (err) {
                alert("Failed to parse save file.");
            }
        };
        reader.readAsText(file);
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-600 w-full max-w-md rounded-lg shadow-2xl p-6 relative flex flex-col gap-4">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X/></button>
                 <h2 className="pixel-font text-xl text-slate-200 mb-2 flex items-center gap-2">
                    {mode === 'SAVE' ? <Save size={20} className="text-cyan-500"/> : <Upload size={20} className="text-green-500"/>}
                    {mode === 'SAVE' ? 'Save Game' : 'Load Game'}
                 </h2>

                 <div className="space-y-3">
                     {[0, 1, 2, 3].map(slot => {
                         const info = getSaveInfo(slot);
                         if (mode === 'SAVE' && slot === 0) return null; // Can't manually save to autosave slot

                         return (
                            <div key={slot} className="flex gap-2 w-full group">
                                 <button 
                                    onClick={() => onAction(slot)}
                                    disabled={mode === 'LOAD' && !info}
                                    className={`flex-1 p-4 rounded border text-left transition-all relative overflow-hidden
                                        ${mode === 'LOAD' && !info 
                                            ? 'bg-slate-950/50 border-slate-800 text-slate-600 cursor-not-allowed' 
                                            : 'bg-slate-950 border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-900'
                                        }
                                    `}
                                 >
                                     <div className="flex justify-between items-center mb-1">
                                         <span className="font-bold text-sm text-amber-500">
                                             {slot === 0 ? 'AUTO SAVE' : `SLOT ${slot}`}
                                         </span>
                                         {info && <span className="text-[10px] font-mono text-slate-500">{formatDate(info.date)} {formatTime(info.date)}</span>}
                                     </div>
                                     
                                     {info ? (
                                         <div className="text-xs text-slate-400 font-mono">
                                             Lvl {info.player.level} {info.player.race} {info.player.class} • {info.maps[info.currentMapId].name}
                                         </div>
                                     ) : (
                                         <div className="text-xs text-slate-600 italic">Empty Slot</div>
                                     )}

                                     {/* Hover Effect for Main Button */}
                                     {(!mode || (mode === 'LOAD' && info)) && (
                                         <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                     )}
                                 </button>
                                 
                                 {/* Export Button */}
                                 {info && (
                                     <button 
                                        onClick={(e) => handleExport(e, slot)}
                                        className="bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-slate-800 text-slate-400 hover:text-amber-400 px-3 rounded flex items-center justify-center transition-colors shadow-sm"
                                        title="Export Save to File"
                                     >
                                         <Download size={18} />
                                     </button>
                                 )}
                            </div>
                         );
                     })}
                 </div>
                 
                 {/* Import Button (Only in Load Mode) */}
                 {mode === 'LOAD' && onImport && (
                     <div className="pt-4 border-t border-slate-800 mt-2">
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".json" 
                            onChange={handleFileChange} 
                         />
                         <Button 
                            variant="secondary" 
                            className="w-full py-3 border-dashed border-slate-600 hover:border-amber-500 hover:text-amber-400" 
                            onClick={() => fileInputRef.current?.click()}
                         >
                             <Upload size={16} /> Import Save from File
                         </Button>
                     </div>
                 )}
            </div>
        </div>
    );
};

// --- Loading Screen ---

export const LoadingScreen: React.FC = () => (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
             <div className="relative">
                 <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse"></div>
                 <div className="relative z-10 flex items-center justify-center w-20 h-20 bg-slate-900 rounded-full border-2 border-amber-600/50 shadow-2xl">
                    <Sword size={40} className="text-amber-500 animate-pulse" />
                 </div>
             </div>
             
             <div className="flex flex-col items-center gap-3 text-center">
                 <h1 className="pixel-font text-4xl text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-700 tracking-[0.2em] drop-shadow-sm">
                    CAVANON
                 </h1>
                 <div className="flex items-center gap-3 text-slate-500 font-mono text-xs tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                     <Loader2 size={14} className="animate-spin text-amber-500" />
                     <span>INITIALIZING ASSETS...</span>
                 </div>
             </div>
        </div>
    </div>
);
