import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface GameLogProps {
  logs: LogEntry[];
  isLoading: boolean;
}

const GameLog: React.FC<GameLogProps> = ({ logs, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when logs update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full font-mono text-sm overflow-y-auto p-2 space-y-3">
      {logs.map((log) => (
        <div key={log.id} className={`
          p-2 rounded border-l-2 animate-in fade-in slide-in-from-left-2 duration-300
          ${log.type === 'COMBAT' ? 'bg-red-900/20 border-red-500 text-red-200' : ''}
          ${log.type === 'NARRATIVE' ? 'bg-amber-900/10 border-amber-500 text-amber-100 italic' : ''}
          ${log.type === 'SYSTEM' ? 'bg-slate-800 border-slate-500 text-slate-400' : ''}
          ${log.type === 'INFO' ? 'bg-transparent border-blue-400 text-blue-200' : ''}
          ${log.type === 'DIALOGUE' ? 'bg-emerald-900/10 border-emerald-500 text-emerald-200' : ''}
        `}>
          <span className="text-xs text-slate-500 opacity-50 mr-2">[{log.timestamp}]</span>
          {log.type === 'NARRATIVE' ? (
            <span dangerouslySetInnerHTML={{ __html: log.text.replace(/\n/g, '<br/>') }} />
          ) : (
            <span>{log.text}</span>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="p-2 text-amber-400 animate-pulse italic">
          Processing...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default GameLog;