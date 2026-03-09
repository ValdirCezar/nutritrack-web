# NutriTrack Web

Frontend da aplicação NutriTrack AI — acompanhamento nutricional com inteligência artificial.

**Stack:** Angular 19 · TypeScript · SCSS · Web Speech API

📖 **Documentação completa:** Veja o [PROJETO.md](https://github.com/ValdirCezar/nutritrack-web/blob/main/PROJETO.md) na raiz para guia de deploy, operações e arquitetura.

## Executar localmente

```bash
npm install
npx ng serve --port 4200
# Acesse: http://localhost:4200
```

Requer o backend rodando em `http://localhost:8080`.

## Deploy

```bash
# Build de produção
npx ng build --configuration production

# Deploy para Netlify
netlify deploy --prod --dir=dist/nutritrack-web/browser
```

## Funcionalidades

- 🔐 Autenticação com verificação de e-mail
- 🍽️ Registro de refeições com análise nutricional por IA
- 🎤 Entrada por voz (Web Speech API)
- 📊 Dashboard com barras de progresso
- 📅 Histórico de refeições por data
- 👤 Perfil com metas personalizadas
