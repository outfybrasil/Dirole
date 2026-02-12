# 🚀 Guia de Publicação Oficial na Google Play Store

Este guia detalha o processo final para publicar a versão oficial (Produção) do **Dirole**. Para a Google Play, o formato obrigatório agora é o **.aab** (Android App Bundle).

---

## 🛠️ 1. Geração da Versão Final (.aab)

O Android App Bundle (.aab) é o formato otimizado que a Google usa para gerar APKs específicos para cada dispositivo, reduzindo o tamanho do download.

### Comandos para Gerar:
1.  **Limpar e Preparar**:
    ```bash
    npm run build
    npx cap sync android
    ```
2.  **Gerar o Bundle de Produção**:
    Navegue até a pasta `android` e execute:
    ```bash
    ./gradlew bundleRelease
    ```
3.  **Localização do Arquivo**:
    O arquivo final estará em:
    `android/app/build/outputs/bundle/release/app-release.aab`

> [!TIP]
> Use este arquivo `.aab` para fazer o upload no Google Play Console.

---

## 🔐 2. Segurança e Assinatura (Keystore)

O app já está configurado para usar a sua chave oficial automaticamente em todas as builds (Debug e Release).

*   **Keystore**: `android/upload-keystore.jks`
*   **Aliás**: `my-alias`
*   **Propriedades**: Gerenciadas em `android/keystore.properties`

> [!CAUTION]
> **Backup Obrigatório**: Guarde uma cópia segura do arquivo `upload-keystore.jks` e das senhas fora do computador. Se perder essa chave, você nunca mais conseguirá atualizar o app na loja.

---

## 📋 3. Fluxo no Google Play Console

### Passo 1: Configurar a Ficha da Loja
1.  Acesse o [Google Play Console](https://play.google.com/console/).
2.  Preencha: Descrição, Ícones (512x512), Imagem de Destaque (1024x500) e Capturas de Tela.

### Passo 2: Criar Lançamento
1.  Vá em **Produção** > **Lançamentos** > **Criar novo lançamento**.
2.  Arraste o arquivo `app-release.aab` para a área de upload.
3.  Defina as notas da versão (Ex: "Lançamento inicial do Dirole").

### Passo 3: Revisar e Lançar
1.  Clique em **Revisar lançamento**.
2.  Verifique se há avisos (Warnings) sobre permissões de GPS (Veja item 4).
3.  Clique em **Iniciar lançamento para Produção**.

---

## 📍 4. Requisitos de GPS e Permissões

Como o Dirole é um app baseado em localização:
*   Você deve preencher a **Declaração de Localização** no menu "Conteúdo do App".
*   Justifique que a localização é necessária para encontrar rolês próximos em tempo real.
*   O Google exige um link para a sua **Política de Privacidade** (certifique-se de que ela menciona o uso de GPS).

---

## 📝 checklist de Versão
- [ ] O `versionCode` no `build.gradle` deve subir a cada novo upload (ex: 1 -> 2).
- [ ] O `versionName` pode ser algo como `1.0.0`.
- [ ] O SHA-1 da chave `upload-keystore.jks` deve estar no Google Cloud Console.

---
*Dirole - Documentação de Produção v1.0*
