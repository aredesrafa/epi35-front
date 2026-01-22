/**
 * Types for Ficha Query Operations
 */

// ==================== BASIC TYPES ====================

export interface FichaBasica {
  id: string;
  status: 'ativa' | 'inativa' | 'vencida' | 'pendente_devolucao';
  statusDisplay: {
    cor: string;
    label: string;
  };
  colaborador: {
    nome: string;
    cpf: string;
    cpfDisplay: string;
    matricula: string;
    cargo: string;
    empresa: string;
    iniciais: string;
  };
  estatisticas: {
    totalEntregas: number;
    itensAtivos: number;
    devolucoesPendentes: number;
  };
  // 🔧 CORREÇÃO: Adicionar totalEpisAtivos para compatibilidade com FichaEPIDTO
  totalEpisAtivos: number;
  dataAtualizacao: string;
}

// ==================== QUERY TYPES ====================

export interface FichaQueryParams {
  search?: string;
  empresaId?: string;
  empresa?: string;
  cargo?: string;
  status?: string;
  devolucaoPendente?: boolean;
  page?: number;
  limit?: number;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedFichaResponse {
  items: FichaBasica[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FichaCompleteResponse {
  success: boolean;
  data: {
    ficha: FichaBasica;
    entregas: any[]; // TODO: Define proper Entrega type
    devolucoes: any[]; // TODO: Define proper Devolucao type
    equipamentosEmPosse: any[];
    historico: any[];
    estatisticas: any;
  };
}

// ==================== RESOURCE TYPES ====================

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
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  ativo: boolean;
}