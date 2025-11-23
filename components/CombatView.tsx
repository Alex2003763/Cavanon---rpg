

import React, { useEffect, useRef, useState } from 'react';
import { CombatState, Player, BattleSpeed, StatusEffect } from '../types';
import { Button } from './UIComponents';
import { calculateStats, calculateFleeChance } from '../utils';
import { Swords, ShieldAlert, Skull, Play, FastForward, Zap, Star, Ghost, Bug, Droplet, User, Hexagon, PawPrint, Shield, Trophy, AlertTriangle, Heart, Crosshair, RotateCcw, Sword, Flame, Snowflake, Activity } from 'lucide-react';
import { TILE_COLORS } from '../constants';

interface CombatViewProps {
  combatState: CombatState;
  player: Player;
  onToggleSpeed: () => void;
  onFleeAttempt: () => void;
  onClose: () => void; // Used for Victory/Defeat confirmation
  onStart: () => void;
}

const StatusBadge: React.FC<{ effect: StatusEffect }> = ({ effect }) => {
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
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${colorClass} shadow-sm animate-in zoom-in duration-300`}
            title={`${effect.name}: ${effect.duration} turns remaining`}
        >
            <Icon size={10} />
            <span>{effect.name}</span>
            <span className="opacity-75 border-l border-white/10 pl-1 ml-0.5">{effect.duration}</span>
        </div>
    );
};

// Helper component for individual log entries
const CombatLogEntry: React.FC<{ log: string; player: Player }> = ({ log, player }) => {
    const isPlayer = log.startsWith('You') || log.startsWith(player.name);
    const isCrit = log.includes('CRITICAL');
    const isHeal = log.includes('healed') || log.includes('Recovered');
    const isDamage = log.includes('damage') || log.includes('attacked') || log.includes('Dealt');
    
    let Icon = isPlayer ? Swords : Skull;
    let colorClass = isPlayer ? 'text-cyan-200 border-l-4 border-cyan-500 bg-cyan-950/20' : 'text-red-200 border-l-4 border-red-500 bg-red-950/20';

    if (isHeal) {
        Icon = Heart;
        colorClass = 'text-green-200 border-l-4 border-green-500 bg-green-950/20';
    } else if (isCrit) {
        Icon = Zap;
        colorClass = isPlayer ? 'text-yellow-200 border-l-4 border-yellow-500 bg-yellow-900/20' : 'text-orange-200 border-l-4 border-orange-500 bg-orange-900/20';
    } else if (!isDamage && !isHeal) {
        // System or generic messages
        Icon = Shield;
        colorClass = 'text-slate-300 border-l-4 border-slate-500 bg-slate-800/20';
    }

    return (
        <div className={`flex items-center gap-3 p-1.5 rounded-r text-xs font-mono mb-1 transition-all animate-in slide-in-from-left-2 duration-200 ${colorClass} ${isCrit ? 'brightness-110 font-bold' : ''}`}>
            <div className={`shrink-0 ${isCrit ? 'animate-pulse' : ''}`}>
                <Icon size={12} />
            </div>
            <div className="leading-tight">
                {log}
            </div>
        </div>
    );
};

const CombatView: React.FC<CombatViewProps> = ({ combatState, player, onToggleSpeed, onFleeAttempt, onClose, onStart }) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [animState, setAnimState] = useState<'NONE' | 'PLAYER_ATK' | 'ENEMY_ATK' | 'CRIT'>('NONE');
  const [prevLogCount, setPrevLogCount] = useState(0);

  // Auto-scroll combat logs
  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: combatState.speed < 400 ? 'auto' : 'smooth' });
    }
  }, [combatState.logs, combatState.isVictory, combatState.speed]);

  // Handle Animations based on new logs
  useEffect(() => {
      if (combatState.logs.length > prevLogCount) {
          const lastLog = combatState.logs[combatState.logs.length - 1];
          let newAnim: 'NONE' | 'PLAYER_ATK' | 'ENEMY_ATK' | 'CRIT' = 'NONE';

          if (lastLog.includes('CRITICAL')) {
              newAnim = 'CRIT';
          } else if (lastLog.startsWith('You') || lastLog.startsWith(player.name)) {
              // Player did something
              if (lastLog.includes('damage') || lastLog.includes('attacked')) {
                  newAnim = 'PLAYER_ATK';
              }
          } else if (lastLog.includes(combatState.enemy.name)) {
              // Enemy did something
              if (lastLog.includes('damage') || lastLog.includes('attacked')) {
                  newAnim = 'ENEMY_ATK';
              }
          }

          if (newAnim !== 'NONE') {
              setAnimState(newAnim);
              const timer = setTimeout(() => setAnimState('NONE'), Math.min(500, combatState.speed));
              return () => clearTimeout(timer);
          }
      }
      setPrevLogCount(combatState.logs.length);
  }, [combatState.logs, prevLogCount, player.name, combatState.enemy.name, combatState.speed]);


  const { derived: playerDerived } = calculateStats(player);
  
  const enemyPercent = Math.min(100, Math.max(0, (combatState.enemy.hp / combatState.enemy.maxHp) * 100));
  const playerPercent = Math.min(100, Math.max(0, (player.hp / playerDerived.maxHp) * 100));
  const playerMpPercent = Math.min(100, Math.max(0, (player.mp / playerDerived.maxMp) * 100));
  
  const fleeChance = calculateFleeChance(player, combatState.enemy);

  // Icon for speed
  const SpeedIcon = combatState.speed === BattleSpeed.NORMAL ? Play : combatState.speed === BattleSpeed.FAST ? FastForward : Zap;

  // Dynamic Styles for Fast Combat
  const tickRate = combatState.speed;
  const isFast = tickRate < 400;
  
  // Transition should be slightly faster than tick rate to complete before next update
  const dynamicTransition = { transitionDuration: `${isFast ? 80 : 300}ms` };
  // Speed up shake animations for fast mode
  const dynamicAnimDuration = isFast ? { animationDuration: '0.2s' } : undefined;

  // Rarity Visuals
  const getRarityColor = (r: number) => {
      if (r === 1) return 'text-slate-400';
      if (r === 2) return 'text-green-400';
      if (r === 3) return 'text-blue-400';
      if (r === 4) return 'text-purple-400';
      if (r === 5) return 'text-yellow-400';
      return 'text-slate-400';
  };

  const getEnemyIcon = (name: string, rarityColor: string) => {
    const n = name.toLowerCase();
    const props = { size: 140, className: `${rarityColor} drop-shadow-2xl transition-all duration-500` };
    
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

  // Determine Animation Classes (Removed BG Red Flash)
  const screenShakeClass = animState === 'ENEMY_ATK' ? 'anim-shake' : animState === 'CRIT' ? 'anim-hard-shake' : '';
  const enemySpriteClass = animState === 'PLAYER_ATK' ? 'anim-hit' : animState === 'CRIT' ? 'anim-shake brightness-150' : 'animate-bounce-slow';

  // --- Post Battle View ---
  if (combatState.isVictory !== null) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                
                {/* Result Art */}
                <div className={`w-full md:w-1/2 p-10 flex flex-col items-center justify-center relative overflow-hidden ${combatState.isVictory ? 'bg-amber-950/20' : 'bg-red-950/20'}`}>
                    <div className={`absolute inset-0 opacity-20 blur-3xl ${combatState.isVictory ? 'bg-amber-500' : 'bg-red-600'}`}></div>
                    
                    {combatState.isVictory ? (
                        <>
                            <Trophy size={100} className="text-amber-500 mb-6 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-bounce-slow" />
                            <h1 className="pixel-font text-4xl text-amber-500 mb-2 tracking-widest text-center">VICTORY</h1>
                        </>
                    ) : (
                        <>
                            <Skull size={100} className="text-red-600 mb-6 drop-shadow-[0_0_25px_rgba(220,38,38,0.6)]" />
                            <h1 className="pixel-font text-4xl text-red-600 mb-2 tracking-widest text-center">DEFEAT</h1>
                        </>
                    )}
                    <div className="text-slate-400 text-center font-serif italic z-10">
                        {combatState.isVictory ? `The ${combatState.enemy.name} has fallen.` : `You were overwhelmed by the ${combatState.enemy.name}.`}
                    </div>
                </div>

                {/* Result Details */}
                <div className="w-full md:w-1/2 p-8 bg-slate-900 flex flex-col">
                    <h3 className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-6 border-b border-slate-800 pb-2">Battle Report</h3>
                    
                    {combatState.isVictory && (
                        <div className="space-y-4 mb-auto">
                            <div className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
                                <span className="text-slate-400 text-sm">Experience</span>
                                <span className="text-amber-300 font-mono font-bold">+{combatState.enemy.expReward} XP</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
                                <span className="text-slate-400 text-sm">Gold Found</span>
                                <span className="text-yellow-400 font-mono font-bold">+{combatState.enemy.goldReward} G</span>
                            </div>
                            {combatState.loot && combatState.loot.length > 0 && (
                                <div className="mt-4">
                                     <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Loot Dropped</div>
                                     <div className="flex flex-wrap gap-2">
                                        {combatState.loot.map((item, idx) => (
                                            <span key={idx} className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs text-slate-300">
                                                <Star size={10} className="text-yellow-600" /> {item.name}
                                            </span>
                                        ))}
                                     </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {!combatState.isVictory && (
                         <div className="mb-auto text-slate-500 text-sm italic p-4 bg-slate-950 rounded border border-slate-800">
                             "Live to fight another day. Your wounds will heal with time... and rest."
                         </div>
                    )}

                    <Button 
                        onClick={onClose} 
                        className={`w-full py-4 mt-6 text-sm tracking-widest shadow-lg ${combatState.isVictory ? 'bg-amber-700 hover:bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        {combatState.isVictory ? 'CLAIM REWARDS' : 'RETREAT'}
                    </Button>
                </div>
            </div>
        </div>
      );
  }

  // --- Active Combat View ---

  return (
    <div 
        className={`w-full h-full bg-slate-950 flex flex-col animate-in fade-in duration-300 font-sans ${screenShakeClass}`}
        style={dynamicAnimDuration}
    >
      
      {/* 1. SCENE AREA (Top 60%) - FIXED HEIGHT */}
      <div className={`h-[60vh] shrink-0 relative flex items-center justify-center overflow-hidden ${TILE_COLORS[combatState.enemy.type]} bg-opacity-20`}>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-950 to-transparent opacity-80 z-10"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent z-10"></div>

          {/* Enemy HUD (Floating) */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 mb-1">
                  <h2 className={`text-2xl font-bold tracking-wider drop-shadow-md ${rarityColor} pixel-font`}>
                      {combatState.enemy.name}
                  </h2>
                  <span className="bg-red-900/80 text-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-700">LVL {combatState.enemy.level}</span>
              </div>

               {/* Health Bar */}
               <div className="w-full h-3 bg-slate-900/80 rounded-full border border-slate-600/50 backdrop-blur-sm overflow-hidden relative shadow-lg">
                    <div 
                        className="h-full bg-red-600 transition-all ease-out relative"
                        style={{ width: `${Math.max(0, enemyPercent)}%`, ...dynamicTransition }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                    </div>
                </div>
                
                {/* Status Icons */}
                {combatState.enemy.statusEffects && combatState.enemy.statusEffects.length > 0 && (
                    <div className="flex gap-1 mt-1">
                        {combatState.enemy.statusEffects.map((effect, idx) => (
                            <StatusBadge key={`enemy-fx-${idx}`} effect={effect} />
                        ))}
                    </div>
                )}
          </div>

          {/* Enemy Sprite */}
          <div 
            className={`relative z-10 filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] ${enemySpriteClass}`}
            style={dynamicAnimDuration}
          >
               {/* Sprite Glow Aura */}
               <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-3xl opacity-20 rounded-full ${
                    combatState.enemy.rarity >= 4 ? 'bg-yellow-500 animate-pulse' : 
                    combatState.enemy.rarity === 3 ? 'bg-blue-500' : 'bg-black'
               }`}></div>
               {getEnemyIcon(combatState.enemy.name, rarityColor)}
          </div>

           {/* Start Overlay */}
            {!combatState.isStarted && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-slate-900/90 border-2 border-amber-600 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full animate-in zoom-in duration-300">
                        <Swords size={48} className="text-amber-500 mb-2" />
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-1 pixel-font">ENCOUNTER</h2>
                            <p className="text-slate-400 text-sm">A {combatState.enemy.name} blocks the way!</p>
                        </div>
                        <div className="flex gap-3 w-full">
                            <Button variant="primary" onClick={onStart} className="flex-1 py-3 text-lg">FIGHT</Button>
                            <Button variant="danger" onClick={onFleeAttempt} className="flex-1 py-3 text-lg flex flex-col leading-none gap-1">
                                <span>FLEE</span>
                                <span className="text-[9px] opacity-75">{fleeChance}% Chance</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
      </div>

      {/* 2. DASHBOARD AREA (Bottom 40%) - FIXED HEIGHT */}
      <div className="h-[40vh] shrink-0 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            
            {/* Left: Combat Log */}
            <div className="hidden md:flex flex-col w-1/3 border-r border-slate-800 bg-slate-950/30 h-full">
                <div className="px-3 py-2 bg-slate-950/50 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0">
                    Combat Log
                </div>
                {/* Force overflow-y-auto here to keep scrolling inside this box */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-0">
                    {combatState.logs.length === 0 && <div className="text-slate-600 text-xs italic">Battle is starting...</div>}
                    {combatState.logs.map((log, idx) => (
                        <CombatLogEntry key={idx} log={log} player={player} />
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>

            {/* Middle: Player Stats */}
            <div className="flex-1 p-6 flex flex-col justify-center gap-6 bg-slate-900 h-full overflow-hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-white tracking-tight">{player.name}</div>
                        <div className="text-xs text-slate-400">Lvl {player.level} {player.class}</div>
                    </div>
                    {player.statusEffects && player.statusEffects.length > 0 && (
                        <div className="flex gap-1">
                            {player.statusEffects.map((effect, idx) => (
                                <StatusBadge key={`player-fx-${idx}`} effect={effect} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                     {/* HP */}
                     <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Heart size={12} className="text-red-500"/> Health</span>
                            <span>{Math.floor(player.hp)} / {Math.round(playerDerived.maxHp)}</span>
                        </div>
                        <div className="h-4 bg-slate-950 rounded border border-slate-700 overflow-hidden relative">
                            <div 
                                className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all ease-out" 
                                style={{ width: `${playerPercent}%`, ...dynamicTransition }}
                            ></div>
                            <div className="absolute inset-0 bg-white/5"></div>
                        </div>
                     </div>
                     
                     {/* MP */}
                     <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Zap size={12} className="text-blue-500"/> Mana</span>
                            <span>{Math.floor(player.mp)} / {Math.round(playerDerived.maxMp)}</span>
                        </div>
                        <div className="h-4 bg-slate-950 rounded border border-slate-700 overflow-hidden relative">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all ease-out" 
                                style={{ width: `${playerMpPercent}%`, ...dynamicTransition }}
                            ></div>
                             <div className="absolute inset-0 bg-white/5"></div>
                        </div>
                     </div>
                </div>
            </div>

            {/* Right: Controls */}
            <div className="w-full md:w-48 bg-slate-950 p-4 border-l border-slate-800 flex flex-row md:flex-col gap-3 justify-center items-center h-full shrink-0">
                 <Button 
                    onClick={onToggleSpeed} 
                    variant="secondary" 
                    className="flex-1 w-full h-full md:h-16 rounded-lg border border-slate-700 hover:border-slate-500 flex flex-col items-center justify-center gap-1 group transition-all"
                    title="Toggle Speed"
                    disabled={!combatState.isStarted}
                 >
                     <SpeedIcon size={24} className={`transition-colors ${combatState.speed === BattleSpeed.VERY_FAST ? 'text-yellow-400' : 'text-slate-400 group-hover:text-white'}`} />
                     <span className="text-[10px] font-bold tracking-widest text-slate-500 group-hover:text-slate-300">SPEED</span>
                 </Button>
            </div>
      </div>
    </div>
  );
};

export default CombatView;