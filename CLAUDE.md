## Idioma
Sempre responder em português brasileiro (pt-BR).

## Documentação de Referência
- Flowbite Svelte: /Users/rafaelaredes/Documents/DataLife-EPI/frontend-svelt/flowbite-svelte-doc-our-version.md
- API Backend: /Users/rafaelaredes/Documents/DataLife-EPI/frontend-svelt/API-P0719h.md

## Regras Obrigatórias

### Dados
- Usar exclusivamente APIs reais: https://epi-backend-s14g.onrender.com
- Documentação: https://epi-backend-s14g.onrender.com/api/docs
- Proibido: dados mockados, fallbacks com mocks

### UI
- Ícones: apenas flowbite-svelte-icons (https://flowbite-svelte-icons.codewithshin.com/outline-icons)
- Botões: sempre `class="rounded-sm"`
- Componentes Flowbite: sempre `size="sm"`
- Proibido: `rounded-lg`, `rounded-md`, outros radius

## Estrutura

```
src/
├── lib/
│   ├── components/
│   │   ├── common/         # Reutilizáveis
│   │   ├── containers/     # Lógica de negócio
│   │   ├── presenters/     # UI pura
│   │   ├── forms/          # Formulários
│   │   └── ui/             # UI otimizados
│   ├── services/
│   │   ├── core/           # apiClient, configurationService
│   │   ├── entity/         # Colaboradores, EPIs
│   │   ├── inventory/      # Estoque
│   │   ├── process/        # Workflows
│   │   └── reporting/      # Relatórios
│   ├── stores/             # Estado Svelte
│   ├── types/              # TypeScript
│   └── utils/              # Auxiliares
└── routes/                 # Páginas SvelteKit
```

## Arquitetura Container/Presenter

### Container
- Gerencia estado e lógica
- Integra com services
- Delega UI para Presenters

### Presenter
- Recebe dados via props
- Renderiza com Flowbite Svelte
- Emite eventos
- Sem lógica de negócio

## Stack

- Svelte 4.2.19 + SvelteKit 2.x
- TypeScript 5.x (tipagem obrigatória)
- Flowbite Svelte v0.48.6 (compatível Svelte 4)
- TailwindCSS 3.4
- Vite 5.x

## Backend

- Base URL: https://epi-backend-s14g.onrender.com
- Cliente: src/lib/services/core/apiClient.ts
- Proxy: vite.config.ts
- Formato resposta: `{success: true, data: [...], pagination: {...}}`

## Comandos

```bash
npm run dev      # Desenvolvimento (porta 5173)
npm run build    # Produção
npm run check    # TypeScript
npm run format   # Prettier
```

## Rotas

- `/` - Dashboard
- `/fichas` - Fichas de EPI
- `/estoque` - Controle de estoque
- `/notas` - Notas de movimentação
- `/catalogo` - Catálogo de EPIs
- `/auditoria` - Auditoria
- `/relatorios` - Relatórios

## Validação

Após cada implementação, verificar funcionamento via Playwright MCP.
Em caso de problemas persistentes, usar deep-code-reasoning MCP.