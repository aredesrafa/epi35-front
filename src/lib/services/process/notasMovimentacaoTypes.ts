/**
 * Tipos e Interfaces para Notas de Movimentação
 *
 * Centralização de todas as definições de tipos relacionadas
 * a notas de movimentação para melhor organização e reutilização
 */

import type { PaginationParams } from "$lib/stores/paginatedStore";

// ==================== ENUMS DO BACKEND ====================

export type TipoNotaEnum =
  | "ENTRADA"
  | "TRANSFERENCIA"
  | "DESCARTE"
  | "ENTRADA_AJUSTE"
  | "SAIDA_AJUSTE"
  | "AJUSTE";
export type StatusNotaEnum = "RASCUNHO" | "CONCLUIDA" | "CANCELADA" | "todos";

// ==================== INTERFACES PRINCIPAIS ====================

// Item da nota de movimentação
export interface NotaMovimentacaoItem {
  id: string;
  nota_movimentacao_id: string;
  quantidade: number;
  estoque_item_id?: string; // Para saídas/transferências
  tipo_epi_id?: string; // Para entradas
  custo_unitario?: number;
  // Campos derivados para exibição
  equipamento_nome?: string;
  equipamento_ca?: string;
  categoria?: string;
}

// Nota de movimentação principal (estrutura do backend real)
export interface NotaMovimentacao {
  id: string;
  numero: string;
  tipo: TipoNotaEnum;
  almoxarifadoOrigemId?: string; // Para TRANSFERENCIA e DESCARTE
  almoxarifadoDestinoId?: string; // Para ENTRADA e TRANSFERENCIA
  usuarioId: string;
  observacoes?: string;
  _status: StatusNotaEnum;
  createdAt: string;
  _itens?: NotaMovimentacaoItem[];

  // Campos para compatibilidade com frontend legacy
  almoxarifado_id?: string; // Mapping de almoxarifadoOrigemId
  almoxarifado_destino_id?: string; // Mapping de almoxarifadoDestinoId
  responsavel_id?: string; // Mapping de usuarioId
  tipo_nota?: TipoNotaEnum; // Mapping de tipo
  status?: StatusNotaEnum; // Mapping de _status
  numero_documento?: string; // Mapping de numero
  data_documento?: string; // Mapping de createdAt
  created_at?: string; // Mapping de createdAt
  itens?: NotaMovimentacaoItem[]; // Mapping de _itens

  // Relacionamentos expandidos (quando incluídos)
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };
  almoxarifado?: {
    id: string;
    nome: string;
    descricao?: string;
  };
  almoxarifado_destino?: {
    id: string;
    nome: string;
    descricao?: string;
  };

  // Campos derivados
  total_itens?: number;
  valor_total?: number;
  // Propriedades faltantes identificadas nos erros TS
  responsavel_nome?: string;
  almoxarifado_nome?: string;
  almoxarifado_destino_nome?: string;
}

// ==================== REQUEST/RESPONSE INTERFACES ====================

// Parâmetros de filtro para listagem
export interface NotasMovimentacaoFilterParams extends PaginationParams {
  dataInicio?: string;
  dataFim?: string;
  status?: StatusNotaEnum;
  tipo?: TipoNotaEnum;
  numero?: string;
  responsavel_id?: string;
  almoxarifado_id?: string;
}

// Dados para criar nota
export interface CriarNotaMovimentacaoRequest {
  tipo_nota: TipoNotaEnum;
  almoxarifado_origem_id?: string; // Para TRANSFERENCIA e DESCARTE
  almoxarifado_destino_id?: string; // Para ENTRADA e TRANSFERENCIA
  responsavel_id?: string; // ID do usuário responsável (será obtido automaticamente se não fornecido)
  numero_documento?: string;
  data_documento?: string; // Default: current_date
  observacoes?: string;
}

// Dados para atualizar nota (apenas RASCUNHO)
export interface AtualizarNotaMovimentacaoRequest {
  numero_documento?: string;
  data_documento?: string;
  observacoes?: string;
}

// Dados para adicionar item à nota
export interface AdicionarItemNotaRequest {
  tipo_epi_id?: string; // Para entradas
  estoque_item_id?: string; // Para saídas/transferências
  quantidade: number;
  custo_unitario?: number; // Para entradas
  // Propriedade faltante identificada nos erros TS
  observacoes?: string;
}

// ==================== RESPONSE INTERFACES ====================

// Response de criação de nota
export interface CriarNotaResponse {
  success: boolean;
  data: {
    id: string;
    numero: string;
    status: StatusNotaEnum;
    // Propriedades faltantes identificadas nos erros TS
    uuid?: string;
  };
  // Propriedades faltantes identificadas nos erros TS
  id?: string;
  uuid?: string;
}

// Response de conclusão de nota
export interface ConcluirNotaResponse {
  success: boolean;
  data: {
    movimentacoes_criadas: number;
    nota_id: string;
    status: StatusNotaEnum;
    // Propriedades faltantes identificadas nos erros TS
    movimentacoesCriadas?: number;
    data?: any;
  };
}

// Validação de cancelamento
export interface ValidacaoCancelamento {
  pode_cancelar: boolean;
  motivo?: string;
  impactos?: string[];
}

// Opções para filtros
export interface NotasFilterOptions {
  responsaveis: Array<{ value: string; label: string }>;
  almoxarifados: Array<{ value: string; label: string }>;
  tipos: Array<{ value: TipoNotaEnum; label: string }>;
  status: Array<{ value: StatusNotaEnum; label: string }>;
}
