/**
 * Notas Movimentacao Adapter - Simplificado para Backend Real
 *
 * Adapter direto usando endpoints otimizados da API v3.5
 * SEM lógica de normalização desnecessária
 */

import { api, createUrlWithParams } from "../core/apiClient";
import type { PaginatedResponse } from "$lib/stores/paginatedStore";
import type {
  NotaMovimentacao,
  NotaMovimentacaoItem,
  NotasMovimentacaoFilterParams,
  CriarNotaMovimentacaoRequest,
  AtualizarNotaMovimentacaoRequest,
  AdicionarItemNotaRequest,
  CriarNotaResponse,
  ConcluirNotaResponse,
  ValidacaoCancelamento,
  NotasFilterOptions,
  TipoNotaEnum,
  StatusNotaEnum,
} from "./notasMovimentacaoTypes";

// ==================== ADAPTER CLASS ====================

class NotasMovimentacaoAdapter {
  private baseEndpoint = "/notas-movimentacao";

  // Cache removido - dados vêm diretamente do endpoint principal

  // ==================== CONSULTAS ====================

  /**
   * Lista notas usando endpoint principal
   * Dados vêm com todos os campos incluindo createdAt
   */
  async listarNotas(
    params: NotasMovimentacaoFilterParams = {},
  ): Promise<PaginatedResponse<NotaMovimentacao>> {
    console.log(
      "📋 NotasMovimentacaoAdapter: Listando notas via endpoint principal",
      params,
    );

    try {
      const url = createUrlWithParams(this.baseEndpoint, {
        page: params.page?.toString(),
        limit: params.limit?.toString(),
        dataInicio: params.dataInicio,
        dataFim: params.dataFim,
        status: params.status,
        tipo: params.tipo,
        numero: params.numero,
        usuarioId: params.responsavel_id,
        almoxarifadoId: params.almoxarifado_id,
      });

      const response = await api.get<any>(url, {
        timeout: 30000,
        retries: 2,
      });

      console.log("✅ Notas carregadas:", response);

      if (response.success && response.data) {
        // Mapear dados do backend otimizado para compatibilidade com frontend
        const notasMapeadas = response.data.map((nota: any) => ({
          // Campos principais (já vêm corretos do backend)
          id: nota.id,
          numero: nota.numero,
          tipo: nota.tipo,
          status: nota._status,
          createdAt: nota.createdAt,
          observacoes: nota.observacoes,
          usuarioId: nota.usuarioId,
          almoxarifadoOrigemId: nota.almoxarifadoOrigemId,
          almoxarifadoDestinoId: nota.almoxarifadoDestinoId,
          
          // Campos para compatibilidade com frontend legacy
          responsavel_id: nota.usuarioId,
          almoxarifado_id: nota.almoxarifadoOrigemId || nota.almoxarifadoDestinoId,
          almoxarifado_destino_id: nota.almoxarifadoDestinoId,
          tipo_nota: nota.tipo,
          _status: nota._status,
          numero_documento: nota.numero,
          data_documento: nota.createdAt,
          created_at: nota.createdAt,
          
          // Campos otimizados que agora vêm do backend
          responsavel_nome: nota.usuario?.nome || 'N/A',
          almoxarifado_nome: nota.almoxarifadoOrigem?.nome || nota.almoxarifadoDestino?.nome || 'N/A',
          almoxarifado_destino_nome: nota.almoxarifadoDestino?.nome,
          total_itens: nota.totalItens || 0,
          valor_total: nota.valorTotal || 0,
          
          // Itens da nota (agora vêm populados)
          itens: nota._itens || [],
          _itens: nota._itens || [],
          
          // Relacionamentos expandidos (já vêm do backend)
          responsavel: nota.usuario,
          almoxarifado: nota.almoxarifadoOrigem || nota.almoxarifadoDestino,
          almoxarifado_destino: nota.almoxarifadoDestino
        }));
        
        return {
          data: notasMapeadas,
          total: response.pagination?.total || 0,
          page: response.pagination?.page || 1,
          pageSize: response.pagination?.limit || 10,
          totalPages: response.pagination?.totalPages || 1,
        };
      }

      throw new Error("Resposta inválida do servidor");
    } catch (error: any) {
      console.error("❌ Erro ao listar notas:", error);
      throw new Error("Não foi possível carregar as notas de movimentação");
    }
  }

  /**
   * Busca uma nota específica por ID
   * Este endpoint JÁ inclui itens por padrão (conforme documentação linha 855)
   */
  async obterNota(id: string): Promise<NotaMovimentacao> {
    console.log("🔍 NotasMovimentacaoAdapter: Buscando nota", id);

    try {
      const response = await api.get<any>(`${this.baseEndpoint}/${id}`) as any;
      console.log("✅ Resposta obter nota:", response);
      console.log(
        "🔍 Estrutura da resposta:",
        JSON.stringify(response, null, 2),
      );

      // API retorna dados já processados
      let notaData;
      if (response.success && response.data) {
        notaData = response.data;
      } else if (response.data) {
        notaData = response.data;
      } else {
        notaData = response;
      }

      console.log(
        "📋 Dados da nota processados:",
        JSON.stringify(notaData, null, 2),
      );
      return notaData;
    } catch (error: any) {
      console.error("❌ Erro ao buscar nota:", error);
      throw new Error("Não foi possível encontrar a nota");
    }
  }

  // Método listarNotasComDetalhes removido - endpoint /resumo já inclui tudo

  /**
   * Lista apenas rascunhos usando endpoint específico
   */
  async listarRascunhos(): Promise<NotaMovimentacao[]> {
    console.log("📝 NotasMovimentacaoAdapter: Listando rascunhos");

    try {
      // Usar endpoint específico para rascunhos (linha 848)
      const response = await api.get<any>(`${this.baseEndpoint}/rascunhos`) as any;
      console.log("✅ Resposta listar rascunhos:", response);

      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.items) {
        return response.data.items;
      }

      return [];
    } catch (error: any) {
      console.error("❌ Erro ao listar rascunhos:", error);
      throw new Error("Não foi possível carregar os rascunhos");
    }
  }

  // ==================== COMANDOS ====================

  /**
   * Cria uma nova nota usando o endpoint correto
   */
  async criarNota(
    data: CriarNotaMovimentacaoRequest,
  ): Promise<CriarNotaResponse> {
    console.log("📝 NotasMovimentacaoAdapter: Criando nota", data);

    try {
      // Garantir que responsavel_id seja fornecido
      if (!data.responsavel_id) {
        console.log(
          "⚠️ responsavel_id não fornecido, buscando usuário padrão...",
        );

        try {
          const usuariosResponse = await api.get<any>("/usuarios?limit=1");
          console.log("🔍 Resposta usuarios endpoint:", usuariosResponse);

          // API de usuários retorna formato: { items: [...] }
          if (usuariosResponse.items && usuariosResponse.items.length > 0) {
            data.responsavel_id = usuariosResponse.items[0].id;
            console.log("✅ Usando responsavel_id:", data.responsavel_id);
          } else if (
            usuariosResponse.success &&
            usuariosResponse.data &&
            usuariosResponse.data.length > 0
          ) {
            data.responsavel_id = usuariosResponse.data[0].id;
            console.log("✅ Usando responsavel_id:", data.responsavel_id);
          } else {
            // Usar ID conhecido do administrador do sistema
            console.log(
              "⚠️ Nenhum usuário encontrado, usando administrador padrão...",
            );
            data.responsavel_id = "cffc2197-acbe-4a64-bfd7-435370e9c226";
            console.log(
              "✅ Usando responsavel_id do administrador:",
              data.responsavel_id,
            );
          }
        } catch (userError) {
          console.error("❌ Erro ao buscar usuário:", userError);
          data.responsavel_id = "cffc2197-acbe-4a64-bfd7-435370e9c226";
          console.log(
            "✅ Usando responsavel_id do administrador (fallback):",
            data.responsavel_id,
          );
        }
      }

      // Mapear campos conforme documentação da API (linha 774)
      const backendData: any = {
        tipo: data.tipo_nota,
        // usuarioId não é enviado na criação - será inferido pelo backend
      };

      // Adicionar observacoes apenas se existir (evitar null)
      if (data.observacoes && data.observacoes.trim() !== '') {
        backendData.observacoes = data.observacoes.trim();
      }

      // Adicionar campos apenas se existirem
      if (data.almoxarifado_origem_id) {
        backendData.almoxarifadoOrigemId = data.almoxarifado_origem_id;
      }
      if (data.almoxarifado_destino_id) {
        backendData.almoxarifadoDestinoId = data.almoxarifado_destino_id;
      }

      console.log("📤 Dados para backend:", backendData);

      const response = await api.post<any>(this.baseEndpoint, backendData) as any;

      console.log("✅ Nota criada:", response);

      // API retorna no formato padrão
      if (response.success && response.data) {
        return {
          success: response.success,
          data: response.data,
        };
      } else if (response.data) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: true,
          data: response,
        };
      }
    } catch (error: any) {
      console.error("❌ Erro ao criar nota:", error);
      throw new Error("Não foi possível criar a nota de movimentação");
    }
  }

  /**
   * Atualiza uma nota existente (apenas rascunhos)
   */
  async atualizarNota(
    id: string,
    data: AtualizarNotaMovimentacaoRequest,
  ): Promise<NotaMovimentacao> {
    console.log("📝 NotasMovimentacaoAdapter: Atualizando nota", id, data);

    try {
      const response = await api.put<any>(`${this.baseEndpoint}/${id}`, data) as any;
      console.log("✅ Resposta atualizar nota:", response);

      if (response.success && response.data) {
        return response.data;
      } else if (response.data) {
        return response.data;
      } else {
        return response;
      }
    } catch (error: any) {
      console.error("❌ Erro ao atualizar nota:", error);
      throw new Error("Não foi possível atualizar a nota");
    }
  }

  /**
   * Exclui uma nota (apenas rascunhos)
   */
  async excluirNota(id: string): Promise<void> {
    console.log("🗑️ NotasMovimentacaoAdapter: Excluindo nota", id);

    try {
      await api.delete(`${this.baseEndpoint}/${id}`);
      console.log("✅ Nota excluída:", id);
    } catch (error: any) {
      console.error("❌ Erro ao excluir nota:", error);
      throw new Error("Não foi possível excluir a nota");
    }
  }

  // ==================== ITENS ====================

  /**
   * Adiciona um item à nota usando endpoint correto (linha 906)
   */
  async adicionarItem(
    notaId: string,
    item: AdicionarItemNotaRequest,
  ): Promise<NotaMovimentacaoItem> {
    console.log("➕ NotasMovimentacaoAdapter: Adicionando item", notaId, item);

    try {
      // Validar ID antes de enviar para o backend
      if (!item.tipo_epi_id) {
        throw new Error('ID do tipo EPI é obrigatório');
      }

      // Verificar se é um UUID válido ou ID customizado
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const customIdRegex = /^[A-Z0-9]{6}$/;
      
      if (!uuidRegex.test(item.tipo_epi_id) && !customIdRegex.test(item.tipo_epi_id)) {
        console.error('❌ ID inválido detectado:', item.tipo_epi_id);
        throw new Error(`ID do tipo EPI inválido: ${item.tipo_epi_id}. Deve ser um UUID válido ou ID customizado (ex: E4U302)`);
      }

      // Usar formato conforme documentação (linha 942)
      const backendItemData: {
        tipoEpiId: string;
        quantidade: number;
        custoUnitario?: number;
        observacoes?: string;
      } = {
        tipoEpiId: item.tipo_epi_id,
        quantidade: Number(item.quantidade),
      };

      // 🔧 CORREÇÃO: Incluir custo unitário se fornecido
      if (item.custo_unitario && item.custo_unitario > 0) {
        backendItemData.custoUnitario = Number(item.custo_unitario);
      }

      // Adicionar observacoes apenas se existir (backend valida null como erro)
      if (item.observacoes && item.observacoes.trim() !== '') {
        backendItemData.observacoes = item.observacoes;
      }

      console.log("📤 Dados do item para backend:", backendItemData);

      const response = await api.post<any>(
        `${this.baseEndpoint}/${notaId}/itens`,
        backendItemData,
      );

      console.log("✅ Item adicionado:", response);

      if (response.success && response.data) {
        return response.data;
      } else if (response.data) {
        return response.data;
      } else {
        return response;
      }
    } catch (error: any) {
      console.error("❌ Erro ao adicionar item:", error);
      throw new Error("Não foi possível adicionar o item à nota");
    }
  }

  /**
   * Atualiza quantidade de um item (linha 925)
   */
  async atualizarQuantidade(
    notaId: string,
    tipoEpiId: string,
    quantidade: number,
  ): Promise<void> {
    console.log(
      "📝 NotasMovimentacaoAdapter: Atualizando quantidade",
      notaId,
      tipoEpiId,
      quantidade,
    );

    try {
      await api.put(`${this.baseEndpoint}/${notaId}/itens/${tipoEpiId}`, {
        quantidade: Number(quantidade),
      });
      console.log("✅ Quantidade atualizada");
    } catch (error: any) {
      console.error("❌ Erro ao atualizar quantidade:", error);
      throw new Error("Não foi possível atualizar a quantidade");
    }
  }

  /**
   * NOVO: Atualiza custo unitário de um item independentemente
   */
  async atualizarCustoUnitario(
    notaId: string,
    tipoEpiId: string,
    custoUnitario: number,
  ): Promise<void> {
    console.log(
      "💰 NotasMovimentacaoAdapter: Atualizando custo unitário",
      notaId,
      tipoEpiId,
      custoUnitario,
    );

    try {
      // Validar custo unitário (>= 0 conforme backend)
      if (custoUnitario < 0) {
        throw new Error("Custo unitário deve ser maior ou igual a zero");
      }

      await api.put(`${this.baseEndpoint}/${notaId}/itens/${tipoEpiId}/custo`, {
        custoUnitario: Number(custoUnitario),
      });
      console.log("✅ Custo unitário atualizado");
    } catch (error: any) {
      console.error("❌ Erro ao atualizar custo unitário:", error);
      throw new Error("Não foi possível atualizar o custo unitário");
    }
  }

  /**
   * Remove um item da nota (linha 937)
   */
  async removerItem(notaId: string, itemId: string): Promise<void> {
    console.log("🗑️ NotasMovimentacaoAdapter: Removendo item", notaId, itemId);

    try {
      await api.delete(`${this.baseEndpoint}/${notaId}/itens/${itemId}`);
      console.log("✅ Item removido");
    } catch (error: any) {
      console.error("❌ Erro ao remover item:", error);
      throw new Error("Não foi possível remover o item");
    }
  }

  // ==================== WORKFLOW ====================

  /**
   * Conclui uma nota usando endpoint correto (linha 942)
   */
  async concluirNota(id: string): Promise<ConcluirNotaResponse> {
    console.log("⚡ NotasMovimentacaoAdapter: Concluindo nota", id);

    try {
      const response = await api.post<any>(
        `${this.baseEndpoint}/${id}/concluir`,
        {
          validarEstoque: true,
        },
      );

      console.log("✅ Nota concluída:", response);

      if (response.success) {
        return {
          success: response.success,
          data: response.data,
        };
      } else {
        return response;
      }
    } catch (error: any) {
      console.error("❌ Erro ao concluir nota:", error);
      throw new Error("Não foi possível concluir a nota");
    }
  }

  /**
   * Cancela uma nota (linha 988)
   */
  async cancelarNota(id: string, motivo?: string): Promise<void> {
    console.log("🚫 NotasMovimentacaoAdapter: Cancelando nota", id);

    try {
      await api.post(`${this.baseEndpoint}/${id}/cancelar`, {
        motivo: motivo || "Cancelamento solicitado pelo usuário",
        gerarEstorno: true,
      });
      console.log("✅ Nota cancelada:", id);
    } catch (error: any) {
      console.error("❌ Erro ao cancelar nota:", error);
      throw new Error("Não foi possível cancelar a nota");
    }
  }

  /**
   * Valida se uma nota pode ser cancelada (linha 1001)
   */
  async validarCancelamento(id: string): Promise<ValidacaoCancelamento> {
    console.log("🔍 NotasMovimentacaoAdapter: Validando cancelamento", id);

    try {
      const response = await api.get<any>(
        `${this.baseEndpoint}/${id}/validar-cancelamento`,
      );

      console.log("✅ Validação de cancelamento:", response);

      if (response.success && response.data) {
        return response.data;
      } else if (response.data) {
        return response.data;
      } else {
        return response;
      }
    } catch (error: any) {
      console.error("❌ Erro ao validar cancelamento:", error);
      return { pode_cancelar: false, motivo: "Erro na validação" };
    }
  }

  // ==================== CONSULTAS AVANÇADAS ====================

  /**
   * Busca nota com todos os relacionamentos (mesmo que obterNota)
   */
  async obterNotaCompleta(id: string): Promise<NotaMovimentacao> {
    console.log("🔍 NotasMovimentacaoAdapter: Buscando nota completa", id);

    // Endpoint individual já inclui todos os relacionamentos
    return this.obterNota(id);
  }

  /**
   * Validação local antes de concluir nota
   */
  async validarNotaAntesConcluir(id: string): Promise<{
    pode_concluir: boolean;
    erros: string[];
    avisos?: string[];
    total_itens_processados?: number;
    movimentacoes_previstas?: number;
  }> {
    console.log("🔍 NotasMovimentacaoAdapter: Validação local da nota", id);

    try {
      const nota = await this.obterNota(id);

      const erros: string[] = [];
      const avisos: string[] = [];

      // Verificar se tem itens
      if (!nota.itens || nota.itens.length === 0) {
        erros.push("Nota deve ter pelo menos um item");
      }

      // Verificar status
      if (nota.status === "CONCLUIDA" || nota._status === "CONCLUIDA") {
        erros.push("Nota já foi concluída anteriormente");
      }

      if (nota.status === "CANCELADA" || nota._status === "CANCELADA") {
        erros.push("Nota cancelada não pode ser concluída");
      }

      const podeConfirmar = erros.length === 0;

      if (podeConfirmar) {
        avisos.push("Validação local aprovada");
      }

      console.log("✅ Validação local concluída:", {
        podeConfirmar,
        erros: erros.length,
        itens: nota.itens?.length,
      });

      return {
        pode_concluir: podeConfirmar,
        erros,
        avisos,
        total_itens_processados: nota.itens?.length || 0,
        movimentacoes_previstas: nota.itens?.length || 0,
      };
    } catch (error: any) {
      console.error("❌ Erro na validação local:", error);
      return {
        pode_concluir: false,
        erros: ["Não foi possível carregar dados da nota para validação"],
        avisos: ["Erro na validação local"],
      };
    }
  }


  // ==================== FILTROS E OPÇÕES ====================

  /**
   * Obtém opções para filtros - simplificado para usar endpoint /resumo
   */
  async obterOpcoesFilters(): Promise<NotasFilterOptions> {
    console.log("🔧 NotasMovimentacaoAdapter: Carregando opções de filtros");

    try {
      // Usar endpoints simplificados
      const [responsaveisResponse, almoxarifadosResponse] = await Promise.all([
        api.get<any>("/usuarios?limit=100"),
        api.get<any>("/estoque/almoxarifados"),
      ]);

      // Extrair dados de forma defensiva
      const responsaveis =
        responsaveisResponse?.data || responsaveisResponse?.items || [];
      const almoxarifados = almoxarifadosResponse?.data || [];

      const options: NotasFilterOptions = {
        responsaveis: responsaveis.map((r: any) => ({
          value: r.id,
          label: r.nome || r.name || `Usuário ${r.id.slice(0, 8)}`,
        })),
        almoxarifados: almoxarifados.map((a: any) => ({
          value: a.id,
          label: a.nome || a.name || `Almoxarifado ${a.id.slice(0, 8)}`,
        })),
        tipos: [
          { value: "ENTRADA", label: "Entrada" },
          { value: "TRANSFERENCIA", label: "Transferência" },
          { value: "DESCARTE", label: "Descarte" },
          { value: "AJUSTE", label: "Ajuste" },
        ],
        status: [
          { value: "RASCUNHO", label: "Rascunho" },
          { value: "CONCLUIDA", label: "Concluída" },
          { value: "CANCELADA", label: "Cancelada" },
        ],
      };

      console.log("✅ Opções de filtros carregadas:", {
        responsaveis: options.responsaveis.length,
        almoxarifados: options.almoxarifados.length,
      });

      return options;
    } catch (error: any) {
      console.error("❌ Erro ao carregar opções de filtros:", error);

      // Retornar opções básicas em caso de erro
      return {
        responsaveis: [],
        almoxarifados: [],
        tipos: [
          { value: "ENTRADA", label: "Entrada" },
          { value: "TRANSFERENCIA", label: "Transferência" },
          { value: "DESCARTE", label: "Descarte" },
          { value: "AJUSTE", label: "Ajuste" },
        ],
        status: [
          { value: "RASCUNHO", label: "Rascunho" },
          { value: "CONCLUIDA", label: "Concluída" },
          { value: "CANCELADA", label: "Cancelada" },
        ],
      };
    }
  }
}

// ==================== EXPORT ====================

export const notasMovimentacaoAdapter = new NotasMovimentacaoAdapter();
