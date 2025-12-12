
import React, { useEffect, useState } from 'react';
import { getLeaderboard, getUserProfile, triggerHaptic } from '../services/mockService';
import { User } from '../types';

export const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [scope, setScope] = useState<'global' | 'friends'>('global');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const profile = getUserProfile();
    if (profile) setLocalUserId(profile.id);
  }, [scope]);

  const fetchData = async () => {
      setIsLoading(true);
      const profile = getUserProfile();
      const data = await getLeaderboard(scope, profile?.id);
      setUsers(data);
      setIsLoading(false);
  };

  const handleToggle = (s: 'global' | 'friends') => {
      if (s === scope) return;
      triggerHaptic();
      setScope(s);
  };

  return (
    <div className="p-6 pb-24">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 inline-block">
          Ranking Semanal
        </h2>
        <p className="text-slate-400 text-sm mt-1">Quem domina a noite de Curitiba 👑</p>
      </div>

      {/* Scope Toggle */}
      <div className="flex justify-center mb-6">
         <div className="bg-slate-800 p-1 rounded-xl flex gap-1 border border-white/10">
             <button 
                onClick={() => handleToggle('global')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${scope === 'global' ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
                 Global 🌎
             </button>
             <button 
                onClick={() => handleToggle('friends')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${scope === 'friends' ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
                 Meus Amigos 👥
             </button>
         </div>
      </div>

      <div className="space-y-4 min-h-[300px]">
        {isLoading ? (
            <div className="text-center py-10 text-slate-500">
                <i className="fas fa-circle-notch fa-spin"></i>
            </div>
        ) : users.length === 0 ? (
            <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                <p>{scope === 'friends' ? 'Adicione amigos para ver o ranking!' : 'Ninguém pontuou ainda.'}</p>
            </div>
        ) : (
            users.map((user, index) => (
            <div 
                key={user.id} 
                className={`flex items-center p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                index === 0 
                    ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/40 shadow-lg shadow-yellow-900/20' 
                    : user.id === localUserId 
                    ? 'bg-dirole-primary/10 border-dirole-primary/40'
                    : 'glass-card border-white/5'
                }`}
            >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm mr-3 border ${
                index === 0 ? 'bg-yellow-500 text-black border-yellow-300' : 
                index === 1 ? 'bg-slate-300 text-black border-slate-100' : 
                index === 2 ? 'bg-orange-700 text-white border-orange-500' : 
                'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                {index + 1}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl border border-white/10 mr-3 shadow-sm overflow-hidden">
                    {user.avatar?.startsWith('http') ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                    user.avatar
                    )}
                </div>

                <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-lg ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                    {user.name} 
                    {user.id === localUserId && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70 ml-2 uppercase tracking-wide">Eu</span>}
                    </h3>
                </div>
                <p className="text-xs text-slate-500">{Math.floor(user.points / 10)} check-ins realizados</p>
                </div>
                <div className="text-right">
                <span className="block text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-br from-dirole-primary to-dirole-secondary">
                    {user.points}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pontos</span>
                </div>
            </div>
            ))
        )}
      </div>

      <div className="mt-8 p-4 bg-gradient-to-r from-dirole-primary/20 to-dirole-secondary/20 rounded-xl border border-dirole-primary/30 text-center backdrop-blur-sm">
        <p className="text-sm text-white">
          <i className="fas fa-info-circle mr-2 text-dirole-primary"></i>
          Ganhe <span className="text-dirole-secondary font-bold">+10 pontos</span> por cada check-in completo!
        </p>
      </div>
    </div>
  );
};