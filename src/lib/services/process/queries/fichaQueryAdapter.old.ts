/**
 * Ficha Query Adapter - Queries com API Oficial
 *
 * Responsabilidade: Buscar dados de fichas usando endpoints oficiais da API v3.5
 * 
 * 🆕 ATUALIZADO (10/07/2025): Integração com Endpoint Enhanced
 * - ✅ USAR ENDPOINT ENHANCED: /api/fichas-epi/list-enhanced (conforme documentação linha 1886)
 * - ✅ Busca unificada: nome, matrícula, CPF via parâmetro 'search'
 * - ✅ Filtros por empresa e cargo suportados pela API
 * - ✅ Transformação de dados para compatibilidade frontend
 * - ✅ Mapeamento correto de campos (contratada.nome → colaborador.empresa)
 * 
 * Endpoint principal: GET /api/fichas-epi/list-enhanced
 * 
 * Parâmetros suportados:
 * - search: string (busca unificada por nome, CPF, matrícula)
 * - empresaId: string (filtro exato por UUID da empresa - recomendado)
 * - empresa: string (filtro por nome da empresa - busca flexível)
 * - cargo: string (filtro por cargo)
 * - status: string (filtro por status da ficha)
 * - devolucaoPendente: boolean (filtro por devolução pendente)
 * - page: number (paginação)
 * - limit: number (itens por página)
 */

import { api } from "../../core/apiClient";

// ==================== INTERFACES BACKEND-READY ====================

export interface FichaCompleteResponse {
  success: boolean;
  data: {
    ficha: {
      id: string;
      status: "ativa" | "inativa" | "vencida" | "pendente_devolucao";
      statusDisplay: {
        cor: "green" | "red" | "yellow" | "gray";
        label: string;
      };
      colaborador: {
        id: string;
        nome: string;
        cpf: string;
        cpfDisplay: string;
        matricula: string;
        cargo: string;
        empresa: string;
        iniciais: string;
      };
    };
    equipamentosEmPosse: Array<{
      id: string;
      nomeEquipamento: string;
      numeroCA: string;
      categoria: string;
      dataEntrega: string;
      dataLimiteDevolucao: string;
      statusVencimento: "dentro_prazo" | "vencendo" | "vencido";
      statusVencimentoDisplay: {
        texto: string;
        cor: "green" | "yellow" | "red";
        diasRestantes: number;
        statusDetalhado: string;
      };
      podeDevolver: boolean;
      entregaId: string;
      itemEntregaId: string;
    }>;
    devolucoes: Array<{
      id: string;
      nomeEquipamento: string;
      numeroCA: string;
      categoria: string;
      quantidade: number;
      dataDevolucao: string;
      motivo: string;
      motivoDisplay: string;
      condicaoItem: "BOM" | "DANIFICADO" | "PERDIDO";
      observacoes?: string;
      status: "processada" | "cancelada";
      podeProcessar: boolean;
      podeCancelar: boolean;
      entregaId?: string;
      numeroSerie?: string;
      dataEntrega?: string;
      tempoUso?: number;
      responsavel?: string;
    }>;
    entregas: Array<{
      id: string;
      numero: string;
      dataEntrega: string;
      status: "pendente_assinatura" | "assinado" | "cancelado";
      statusDisplay: {
        cor: "yellow" | "green" | "red";
        label: string;
      };
      acoes: string[];
      itens: Array<{
        id: string;
        nomeEquipamento: string;
        numeroCA: string;
        categoria: string;
        quantidade: number;
        status?: string; // 🔧 FIX: Adicionar status para detectar itens devolvidos
      }>;
    }>;
    historico: Array<{
      id: string;
      data: string;
      dataFormatada: string;
      tipo: "entrega" | "devolucao" | "assinatura" | "cancelamento";
      tipoDisplay: {
        label: string;
        tipo: string;
        cor: "green" | "orange" | "blue" | "red";
      };
      acao: string;
      responsavel: string;
      mudancaStatus: string;
      detalhes: {
        resumo: string;
        dados: {
          quantidade: number;
          equipamento: string;
          numeroCA: string;
          categoria: string;
        };
      };
    }>;
    estatisticas: {
      totalEpisAtivos: number;
      totalEpisVencidos: number;
      proximoVencimento: string;
      diasProximoVencimento: number;
    };
  };
}

export interface FichaListParams {
  page?: number;
  limit?: number;
  // 🆕 BUSCA UNIFICADA: Busca por nome, CPF ou matrícula
  search?: string;
  status?: string;
  cargo?: string;
  empresa?: string;
  vencimentoProximo?: boolean;
  // Campos específicos para compatibilidade
  searchTerm?: string; // alias para search
  empresaFilter?: string; // alias para empresa
  cargoFilter?: string; // alias para cargo
  statusFilter?: string; // alias para status
  devolucaoPendente?: boolean; // alias para vencimentoProximo
}

export interface FichaListItem {
  id: string;
  colaborador: {
    nome: string;
    cpf: string; // ✅ ADICIONADO: CPF do colaborador
    matricula: string;
    cargo: string;
    empresa: string;
  };
  contratada?: {
    id: string;
    nome: string;
  };
  status: "ativa" | "inativa" | "vencida" | "pendente_devolucao";
  // ✅ COMPATIBILIDADE: Suporte para ambos os formatos de resposta
  totalEpisAtivos?: number;
  totalEpisVencidos?: number;
  episInfo?: {
    totalEpisComColaborador: number;
    episExpirados: number;
    proximaDataVencimento: string;
    diasAteProximoVencimento: number;
    tiposEpisAtivos: Array<{
      tipoEpiId: string;
      tipoEpiNome: string;
      quantidade: number;
    }>;
  };
  proximoVencimento?: string;
  ultimaAtualizacao?: string;
  devolucaoPendente?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==================== ADAPTER CLASS ====================

class FichaQueryAdapter {
  /**
   * Buscar ficha completa com dados pré-processados pelo backend
   * Substitui 3-5 chamadas API por uma única
   */
  async getFichaComplete(fichaId: string): Promise<FichaCompleteResponse> {
    console.log(
      "📋 FichaQueryAdapter: Buscando dados da ficha via endpoints específicos:",
      fichaId,
    );

    try {
      // CORREÇÃO: Backend search não retorna resultados por ID, buscar todas e filtrar
      console.log("🔍 Tentando buscar ficha via list-enhanced...");
      const fichasList = await api.get<any>('/fichas-epi/list-enhanced?limit=100');
      
      if (!fichasList?.data?.items || !Array.isArray(fichasList.data.items)) {
        throw new Error('Erro ao carregar lista de fichas');
      }
      
      // Filtrar pelo ID específico no frontend
      const fichaBasica = fichasList.data.items.find((ficha: any) => ficha.id === fichaId);
      
      if (!fichaBasica) {
        console.error(`❌ Ficha ${fichaId} não encontrada na lista de ${fichasList.data.items.length} fichas`);
        console.log("🔍 IDs disponíveis:", fichasList.data.items.slice(0, 5).map((f: any) => f.id));
        throw new Error(`Ficha ${fichaId} não encontrada`);
      }
      
      console.log("✅ Ficha encontrada:", fichaBasica.id, fichaBasica.colaborador?.nome);
      
      // Montar resposta no formato esperado
      const fichaBase = {
        success: true,
        data: {
          ficha: {
            id: fichaBasica.id,
            status: fichaBasica.status,
            statusDisplay: fichaBasica.statusDisplay,
            colaborador: {
              id: fichaBasica.colaborador?.id || fichaBasica.id || "",
              nome: fichaBasica.colaborador?.nome || "Nome não disponível",
              cpf: fichaBasica.colaborador?.cpf || "",
              cpfDisplay: fichaBasica.colaborador?.cpf ? 
                fichaBasica.colaborador.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : "",
              matricula: fichaBasica.colaborador?.matricula || "",
              cargo: fichaBasica.colaborador?.cargo || "",
              empresa: fichaBasica.colaborador?.empresa || "",
              iniciais: fichaBasica.colaborador?.nome ? 
                fichaBasica.colaborador.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase() : "",
            },
          },
          equipamentosEmPosse: [],
          devolucoes: [] as any[],
          entregas: [] as any[],
        },
      };
      console.log(
        "🔍 DEBUG Colaborador ID da ficha:",
        fichaBase?.data?.ficha?.colaborador?.id,
      );

      // 2. Buscar entregas e devoluções (opcional - se falhar, continuar sem elas)
      const colaboradorId = fichaBasica.colaborador?.id;
      console.log("🔍 DEBUG Colaborador ID:", colaboradorId);

      let entregas = { data: [] };
      let devolucoes: any[] = [];

      try {
        // Tentar buscar entregas - se falhar, continuar sem elas
        console.log("🔍 Tentando buscar entregas...");
        entregas = await api.get(`/fichas-epi/${fichaId}/entregas`) as { data: any[] };
        console.log("✅ Entregas carregadas:", entregas.data?.length || 0);
      } catch (error) {
        console.warn("⚠️ Não foi possível carregar entregas:", error);
        entregas = { data: [] };
      }

      try {
        // Tentar buscar devoluções - se falhar, continuar sem elas  
        if (colaboradorId) {
          console.log("🔍 Tentando buscar devoluções...");
          devolucoes = await this.buscarDevolucoes(fichaId, colaboradorId);
          console.log("✅ Devoluções carregadas:", devolucoes.length);
        }
      } catch (error) {
        console.warn("⚠️ Não foi possível carregar devoluções:", error);
        devolucoes = [];
      }

      console.log("✅ Dados da ficha carregados via endpoints específicos");
      console.log("🔍 DEBUG Entregas do backend:", entregas?.data?.[0]); // Ver estrutura real
      console.log("🔍 DEBUG Complete response:", {
        devolucoes: fichaBase?.data?.devolucoes?.length || 0,
        devolucoesData: fichaBase?.data?.devolucoes,
        fullStructure: Object.keys(fichaBase?.data || {}),
      });

      // 🚀 CRIAR LOOKUP: Buscar EPIs disponíveis para fazer cross-reference (MOVER PARA ESCOPO GLOBAL)
      let epiLookup: Record<string, any> = {};
      try {
        const episDisponiveis = await this.getEPIsDisponiveis();
        episDisponiveis.forEach((epi) => {
          if (epi.tipoEpiId) {
            epiLookup[epi.tipoEpiId] = {
              nomeEquipamento: epi.nomeEquipamento,
              numeroCA: epi.numeroCA,
              categoria: epi.categoria,
            };
          }
        });
        console.log(
          "🔍 EPI Lookup criado:",
          Object.keys(epiLookup).length,
          "tipos EPI",
        );
      } catch (error) {
        console.warn("⚠️ Erro ao criar lookup de EPIs:", error);
      }

      // Corrigir dados de entregas se estiverem vazios no /complete
      if (entregas && entregas.data && Array.isArray(entregas.data)) {
        if (fichaBase.data) {
          fichaBase.data.entregas = entregas.data.map((entrega) => {
          console.log("🔍 DEBUG Entrega individual:", {
            id: entrega.id,
            status: entrega.status,
            itens: entrega.itens?.length || 0,
            itemSample: entrega.itens?.[0],
            itemSampleFull: JSON.stringify(entrega.itens?.[0], null, 2),
          });

          return {
            id: entrega.id,
            numero: entrega.numero || entrega.id,
            dataEntrega: entrega.dataEntrega || entrega.createdAt,
            status: entrega.status || "PENDENTE_ASSINATURA",
            statusDisplay: {
              // Verificar os valores exatos que vêm do backend
              cor:
                entrega.status === "ASSINADA" || entrega.status === "assinada"
                  ? "green"
                  : "yellow",
              label:
                entrega.status === "ASSINADA" || entrega.status === "assinada"
                  ? "Assinado"
                  : "Pendente Assinatura",
            },
            acoes:
              entrega.status === "ASSINADA" || entrega.status === "assinada"
                ? ["imprimir"] // Se já está assinada, só pode imprimir
                : ["assinar", "cancelar"], // Se não está assinada, pode assinar ou cancelar
            itens:
              entrega.itens?.map((item: any) => {
                console.log(
                  "🔍 DEBUG Item raw:",
                  JSON.stringify(item, null, 2),
                );

                // 🚀 SOLUÇÃO: Usar lookup de EPIs para pegar dados pelo tipoEpiId
                const epiFromLookup = epiLookup[item.tipoEpiId];

                // Tentar diferentes caminhos para acessar dados do EPI
                const epiData =
                  item.estoqueItem?.tipoEpi ||
                  item.tipoEpi ||
                  item.equipamento ||
                  epiFromLookup ||
                  item;
                const estoqueData = item.estoqueItem || item;

                console.log("🔍 DEBUG EPI Data (com lookup):", epiData);
                console.log(
                  "🔍 DEBUG Lookup result para",
                  item.tipoEpiId,
                  ":",
                  epiFromLookup,
                );

                return {
                  id: item.id,
                  nomeEquipamento:
                    epiData?.nomeEquipamento ||
                    epiData?.nome ||
                    epiData?.nome_equipamento ||
                    "Nome não disponível",
                  numeroCA:
                    epiData?.numeroCa ||
                    epiData?.numeroCA ||
                    epiData?.numero_ca ||
                    epiData?.ca ||
                    "N/A",
                  categoria:
                    epiData?.categoriaEpi ||
                    epiData?.categoria ||
                    epiData?.category ||
                    "Não informado",
                  quantidade: item.quantidade || item.quantidadeEntregue || 1,
                  status: item.status, // 🔧 FIX: Preservar status do item (incluindo "DEVOLVIDO")
                };
              }) || [],
          };
        });
        }
      }

      // 🚀 CARREGAR DEVOLUÇÕES: Usar apenas endpoint oficial
      console.log("🔄 Carregando devoluções via endpoint oficial...");

      if (colaboradorId) {
        console.log("🔄 Buscando devoluções para colaborador:", colaboradorId);

        try {
          const devolucoes =
            await this.getDevolucoesByColaborador(colaboradorId);

          const devolucoesFormatadas = devolucoes.map((devolucao) => ({
            id: devolucao.entregaId || devolucao.id || `dev-${Date.now()}`,
            nomeEquipamento:
              devolucao.tipoEpiNome ||
              devolucao.nomeEquipamento ||
              "Nome não disponível",
            numeroCA: devolucao.tipoEpiCodigo || devolucao.numeroCA || "N/A",
            categoria:
              devolucao.tipoEpiCategoria ||
              devolucao.categoria ||
              "Não informado",
            quantidade: 1,
            dataDevolucao: devolucao.dataDevolucao || "Data não disponível",
            motivo:
              devolucao.motivoDevolucao ||
              devolucao.motivo ||
              "Motivo não informado",
            motivoDisplay:
              devolucao.motivoDevolucao ||
              devolucao.motivo ||
              "Motivo não informado",
            condicaoItem: devolucao.condicaoItem || "BOM",
            observacoes: devolucao.observacoes || "",
            status: "processada",
            podeProcessar: false,
            podeCancelar: false,
            entregaId: devolucao.entregaId,
            numeroSerie: devolucao.numeroSerie,
            dataEntrega: devolucao.dataEntrega,
            tempoUso: devolucao.diasUso || devolucao.tempoUso || 0,
            responsavel:
              devolucao.responsavelNome ||
              devolucao.responsavel ||
              "Não informado",
          }));

          fichaBase.data.devolucoes = devolucoesFormatadas;
          console.log(
            "✅ Devoluções carregadas via endpoint oficial:",
            devolucoesFormatadas.length,
          );
          if (devolucoesFormatadas.length > 0) {
            console.log(
              "🔍 Primeira devolução formatada:",
              devolucoesFormatadas[0],
            );
          }
        } catch (error) {
          console.error("❌ Erro ao carregar devoluções via endpoint:", error);
          // Deixar array vazio se não conseguir carregar
          fichaBase.data.devolucoes = [];
        }

        // 🔍 DEBUG: Verificar se há itens devolvidos nas entregas para debug
        let itensDevolvidos = 0;
        console.log("🔍 DEBUG: Verificando itens devolvidos nas entregas...");
        console.log(
          "🔍 DEBUG: Total de entregas:",
          fichaBase.data.entregas?.length || 0,
        );

        fichaBase.data.entregas?.forEach((entrega, entregaIndex) => {
          console.log(
            `🔍 DEBUG: Entrega ${entregaIndex} (${entrega.id}) tem ${entrega.itens?.length || 0} itens`,
          );
          entrega.itens?.forEach((item, itemIndex) => {
            console.log(
              `🔍 DEBUG: Item ${itemIndex} - status: "${item.status}"`,
            );
            if (item.status === "DEVOLVIDO") {
              itensDevolvidos++;
              console.log(
                `✅ DEBUG: Item devolvido encontrado! Total: ${itensDevolvidos}`,
              );
            }
          });
        });

        console.log(
          `📋 DEBUG: Total de itens com status DEVOLVIDO: ${itensDevolvidos}`,
        );

        if (itensDevolvidos > 0) {
          console.log(
            "💡 PROBLEMA IDENTIFICADO: O endpoint /api/teste-devolucoes/historico-global retorna array vazio, mas existem devoluções nos dados das entregas",
          );
          console.log(
            "💡 SOLUÇÃO: Extrair devoluções dos dados das entregas até o endpoint ser corrigido",
          );

          // 🔧 SOLUÇÃO TEMPORÁRIA: Extrair devoluções dos itens das entregas com status "DEVOLVIDO"
          const devolucoesExtraidas = [];
          fichaBase.data.entregas?.forEach((entrega) => {
            entrega.itens?.forEach((item) => {
              if (item.status === "DEVOLVIDO") {
                devolucoesExtraidas.push({
                  id: `dev-${item.id}-${Date.now()}`,
                  nomeEquipamento: item.nomeEquipamento,
                  numeroCA: item.numeroCA,
                  categoria: item.categoria,
                  quantidade: item.quantidade || 1,
                  dataDevolucao: entrega.dataEntrega, // Usar data da entrega como aproximação
                  motivo: "Motivo não especificado",
                  motivoDisplay: "Motivo não especificado",
                  condicaoItem: "BOM",
                  observacoes: `Item devolvido da entrega ${entrega.numero}`,
                  status: "processada",
                  podeProcessar: false,
                  podeCancelar: false,
                  entregaId: entrega.id,
                  numeroSerie: `SER-${item.id}`,
                  dataEntrega: entrega.dataEntrega,
                  tempoUso: 0, // Calcular depois se necessário
                  responsavel: "Sistema",
                });
              }
            });
          });

          if (devolucoesExtraidas.length > 0) {
            // Supplementar ou substituir as devoluções vazias do endpoint
            if (fichaBase.data.devolucoes.length === 0) {
              fichaBase.data.devolucoes = devolucoesExtraidas;
              console.log(
                `✅ SOLUÇÃO APLICADA: ${devolucoesExtraidas.length} devoluções extraídas dos dados das entregas`,
              );
            }
          }
        } else {
          console.log(
            "ℹ️ Nenhum item com status DEVOLVIDO encontrado nas entregas",
          );
        }
      } else {
        console.warn(
          "⚠️ Colaborador ID não encontrado, não é possível carregar devoluções",
        );
        fichaBase.data.devolucoes = [];
      }

      console.log(
        "📊 Dados finais - Entregas:",
        fichaBase.data.entregas?.length || 0,
      );
      console.log(
        "📊 Dados finais - Devoluções:",
        fichaBase.data.devolucoes?.length || 0,
      );
      return fichaBase;
    } catch (error) {
      console.error("❌ Erro ao buscar dados da ficha:", error);
      throw error;
    }
  }

  /**
   * Buscar equipamentos atualmente em posse do colaborador
   * Fallback caso o endpoint /complete não esteja disponível
   */
  async getEquipamentosEmPosse(colaboradorId: string): Promise<any[]> {
    console.log(
      "📦 FichaQueryAdapter: Buscando equipamentos em posse:",
      colaboradorId,
    );

    try {
      const response = await api.get(
        `/fichas-epi/colaborador/${colaboradorId}/posse-atual`,
      );
      console.log("✅ Equipamentos em posse carregados");
      return response;
    } catch (error) {
      console.error("❌ Erro ao buscar equipamentos em posse:", error);
      throw error; // SEM FALLBACK - erro deve ser visível
    }
  }

  /**
   * ✅ CORRIGIDO: Listar fichas usando API documentada oficial
   * Usa endpoint /api/fichas-epi conforme documentação API v3.5
   */
  async getFichasList(
    params: FichaListParams,
  ): Promise<PaginatedResponse<FichaListItem>> {
    console.log("📋 FichaQueryAdapter: Listando fichas com API documentada:", params);

    try {
      // ✅ USAR ENDPOINT OFICIAL: /api/fichas-epi (conforme documentação)
      const queryParams = new URLSearchParams();
      
      // Parâmetros de paginação
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      
      // ✅ BUSCA UNIFICADA: Usar parâmetro 'search' do endpoint enhanced
      if (params.search && params.search.trim()) {
        queryParams.set('search', params.search.trim());
        console.log("🔍 Aplicando busca unificada:", params.search.trim());
      }
      
      // ✅ FILTROS CONFORME API DOCUMENTADA (apenas parâmetros oficiais)
      if (params.status && params.status !== 'todos') {
        queryParams.set('status', params.status.toUpperCase()); // API usa ATIVA, INATIVA
        console.log("🔧 Filtro status aplicado:", params.status.toUpperCase());
      }
      
      // ✅ FILTROS EMPRESA E CARGO: Usar parâmetros corretos conforme backend corrigido
      if (params.empresa && params.empresa !== 'todas') {
        // Usar parâmetro empresa para busca por nome (flexível)
        queryParams.set('empresa', params.empresa);
        console.log("🔧 Filtro empresa aplicado (por nome):", params.empresa);
      }
      
      if (params.cargo && params.cargo !== 'todos') {
        queryParams.set('cargo', params.cargo);
        console.log("🔧 Filtro cargo aplicado:", params.cargo);
      }
      
      // ✅ BACKEND CORRIGIDO: empresaId agora funciona corretamente
      if (params.empresaFilter && params.empresaFilter !== 'todas') {
        // Usar empresaId (UUID) - mais eficiente e agora funciona corretamente
        queryParams.set('empresaId', params.empresaFilter);
        console.log("🔧 Filtro empresa aplicado (empresaId):", params.empresaFilter);
      }
      
      // ✅ DEVOLUÇÃO PENDENTE: Conforme documentação
      if (params.vencimentoProximo || params.devolucaoPendente) {
        queryParams.set('devolucaoPendente', 'true');
        console.log("🔧 Filtro devolução pendente aplicado");
      }
      
      // ✅ COMPATIBILIDADE com aliases legados
      if (params.searchTerm && params.searchTerm.trim()) {
        queryParams.set('search', params.searchTerm.trim());
        console.log("🔧 Busca unificada (alias) aplicada:", params.searchTerm.trim());
      }

      // ✅ USAR ENDPOINT ENHANCED CONFORME DOCUMENTAÇÃO (Linha 1886)
      const endpoint = `/fichas-epi/list-enhanced${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log("🌐 Endpoint enhanced documentado:", endpoint);
      console.log("🔧 Parâmetros enviados:", Object.fromEntries(queryParams.entries()));
      console.log("🔍 Debug filtros originais:", {
        search: params.search,
        empresa: params.empresa,
        cargo: params.cargo,
        empresaFilter: params.empresaFilter
      });

      const response = await api.get<{
        success: boolean;
        data: any[]; // Estrutura da API documentada
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }>(endpoint);

      console.log("📥 Resposta bruta do backend:", {
        success: response.success,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        hasPagination: !!response.pagination,
        endpointUsado: endpoint
      });
      
      // ✅ DEBUG ESPECÍFICO: Verificar se filtro por empresa funciona
      if (params.empresa && params.empresa !== 'todas' && Array.isArray(response.data)) {
        console.log("🔍 DEBUG FILTRO EMPRESA:", {
          empresaFiltrada: params.empresa,
          totalItensRetornados: response.data.length,
          primeirosItens: response.data.slice(0, 2).map(item => ({
            id: item.id,
            colaboradorNome: item.colaborador?.nome,
            contratadaId: item.contratada?.id,
            contratadaNome: item.contratada?.nome
          }))
        });
      }

      // Processar resposta do endpoint atualizado
      let items: FichaListItem[] = [];
      let pagination = {
        page: params.page || 1,
        limit: params.limit || 10,
        total: 0,
        totalPages: 1
      };

      if (response.success) {
        let rawItems: any[] = [];
        
        if (Array.isArray(response.data)) {
          // Dados diretos no array
          rawItems = response.data;
          pagination.total = rawItems.length;
          pagination.totalPages = Math.ceil(pagination.total / pagination.limit);
        } else if (response.data && typeof response.data === 'object') {
          // Verificar se é formato paginado
          if ('items' in response.data) {
            rawItems = response.data.items || [];
            if ('pagination' in response.data) {
              pagination = { ...pagination, ...response.data.pagination };
            }
          } else {
            console.warn("⚠️ Formato de resposta inesperado:", response.data);
            rawItems = [];
          }
        }

        // Se temos pagination na resposta, usar ela
        if (response.pagination) {
          pagination = { ...pagination, ...response.pagination };
        }

        // ✅ TRANSFORMAÇÃO DE DADOS: Mapear estrutura API → Frontend
        // 🔍 DEBUG: Verificar estrutura do primeiro item
        if (rawItems.length > 0) {
          console.log("🔍 DEBUG Estrutura completa do primeiro item:", JSON.stringify(rawItems[0], null, 2));
        }
        
        items = rawItems.map((item: any) => {
          console.log("🔧 Transformando item da API:", {
            id: item.id,
            colaboradorNome: item.colaborador?.nome,
            colaboradorCPF: item.colaborador?.cpf,
            colaboradorCPFFormatado: item.colaborador?.cpfFormatado,
            contratadaNome: item.contratada?.nome,
            colaboradorEmpresa: item.colaborador?.empresa,
            colaboradorCargo: item.colaborador?.cargo
          });

          return {
            id: item.id,
            colaborador: {
              nome: item.colaborador?.nome || 'Nome não informado',
              // ✅ BACKEND ATUALIZADO: Campo CPF adicionado (preparado para quando estiver disponível)
              cpf: item.colaborador?.cpf || item.colaborador?.cpfFormatado || 'CPF não disponível',
              matricula: item.colaborador?.matricula || '',
              cargo: item.colaborador?.cargo || '',
              // ✅ CORREÇÃO CRÍTICA: Mapear contratada.nome → colaborador.empresa
              empresa: item.contratada?.nome || item.colaborador?.empresa || 'Empresa não informada'
            },
            contratada: item.contratada ? {
              id: item.contratada.id,
              nome: item.contratada.nome
            } : undefined,
            status: (item.status || 'ativa').toLowerCase() as "ativa" | "inativa" | "vencida" | "pendente_devolucao",
            // Manter compatibilidade com ambos os formatos
            totalEpisAtivos: item.totalEpisAtivos || item.episInfo?.totalEpisComColaborador || 0,
            totalEpisVencidos: item.totalEpisVencidos || item.episInfo?.episExpirados || 0,
            episInfo: item.episInfo,
            proximoVencimento: item.proximoVencimento,
            ultimaAtualizacao: item.ultimaAtualizacao,
            devolucaoPendente: item.devolucaoPendente || false
          } as FichaListItem;
        });

        console.log("✅ Dados transformados para frontend:", {
          originalCount: rawItems.length,
          transformedCount: items.length,
          firstItemStructure: items[0] ? {
            colaboradorNome: items[0].colaborador.nome,
            colaboradorEmpresa: items[0].colaborador.empresa,
            colaboradorCargo: items[0].colaborador.cargo,
            hasContratada: !!items[0].contratada
          } : null
        });
      }

      console.log("✅ Lista de fichas processada:", {
        totalItens: items.length,
        paginaAtual: pagination.page,
        totalPaginas: pagination.totalPages,
        totalRegistros: pagination.total
      });

      return {
        items,
        pagination
      };
    } catch (error) {
      console.error("❌ Erro ao listar fichas:", error);
      throw error;
    }
  }

  /**
   * Busca simples de ficha (fallback para compatibilidade)
   */
  async getFichaById(fichaId: string): Promise<any> {
    console.log("📋 FichaQueryAdapter: Busca simples da ficha:", fichaId);

    try {
      const response = await api.get(`/fichas-epi/${fichaId}`);
      console.log("✅ Ficha simples carregada (fallback)");
      return response;
    } catch (error) {
      console.error("❌ Erro ao buscar ficha simples:", error);
      throw error;
    }
  }

  /**
   * Buscar EPIs disponíveis para entregas usando endpoint correto
   */
  async getEPIsDisponiveis(): Promise<any[]> {
    console.log(
      "📦 FichaQueryAdapter: Buscando EPIs disponíveis via /estoque/itens...",
    );

    try {
      // Usar endpoint correto: /estoque/itens (que tem os IDs reais dos itens)
      const response = await api.get("/estoque/itens");
      console.log("✅ EPIs obtidos via /estoque/itens:", response);

      console.log("✅ EPIs disponíveis - resposta raw:", response);
      console.log(
        "🔍 Estrutura completa da resposta:",
        JSON.stringify(response, null, 2),
      );

      let episData = [];

      // Processar resposta do endpoint /estoque/itens ou /estoque/posicao ou /tipos-epi
      if (response && Array.isArray(response)) {
        episData = response;
      } else if (response && response.data) {
        if (Array.isArray(response.data)) {
          episData = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          // Formato paginado: { data: { items: [...] } } - usado por /estoque/itens
          episData = response.data.items;
        } else if (
          response.data.posicoes &&
          Array.isArray(response.data.posicoes)
        ) {
          // Formato específico do endpoint /estoque/posicao
          episData = response.data.posicoes;
        } else if (response.data.itens && Array.isArray(response.data.itens)) {
          // Formato atual do backend: { data: { itens: [...] } }
          episData = response.data.itens;
        } else if (typeof response.data === "object") {
          // Tentar extrair arrays de qualquer propriedade do objeto
          const dataValues = Object.values(response.data);
          const arrayValue = dataValues.find((value) => Array.isArray(value));
          if (arrayValue) {
            episData = arrayValue;
          } else {
            console.warn(
              "⚠️ Não foi possível encontrar array nos dados:",
              response.data,
            );
            episData = [];
          }
        }
      } else if (response && response.items && Array.isArray(response.items)) {
        episData = response.items;
      } else {
        console.warn("⚠️ Formato de EPIs inesperado:", response);
        console.log("🔍 Estrutura da resposta:", Object.keys(response || {}));
        episData = [];
      }

      // Normalizar dados para interface EPIDisponivel
      const normalizedEpis = episData
        .map((item) => {
          console.log("🔍 Item original:", item);

          // Se é item de estoque direto, extrair dados do tipoEpi
          const epi = item.tipoEpi || item;

          // Mapear campos do backend para estrutura esperada
          // /estoque/itens usa item.quantidade, /estoque/posicao usa item.saldoDisponivel
          const quantidadeDisponivel =
            item.quantidade ||
            item.saldoDisponivel ||
            item.quantidadeAtual ||
            epi.quantidadeDisponivel ||
            epi.quantidade_disponivel ||
            0;

          // Verificar se temos dados válidos
          // Para /estoque/itens: item.id é o ID real do item, item.tipoEpi.id é o tipo
          // Para /estoque/posicao: item.tipoEpiId, item.tipoEpiNome, etc.
          const id = item.id || item.tipoEpiId || epi.id; // ID real do item de estoque
          const tipoEpiId = item.tipoEpiId || epi.id || item.id; // ID do tipo EPI
          const nomeEquipamento =
            item.tipoEpiNome ||
            epi.nomeEquipamento ||
            epi.nome_equipamento ||
            epi.nome ||
            epi.equipment_name;
          const numeroCA =
            item.tipoEpiCodigo ||
            epi.numeroCa ||
            epi.numeroCA ||
            epi.numero_ca ||
            epi.registroCA ||
            epi.registro_ca ||
            epi.ca_number ||
            epi.ca;

          // Skip items without essential data
          if (!id || !nomeEquipamento) {
            console.warn(
              "⚠️ Item ignorado por falta de dados essenciais:",
              item,
            );
            return null;
          }

          const result = {
            id: id, // ID real do item de estoque
            // Para criação de entregas, usar o ID real do item de estoque
            estoqueItemId: id, // ID real do item de estoque para API
            episDisponivelId: id, // Para compatibilidade - usar ID real
            tipoEpiId: tipoEpiId, // ID do tipo EPI
            // Adicionar também o almoxarifadoId para identificação completa
            posicaoEstoqueId: id, // ID único do item
            nomeEquipamento: nomeEquipamento,
            numeroCA: numeroCA || "N/A",
            registroCA: numeroCA || "N/A",
            categoria:
              epi.categoria || epi.category || epi.tipo || "Não informado",
            quantidadeDisponivel: quantidadeDisponivel,
            disponivel: quantidadeDisponivel > 0,
            // Campos adicionais úteis - /estoque/itens tem almoxarifado nested
            almoxarifado:
              item.almoxarifadoNome || item.almoxarifado?.nome || "Central",
            almoxarifadoId: item.almoxarifadoId || item.almoxarifado?.id,
            // Campos específicos do backend
            situacao: item.situacao,
            saldoTotal: item.saldoTotal,
            saldoReservado: item.saldoReservado,
          };

          console.log("🎯 EPI processado:", {
            id: result.id,
            estoqueItemId: result.estoqueItemId,
            episDisponivelId: result.episDisponivelId,
            tipoEpiId: result.tipoEpiId,
            nome: result.nomeEquipamento,
            quantidade: result.quantidadeDisponivel,
            disponivel: result.disponivel,
            isValidId: result.id?.match(/^[A-Z0-9]{6}$/) || result.id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
            rawItem: item
          });

          return result;
        })
        .filter(Boolean) // Remove null items
        .filter((epi) => epi.disponivel && epi.quantidadeDisponivel > 0); // Só EPIs com estoque

      console.log("✅ EPIs normalizados:", normalizedEpis.length);
      console.log("📦 Amostra de EPIs:", normalizedEpis.slice(0, 2));

      return normalizedEpis;
    } catch (error) {
      console.error("❌ Erro ao buscar EPIs disponíveis:", error);
      throw error; // SEM FALLBACK - erro deve ser visível
    }
  }

  /**
   * Buscar usuários disponíveis (método transitório)
   */
  async getUsuarios(): Promise<
    Array<{ id: string; nome: string; email: string }>
  > {
    console.log("👥 FichaQueryAdapter: Buscando usuários...");

    try {
      const response = await api.get("/usuarios");
      console.log("✅ Usuários carregados");

      // Verificar se vem em formato { data: [...] }, { items: [...] } ou array direto
      if (response && Array.isArray(response)) {
        return response;
      } else if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response && response.items && Array.isArray(response.items)) {
        console.log("📊 Usuários vêm em formato paginado, extraindo items");
        return response.items;
      } else {
        console.error("❌ Formato de usuários inesperado:", response);
        throw new Error("Formato de resposta de usuários inválido");
      }
    } catch (error) {
      console.error("❌ Erro ao buscar usuários:", error);
      throw error; // SEM FALLBACK - erro deve ser visível
    }
  }

  /**
   * Buscar devoluções usando o endpoint oficial do histórico
   * SIMPLIFICADO: Usar apenas o endpoint correto
   */
  async buscarDevolucoes(
    fichaId: string,
    colaboradorId?: string,
  ): Promise<any[]> {
    console.log(
      "🔄 FichaQueryAdapter: Buscando devoluções via endpoint oficial",
    );

    try {
      // Usar apenas o endpoint oficial do histórico de devoluções
      if (
        colaboradorId &&
        colaboradorId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        )
      ) {
        const devolucoes = await this.getDevolucoesByColaborador(colaboradorId);
        console.log(
          "✅ Devoluções encontradas via endpoint oficial:",
          devolucoes.length,
        );
        return devolucoes;
      } else {
        console.log("⚠️ Colaborador ID inválido para UUID:", colaboradorId);
        return [];
      }
    } catch (error) {
      console.error(
        "❌ Erro ao buscar devoluções via endpoint oficial:",
        error,
      );
      return [];
    }
  }

  /**
   * Buscar histórico de devoluções específico de um colaborador
   * Endpoint: GET /api/teste-devolucoes/historico-global?colaboradorId=X
   *
   * Usando o novo formato da documentação atualizada
   */
  async getDevolucoesByColaborador(colaboradorId: string): Promise<any[]> {
    console.log(
      "🔄 FichaQueryAdapter: Buscando devoluções do colaborador:",
      colaboradorId,
    );

    // Validar se colaboradorId é um UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(colaboradorId)) {
      console.warn("⚠️ Colaborador ID não é um UUID válido:", colaboradorId);
      return [];
    }

    try {
      const response = await api.get("/teste-devolucoes/historico-global", {
        params: {
          colaboradorId: colaboradorId,
          limit: 100,
        },
      });

      console.log("✅ Response do endpoint de devoluções:", response);

      // Processar resposta - aceitar diferentes formatos
      let devolucoes = [];

      if (response && response.success && response.data) {
        if (
          response.data.devolucoes &&
          Array.isArray(response.data.devolucoes)
        ) {
          // Formato esperado: { data: { devolucoes: [...] } }
          devolucoes = response.data.devolucoes;
          console.log(
            "📋 Devoluções encontradas (formato padrão):",
            devolucoes.length,
          );
        } else if (Array.isArray(response.data)) {
          // Formato atual do endpoint: { data: [...] }
          devolucoes = response.data;
          console.log(
            "📋 Devoluções encontradas (formato direto):",
            devolucoes.length,
          );
        } else {
          console.warn(
            "⚠️ Resposta não contém devoluções no formato esperado:",
            {
              hasSuccess: !!response?.success,
              hasData: !!response?.data,
              hasDevolucoes: !!response?.data?.devolucoes,
              isDataArray: Array.isArray(response?.data),
              responseStructure: Object.keys(response || {}),
              dataStructure: Object.keys(response?.data || {}),
            },
          );
        }

        if (devolucoes.length > 0) {
          console.log("📋 Estrutura da primeira devolução:", devolucoes[0]);
        }

        if (response.data.estatisticas) {
          console.log("📊 Estatísticas:", response.data.estatisticas);
        }
      } else {
        console.warn("⚠️ Resposta inválida do endpoint:", {
          hasResponse: !!response,
          hasSuccess: !!response?.success,
          hasData: !!response?.data,
        });
      }

      return devolucoes;
    } catch (error) {
      console.error("❌ Erro ao buscar devoluções:", error);

      if (error.response) {
        console.error("❌ Status HTTP:", error.response.status);
        console.error("❌ Dados da resposta:", error.response.data);

        // Se for erro 400 de validação, retornar array vazio ao invés de throw
        if (error.response.status === 400) {
          console.warn("⚠️ Erro de validação 400 - retornando array vazio");
          return [];
        }
      }

      // Para outros erros, re-throw
      throw error;
    }
  }

  /**
   * Método transitório para compatibilidade com FichasContainer
   * 🆕 ATUALIZADO: Suporte à busca unificada (CPF, nome, matrícula)
   */
  async getFichasWithColaboradores(params: any): Promise<any> {
    console.log(
      "📋 FichaQueryAdapter: Método transitório com busca unificada - getFichasWithColaboradores",
      params
    );

    // Converter parâmetros do formato antigo para o novo com suporte à busca unificada
    const newParams: FichaListParams = {
      page: params.page,
      limit: params.limit,
      // 🆕 BUSCA UNIFICADA: Usar searchTerm ou search
      search: params.searchTerm || params.search,
      empresa: params.empresaFilter || params.empresa,
      cargo: params.cargoFilter || params.cargo,
      status: params.statusFilter || params.status,
      vencimentoProximo: params.devolucaoPendente || params.vencimentoProximo,
    };

    console.log("🔍 Parâmetros convertidos para busca unificada:", {
      search: newParams.search,
      empresa: newParams.empresa,
      cargo: newParams.cargo,
      status: newParams.status,
      page: newParams.page,
      limit: newParams.limit
    });

    try {
      const response = await this.getFichasList(newParams);

      // Converter resposta para formato antigo esperado pelo FichasContainer
      const result = {
        fichas: response.items,
        total: response.pagination.total,
        page: response.pagination.page,
        pageSize: response.pagination.limit,
        totalPages: response.pagination.totalPages
      };

      console.log("✅ Resposta convertida para formato antigo:", {
        totalFichas: result.fichas.length,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      });

      return result;
    } catch (error) {
      console.error("❌ Erro no método transitório:", error);
      throw error;
    }
  }

}

// ==================== EXPORT ====================

export const fichaQueryAdapter = new FichaQueryAdapter();
