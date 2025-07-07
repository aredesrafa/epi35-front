# Plano de Implementação: Sistema de Relatórios Frontend
**Data**: 06/07/2025  
**Status**: Planejamento  
**Arquitetura**: Container/Presenter Pattern com Service Adapters

## 📊 Análise dos Endpoints Disponíveis

### **Endpoints de Dashboard/Métricas**
1. `/api/relatorios/dashboard` - Dashboard geral com métricas
2. `/api/relatorios/dashboard/estatisticas-entregas` - Estatísticas de entregas
3. `/api/relatorios/dashboard/vencimentos-proximos` - Próximos vencimentos

### **Endpoints de Relatórios Específicos**
4. `/api/relatorios/descartes` - Relatório detalhado de descartes
5. `/api/relatorios/descartes/estatisticas` - Estatísticas de descartes
6. `/api/relatorios/saude` - Saúde do sistema

## 🎯 Estrutura de Menu Proposta

### **Menu Principal: Relatórios (Dropdown)**
```
📊 Relatórios
├── 📈 Dashboard Executivo
├── 🗑️ Relatório de Descartes
├── ⚕️ Saúde do Sistema
└── 📋 Relatórios Personalizados
```

## 📄 Especificação das Páginas

### **1. Dashboard Executivo** (`/relatorios/dashboard`)
**Objetivo**: Visão geral executiva com métricas principais e KPIs

**Layout**: Grid responsivo com cards de métricas

**Seções**:
- **Indicadores Gerais**: Total colaboradores, fichas ativas, alertas
- **Estatísticas de Entregas**: Gráficos de tendência, volumes
- **Alertas de Vencimento**: Lista de EPIs próximos ao vencimento
- **Filtros Disponíveis**:
  - Período (7d, 30d, 90d, 1a, customizado)
  - Almoxarifado (dropdown dinâmico)
  - Unidade de Negócio (dropdown dinâmico)

**Componentes**:
- `DashboardExecutivoContainer.svelte` (Container)
- `MetricasCardsPresenter.svelte` (Cards de métricas)
- `GraficoEntregasPresenter.svelte` (Gráfico de entregas)
- `VencimentosListPresenter.svelte` (Lista de vencimentos)

### **2. Relatório de Descartes** (`/relatorios/descartes`)
**Objetivo**: Análise completa de descartes de EPIs

**Layout**: Tabela paginada com filtros laterais + resumo estatístico

**Seções**:
- **Filtros Avançados**:
  - Data início/fim (date pickers)
  - Responsável (dropdown de usuários)
  - Contratada (dropdown de empresas)
  - Tipo de EPI (dropdown de categorias)
  - Almoxarifado (dropdown de locais)
- **Tabela de Descartes**:
  - Data, Responsável, EPI, Quantidade, Motivo, Valor
  - Ordenação por colunas
  - Paginação server-side
- **Estatísticas Resumo**:
  - Total descartado (últimos 30 dias)
  - Valor total perdido
  - Top 5 motivos de descarte
  - Gráfico de tendência mensal

**Componentes**:
- `DescartesContainer.svelte` (Container)
- `DescartesFiltersPresenter.svelte` (Filtros laterais)
- `DescartesTablePresenter.svelte` (Tabela paginada)
- `DescartesStatsPresenter.svelte` (Estatísticas)

### **3. Saúde do Sistema** (`/relatorios/saude`)
**Objetivo**: Monitoramento técnico e performance do sistema

**Layout**: Dashboard técnico com indicadores de sistema

**Seções**:
- **Status Geral**: Verde/Amarelo/Vermelho
- **Performance**: Tempo de resposta, uptime, uso de recursos
- **Conectividade**: Status da base de dados, APIs externas
- **Logs Recentes**: Últimos erros/avisos do sistema
- **Filtros**:
  - incluirPerformance (toggle)
  - Período de análise

**Componentes**:
- `SaudeSistemaContainer.svelte` (Container)
- `StatusGeralPresenter.svelte` (Cards de status)
- `PerformanceChartsPresenter.svelte` (Gráficos técnicos)
- `LogsRecentesPresenter.svelte` (Lista de logs)

### **4. Relatórios Personalizados** (`/relatorios/personalizados`)
**Objetivo**: Interface para criar relatórios sob demanda

**Layout**: Formulário de construção + preview/export

**Seções**:
- **Builder de Relatório**:
  - Seleção de tipo (fichas, estoque, entregas, etc.)
  - Configuração de filtros dinâmicos
  - Escolha de campos/colunas
  - Agrupamentos e ordenações
- **Preview**: Amostra dos dados
- **Export**: PDF, Excel, CSV

**Componentes**:
- `RelatoriosPersonalizadosContainer.svelte` (Container)
- `ReportBuilderPresenter.svelte` (Construtor)
- `ReportPreviewPresenter.svelte` (Preview)
- `ExportOptionsPresenter.svelte` (Opções de export)

## 🏗️ Arquitetura Técnica

### **Service Adapters**
```typescript
// src/lib/services/reporting/
├── reportingQueryAdapter.ts     // Adapter principal
├── dashboardAdapter.ts          // Métricas de dashboard
├── descartesAdapter.ts          // Relatórios de descarte
├── saudeAdapter.ts              // Saúde do sistema
└── exportAdapter.ts             // Exportação de relatórios
```

### **Stores Especializados**
```typescript
// src/lib/stores/reporting/
├── dashboardStore.ts            // Estado do dashboard
├── descartesStore.ts            // Dados de descartes
├── filtersStore.ts              // Filtros globais
└── exportStore.ts               // Status de exportações
```

### **Types e Interfaces**
```typescript
// src/lib/types/reporting/
├── dashboardTypes.ts            // DTOs do dashboard
├── descartesTypes.ts            // DTOs de descartes
├── saudeTypes.ts                // DTOs de saúde
└── filtersTypes.ts              // Tipos de filtros
```

## 📱 Especificação de UX/UI

### **Design Patterns**
- **Container/Presenter**: Separação clara entre lógica e apresentação
- **Filtros Consistentes**: Mesmo padrão visual em todos os relatórios
- **Loading States**: Skeletons para carregamento
- **Error Handling**: Tratamento gracioso de erros
- **Responsive Design**: Mobile-first approach

### **Componentes Reutilizáveis**
- `ReportFilter.svelte` - Filtro padrão
- `ReportCard.svelte` - Card de métrica
- `ExportButton.svelte` - Botão de exportação
- `DateRangePicker.svelte` - Seletor de período
- `ReportTable.svelte` - Tabela paginada padrão

### **Estados de Interface**
- **Loading**: Skeleton loaders
- **Empty**: Ilustrações de "sem dados"
- **Error**: Mensagens de erro com retry
- **Success**: Feedback de ações bem-sucedidas

## 🚀 Plano de Execução

### **Fase 1: Infraestrutura (2-3 dias)**
1. ✅ Criação dos service adapters
2. ✅ Configuração de stores especializados
3. ✅ Definição de types e interfaces
4. ✅ Componentes base reutilizáveis

### **Fase 2: Dashboard Executivo (2 dias)**
1. ✅ Implementação do container principal
2. ✅ Cards de métricas responsivos
3. ✅ Gráficos de entregas (Chart.js ou similar)
4. ✅ Lista de vencimentos próximos
5. ✅ Sistema de filtros

### **Fase 3: Relatório de Descartes (2 dias)**
1. ✅ Interface de filtros avançados
2. ✅ Tabela paginada com dados reais
3. ✅ Estatísticas de resumo
4. ✅ Funcionalidade de exportação

### **Fase 4: Saúde do Sistema (1 dia)**
1. ✅ Dashboard técnico
2. ✅ Indicadores de performance
3. ✅ Logs do sistema

### **Fase 5: Relatórios Personalizados (3 dias)**
1. ✅ Builder de relatórios
2. ✅ Sistema de preview
3. ✅ Múltiplos formatos de export
4. ✅ Salvamento de templates

### **Fase 6: Polimento e Testes (1 dia)**
1. ✅ Responsividade mobile
2. ✅ Testes de integração
3. ✅ Performance optimization
4. ✅ Documentação

## 🔧 Integração com Backend

### **Parâmetros Padrão**
Todos os relatórios suportarão filtros base:
- `periodo`: Enum de períodos
- `almoxarifadoId`: UUID do almoxarifado
- `unidadeNegocioId`: UUID da unidade de negócio

### **Filtros Específicos por Relatório**
- **Descartes**: `responsavelId`, `contratadaId`, `tipoEpiId`, `dataInicio`, `dataFim`
- **Saúde**: `incluirPerformance`

### **Formato de Resposta Padronizado**
```typescript
interface ReportResponse<T> {
  success: boolean;
  data: T;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    generatedAt: string;
  };
  message?: string;
}
```

## 📊 Métricas de Sucesso

### **Performance**
- Tempo de carregamento < 2s
- Filtros responsivos < 500ms
- Exportação PDF < 5s

### **UX**
- Interface intuitiva (0 treinamento necessário)
- Filtros claros e objetivos
- Feedback visual constante

### **Funcionalidade**
- 100% dos endpoints cobertos
- Filtros funcionais
- Exportação em múltiplos formatos
- Mobile-friendly

## 📝 Considerações Técnicas

### **Cache Strategy**
- Cache de 5 minutos para dados de dashboard
- Cache de 1 hora para dados de configuração
- Invalidação automática em updates

### **Error Handling**
- Retry automático para falhas de rede
- Fallback para dados em cache
- Mensagens de erro user-friendly

### **Security**
- Validação de parâmetros no frontend
- Sanitização de inputs
- Rate limiting awareness

---

**Próximos Passos**: 
1. Aprovação do plano
2. Implementação da Fase 1 (Infraestrutura)
3. Iteração baseada em feedback

**Estimativa Total**: 10-12 dias de desenvolvimento
**Prioridade**: Alta (sistema crítico para tomada de decisões)