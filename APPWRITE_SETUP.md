# Guia de Configuração - Appwrite Cloud 🚀

Para que a migração funcione, você precisa configurar o seu projeto no Appwrite Cloud. Siga estes passos:

### 1. Criar Conta e Projeto
1. Acesse [appwrite.io](https://appwrite.io/) e crie uma conta gratuita.
2. Crie um novo projeto chamado **"Dirole"**.
3. No painel do projeto, adicione uma **Web App**.
   * No campo "Hostname", coloque `localhost` (para testes) e o domínio do seu site (ex: `dirole.app`).

### 1. Configuração Automática (RECOMENDADO) ⚡
Para facilitar, criei um script que configura o banco de dados inteiro para você em segundos.

1.  **Crie uma API Key**: No Console do Appwrite, vá em **Overview** > **Settings** > **API Keys**.
    *   Crie uma chave chamada `AdminInit`.
    *   Dê os escopos de **Database**: `databases.write`, `tables.write`, `columns.write`, `indexes.write` e `rows.write`.
    *   Dê os escopos de **Storage**: `buckets.write` e `files.write`.
2.  **Instale a dependência**:
    ```bash
    npm install node-appwrite --save-dev
    ```
3.  **Rode o script**:
    *   Abra o arquivo `scripts/appwrite_init.js`.
    *   Cole sua `apiKey` e seu `projectId` na seção de configuração no topo do arquivo.
    *   Execute: `node scripts/appwrite_init.js`.

---

### 2. Configurar Autenticação Google (Essencial) 🔐
O script acima cria o banco de dados, mas **não configura o login social**. Para o Google funcionar:

1.  **No Appwrite Console**:
    *   Vá em **Auth** > **Settings**.
    *   Ative o provedor **Google**.
    *   Copie a **URI de Callback** fornecida (ex: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/...`).
2.  **No Google Cloud Console**:
    *   Crie credenciais OAuth 2.0.
    *   **Origens Autorizadas**: Adicione `http://localhost:5173` (ou sua porta local) e seu domínio de produção.
    *   **URIs de Redirecionamento**: Cole a URI de Callback do Appwrite.
    *   Copie o **Client ID** e **Client Secret** e cole no Appwrite.

### 2. Configuração via CLI (Opcional) 🖥️
Se você tem o Appwrite CLI instalado:
```bash
appwrite login
appwrite deploy
```
(Isso usará as definições do arquivo `appwrite.json`)

---

### 4. Estrutura das Coleções (Referência)
Abaixo estão os detalhes caso precise verificar algo manualmente:

#### Coleção: `profiles`
*   **Permissions**: Vá em Settings da coleção e configure:
    *   **Role: Users** -> `Create`
    *   **Role: Any** -> `Read` (para que outros vejam seu perfil)
    *   **Document Security**: Ative a "Document Security" (nas configurações da coleção). Isso garantirá que somente o dono do documento possa editá-lo. (O script de init já tenta configurar isso).
*   **Attributes**:
    *   `name` (string)
    *   `nickname` (string)
    *   `avatar` (string)
    *   `points` (integer, default 0)
    *   `xp` (integer, default 0)
    *   `level` (integer, default 1)
    *   `email` (string)

#### Coleção: `reviews`
*   **Permissions**: 
    *   **Role: Users** -> `Create`
    *   **Role: Any** -> `Read`
*   **Attributes**:
    *   `locationId` (string)
    *   `userId` (string)
    *   `userName` (string)
    *   `userAvatar` (string)
    *   `comment` (string, size 500)
    *   `price` (integer)
    *   `crowd` (integer)
    *   `vibe` (integer)

#### Coleção: `locations`
*   **Permissions**: Adicione "Any" com `Read`. (Admin via Console para Criar).
*   **Attributes**:
    *   `name` (string)
    *   `address` (string)
    *   `type` (string)
    *   `latitude` (float)
    *   `longitude` (float)
    *   `imageUrl` (string)

### 5. Criar Bucket de Armazenamento
Vá em **Storage** > **Create Bucket** (ID: `avatars`).
*   **Permissions**: 
    *   **Role: Users** -> `Create`
    *   **Role: Any** -> `Read`
    *   **File Security**: Ative a "File Security" para que apenas quem enviou possa deletar/editar sua foto.

### 6. Índices de Segurança (RECOMENDADO) 🛡️
Para evitar duplicidade e garantir performance:
1.  **Coleção `profiles`**: Crie um índice para o atributo `nickname`.
    *   **Type**: `Unique`
    *   **Key**: `nickname`
2.  **Coleção `profiles`**: Crie um índice para `userId` (Unique).
3.  **Coleção `friendships`**: Crie um índice (Key) para `requester_id` e outro para `receiver_id`.

---
**Quando terminar, me envie os IDs do seu Projeto e do seu Banco de Dados!**
