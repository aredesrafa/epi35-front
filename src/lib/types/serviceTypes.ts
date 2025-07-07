/**
 * Tipos específicos para Service Adapters
 * 
 * DTOs e interfaces que espelham exatamente o backend PostgreSQL
 * para garantir compatibilidade total na integração futura.
 */

import type { PaginatedResponse, PaginationParams } from '$lib/stores/paginatedStore';

// ==================== ENTITY DTOs ====================

export interface ContratadaDTO {
  id: string;
  nome: string;
  cnpj: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  responsavel?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ColaboradorDTO {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  cargo: string;
  dataAdmissao: string;
  dataDesligamento?: string;
  contratadaId: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  // Dados expandidos
  contratada?: ContratadaDTO;
}

export interface TipoEPIDTO {
  id: string;
  // ✅ COMPATIBILIDADE: Suporta ambas estruturas do backend
  numeroCA?: string;        // v3.4 e anterior
  codigo?: string;          // v3.5+ (novo campo)
  nomeEquipamento?: string; // v3.4 e anterior  
  nome?: string;            // v3.5+ (novo campo)
  descricao?: string;
  fabricante?: string;
  categoria: string;
  vidaUtilDias?: number;
  validadeMeses?: number;   // v3.5+ (substitui vidaUtilDias)
  valorMedio?: number;
  observacoes?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlmoxarifadoDTO {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  endereco?: string;
  responsavel?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Alias para compatibilidade com código existente
export type Almoxarifado = AlmoxarifadoDTO;

export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'gerente' | 'usuario';
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== INVENTORY DTOs ====================

export interface ItemEstoqueDTO {
  id: string;
  tipoEPIId: string;
  almoxarifadoId: string;
  quantidade: number;
  localizacao?: string;
  dataValidade?: string;
  status: 'disponivel' | 'baixo' | 'vencendo' | 'vencido' | 'esgotado';
  dataUltimaMovimentacao: string;
  createdAt: string;
  updatedAt: string;
  // Dados expandidos (populados pelo backend quando solicitado)
  tipoEPI?: TipoEPIDTO;
  almoxarifado?: AlmoxarifadoDTO;
}

export interface MovimentacaoEstoqueDTO {
  id: string;
  tipoEPIId: string;
  almoxarifadoId: string;
  tipoMovimentacao: string; // Vem da configuração dinâmica
  quantidade: number;
  motivo: string;
  observacoes?: string;
  documentoReferencia?: string;
  dataMovimentacao: string;
  usuarioId: string;
  createdAt: string;
  // Dados expandidos
  tipoEPI?: TipoEPIDTO;
  almoxarifado?: AlmoxarifadoDTO;
  usuario?: UsuarioDTO;
}

// Interface para auditoria de movimentações com dados expandidos
export interface Movimentacao {
  id: string;
  estoqueOrigemId: string | null;
  estoqueDestinoId: string | null;
  tipoMovimentacao: string;
  quantidade: number;
  responsavel: string;
  motivo: string | null;
  observacoes: string | null;
  documentoOrigemId: string | null;
  documentoTipo: string | null;
  dataMovimentacao: string;
  transacaoId: string | null;
  createdAt: string;
  itemEstoqueId: string | null;
  itemFichaId: string | null;
  nomeEstoqueOrigem?: string | null;
  nomeEstoqueDestino?: string | null;
  nomeEPI?: string | null;
  nomeColaborador?: string | null;
}

export interface NotaMovimentacaoDTO {
  id: string;
  numero: string;
  tipo: string; // Tipo de nota - vem da configuração
  almoxarifadoId: string;
  descricao?: string;
  dataMovimentacao: string;
  usuarioId: string;
  processada: boolean;
  createdAt: string;
  updatedAt: string;
  // Dados expandidos
  itens?: NotaMovimentacaoItemDTO[];
  almoxarifado?: AlmoxarifadoDTO;
  usuario?: UsuarioDTO;
}

export interface NotaMovimentacaoItemDTO {
  id: string;
  notaMovimentacaoId: string;
  tipoEPIId: string;
  quantidade: number;
  valorUnitario?: number;
  observacoes?: string;
  // Dados expandidos
  tipoEPI?: TipoEPIDTO;
}

// ==================== PROCESS DTOs ====================

export interface FichaEPIDTO {
  id: string;
  colaboradorId: string;
  numeroFicha?: string; // Número da ficha formatado
  dataEmissao: string;
  dataValidade?: string;
  status: string; // Vem da configuração dinâmica
  observacoes?: string;
  ativo?: boolean;
  criadoEm: string;
  atualizadoEm: string;
  // Dados expandidos do colaborador
  colaborador: {
    id: string;
    nome: string;
    cpf: string;
    matricula?: string;
    cargo?: string;
    empresa?: string;
    setor?: string;
  };
  // ✨ NOVAS INFORMAÇÕES RICAS DO BACKEND
  contratada?: {
    id: string;
    nome: string;
    cnpj: string;
  };
  episInfo?: {
    totalEpisAtivos: number;
    episExpirados: number;
    proximaDataVencimento?: string;
    diasAteProximoVencimento?: number;
    tiposEpisAtivos: Array<{
      tipoEpiId: string;
      tipoEpiNome: string;
      quantidade: number;
    }>;
  };
  // Dados legados para compatibilidade
  entregas?: EntregaDTO[];
}

// Interface para dados detalhados de uma ficha (usada nos modals/drawers)
export interface FichaDetailData {
  id: string;
  colaboradorId: string;
  dataEmissao: string;
  status: string;
  colaborador: {
    id: string;
    nome: string;
    cpf: string;
    matricula: string;
    cargo: string;
    empresa: string;
  };
  equipamentosEmPosse: EquipamentoEmPosseItem[];
  entregas: any[];
  devolucoes: DevolucaoItem[];
  historico: HistoricoEventoItem[];
  proximosVencimentos: any[];
  // Campos opcionais para store reativo
  totalEquipamentosEmPosse?: number;
  totalDevolucoes?: number;
}

// Tipos auxiliares para FichaDetailData
export interface EquipamentoEmPosseItem {
  id: string;
  entregaItemId?: string; // ✅ NOVO: ID real do item no backend para devolução
  nomeEquipamento: string;
  registroCA: string;
  categoria: string;
  dataEntrega: string;
  status: string;
  quantidade: number;
  entregaId: string;
  prazoMaximoDevolucao: string;
  vencido: boolean;
  diasVencido?: number;
}

export interface DevolucaoItem {
  id: string;
  equipamentoId: string;
  nomeEquipamento: string;
  registroCA: string;
  dataDevolucao: string;
  motivo: string;
  observacoes?: string;
  quantidade: number;
  prazoOriginal: string;
  noPrazo: boolean;
  diasAtraso?: number;
}

export interface HistoricoEventoItem {
  id: string;
  tipo: 'entrega' | 'devolucao' | 'vencimento';
  acao: string; // ✅ ALINHADO: Campo usado pelo FichaDetailPresenter
  descricao: string;
  dataEvento: string; // ✅ ALINHADO: Campo usado pelo FichaDetailPresenter  
  responsavel: string;
  detalhes?: any; // ✅ NOVO: Campo para detalhes do evento
}

export interface EntregaDTO {
  id: string;
  fichaEPIId: string;
  dataEntrega: string;
  status: string; // Vem da configuração dinâmica
  assinatura?: string;
  dataAssinatura?: string;
  observacoes?: string;
  usuarioId: string;
  createdAt: string;
  updatedAt: string;
  // Dados expandidos
  fichaEPI?: FichaEPIDTO;
  itens?: EntregaItemDTO[];
  usuario?: UsuarioDTO;
}

export interface EntregaItemDTO {
  id: string;
  entregaId: string;
  tipoEPIId: string;
  itemEstoqueId: string;
  quantidade: number;
  dataValidade?: string;
  // ✅ CAMPOS BACKEND v3.5 (top-level)
  tipoEpiNome?: string;
  tipoEpiCodigo?: string; 
  tipoEpiCategoria?: string;
  quantidadeEntregue?: number;
  // Dados expandidos (v3.4 compatibilidade)
  tipoEPI?: TipoEPIDTO;
  itemEstoque?: ItemEstoqueDTO;
}

// ==================== REPORTING DTOs ====================

// Interface para o relatório de movimentações (event source completo)
// Baseada na documentação oficial do backend
export interface RelatorioMovimentacaoDTO {
  id: string;                    // UUID da movimentação
  data: string;                  // ISO date-time da movimentação
  almoxarifadoNome: string;      // Nome do almoxarifado
  tipoEpiNome: string;           // Nome do equipamento/EPI
  tipoMovimentacao: string;      // Tipo da operação (ENTRADA_NOTA, SAIDA_ENTREGA, etc.)
  quantidade: number;            // Quantidade movimentada
  usuarioNome: string;           // Nome do responsável
  observacoes?: string;          // Observações (opcional)
  documento?: string;            // Número do documento (opcional)
  entregaId?: string;            // ID da entrega (correlacionado via timestamp para SAIDA_ENTREGA)
  colaboradorNome?: string;      // Nome do colaborador (correlacionado via entrega para SAIDA_ENTREGA)
}

// Interface conforme documentação real do backend
export interface ResumoAuditoria {
  totalMovimentacoes: number;    // Total de registros
  totalEntradas: number;         // Soma das entradas
  totalSaidas: number;          // Soma das saídas
  saldoInicialPeriodo: number;  // Saldo inicial
  saldoFinalPeriodo: number;    // Saldo final
  variacao: number;             // Variação no período
}

export interface RelatorioMovimentacoesResponse {
  success: boolean;
  data: {
    movimentacoes: RelatorioMovimentacaoDTO[];
    resumo: ResumoAuditoria;
    dataGeracao: string;         // ISO date-time
  };
  message: string;
}

// Parâmetros para filtros de movimentações
export interface RelatorioMovimentacoesParams {
  almoxarifadoId?: string;
  tipoEpiId?: string;
  tipoMovimentacao?: string;
  usuarioId?: string;
  dataInicio?: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}

export interface RelatorioDescartesDTO {
  totalItens: number;
  totalValor: number;
  periodo: {
    inicio: string;
    fim: string;
  };
  categorias: Array<{
    categoria: string;
    quantidade: number;
    valor: number;
    percentual: number;
  }>;
  itens: Array<{
    tipoEPI: TipoEPIDTO;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    dataDescarte: string;
    motivo: string;
  }>;
}

export interface RelatorioEstoqueDTO {
  totalItens: number;
  totalTipos: number;
  valorTotal: number;
  status: {
    disponivel: number;
    baixo: number;
    vencendo: number;
    vencido: number;
    esgotado: number;
  };
  categorias: Array<{
    categoria: string;
    quantidade: number;
    tipos: number;
    valor: number;
  }>;
  itens: ItemEstoqueDTO[];
}

// ==================== FORM DTOs ====================

export interface NovaMovimentacaoForm {
  tipoEPIId: string;
  almoxarifadoId: string;
  tipoMovimentacao: string; // CRÍTICO: Não hardcoded - vem do configurationService
  quantidade: number;
  motivo: string;
  observacoes?: string;
  documentoReferencia?: string;
  itemEstoqueId?: string; // Para identificar qual item está sendo ajustado
}

export interface EstornoMovimentacaoForm {
  movimentacaoOriginalId: string;
  motivo: string;
}

export interface AjusteEstoqueForm {
  itemEstoqueId: string;
  novaQuantidade: number;
  quantidadeAnterior: number;
  motivo: string;
}

export interface TransferenciaEstoqueForm {
  itemId: string;
  almoxarifadoDestinoId: string;
  quantidade: number;
  motivo: string;
}

export interface NovaEntregaForm {
  fichaEPIId: string;
  itens: Array<{
    tipoEPIId: string;
    itemEstoqueId: string;
    quantidade: number;
  }>;
  observacoes?: string;
}

export interface AssinaturaEntregaForm {
  entregaId: string;
  assinatura: string;
}

export interface DevolucaoForm {
  entregaId: string;
  motivo: string;
  observacoes?: string;
}

// ==================== SPECIALIZED PARAMS ====================

/**
 * Parâmetros específicos para inventário
 */
export interface InventoryParams extends PaginationParams {
  tipoEPIId?: string;
  almoxarifadoId?: string;
  status?: string;
  categoria?: string;
  vencimento?: 'vencido' | 'vencendo' | 'valido';
  includeExpanded?: boolean; // Para incluir dados de tipoEPI e almoxarifado
}

/**
 * Parâmetros específicos para movimentações
 */
export interface MovementParams extends PaginationParams {
  itemEstoqueId?: string;
  tipoMovimentacao?: string;
  dataInicio?: string;
  dataFim?: string;
  usuarioId?: string;
  includeExpanded?: boolean;
}

/**
 * Parâmetros específicos para auditoria de movimentações
 */
export interface AuditoriaParams extends PaginationParams {
  estoqueOrigemId?: string;
  estoqueDestinoId?: string;
  tipoMovimentacao?: string;
  dataInicio?: string;
  dataFim?: string;
  almoxarifadoOrigemId?: string;
  almoxarifadoDestinoId?: string;
}

/**
 * Parâmetros específicos para relatórios
 */
export interface ReportParams {
  dataInicio?: string;
  dataFim?: string;
  categoria?: string;
  almoxarifadoId?: string;
  tipoEPIId?: string;
  includeDetalhes?: boolean;
}

/**
 * Parâmetros específicos para entidades hierárquicas
 */
export interface EntityParams extends PaginationParams {
  contratadaId?: string;
  ativo?: boolean;
  includeRelations?: boolean;
}

// ==================== RESPONSE WRAPPERS ====================

// Para responses paginadas específicas
export type PaginatedItemEstoque = PaginatedResponse<ItemEstoqueDTO>;
export type PaginatedMovimentacao = PaginatedResponse<MovimentacaoEstoqueDTO>;
export type PaginatedColaboradores = PaginatedResponse<ColaboradorDTO>;
export type PaginatedTiposEPI = PaginatedResponse<TipoEPIDTO>;
export type PaginatedFichasEPI = PaginatedResponse<FichaEPIDTO>;
export type PaginatedEntregas = PaginatedResponse<EntregaDTO>;

// ==================== ERROR TYPES ====================

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

export interface ValidationError extends ServiceError {
  field: string;
  value?: any;
}

// ==================== UTILITY TYPES ====================

/**
 * Tipo para criar forms a partir de DTOs
 */
export type CreateForm<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Tipo para atualizar forms a partir de DTOs
 */
export type UpdateForm<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Tipo para requests com dados expandidos
 */
export type WithExpanded<T, K extends keyof T> = T & {
  [P in K]: NonNullable<T[P]>;
};