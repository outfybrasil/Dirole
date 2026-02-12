import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className = "" }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={`relative group max-w-2xl mx-auto w-full px-4 ${className}`}
        >
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
                <i className="fas fa-search text-slate-400 group-focus-within:text-dirole-primary transition-colors"></i>
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscando o próximo rolê?"
                className="w-full bg-[#0f0518]/60 backdrop-blur-2xl border border-white/10 rounded-full h-14 pl-14 pr-12 text-sm text-white focus:outline-none focus:border-dirole-primary/50 focus:bg-[#0f0518]/80 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            />
            {query && (
                <button
                    type="button"
                    onClick={() => { setQuery(''); onSearch(''); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg"
                >
                    <i className="fas fa-times text-[10px]"></i>
                </button>
            )}
        </form>
    );
};
