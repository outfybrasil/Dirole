import React from 'react';
import { Route } from '../types';
import { Play } from 'lucide-react';

interface RouteCardProps {
    route: Route;
    onClick: (route: Route) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, onClick }) => {
    return (
        <div
            onClick={() => onClick(route)}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 hover:bg-slate-800 transition-colors active:scale-98 cursor-pointer group mb-3"
        >
            {/* Avatar Creator */}
            <div className="shrink-0 relative">
                <img src={route.creatorAvatar} className="w-12 h-12 rounded-full border-2 border-dirole-primary" alt={route.creatorName} />
                <div className="absolute -bottom-1 -right-1 bg-black text-xs px-1 rounded shadow text-yellow-500 font-bold">
                    👑
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-lg truncate pr-2 group-hover:text-dirole-primary transition-colors">{route.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        <i className="fas fa-heart text-rose-500"></i> {route.likes}
                    </div>
                </div>

                <p className="text-sm text-slate-400 line-clamp-2 mt-1 mb-2">
                    "{route.description}"
                </p>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        {route.stops.map((stop, idx) => (
                            <div key={stop.locationId} className="flex items-center">
                                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-white/5">
                                    {idx + 1}. {stop.locationName}
                                </span>
                                {idx < route.stops.length - 1 && (
                                    <div className="w-3 h-0.5 bg-slate-700 mx-1"></div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button className="w-8 h-8 rounded-full bg-dirole-primary flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                        <Play size={12} fill="currentColor" />
                    </button>
                </div>

                <p className="text-[10px] text-slate-500 mt-2">Criado por {route.creatorName} • {route.completions} completaram</p>
            </div>
        </div>
    );
};
