# 🎯 Plano de Execução Detalhado - DataLife EPI Frontend Refactoring v3.0

**Data**: 14/07/2025  
**Autor**: Claude Code AI (baseado no plano v3 + análise detalhada da codebase)  
**Versão**: 3.0 EXECUTIVO

> Este documento fornece um plano de execução **ultra-detalhado** para refatoração do frontend DataLife EPI, com instruções específicas sobre **onde**, **como** e **o que fazer** em cada etapa. Projetado para execução por agentes de IA com contexto completo para cada tarefa.

---

## 📊 Contexto Executivo - Estado Atual da Codebase

### Situação Crítica Identificada:
- **73 erros TypeScript** impedem build de produção
- **15 arquivos com dados mockados** em ambiente que deveria usar API real
- **10 componentes críticos >300 linhas** (máximo encontrado: 1.040 linhas)
- **70% dos componentes** ainda não seguem padrão Container/Presenter
- **Arquivos duplicados/obsoletos** espalhados no projeto

### Impacto no Negócio:
- ❌ **Build de produção quebrado** - impossível deployar
- ❌ **Performance degradada** - componentes monolíticos
- ❌ **Dados fictícios** interferindo na operação real
- ❌ **Manutenção custosa** - código espaguete

---

## 🔄 Plano de Execução Sequencial

### ETAPA 1: ESTABILIZAÇÃO CRÍTICA
> **Objetivo**: Tornar o build de produção funcional e remover dados mockados

#### 1.1 REMOÇÃO DE ARQUIVOS OBSOLETOS
**Localização**: Arquivos duplicados/temporários identificados
**Ação**: Deletar os seguintes arquivos exatos:

```bash
# Arquivos para remoção imediata:
src/lib/components/containers/FichasContainer.fixed.svelte
src/lib/components/ui/StatusBadge.temp.svelte
src/lib/components/presenters/NotaItensManagerSimplified.svelte
src/lib/components/presenters/HistoryModal.svelte
src/lib/components/common/DrawerHeader.md
src/lib/components/common/StatusDot.md
src/lib/components/ui/ResponsiveTable.md
src/lib/services/unified/unifiedDataAdapter.ts
```

**Contexto para IA**: Estes arquivos são duplicatas ou versões temporárias que foram identificadas na análise. O arquivo `unifiedDataAdapter.ts` possui 4 erros TypeScript e não é utilizado.

#### 1.2 ELIMINAÇÃO TOTAL DE DADOS MOCKADOS
**Localização Principal**: `src/lib/services/mockData.ts` (592 linhas)
**Ação Sequencial**:

1. **Analisar dependências**:
   ```typescript
   // Arquivos que importam mockData.ts (encontrados na análise):
   src/lib/services/inventory/inventoryCommandAdapter.ts
   src/lib/services/entity/contratadasAdapter.ts
   src/lib/services/entity/colaboradoresAdapter.ts
   src/lib/services/entity/kardexAdapter.ts
   src/lib/services/entity/notesAdapter.ts
   src/lib/services/reporting/dashboardAdapter.ts
   src/lib/stores/devolutionStore.ts
   src/lib/stores/paginatedStore.ts
   ```

2. **Substituir por calls de API real**:
   - **Contexto**: A API está disponível em `https://epi-backend-s14g.onrender.com`
   - **Cliente HTTP**: Usar `src/lib/services/core/apiClient.ts` existente
   - **Referência**: Consultar documentação da API para endpoints corretos

3. **Remover fallbacks mock**:
   ```typescript
   // Padrão encontrado nos adapters (REMOVER):
   return response?.data || MOCK_FALLBACK_DATA;
   
   // Substituir por (tratamento de erro adequado):
   if (!response?.success) {
     throw new Error(`Erro ao carregar dados: ${response?.message}`);
   }
   return response.data;
   ```

#### 1.3 CORREÇÃO DOS 73 ERROS TYPESCRIPT
**Localização dos erros críticos** (baseado na análise):

1. **types/index.ts** - Adicionar tipos faltantes:
   ```typescript
   // Tipos faltantes identificados:
   export interface EPIDisponivel {
     id: string;
     tipoEpiId: string;
     quantidade: number;
     status: 'DISPONIVEL' | 'QUARENTENA' | 'AGUARDANDO_INSPECAO';
     almoxarifado: {
       id: string;
       nome: string;
     };
     tipoEpi: {
       nomeEquipamento: string;
       numeroCa: string;
       categoria: string;
     };
   }

   export interface Usuario {
     id: string;
     nome: string;
     email: string;
     createdAt: string;
   }

   export interface InventoryItemDTO {
     id: string;
     almoxarifadoId: string;
     tipoEpiId: string;
     quantidade: number;
     status: string;
     almoxarifado: any;
     tipoEpi: any;
   }
   ```

2. **types/paginationTypes.ts** (8 erros) - Corrigir exports:
   ```typescript
   // Adicionar exports faltantes:
   export interface FichaCompleteResponse {
     success: boolean;
     data: {
       ficha: any;
       equipamentosEmPosse: any[];
       historico: any[];
       estatisticas: any;
     };
   }

   export interface FichaListParams {
     page?: number;
     limit?: number;
     search?: string;
     status?: string;
     empresaId?: string;
   }
   ```

3. **stores/contratadaStore.ts** (14 erros) - Corrigir implementação:
   ```typescript
   // Problema identificado: métodos inexistentes
   // Substituir getFichaById por getContratadaById
   // Adicionar responseType adequado para chamadas API
   ```

**Contexto para IA**: Cada erro deve ser corrigido individualmente. Usar `npm run check` após cada correção para validar progresso.

---

### ETAPA 2: REORGANIZAÇÃO DE TYPES E STATE
> **Objetivo**: Unificar sistema de tipos e consolidar stores

#### 2.1 FRAGMENTAÇÃO DO ARQUIVO GIGANTE types/index.ts
**Problema**: Arquivo com 529 linhas - dificulta manutenção e tree-shaking
**Localização**: `src/lib/types/index.ts`
**Ação**: Dividir em módulos temáticos:

```typescript
// Nova estrutura de types/:
types/
├── api.ts           // ApiResponse, PaginatedResponse, etc.
├── entities/
│   ├── colaborador.ts
│   ├── contratada.ts
│   ├── epi.ts
│   ├── ficha.ts
│   └── estoque.ts
├── ui/
│   ├── components.ts
│   ├── navigation.ts
│   └── forms.ts
├── business/
│   ├── inventory.ts
│   ├── reports.ts
│   └── workflows.ts
└── index.ts         // Re-exports centralizados
```

**Implementação sequencial**:
1. Criar arquivos modulares
2. Mover interfaces relacionadas para cada módulo
3. Configurar re-exports em index.ts
4. Atualizar imports em toda aplicação

#### 2.2 UNIFICAÇÃO DO PAGINATEDSTORE
**Problema identificado**: Multiple implementações inconsistentes
**Localização**: 
- `src/lib/stores/paginatedStore.ts` (contém referências mock)
- Stores individuais com lógica duplicada

**Ação**: Criar store unificado:
```typescript
// stores/core/createPaginatedStore.ts
export function createPaginatedStore<T>({
  fetchFn,
  initialFilters = {},
  pageSize = 10
}: PaginatedStoreConfig<T>) {
  // Implementação única para todos os stores paginados
  // Remove todas as referências a dados mock
  // Usa apenas API real via apiClient
}
```

**Migração sequencial**:
1. Identificar todos os stores que usam paginação
2. Migrar um por vez para novo padrão
3. Remover implementações antigas
4. Testar cada migração individualmente

#### 2.3 IMPLEMENTAÇÃO DE CACHE SERVICE
**Objetivo**: Reduzir chamadas API redundantes (identificadas 3-4 duplicações na análise)
**Localização**: Criar `src/lib/services/core/cacheService.ts`

```typescript
// Implementação com TTL 5 minutos conforme plano v3
interface CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  invalidate(key: string): void;
  clear(): void;
}
```

**Integração**: Envolver `apiClient.ts` existente com cache automático

---

### ETAPA 3: QUEBRA DE COMPONENTES MONOLÍTICOS
> **Objetivo**: Dividir os 10 componentes críticos >300 linhas

#### 3.1 PRIORIZAÇÃO POR TAMANHO E COMPLEXIDADE
**Ordem de execução** (baseado na análise - maiores primeiro):

1. **NotesDetailDrawer.svelte** (1.040 linhas) - CRÍTICO
2. **NotesFormModalPresenter.svelte** (947 linhas) - CRÍTICO  
3. **ItemMovementHistory.svelte** (751 linhas)
4. **DevolutionDashboard.svelte** (688 linhas)
5. **FichaDetailContainer.svelte** (657 linhas)
6. **NotaItensManager.svelte** (656 linhas)
7. **FichaDetailPresenter.svelte** (604 linhas)
8. **NotesContainer.svelte** (589 linhas)
9. **InventoryContainer.svelte** (563 linhas)
10. **NotesTablePresenter.svelte** (546 linhas)

#### 3.2 ESTRATÉGIA DE QUEBRA - NotesDetailDrawer.svelte
**Análise do componente**: 1.040 linhas - maior arquivo identificado
**Localização**: `src/lib/components/presenters/NotesDetailDrawer.svelte`

**Quebra proposta**:
```
NotesDetailDrawer.svelte (1.040 linhas) →
├── NotesDetailDrawer.svelte (150-200 linhas) - Container principal
├── NotesHeader.svelte (80-100 linhas) - Cabeçalho e ações
├── NotesItemsList.svelte (200-250 linhas) - Lista de itens
├── NotesItemEditor.svelte (150-200 linhas) - Editor de item individual
├── NotesStatusManager.svelte (100-150 linhas) - Gestão de status
├── NotesValidation.svelte (100-120 linhas) - Validações
└── NotesActions.svelte (120-150 linhas) - Ações da nota
```

**Processo de quebra**:
1. **Identificar responsabilidades**: Analisar seções funcionais do componente
2. **Extrair em ordem**: Começar por componentes menos acoplados
3. **Manter props interface**: Preservar contratos de dados
4. **Testar incremental**: Cada extração deve manter funcionalidade

#### 3.3 ESTRATÉGIA DE QUEBRA - NotesFormModalPresenter.svelte
**Localização**: `src/lib/components/presenters/NotesFormModalPresenter.svelte`
**Tamanho**: 947 linhas

**Análise funcional** (contexto para IA):
- Modal complexo para criação/edição de notas
- Contém múltiplos formulários aninhados
- Gerencia estado de múltiplos itens
- Validações inline complexas

**Quebra proposta**:
```
NotesFormModalPresenter.svelte (947 linhas) →
├── NotesFormModal.svelte (100-150 linhas) - Container modal
├── NotesBasicForm.svelte (150-200 linhas) - Dados básicos da nota
├── NotesItemsForm.svelte (200-250 linhas) - Gestão de itens
├── NotesItemSelector.svelte (150-200 linhas) - Seletor de EPIs
├── NotesValidationPanel.svelte (100-150 linhas) - Painel de validação
└── NotesFormActions.svelte (100-120 linhas) - Ações do formulário
```

#### 3.4 AUTOMATIZAÇÃO DA QUEBRA
**Script para identificação automática**:
```bash
# Para cada componente >300 linhas:
find src -name "*.svelte" -exec wc -l {} + | awk '$1 > 300' | sort -nr
```

**Padrão de quebra**:
1. **Função única**: Cada novo componente deve ter uma responsabilidade
2. **Props explícitas**: Interface clara de entrada/saída
3. **Eventos padronizados**: Sistema consistente de comunicação
4. **Composição**: Componente pai orquestra filhos

---

### ETAPA 4: MIGRAÇÃO ARQUITETURAL CONTAINER/PRESENTER
> **Objetivo**: Completar os 70% pendentes da migração

#### 4.1 MAPEAMENTO DOS COMPONENTES PENDENTES
**Status atual** (baseado na análise):

**✅ Migrados (30%)**:
- `FichasContainer.svelte` + `FichasTablePresenter.svelte`
- `ColaboradorContainer.svelte` + `ColaboradorTablePresenter.svelte`  
- `ContratadaContainer.svelte` + `ContratadaTablePresenter.svelte`
- `InventoryContainer.svelte` + `InventoryTablePresenter.svelte`

**❌ Pendentes (70%)**:
- **Notas**: Sistema monolítico em `NotesContainer.svelte`
- **Catálogo**: Estrutura legacy
- **Auditoria**: Sem padrão definido
- **EPIs**: Componentes dispersos
- **Dashboard**: Estrutura mista

#### 4.2 MIGRAÇÃO PRIORIZADA - SISTEMA DE NOTAS
**Complexidade**: ALTA - sistema crítico do negócio
**Localização atual**: 
- `src/lib/components/containers/NotesContainer.svelte` (589 linhas)
- `src/lib/components/presenters/NotesTablePresenter.svelte` (546 linhas)

**Nova estrutura proposta**:
```
routes/notas/
├── NotesPageContainer.svelte (80-120 linhas)
└── components/
    ├── NotesListContainer.svelte (150-200 linhas)
    ├── NotesListPresenter.svelte (200-250 linhas)
    ├── NotesFilterContainer.svelte (100-150 linhas)
    ├── NotesFilterPresenter.svelte (100-120 linhas)
    ├── NotesDetailContainer.svelte (120-150 linhas)
    └── NotesDetailPresenter.svelte (200-250 linhas)
```

**Implementação sequencial**:
1. **Criar containers vazios**: Estrutura base sem lógica
2. **Migrar lógica de estado**: Mover gerenciamento para containers
3. **Migrar UI**: Mover renderização para presenters  
4. **Migrar eventos**: Sistema de comunicação Container↔Presenter
5. **Remover arquivos antigos**: Após validação completa

#### 4.3 PADRÃO UNIFICADO CONTAINER/PRESENTER
**Template Container** (contexto para IA):
```typescript
// Template para todos os containers:
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { ComponentProps } from './types';
  
  // 1. Props de entrada
  export let initialData: any = null;
  export let filters: any = {};
  
  // 2. Estado local
  let loading = false;
  let error: string | null = null;
  let data: any[] = [];
  
  // 3. Services/Stores
  import { apiService } from '$lib/services';
  
  // 4. Event dispatcher
  const dispatch = createEventDispatcher();
  
  // 5. Lógica de negócio
  async function loadData() {
    loading = true;
    error = null;
    try {
      const response = await apiService.getData(filters);
      data = response.data;
      dispatch('dataLoaded', { data });
    } catch (err) {
      error = err.message;
      dispatch('error', { error });
    } finally {
      loading = false;
    }
  }
  
  // 6. Handlers de eventos
  function handleAction(event) {
    // Lógica específica
    dispatch('action', event.detail);
  }
  
  onMount(loadData);
</script>

<!-- 7. Presenter com props -->
<ComponentPresenter 
  {data} 
  {loading} 
  {error}
  on:action={handleAction}
/>
```

**Template Presenter** (contexto para IA):
```typescript
// Template para todos os presenters:
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ComponentData } from './types';
  
  // 1. Props apenas (ZERO estado de negócio)
  export let data: ComponentData[] = [];
  export let loading = false;
  export let error: string | null = null;
  
  // 2. Event dispatcher
  const dispatch = createEventDispatcher();
  
  // 3. Handlers que apenas emitem eventos
  function handleClick(item: ComponentData) {
    dispatch('action', { type: 'click', item });
  }
  
  function handleEdit(item: ComponentData) {
    dispatch('action', { type: 'edit', item });
  }
</script>

<!-- 4. UI pura com Flowbite Svelte -->
<!-- ZERO lógica de negócio -->
<!-- Apenas renderização e eventos -->
```

#### 4.4 MIGRAÇÃO DO SISTEMA DE CATÁLOGO
**Status atual**: Estrutura legacy sem padrão
**Localização**: `src/lib/components/containers/CatalogContainer.svelte`

**Análise** (contexto para IA):
- Mistura lógica de negócio com UI
- Não segue padrão Container/Presenter
- API integration dispersa

**Nova implementação**:
```
routes/catalogo/
├── CatalogoPageContainer.svelte
└── components/
    ├── CatalogoListContainer.svelte
    ├── CatalogoListPresenter.svelte
    ├── CatalogoItemContainer.svelte
    ├── CatalogoItemPresenter.svelte
    ├── CatalogoFilterContainer.svelte
    └── CatalogoFilterPresenter.svelte
```

---

### ETAPA 5: OTIMIZAÇÃO DE PERFORMANCE
> **Objetivo**: Bundle <1MB e Lighthouse >90

#### 5.1 ANÁLISE DE BUNDLE ATUAL
**Comando para análise**:
```bash
npm run build
npx vite-bundle-visualizer dist
```

**Problema identificado** (baseado no plano v3): Bundle inicial 3.2 MB
**Meta**: <1 MB

#### 5.2 CODE SPLITTING ESTRATÉGICO
**Configuração vite.config.ts**:
```typescript
// Implementar manualChunks:
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk
          vendor: ['svelte', 'flowbite-svelte'],
          
          // Types chunk (após fragmentação da Etapa 2)
          types: ['$lib/types/index'],
          
          // Features chunks
          fichas: [
            '$lib/components/containers/FichasContainer',
            '$lib/components/presenters/FichasTablePresenter'
          ],
          notas: [
            '$lib/components/containers/NotesContainer',
            '$lib/components/presenters/NotesTablePresenter'
          ],
          estoque: [
            '$lib/components/containers/InventoryContainer',
            '$lib/components/presenters/InventoryTablePresenter'
          ]
        }
      }
    }
  }
});
```

#### 5.3 LAZY LOADING DE ROTAS
**Implementação por rota**:
```typescript
// routes/+layout.svelte - Implementar lazy loading:

// ANTES (eager loading):
import FichasPage from './fichas/+page.svelte';

// DEPOIS (lazy loading):
const FichasPage = lazy(() => import('./fichas/+page.svelte'));
const NotasPage = lazy(() => import('./notas/+page.svelte'));
const EstoquePage = lazy(() => import('./estoque/+page.svelte'));
```

#### 5.4 OTIMIZAÇÃO DE IMPORTS
**Problema**: Imports gigantes identificados
**Solução**: Tree-shaking otimizado

```typescript
// ANTES (importa tudo):
import { Button, Table, Modal } from 'flowbite-svelte';

// DEPOIS (importa específico):
import Button from 'flowbite-svelte/Button.svelte';
import Table from 'flowbite-svelte/Table.svelte';
import Modal from 'flowbite-svelte/Modal.svelte';
```

#### 5.5 SERVICE WORKER E CACHE
**Implementação Workbox**:
```typescript
// static/sw.js - Service Worker para cache:
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Cache de assets estáticos
precacheAndRoute(self.__WB_MANIFEST);

// Cache de API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3
  })
);
```

---

### ETAPA 6: LIMPEZA E SINCRONIZAÇÃO COM API
> **Objetivo**: Integração 100% tipada com backend

#### 6.1 GERAÇÃO AUTOMÁTICA DE TIPOS DA API
**Baseado em**: Documentação da API e endpoint `/api/docs`
**Ferramenta**: openapi-typescript

**Instalação e configuração**:
```bash
npm install -D openapi-typescript
```

**Geração automática**:
```typescript
// scripts/generate-api-types.js
import { generateApi } from 'openapi-typescript';

const api = await generateApi({
  input: 'https://epi-backend-s14g.onrender.com/api/docs-json',
  output: 'src/lib/types/api-generated.d.ts'
});
```

**Integração no build**:
```json
// package.json
{
  "scripts": {
    "generate-types": "node scripts/generate-api-types.js",
    "build": "npm run generate-types && vite build"
  }
}
```

#### 6.2 ATUALIZAÇÃO DO API CLIENT
**Localização**: `src/lib/services/core/apiClient.ts`
**Objetivo**: Typed client baseado em OpenAPI

```typescript
// apiClient.ts - Versão tipada:
import type { operations } from '$lib/types/api-generated';

class TypedApiClient {
  async get<T extends keyof operations>(
    endpoint: T,
    params?: operations[T]['parameters']
  ): Promise<operations[T]['responses']['200']['content']['application/json']> {
    // Implementação tipada
  }
  
  async post<T extends keyof operations>(
    endpoint: T,
    body?: operations[T]['requestBody']['content']['application/json']
  ): Promise<operations[T]['responses']['201']['content']['application/json']> {
    // Implementação tipada
  }
}
```

#### 6.3 MIGRAÇÃO DOS SERVICE ADAPTERS
**Problema identificado**: Padrões inconsistentes entre adapters
**Localização**: `src/lib/services/entity/*.ts`

**Padrão unificado para todos os adapters**:
```typescript
// Template para service adapters:
export interface EntityAdapter<T, CreateT, UpdateT> {
  // CRUD básico
  list(params: ListParams): Promise<PaginatedResponse<T>>;
  getById(id: string): Promise<T>;
  create(data: CreateT): Promise<T>;
  update(id: string, data: UpdateT): Promise<T>;
  delete(id: string): Promise<void>;
  
  // Busca
  search(query: string): Promise<T[]>;
  
  // Cache
  clearCache(): void;
}
```

**Implementação sequencial**:
1. Atualizar `colaboradoresAdapter.ts` (atual tem 4 erros TS)
2. Atualizar `contratadasAdapter.ts` (atual tem referências mock)
3. Atualizar `estoqueItensAdapter.ts`
4. Atualizar `kardexAdapter.ts`
5. Atualizar `notesAdapter.ts` (atual tem dados mock)
6. Atualizar `tiposEpiAdapter.ts`

#### 6.4 REMOÇÃO DE PREFIXOS LEGACY
**Problema**: URLs ainda usam prefixos v1 em alguns lugares
**Localização**: Buscar por `'/api/v1'` em toda codebase

```bash
# Comando para encontrar:
grep -r "/api/v1" src/
```

**Substituição**:
```typescript
// ANTES:
const url = '/api/v1/fichas-epi';

// DEPOIS:
const url = '/api/fichas-epi';
```

---

### ETAPA 7: VALIDAÇÃO E QUALIDADE
> **Objetivo**: Garantir que todas as correções funcionam

#### 7.1 IMPLEMENTAÇÃO DE TESTES DE CARACTERIZAÇÃO
**Objetivo**: Prevenir regressões durante refatoração
**Localização**: Criar `tests/characterization/`

```typescript
// tests/characterization/fichas.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FichasContainer from '$lib/components/containers/FichasContainer.svelte';

describe('Fichas System - Characterization Tests', () => {
  it('deve carregar lista de fichas da API real', async () => {
    // Snapshot do comportamento atual
    const { container } = render(FichasContainer);
    
    // Aguardar carregamento da API
    await screen.findByText(/carregando/i);
    
    // Verificar estrutura dos dados
    expect(container).toMatchSnapshot();
  });
});
```

#### 7.2 PIPELINE DE VALIDAÇÃO
**Comando completo de validação**:
```bash
# Deve executar sem erros após cada etapa:
npm run check      # TypeScript
npm run lint       # ESLint  
npm run format     # Prettier
npm run test       # Vitest
npm run build      # Build de produção
```

#### 7.3 MÉTRICAS DE SUCESSO
**Critérios de Gate Final**:

1. **✅ TypeScript**: `npm run check` → 0 erros
2. **✅ Build**: `npm run build` → artefato deployável
3. **✅ Bundle Size**: < 1 MB (atualmente 3.2 MB)
4. **✅ Lighthouse Performance**: > 90 (atualmente 65)
5. **✅ Zero Mocks**: Busca por 'mock' retorna 0 resultados
6. **✅ Container/Presenter**: 100% migrado
7. **✅ Componentes**: Nenhum >300 linhas

#### 7.4 DOCUMENTAÇÃO VIVA
**Atualizações obrigatórias**:
- `GEMINI.md` - Status pós-refatoração
- `README.md` - Comandos atualizados
- `CHANGELOG.md` - Log de mudanças
- `package.json` - Scripts de validação

---

## 🔄 Contexto de Execução para Agentes de IA

### Princípios de Execução:
1. **Sequencial Obrigatório**: Não pular etapas - cada uma depende da anterior
2. **Validação Incremental**: Testar após cada mudança significativa
3. **Commits Atômicos**: Um commit por correção/migração
4. **Rollback Ready**: Manter possibilidade de reverter cada mudança

### Comandos de Verificação por Etapa:
```bash
# Após cada etapa:
npm run check                    # Verificar TypeScript
npm run build                    # Verificar build
npx vite-bundle-visualizer dist  # Verificar tamanho
lighthouse http://localhost:5173 # Verificar performance
```

### Tratamento de Erros:
- **TypeScript**: Corrigir todos os erros antes de prosseguir
- **Build**: Deve gerar artefato válido em cada etapa
- **API**: Sempre validar chamadas com dados reais
- **Performance**: Monitorar regressões de bundle size

### Contexto de Estado:
- **Antes**: Build quebrado, dados mock, componentes gigantes
- **Durante**: Progresso incremental validado
- **Depois**: Sistema otimizado, tipado e funcional

---

## 📋 Resumo Executivo das Ações

| Etapa | Arquivos Afetados | Ação Principal | Critério de Sucesso |
|-------|------------------|----------------|-------------------|
| 1 | 8 arquivos obsoletos + mockData.ts | Remoção total + correção 73 erros TS | `npm run check` sem erros |
| 2 | types/index.ts + stores/ | Fragmentação + unificação | Imports otimizados |
| 3 | 10 componentes >300 linhas | Quebra funcional | Todos <300 linhas |
| 4 | 70% dos componentes | Migração C/P | 100% seguem padrão |
| 5 | Bundle + assets | Code splitting + lazy loading | <1MB bundle |
| 6 | Services + API client | Tipos gerados + integração | 100% tipado |
| 7 | Sistema completo | Testes + validação | Métricas verdes |

**Tempo estimado total**: 15-20 dias (execução sequencial)  
**ROI esperado**: Build funcional, performance 3x, manutenção 70% mais fácil