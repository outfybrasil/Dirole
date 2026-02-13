import React from 'react';
import { Sparkles, MapPin, Users, Star, ArrowRight, Smartphone, Music, Search } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface LandingPageProps {
    onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    const [modalContent, setModalContent] = React.useState<{ title: string, text: string } | null>(null);

    return (
        <div className="min-h-screen bg-[#0f0518] text-white font-sans overflow-x-hidden relative selection:bg-purple-500/30">
            {/* Modal for About/Terms/Privacy - Styled as a "New Window" */}
            {modalContent && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center sm:p-6 backdrop-blur-2xl bg-black/80 animate-fade-in transition-all">
                    <div className="bg-[#0f0518] border-0 sm:border sm:border-white/10 w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-[2.5rem] flex flex-col relative shadow-[0_0_100px_rgba(139,92,246,0.2)] overflow-hidden">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5 bg-white/5">
                            <h3 className="text-2xl font-black italic tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                                {modalContent.title}
                            </h3>
                            <button
                                onClick={() => setModalContent(null)}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
                            >
                                <ArrowRight className="w-6 h-6 rotate-180" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-gray-300 leading-relaxed text-lg space-y-6">
                            {modalContent.text.split('\n').map((para, i) => (
                                <p key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>{para}</p>
                            ))}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-white/5 bg-black/40 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-3 opacity-60">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Desenvolvido por</p>
                                <span className="text-xl font-black italic text-white tracking-widest">OUTFY</span>
                            </div>
                            <button
                                onClick={() => setModalContent(null)}
                                className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black italic rounded-2xl hover:scale-105 transition-all shadow-lg active:scale-95"
                            >
                                FECHAR JANELA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Background Ambience */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[60%] bg-pink-600/10 rounded-full blur-[100px] animate-pulse-slow delay-700"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between backdrop-blur-md bg-[#0f0518]/50 border-b border-white/5 gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-28 h-28 md:w-36 md:h-36 relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/40 to-pink-500/40 rounded-[2.5rem] blur-3xl animate-pulse"></div>
                        <img src="/og-image.png" className="w-28 h-28 md:w-36 md:h-36 object-contain relative z-10 drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]" alt="Dirole Logo" />
                    </div>
                    <span className="text-6xl md:text-8xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/40 no-clip px-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        DIROLE
                    </span>
                </div>
                <button
                    onClick={onEnter}
                    className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                >
                    Entrar
                </button>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-8">

                {/* Text Content */}
                <div className="flex-1 text-center md:text-left space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        Disponível em todo o Brasil
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tight hero-title-container overflow-visible">
                        <span className="inline-block no-clip hero-title px-4">O TERMÔMETRO</span> <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 inline-block no-clip hero-title px-4">
                            DO SEU ROLÊ
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto md:mx-0 leading-relaxed">
                        Descubra em tempo real onde a festa está acontecendo. Veja a vibe, lotação e preços antes mesmo de sair de casa.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                        <button
                            onClick={onEnter}
                            className="group relative px-8 py-4 bg-white text-black font-black italic tracking-wider rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative flex items-center gap-2">
                                COMEÇAR AGORA <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 font-medium transition-all"
                        >
                            Saber mais
                        </button>
                    </div>



                    {/* App Store Buttons */}
                    {Capacitor.getPlatform() === 'web' && (
                        <div className="pt-6 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                            <button disabled className="group relative px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all opacity-70 cursor-not-allowed">
                                <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm11.516 11.516l3.481 3.481L5.91 22.56a1.002 1.002 0 0 1-1.354-.347l10.569-8.883zm3.483-3.483l-3.482 3.482-10.57-8.882a1.002 1.002 0 0 1 1.354-.347l12.698 5.747zM15.42 12l4.803 4.803c.567.567.893.427.72-.207l-4.22-11.595c-.173-.634-.5-1.1-1.303.8z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 leading-tight">Disponível em breve no</p>
                                    <p className="text-sm font-black italic text-white leading-tight">Google Play</p>
                                </div>
                                <div className="absolute -top-3 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-black italic px-2 py-0.5 rounded-full shadow-lg border border-[#0f0518] animate-pulse">
                                    EM BREVE
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Social Proof */}
                    <div className="pt-8 flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f0518] bg-gray-800 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${10 + i}`} className="w-full h-full object-cover" alt="User" />
                                </div>
                            ))}
                        </div>
                        <p>Junte-se a milhares de festeiros</p>
                    </div>
                </div>

                {/* Hero Visual/Mockup */}
                <div className="flex-1 relative w-full max-w-[400px] md:max-w-none perspective-1000 group">
                    <div className="relative z-10 transform transition-transform duration-700 group-hover:rotate-y-[-5deg] group-hover:rotate-x-[5deg]">
                        {/* Device Frame */}
                        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#1a0b2e] relative">
                                {/* Mockup Content - Improved Map */}
                                <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/img/osm-intl,13,-23.5505,-46.6333,400x800.png')] opacity-40 mix-blend-screen bg-cover bg-center"></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-transparent to-[#1a0b2e]"></div>

                                {/* Floating Elements Mockup */}
                                <div className="absolute top-12 left-4 right-4 flex gap-2">
                                    <div className="h-10 bg-white/10 backdrop-blur-md rounded-full flex-1 flex items-center px-4">
                                        <Search className="w-4 h-4 text-white/50 mr-2" />
                                        <div className="h-2 w-20 bg-white/20 rounded-full"></div>
                                    </div>
                                </div>

                                {/* Pins */}
                                <div className="absolute top-[40%] left-[60%] animate-bounce duration-[2000ms]">
                                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(168,85,247,0.6)] border-4 border-[#1a0b2e]">🔥</div>
                                </div>
                                <div className="absolute top-[30%] left-[30%] animate-bounce duration-[2500ms] delay-300">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl shadow-[0_0_20px_rgba(37,99,235,0.6)] border-4 border-[#1a0b2e]">🍸</div>
                                </div>

                                {/* Bottom Sheet */}
                                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#1e1b2e] rounded-t-3xl border-t border-white/10 p-4 space-y-3">
                                    <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-2"></div>
                                    <div className="h-4 w-3/4 bg-white/10 rounded-full"></div>
                                    <div className="h-4 w-1/2 bg-white/10 rounded-full"></div>
                                    <div className="flex gap-2 mt-4">
                                        <div className="h-20 w-32 bg-white/5 rounded-xl border border-white/5"></div>
                                        <div className="h-20 w-32 bg-white/5 rounded-xl border border-white/5"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Glows around phone */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[650px] bg-purple-500/20 blur-[100px] -z-10 rounded-full"></div>
                </div>

            </main>

            {/* Feature Grid */}
            <section id="features" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black italic mb-4">MUITO MAIS QUE <br /><span className="text-purple-400">UM MAPA</span></h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={<MapPin className="text-cyan-400" size={32} />}
                        title="Encontre o Rolê"
                        description="Visualize em tempo real os locais mais quentes da cidade. Saiba onde ir sem perder tempo."
                    />
                    <FeatureCard
                        icon={<Sparkles className="text-purple-400" size={32} />}
                        title="Sinta a Vibe"
                        description="Veja fotos, avaliações e nível de lotação atualizados por quem já está lá."
                    />
                    <FeatureCard
                        icon={<Users className="text-pink-400" size={32} />}
                        title="Conecte-se"
                        description="Faça check-in, encontre amigos e veja quem mais confirmou presença no evento."
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 text-center relative z-10 border-t border-white/5 bg-black/20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        <div className="flex items-center gap-2">
                            <img src="/og-image.png" className="w-8 h-8 object-contain" alt="Dirole Logo" />
                            <span className="text-xl font-black italic tracking-tighter no-clip">DIROLE</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
                            <button onClick={() => setModalContent({
                                title: 'Sobre o Dirole',
                                text: 'O Dirole é o termômetro social definitivo. Criado para que você nunca mais chegue em um lugar e se arrependa da lotação ou da vibe.\nNossa missão é inteligência social em tempo real para transformar suas noites.\nDesenvolvido pela OUTFY com o máximo padrão de design e performance.'
                            })} className="hover:text-white transition-colors">Sobre</button>

                            <button onClick={() => setModalContent({
                                title: 'Termos de Uso',
                                text: 'Ao utilizar o Dirole, você concorda em compartilhar informações verídicas sobre os locais.\nO uso indevido da plataforma para spam ou informações falsas resultará no banimento da conta.\nTodos os dados são de propriedade da OUTFY.'
                            })} className="hover:text-white transition-colors">Termos</button>

                            <button onClick={() => setModalContent({
                                title: 'Privacidade',
                                text: 'Sua privacidade é nossa prioridade. Coletamos sua localização apenas enquanto você usa o app para mostrar os melhores rolês ao seu redor.\nSeus dados não são vendidos para terceiros.\nSegurança por OUTFY.'
                            })} className="hover:text-white transition-colors">Privacidade</button>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                        <p className="text-gray-500 text-sm">
                            &copy; {new Date().getFullYear()} Dirole App. Todos os direitos reservados.
                        </p>
                        <p className="text-xs font-bold text-gray-600 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                            Uma criação <span className="text-white">OUTFY</span>
                        </p>
                    </div>
                </div>
            </footer>

        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-y-1 group">
        <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-2xl font-bold italic mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
);

export default LandingPage;
