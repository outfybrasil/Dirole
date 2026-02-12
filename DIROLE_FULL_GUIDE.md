# 📖 Guia Completo de Criação: Dirole

Este documento detalha todas as etapas de desenvolvimento do app **Dirole**, desde a concepção da infraestrutura até a publicação mobile.

---

## 🛠️ 1. Visão Geral e Stack Tecnológica

O **Dirole** é um "Social Thermometer" projetado para fornecer status em tempo real de locais (bares, baladas, eventos). 

### Pilares Técnicos:
*   **Frontend**: React + TypeScript + Vite (Performance e Tipagem).
*   **Mobile**: Capacitor (Ponte nativa para iOS/Android).
*   **Backend**: Appwrite Cloud (Database, Auth, Storage, Functions).
*   **Mapas**: Leaflet (Leveza e customização).
*   **Design**: Glassmorphism (efeito vidro), Dark Mode, Tipografia moderna (Inter/Outfit).

---

## 🗄️ 2. Arquitetura de Banco de Dados (Appwrite)

A modelagem foi dividida em coleções estratégicas para suportar geolocalização e gamificação.

### Banco: `dirole_main` (ID: `dirole_main`)

#### A. Coleção: `profiles` (Perfis de Usuário)
Armazena dados estendidos dos usuários que o Auth padrão não comporta.
*   **Atributos**:
    *   `userId` (string): Relacionamento 1:1 com o Auth.
    *   `name` / `nickname` (string): Identificação social.
    *   `points` / `xp` / `level` (int): Sistema de gamificação.
    *   `avatar` (string): Emoji ou URL da foto.
    *   `favorites` (json/string): Lojas/Locais favoritados.
*   **Índices**: `userId` (Unique), `nickname` (Unique).

#### B. Coleção: `locations` (Locais/Roles)
O coração do app. Contém os pontos no mapa.
*   **Atributos**:
    *   `name` / `address` / `type` (string).
    *   `lat` / `lng` (float): Coordenadas para o Leaflet.
    *   `verified` (boolean): Se o local foi validado pela moderação.
    *   `owner_id` (string): Para donos de estabelecimentos reivindicarem o local.
    *   `stats` (json/string): Médias calculadas de Vibe, Preço e Lotação.

#### C. Coleção: `reviews` (Avaliações/Check-ins)
Dados voláteis que expiram ou alimentam o gráfico de temperatura.
*   **Atributos**:
    *   `locationId` / `userId` (string).
    *   `vibe` (1-5): Qualidade do rolê.
    *   `price` (1-3): Preço ($, $$, $$$).
    *   `crowd` (1-5): Lotação.
    *   `comment` (string).

#### D. Coleção: `friendships` & `invites`
Parte social para conexões em tempo real.
*   **Status**: `pending`, `accepted`, `declined`.

---

## 🚀 3. Etapas de Desenvolvimento (Passo a Passo)

### Passo 1: Setup Inicial
1.  Setup do repositório com **Vite**.
2.  Configuração do **Tailwind CSS** com cores personalizadas (Purples/Violets).
3.  Instalação do **Leaflet** para renderização do mapa tático.

### Passo 2: Integração de Backend (Appwrite)
1.  Configuração do `appwriteClient.ts` para conectar ao Cloud.
2.  Criação de Scripts de Inicialização (`scripts/appwrite_init.js`) para criar coleções automaticamente via API Key.
3.  Criação do Bucket `avatars` para fotos de perfil.

### Passo 3: Funcionalidades Core (Frontend)
1.  **MapView**: Lógica de "Search in this area" e filtragem por tipo de local.
2.  **AuthFlow**: Sistema de login híbrido (E-mail + Google OAuth).
3.  **Gamification Engine**: Lógica de ganho de XP ao fazer check-in e reportar status.

### Passo 4: Transformação para App Nativo (Android)
1.  Adição do **Capacitor** ao projeto: `npx cap add android`.
2.  Configuração do **Deep Linking**:
    *   Edição do `AndroidManifest.xml` para aceitar o esquema `appwrite-callback-[PROJECT_ID]://`.
    *   Criação do hook `useDeepLinks.ts` para capturar os tokens de sessão vindos do sistema.
3.  **Ajuste de OAuth Nativo**: Migração do fluxo de "Sessions" para "Tokens" para evitar bloqueios de cookies de terceiros em celulares.

---

## 📦 4. Publicação e Manutenção

### Ciclo de Build:
1.  `npm run build`: Gera o bundle Web otimizado.
2.  `npx cap sync`: Sincroniza o código Web com a pasta do Android.
3.  `./gradlew assembleDebug`: Gera o APK para teste.

### Operações de Segurança:
*   Configuração de **SHA-1 Fingerprints** no Google Cloud e Appwrite Platform para autorizar o app a falar com os servidores.
*   Uso de **`localhost`** como plataforma Web autorizada para o Capacitor.

---

## 📈 Futuras Expansões
- PWA em App Store (TWA).
- Notificações Push via OneSignal/Firebase.
- Histórico de Temperatura (Gráfico de lotação por hora).

---
*Documentação gerada em 11 de Fevereiro de 2026 para o projeto Dirole.*
