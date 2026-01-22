/**
 * EntityMappers - Mapeadores Backend→Frontend
 * 
 * Criado conforme P10-18H-AJUSTS-FRONTEND-EXTENDED.md
 * Para transformar dados da API real em DTOs do frontend
 */

import type { 
  ColaboradorDTO, 
  AlmoxarifadoDTO, 
  ContratadaDTO,
  EstoqueItemDTO,
  ItemEstoqueDTO, // Compatibilidade
  FichaEPIDTO,
  EntregaDTO,
  MovimentacaoEstoqueDTO,
  UsuarioDTO,
  UnidadeNegocioDTO,
  TipoEPIDTO
} from '$lib/types/serviceTypes';

export class EntityMappers {
  /**
   * Mapeia dados de colaborador da API para o DTO frontend
   */
  static colaboradorFromAPI(data: any): ColaboradorDTO {
    return {
      id: data.id,
      nome: data.nome,
      cpf: data.cpf,
      matricula: data.matricula || '',
      cargo: data.cargo || '',
      setor: data.setor || '',
      contratadaId: data.contratadaId || data.contratada_id, // ✅ OPCIONAL no backend
      unidadeNegocioId: data.unidadeNegocioId || data.unidade_negocio_id,
      ativo: data.ativo ?? true,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at || data.createdAt || data.created_at,
      contratada: data.contratada ? this.contratadaFromAPI(data.contratada) : undefined
    };
  }

  /**
   * Mapeia dados de almoxarifado da API para o DTO frontend
   */
  static almoxarifadoFromAPI(data: any): AlmoxarifadoDTO {
    return {
      id: data.id,
      nome: data.nome,
      unidadeNegocioId: data.unidadeNegocioId || data.unidade_negocio_id,
      isPrincipal: data.isPrincipal || data.is_principal || false,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at,
      unidadeNegocio: data.unidadeNegocio || data.unidade_negocio ? {
        id: (data.unidadeNegocio || data.unidade_negocio).id,
        nome: (data.unidadeNegocio || data.unidade_negocio).nome,
        codigo: (data.unidadeNegocio || data.unidade_negocio).codigo
      } : undefined
    };
  }

  /**
   * Mapeia dados de contratada da API para o DTO frontend
   * Implementação mínima real conforme backend
   */
  static contratadaFromAPI(data: any): ContratadaDTO {
    return {
      id: data.id,
      nome: data.nome,
      cnpj: data.cnpj,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at
    };
  }

  /**
   * Mapeia dados de estoque item da API para o DTO frontend (NOME CORRETO)
   */
  static estoqueItemFromAPI(data: any): EstoqueItemDTO {
    return {
      id: data.id,
      tipoEpiId: data.tipoEpiId || data.tipo_epi_id,
      almoxarifadoId: data.almoxarifadoId || data.almoxarifado_id,
      quantidade: data.quantidade || 0,
      custoUnitario: data.custoUnitario || data.custo_unitario,
      status: data.status || "DISPONIVEL",
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at || data.createdAt || data.created_at,
      tipoEPI: data.tipoEPI || data.tipo_epi ? this.tipoEPIFromAPI(data.tipoEPI || data.tipo_epi) : undefined,
      almoxarifado: data.almoxarifado ? this.almoxarifadoFromAPI(data.almoxarifado) : undefined
    };
  }

  /**
   * Alias para compatibilidade com código existente
   */
  static itemEstoqueFromAPI(data: any): ItemEstoqueDTO {
    return this.estoqueItemFromAPI(data);
  }

  /**
   * Mapeia dados de ficha EPI da API para o DTO frontend
   */
  static fichaEPIFromAPI(data: any): FichaEPIDTO {
    return {
      id: data.id,
      colaboradorId: data.colaboradorId || data.colaborador_id,
      dataEmissao: data.dataEmissao || data.data_emissao,
      status: data.status || "ATIVA", // ✅ DEFAULT: ATIVA
      createdAt: data.createdAt || data.created_at,
      colaborador: data.colaborador ? {
        id: data.colaborador.id,
        nome: data.colaborador.nome,
        cpf: data.colaborador.cpf,
        matricula: data.colaborador.matricula,
        cargo: data.colaborador.cargo,
        empresa: data.colaborador.empresa || data.colaborador.contratada?.nome,
        setor: data.colaborador.setor
      } : {} as any,
      contratada: data.contratada ? this.contratadaFromAPI(data.contratada) : undefined,
      episInfo: data.episInfo,
      entregas: data.entregas?.map((entrega: any) => this.entregaFromAPI(entrega))
      // REMOVIDO: updatedAt (não existe no backend real)
    };
  }

  /**
   * Mapeia dados de entrega da API para o DTO frontend
   */
  static entregaFromAPI(data: any): EntregaDTO {
    return {
      id: data.id,
      fichaEpiId: data.fichaEpiId || data.ficha_epi_id,
      almoxarifadoId: data.almoxarifadoId || data.almoxarifado_id,
      responsavelId: data.responsavelId || data.responsavel_id,
      dataEntrega: data.dataEntrega || data.data_entrega,
      status: data.status || "PENDENTE_ASSINATURA",
      linkAssinatura: data.linkAssinatura || data.link_assinatura,
      dataAssinatura: data.dataAssinatura || data.data_assinatura,
      fichaEPI: data.fichaEPI || data.ficha_epi ? this.fichaEPIFromAPI(data.fichaEPI || data.ficha_epi) : undefined,
      itens: data.itens?.map((item: any) => this.entregaItemFromAPI(item)),
      responsavel: data.responsavel ? this.usuarioFromAPI(data.responsavel) : undefined,
      almoxarifado: data.almoxarifado ? this.almoxarifadoFromAPI(data.almoxarifado) : undefined
    };
  }

  /**
   * Mapeia dados de movimentação estoque da API para o DTO frontend
   */
  static movimentacaoEstoqueFromAPI(data: any): MovimentacaoEstoqueDTO {
    return {
      id: data.id,
      estoqueItemId: data.estoqueItemId || data.estoque_item_id,
      responsavelId: data.responsavelId || data.responsavel_id,
      tipoMovimentacao: data.tipoMovimentacao || data.tipo_movimentacao || "ENTRADA_NOTA",
      quantidadeMovida: data.quantidadeMovida || data.quantidade_movida || data.quantidade || 0,
      notaMovimentacaoId: data.notaMovimentacaoId || data.nota_movimentacao_id,
      entregaId: data.entregaId || data.entrega_id,
      movimentacaoOrigemId: data.movimentacaoOrigemId || data.movimentacao_origem_id,
      dataMovimentacao: data.dataMovimentacao || data.data_movimentacao,
      estoqueItem: data.estoqueItem || data.estoque_item ? this.estoqueItemFromAPI(data.estoqueItem || data.estoque_item) : undefined,
      responsavel: data.responsavel ? this.usuarioFromAPI(data.responsavel) : undefined,
      notaMovimentacao: data.notaMovimentacao || data.nota_movimentacao ? this.notaMovimentacaoFromAPI(data.notaMovimentacao || data.nota_movimentacao) : undefined,
      entrega: data.entrega ? this.entregaFromAPI(data.entrega) : undefined
    };
  }

  /**
   * Mapeia listas de entidades
   */
  static mapList<T>(data: any[], mapper: (item: any) => T): T[] {
    return data?.map(mapper) || [];
  }

  /**
   * ✅ NOVOS MAPPERS: Entidades descobertas na análise do backend
   */
  static usuarioFromAPI(data: any): UsuarioDTO {
    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      createdAt: data.createdAt || data.created_at
    };
  }

  static unidadeNegocioFromAPI(data: any): UnidadeNegocioDTO {
    return {
      id: data.id,
      nome: data.nome,
      codigo: data.codigo,
      createdAt: data.createdAt || data.created_at
    };
  }

  static tipoEPIFromAPI(data: any): TipoEPIDTO {
    return {
      id: data.id,
      nomeEquipamento: data.nomeEquipamento || data.nome_equipamento,
      numeroCa: data.numeroCa || data.numero_ca,
      descricao: data.descricao,
      categoria: data.categoria || "PROTECAO_CABECA",
      vidaUtilDias: data.vidaUtilDias || data.vida_util_dias,
      status: data.status || "ATIVO",
      createdAt: data.createdAt || data.created_at
    };
  }

  static entregaItemFromAPI(data: any) {
    return {
      id: data.id,
      entregaId: data.entregaId || data.entrega_id,
      tipoEpiId: data.tipoEpiId || data.tipo_epi_id,
      quantidade: data.quantidade || 0,
      status: data.status || "COM_COLABORADOR",
      dataVencimento: data.dataVencimento || data.data_vencimento,
      tipoEPI: data.tipoEPI || data.tipo_epi ? this.tipoEPIFromAPI(data.tipoEPI || data.tipo_epi) : undefined
    };
  }

  static notaMovimentacaoFromAPI(data: any) {
    return {
      id: data.id,
      numeroDocumento: data.numeroDocumento || data.numero_documento,
      tipoNota: data.tipoNota || data.tipo_nota || "ENTRADA",
      almoxarifadoId: data.almoxarifadoId || data.almoxarifado_id,
      almoxarifadoDestinoId: data.almoxarifadoDestinoId || data.almoxarifado_destino_id,
      responsavelId: data.responsavelId || data.responsavel_id,
      observacoes: data.observacoes,
      status: data.status || "RASCUNHO",
      dataDocumento: data.dataDocumento || data.data_documento,
      createdAt: data.createdAt || data.created_at
    };
  }

  /**
   * Mapeia responses paginados
   */
  static mapPaginatedResponse<T>(response: any, mapper: (item: any) => T) {
    return {
      data: this.mapList(response.data || response.items || [], mapper),
      total: response.total || 0,
      page: response.page || 1,
      pageSize: response.pageSize || response.limit || 10,
      totalPages: response.totalPages || Math.ceil((response.total || 0) / (response.limit || 10))
    };
  }
}