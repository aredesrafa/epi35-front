# 📋 Plano de Refatoração da Página /notas
**Duração Estimada:** 7-11 horas  
**Complexidade:** Alta  
**Data:** 07 de Janeiro de 2025

## 🎯 Objetivo

Refatorar completamente a página `/notas` para criar uma experiência unificada de criação/edição de notas de movimentação, permitindo que o usuário adicione itens primeiro antes de preencher dados burocráticos, com integração completa ao backend PostgreSQL real.

## 🚨 Problemas Identificados

### **Problemas Atuais:**
1. **❌ Processo em duas etapas**: Criar nota → adicionar itens separadamente
2. **❌ Modal desconectado**: Não permite gerenciar itens dentro da criação
3. **❌ Dados mockados**: Almoxarifados hardcoded ao invés de API real
4. **❌ UX não intuitiva**: Usuário deve preencher burocracia antes dos itens
5. **❌ Backend mal integrado**: Não utiliza endpoints completos disponíveis

### **Endpoints Backend Disponíveis:**
- ✅ `GET /api/notas-movimentacao` - Listagem com filtros
- ✅ `POST /api/notas-movimentacao` - Criar nota
- ✅ `PUT /api/notas-movimentacao/:id` - Atualizar nota
- ✅ `DELETE /api/notas-movimentacao/:id` - Deletar nota
- ✅ `POST /api/notas-movimentacao/:id/itens` - Adicionar item
- ✅ `PUT /api/notas-movimentacao/:id/itens/:itemId` - Atualizar quantidade
- ✅ `DELETE /api/notas-movimentacao/:id/itens/:itemId` - Remover item
- ✅ `POST /api/notas-movimentacao/:id/concluir` - Processar nota
- ✅ `POST /api/notas-movimentacao/:id/cancelar` - Cancelar nota

## 📋 Estrutura de Dados Backend (Análise Realizada)

### **Tabela `notas_movimentacao`:**
```sql
- id: uuid (PK)
- almoxarifado_id: uuid (FK -> almoxarifados.id) -- OBRIGATÓRIO
- almoxarifado_destino_id: uuid (FK -> almoxarifados.id) -- Apenas TRANSFERENCIA
- responsavel_id: uuid (FK -> usuarios.id) -- Auto-preenchido pelo backend
- tipo_nota: enum('ENTRADA', 'TRANSFERENCIA', 'DESCARTE', 'ENTRADA_AJUSTE', 'SAIDA_AJUSTE')
- status: enum('RASCUNHO', 'CONCLUIDA', 'CANCELADA') -- Default: RASCUNHO
- numero_documento: varchar(255) -- OPCIONAL
- data_documento: date -- Default: current_date
- observacoes: text -- OPCIONAL
- created_at: timestamp
```

### **Tabela `nota_movimentacao_itens`:**
```sql
- id: uuid (PK)
- nota_movimentacao_id: uuid (FK)
- quantidade: integer -- OBRIGATÓRIO
- estoque_item_id: uuid -- Para SAÍDAS/TRANSFERÊNCIAS
- tipo_epi_id: uuid -- Para ENTRADAS
- custo_unitario: numeric(12,2) -- Para ENTRADAS
```

### **Fluxo de Estados:**
1. **RASCUNHO**: Nota criada, pode adicionar/remover itens
2. **CONCLUIDA**: Gera movimentações de estoque automaticamente
3. **CANCELADA**: Não pode ser modificada

## 🏗️ Nova Arquitetura Proposta

### **Fluxo UX Redesenhado:**
```
1. Usuário seleciona "Nova Nota [Tipo]"
2. Modal abre em "Modo Itens" (principal)
3. Usuário adiciona/remove itens conforme necessário
4. Usuário clica "Salvar Rascunho" OU "Próximo: Dados da Nota"
5. Se "Próximo", muda para "Modo Dados" (secundário)
6. Usuário preenche campos burocráticos
7. Salva como RASCUNHO ou diretamente CONCLUÍDA
```

### **Modal com 2 Modos:**
- **🏗️ Modo Itens** (Principal): Gerenciamento de itens da nota
- **📋 Modo Dados** (Secundário): Campos burocráticos (número doc, data, obs)

---

## 📱 FASE 1: Criar Adapters de Suporte (2-3 horas)

### **Step 1.1: Criar AlmoxarifadosAdapter**
**Arquivo:** `src/lib/services/entity/almoxarifadosAdapter.ts`

```typescript
export interface Almoxarifado {
  id: string;
  nome: string;
  unidade_negocio_id: string;
  is_principal: boolean;
  created_at: string;
  unidade_negocio?: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export interface AlmoxarifadoSelectOption {
  value: string;
  label: string;
  isPrincipal?: boolean;
  unidadeNegocio?: string;
}

class AlmoxarifadosAdapter {
  private baseEndpoint = '/estoque/almoxarifados';

  async listarAlmoxarifados(): Promise<Almoxarifado[]> {
    const response = await api.get<{
      success: boolean;
      data: Almoxarifado[];
    }>(this.baseEndpoint);
    return response.data;
  }

  async obterOpcoesSelect(): Promise<AlmoxarifadoSelectOption[]> {
    const almoxarifados = await this.listarAlmoxarifados();
    return almoxarifados.map(alm => ({
      value: alm.id,
      label: alm.nome,
      isPrincipal: alm.is_principal,
      unidadeNegocio: alm.unidade_negocio?.nome
    }));
  }
}

export const almoxarifadosAdapter = new AlmoxarifadosAdapter();
```

### **Step 1.2: Criar TiposEpiAdapter para Itens**
**Arquivo:** `src/lib/services/entity/tiposEpiAdapter.ts`

```typescript
export interface TipoEpiSelectOption {
  value: string;
  label: string;
  categoria: string;
  numeroCA: string;
  custoUnitario?: number;
}

class TiposEpiAdapter {
  private baseEndpoint = '/tipos-epi';

  async obterOpcoesSelect(): Promise<TipoEpiSelectOption[]> {
    const response = await api.get<{
      success: boolean;
      data: {
        items: Array<{
          id: string;
          nome_equipamento: string;
          numero_ca: string;
          categoria: string;
          custo_unitario?: number;
        }>;
      };
    }>(`${this.baseEndpoint}?limit=100`);

    return response.data.items.map(tipo => ({
      value: tipo.id,
      label: `${tipo.nome_equipamento} (CA: ${tipo.numero_ca})`,
      categoria: tipo.categoria,
      numeroCA: tipo.numero_ca,
      custoUnitario: tipo.custo_unitario
    }));
  }
}

export const tiposEpiAdapter = new TiposEpiAdapter();
```

### **Step 1.3: Criar EstoqueItensAdapter para Saídas**
**Arquivo:** `src/lib/services/entity/estoqueItensAdapter.ts`

```typescript
export interface EstoqueItemOption {
  value: string;
  label: string;
  quantidade: number;
  equipamento: string;
  categoria: string;
  numeroCA: string;
  almoxarifado: string;
}

class EstoqueItensAdapter {
  private baseEndpoint = '/estoque/itens';

  async obterItensDisponiveisParaSaida(almoxarifadoId: string): Promise<EstoqueItemOption[]> {
    const response = await api.get<{
      success: boolean;
      data: {
        items: Array<{
          id: string;
          quantidade: number;
          tipo_epi: {
            id: string;
            nome_equipamento: string;
            numero_ca: string;
            categoria: string;
          };
          almoxarifado: {
            id: string;
            nome: string;
          };
        }>;
      };
    }>(`${this.baseEndpoint}?almoxarifado_id=${almoxarifadoId}&status=DISPONIVEL`);

    return response.data.items
      .filter(item => item.quantidade > 0)
      .map(item => ({
        value: item.id,
        label: `${item.tipo_epi.nome_equipamento} - ${item.quantidade} disponível`,
        quantidade: item.quantidade,
        equipamento: item.tipo_epi.nome_equipamento,
        categoria: item.tipo_epi.categoria,
        numeroCA: item.tipo_epi.numero_ca,
        almoxarifado: item.almoxarifado.nome
      }));
  }
}

export const estoqueItensAdapter = new EstoqueItensAdapter();
```

---

## 🎨 FASE 2: Refatorar NotesFormModalPresenter (3-4 horas)

### **Step 2.1: Criar Componente de Gerenciamento de Itens**
**Arquivo:** `src/lib/components/presenters/NotaItensManager.svelte`

```typescript
interface NotaItem {
  id?: string; // Para itens já salvos
  temp_id: string; // ID temporário local
  quantidade: number;
  estoque_item_id?: string; // Para saídas
  tipo_epi_id?: string; // Para entradas
  custo_unitario?: number; // Para entradas
  // Campos derivados para exibição
  equipamento_nome: string;
  categoria?: string;
  numero_ca?: string;
  quantidade_disponivel?: number; // Para validação
}

// Props
export let tipo: TipoNotaEnum;
export let almoxarifadoId: string;
export let almoxarifadoDestinoId?: string;
export let itens: NotaItem[] = [];
export let readonly = false;

// Estados
let addingItem = false;
let tipoEpiOptions: TipoEpiSelectOption[] = [];
let estoqueItensOptions: EstoqueItemOption[] = [];

// Funções principais
function handleAdicionarItem() { /* ... */ }
function handleRemoverItem(tempId: string) { /* ... */ }
function handleQuantidadeChange(tempId: string, novaQuantidade: number) { /* ... */ }
```

### **Step 2.2: Refatorar NotesFormModalPresenter - Modal Dual**
**Arquivo:** `src/lib/components/presenters/NotesFormModalPresenter.svelte`

```typescript
// Estados do Modal Dual
let modalMode: 'itens' | 'dados' = 'itens';
let itensTemp: NotaItem[] = [];

// Computed Properties
$: isEntrada = formData.tipo_nota === 'ENTRADA' || formData.tipo_nota === 'ENTRADA_AJUSTE';
$: isSaida = formData.tipo_nota === 'DESCARTE' || formData.tipo_nota === 'SAIDA_AJUSTE';
$: isTransferencia = formData.tipo_nota === 'TRANSFERENCIA';

$: canProceedToDados = itensTemp.length > 0 && formData.almoxarifado_id;
$: canSaveRascunho = formData.almoxarifado_id; // Mínimo para rascunho
$: canConcluir = canProceedToDados && formData.data_documento;

// Estrutura do Modal
{#if modalMode === 'itens'}
  <!-- Modo Itens: Foco na adição/remoção de itens -->
  <NotaItensManager
    tipo={formData.tipo_nota}
    almoxarifadoId={formData.almoxarifado_id}
    almoxarifadoDestinoId={formData.almoxarifado_destino_id}
    bind:itens={itensTemp}
    {readonly}
  />
  
  <div slot="footer">
    <Button on:click={handleSalvarRascunho} disabled={!canSaveRascunho}>
      Salvar Rascunho
    </Button>
    <Button on:click={() => modalMode = 'dados'} disabled={!canProceedToDados}>
      Próximo: Dados da Nota
    </Button>
  </div>
  
{:else if modalMode === 'dados'}
  <!-- Modo Dados: Foco nos campos burocráticos -->
  <!-- Campos: numero_documento, data_documento, observacoes -->
  
  <div slot="footer">
    <Button on:click={() => modalMode = 'itens'}>
      Voltar: Itens
    </Button>
    <Button on:click={handleSalvarRascunho}>
      Salvar Rascunho
    </Button>
    <Button on:click={handleConcluirNota} disabled={!canConcluir}>
      Concluir Nota
    </Button>
  </div>
{/if}
```

### **Step 2.3: Implementar Lógica de Persistência Inteligente**

```typescript
async function handleSalvarRascunho(): Promise<void> {
  // Estratégia: salvar nota + itens de forma atômica
  try {
    let notaId: string;
    
    if (selectedNota?.id) {
      // Nota existente: atualizar
      await notasMovimentacaoAdapter.atualizarNota(selectedNota.id, {
        numero_documento: formData.numero_documento,
        data_documento: formData.data_documento,
        observacoes: formData.observacoes
      });
      notaId = selectedNota.id;
    } else {
      // Nova nota: criar primeiro
      const response = await notasMovimentacaoAdapter.criarNota(formData);
      notaId = response.data.id;
    }
    
    // Sincronizar itens
    await sincronizarItens(notaId, itensTemp);
    
    dispatch('salvar', { notaId, modo: 'rascunho' });
  } catch (error) {
    // Error handling
  }
}

async function sincronizarItens(notaId: string, itens: NotaItem[]): Promise<void> {
  // 1. Buscar itens atuais da nota
  const notaCompleta = await notasMovimentacaoAdapter.obterNota(notaId);
  const itensExistentes = notaCompleta.itens || [];
  
  // 2. Remover itens que não estão mais na lista temp
  for (const existente of itensExistentes) {
    const ainda_existe = itens.find(temp => temp.id === existente.id);
    if (!ainda_existe) {
      await notasMovimentacaoAdapter.removerItem(notaId, existente.id);
    }
  }
  
  // 3. Adicionar/atualizar itens da lista temp
  for (const temp of itens) {
    if (temp.id) {
      // Item existente: verificar se quantidade mudou
      const existente = itensExistentes.find(e => e.id === temp.id);
      if (existente && existente.quantidade !== temp.quantidade) {
        await notasMovimentacaoAdapter.atualizarQuantidade(
          notaId, 
          temp.tipo_epi_id || temp.estoque_item_id!, 
          temp.quantidade
        );
      }
    } else {
      // Novo item: adicionar
      await notasMovimentacaoAdapter.adicionarItem(notaId, {
        tipo_epi_id: temp.tipo_epi_id,
        estoque_item_id: temp.estoque_item_id,
        quantidade: temp.quantidade,
        custo_unitario: temp.custo_unitario
      });
    }
  }
}
```

---

## 🔄 FASE 3: Atualizar NotesContainer (1-2 horas)

### **Step 3.1: Simplificar Container Logic**

```typescript
// Simplificar handlers - Modal agora gerencia própria complexidade
function handleNovaNota(tipo: TipoNotaEnum): void {
  selectedNota = null;
  modalMode = 'create';
  modalTipo = tipo;
  showNotaModal = true;
}

// Novo handler para salvamento unificado
async function handleFormSave(event: { notaId: string, modo: 'rascunho' | 'concluida' }): Promise<void> {
  try {
    if (event.modo === 'concluida') {
      await handleConcluirNota({ id: event.notaId } as NotaMovimentacao);
    }
    
    // Recarregar listagem
    notesStore.reload();
    showNotaModal = false;
    
    const mensagem = event.modo === 'rascunho' ? 'Rascunho salvo' : 'Nota concluída';
    notify.success(mensagem);
  } catch (error) {
    console.error('Erro ao salvar:', error);
    notify.error('Erro ao salvar nota');
  }
}
```

### **Step 3.2: Atualizar Props do Modal**

```svelte
<NotesFormModalPresenter
  show={showNotaModal}
  mode={modalMode}
  tipo={modalTipo}
  title={modalTitle}
  nota={selectedNota}
  loading={notaFormLoading}
  on:salvar={handleFormSave}
  on:cancelar={handleFormCancel}
/>
```

---

## 📊 FASE 4: Atualizar NotesTablePresenter (1 hora)

### **Step 4.1: Adicionar Colunas de Itens**

```svelte
<TableHeadCell>Tipo</TableHeadCell>
<TableHeadCell>Número</TableHeadCell>
<TableHeadCell>Almoxarifado</TableHeadCell>
<TableHeadCell>Qtd. Itens</TableHeadCell> <!-- NOVA -->
<TableHeadCell>Valor Total</TableHeadCell> <!-- NOVA -->
<TableHeadCell>Status</TableHeadCell>
<TableHeadCell>Data</TableHeadCell>
<TableHeadCell>Ações</TableHeadCell>

<!-- Nas linhas -->
<TableBodyCell>
  <span class="text-sm text-gray-600">
    {item.total_itens || 0} {item.total_itens === 1 ? 'item' : 'itens'}
  </span>
</TableBodyCell>

<TableBodyCell>
  {#if item.valor_total}
    <span class="text-sm font-medium">
      R$ {item.valor_total.toFixed(2)}
    </span>
  {:else}
    <span class="text-xs text-gray-400">Não informado</span>
  {/if}
</TableBodyCell>
```

### **Step 4.2: Melhorar Actions Menu**

```svelte
<!-- Ações contextuais baseadas no status -->
{#if item.status === 'RASCUNHO'}
  <DropdownItem on:click={() => dispatch('editarNota', item)}>
    Editar
  </DropdownItem>
  <DropdownItem on:click={() => dispatch('concluirNota', item)}>
    Processar Nota
  </DropdownItem>
  <DropdownItem on:click={() => dispatch('excluirNota', item)}>
    Excluir
  </DropdownItem>
{:else if item.status === 'CONCLUIDA'}
  <DropdownItem on:click={() => dispatch('visualizarNota', item)}>
    Ver Detalhes
  </DropdownItem>
  <DropdownItem on:click={() => dispatch('verMovimentacoes', item)}>
    Ver Movimentações
  </DropdownItem>
{:else if item.status === 'CANCELADA'}
  <DropdownItem on:click={() => dispatch('visualizarNota', item)}>
    Ver Detalhes
  </DropdownItem>
{/if}
```

---

## ⚡ FASE 5: Melhorar Integração Backend (1-2 horas)

### **Step 5.1: Atualizar NotasMovimentacaoAdapter**

```typescript
// Novo método para obter nota com itens completos
async obterNotaCompleta(id: string): Promise<NotaMovimentacao> {
  const response = await api.get<{
    success: boolean;
    data: NotaMovimentacao & {
      itens: NotaMovimentacaoItem[];
      almoxarifado: { nome: string };
      almoxarifado_destino?: { nome: string };
      responsavel: { nome: string };
    };
  }>(`${this.baseEndpoint}/${id}?include=itens,almoxarifado,responsavel`);
  
  return response.data;
}

// Método para validar nota antes de processar
async validarProcessamento(id: string): Promise<{
  pode_processar: boolean;
  motivos?: string[];
  avisos?: string[];
}> {
  const response = await api.get<{
    success: boolean;
    data: {
      pode_processar: boolean;
      motivos?: string[];
      avisos?: string[];
    };
  }>(`${this.baseEndpoint}/${id}/validar-processamento`);
  
  return response.data;
}
```

### **Step 5.2: Implementar Cache Inteligente**

```typescript
// Cache para opções de seleção (TTL 10 minutos)
private optionsCache = new Map<string, { data: any; timestamp: number }>();

async obterOpcoesAlmoxarifados(): Promise<AlmoxarifadoSelectOption[]> {
  const cacheKey = 'almoxarifados_options';
  const TTL = 10 * 60 * 1000; // 10 minutos
  
  const cached = this.optionsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < TTL) {
    return cached.data;
  }
  
  const fresh = await almoxarifadosAdapter.obterOpcoesSelect();
  this.optionsCache.set(cacheKey, { data: fresh, timestamp: Date.now() });
  return fresh;
}
```

---

## 🧪 FASE 6: Testes e Refinamentos (1-2 horas)

### **Step 6.1: Teste de Fluxos Principais**

```typescript
// Checklist de testes manuais:

// ✅ Teste 1: Criar nota de entrada
// 1. Clicar "Nova Entrada"
// 2. Modal abre em modo "itens"
// 3. Selecionar almoxarifado
// 4. Adicionar 2-3 tipos de EPI com quantidades
// 5. Clicar "Salvar Rascunho" - deve criar nota em RASCUNHO
// 6. Verificar na listagem

// ✅ Teste 2: Completar nota via modo "dados"
// 1. A partir do teste 1, clicar "Próximo: Dados"
// 2. Preencher número do documento e observações
// 3. Clicar "Concluir Nota"
// 4. Verificar status muda para CONCLUIDA
// 5. Verificar que não pode mais editar

// ✅ Teste 3: Transferência entre almoxarifados
// 1. Criar nota TRANSFERENCIA
// 2. Selecionar almoxarifado origem e destino diferentes
// 3. Adicionar itens do estoque disponível
// 4. Verificar validação de quantidade disponível
// 5. Processar e verificar movimentações criadas

// ✅ Teste 4: Edição de rascunho
// 1. Criar nota em rascunho
// 2. Fechar modal
// 3. Editar nota na listagem
// 4. Modal deve abrir com itens carregados
// 5. Adicionar/remover itens
// 6. Salvar alterações

// ✅ Teste 5: Validações de negócio
// 1. Tentar transferência para mesmo almoxarifado (deve bloquear)
// 2. Tentar saída com quantidade > disponível (deve avisar)
// 3. Tentar processar nota sem itens (deve bloquear)
```

### **Step 6.2: Tratamento de Erros Robustos**

```typescript
// Error handling centralizado
class NotaFormErrorHandler {
  static handleApiError(error: any): string {
    if (error.response?.status === 400) {
      return error.response.data?.message || 'Dados inválidos';
    } else if (error.response?.status === 409) {
      return 'Conflito: verifique se os dados não foram alterados por outro usuário';
    } else if (error.response?.status === 422) {
      return 'Estoque insuficiente ou regras de negócio violadas';
    } else {
      return 'Erro interno do servidor. Tente novamente.';
    }
  }
}
```

---

## 📈 Benefícios Esperados

### **UX Melhorado:**
- ✅ Fluxo unificado: itens primeiro, burocracia depois
- ✅ Rascunhos inteligentes: salvar progresso a qualquer momento
- ✅ Validação em tempo real: verificar estoque disponível
- ✅ Modal dual: foco no que importa em cada etapa

### **Integração Backend Completa:**
- ✅ Dados reais: almoxarifados, tipos EPI, estoque disponível
- ✅ API especializada: uso correto de todos os endpoints
- ✅ Cache inteligente: performance otimizada
- ✅ Error handling: feedback claro para o usuário

### **Código Limpo:**
- ✅ Separação clara: Container (lógica) + Presenters (UI)
- ✅ Adapters especializados: cada responsabilidade isolada
- ✅ Type safety: interfaces que refletem backend real
- ✅ Manutenibilidade: estrutura escalável

---

## 🎯 Critérios de Aceitação

### **Must Have:**
1. ✅ Modal permite adicionar itens antes de dados burocráticos
2. ✅ Rascunhos salvos automaticamente mantêm itens
3. ✅ Transferências validam almoxarifados origem ≠ destino
4. ✅ Saídas validam quantidade ≤ estoque disponível
5. ✅ Integração 100% com backend real (zero mocks)

### **Should Have:**
6. ✅ Cache de opções para performance
7. ✅ Feedback visual durante operações
8. ✅ Validação em tempo real
9. ✅ Error handling robusto

### **Could Have:**
10. ✅ Shortcuts de teclado no modal
11. ✅ Auto-save de rascunhos
12. ✅ Histórico de alterações

---

## ⏱️ Cronograma Detalhado

| Fase | Duração | Atividades |
|------|---------|------------|
| **FASE 1** | 2-3h | Criar adapters de suporte (Almoxarifados, TiposEPI, EstoqueItens) |
| **FASE 2** | 3-4h | Refatorar modal dual (NotaItensManager + NotesFormModalPresenter) |
| **FASE 3** | 1-2h | Atualizar Container logic para novo fluxo |
| **FASE 4** | 1h | Melhorar TablePresenter com novas colunas |
| **FASE 5** | 1-2h | Completar integração backend + cache |
| **FASE 6** | 1-2h | Testes completos + refinamentos |

**Total:** 9-14 horas (estimativa conservadora: **11 horas**)

---

## 🚨 Riscos e Mitigações

### **Risco 1: Backend API diferente do esperado**
**Mitigação:** Validar endpoints reais primeiro via Swagger docs

### **Risco 2: Performance com muitos almoxarifados/tipos EPI**
**Mitigação:** Implementar cache + pagination nas opções de seleção

### **Risco 3: Complexidade do modal dual**
**Mitigação:** Implementar em etapas, testando cada modo isoladamente

### **Risco 4: Estado inconsistente entre itens temp vs backend**
**Mitigação:** Método `sincronizarItens()` atomicamente gerencia diferenças

---

## 📝 Conclusão

Este plano transforma a página `/notas` de um sistema fragmentado em duas etapas para uma experiência unificada, intuitiva e completamente integrada com o backend PostgreSQL. O foco na UX (itens primeiro, burocracia depois) junto com a arquitetura robusta (Container/Presenter + adapters especializados) resulta em um sistema enterprise-grade pronto para produção.

**Resultado Final:** Página `/notas` com fluxo unificado, modal dual inteligente, integração backend completa e experiência de usuário superior. 🚀