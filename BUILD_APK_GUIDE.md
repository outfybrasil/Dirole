# 📱 Guia Completo: Build e Publicação do APK Dirole

## Pré-requisitos

### 1. Instalar Android Studio
- Download: https://developer.android.com/studio
- Instale o Android SDK (API 33+)
- Configure as variáveis de ambiente:
  - `ANDROID_HOME`: Caminho do SDK Android
  - `JAVA_HOME`: Caminho do JDK

### 2. Verificar Instalação
```bash
npx cap doctor
```

## Preparação do Projeto

### 1. Atualizar Configurações
Edite `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.dirole.app',
  appName: 'Dirole',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f0518",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  }
};
```

### 2. Build Web
```bash
npm run build
```

### 3. Sincronizar com Capacitor
```bash
npx cap sync android
```

## Build do APK

### Opção 1: APK de Debug (Rápido)
```bash
cd android
./gradlew assembleDebug
```
**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

### Opção 2: APK de Release (Para Publicação)

#### A. Gerar Keystore (Primeira vez)
```bash
keytool -genkey -v -keystore dirole-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias dirole
```
**Guarde a senha em local seguro!**

#### B. Configurar Assinatura
Crie `android/key.properties`:
```properties
storePassword=SUA_SENHA_AQUI
keyPassword=SUA_SENHA_AQUI
keyAlias=dirole
storeFile=../dirole-release-key.jks
```

Edite `android/app/build.gradle`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```
**Verifique as permissões no `AndroidManifest.xml`:**
- `CAMERA` ✅
- `ACCESS_FINE_LOCATION` ✅
- `ACCESS_COARSE_LOCATION` ✅
- `NFC` ✅

#### C. Build Release
```bash
cd android
./gradlew assembleRelease
```
**Output:** `android/app/build/outputs/apk/release/app-release.apk`

## Publicação na Google Play Store

### 1. Criar Conta de Desenvolvedor
- Acesse: https://play.google.com/console
- Taxa única: $25 USD
- Preencha informações da conta

### 2. Criar Novo App
1. Clique em "Criar app"
2. Preencha:
   - Nome: **Dirole**
   - Idioma padrão: **Português (Brasil)**
   - Tipo: **App**
   - Gratuito/Pago: **Gratuito**

### 3. Preparar Assets

#### Ícone do App (512x512 PNG)
- Sem transparência
- Formato: PNG
- Tamanho: 512x512px

#### Screenshots (Mínimo 2 por tipo)
- **Telefone**: 1080x1920px ou 1080x2340px
- **Tablet 7"**: 1200x1920px
- **Tablet 10"**: 1920x1200px

#### Gráfico de Recursos (1024x500 PNG)
- Banner promocional
- Usado na loja

### 4. Configurar Listagem da Loja

**Descrição Curta (80 caracteres):**
```
Descubra os melhores rolês perto de você! 🎉
```

**Descrição Completa (4000 caracteres):**
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

**Categoria:** Estilo de vida
**Tags:** rolê, balada, bar, festa, eventos, social

### 5. Classificação de Conteúdo
- Preencha o questionário
- Dirole: Provavelmente **PEGI 16+** (álcool, vida noturna)

### 6. Upload do APK/AAB

**Recomendado: Android App Bundle (AAB)**
```bash
cd android
./gradlew bundleRelease
```
**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

1. Vá em "Produção" > "Criar nova versão"
2. Upload do AAB
3. Preencha notas da versão
4. Revisar e publicar

### 7. Política de Privacidade
**Obrigatório!** Hospede em:
- GitHub Pages
- Google Sites
- Seu próprio domínio

Exemplo: `https://dirole.com/privacy-policy`

### 8. Revisão e Publicação
- Preencha todos os campos obrigatórios
- Enviar para revisão
- Aguardar aprovação (1-7 dias)

## Atualizações Futuras

### Incrementar Versão
Edite `package.json`:
```json
{
  "version": "1.0.1"
}
```

Edite `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 2  // Incrementar sempre
        versionName "1.0.1"
    }
}
```

### Build e Upload
```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

Upload no Play Console > Nova versão

## Troubleshooting

### Erro: SDK não encontrado
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Erro: Gradle build failed
```bash
cd android
./gradlew clean
./gradlew assembleDebug --stacktrace
```

### Erro: Capacitor sync
```bash
npx cap sync android --force
```

## 📡 Configuração de NFC (iOS)

Para o NFC funcionar no iPhone, você precisa fazer duas coisas no **Xcode**:

1.  **Capabilities:** No seu projeto, vá em *Signing & Capabilities* e clique em *+ Capability*. Adicione **NFC Tag Reading**.
2.  **Info.plist:** Adicione a chave `Privacy - NFC Scan Usage Description` com uma mensagem (ex: "Usado para compartilhar seu perfil com amigos por proximidade").

---

## checklist Final

- [ ] Build web sem erros (`npm run build`)
- [ ] Capacitor sync (`npx cap sync android`)
- [ ] APK/AAB assinado gerado
- [ ] Ícone 512x512 pronto
- [ ] Screenshots preparados
- [ ] Descrições escritas
- [ ] Política de privacidade publicada
- [ ] Classificação de conteúdo preenchida
- [ ] Conta Google Play criada ($25)
- [ ] Upload do APK/AAB
- [ ] Revisão enviada

## 🎉 Boa Sorte!

Após aprovação, seu app estará disponível na Google Play Store!
