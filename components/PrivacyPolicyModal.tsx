
import React from 'react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-dirole-bg w-full max-w-2xl rounded-3xl border border-white/10 p-8 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <i className="fas fa-shield-alt text-dirole-primary"></i>
          Política de Privacidade
        </h2>
        <p className="text-xs text-slate-500 mb-6 font-mono">Última atualização: 25 de Novembro de 2025</p>

        <div className="flex-1 overflow-y-auto pr-4 text-slate-300 space-y-6 text-sm leading-relaxed custom-scrollbar">
          <section>
            <p>
              Bem-vindo ao <strong>Dirole</strong>. Nós respeitamos sua privacidade e estamos comprometidos em proteger seus dados pessoais. Esta política descreve como coletamos, usamos e compartilhamos suas informações.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-2 text-dirole-secondary">1. Informações que Coletamos</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Geolocalização (GPS):</strong> Coletamos sua localização precisa (latitude/longitude) apenas quando o aplicativo está em uso (primeiro plano) para exibir locais próximos, calcular distâncias e permitir check-ins. Não rastreamos histórico em segundo plano.
              </li>
              <li>
                <strong>Câmera e Fotos:</strong> Solicitamos acesso à câmera para funcionalidades específicas, como escanear QR Codes (Dirole ID) ou enviar fotos para a galeria dos locais.
              </li>
              <li>
                <strong>Dados de Cadastro:</strong> Coletamos nome, e-mail, idade, gênero e foto de perfil para criar sua identidade única na comunidade.
              </li>
              <li>
                <strong>Conteúdo Gerado (UGC):</strong> Avaliações, comentários e denúncias que você envia são armazenados em nossos servidores e exibidos publicamente (exceto denúncias).
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-2 text-dirole-secondary">2. Como Usamos Suas Informações</h3>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Fornecer o serviço de "Termômetro Social" (lotação e vibe em tempo real).</li>
              <li>Facilitar interações sociais (amizades, convites e ranking).</li>
              <li>Garantir a segurança, combater spam e moderar conteúdo ofensivo.</li>
              <li>Enviar notificações importantes sobre sua conta ou segurança.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-2 text-dirole-secondary">3. Compartilhamento e Visibilidade</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Perfil Público:</strong> Seu nome, foto, nível e comentários são visíveis para outros usuários do aplicativo.</li>
              <li><strong>Não Vendemos Dados:</strong> Não vendemos suas informações pessoais para terceiros.</li>
              <li><strong>Serviços Terceiros:</strong> Utilizamos serviços confiáveis (como Google Maps para mapas e Supabase para banco de dados) que processam dados estritamente para a operação do app.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-2 text-dirole-secondary">4. Exclusão de Dados (Seus Direitos)</h3>
            <p className="mb-2">
              Você tem total controle sobre seus dados. De acordo com as diretrizes da LGPD e Google Play Store:
            </p>
            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
              <p className="text-white font-bold text-xs uppercase mb-1">Como Excluir sua Conta:</p>
              <p>
                Você pode excluir sua conta e todos os dados associados permanentemente a qualquer momento dentro do aplicativo. 
                Vá em <strong>Perfil &gt; Excluir Minha Conta</strong>. Esta ação é imediata e irreversível.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-2 text-dirole-secondary">5. Conteúdo Impróprio e Bloqueio</h3>
            <p>O Dirole mantém tolerância zero contra assédio ou conteúdo ofensivo.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Denúncia:</strong> Utilize o botão de bandeira 🏳️ para reportar conteúdo inadequado.</li>
              <li><strong>Bloqueio:</strong> Você pode bloquear usuários para deixar de ver o conteúdo deles imediatamente.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-2 text-dirole-secondary">6. Contato</h3>
            <p>
              Para dúvidas sobre privacidade, solicitações de dados ou suporte, entre em contato conosco:
              <br />
              <a href="mailto:outfybrasil@gmail.com" className="text-dirole-primary hover:underline font-bold mt-1 inline-block">outfybrasil@gmail.com</a>
            </p>
          </section>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            Li e Concordo
          </button>
        </div>
      </div>
    </div>
  );
};
