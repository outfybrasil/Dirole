import React, { useState } from 'react';
import { User } from '../types';
import { LoginScreen } from '../components/LoginScreen';

interface WebLayoutProps {
    onLoginSuccess: (user: User) => void;
}

export function WebLayout({ onLoginSuccess }: WebLayoutProps) {
    const [showLogin, setShowLogin] = useState(false);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="fixed inset-0 h-full w-full overflow-y-auto safe-scroll bg-[#050505] text-white font-sans flex flex-col selection:bg-purple-500 selection:text-white overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black/50 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="relative w-10 h-10">
                            <div className="absolute inset-0 bg-purple-600 blur-lg opacity-50 animate-pulse"></div>
                            <img src="/og-image.png" alt="Dirole" className="h-10 w-10 object-contain relative z-10" />
                        </div>
                        <span className="text-2xl font-[1000] italic tracking-tighter text-white">DIROLE</span>
                    </div>

                    <div className="hidden md:flex items-center gap-12">
                        <button onClick={() => setShowLogin(true)} className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Mapa</button>
                        <button onClick={() => setShowLogin(true)} className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Ranking</button>
                        <button onClick={() => scrollToSection('features')} className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Sobre</button>
                    </div>

                    <button
                        onClick={() => setShowLogin(true)}
                        className="bg-white text-black px-8 py-3 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                    >
                        ENTRAR
                    </button>
                </div>
            </nav>

            {/* Hero Content */}
            <main className="flex-1 flex flex-col pt-32">

                {/* Hero Section */}
                <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden pb-32">
                    {/* Background Effects */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="relative z-10 max-w-6xl mx-auto space-y-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 sm:mb-12 animate-fade-in-up">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">Versão Web Beta Disponível</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-[1000] italic tracking-tighter leading-snug text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500 drop-shadow-2xl animate-title py-4 sm:py-8 px-2 -mx-2">
                            DESCUBRA<br />O ROLÊ.
                        </h1>

                        <p className="text-lg sm:text-xl md:text-3xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light mb-10 sm:mb-16 px-4">
                            O termômetro social da sua cidade. Saiba onde está bombando, em tempo real.
                        </p>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 pt-4 sm:pt-6 animate-fade-in-up delay-200 w-full px-4">
                            <button
                                onClick={() => setShowLogin(true)}
                                className="w-full md:w-auto px-8 sm:px-12 py-5 sm:py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-3xl text-lg sm:text-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(124,58,237,0.4)] flex items-center justify-center gap-3 sm:gap-4 group"
                            >
                                <i className="fas fa-rocket group-hover:-translate-y-1 transition-transform"></i>
                                ACESSAR AGORA
                            </button>
                            <button disabled className="w-full md:w-auto px-8 sm:px-12 py-5 sm:py-6 bg-white/5 text-slate-500 font-bold rounded-3xl text-lg sm:text-xl border border-white/5 cursor-not-allowed flex items-center justify-center gap-3 sm:gap-4 opacity-50">
                                <i className="fab fa-apple"></i>
                                <i className="fab fa-android"></i>
                                <span className="whitespace-nowrap">APP EM BREVE</span>
                            </button>
                        </div>
                    </div>

                    {/* Floating UI Elements Mockup */}
                    <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-64 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none"></div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-32 sm:py-52 relative bg-black">
                    <div className="max-w-7xl mx-auto px-8 sm:px-12">
                        <div className="text-center mb-20 sm:mb-32">
                            <h2 className="text-4xl sm:text-5xl md:text-7xl font-[1000] italic tracking-tighter mb-6 sm:mb-10 leading-tight py-2 sm:py-4">INTELIGÊNCIA <span className="text-purple-500">SOCIAL</span></h2>
                            <p className="text-slate-400 max-w-3xl mx-auto text-lg sm:text-2xl leading-relaxed font-light px-2">
                                Não dependa da sorte. O Dirole usa dados em tempo real dos usuários para te mostrar onde a festa realmente está acontecendo.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24 lg:gap-32">
                            <FeatureCard
                                icon="fire"
                                color="text-orange-500"
                                bg="bg-orange-500/10"
                                title="Termômetro"
                                desc="Veja quais locais estão pegando fogo ou miados agora mesmo. Atualizado a cada segundo."
                            />
                            <FeatureCard
                                icon="users"
                                color="text-blue-500"
                                bg="bg-blue-500/10"
                                title="Encontre a Galera"
                                desc="Saiba onde seus amigos estão e receba notificações quando o bonde se reunir."
                            />
                            <FeatureCard
                                icon="trophy"
                                color="text-yellow-500"
                                bg="bg-yellow-500/10"
                                title="Domine o Ranking"
                                desc="Ganhe pontos fazendo check-ins, suba de nível e se torne uma lenda da noite."
                            />
                        </div>
                    </div>
                </section>

                {/* CTO Section */}
                <section className="py-32 sm:py-52 relative overflow-hidden bg-[#0a0a0a]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent"></div>
                    <div className="max-w-6xl mx-auto px-8 sm:px-12 text-center relative z-10">
                        <h2 className="text-5xl sm:text-6xl md:text-9xl font-[1000] italic tracking-tighter mb-14 sm:mb-24 leading-normal py-8 px-4">
                            VIVA O ROLÊ <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 inline-block pb-4 px-2">DO FUTURO</span>
                        </h2>
                        <button
                            onClick={() => setShowLogin(true)}
                            className="px-10 sm:px-16 py-6 sm:py-8 bg-white text-black font-black rounded-full text-xl sm:text-2xl hover:scale-105 transition-all shadow-2xl hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] w-full sm:w-auto mb-24"
                        >
                            CRIAR CONTA GRÁTIS
                        </button>
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/5 py-16 bg-black text-center">
                <div className="flex flex-col items-center justify-center gap-4 mb-8 opacity-70">
                    <div className="flex items-center gap-3">
                        <img src="/og-image.png" alt="Logo" className="h-8 w-8 grayscale" />
                        <span className="font-bold tracking-[0.2em] text-lg">DIROLE</span>
                    </div>

                </div>
                <p className="text-slate-600 text-sm mb-2">
                    &copy; {new Date().getFullYear()} Dirole. Todos os direitos reservados.
                </p>
                <p className="text-slate-700 text-xs font-bold tracking-wider uppercase">
                    Distribuído por <span className="text-purple-900">Outfy Brasil</span>
                </p>
            </footer>

            {/* LOGIN MODAL - Fixed Z-Index and Isolation */}
            {showLogin && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
                    style={{ zIndex: 999999 }}
                    onClick={() => setShowLogin(false)}
                >
                    <div
                        className="relative w-full max-w-lg z-[1000000]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <LoginScreen
                            onLoginSuccess={(u) => { setShowLogin(false); onLoginSuccess(u); }}
                            isModal={true}
                            onClose={() => setShowLogin(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function FeatureCard({ icon, title, desc, color, bg }: { icon: string, title: string, desc: string, color: string, bg: string }) {
    return (
        <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-2 group">
            <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform duration-500`}>
                <i className={`fas fa-${icon}`}></i>
            </div>
            <h3 className="text-3xl font-bold mb-6">{title}</h3>
            <p className="text-slate-400 leading-relaxed text-lg">{desc}</p>
        </div>
    )
}
