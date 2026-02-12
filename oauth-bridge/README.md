# Dirole OAuth Bridge

Página de redirecionamento OAuth para o app Dirole.

## Deploy no Vercel

1. Instale o Vercel CLI:
```bash
npm i -g vercel
```

2. Faça deploy:
```bash
cd oauth-bridge
vercel --prod
```

3. Copie a URL gerada (ex: `https://dirole-oauth.vercel.app`)

4. Atualize `authService.ts` com a URL do Vercel

5. Adicione a URL no Google Cloud Console:
   - `https://sua-url.vercel.app/callback`

## Alternativa: GitHub Pages

1. Crie um repositório público no GitHub
2. Faça upload do arquivo `callback.html`
3. Ative GitHub Pages nas configurações
4. Use a URL: `https://seu-usuario.github.io/repo-name/callback.html`
