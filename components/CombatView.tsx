
import React, { useEffect, useRef } from 'react';
import { CombatState, Player, BattleSpeed } from '../types';
import { Button } from './UIComponents';
import { calculateStats, calculateFleeChance } from '../utils';
import { Swords, ShieldAlert, Skull, Play, FastForward, Zap, Star, Ghost, Bug, Droplet, User, Hexagon, PawPrint, Shield, Trophy, AlertTriangle, Heart, Crosshair, RotateCcw, Sword } from 'lucide-react';
import { TILE_COLORS } from '../constants';

interface CombatViewProps {
  combatState: CombatState;
  player: Player;
  onToggleSpeed: () => void;
  onFleeAttempt: () => void;
  onClose: () => void; // Used for Victory/Defeat confirmation
  onStart: () => void;
}

// Helper component for individual log entries
const CombatLogEntry: React.FC<{ log: string; player: Player }> = ({ log, player }) => {
    const isPlayer = log.startsWith('You') || log.startsWith(player.name);
    const isCrit = log.includes('CRIT');
    const isHeal = log.includes('healed') || log.includes('Recovered');
    const isDamage = log.includes('damage') || log.includes('attacked') || log.includes('Dealt');
    
    let Icon = isPlayer ? Swords : Skull;
    let colorClass = isPlayer ? 'text-cyan-200 border-cyan-800 bg-cyan-950/30' : 'text-red-200 border-red-900 bg-red-950/30';

    if (isHeal) {
        Icon = Heart;
        colorClass = 'text-green-200 border-green-800 bg-green-950/30';
    } else if (isCrit) {
        Icon = Zap;
        colorClass = isPlayer ? 'text-yellow-200 border-yellow-700 bg-yellow-900/30' : 'text-orange-200 border-orange-800 bg-orange-900/30';
    } else if (!isDamage && !isHeal) {
        // System or generic messages
        Icon = Shield;
        colorClass = 'text-slate-300 border-slate-700 bg-slate-800/50';
    }

    return (
        <div className={`flex items-start gap-3 p-2 rounded border-l-4 text-xs font-mono mb-1 transition-all animate-in slide-in-from-left-2 duration-200 ${colorClass} ${isCrit ? 'brightness-110 font-bold' : ''}`}>
            <div className={`mt-0.5 shrink-0 ${isCrit ? 'animate-pulse' : ''}`}>
                <Icon size={14} />
            </div>
            <div className="leading-relaxed">
                {log}
            </div>
        </div>
    );
};

const CombatView: React.FC<CombatViewProps> = ({ combatState, player, onToggleSpeed, onFleeAttempt, onClose, onStart }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll combat logs
  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combatState.logs, combatState.isVictory]);

  const { derived: playerDerived } = calculateStats(player);
  
  const enemyPercent = Math.min(100, Math.max(0, (combatState.enemy.hp / combatState.enemy.maxHp) * 100));
  const playerPercent = Math.min(100, Math.max(0, (player.hp / playerDerived.maxHp) * 100));
  const playerMpPercent = Math.min(100, Math.max(0, (player.mp / playerDerived.maxMp) * 100));
  
  const fleeChance = calculateFleeChance(player, combatState.enemy);

  // Icon for speed
  const SpeedIcon = combatState.speed === BattleSpeed.NORMAL ? Play : combatState.speed === BattleSpeed.FAST ? FastForward : Zap;

  // Rarity Visuals
  const getRarityColor = (r: number) => {
      if (r === 1) return 'text-slate-400';
      if (r === 2) return 'text-green-400';
      if (r === 3) return 'text-blue-400';
      if (r === 4) return 'text-purple-400';
      if (r === 5) return 'text-yellow-400';
      return 'text-slate-400';
  };

  const getRarityGlow = (r: number) => {
      if (r === 1) return 'drop-shadow-[0_0_5px_rgba(148,163,184,0.3)]';
      if (r === 2) return 'drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]';
      if (r === 3) return 'drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]';
      if (r === 4) return 'drop-shadow-[0_0_20px_rgba(192,132,252,0.6)]';
      if (r === 5) return 'drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] animate-pulse'; 
      return '';
  };

  const getEnemyIcon = (name: string, rarityColor: string, rarityGlow: string) => {
    const n = name.toLowerCase();
    const props = { size: 120, className: `${rarityColor} ${rarityGlow} transition-all duration-500` };
    
    if (n.includes('wolf') || n.includes('dog') || n.includes('rat')) return <PawPrint {...props} />;
    if (n.includes('spider') || n.includes('crab')) return <Bug {...props} />;
    if (n.includes('slime')) return <Droplet {...props} />;
    if (n.includes('golem')) return <Hexagon {...props} />;
    if (n.includes('skeleton') || n.includes('ghost')) return <Skull {...props} />;
    if (n.includes('armor') || n.includes('shield')) return <Shield {...props} />;
    if (n.includes('bandit') || n.includes('mage') || n.includes('goblin') || n.includes('harpy') || n.includes('orc')) return <User {...props} />;
    
    return <Skull {...props} />;
  };

  const rarityColor = getRarityColor(combatState.enemy.rarity);
  const rarityGlow = getRarityGlow(combatState.enemy.rarity);

  // --- Post Battle View ---
  if (combatState.isVictory !== null) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="w-full max-w-6xl h-[85vh] bg-slate-900 border border-slate-800 rounded-lg shadow-2xl flex overflow-hidden relative">
                
                {/* Left Column: Battle Log */}
                <div className="w-1/3 border-r border-slate-800 bg-slate-950/50 flex flex-col hidden md:flex">
                    <div className="p-4 border-b border-slate-800 bg-slate-900">
                        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            <RotateCcw size={14} /> Combat Log
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                        {combatState.logs.map((log, idx) => (
                            <CombatLogEntry key={idx} log={log} player={player} />
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    {/* Background Ambience */}
                    <div className={`absolute inset-0 opacity-10 pointer-events-none ${combatState.isVictory ? 'bg-yellow-500' : 'bg-red-900'}`}></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                    <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
                        {combatState.isVictory ? (
                            <div className="mb-8 flex flex-col items-center animate-in zoom-in duration-500">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                                    <Trophy size={80} className="text-yellow-500 mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                                </div>
                                <h1 className="pixel-font text-5xl text-yellow-500 mb-2 tracking-widest drop-shadow-lg">VICTORY</h1>
                                <div className="text-yellow-200/60 font-serif text-lg italic">The {combatState.enemy.name} has fallen.</div>
                            </div>
                        ) : (
                             <div className="mb-8 flex flex-col items-center animate-in zoom-in duration-500">
                                <div className="relative">
                                     <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                                     <AlertTriangle size={80} className="text-red-600 mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                                </div>
                                <h1 className="pixel-font text-5xl text-red-600 mb-2 tracking-widest drop-shadow-lg">DEFEAT</h1>
                                <div className="text-red-200/60 font-serif text-lg italic">You have been bested by the {combatState.enemy.name}.</div>
                            </div>
                        )}

                        {combatState.isVictory && (
                            <div className="w-full bg-slate-950/80 border border-slate-800 p-6 rounded-xl mb-8 shadow-xl backdrop-blur-sm">
                                <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4 border-b border-slate-800 pb-2">Rewards Acquired</h3>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-900 p-3 rounded border border-slate-800 flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Experience</span>
                                        <span className="text-xl text-yellow-200 font-mono font-bold">+{combatState.enemy.expReward} XP</span>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-800 flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Gold</span>
                                        <span className="text-xl text-yellow-400 font-mono font-bold">+{combatState.enemy.goldReward} G</span>
                                    </div>
                                </div>
                                
                                {combatState.loot && combatState.loot.length > 0 && (
                                    <div>
                                         <h4 className="text-green-400 text-xs uppercase tracking-widest font-bold mb-3 text-left flex items-center gap-2">
                                            <Star size={12} /> Loot
                                         </h4>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {combatState.loot.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-800 text-xs text-slate-300">
                                                    <div className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded text-yellow-600"><Star size={10} /></div>
                                                    {item.name}
                                                </div>
                                            ))}
                                         </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <Button 
                            onClick={onClose} 
                            className={`w-full py-4 text-lg font-bold tracking-widest shadow-lg transition-transform hover:scale-105 active:scale-95
                                ${combatState.isVictory 
                                    ? 'bg-amber-600 hover:bg-amber-500 border-amber-700 text-white' 
                                    : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200'
                                }`}
                        >
                            {combatState.isVictory ? 'CLAIM REWARDS' : 'RETURN TO VILLAGE'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- Active Combat View ---

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
      
      {/* Battle Scene Container */}
      <div className={`w-full max-w-2xl bg-slate-900 border-2 border-slate-800 rounded-lg overflow-hidden shadow-2xl flex flex-col h-[85vh] relative`}>
        
         {/* Background FX based on Rarity */}
         <div className={`absolute inset-0 pointer-events-none z-0 opacity-10 transition-colors duration-1000 ${
            combatState.enemy.rarity === 5 ? 'bg-yellow-500' : 
            combatState.enemy.rarity === 4 ? 'bg-purple-500' : 
            'bg-transparent'
        }`}></div>

        {/* Start Battle Overlay */}
        {!combatState.isStarted && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
                <div className="flex flex-col items-center gap-6 p-8 bg-slate-900 border-2 border-amber-600 rounded-lg shadow-2xl">
                    <div className="text-center">
                        <div className="text-amber-500 pixel-font text-2xl mb-2">COMBAT ENCOUNTER</div>
                        <div className="text-slate-400 text-sm">A hostile creature blocks your path.</div>
                    </div>
                    <div className="w-full h-px bg-slate-800"></div>
                    <div className="flex gap-4">
                        <Button variant="primary" onClick={onStart} className="w-32 py-4 text-lg flex flex-col items-center gap-1">
                            <Swords size={24} /> FIGHT
                        </Button>
                        <Button variant="danger" onClick={onFleeAttempt} className="w-32 py-4 text-lg flex flex-col items-center gap-1">
                            <ShieldAlert size={24} /> FLEE
                            <span className="text-[10px] opacity-80">{fleeChance}% Chance</span>
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* Top: Enemy HUD */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col gap-2 z-10 relative shadow-md">
            <div className="flex justify-between items-end">
                <div className="flex flex-col">
                    <h2 className={`${rarityColor} font-bold pixel-font text-xl tracking-wider flex items-center gap-2 drop-shadow-sm`}>
                        {combatState.enemy.name}
                        <div className="flex">
                             {Array.from({ length: combatState.enemy.rarity }).map((_, i) => (
                                 <Star key={i} size={12} className="fill-current" />
                             ))}
                        </div>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                            {combatState.enemy.rarity === 1 ? 'Common' : 
                            combatState.enemy.rarity === 2 ? 'Uncommon' : 
                            combatState.enemy.rarity === 3 ? 'Rare' : 
                            combatState.enemy.rarity === 4 ? 'Epic' : 'Legendary'}
                        </span>
                        {combatState.enemy.race && (
                            <span className="text-slate-600 text-[10px] border border-slate-800 px-1 rounded bg-slate-900">{combatState.enemy.race}</span>
                        )}
                    </div>
                </div>
                <span className="text-red-500 font-mono text-xl font-bold drop-shadow-sm">LVL {combatState.enemy.level}</span>
            </div>
            
            {/* Enemy Health Bar */}
            <div className="w-full h-4 bg-slate-900 rounded-full border border-slate-700 overflow-hidden relative shadow-inner group">
                <div 
                    className="h-full bg-red-600 transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${Math.max(0, enemyPercent)}%` }}
                >
                     <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md z-10">
                    {combatState.enemy.hp} / {combatState.enemy.maxHp} HP
                </span>
            </div>
        </div>

        {/* Center: Visuals */}
        <div className={`flex-1 relative flex items-center justify-center ${TILE_COLORS[combatState.enemy.type]} bg-opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-hidden`}>
            
            {/* Enemy Sprite */}
            <div className="relative animate-bounce-slow z-10">
                 {/* Sprite Glow Backdrop */}
                 <div className={`w-48 h-48 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse ${
                     combatState.enemy.rarity === 5 ? 'bg-yellow-500/20' : 
                     combatState.enemy.rarity === 4 ? 'bg-purple-500/20' : 
                     combatState.enemy.rarity === 3 ? 'bg-blue-500/20' : 
                     'bg-black/50'
                }`}></div>
                {getEnemyIcon(combatState.enemy.name, rarityColor, rarityGlow)}
            </div>
        </div>

        {/* Bottom: Controls & Player HUD */}
        <div className="bg-slate-950 border-t border-slate-800 flex flex-col z-10 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)] h-1/2">
            
            {/* Combat Log (Active) */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50 relative">
                <div className="space-y-1">
                    {combatState.logs.map((log, idx) => (
                        <CombatLogEntry key={idx} log={log} player={player} />
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>

            {/* Player Status & Buttons */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4 shrink-0">
                <div className="flex-1 space-y-3">
                     <div className="flex justify-between items-baseline">
                         <span className="font-bold text-white text-lg tracking-tight">{player.name}</span>
                     </div>
                     
                     <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                            <span>HP</span>
                            <span>{Math.floor(player.hp)} / {Math.round(playerDerived.maxHp)}</span>
                        </div>
                        <div className="h-3 bg-slate-950 rounded border border-slate-700 overflow-hidden relative">
                            <div 
                                className="h-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all duration-300"
                                style={{ width: `${playerPercent}%` }}
                            />
                        </div>
                     </div>
                     
                     <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                            <span>MP</span>
                            <span>{Math.floor(player.mp)} / {Math.round(playerDerived.maxMp)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded border border-slate-700 overflow-hidden relative">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300"
                                style={{ width: `${playerMpPercent}%` }}
                            />
                        </div>
                     </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        onClick={onToggleSpeed} 
                        variant="secondary" 
                        className="h-14 w-16 rounded-lg flex flex-col items-center justify-center gap-1 border border-slate-600 hover:bg-slate-800 hover:border-slate-500 transition-all"
                        title="Toggle Battle Speed"
                        disabled={!combatState.isStarted}
                    >
                        <SpeedIcon size={20} className={combatState.speed === BattleSpeed.VERY_FAST ? 'text-yellow-400' : 'text-slate-300'} />
                        <span className="text-[9px] font-bold tracking-wider text-slate-400">SPEED</span>
                    </Button>

                    <Button 
                        onClick={onFleeAttempt} 
                        variant="danger" 
                        className="h-14 w-16 rounded-lg flex flex-col items-center justify-center gap-1 border border-red-900 hover:bg-red-900/30 hover:border-red-500 transition-all"
                        disabled={!combatState.isStarted}
                    >
                        <ShieldAlert size={20} className="text-red-200" />
                        <span className="text-[9px] font-bold tracking-wider text-red-200">FLEE</span>
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CombatView;
