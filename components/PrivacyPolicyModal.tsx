
import React from 'react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[701] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onClose}></div>
      <div className="bg-[#0f0518] w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden relative isolate">

        {/* Grabber Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

        {/* HEADER */}
        <div className="p-8 pt-10 pb-6 relative z-10 flex justify-between items-start bg-white/[0.02]">
          <div>
            <h2 className="text-2xl font-black text-white leading-tight tracking-tight uppercase italic flex items-center gap-3">
              <i className="fas fa-shield-alt text-dirole-primary"></i>
              Privacidade
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                ÚLTIMA ATUALIZAÇÃO: 25 DE NOVEMBRO DE 2025
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 relative z-10 custom-scrollbar scroll-smooth">
          <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <p className="text-sm text-slate-400 font-medium leading-relaxed uppercase tracking-tight">
              BEM-VINDO AO <strong className="text-white">DIROLE</strong>. NÓS RESPEITAMOS SUA PRIVACIDADE E ESTAMOS COMPROMETIDOS EM PROTEGER SEUS DADOS PESSOAIS. ESTA POLÍTICA DESCREVE COMO COLETAMOS, USAMOS E COMPARTILHAMOS SUAS INFORMAÇÕES.
            </p>
          </section>

          <section className="space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h3 className="text-[10px] font-black text-dirole-primary uppercase tracking-[0.3em]">1. Informações que Coletamos</h3>
            <div className="space-y-3">
              {[
                { label: 'Geolocalização (GPS)', text: 'Coletamos sua localização precisa apenas quando o aplicativo está em uso para exibir locais próximos e permitir check-ins.' },
                { label: 'Câmera e Fotos', text: 'Acesso necessário para escanear QR Codes (Dirole ID) ou enviar fotos para a galeria dos locais.' },
                { label: 'Dados de Cadastro', text: 'Nome, e-mail, idade e foto de perfil para criar sua identidade única na comunidade.' },
                { label: 'Conteúdo Gerado', text: 'Avaliações, comentários e denúncias enviadas são armazenados para funcionamento da rede.' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner group hover:bg-white/[0.04] transition-all">
                  <p className="text-[10px] font-black text-white uppercase tracking-wider mb-2">{item.label}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h3 className="text-[10px] font-black text-dirole-primary uppercase tracking-[0.3em]">2. Uso das Informações</h3>
            <div className="p-6 rounded-[1.5rem] bg-indigo-500/[0.03] border border-indigo-500/10 space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                UTILIZAMOS SEUS DADOS PARA FORNECER O SERVIÇO DE "TERMÔMETRO SOCIAL", FACILITAR INTERAÇÕES (AMIZADES, CONVITES) E GARANTIR A SEGURANÇA DA COMUNIDADE.
              </p>
            </div>
          </section>

          <section className="space-y-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <h3 className="text-[10px] font-black text-dirole-primary uppercase tracking-[0.3em]">3. Seus Direitos (LGPD - LEI 13.709/18)</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Acesso e Correção', text: 'Você pode solicitar uma cópia dos seus dados ou corrigir informações incompletas.' },
                { label: 'Eliminação e Bloqueio', text: 'Direito de excluir seus dados ou suspender o tratamento em casos específicos.' },
                { label: 'Portabilidade', text: 'Solicitar a transferência dos dados para outro fornecedor de serviço.' },
                { label: 'Revogação de Consentimento', text: 'Você pode retirar sua autorização de uso de dados a qualquer momento.' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/10">
                  <p className="text-[10px] font-black text-white uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="p-6 rounded-[1.5rem] bg-red-500/5 border border-red-500/10 space-y-4 mt-4">
              <div className="flex items-center gap-3 text-red-500">
                <i className="fas fa-trash-alt"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Exclusão Permanente</p>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">
                A EXCLUSÃO DA CONTA EM <span className="text-white">PERFIL &gt; DADOS & PRIVACIDADE</span> ELIMINA DEFINITIVAMENTE SEUS DADOS DOS NOSSOS SERVIDORES EM ATÉ 30 DIAS (PRAZO LGPD).
              </p>
            </div>
          </section>

          <section className="space-y-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <h3 className="text-[10px] font-black text-dirole-primary uppercase tracking-[0.3em]">4. Contato</h3>
            <div className="p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">DÚVIDAS OU SUPORTE?</p>
              <a href="mailto:outfybrasil@gmail.com" className="px-6 py-3 rounded-xl bg-white/5 text-dirole-primary font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">
                outfybrasil@gmail.com
              </a>
            </div>
          </section>
        </div>

        <div className="p-8 pb-10 border-t border-white/5 bg-white/[0.02] relative z-20">
          <button
            onClick={onClose}
            className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] shadow-2xl active:scale-95 transition-all text-xs uppercase tracking-[0.2em] hover:bg-slate-200"
          >
            LI E CONCORDO
          </button>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.3);
            border-radius: 10px;
          }
        `}</style>
      </div>
    </div>
  );
};
