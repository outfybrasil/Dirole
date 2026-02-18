import React, { useEffect, useState, useMemo } from 'react';
import { getLeaderboard, getUserProfile, triggerHaptic } from '../services/mockService';
import { User } from '../types';
import { ActivityFeed } from './ActivityFeed';

export const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [scope, setScope] = useState<'global' | 'friends' | 'activity'>('global');
  const [isLoading, setIsLoading] = useState(false);

  const daysToReset = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffTime = Math.abs(nextMonth.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const fetchData = async (showLoading = true) => {
    if (scope === 'activity') return;

    if (showLoading) setIsLoading(true);

    try {
      console.log(`[Leaderboard] Fetching ${scope}...`);
      const profile = getUserProfile();
      const data = await getLeaderboard(scope as 'global' | 'friends', profile?.id);
      console.log(`[Leaderboard] Received ${data.length} users.`);
      setUsers(data);

      // Write-back to cache
      const userId = profile?.id || 'anon';
      const CACHE_KEY = `dirole_leaderboard_${scope}_${userId}`;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) { /* quota exceeded */ }
    } catch (error) {
      console.error("[Leaderboard] Error loading:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const profile = getUserProfile();
    if (profile) setLocalUserId(profile.id);

    if (scope === 'activity') return;

    // CACHE STRATEGY: Instant Load
    const userId = profile?.id || 'anon';
    const CACHE_KEY = `dirole_leaderboard_${scope}_${userId}`;
    const cached = localStorage.getItem(CACHE_KEY);
    let hasCache = false;

    if (cached) {
      try {
        setUsers(JSON.parse(cached));
        setIsLoading(false);
        hasCache = true;
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    fetchData(!hasCache);
  }, [scope]);

  const handleToggle = (s: 'global' | 'friends' | 'activity') => {
    if (s === scope) return;
    triggerHaptic();
    setScope(s);
  };

  return (
    <div className="px-6 py-8 pb-32 w-full max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black italic tracking-tighter text-white mb-2 leading-none uppercase">
          RANKING <span className="text-dirole-primary italic">MENSAL</span>
        </h2>
        <div className="flex items-center justify-center gap-2">
          <span className="h-[1px] w-8 bg-white/10"></span>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Reseta em {daysToReset} {daysToReset === 1 ? 'dia' : 'dias'} ⏳
          </p>
          <span className="h-[1px] w-8 bg-white/10"></span>
        </div>
      </div>

      {/* Scope Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/5 p-1.5 rounded-[1.25rem] flex gap-1 border border-white/5 backdrop-blur-xl">
          <button
            onClick={() => handleToggle('global')}
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${scope === 'global' ? 'bg-dirole-primary text-white shadow-[0_5px_15px_rgba(139,92,246,0.3)] scale-105' : 'text-slate-500 hover:text-white'}`}
          >
            Global
          </button>
          <button
            onClick={() => handleToggle('friends')}
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${scope === 'friends' ? 'bg-dirole-primary text-white shadow-[0_5px_15px_rgba(139,92,246,0.3)] scale-105' : 'text-slate-500 hover:text-white'}`}
          >
            Amigos
          </button>
          <button
            onClick={() => handleToggle('activity')}
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${scope === 'activity' ? 'bg-dirole-primary text-white shadow-[0_5px_15px_rgba(139,92,246,0.3)] scale-105' : 'text-slate-500 hover:text-white'}`}
          >
            Ao Vivo
          </button>
        </div>
      </div>

      <div className="space-y-3 min-h-[400px]">
        {scope === 'activity' ? (
          <ActivityFeed />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-dirole-primary/30 border-t-dirole-primary rounded-full animate-spin"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando Elite...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 px-8 rounded-[2rem] bg-white/5 border border-white/5 border-dashed">
            <i className="fas fa-ghost text-4xl text-slate-700 mb-4 block"></i>
            <p className="text-slate-500 text-sm font-medium">{scope === 'friends' ? 'Nenhum amigo encontrado. Convide a galera!' : 'A temporada ainda não começou.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* TOP 3 PODIUM */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              {users.slice(0, 3).map((user, index) => {
                const isMe = user.id === localUserId;
                const colors = [
                  'from-yellow-400 to-orange-500', // 1st
                  'from-slate-300 to-slate-400',  // 2nd
                  'from-orange-400 to-orange-600' // 3rd
                ];
                const borderColors = [
                  'border-yellow-500/50',
                  'border-slate-400/30',
                  'border-orange-500/30'
                ];

                return (
                  <div
                    key={user.id}
                    className={`relative group bg-gradient-to-br from-white/10 to-transparent p-5 rounded-[2.5rem] border ${isMe ? 'border-dirole-primary shadow-[0_0_20px_rgba(139,92,246,0.1)]' : borderColors[index]} overflow-hidden transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-center gap-5">
                      {/* Rank Badge */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[index]} flex items-center justify-center shrink-0 shadow-lg`}>
                        <span className="text-2xl font-black italic text-slate-900">{index + 1}</span>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-xl text-white italic uppercase tracking-tighter pr-4 truncate">
                            {user.nickname || user.name}
                          </h3>
                          {isMe && <span className="text-[9px] font-black bg-dirole-primary/20 text-dirole-primary px-2 py-0.5 rounded-md uppercase tracking-wider">Você</span>}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{Math.floor(user.points / 10)} check-ins</p>
                      </div>

                      {/* Points */}
                      <div className="text-right flex flex-col items-end relative z-20">
                        <span className={`text-4xl font-black italic bg-gradient-to-br ${colors[index]} bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] pr-2`}>
                          {user.points}
                        </span>
                        <span className="block text-[10px] font-black text-white/60 uppercase tracking-[0.2em] -mt-1 drop-shadow-sm">pontos</span>
                      </div>
                    </div>

                    {/* Avatar Background Decor */}
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.35] group-hover:opacity-[0.6] transition-all duration-500 group-hover:scale-110 pointer-events-none">
                      <div className="w-full h-full rounded-full flex items-center justify-center text-8xl overflow-hidden">
                        {user.avatar?.startsWith('http') ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.avatar
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* COMPACT LIST FOR OTHERS */}
            {users.length > 3 && (
              <div className="bg-white/5 rounded-[2rem] border border-white/5 divide-y divide-white/5 overflow-hidden">
                {users.slice(3).map((user, index) => {
                  const actualRank = index + 4;
                  const isMe = user.id === localUserId;

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center px-5 py-3.5 transition-colors hover:bg-white/[0.02] ${isMe ? 'bg-dirole-primary/5' : ''}`}
                    >
                      <span className="w-6 text-xs font-black text-slate-600 italic tracking-tighter shrink-0">{actualRank}</span>

                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-sm mr-4 shrink-0 overflow-hidden">
                        {user.avatar?.startsWith('http') ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.avatar
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[13px] font-bold italic uppercase tracking-tighter pr-3 truncate ${isMe ? 'text-dirole-primary' : 'text-slate-300'}`}>
                            {user.nickname || user.name}
                          </span>
                          {isMe && <div className="w-1 h-1 rounded-full bg-dirole-primary"></div>}
                        </div>
                      </div>

                      <div className="text-right flex items-baseline gap-1">
                        <span className="text-sm font-black text-white italic drop-shadow-sm pr-1">{user.points}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 p-6 rounded-[2rem] bg-[#0f0518] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-dirole-primary/10 flex items-center justify-center text-dirole-primary text-xl shadow-inner border border-dirole-primary/20 shrink-0">
            <i className="fas fa-bolt"></i>
          </div>
          <div>
            <p className="text-[11px] font-black text-white uppercase tracking-widest">Acelere seu progresso</p>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">
              Check-ins valem <span className="text-dirole-primary font-black">+10 pontos</span>. O Ranking de Pontos reseta todo 1º dia do mês. Seu <span className="text-white font-black">Nível/XP</span> é vitalício.
            </p>
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-dirole-primary/5 rounded-full blur-2xl transition-all group-hover:scale-150"></div>
      </div>
    </div>
  );
};