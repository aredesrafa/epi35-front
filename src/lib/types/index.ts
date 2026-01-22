// Tipos equivalentes ao projeto React original
// Mantidos exatamente iguais para compatibilidade com API

export interface Holding {
  id: string;
  nome: string;
  cnpj: string;
  setor: string;
  status: "ativa" | "inativa";
}

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  status: "ativa" | "inativa";
  holdingId?: string;
  tipo: "holding" | "contratada";
}

export interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  cargo: string;
  empresa: string;
  dataAdmissao: string;
  empresaId: string;
  status: "ativo" | "afastado" | "desligado";
  temFichaAtiva: boolean;
}

export interface TipoEPI {
  id: string;
  numeroCA: string;
  nomeEquipamento: string;
  descricao: string;
  fabricante: string;
  categoria: string;
  vidaUtilDias: number;
  foto?: string;
}

// Estoque - Local de armazenamento (backend PostgreSQL)
export interface Estoque {
  id: string;
  nome: string;
  codigo: string;
  enderecoFisico?: string;
  tipoEstoque:
    | "fisico"
    | "virtual_devolucoes"
    | "virtual_descartes"
    | "virtual_preparacao";
  responsavel?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Item de Estoque (backend PostgreSQL)
export interface ItemEstoqueReal {
  id: string;
  tipoEpiId: string;
  estoqueId: string;
  numeroLote?: string;
  quantidade: number;
  dataFabricacao?: string;
  dataValidade?: string;
  custoUnitario?: number;
  fornecedor?: string;
  notaFiscal?: string;
  observacoes?: string;
  metadados?: any;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Movimentação de Estoque - Event Sourcing (backend PostgreSQL)
export interface MovimentacaoEstoque {
  id: string;
  itemEstoqueId?: string;
  itemFichaId?: string;
  estoqueOrigemId?: string;
  estoqueDestinoId?: string;
  tipoMovimentacao:
    | "entrada"
    | "saida_entrega"
    | "devolucao"
    | "transferencia"
    | "descarte"
    | "ajuste";
  quantidade: number;
  responsavel?: string;
  motivo?: string;
  observacoes?: string;
  documentoOrigemId?: string;
  documentoTipo?: string;
  dataMovimentacao: string;
  transacaoId?: string;
  loteId?: string;
  createdAt: string;
}

// Interface legada para compatibilidade (será removida gradualmente)
export interface ItemEstoque {
  id: string;
  tipoEPIId: string;
  empresaId?: string;
  estoqueId?: string;
  quantidade: number;
  quantidadeMinima?: number;
  localizacao?: string;
  lote?: string;
  dataValidade?: string;
  status?:
    | "disponivel"
    | "baixo_estoque"
    | "vencido"
    | "esgotado"
    | "vencendo"
    | "baixo";
  dataUltimaMovimentacao?: string;
  custoUnitario?: number;
  fornecedor?: string;
  ativo?: boolean;
  numeroLote?: string;
  dataFabricacao?: string;
  notaFiscal?: string;
  observacoes?: string;
  metadados?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface FichaEPI {
  id: string;
  colaboradorId: string;
  empresaId: string;
  dataEmissao: string;
  dataValidade: string;
  status: "ativo" | "vencido" | "suspenso" | "arquivado";
  itens: ItemFicha[];
}

export interface ItemFicha {
  id: string;
  fichaEpiId: string;
  tipoEpiId: string;
  itemEstoqueOrigemId?: string;
  quantidade: number;
  numeroLote?: string;
  dataEntrega: string;
  dataValidadeItem?: string;
  dataDevolucao?: string;
  status: "entregue" | "devolvido" | "vencido" | "descartado" | "perdido";
  motivoStatus?: string;
  observacoes?: string;
  responsavelEntrega?: string;
  responsavelDevolucao?: string;
  entregaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Entrega {
  id: string;
  fichaEPIId: string;
  dataEntrega: string;
  itens: ItemEntrega[];
  responsavel: string;
  status: "nao_assinado" | "assinado" | "pendente";
  assinatura?: {
    dataAssinatura: string;
    ip?: string;
    device?: string;
  };
  qrCode?: string;
  linkAssinatura?: string;
}

export interface ItemEntrega {
  id: string;
  tipoEPIId: string;
  quantidade: number;
  dataValidade: string;
  status: "entregue" | "devolvido" | "vencido";
  dataEntrega: string;
  numeroLote?: string;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo:
    | "alerta"
    | "informacao"
    | "importante"
    | "vencimento"
    | "estoque_baixo"
    | "vencendo";
  data: string;
  lida: boolean;
  link?: string;
  usuarioId?: string;
  empresaId?: string;
}

export interface EventoHistorico {
  id: string;
  fichaEPIId: string;
  tipo:
    | "ficha_criada"
    | "entrega_criada"
    | "entrega_editada"
    | "entrega_excluida"
    | "item_devolvido"
    | "item_desativado";
  data: string;
  responsavel: string;
  descricao: string;
  detalhes?: {
    entregaId?: string;
    itemId?: string;
    equipamentos?: string[];
    quantidades?: number[];
  };
}

// Interface específica para histórico de estoque
export interface EventoEstoque {
  id: string;
  itemEstoqueId: string;
  tipo:
    | "entrada"
    | "saida"
    | "ajuste"
    | "devolucao"
    | "perda"
    | "vencimento"
    | "entrega"
    | "cadastro";
  data: string;
  responsavel: string;
  descricao: string;
  quantidadeAnterior: number;
  quantidadeAtual: number;
  quantidade: number;
  detalhes?: {
    entregaId?: string;
    fichaEPIId?: string;
    colaboradorNome?: string;
    custoUnitario?: number;
    notaFiscal?: string;
    lote?: string;
    motivo?: string;
  };
}

// Interface para item de uma nota (entrada ou saída)
export interface ItemNota {
  id: string;
  tipoEPIId: string;
  quantidade: number;
  custoUnitario?: number;
  lote?: string;
  observacoes?: string;
}

// Interface para Notas de Entrada
export interface NotaEntrada {
  id: string;
  numeroNota: string;
  empresaId: string;
  data: string;
  responsavel: string;
  motivo: string;
  fornecedor?: string;
  notaFiscal?: string;
  valorTotal?: number;
  status: "pendente" | "processada" | "cancelada";
  itens: ItemNota[];
  observacoes?: string;
  dataProcessamento?: string;
}

// Interface para Notas de Saída
export interface NotaSaida {
  id: string;
  numeroNota: string;
  empresaId: string;
  data: string;
  responsavel: string;
  motivo: string;
  destinatario?: string;
  solicitante?: string;
  status: "pendente" | "processada" | "cancelada";
  itens: ItemNota[];
  observacoes?: string;
  dataProcessamento?: string;
}

// Interface para formulário de nova movimentação multi-item
export interface NovaMovimentacaoForm {
  tipo: "entrada" | "saida" | "ajuste" | "transferencia" | "descarte";
  responsavel: string;
  motivo: string;
  observacoes?: string;
  fornecedor?: string; // para entrada
  notaFiscal?: string; // para entrada
  destinatario?: string; // para saída
  solicitante?: string; // para saída
  itens: Array<{
    tipoEPIId: string;
    quantidade: number;
    custoUnitario?: number;
    lote?: string;
    observacoes?: string;
  }>;
}

// Interface para visualização consolidada de estoque
export interface ItemEstoqueConsolidado {
  tipoEpi: TipoEPI;
  quantidadeTotal: number;
  quantidadesPorEstoque: Record<string, number>; // estoqueId -> quantidade
  estoques: Estoque[];
}

export interface VisualizacaoConsolidadaEstoque {
  itens: ItemEstoqueConsolidado[];
  estoques: Estoque[];
  totalTipos: number;
  totalItens: number;
}

// Tipos específicos para Svelte

// Tipo para controle de modais
export interface ModalState {
  isOpen: boolean;
  mode?: "create" | "edit" | "view" | "delete";
  data?: any;
}

// Tipo para filtros genéricos
export interface FilterState<T = any> {
  [key: string]: T;
}

// Tipo para estado de API
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Tipo para paginação
export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

// Tipo para ordenação
export interface SortState {
  field: string;
  direction: "asc" | "desc";
}

// Tipo para busca
export interface SearchState {
  term: string;
  fields: string[];
}

// Tipo combinado para processamento de listas
export interface ListProcessingOptions {
  filters?: FilterState;
  search?: SearchState;
  sort?: SortState;
  pagination?: PaginationState;
}

// Tipos específicos para filtros
export interface EPIFilters {
  status: string;
  categoria: string;
  fabricante: string;
}

export interface EstoqueFilters {
  status: string;
  estoque: string;
  categoria: string;
  vencimento: string;
}

export interface FichasFilters {
  cargo: string;
  empresa: string;
  devolucaoPendente: boolean;
}

// ==================== ALIASES PARA COMPATIBILIDADE ====================

// Aliases para tipos modernos (serviceTypes.ts)
export type {
  TipoEPIDTO,
  ColaboradorDTO,
  ContratadaDTO,
  ItemEstoqueDTO as EstoqueItemDTO,
  MovimentacaoEstoqueDTO,
  FichaEPIDTO,
  EntregaDTO,
  PaginatedResponse,
} from "./serviceTypes";

// Aliases para migração gradual
export type TipoEPIModerno = TipoEPI;
export type ColaboradorModerno = Colaborador;
export type EmpresaModerna = Empresa;

// ==================== TIPOS FALTANTES (CORREÇÃO TYPESCRIPT) ====================

/**
 * Interface para EPIs disponíveis para entrega
 * Usada em fichaQueryAdapter.ts
 */
export interface EPIDisponivel {
  id: string;
  nomeEquipamento: string;
  numeroCA: string;
  categoria: string;
  quantidadeDisponivel: number;
  disponivel: boolean;
  registroCA: string;
  estoqueItemId: string;
  tipoEpiId: string;
  posicaoEstoqueId: string;
  // Propriedades faltantes identificadas nos erros TS
  quantidade: number;
  episDisponivelId: string;
}

/**
 * Interface para usuários do sistema
 * Usada em fichaQueryAdapter.ts
 */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  cargo?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface genérica para respostas da API
 * Resolve problemas de 'response is unknown'
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * Interface específica para lista de EPIs disponíveis
 */
export interface EPIsDisponiveisResponse extends ApiResponse<{
  items: Array<{
    id: string;
    tipoEpi: {
      id: string;
      nomeEquipamento: string;
      numeroCa: string;
      categoriaEpi: string;
    };
    quantidade: number;
    status: string;
    almoxarifadoId: string;
  }>;
}> {}

/**
 * Interface específica para lista de usuários
 */
export interface UsuariosResponse extends ApiResponse<Array<{
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}>> {}

// Interface única para paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any; // Para filtros específicos
}

export interface UnifiedPaginatedResponse<T> {
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
