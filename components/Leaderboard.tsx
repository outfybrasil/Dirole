import React, { useEffect, useState } from 'react';
import { getLeaderboard, getUserProfile, triggerHaptic } from '../services/mockService';
import { User } from '../types';
import { ActivityFeed } from './ActivityFeed';

export const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [scope, setScope] = useState<'global' | 'friends' | 'activity'>('global');
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async (showLoading = true) => {
    if (scope === 'activity') return;

    if (showLoading) setIsLoading(true);

    try {
      console.log(`[Leaderboard] Fetching ${scope}...`);
      const profile = getUserProfile();
      const data = await getLeaderboard(scope as 'global' | 'friends', profile?.id);
      console.log(`[Leaderboard] Received ${data.length} users.`);
      setUsers(data);
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
        <h2 className="text-4xl font-black italic tracking-tighter text-white mb-2 leading-none">
          RANKING <span className="text-dirole-primary italic">SEMANAL</span>
        </h2>
        <div className="flex items-center justify-center gap-2">
          <span className="h-[1px] w-8 bg-white/10"></span>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Os donos da noite</p>
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
          users.map((user, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;
            const isMe = user.id === localUserId;

            return (
              <div
                key={user.id}
                className={`group relative flex items-center p-4 rounded-[1.5rem] border transition-all hover:scale-[1.02] overflow-hidden ${isFirst
                  ? 'bg-gradient-to-r from-yellow-500/10 via-orange-500/5 to-transparent border-yellow-500/20 shadow-[0_10px_30px_rgba(234,179,8,0.1)]'
                  : isMe
                    ? 'bg-dirole-primary/10 border-dirole-primary/30'
                    : 'bg-white/5 border-white/5'
                  }`}
              >
                {/* Rank Number */}
                <div className="relative w-10 h-10 flex items-center justify-center mr-4 shrink-0">
                  {isFirst ? (
                    <div className="absolute inset-0 bg-yellow-400 rotate-45 rounded-xl blur-md opacity-30 animate-pulse"></div>
                  ) : null}
                  <span className={`relative text-lg font-black italic tracking-tighter ${isFirst ? 'text-yellow-400 text-2xl' :
                    isSecond ? 'text-slate-300' :
                      isThird ? 'text-orange-500' :
                        'text-slate-600'
                    }`}>
                    {index + 1}
                  </span>
                </div>

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full p-[2px] mr-4 shrink-0 transition-transform group-hover:scale-110 ${isFirst ? 'bg-yellow-400' :
                  isMe ? 'bg-dirole-primary' :
                    'bg-white/10'
                  }`}>
                  <div className="w-full h-full rounded-full bg-slate-900 border-2 border-slate-900 flex items-center justify-center text-2xl overflow-hidden shadow-inner">
                    {user.avatar?.startsWith('http') ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.avatar
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-black text-base truncate tracking-tight transition-colors ${isFirst ? 'text-yellow-400' : 'text-white group-hover:text-dirole-primary'}`}>
                      {user.name && user.name.toUpperCase()}
                    </h3>
                    {isMe && <span className="text-[9px] font-black bg-dirole-primary/20 text-dirole-primary px-2 py-0.5 rounded-md uppercase tracking-wider">Você</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{Math.floor(user.points / 10)} check-ins</p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-4 group-hover:translate-x-1 transition-transform">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-2xl font-black italic text-white tracking-tighter leading-none">
                      {user.points}
                    </span>
                    <span className="text-[8px] font-black text-dirole-primary uppercase tracking-[0.2em]">pts</span>
                  </div>
                </div>

                {/* Background Shine on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
              </div>
            );
          })
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
              Ganhe <span className="text-dirole-primary font-black">+10 pontos</span> por cada check-in. O ranking reseta toda segunda-feira às 04:00.
            </p>
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-dirole-primary/5 rounded-full blur-2xl transition-all group-hover:scale-150"></div>
      </div>
    </div>
  );
};