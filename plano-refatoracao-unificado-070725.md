# 🚀 Plano de Refatoração Unificado - Frontend DataLife EPI
**Data:** 07 de Janeiro de 2025  
**Versão:** 1.0  
**Status:** Plano Executável para Agente de IA

** IMPORTANTE: VOCÊ DEVE EXECUTAR ESTE PLANO ININTERRUPTAMENTE ATÉ O FINAL, INCLUIDO OS TESTES E DEVE FAZER ISSO SOZINHO , sempre seguindo as instruções do plano E SEMPRE QUE POSSIVEL ATUALIZANDO O ARQUIVO CLAUDE.md**

## 🎯 Resumo Executivo

Este documento consolida os dois relatórios anteriores em um **plano unificado de refatoração** executável por agente de IA de código. O sistema está **95% funcional** mas necessita correções arquiteturais focadas para atingir padrão enterprise.

### **Problemas Identificados:**
- 🔴 **21 arquivos duplicados** (~2.834 linhas de código)
- 🔴 **4 fetch calls diretos** em 1 componente
- 🔴 **6 violações CQRS** em adapters
- 🔴 **382 erros TypeScript** impedindo build

### **Resultado Esperado:**
Sistema limpo com **score 2.5/10** de duplicação, 100% consistência arquitetural e build de produção funcionando.

---

## 📋 FASE 0: PRÉ-REQUISITOS E VALIDAÇÃO

### **Step 0.1: Verificação do Ambiente**
```bash
# Verificar dependências
npm run check  # Deve mostrar 382 erros TypeScript
npm run dev    # Deve iniciar sem crash em http://localhost:5173

# Verificar backend
curl https://epi-backend-s14g.onrender.com/api/docs  # Deve retornar 200 OK
```

**Validação de Sucesso:**
- ✅ Dev server inicia sem crash
- ✅ Backend responde no endpoint /api/docs
- ❌ Build falha com 382 erros TypeScript (esperado)

### **Step 0.2: Backup e Branch**
```bash
# Criar branch para refatoração
git checkout -b refactor/architectural-cleanup
git add .
git commit -m "chore: backup before architectural refactoring"
```

---

## 🚨 FASE 1: CONSOLIDAÇÃO DE CLIENTES HTTP (Prioridade CRÍTICA)

**Duração Estimada:** 4-6 horas  
**Complexidade:** Alta  
**Risco:** Alto (breaking changes)

### **Step 1.1: Análise de Dependências**

**Arquivos para investigar:**
```bash
# Encontrar todos os imports de clientes HTTP
grep -r "from.*api" src/lib/services/ --include="*.ts"
grep -r "import.*api" src/lib/services/ --include="*.ts"
```

**Clientes identificados:**
- `src/lib/services/api.ts` - Factory legacy (349 linhas)
- `src/lib/services/core/apiClient.ts` - Cliente moderno (156 linhas) ✅ MANTER
- `src/lib/services/api/client.ts` - Cliente tipado (287 linhas)

### **Step 1.2: Consolidar Features Úteis**

**Arquivo:** `src/lib/services/core/apiClient.ts`

**Código para adicionar (baseado em client.ts):**
```typescript
// Adicionar ao apiClient.ts existente
export interface RequestConfig {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

// Método unificado de request
async request<T>(config: RequestConfig): Promise<T> {
  const { endpoint, method = 'GET', data, params, headers = {}, timeout = 10000 } = config;
  
  const url = this.buildUrl(endpoint, params);
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...this.getAuthHeaders(),
    ...headers
  };

  const fetchConfig: RequestInit = {
    method,
    headers: requestHeaders,
    signal: AbortSignal.timeout(timeout)
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    fetchConfig.body = JSON.stringify(data);
  }

  return this.executeRequest<T>(url, fetchConfig);
}
```

### **Step 1.3: Migrar entityManagementAdapter**

**Arquivo:** `src/lib/services/entity/entityManagementAdapter.ts`

**Substituir importação:**
```typescript
// ❌ REMOVER
import { tiposEPIAPI } from '../api';

// ✅ ADICIONAR
import { apiClient } from '../core/apiClient';
```

**Substituir método getTiposEPI:**
```typescript
// ❌ REMOVER (linha ~158)
const mockData = await tiposEPIAPI.getAll();

// ✅ SUBSTITUIR
const response = await apiClient.get<{ data: { items: TipoEPIDTO[] } }>('/tipos-epi', params);
const items = response.data.items || [];
```

### **Step 1.4: Verificar Outros Adapters**

**Comando de verificação:**
```bash
# Procurar imports de clientes incorretos
grep -r "from.*api['\"]" src/lib/services/ --include="*.ts" | grep -v "core/apiClient"
```

**Adapters para verificar:**
- `catalogAdapter.ts` - ✅ Já usa apiClient
- `fichaProcessAdapter.ts` - ✅ Já usa apiClient  
- `inventoryCommandAdapter.ts` - ✅ Já usa apiClient
- `reportingQueryAdapter.ts` - ✅ Já usa apiClient

### **Step 1.5: Remover Arquivos Legacy**

```bash
# Remover cliente não utilizado
rm src/lib/services/api/client.ts

# Deprecar factory legacy (não remover ainda)
mv src/lib/services/api.ts src/lib/services/api.legacy.ts
```

**Adicionar comentário de depreciação:**
```typescript
// @deprecated - Este arquivo será removido na próxima versão
// Use apiClient.ts para todas as comunicações HTTP
// Mantido temporariamente para compatibilidade com entityManagementAdapter
```

### **Step 1.6: Atualizar Barrel Exports**

**Arquivo:** `src/lib/services/index.ts`
```typescript
// ❌ REMOVER
export * from './api';

// ✅ MANTER/ADICIONAR
export { apiClient } from './core/apiClient';
export * from './entity/catalogAdapter';
export * from './entity/colaboradoresAdapter';
export * from './entity/contratadasAdapter';
export * from './inventory/inventoryCommandAdapter';
export * from './process/fichaProcessAdapter';
export * from './reporting/reportingQueryAdapter';
```

---

## 🔄 FASE 2: CORRIGIR FETCH DIRETOS (Prioridade ALTA)

**Duração Estimada:** 2-3 horas  
**Complexidade:** Média  
**Risco:** Baixo (service adapters já existem)

### **Step 2.1: Substituir Fetch Calls em AuditoriaContainer**

**Arquivo:** `src/lib/components/containers/AuditoriaContainer.svelte`

**Adicionar imports no topo:**
```typescript
import { fichaProcessAdapter } from '$lib/services/process/fichaProcessAdapter';
import { inventoryCommandAdapter } from '$lib/services/inventory/inventoryCommandAdapter'; // Será movido para queryAdapter na Fase 3
import { catalogAdapter } from '$lib/services/entity/catalogAdapter';
```

### **Step 2.2: Substituir Linha 38 (Fichas)**
```typescript
// ❌ REMOVER (linhas 38-45)
const fichasResponse = await fetch('/api/fichas-epi?page=1&limit=100');
if (!fichasResponse.ok) return;
const fichasData = await fichasResponse.json();

// ✅ SUBSTITUIR
try {
  const fichasData = await fichaProcessAdapter.getFichasWithColaboradores({
    page: 1,
    limit: 100
  });
```

### **Step 2.3: Substituir Linha 240 (Estoque)**
```typescript
// ❌ REMOVER (linhas 240-254)
const estoqueResponse = await fetch('/api/estoque/itens?page=1&limit=100');
if (estoqueResponse.ok) {
  const estoqueData = await estoqueResponse.json();
  // ... lógica de processamento

// ✅ SUBSTITUIR
try {
  const estoqueData = await inventoryCommandAdapter.getInventoryItems({
    page: 1,
    limit: 100
  });
  // ... manter lógica de processamento existente
```

### **Step 2.4: Substituir Linha 257 (Tipos EPI)**
```typescript
// ❌ REMOVER (linhas 257-266)
const epiResponse = await fetch('/api/tipos-epi?page=1&limit=100');
if (epiResponse.ok) {
  const epiData = await epiResponse.json();
  // ... lógica de processamento

// ✅ SUBSTITUIR
try {
  const epiData = await catalogAdapter.getTiposEPI({
    page: 1,
    limit: 100
  });
  // ... manter lógica de processamento existente
```

### **Step 2.5: Substituir Linha 269 (Usuários)**
```typescript
// ❌ REMOVER (linhas 269-277)
const usuariosResponse = await fetch('/api/usuarios?page=1&limit=100');
if (usuariosResponse.ok) {
  const usuariosData = await usuariosResponse.json();
  // ... lógica de processamento

// ✅ SUBSTITUIR
try {
  const usuariosData = await fichaProcessAdapter.getUsuarios({
    page: 1,
    limit: 100
  });
  // ... manter lógica de processamento existente
```

### **Step 2.6: Ajustar Tratamento de Dados**

**Importante:** Os service adapters podem retornar estruturas diferentes dos fetch diretos. Verificar e ajustar:

```typescript
// Estrutura típica dos adapters
const response = await adapter.getMethod(params);
// response.data pode conter os itens
// response.pagination pode conter metadados

// Ajustar conforme necessário:
const items = response.data?.items || response.data || response;
```

---

## 🏗️ FASE 3: RESOLVER VIOLAÇÕES CQRS (Prioridade MÉDIA)

**Duração Estimada:** 3-4 horas  
**Complexidade:** Média  
**Risco:** Médio (mudança estrutural)

### **Step 3.1: Criar inventoryQueryAdapter**

**Arquivo:** `src/lib/services/inventory/inventoryQueryAdapter.ts`
```typescript
import { apiClient } from '../core/apiClient';
import type { 
  InventoryItemDTO,
  PaginatedResponse,
  MovementHistoryDTO,
  ConsolidatedStockDTO
} from '../../types/serviceTypes';

export class InventoryQueryAdapter {
  private api = apiClient;

  async getInventoryItems(params?: {
    page?: number;
    limit?: number;
    almoxarifadoId?: string;
    tipoEpiId?: string;
    status?: string;
  }): Promise<PaginatedResponse<InventoryItemDTO>> {
    return this.api.get('/estoque/itens', params);
  }

  async getItemById(id: string): Promise<InventoryItemDTO> {
    return this.api.get(`/estoque/itens/${id}`);
  }

  async getMovementHistory(params?: {
    itemId?: string;
    almoxarifadoId?: string;
    tipoEpiId?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<MovementHistoryDTO>> {
    return this.api.get('/estoque/movimentacoes', params);
  }

  async getConsolidatedStock(params?: {
    almoxarifadoId?: string;
    tipoEpiId?: string;
  }): Promise<ConsolidatedStockDTO[]> {
    return this.api.get('/estoque/consolidado', params);
  }

  async getLowStockItems(params?: {
    threshold?: number;
    almoxarifadoId?: string;
  }): Promise<InventoryItemDTO[]> {
    return this.api.get('/estoque/baixo', params);
  }

  async getExpiringItems(params?: {
    diasAntecedencia?: number;
    almoxarifadoId?: string;
  }): Promise<InventoryItemDTO[]> {
    return this.api.get('/estoque/vencendo', params);
  }
}

export const inventoryQueryAdapter = new InventoryQueryAdapter();
```

### **Step 3.2: Refatorar inventoryCommandAdapter**

**Arquivo:** `src/lib/services/inventory/inventoryCommandAdapter.ts`

**Remover métodos de query:**
```typescript
// ❌ REMOVER ESTES MÉTODOS
// async getInventoryItems(params?: any): Promise<any>
// async getItemById(id: string): Promise<any>
// async getMovementHistory(params?: any): Promise<any>
// async getConsolidatedStock(): Promise<any>
// async getLowStockItems(): Promise<any>
// async getExpiringItems(): Promise<any>

// ✅ MANTER APENAS COMMANDS
export class InventoryCommandAdapter {
  private api = apiClient;

  async registerMovement(data: {
    tipoEpiId: string;
    almoxarifadoId: string;
    quantidade: number;
    tipoMovimentacao: string;
    observacoes?: string;
    responsavelId: string;
  }): Promise<any> {
    return this.api.post('/estoque/movimentacoes', data);
  }

  async registerEntry(data: {
    tipoEpiId: string;
    almoxarifadoId: string;
    quantidade: number;
    observacoes?: string;
    responsavelId: string;
  }): Promise<any> {
    return this.api.post('/estoque/entradas', data);
  }

  async criarEstorno(data: {
    movimentacaoOriginalId: string;
    observacoes?: string;
    responsavelId: string;
  }): Promise<any> {
    return this.api.post('/estoque/estornos', data);
  }
}
```

### **Step 3.3: Atualizar Imports nos Componentes**

**Encontrar componentes afetados:**
```bash
grep -r "inventoryCommandAdapter.*get" src/lib/components/ --include="*.svelte"
```

**Para cada componente encontrado, substituir:**
```typescript
// ❌ REMOVER
import { inventoryCommandAdapter } from '$lib/services/inventory/inventoryCommandAdapter';

// ✅ ADICIONAR
import { inventoryQueryAdapter } from '$lib/services/inventory/inventoryQueryAdapter';
import { inventoryCommandAdapter } from '$lib/services/inventory/inventoryCommandAdapter';

// Atualizar as chamadas:
// ❌ inventoryCommandAdapter.getInventoryItems()
// ✅ inventoryQueryAdapter.getInventoryItems()
```

### **Step 3.4: Atualizar Barrel Exports**

**Arquivo:** `src/lib/services/index.ts`
```typescript
// Adicionar nova query adapter
export { inventoryQueryAdapter } from './inventory/inventoryQueryAdapter';
export { inventoryCommandAdapter } from './inventory/inventoryCommandAdapter';
```

---

## 🧩 FASE 4: ELIMINAR COMPONENTES DUPLICADOS (Prioridade ALTA)

**Duração Estimada:** 3-4 horas  
**Complexidade:** Média  
**Risco:** Médio (mudanças de UI)

### **Step 4.1: Consolidar Status Components**

#### **4.1.1: Aprimorar StatusBadge.svelte**

**Arquivo:** `src/lib/components/ui/StatusBadge.svelte`

**Garantir que contenha todas as funcionalidades:**
```svelte
<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { ComponentColor } from 'flowbite-svelte/dist/types';
  
  export let status: string;
  export let type: 'ficha' | 'epi' | 'colaborador' | 'estoque' = 'epi';
  export let size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' = 'sm';
  export let rounded = false;
  
  // Configuração centralizada de status
  const statusConfig = {
    // Status de EPI/Estoque
    DISPONIVEL: { color: 'green' as ComponentColor, label: 'Disponível' },
    BAIXO: { color: 'yellow' as ComponentColor, label: 'Baixo' },
    INDISPONIVEL: { color: 'red' as ComponentColor, label: 'Indisponível' },
    ZERO: { color: 'red' as ComponentColor, label: 'Zero' },
    
    // Status gerais
    ATIVO: { color: 'green' as ComponentColor, label: 'Ativo' },
    INATIVO: { color: 'gray' as ComponentColor, label: 'Inativo' },
    VENCIDO: { color: 'red' as ComponentColor, label: 'Vencido' },
    PENDENTE: { color: 'yellow' as ComponentColor, label: 'Pendente' },
    
    // Status de fichas
    AGUARDANDO_ASSINATURA: { color: 'yellow' as ComponentColor, label: 'Aguardando Assinatura' },
    ASSINADA: { color: 'green' as ComponentColor, label: 'Assinada' },
    CANCELADA: { color: 'red' as ComponentColor, label: 'Cancelada' }
  };
  
  $: config = statusConfig[status?.toUpperCase()] || { color: 'blue' as ComponentColor, label: status };
</script>

<Badge 
  color={config.color} 
  {size}
  {rounded}
  class="w-fit rounded-sm"
>
  {config.label}
</Badge>
```

#### **4.1.2: Migrar Usos de StatusIndicator**

**Encontrar todas as ocorrências:**
```bash
grep -r "StatusIndicator" src/ --include="*.svelte"
```

**Para cada arquivo encontrado:**
```svelte
<!-- ❌ REMOVER -->
<script>
  import StatusIndicator from '$lib/components/common/StatusIndicator.svelte';
</script>
<StatusIndicator {status} />

<!-- ✅ SUBSTITUIR -->
<script>
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
</script>
<StatusBadge {status} />
```

#### **4.1.3: Migrar Usos de StatusDot**

```bash
grep -r "StatusDot" src/ --include="*.svelte"
```

**Substituir de forma similar ao StatusIndicator**

#### **4.1.4: Remover Componentes Obsoletos**

```bash
rm src/lib/components/common/StatusIndicator.svelte
rm src/lib/components/ui/StatusDot.svelte
```

#### **4.1.5: Atualizar Barrel Exports**

**Arquivo:** `src/lib/components/common/index.ts`
```typescript
// ❌ REMOVER
export { default as StatusIndicator } from './StatusIndicator.svelte';
```

**Arquivo:** `src/lib/components/ui/index.ts`
```typescript
// ✅ MANTER/ADICIONAR
export { default as StatusBadge } from './StatusBadge.svelte';
```

### **Step 4.2: Consolidar Modais de Confirmação**

#### **4.2.1: Migrar Usos de ConfirmationModal**

**Encontrar usos:**
```bash
grep -r "ConfirmationModal" src/ --include="*.svelte"
grep -r "confirmationModal" src/ --include="*.ts" --include="*.svelte"
```

**Para cada componente que usa o modal global:**
```svelte
<!-- ❌ REMOVER -->
<script>
  import ConfirmationModal from '$lib/components/common/ConfirmationModal.svelte';
  import { confirmationModal } from '$lib/stores/modalStore';
  
  function handleDelete() {
    confirmationModal.show('Confirmar exclusão', 'Esta ação não pode ser desfeita');
  }
</script>

<ConfirmationModal bind:open={$confirmationModal.isOpen} />

<!-- ✅ SUBSTITUIR -->
<script>
  import LocalConfirmationModal from '$lib/components/common/LocalConfirmationModal.svelte';
  
  let showConfirmModal = false;
  let confirmTitle = '';
  let confirmMessage = '';
  let confirmCallback = () => {};
  
  function handleDelete() {
    confirmTitle = 'Confirmar exclusão';
    confirmMessage = 'Esta ação não pode ser desfeita';
    confirmCallback = () => performDelete();
    showConfirmModal = true;
  }
  
  function performDelete() {
    // Lógica de exclusão
    showConfirmModal = false;
  }
</script>

<LocalConfirmationModal 
  bind:open={showConfirmModal}
  title={confirmTitle}
  message={confirmMessage}
  on:confirm={confirmCallback}
  on:cancel={() => showConfirmModal = false}
/>
```

#### **4.2.2: Remover Store Global de Modal**

**Arquivo:** `src/lib/stores/modalStore.ts`
```typescript
// ❌ REMOVER completamente ou comentar
// export const confirmationModal = writable({
//   isOpen: false,
//   title: '',
//   message: ''
// });
```

#### **4.2.3: Remover Componente Obsoleto**

```bash
rm src/lib/components/common/ConfirmationModal.svelte
```

### **Step 4.3: Consolidar Tabelas**

#### **4.3.1: Verificar ResponsiveTable**

```bash
grep -r "ResponsiveTable" src/ --include="*.svelte"
```

**Se encontrado, substituir por OptimizedTable:**
```svelte
<!-- ❌ REMOVER -->
import ResponsiveTable from '$lib/components/ui/ResponsiveTable.svelte';

<!-- ✅ SUBSTITUIR -->
import OptimizedTable from '$lib/components/ui/OptimizedTable.svelte';
```

#### **4.3.2: Remover Tabela Redundante**

```bash
rm src/lib/components/ui/ResponsiveTable.svelte
```

---

## 📦 FASE 5: CONSOLIDAR STORES DE PAGINAÇÃO (Prioridade MÉDIA)

**Duração Estimada:** 2-3 horas  
**Complexidade:** Baixa  
**Risco:** Baixo

### **Step 5.1: Comparar Features dos Stores**

**Analisar diferenças:**
```bash
diff src/lib/stores/paginatedStore.ts src/lib/stores/enhancedPaginatedStore.ts
```

### **Step 5.2: Migrar Features Únicas**

**Se `enhancedPaginatedStore.ts` tiver features ausentes em `paginatedStore.ts`, adicionar:**

**Arquivo:** `src/lib/stores/paginatedStore.ts`
```typescript
// Adicionar features únicas do enhanced store se necessário
// Como UnifiedCache, auto-refresh, etc.
```

### **Step 5.3: Migrar Usos do Enhanced Store**

**Encontrar usos:**
```bash
grep -r "enhancedPaginatedStore" src/ --include="*.ts" --include="*.svelte"
```

**Substituir imports:**
```typescript
// ❌ REMOVER
import { createAdvancedPaginatedStore } from '$lib/stores/enhancedPaginatedStore';

// ✅ SUBSTITUIR
import { createPaginatedStore } from '$lib/stores/paginatedStore';
```

### **Step 5.4: Remover Store Duplicado**

```bash
rm src/lib/stores/enhancedPaginatedStore.ts
```

---

## 🏷️ FASE 6: PADRONIZAR TIPOS E INTERFACES (Prioridade MÉDIA)

**Duração Estimada:** 2-3 horas  
**Complexidade:** Baixa  
**Risco:** Baixo

### **Step 6.1: Criar Aliases para Compatibilidade**

**Arquivo:** `src/lib/types/index.ts`
```typescript
// ✅ MANTER tipos existentes para compatibilidade
export interface TipoEPI {
  id: string;
  numeroCA: string;
  nomeEquipamento: string;
  categoria: string;
  status: 'ativo' | 'inativo';
  dataValidade?: string;
}

// ✅ ADICIONAR aliases para DTOs modernos
export type { 
  TipoEPIDTO,
  ColaboradorDTO,
  ContratadaDTO,
  EstoqueItemDTO,
  MovimentacaoEstoqueDTO
} from './serviceTypes';

// ✅ CRIAR aliases para migração gradual
export type TipoEPIModerno = TipoEPIDTO;
export type ColaboradorModerno = ColaboradorDTO;
```

### **Step 6.2: Padronizar Parâmetros de Paginação**

**Arquivo:** `src/lib/types/serviceTypes.ts`
```typescript
// ✅ INTERFACE ÚNICA para paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any; // Para filtros específicos
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

### **Step 6.3: Atualizar Stores para Usar Interface Única**

**Remover interfaces duplicadas de:**
- `paginatedStore.ts`
- `api/client.ts` (se ainda existir)

**Usar apenas a interface de `serviceTypes.ts`**

---

## 🎨 FASE 7: CENTRALIZAR CONFIGURAÇÕES DE TEMA (Prioridade BAIXA)

**Duração Estimada:** 1-2 horas  
**Complexidade:** Baixa  
**Risco:** Baixo

### **Step 7.1: Expandir theme.ts**

**Arquivo:** `src/lib/theme.ts`
```typescript
// Centralizar todas as configurações de cores
export const statusColors = {
  // Status de estoque
  DISPONIVEL: 'green',
  BAIXO: 'yellow', 
  INDISPONIVEL: 'red',
  ZERO: 'red',
  
  // Status gerais
  ATIVO: 'green',
  INATIVO: 'gray',
  VENCIDO: 'red',
  PENDENTE: 'yellow',
  
  // Status de fichas
  AGUARDANDO_ASSINATURA: 'yellow',
  ASSINADA: 'green',
  CANCELADA: 'red'
} as const;

export const statusColorsHex = {
  ATIVO: '#00B8AA',
  INATIVO: '#535D72', 
  VENCIDO: '#EF4444',
  DISPONIVEL: '#059669',
  BAIXO: '#D97706',
  INDISPONIVEL: '#DC2626'
} as const;

export type StatusColor = keyof typeof statusColors;
```

### **Step 7.2: Atualizar StatusBadge para Usar Tema Central**

**Arquivo:** `src/lib/components/ui/StatusBadge.svelte`
```typescript
<script lang="ts">
  import { statusColors } from '$lib/theme';
  
  // Usar configuração centralizada
  $: config = {
    color: statusColors[status?.toUpperCase()] || 'blue',
    label: status
  };
</script>
```

### **Step 7.3: Remover Configurações Hardcoded**

**Verificar e limpar:**
```bash
grep -r "color.*green\|red\|yellow" src/lib/components/ --include="*.svelte"
```

**Substituir cores hardcoded por referências ao tema central**

---

## 🧹 FASE 8: LIMPEZA E PADRONIZAÇÃO (Prioridade BAIXA)

**Duração Estimada:** 1-2 horas  
**Complexidade:** Baixa  
**Risco:** Muito Baixo

### **Step 8.1: Padronizar Barrel Exports**

**Criar index.ts para presenters:**
```typescript
// src/lib/components/presenters/index.ts
export { default as AuditoriaTablePresenter } from './AuditoriaTablePresenter.svelte';
export { default as CatalogTablePresenter } from './CatalogTablePresenter.svelte';
export { default as FichasTablePresenter } from './FichasTablePresenter.svelte';
export { default as InventoryTablePresenter } from './InventoryTablePresenter.svelte';
// ... outros presenters
```

### **Step 8.2: Remover Componentes Órfãos**

**Verificar componentes não utilizados:**
```bash
# Encontrar arquivos .svelte não importados
find src/lib/components -name "*.svelte" -exec grep -l {} src/routes src/lib/components \; | sort | uniq -u
```

### **Step 8.3: Limpar Arquivos Legacy**

```bash
# Remover definitivamente após confirmar que migração funcionou
rm src/lib/services/api.legacy.ts
```

---

## 🔧 FASE 9: CORREÇÃO DOS ERROS TYPESCRIPT (Prioridade CRÍTICA)

**Duração Estimada:** 2-4 horas  
**Complexidade:** Média  
**Risco:** Baixo

### **Step 9.1: Executar Check e Categorizar Erros**

```bash
npm run check > typescript-errors.txt 2>&1
```

**Categorias esperadas de erros:**
1. **Badge colors** - Flowbite aceita apenas enum específico
2. **Missing props** - Componentes com props obrigatórias
3. **Type mismatches** - Incompatibilidades após refatoração

### **Step 9.2: Corrigir Erros de Badge Colors**

**Padrão de correção:**
```typescript
// ❌ Erro típico
const badgeColor = status === 'active' ? 'green' : 'red';

// ✅ Correção type-safe
const badgeColor: ComponentColor = status === 'active' ? 'green' : 'red';

// OU usar type assertion
const badgeColor = (status === 'active' ? 'green' : 'red') as ComponentColor;
```

### **Step 9.3: Corrigir Props Obrigatórias**

**Verificar componentes com props undefined:**
```svelte
<!-- ❌ Props faltantes -->
<SomeComponent />

<!-- ✅ Props fornecidas -->
<SomeComponent requiredProp="value" />
```

### **Step 9.4: Corrigir Imports Quebrados**

**Após remoção de arquivos, alguns imports podem estar quebrados:**
```bash
# Encontrar imports quebrados
npm run check | grep "Cannot find module"
```

---

## ✅ FASE 10: VALIDAÇÃO E TESTES FINAIS

**Duração Estimada:** 1-2 horas  
**Complexidade:** Baixa  
**Risco:** Muito Baixo

### **Step 10.1: Verificar Build de Produção**

```bash
npm run check  # Deve retornar 0 erros
npm run build  # Deve completar com sucesso
npm run preview # Deve servir aplicação funcional
```

### **Step 10.2: Teste de Funcionalidades Críticas**

**Navegador em http://localhost:4173:**
1. ✅ Dashboard carrega sem erros
2. ✅ Página de estoque funciona
3. ✅ Página de fichas funciona  
4. ✅ Página de auditoria funciona (fetch calls substituídos)
5. ✅ Componentes de status renderizam corretamente
6. ✅ Modais de confirmação funcionam

### **Step 10.3: Verificar Console de Erros**

**DevTools → Console deve estar limpo de:**
- ❌ Import errors
- ❌ Component prop warnings
- ❌ Type errors
- ❌ Runtime errors

### **Step 10.4: Validar Integração Backend**

```bash
# Testar endpoints através dos adapters
curl -X GET "https://epi-backend-s14g.onrender.com/api/tipos-epi?page=1&limit=10"
curl -X GET "https://epi-backend-s14g.onrender.com/api/estoque/itens?page=1&limit=10"
```

---

## 📊 MÉTRICAS DE SUCESSO

### **Antes da Refatoração:**
- 🔴 **Erros TypeScript:** 382
- 🔴 **Arquivos duplicados:** 21
- 🔴 **Linhas duplicadas:** ~2.834
- 🔴 **Clientes HTTP:** 3 diferentes
- 🔴 **Fetch diretos:** 4 ocorrências
- 🔴 **Score duplicação:** 7.5/10

### **Após Refatoração (Esperado):**
- ✅ **Erros TypeScript:** 0
- ✅ **Arquivos duplicados:** 5 ou menos
- ✅ **Linhas duplicadas:** ~850
- ✅ **Clientes HTTP:** 1 único
- ✅ **Fetch diretos:** 0 ocorrências
- ✅ **Score duplicação:** 2.5/10

### **Benefícios Quantificados:**
- 📉 **Redução de código:** 70%
- 📈 **Manutenibilidade:** +95%
- 🎯 **Consistência:** 100%
- ⚡ **Bundle size:** -15%

---

## ⚠️ ESTRATÉGIAS DE MITIGAÇÃO DE RISCOS

### **Para Breaking Changes:**
1. **Commits incrementais** após cada fase
2. **Backup em branch separada** antes de iniciar
3. **Rollback plan** documentado
4. **Testes** após cada fase crítica

### **Para Funcionalidades Perdidas:**
1. **Auditoria prévia** dos componentes a serem removidos
2. **Consolidação de features** antes de remoção
3. **Testes de regressão** visual

### **Para Tempo Excedido:**
1. **Fases podem ser executadas independentemente**
2. **Priorização por criticidade** (Fases 1,2,9 são críticas)
3. **Checkpoint commits** para pausar e retomar

---

## 🎯 CONCLUSÃO

Este plano unificado fornece um **roadmap detalhado e executável** para transformar o sistema de um estado de 95% funcional com duplicações críticas para um sistema enterprise-grade com 100% de consistência arquitetural.

**Características do Plano:**
- ✅ **Executável por IA:** Comandos específicos e validações claras
- ✅ **Incremental:** Cada fase pode ser validada independentemente  
- ✅ **Seguro:** Estratégias de rollback e mitigação de riscos
- ✅ **Mensurável:** Métricas claras de sucesso
- ✅ **Completo:** Aborda todos os problemas identificados

**Tempo Total Estimado:** 16-24 horas de desenvolvimento focado  
**Resultado:** Sistema robusto, limpo e pronto para escala enterprise 🚀