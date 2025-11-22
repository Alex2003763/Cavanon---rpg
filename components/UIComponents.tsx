
import React, { useState, useEffect } from 'react';
import { Player, EquipmentSlot, Item, Stats, GameMode, TileType, Quest, QuestStatus, QuestType, ItemRarity } from '../types';
import { ITEMS, BASE_STATS, RACES, CLASSES, SKILLS, ENEMY_TEMPLATES, TILE_ICONS } from '../constants';
import { calculateStats } from '../utils';
import { Shield, Sword, Footprints, Brain, Zap, Heart, Star, X, Trash2, Shirt, Save, Upload, User, ArrowLeftRight, Package, Info, BookOpen, Scroll, Store, Check, Coins } from 'lucide-react';

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

// --- Item Tooltip Helper ---
const getItemTooltip = (item: Item): string => {
    let tooltip = `[${item.rarity || 'COMMON'}] ${item.name}`;
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

export const DialoguePanel: React.FC<{ 
  npcName: string; 
  text: string; 
  options: { label: string; onClick: () => void; disabled?: boolean }[];
  onClose: () => void;
}> = ({ npcName, text, options, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-slate-900 border-2 border-amber-700 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 rounded-lg overflow-hidden">
      <div className="bg-slate-950/50 border-b border-amber-700/50 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-amber-500 pixel-font flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            {npcName}
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white hover:bg-slate-800 rounded-full p-1"><X size={18} /></button>
      </div>
      <div className="p-6 min-h-[120px] text-lg text-slate-200 font-serif leading-relaxed bg-slate-900">
        "{text}"
      </div>
      <div className="p-4 bg-slate-950 border-t border-slate-800 grid gap-2">
        {options.map((opt, idx) => (
          <button
            key={idx}
            onClick={opt.onClick}
            disabled={opt.disabled}
            className={`
              w-full text-left p-3 border rounded transition-all flex items-center justify-between group
              ${opt.disabled 
                ? 'border-slate-800 text-slate-600 bg-transparent cursor-not-allowed' 
                : 'border-slate-700 hover:border-amber-600 hover:bg-slate-800/50 text-slate-300 hover:text-amber-400 bg-slate-900'
              }
            `}
          >
            <span className="font-mono text-sm"><span className="text-slate-500 mr-2">{idx + 1}.</span> {opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

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

export const InventoryModal: React.FC<{ 
    player: Player; 
    onEquip: (item: Item) => void;
    onUnequip: (slot: EquipmentSlot) => void;
    onUse: (item: Item) => void;
    onClose: () => void;
}> = ({ player, onEquip, onUnequip, onUse, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-600 w-full max-w-4xl rounded-lg shadow-2xl flex flex-col md:flex-row h-[600px] overflow-hidden">
                
                {/* Left: Equipment Paper Doll */}
                <div className="w-full md:w-1/3 bg-slate-950 p-6 border-r border-slate-800 flex flex-col items-center">
                    <h3 className="pixel-font text-amber-500 mb-6">Equipment</h3>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-[200px]">
                        {[EquipmentSlot.HEAD, EquipmentSlot.ACCESSORY, EquipmentSlot.BODY, EquipmentSlot.OFF_HAND, EquipmentSlot.MAIN_HAND, EquipmentSlot.LEGS, EquipmentSlot.FEET].map(slot => {
                            const item = player.equipment[slot as EquipmentSlot];
                            return (
                                <div key={slot} className={`
                                    aspect-square rounded border-2 flex flex-col items-center justify-center p-2 relative group cursor-pointer transition-colors
                                    ${item ? getRarityBorder(item.rarity) + ' bg-slate-900/50' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}
                                `}
                                onClick={() => item && onUnequip(slot as EquipmentSlot)}
                                title={item ? getItemTooltip(item) : `Empty ${slot}`}
                                >
                                    <div className={`text-slate-500 mb-1 ${item ? getRarityText(item.rarity) : ''}`}><SlotIcon slot={slot as EquipmentSlot} /></div>
                                    <div className="text-[8px] text-center uppercase tracking-wider text-slate-500">{slot.replace('_', ' ')}</div>
                                    {item && (
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-red-400 font-bold">
                                            UNEQUIP
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Stats Summary */}
                    <div className="mt-8 w-full space-y-2 text-xs font-mono text-slate-400">
                        <div className="flex justify-between border-b border-slate-800 pb-1"><span>Phys Def</span> <span className="text-slate-200">{player.level * 2 + (player.baseStats.constitution / 2)}</span></div>
                        <div className="flex justify-between border-b border-slate-800 pb-1"><span>Mag Def</span> <span className="text-slate-200">{player.level + (player.baseStats.intelligence / 2)}</span></div>
                        <div className="flex justify-between border-b border-slate-800 pb-1"><span>Speed</span> <span className="text-slate-200">{player.baseStats.speed}</span></div>
                    </div>
                </div>

                {/* Right: Inventory List */}
                <div className="flex-1 flex flex-col bg-slate-900">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="pixel-font text-slate-200">Inventory <span className="text-slate-500 text-sm">({player.inventory.length} items)</span></h3>
                        <button onClick={onClose} className="text-slate-500 hover:text-white"><X /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {player.inventory.length === 0 ? (
                            <div className="text-center text-slate-600 italic mt-10">Your backpack is empty.</div>
                        ) : player.inventory.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} title={getItemTooltip(item)} className={`flex items-center justify-between p-3 bg-slate-950 rounded border ${getRarityBorder(item.rarity)} hover:bg-slate-800 transition-colors group cursor-help`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center border ${item.type === 'WEAPON' ? 'border-red-900 bg-red-900/10 text-red-400' : item.type === 'ARMOR' ? 'border-blue-900 bg-blue-900/10 text-blue-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                                        {item.type === 'WEAPON' ? <Sword size={14} /> : item.type === 'ARMOR' ? <Shield size={14} /> : <div className="text-[10px] font-bold">ITM</div>}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold ${getRarityText(item.rarity)}`}>{item.name}</div>
                                        <div className="text-xs text-slate-500">{item.type} {item.material ? `• ${item.material}` : ''}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.type === 'CONSUMABLE' && (
                                        <Button variant="primary" onClick={() => onUse(item)} className="text-[10px] py-1 px-2">Use</Button>
                                    )}
                                    {(item.type === 'WEAPON' || item.type === 'ARMOR') && (
                                        <Button variant="secondary" onClick={() => onEquip(item)} className="text-[10px] py-1 px-2">Equip</Button>
                                    )}
                                    <button className="text-red-900 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-800 bg-slate-950 text-xs text-slate-500 flex justify-between">
                        <span>Gold: <span className="text-yellow-500">{player.gold}</span></span>
                        <span>Weight: N/A</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const StorageModal: React.FC<{
    player: Player;
    storage: Item[];
    onDeposit: (item: Item) => void;
    onWithdraw: (item: Item) => void;
    onClose: () => void;
}> = ({ player, storage, onDeposit, onWithdraw, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-amber-800 w-full max-w-5xl rounded-lg shadow-2xl flex flex-col h-[600px] overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <h2 className="pixel-font text-amber-500 text-xl flex items-center gap-2"><Package /> Home Storage</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><X /></button>
                </div>
                
                <div className="flex-1 grid grid-cols-2 divide-x divide-slate-800">
                    {/* Left: Inventory */}
                    <div className="flex flex-col bg-slate-900/50">
                        <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-slate-300 text-sm uppercase tracking-wider">
                            Backpack ({player.inventory.length})
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {player.inventory.length === 0 && <div className="text-slate-600 text-center text-xs mt-4">Empty</div>}
                            {player.inventory.map((item, idx) => (
                                <div key={`inv-${idx}`} onClick={() => onDeposit(item)} title={getItemTooltip(item)} className={`flex items-center justify-between p-2 bg-slate-950 border ${getRarityBorder(item.rarity)} rounded hover:bg-slate-900 cursor-pointer group transition-colors`}>
                                    <span className={`text-sm ${getRarityText(item.rarity)}`}>{item.name}</span>
                                    <ArrowLeftRight size={14} className="text-slate-600 group-hover:text-amber-500" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Storage Box */}
                    <div className="flex flex-col bg-slate-900/50">
                         <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-slate-300 text-sm uppercase tracking-wider">
                            Storage Box ({storage.length})
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {storage.length === 0 && <div className="text-slate-600 text-center text-xs mt-4">Empty</div>}
                            {storage.map((item, idx) => (
                                <div key={`store-${idx}`} onClick={() => onWithdraw(item)} title={getItemTooltip(item)} className={`flex items-center justify-between p-2 bg-slate-950 border ${getRarityBorder(item.rarity)} rounded hover:bg-slate-900 cursor-pointer group transition-colors`}>
                                    <ArrowLeftRight size={14} className="text-slate-600 group-hover:text-amber-500 rotate-180" />
                                    <span className={`text-sm ${getRarityText(item.rarity)}`}>{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="p-2 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
                    Click items to transfer between Inventory and Storage.
                </div>
            </div>
        </div>
    );
};

export const CharacterSheet: React.FC<{
    player: Player;
    onClose: () => void;
    onAllocate: (stat: keyof Stats) => void;
}> = ({ player, onClose, onAllocate }) => {
    const { derived, totalStats } = calculateStats(player);
    const raceData = RACES[player.race];
    const classData = CLASSES[player.class];
    const skill = SKILLS[classData?.skillId];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-slate-900 border border-amber-700/50 w-full max-w-3xl rounded-lg shadow-2xl flex flex-col overflow-hidden relative">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <h2 className="pixel-font text-amber-500 text-xl">Character Sheet</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><X /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full">
                    {/* Left Column: Profile */}
                    <div className="p-8 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col gap-6">
                         <div className="flex items-center gap-4">
                             <div className="w-20 h-20 bg-slate-800 rounded-full border-2 border-amber-600 flex items-center justify-center">
                                 <User size={40} className="text-amber-600" />
                             </div>
                             <div>
                                 <h3 className="text-2xl font-bold text-white">{player.name}</h3>
                                 <div className="text-amber-500 font-mono text-sm">Level {player.level} {player.race} {player.class}</div>
                             </div>
                         </div>
                         
                         <div className="space-y-4">
                            <StatBar label="Health" value={Math.round(player.hp)} max={derived.maxHp} color="bg-red-600" />
                            <StatBar label="Mana" value={Math.round(player.mp)} max={derived.maxMp} color="bg-blue-600" />
                            <StatBar label="Experience" value={player.exp} max={player.maxExp} color="bg-yellow-600" />
                         </div>

                         {/* Passives & Skills Info */}
                         <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
                             <div>
                                 <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider flex items-center gap-1">
                                     <Brain size={10} /> Racial Passive
                                 </div>
                                 <div className="text-sm text-amber-200 font-bold" title={raceData?.passiveDescription}>{raceData?.passiveName}</div>
                                 <div className="text-xs text-slate-400">{raceData?.passiveDescription}</div>
                             </div>
                             <div className="border-t border-slate-800 pt-2">
                                 <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider flex items-center gap-1">
                                     <Zap size={10} /> Class Skill
                                 </div>
                                 <div className="text-sm text-cyan-200 font-bold" title={skill?.description}>{skill?.name}</div>
                                 <div className="text-xs text-slate-400">{skill?.description} (CD: {skill?.cooldown} turns)</div>
                             </div>
                         </div>
                    </div>

                    {/* Right Column: Attributes */}
                    <div className="p-8 bg-slate-900 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wider">Attributes</h3>
                            {player.attributePoints > 0 && (
                                <span className="text-amber-400 text-sm font-bold animate-pulse">
                                    {player.attributePoints} Points Available
                                </span>
                            )}
                        </div>
                        
                        <div className="space-y-4 flex-1">
                            {(Object.keys(player.baseStats) as Array<keyof Stats>).map(key => {
                                const isBuffed = totalStats[key] > player.baseStats[key];
                                return (
                                    <div key={key} className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 uppercase tracking-widest">{key}</span>
                                            <span className={`text-lg font-mono font-bold ${isBuffed ? 'text-green-400' : 'text-slate-200'}`}>
                                                {totalStats[key]}
                                                {isBuffed && <span className="text-xs ml-1 text-slate-600">({player.baseStats[key]} + {totalStats[key] - player.baseStats[key]})</span>}
                                            </span>
                                        </div>
                                        {player.attributePoints > 0 && (
                                            <button 
                                                onClick={() => onAllocate(key)}
                                                className="w-8 h-8 flex items-center justify-center bg-amber-900/50 text-amber-400 border border-amber-700 rounded hover:bg-amber-700 hover:text-white transition-colors"
                                            >
                                                +
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs font-mono text-slate-400">
                            <div className="flex justify-between"><span>Evasion</span> <span className="text-white">{derived.evasion.toFixed(1)}%</span></div>
                            <div className="flex justify-between"><span>Crit</span> <span className="text-white">{derived.critChance.toFixed(1)}%</span></div>
                            <div className="flex justify-between"><span>P.Def</span> <span className="text-white">{derived.physicalDef.toFixed(1)}</span></div>
                            <div className="flex justify-between"><span>M.Def</span> <span className="text-white">{derived.magicalDef.toFixed(1)}</span></div>
                            <div className="flex justify-between col-span-2 border-t border-slate-800 pt-2 mt-2">
                                <span className="text-green-400">HP Regen: {derived.hpRegen}/hr</span>
                                <span className="text-blue-400">MP Regen: {derived.mpRegen}/hr</span>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
}

export const CharacterCreation: React.FC<{ onComplete: (player: Partial<Player>) => void; onCancel: () => void }> = ({ onComplete, onCancel }) => {
  const [name, setName] = useState('');
  const [race, setRace] = useState('Human');
  const [pClass, setPClass] = useState('Warrior');
  const [points, setPoints] = useState(5); // Reduced initial points since races/classes give more stats now
  const [bonusStats, setBonusStats] = useState<Stats>({ strength:0, dexterity:0, intelligence:0, constitution:0, speed:0, luck:0 });

  // Combine Base (10) + Race + Class + User Points
  const currentStats = { ...BASE_STATS };
  
  // Apply Race Modifiers
  const raceData = RACES[race];
  Object.keys(raceData.baseStats).forEach(k => {
      const key = k as keyof Stats;
      currentStats[key] = raceData.baseStats[key];
  });
  
  // Apply Class Modifiers
  const classData = CLASSES[pClass];
  if (classData) {
      Object.keys(classData.baseStats).forEach(k => {
        const key = k as keyof Stats;
        if (key !== 'mp' as any) // skip mp hack
            currentStats[key] += classData.baseStats[key] - 10; // Add difference from base 10
      });
  }

  // Apply User Points
  Object.keys(bonusStats).forEach(k => {
      const key = k as keyof Stats;
      currentStats[key] += bonusStats[key];
  });

  const adjustBonus = (key: keyof Stats, delta: number) => {
      if (points - delta < 0 && delta > 0) return;
      if (bonusStats[key] + delta < 0) return; 

      setBonusStats(prev => ({ ...prev, [key]: prev[key] + delta }));
      setPoints(prev => prev - delta);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    const startingItems = classData.startingItems.map(id => ITEMS[id]);
    const equipment: any = {
        MAIN_HAND: null, OFF_HAND: null, HEAD: null, BODY: null, LEGS: null, FEET: null, ACCESSORY: null
    };

    startingItems.forEach(item => {
        if (item.slot) equipment[item.slot] = item;
    });

    onComplete({ 
        name, 
        race, 
        class: pClass, 
        inventory: [ITEMS['BREAD'], ITEMS['POTION_HP']], // Starter consumables
        baseStats: currentStats,
        equipment
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-600 p-8 rounded shadow-2xl max-w-3xl w-full">
        <h2 className="pixel-font text-2xl text-amber-500 mb-2 text-center">Soul Forge</h2>
        <p className="text-center text-slate-500 text-sm mb-8">Design your avatar for the world of Cavanon.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-widest mb-2">Identity</label>
                    <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 p-2 text-white focus:border-amber-500 focus:outline-none rounded"
                    placeholder="Enter Name..."
                    />
                </div>

                <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-widest mb-2">Lineage</label>
                    <div className="flex flex-wrap gap-2">
                    {Object.keys(RACES).map(r => (
                        <button 
                        key={r} 
                        onClick={() => setRace(r)}
                        className={`flex-1 min-w-[80px] p-2 border text-xs rounded font-bold ${race === r ? 'border-amber-500 text-amber-500 bg-amber-900/20' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                        {r}
                        </button>
                    ))}
                    </div>
                    <div className="text-xs text-slate-300 mt-2 bg-slate-950 p-2 rounded border border-slate-800">
                        <div className="font-bold text-amber-500 mb-1">Passive: {raceData.passiveName}</div>
                        <div className="italic text-slate-400">{raceData.passiveDescription}</div>
                    </div>
                </div>

                <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-widest mb-2">Profession</label>
                    <div className="flex flex-wrap gap-2">
                    {Object.keys(CLASSES).map(c => (
                        <button 
                        key={c} 
                        onClick={() => setPClass(c)}
                        className={`flex-1 min-w-[80px] p-2 border text-xs rounded font-bold ${pClass === c ? 'border-cyan-500 text-cyan-500 bg-cyan-900/20' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                        {c}
                        </button>
                    ))}
                    </div>
                    <div className="text-xs text-slate-300 mt-2 bg-slate-950 p-2 rounded border border-slate-800">
                        <div className="font-bold text-cyan-500 mb-1">Skill: {SKILLS[classData.skillId].name}</div>
                        <div className="italic text-slate-400">{SKILLS[classData.skillId].description}</div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-950 p-4 rounded border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-amber-500 text-xs uppercase tracking-widest font-bold">Attributes</label>
                    <span className="text-xs text-slate-400">Points Remaining: <span className="text-white font-bold">{points}</span></span>
                </div>
                
                <div className="space-y-3">
                    {(Object.keys(currentStats) as Array<keyof Stats>).map(key => (
                        <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-slate-300 uppercase w-24 text-[10px]">{key}</span>
                            <div className="flex items-center gap-3">
                                <button onClick={() => adjustBonus(key, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded hover:bg-slate-700 text-slate-400">-</button>
                                <span className="w-6 text-center text-amber-200 font-bold">{currentStats[key]}</span>
                                <button onClick={() => adjustBonus(key, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded hover:bg-slate-700 text-slate-400">+</button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 p-2 bg-slate-900 rounded text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Starting Stats</div>
                    <div className="flex justify-around text-xs font-mono text-slate-300">
                        <div>HP: <span className="text-red-400">{50 + (currentStats.constitution * 5) + 10}</span></div>
                        <div>MP: <span className="text-blue-400">{20 + (currentStats.intelligence * 3) + 5}</span></div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-slate-800">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button disabled={!name} onClick={handleSubmit} className="flex-1 py-3 text-sm">Begin Adventure</Button>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<{ 
    onClose: () => void;
    onSave: () => void;
    onLoad: () => void;
    isMainMenu?: boolean;
}> = ({ onClose, onSave, onLoad, isMainMenu }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div className="bg-slate-900 border border-slate-600 p-6 w-full max-w-sm rounded shadow-2xl">
      <h3 className="pixel-font text-lg text-slate-200 mb-4">System</h3>
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Text Speed</span>
          <select className="bg-slate-950 border border-slate-700 text-slate-200 p-1 text-xs">
            <option>Normal</option>
            <option>Fast</option>
            <option>Instant</option>
          </select>
        </div>
        <div className="border-t border-slate-800 pt-4 space-y-2">
            {!isMainMenu && (
                <Button variant="secondary" onClick={onSave} className="w-full flex gap-2">
                    <Save size={16} /> Save Game
                </Button>
            )}
            <Button variant="secondary" onClick={onLoad} className="w-full flex gap-2">
                <Upload size={16} /> Load Game
            </Button>
        </div>
      </div>
      <Button onClick={onClose} className="w-full">Close</Button>
    </div>
  </div>
);

export const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
     <div className="bg-slate-900 border border-slate-600 p-6 w-full max-w-md rounded">
        <h3 className="pixel-font text-amber-500 mb-4 border-b border-slate-700 pb-2">Field Guide</h3>
        <div className="space-y-4 text-sm font-mono text-slate-300 mb-6">
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <div className="text-slate-500 uppercase text-xs mb-1">Movement</div>
                 <div><span className="bg-slate-800 px-1 rounded border border-slate-600">W</span> <span className="bg-slate-800 px-1 rounded border border-slate-600">A</span> <span className="bg-slate-800 px-1 rounded border border-slate-600">S</span> <span className="bg-slate-800 px-1 rounded border border-slate-600">D</span></div>
              </div>
              <div>
                 <div className="text-slate-500 uppercase text-xs mb-1">System</div>
                 <div className="mb-1"><span className="bg-slate-800 px-1 rounded border border-slate-600">E</span> Interact</div>
                 <div className="mb-1"><span className="bg-slate-800 px-1 rounded border border-slate-600">I</span> Inventory</div>
                 <div className="mb-1"><span className="bg-slate-800 px-1 rounded border border-slate-600">C</span> Character</div>
                 <div className="mb-1"><span className="bg-slate-800 px-1 rounded border border-slate-600">Q</span> Quests</div>
              </div>
           </div>
           <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-xs">
              <p className="mb-2"><strong className="text-cyan-400">Travel:</strong> Go to map edge portals to travel.</p>
              <p className="mb-2"><strong className="text-green-400">Auto-Battle:</strong> Combat is automatic. Skills use cooldowns.</p>
              <p className="mb-2"><strong className="text-yellow-400">Races:</strong> Each race has a unique passive ability.</p>
              <p className="mb-2"><strong className="text-blue-400">Regeneration:</strong> HP/MP restores slowly over time based on stats.</p>
           </div>
        </div>
        <Button onClick={onClose} className="w-full">Close</Button>
     </div>
  </div>
);

export const BestiaryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
    <div className="bg-slate-900 border border-amber-800 w-full max-w-5xl rounded-lg shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <h2 className="pixel-font text-amber-500 text-xl flex items-center gap-2"><BookOpen /> Royal Bestiary</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white hover:bg-slate-800 p-1 rounded"><X /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-900">
            <div className="text-center text-slate-500 text-sm italic mb-6">
                "Know thine enemy, and victory shall be yours." - General Kael
            </div>
            
            {(Object.entries(ENEMY_TEMPLATES) as [TileType, any[]][]).map(([biome, monsters]) => (
                <div key={biome} className="bg-slate-950/30 rounded-lg border border-slate-800 p-4 shadow-sm">
                    <h3 className="text-lg font-bold text-amber-200 mb-4 border-b border-slate-800 pb-2 flex items-center gap-3 uppercase tracking-wider">
                        <span className="flex items-center justify-center w-8 h-8 bg-slate-900 rounded text-amber-500 border border-slate-700 shadow-sm">
                            {TILE_ICONS[biome]}
                        </span> 
                        {biome} Region
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {monsters.map((monster: any, idx: number) => (
                            <div key={idx} className="bg-slate-900 p-4 rounded border border-slate-700/50 hover:border-red-900/50 transition-colors flex flex-col gap-3 relative group overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-900/10 rounded-full group-hover:bg-red-900/20 transition-colors"></div>
                                
                                <div className="flex justify-between items-start z-10">
                                    <div>
                                        <div className="font-bold text-slate-200 group-hover:text-red-300 transition-colors">{monster.name}</div>
                                        <div className="text-[10px] text-slate-500">Average Stats</div>
                                    </div>
                                    {monster.race && <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">{monster.race}</span>}
                                </div>
                                
                                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-slate-400 bg-black/40 p-2 rounded border border-slate-800/50 z-10">
                                    <div className="flex justify-between"><span className="text-slate-600">STR</span> <span className="text-slate-300">{monster.stats.strength}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-600">DEX</span> <span className="text-slate-300">{monster.stats.dexterity}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-600">INT</span> <span className="text-slate-300">{monster.stats.intelligence}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-600">CON</span> <span className="text-slate-300">{monster.stats.constitution}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-600">SPD</span> <span className="text-slate-300">{monster.stats.speed}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-600">LCK</span> <span className="text-slate-300">{monster.stats.luck}</span></div>
                                </div>

                                <div className="text-xs text-slate-500 z-10">
                                    <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">Potential Loot</div>
                                    {monster.lootTable.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {monster.lootTable.map((l: any, i: number) => (
                                                <span key={i} className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-amber-500/80 text-[10px]">
                                                    {ITEMS[l.itemId]?.name || l.itemId}
                                                    <span className="text-slate-600 text-[9px]">{Math.round(l.chance * 100)}%</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-slate-700 italic">None</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
  </div>
);

export const QuestPanel: React.FC<{ 
    quests: Quest[]; 
    onClaim: (questId: string) => void; 
    onClose: () => void; 
}> = ({ quests, onClaim, onClose }) => {
    const activeQuests = quests.filter(q => q.status === QuestStatus.ACTIVE);
    const completedQuests = quests.filter(q => q.status === QuestStatus.COMPLETED);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-slate-900 border border-amber-800 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col h-[70vh] overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                 
                 <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <h2 className="pixel-font text-amber-500 text-xl flex items-center gap-2"><Scroll /> Quest Journal</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white hover:bg-slate-800 p-1 rounded"><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    {quests.length === 0 && (
                        <div className="text-center text-slate-500 italic mt-10">
                            No active quests. Visit the town mayor or explore to find work.
                        </div>
                    )}

                    {completedQuests.length > 0 && (
                         <div className="mb-6">
                             <div className="text-xs font-bold text-green-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Check size={12}/> Completed - Ready to Claim</div>
                             <div className="space-y-2">
                                {completedQuests.map(q => (
                                    <div key={q.id} className="bg-green-900/10 border border-green-800 p-4 rounded flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-green-400">{q.title}</div>
                                            <div className="text-xs text-slate-400">Rewards: {q.expReward} XP, {q.goldReward}g</div>
                                        </div>
                                        <Button variant="success" onClick={() => onClaim(q.id)} className="animate-pulse">Claim</Button>
                                    </div>
                                ))}
                             </div>
                         </div>
                    )}

                    {activeQuests.map(q => (
                        <div key={q.id} className="mb-4 bg-slate-950 border border-slate-800 p-4 rounded shadow-sm relative overflow-hidden group">
                             {/* Progress Bar Background */}
                             <div className="absolute bottom-0 left-0 h-1 bg-amber-900/30 w-full">
                                <div className="h-full bg-amber-600 transition-all duration-1000" style={{ width: `${(q.amountCurrent / q.amountRequired) * 100}%` }}></div>
                             </div>

                             <div className="flex justify-between items-start mb-2 relative z-10">
                                <div>
                                    <div className="font-bold text-amber-100">{q.title}</div>
                                    <div className="text-xs text-slate-400 font-serif italic">"{q.description}"</div>
                                </div>
                                <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded border border-slate-700 text-slate-300">
                                    {q.amountCurrent} / {q.amountRequired}
                                </span>
                             </div>
                             
                             <div className="flex gap-4 mt-3 text-xs text-slate-500 font-mono">
                                 <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500" /> {q.expReward} XP</span>
                                 <span className="flex items-center gap-1"><Coins size={10} className="text-yellow-400" /> {q.goldReward}g</span>
                                 {q.itemReward && <span className="flex items-center gap-1"><Package size={10} className="text-blue-400" /> Item</span>}
                             </div>
                             {q.amountCurrent >= q.amountRequired && (
                                 <div className="absolute top-2 right-2">
                                     <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded font-bold animate-pulse">READY</span>
                                 </div>
                             )}
                        </div>
                    ))}
                </div>
             </div>
        </div>
    );
};

export const ShopInterface: React.FC<{
    merchantName: string;
    merchantInventory: Item[];
    player: Player;
    onBuy: (item: Item) => void;
    onSell: (item: Item) => void;
    onClose: () => void;
}> = ({ merchantName, merchantInventory, player, onBuy, onSell, onClose }) => {
    const [activeTab, setActiveTab] = useState<'BUY' | 'SELL'>('BUY');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-slate-900 border border-amber-800 w-full max-w-4xl rounded-lg shadow-2xl flex flex-col h-[600px] overflow-hidden relative">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <div className="flex flex-col">
                        <h2 className="pixel-font text-amber-500 text-xl flex items-center gap-2"><Store /> {merchantName}</h2>
                        <span className="text-xs text-slate-400">"Finest wares in the land."</span>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700 flex items-center gap-2 text-yellow-400 font-mono font-bold">
                            <Coins size={16} /> {player.gold}
                         </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-white"><X /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900">
                    <button 
                        onClick={() => setActiveTab('BUY')} 
                        className={`flex-1 py-3 font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'BUY' ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Buy
                    </button>
                    <button 
                        onClick={() => setActiveTab('SELL')} 
                        className={`flex-1 py-3 font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'SELL' ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Sell
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-950/50 p-4">
                    {activeTab === 'BUY' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {merchantInventory.map((item, idx) => (
                                 <div key={`shop-${idx}`} title={getItemTooltip(item)} className={`bg-slate-900 border ${getRarityBorder(item.rarity)} p-3 rounded hover:bg-slate-800 transition-colors flex justify-between items-center group cursor-help`}>
                                     <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-700 ${item.type === 'WEAPON' ? 'text-red-400' : item.type === 'ARMOR' ? 'text-blue-400' : 'text-slate-400'}`}>
                                            {item.type === 'WEAPON' ? <Sword size={18} /> : item.type === 'ARMOR' ? <Shield size={18} /> : <Package size={18} />}
                                        </div>
                                        <div>
                                            <div className={`font-bold ${getRarityText(item.rarity)}`}>{item.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase">{item.type} {item.material ? `• ${item.material}` : ''}</div>
                                        </div>
                                     </div>
                                     <Button 
                                        onClick={() => onBuy(item)}
                                        disabled={player.gold < item.value}
                                        className="text-xs px-3 py-1"
                                     >
                                         {item.value}g
                                     </Button>
                                 </div>
                             ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {player.inventory.length === 0 && <div className="text-slate-500 text-center col-span-2 italic mt-10">You have nothing to sell.</div>}
                            {player.inventory.map((item, idx) => {
                                const sellPrice = Math.floor(item.value * 0.5);
                                return (
                                    <div key={`sell-${idx}`} title={getItemTooltip(item)} className={`bg-slate-900 border ${getRarityBorder(item.rarity)} p-3 rounded hover:bg-slate-800 transition-colors flex justify-between items-center group cursor-help`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-700 ${item.type === 'WEAPON' ? 'text-red-400' : item.type === 'ARMOR' ? 'text-blue-400' : 'text-slate-400'}`}>
                                                {item.type === 'WEAPON' ? <Sword size={18} /> : item.type === 'ARMOR' ? <Shield size={18} /> : <Package size={18} />}
                                            </div>
                                            <div>
                                                <div className={`font-bold ${getRarityText(item.rarity)}`}>{item.name}</div>
                                                <div className="text-[10px] text-slate-500 uppercase">{item.type} {item.material ? `• ${item.material}` : ''}</div>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="secondary"
                                            onClick={() => onSell(item)}
                                            className="text-xs px-3 py-1 text-amber-400 border-amber-900/30"
                                        >
                                            Sell {sellPrice}g
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
                    {activeTab === 'BUY' ? 'Purchase items to aid your journey.' : 'Sell items for 50% of their value.'}
                </div>
            </div>
        </div>
    );
};
