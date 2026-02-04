# 📱 Guia Completo: Build e Publicação do IPA Dirole (iOS)

## ⚠️ Requisitos Essenciais

### 1. Hardware e Software
- **macOS** (obrigatório para build iOS)
- **Xcode 14+** (Download na App Store)
- **Conta Apple Developer** ($99/ano para publicar na App Store)
- **Node.js e npm** instalados

### 2. Verificar Instalação
```bash
npx cap doctor
xcodebuild -version
```

## 📋 Preparação do Projeto

### 1. Build da Aplicação Web
```bash
npm run build
```

### 2. Sincronizar com Capacitor
```bash
npx cap sync ios
```

### 3. Abrir no Xcode
```bash
npx cap open ios
```

## 🔧 Configuração no Xcode

### 1. Configurações Básicas

#### A. Bundle Identifier
1. Selecione o projeto **App** no navegador
2. Em **General** \> **Identity**:
   - **Bundle Identifier**: `com.dirole.app`
   - **Version**: `1.0.0`
   - **Build**: `1`

#### B. Signing & Capabilities
1. Vá em **Signing & Capabilities**
2. Marque **Automatically manage signing**
3. Selecione seu **Team** (conta Apple Developer)
4. Xcode criará automaticamente os certificados

### 2. Adicionar Capabilities

#### A. NFC Tag Reading
1. Clique em **+ Capability**
2. Adicione **Near Field Communication Tag Reading**

#### B. Camera e Location
Já configuradas pelo Capacitor, mas verifique:
- **Camera**
- **Location When In Use**

### 3. Configurar Info.plist

Adicione as seguintes permissões (já devem estar presentes):

```xml
<key>NSCameraUsageDescription</key>
<string>O Dirole precisa acessar a câmera para tirar fotos dos rolês</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>O Dirole usa sua localização para mostrar rolês próximos</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>O Dirole usa sua localização para mostrar rolês próximos</string>

<key>NFCReaderUsageDescription</key>
<string>O Dirole usa NFC para compartilhar perfis por aproximação</string>

<key>com.apple.developer.nfc.readersession.formats</key>
<array>
    <string>NDEF</string>
    <string>TAG</string>
</array>
```

### 4. Configurar Ícones e Splash Screen

#### A. Ícone do App (1024x1024 PNG)
1. Vá em **Assets.xcassets** \> **AppIcon**
2. Arraste seu ícone 1024x1024 para o slot **App Store**
3. Xcode gerará automaticamente todos os tamanhos

#### B. Splash Screen
1. Vá em **Assets.xcassets** \> **Splash**
2. Configure a cor de fundo: `#0f0518` (roxo escuro)

## 🏗️ Build do IPA

### Opção 1: Build de Desenvolvimento (Para Testar no Seu iPhone)

#### A. Conectar iPhone via USB
1. Conecte seu iPhone ao Mac
2. Desbloqueie o iPhone
3. Confie no computador se solicitado

#### B. Selecionar Device
1. No Xcode, clique no menu de dispositivos (topo)
2. Selecione seu iPhone físico

#### C. Build e Run
1. Clique no botão **Play** (▶️) ou `Cmd + R`
2. O app será instalado no seu iPhone
3. **Primeira vez**: Vá em **Ajustes** \> **Geral** \> **VPN e Gerenciamento de Dispositivos**
4. Confie no desenvolvedor

### Opção 2: Build de Produção (Para App Store)

#### A. Configurar Archive

1. No Xcode, selecione **Any iOS Device (arm64)** como destino
2. Vá em **Product** \> **Archive**
3. Aguarde o build completar (pode levar alguns minutos)

#### B. Export do IPA

1. Quando o Archive completar, a janela **Organizer** abrirá
2. Selecione o archive mais recente
3. Clique em **Distribute App**
4. Escolha o método de distribuição:

##### Para Testes (TestFlight/Ad Hoc):
- Selecione **Ad Hoc**
- Clique em **Next**
- Mantenha as opções padrão
- Clique em **Export**
- Escolha onde salvar o `.ipa`

##### Para App Store:
- Selecione **App Store Connect**
- Clique em **Next**
- Selecione **Upload**
- Clique em **Next** e **Upload**

## 📤 Publicação na App Store

### 1. Criar App no App Store Connect

1. Acesse: https://appstoreconnect.apple.com
2. Vá em **My Apps** \> **+** \> **New App**
3. Preencha:
   - **Platform**: iOS
   - **Name**: Dirole
   - **Primary Language**: Portuguese (Brazil)
   - **Bundle ID**: com.dirole.app
   - **SKU**: dirole-app-001

### 2. Preparar Assets

#### Ícone (1024x1024 PNG)
- Sem transparência
- Sem cantos arredondados (iOS faz isso automaticamente)

#### Screenshots (Obrigatório)
- **iPhone 6.7"** (1290x2796): Mínimo 3 screenshots
- **iPhone 6.5"** (1242x2688): Mínimo 3 screenshots
- **iPhone 5.5"** (1242x2208): Opcional

**Dica**: Use um iPhone físico ou simulador para capturar telas reais do app.

### 3. Preencher Informações

#### Descrição Curta (30 caracteres)
```
Descubra os melhores rolês! 🎉
```

#### Descrição Completa (4000 caracteres)
```
🎯 Dirole - Seu Guia Definitivo de Rolês

Cansado de não saber onde ir? O Dirole te mostra os melhores bares, baladas, restaurantes e eventos perto de você, com avaliações em tempo real da galera que está lá AGORA!

🔥 PRINCIPAIS RECURSOS:

📍 Mapa Interativo
• Veja todos os rolês próximos em tempo real
• Marcadores com intensidade (lotação + vibe)
• Filtros por tipo, preço e distância

⭐ Avaliações Rápidas
• Check-in instantâneo com 3 toques
• Avalie preço, lotação, vibe e público
• Veja o que a galera está achando AGORA

📸 Dirole Stories
• Compartilhe fotos dos rolês
• Stories expiram em 6 horas
• Veja o clima do lugar antes de ir

🏆 Gamificação
• Ganhe pontos e badges
• Suba de nível explorando novos lugares
• Conquiste títulos exclusivos

👥 Social
• Adicione amigos
• Convide a galera para rolês
• Veja onde seus amigos estão

🎉 Eventos
• Descubra festas e eventos próximos
• Agenda completa de cada local
• Nunca perca uma boa festa

💬 Comunidade
• Reviews detalhados
• Galeria de fotos dos locais
• Interaja com outros usuários

🔒 Privacidade
• Controle quem vê sua localização
• Modo invisível disponível
• Seus dados são seguros

Baixe agora e descubra o melhor da noite! 🌙
```

#### Keywords (100 caracteres)
```
rolê,balada,bar,festa,eventos,social,amigos,noite,diversão,mapa
```

#### Categoria
- **Primary**: Lifestyle
- **Secondary**: Social Networking

#### Age Rating
- Preencha o questionário
- Dirole: Provavelmente **17+** (álcool, vida noturna)

### 4. Política de Privacidade
**Obrigatório!** Crie e hospede em:
- GitHub Pages
- Seu próprio domínio

Exemplo: `https://dirole.com/privacy-policy`

### 5. Upload do Build

1. No Xcode, faça o Archive (conforme Opção 2B acima)
2. Upload para App Store Connect
3. Aguarde processamento (15-30 minutos)
4. No App Store Connect, vá em **TestFlight** ou **App Store**
5. Selecione o build que acabou de fazer upload

### 6. Enviar para Revisão

1. Preencha todas as informações obrigatórias
2. Adicione screenshots
3. Adicione descrições
4. Clique em **Submit for Review**
5. Aguarde aprovação (1-7 dias)

## 🧪 Testes com TestFlight

### 1. Configurar TestFlight

1. No App Store Connect, vá em **TestFlight**
2. Selecione seu app
3. Adicione testadores internos (até 100)
4. Adicione testadores externos (até 10.000)

### 2. Convidar Testadores

1. Clique em **Internal Testing** ou **External Testing**
2. Clique em **+** para adicionar testadores
3. Digite os emails dos testadores
4. Eles receberão um convite por email

### 3. Instalar no iPhone

1. Testador baixa o app **TestFlight** na App Store
2. Abre o email de convite
3. Clica em **View in TestFlight**
4. Instala o app Dirole

## 🔄 Atualizações Futuras

### 1. Incrementar Versão

Edite `package.json`:
```json
{
  "version": "1.0.1"
}
```

No Xcode:
1. Selecione o projeto **App**
2. Em **General**:
   - **Version**: `1.0.1`
   - **Build**: `2` (sempre incrementar)

### 2. Build e Upload

```bash
npm run build
npx cap sync ios
npx cap open ios
```

No Xcode:
1. **Product** \> **Archive**
2. **Distribute App** \> **App Store Connect** \> **Upload**

## 🚨 Troubleshooting

### Erro: "No signing certificate found"

**Solução**:
1. Vá em **Xcode** \> **Preferences** \> **Accounts**
2. Adicione sua conta Apple Developer
3. Clique em **Manage Certificates**
4. Clique em **+** \> **Apple Development** ou **Apple Distribution**

### Erro: "Provisioning profile doesn't match"

**Solução**:
1. Em **Signing & Capabilities**
2. Desmarque **Automatically manage signing**
3. Marque novamente
4. Xcode recriará o profile

### Erro: "Build failed" no Archive

**Solução**:
```bash
# Limpar build
cd ios/App
xcodebuild clean

# Ou no Xcode: Product > Clean Build Folder (Shift + Cmd + K)
```

### Erro: NFC não funciona

**Solução**:
1. Verifique se adicionou **NFC Tag Reading** em Capabilities
2. Verifique se adicionou `NFCReaderUsageDescription` no Info.plist
3. Verifique se adicionou os formatos NDEF e TAG

### App não instala no iPhone físico

**Solução**:
1. Vá em **Ajustes** \> **Geral** \> **VPN e Gerenciamento de Dispositivos**
2. Confie no desenvolvedor
3. Tente instalar novamente

## 📊 Comparação: iOS vs Android

| Aspecto | iOS | Android |
|---------|-----|---------|
| **Hardware Necessário** | macOS obrigatório | Windows/Mac/Linux |
| **IDE** | Xcode (grátis) | Android Studio (grátis) |
| **Conta Desenvolvedor** | $99/ano | $25 única vez |
| **Tempo de Revisão** | 1-7 dias | 1-3 dias |
| **Formato de Build** | .ipa | .apk / .aab |
| **Distribuição Teste** | TestFlight | APK direto |

## ✅ Checklist Final

- [ ] macOS e Xcode instalados
- [ ] Conta Apple Developer ativa ($99/ano)
- [ ] Build web sem erros (`npm run build`)
- [ ] Capacitor sync (`npx cap sync ios`)
- [ ] Projeto aberto no Xcode
- [ ] Bundle ID configurado: `com.dirole.app`
- [ ] Signing configurado (Team selecionado)
- [ ] NFC Capability adicionada
- [ ] Permissões no Info.plist configuradas
- [ ] Ícone 1024x1024 adicionado
- [ ] Screenshots capturados (mínimo 3)
- [ ] Descrições escritas
- [ ] Política de privacidade publicada
- [ ] App criado no App Store Connect
- [ ] Archive gerado com sucesso
- [ ] IPA exportado ou upload feito
- [ ] Testado via TestFlight (opcional)
- [ ] Enviado para revisão

## 🎉 Próximos Passos

Após aprovação:
1. Seu app estará na App Store! 🎊
2. Monitore reviews e feedback
3. Planeje atualizações baseadas no feedback
4. Mantenha o app atualizado regularmente

## 📞 Recursos Úteis

- **Apple Developer**: https://developer.apple.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **Capacitor iOS Docs**: https://capacitorjs.com/docs/ios
- **Xcode Download**: https://apps.apple.com/app/xcode/id497799835

---

## ⚠️ IMPORTANTE: Limitação do Windows

**Você está no Windows**, então **não conseguirá gerar o .ipa diretamente** neste computador. 

### Opções:

1. **Usar um Mac** (emprestado, alugado, ou de um amigo)
2. **Serviços Cloud** (Mac na nuvem):
   - **MacStadium** (~$79/mês)
   - **MacinCloud** (~$30/mês)
   - **AWS EC2 Mac** (~$1.08/hora)
3. **Hackintosh** (não recomendado, viola ToS da Apple)
4. **Contratar desenvolvedor iOS** para fazer o build

### Alternativa: Testar como PWA no iPhone

Enquanto não tem acesso a um Mac:
1. Faça deploy do app web (Netlify, Vercel, etc.)
2. Acesse no Safari do iPhone
3. Toque em **Compartilhar** \> **Adicionar à Tela de Início**
4. O app funcionará como PWA (sem acesso total a recursos nativos)

---

**Boa sorte com seu app! 🚀**
