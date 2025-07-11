# CLAUDE.md - DataLife EPI Svelte

Este arquivo fornece instruções básicas para desenvolvimento no frontend Svelte do DataLife EPI.

Sobre a versao flowbite svelte que usamos acesse
 /Users/rafaelaredes/Documents/DataLife-EPI/frontend-svelt/flowbite-svelte-doc-our-version.md

 Sobre a API uma documentacao completa em .md voce pode acessar aqui /Users/rafaelaredes/Documents/DataLife-EPI/frontend-svelt/API-P0719h.md


## Regras Fundamentais

### ❌ NÃO usar dados mockados
- SEMPRE usar APIs reais do backend PostgreSQL: https://epi-backend-s14g.onrender.com
- Documentação API: https://epi-backend-s14g.onrender.com/api/docs
- NUNCA implementar fallback com mocks - buscar dados reais sempre

### 🎨 Ícones obrigatórios
- Usar exclusivamente: https://flowbite-svelte-icons.codewithshin.com/outline-icons
- Importar diretamente: `import { IconName } from 'flowbite-svelte-icons';`

### 🔧 Padrões de componentes
- Todos os botões: `class="rounded-sm"` (border-radius: 2px)
- Flowbite Svelte: sempre `size="sm"` para consistência
- NUNCA usar `rounded-lg`, `rounded-md` ou outros radius

## Estrutura do Projeto

```
src/
├── lib/
│   ├── components/
│   │   ├── common/         # Componentes reutilizáveis
│   │   ├── containers/     # Componentes "inteligentes" (lógica)
│   │   ├── presenters/     # Componentes "burros" (UI)
│   │   ├── forms/          # Formulários padronizados
│   │   └── ui/             # Componentes UI otimizados
│   ├── services/
│   │   ├── core/           # apiClient, configurationService
│   │   ├── entity/         # Gestão de entidades (colaboradores, EPIs)
│   │   ├── inventory/      # Controle de estoque
│   │   ├── process/        # Workflows (notas, devoluções)
│   │   └── reporting/      # Relatórios
│   ├── stores/             # Estado reativo Svelte
│   ├── types/              # Definições TypeScript
│   └── utils/              # Funções auxiliares
└── routes/                 # Páginas SvelteKit
```

## Arquitetura Container/Presenter

### Container (Inteligente)
- Gerencia estado e lógica de negócio
- Integra com service adapters
- Delega renderização para Presenters

### Presenter (Burro)
- Recebe dados via props
- Renderiza UI usando Flowbite Svelte
- Emite eventos para Container pai
- Zero lógica de negócio

## Tecnologias

- **Svelte 4.2.19** + **SvelteKit 2.x**
- **TypeScript 5.x** para tipagem forte
- **Flowbite Svelte v0.48.6** (CRÍTICO: compatível com Svelte 4)
- **TailwindCSS 3.4** para estilização
- **Vite 5.x** para build

## Backend Integration

- **Base URL**: https://epi-backend-s14g.onrender.com
- **Cliente HTTP**: `src/lib/services/core/apiClient.ts`
- **Proxy configurado**: vite.config.ts para desenvolvimento
- **Formato padrão**: `{success: true, data: [...], pagination: {...}}`

## Comandos

- `npm run dev` - Desenvolvimento (porta 5173)
- `npm run build` - Build de produção
- `npm run check` - Verificação TypeScript
- `npm run format` - Formatação Prettier

## Páginas principais

- `/` - Dashboard
- `/fichas` - Fichas de EPI (Container/Presenter ✅)
- `/estoque` - Controle de estoque
- `/notas` - Notas de movimentação (Drawer ✅)
- `/catalogo` - Catálogo de EPIs
- `/auditoria` - Auditoria de movimentações
- `/relatorios` - Relatórios

## Padrões obrigatórios

1. **Border radius**: `rounded-sm` em todos os botões
2. **Ícones**: Apenas Flowbite Svelte Icons
3. **Backend**: APIs reais, NUNCA mocks
4. **Container/Presenter**: Separação clara de responsabilidades
5. **TypeScript**: Tipagem forte obrigatória
6. **Português**: Interface e comentários em português

## Status atual

- ✅ **Sistema drawer unificado**: Fichas e notas com padrão consistente
- ✅ **Backend PostgreSQL**: Integração funcional
- ⚠️ **Arquitetura**: Transição para Container/Presenter (30% migrado)
- ⚠️ **Build**: Erros TypeScript pendentes de correção


Em caso de problemas persistentes use o mcp deep-code-reasoning